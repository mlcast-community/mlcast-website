#!/usr/bin/env python3
"""Compute dataset-catalog impact stats at build time and write static JSON.

Reads the public precipitation catalog and, for every source, opens ONLY the
Zarr metadata (consolidated `.zmetadata`, unconsolidated `.zarray`, or Zarr v3
`zarr.json`) — never the array data. From that metadata plus the catalog source
name it derives the four "Dataset Impact Spotlight" numbers shown on data.html:

  * countries          — distinct countries inferred from source names
  * cumulative_years    — sum of each dataset's date range (end - start), in years
  * time_steps          — total length of every dataset's `time` dimension
  * best_cadence_minutes — finest temporal resolution across datasets

A dataset's date range is derived from metadata alone: the start comes from the
`time` variable's `units` attribute (e.g. "minutes since 2016-02-29"), and the
span is `steps x cadence` — which equals end-start for these regular time axes.
Cadence is read from the catalog source name (e.g. `*_5_minutes`, `*_hourly`),
so no coordinate array data is downloaded (reading exact end timestamps would
mean pulling whole time arrays — 16 MB for one source). A dataset that cannot be
read is skipped; the file is only written when at least one dataset resolves, so
the site keeps its hard-coded fallback on total failure.

Usage: fetch-catalog-stats.py [CATALOG_URL] [OUT_JSON]
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

import fsspec
import yaml

CATALOG_URL = (
    "https://raw.githubusercontent.com/mlcast-community/mlcast-datasets/main/"
    "src/mlcast_datasets/catalog/precipitation/catalog.yml"
)
YEAR_MINUTES = 60 * 24 * 365.25


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
        return "DK"
    if "metoffice" in n or "uk" in n:
        return "GB"
    if "dpc" in n or n.startswith("it"):
        return "IT"
    if "rmi" in n or "mfb" in n or ("be" in n and "radclim" in n):
        return "BE"
    if "radklim" in n:
        return "DE"
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


def main():
    catalog_url = sys.argv[1] if len(sys.argv) > 1 else CATALOG_URL
    out_path = sys.argv[2] if len(sys.argv) > 2 else "dist/catalog-stats.json"

    try:
        raw = urllib.request.urlopen(catalog_url, timeout=30).read()
        sources = yaml.safe_load(raw).get("sources", {})
    except Exception as exc:  # noqa: BLE001 — build step, keep site fallback
        print(f"catalog fetch/parse failed: {exc}", file=sys.stderr)
        return  # exit 0 without writing -> site keeps hard-coded numbers

    total_steps = 0
    total_years = 0.0
    countries = set()
    cadences = []
    resolved = 0

    for name, src in sources.items():
        try:
            args = src["args"]
            opts = args.get("storage_options", {})
            fs = fsspec.filesystem(
                "s3",
                anon=opts.get("anon", True),
                client_kwargs={"endpoint_url": opts.get("endpoint_url")},
            )
            steps = time_steps(fs, args["urlpath"].replace("s3://", ""))
        except Exception as exc:  # noqa: BLE001 — partial failure is tolerated
            print(f"skip {name}: {exc}", file=sys.stderr)
            continue

        cad = cadence_minutes(name)
        total_steps += steps
        if cad:
            total_years += steps * cad / YEAR_MINUTES
            cadences.append(cad)
        tag = country(name)
        if tag:
            countries.add(tag)
        resolved += 1
        print(f"ok {name}: steps={steps} cadence={cad}", file=sys.stderr)

    if not resolved or not cadences:
        print("no datasets resolved; not writing", file=sys.stderr)
        return

    stats = {
        "countries": len(countries),
        "cumulative_years": round(total_years),
        "time_steps": total_steps,
        "best_cadence_minutes": int(min(cadences)),
        "datasets": resolved,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=2)
        fh.write("\n")
    print(f"wrote {out_path}: {stats}", file=sys.stderr)


if __name__ == "__main__":
    main()
