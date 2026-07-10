#!/usr/bin/env python3
"""Build the catalog-driven site data at deploy time and write static JSON.

This is the single source of truth for everything the site derives from the
public precipitation catalog:

  * the dataset list rendered on data.html (name, description, driver, path…),
  * the country inference / flag for each dataset,
  * the coverage-map markers (data.html has none, but home.html and
    contributing.html draw flag markers whose position is computed here),
  * the four "Dataset Impact Spotlight" counters on data.html plus the
    Countries / Years / Cadence overlays on the two coverage maps.

Two data sources are combined:

  1. `catalog.yml` (parsed in full with PyYAML) -> the dataset list and, from
     each source name, an inferred country/flag and temporal cadence.
  2. For every source, ONLY the Zarr metadata (consolidated `.zmetadata`,
     unconsolidated `.zarray`, or Zarr v3 `zarr.json`) is opened — never the
     bulk array data — to read the `time` dimension length. Steps x cadence
     gives each dataset's span in years (equals end-start for these regular
     time axes; reading exact end timestamps would download whole time arrays —
     16 MB for one source — so it is avoided). The horizontal grid resolution
     is read the same way: only the small 1-D `x`/`y` coordinate arrays are
     touched and the step between their first two samples (normalised to metres
     via the coordinate `units`) is the pixel size. Works for Zarr v2 and v3.

Marker positions are read straight from the geometry of `img/world.svg` (a
high-resolution equirectangular Natural Earth map whose `<path id>` is each
country's ISO 3166-1 alpha-2 code): the bounding-box centre of a country's
path, expressed as a percent of the viewBox (origin included), is exactly the
`left`/`top` percent the maps use. The same covered set is stamped back into the
map's teal highlight rule (restyle_covered). A new covered country therefore
both places its marker and highlights itself automatically -- no HTML or map
edit -- as soon as its ISO alpha-2 code appears in the catalog.

Every catalog source is always included in the dataset list; a source whose
Zarr metadata cannot be read simply contributes no steps/years (its list entry
and map marker still appear). If the catalog itself cannot be fetched/parsed the
file is not written at all, so the site keeps its hard-coded fallbacks.

Usage: fetch-catalog-stats.py [CATALOG_URL] [OUT_JSON] [WORLD_SVG]
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

import fsspec
import yaml
import zarr

CATALOG_URL = (
    "https://raw.githubusercontent.com/mlcast-community/mlcast-datasets/main/"
    "src/mlcast_datasets/catalog/precipitation/catalog.yml"
)
# Repo-relative default; the world map lives next to the site HTML.
DEFAULT_WORLD_SVG = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "img", "world.svg"
)
YEAR_MINUTES = 60 * 24 * 365.25
# img/world.svg viewBox — an equirectangular (plate carree) Natural Earth map
# whose `<path id>` is each country's ISO 3166-1 alpha-2 code. Markers are a
# percent of these dimensions (origin included), matching the aspect box the
# maps render the SVG into.
SVG_VIEWBOX_X = -1800.0
SVG_VIEWBOX_Y = -835.6
SVG_VIEWBOX_W = 3600.0
SVG_VIEWBOX_H = 1393.5

# Per-country override for cases where the FlagCDN/ISO alpha-2 code differs from
# the `<path id>` in img/world.svg. Empty because the map already keys every
# country by its ISO alpha-2 code; any covered code positions itself
# automatically. Add an entry only for a genuine id mismatch.
SVG_COUNTRY_ID = {}


def cadence_minutes(name):
    """Temporal resolution in minutes, parsed from the catalog source name."""
    n = name.lower()
    if "hourly" in n:
        return 60.0
    match = re.search(r"(\d+)\s*_?\s*min", n)
    return float(match.group(1)) if match else None


def country(name):
    """ISO-ish country tag inferred from the source name; None if unknown.

    Order matters: the Belgian RADCLIM product must be matched before the
    German RADKLIM one so it is not misfiled under DE.
    """
    n = name.lower()
    if "dmi" in n:
        return "dk"
    if "metoffice" in n or "uk" in n:
        return "gb"
    if "dpc" in n or n.startswith("it"):
        return "it"
    if "rmi" in n or "mfb" in n or ("be" in n and "radclim" in n):
        return "be"
    if "radklim" in n:
        return "de"
    return None


def time_steps(fs, base):
    """Length of the `time` dimension from Zarr metadata only (no data read)."""
    base = base.rstrip("/") + "/"
    try:  # consolidated Zarr v2
        meta = json.loads(fs.cat(base + ".zmetadata"))["metadata"]
        return meta["time/.zarray"]["shape"][0]
    except Exception:
        pass
    try:  # unconsolidated Zarr v2
        return json.loads(fs.cat(base + "time/.zarray"))["shape"][0]
    except Exception:
        pass
    return json.loads(fs.cat(base + "time/zarr.json"))["shape"][0]  # Zarr v3


# Coordinate names probed for the horizontal grid spacing, in priority order.
GRID_COORDS = ("x", "y", "xc", "yc")
# Length-unit -> metres. A missing/blank unit is treated as metres (these
# projected radar grids default to metres); an unknown unit aborts (return
# None) rather than reporting a wrong number.
UNIT_TO_M = {
    "": 1.0, "m": 1.0, "metre": 1.0, "metres": 1.0, "meter": 1.0, "meters": 1.0,
    "km": 1000.0, "kilometre": 1000.0, "kilometres": 1000.0,
    "kilometer": 1000.0, "kilometers": 1000.0,
}


def spatial_resolution_m(store):
    """Grid spacing in metres from a coordinate axis; None if not derivable.

    Opens ONLY the small 1-D x/y coordinate arrays (never the data) and takes
    the step between the first two samples, normalised to metres via the
    coordinate `units` attribute. Works for both Zarr v2 and v3 stores.
    """
    group = zarr.open_group(store, mode="r")
    for name in GRID_COORDS:
        if name not in group:
            continue
        arr = group[name]
        if not arr.shape or arr.shape[0] < 2:
            continue
        step = abs(float(arr[1]) - float(arr[0]))
        if step <= 0:
            continue
        unit = str(arr.attrs.get("units", "") or "").strip().lower()
        factor = UNIT_TO_M.get(unit)
        if factor is None:  # unknown unit -> don't trust the number
            return None
        return step * factor
    return None


def format_resolution(metres):
    """Human label for a metre resolution: '1 km', '500 m'; None if falsy."""
    if not metres:
        return None
    if metres >= 1000:
        return f"{metres / 1000:g} km"
    return f"{round(metres):g} m"


def svg_marker_positions(svg_path, codes):
    """Map each covered ISO code to a {x, y} percent on the world map.

    Reads the bounding-box centre of the country's `<path>` in world.svg. Codes
    without an SVG mapping or a readable path are skipped (the maps then keep
    their static fallback marker for that spot).
    """
    try:
        from svgpathtools import svg2paths
    except Exception as exc:  # noqa: BLE001 — markers are optional enrichment
        print(f"svgpathtools unavailable, skipping markers: {exc}", file=sys.stderr)
        return {}

    try:
        paths, attrs = svg2paths(svg_path)
    except Exception as exc:  # noqa: BLE001
        print(f"could not read {svg_path}: {exc}", file=sys.stderr)
        return {}

    by_id = {a.get("id"): p for p, a in zip(paths, attrs) if a.get("id")}
    positions = {}
    for code in codes:
        svg_id = SVG_COUNTRY_ID.get(code, code)
        path = by_id.get(svg_id)
        if path is None:
            print(f"no SVG path for {code} (id={svg_id})", file=sys.stderr)
            continue
        try:
            xmin, xmax, ymin, ymax = path.bbox()
        except Exception as exc:  # noqa: BLE001
            print(f"bbox failed for {code}: {exc}", file=sys.stderr)
            continue
        cx = (xmin + xmax) / 2
        cy = (ymin + ymax) / 2
        positions[code] = {
            "x": round((cx - SVG_VIEWBOX_X) / SVG_VIEWBOX_W * 100, 2),
            "y": round((cy - SVG_VIEWBOX_Y) / SVG_VIEWBOX_H * 100, 2),
        }
    return positions


# The covered-country fill rule inside world.svg's <style>: a comma list of
# `#<iso2>` selectors immediately before `{fill:#5ffbd6`.
COVERED_RULE_RE = re.compile(r"#[a-z]{2}(?:,#[a-z]{2})*(\{fill:#5ffbd6)")


def restyle_covered(svg_path, codes):
    """Rewrite world.svg so exactly the covered countries are highlighted.

    Keeps the map's teal fill in sync with the catalog (no hand-edited country
    list). A country highlights automatically once its ISO alpha-2 code has a
    matching `<path id>` in the map. No-op if the file or rule is missing.
    """
    ids = [c for c in codes if re.fullmatch(r"[a-z]{2}", c)]
    if not ids:
        return
    try:
        with open(svg_path, encoding="utf-8") as fh:
            svg = fh.read()
    except OSError as exc:  # noqa: BLE001 — highlight is optional enrichment
        print(f"could not read {svg_path} to restyle: {exc}", file=sys.stderr)
        return
    selector = ",".join("#" + c for c in ids)
    new_svg, n = COVERED_RULE_RE.subn(selector + r"\1", svg, count=1)
    if not n:
        print(f"no covered-fill rule in {svg_path}; not restyled", file=sys.stderr)
        return
    if new_svg != svg:
        with open(svg_path, "w", encoding="utf-8") as fh:
            fh.write(new_svg)
        print(f"restyled {svg_path}: highlighted {selector}", file=sys.stderr)


def main():
    catalog_url = sys.argv[1] if len(sys.argv) > 1 else CATALOG_URL
    out_path = sys.argv[2] if len(sys.argv) > 2 else "dist/catalog-data.json"
    world_svg = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_WORLD_SVG

    try:
        raw = urllib.request.urlopen(catalog_url, timeout=30).read()
        sources = yaml.safe_load(raw).get("sources", {})
    except Exception as exc:  # noqa: BLE001 — build step, keep site fallback
        print(f"catalog fetch/parse failed: {exc}", file=sys.stderr)
        return  # exit 0 without writing -> site keeps hard-coded numbers

    if not sources:
        print("catalog has no sources; not writing", file=sys.stderr)
        return

    datasets = []
    total_steps = 0
    total_years = 0.0
    countries = set()
    cadences = []
    resolved = 0

    for name, src in sorted(sources.items()):
        args = src.get("args", {}) or {}
        opts = args.get("storage_options", {}) or {}
        urlpath = args.get("urlpath")
        cad = cadence_minutes(name)
        code = country(name)
        if code:
            countries.add(code)

        entry = {
            "sourceName": name,
            "description": src.get("description") or "",
            "driver": src.get("driver"),
            "urlpath": urlpath,
            "endpointUrl": opts.get("endpoint_url"),
            "consolidated": bool(args.get("consolidated"))
            if "consolidated" in args
            else None,
            "flag": code,
            "cadence_minutes": int(cad) if cad else None,
            "resolution_m": None,
            "resolution": None,
            "steps": None,
            "years": None,
            "resolved": False,
        }

        steps = None
        if urlpath:
            zbase = urlpath.replace("s3://", "")
            try:
                fs = fsspec.filesystem(
                    "s3",
                    anon=opts.get("anon", True),
                    client_kwargs={"endpoint_url": opts.get("endpoint_url")},
                )
                steps = time_steps(fs, zbase)
            except Exception as exc:  # noqa: BLE001 — partial failure tolerated
                print(f"skip zarr {name}: {exc}", file=sys.stderr)

            try:  # resolution is optional enrichment; never fail the entry
                store = fsspec.get_mapper(
                    urlpath,
                    anon=opts.get("anon", True),
                    client_kwargs={"endpoint_url": opts.get("endpoint_url")},
                )
                res_m = spatial_resolution_m(store)
                if res_m:
                    entry["resolution_m"] = round(res_m, 2)
                    entry["resolution"] = format_resolution(res_m)
                    print(f"res {name}: {entry['resolution']}", file=sys.stderr)
            except Exception as exc:  # noqa: BLE001 — partial failure tolerated
                print(f"skip resolution {name}: {exc}", file=sys.stderr)

        if steps is not None:
            entry["steps"] = steps
            total_steps += steps
            if cad:
                years = steps * cad / YEAR_MINUTES
                entry["years"] = round(years, 1)
                total_years += years
                cadences.append(cad)
            entry["resolved"] = True
            resolved += 1
            print(f"ok {name}: steps={steps} cadence={cad}", file=sys.stderr)

        datasets.append(entry)

    country_codes = sorted(countries)
    restyle_covered(world_svg, country_codes)
    positions = svg_marker_positions(world_svg, country_codes)
    markers = [
        {"country": code, "flag": code, **positions[code]}
        for code in country_codes
        if code in positions
    ]

    data = {
        "countries": len(country_codes),
        "country_codes": country_codes,
        "cumulative_years": round(total_years) if cadences else None,
        "time_steps": total_steps if resolved else None,
        "best_cadence_minutes": int(min(cadences)) if cadences else None,
        "datasets_count": len(datasets),
        "resolved_count": resolved,
        "markers": markers,
        "datasets": datasets,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(
        f"wrote {out_path}: {len(datasets)} datasets, {resolved} resolved, "
        f"{len(markers)} markers",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
