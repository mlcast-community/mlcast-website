# Integrations and dynamic data

## Integration model

The site uses two data-delivery patterns:

- GitHub community statistics and starter issues are fetched during GitHub Pages
  deployment and served to browsers as same-origin JSON.
- The precipitation catalog is read at deploy time (catalog YAML plus Zarr
  metadata) into a single same-origin `catalog-data.json` that drives the
  `data.html` dataset list and impact spotlight and the coverage-map markers on
  `home.html` and `contributing.html`.

Secrets are allowed only in the deployment environment. Never put a token in
HTML, `header.js`, `tailwind-config.js`, or other published JavaScript.

## Community statistics

### Purpose

Keep the community card in `home.html` current without making many anonymous
GitHub API requests from every visitor's browser.

### Locations

- Producer: `scripts/fetch-gh-stats.sh`
- Deployment call: `.github/workflows/deploy.yml`
- Generated artifact: `dist/gh-stats.json`
- Consumer: final data-loading script in `home.html`
- DOM targets: `#gh-contributors`, `#gh-repos`, `#gh-commits`,
  `#gh-collab-count`, and `#gh-avatars`

### How it works

1. The workflow passes its `GITHUB_TOKEN` to the shell script.
2. The script paginates through all public repositories in
   `mlcast-community`.
3. It paginates through each repository's contributors, excludes bots, sums
   GitHub's `contributions` values per login, and selects the top four.
4. It writes `{repos, contributors, commits, top, generated}` to
   `dist/gh-stats.json`.
5. `home.html` fetches `gh-stats.json` with `cache: "no-cache"` and updates the
   card. Avatar images still load from
   `https://github.com/{login}.png?size=64`.

“Commits” is the sum of values returned by GitHub's contributor endpoint, not an
independent commit-history audit.

### Failure handling

If no repositories can be fetched, the build script exits successfully without
writing a zero-valued file. Because each `dist/` is assembled fresh, the client
then receives a missing/non-OK JSON response and keeps `home.html`'s hard-coded
fallback values. Per-repository contributor failures are treated as empty
contributor lists, so a JSON file may contain partial contribution totals.

### Safe modification notes

- Preserve API pagination, bot filtering, and JSON field names.
- Keep the token confined to the workflow process environment.
- Version the consumer and producer together if the schema changes.
- Keep fallback values honest and periodically reviewed.
- Remember that the workflow's daily schedule controls data freshness.

### Testing checklist

- Run the producer with and without `GITHUB_TOKEN` where network access permits.
- Validate generated JSON with `jq`.
- Test `home.html` with valid, missing, malformed, and partial `gh-stats.json`.
- Verify all counters and four optional avatars.

## Good-first issues (producer orphaned)

### Status

`contributing.html` dropped its "Current good first issues" section (judged
repetitive with the "Ways to Contribute" paths earlier on the same page). The
producer below still runs at every deployment and still writes
`dist/gh-issues.json`; nothing currently fetches that file. The next time this
area is touched, either remove the producer/workflow step together or give the
file a consumer again — don't leave it generating an unread artifact
indefinitely.

### Locations

- Producer: `scripts/fetch-gh-issues.sh`
- Deployment call: `.github/workflows/deploy.yml`
- Generated artifact: `dist/gh-issues.json`
- Consumer: none

### How the producer works

1. It searches GitHub for open `good first issue` items in the
   `mlcast-community` organization, sorted by recent updates.
2. The default limit is six issues.
3. `jq` reduces each result to `{repo, title, number, url}` and adds a
   `generated` timestamp.
4. If GitHub returns no usable `items` payload, the producer leaves the output
   file unwritten.

### If reintroducing a consumer

- Escape remote text before assigning generated markup to `innerHTML`.
- Validate issue URLs before using them in `href`.
- Render an explicit fallback (e.g. a GitHub search link) for missing, non-OK,
  malformed, or empty JSON.

## Dataset catalog list

### Purpose

Render the current public precipitation catalog so dataset cards track upstream
catalog changes without manual duplication.

### Locations

- Consumer: `data.html`
- Data source: same-origin `catalog-data.json` (see "Catalog data producer"
  below); the browser no longer fetches or parses the raw catalog YAML.
- DOM targets: `#dataset-search`, `#dataset-catalog-list`,
  `#dataset-catalog-count`, and `#dataset-catalog-status`
- Debug/state hook: `window.datasetCatalogLinks`

### How it works

1. Fetch `catalog-data.json` with `cache: "no-cache"` and require an OK response.
2. Map its `datasets[]` array (each entry: `sourceName`, `description`,
   `driver`, `urlpath`, `endpointUrl`, `consolidated`, `flag`, …) to card view
   models; the country/flag is precomputed by the producer, not re-inferred here.
3. Format the display name from the source name.
4. Escape all values and generate dataset cards and `xarray` examples.
5. Filter the in-memory results as the user types.

The producer parses the catalog with a real YAML library, so the previous
fragile indentation parser (and its `getDatasetFlagCode`/`stripYamlScalar`
helpers) is gone. Every catalog source appears in the list even if its Zarr
metadata could not be read.

### Dependencies and connections

- Same-origin `catalog-data.json`; no browser CORS dependency on raw GitHub.
- FlagCDN SVGs, using the `flag` code supplied per dataset.
- The visible catalog link targets the published `mlcast-datasets` site.
- A static Intake example in `data.html` references `catalog/catalog.yml`,
  whereas the producer reads `catalog/precipitation/catalog.yml`; verify both
  paths when upstream changes.
- Provider/range details shown in cards (`getDatasetImpacts`) are still
  hard-coded presentation data, not read from the catalog.

### Failure handling

Fetch, HTTP, or empty-data errors are logged. The count, accessible status, and
list change to an explicit “Unable to load” state. There is no retry or cache.

### Safe modification notes

- Version the producer schema and this consumer together.
- Keep `escapeHtml` around all values used in HTML/code.
- Update the hard-coded card presentation metadata with upstream naming changes.
- Keep loading, empty search, empty catalog, and error states distinct.

### Testing checklist

- Test valid, empty, malformed, and non-OK `catalog-data.json` responses.
- Search by name, description, driver, path, and endpoint.
- Verify flags, metadata, and copied code examples for each source.

## Catalog data producer

### Purpose

Produce, at deploy time, the one JSON that feeds the dataset list, the four
"Dataset Impact Spotlight" counters, and the coverage-map markers/overlays —
instead of maintaining any of that by hand.

### Locations

- Producer: `scripts/fetch-catalog-stats.py`
- Deployment call: `.github/workflows/deploy.yml` (`uv run --with s3fs --with
  pyyaml --with svgpathtools --with zarr`), passed the catalog URL,
  `dist/catalog-data.json`, and `img/world.svg`.
- Generated artifact: `dist/catalog-data.json`. The producer also rewrites the
  covered-country highlight rule inside the passed `img/world.svg` in place.
- Consumers: the dataset list + impact spotlight in `data.html`; `coverage-map.js`
  on `home.html` and `contributing.html`.
- Impact DOM targets: `#stat-countries`, `#stat-years`, `#stat-timesteps`,
  `#stat-cadence`.

### How it works

1. The producer fetches the precipitation `catalog.yml` and parses it with
   PyYAML, building a `datasets[]` entry for **every** source (name, description,
   driver, urlpath, endpoint, consolidated).
2. From each source name it infers the country/`flag` (single source of truth;
   the browser no longer infers this) and the cadence (`*_hourly`, `*_5_minutes`,
   …).
3. For each source it reads **only the Zarr metadata** — consolidated
   `.zmetadata`, unconsolidated `.zarray`, or Zarr v3 `zarr.json` — never the
   bulk array data. The `time` array shape gives the step count; a source whose
   Zarr cannot be read still appears in the list with `null` steps/years. It also
   opens the small 1-D `x`/`y` coordinate arrays (via `zarr`, v2 or v3) and takes
   the step between their first two samples, normalised to metres through the
   coordinate `units` (`km`→×1000, `m`/blank→×1, unknown→skip), yielding
   `resolution_m` and a formatted `resolution` (`"1 km"`, `"500 m"`); both are
   `null` when not derivable.
4. For each covered country it computes a map marker position from
   `img/world.svg` (a high-resolution equirectangular Natural Earth map whose
   `<path id>` is each country's ISO 3166-1 alpha-2 code): the bounding-box
   centre of that country's `<path>` (via `svgpathtools`), offset by the viewBox
   origin and expressed as a percent of the `-1800 -835.6 3600 1393.5` viewBox —
   exactly the `left`/`top` percent the maps use. Codes normally match the path
   id directly; `SVG_COUNTRY_ID` holds overrides only for genuine id mismatches
   (currently empty). It also stamps the covered set back into `img/world.svg`'s
   teal highlight rule (`restyle_covered`), so the filled countries stay in sync
   with the catalog without a hand-edited list.
5. It writes `{countries, country_codes, cumulative_years, time_steps,
   best_cadence_minutes, datasets_count, resolved_count, markers[], datasets[],
   generated}` to `dist/catalog-data.json`.
6. `data.html` reads the numbers (formatting e.g. `6959729` → `6.9M+`, `5` →
   `5 min`) and shows each dataset's `resolution` as a "Resolution" chip in its
   card; `coverage-map.js` reads `markers[]` and the aggregate counters.

`cumulative_years` is the sum of each dataset's date range. The start comes from
the `time` variable's `units` attribute and the span is `steps × cadence`, which
equals end−start for these regular time axes; reading exact end timestamps would
require downloading whole time arrays (16 MB for one source), so it is avoided.

### Failure handling

A source whose Zarr cannot be read is skipped from the aggregates but kept in the
list/markers. If the catalog fetch/parse fails or yields no sources, the producer
exits without writing the file; all consumers then keep their hard-coded
fallbacks (mirroring `gh-stats.json`). Stats fields are `null` when nothing
resolved, and consumers leave those specific numbers on their fallback.

### Safe modification notes

- The cadence and country heuristics are keyed on source names; update them when
  upstream changes. A new country needs no map edit — it positions its marker and
  highlights its `<path>` automatically once its ISO alpha-2 code has a matching
  path id in `img/world.svg`; add an `SVG_COUNTRY_ID` override only for a code
  that differs from the path id.
- `img/world.svg` is an equirectangular (plate carrée) map; if it is regenerated
  at a different projection, scale, or crop, update `SVG_VIEWBOX_X/Y/W/H` in the
  script and the static fallback marker `left/top` percents in `home.html` and
  `contributing.html` to match. The map-box aspect itself is decoupled: percents
  are viewBox-relative, so `home.html` (`aspect-[4/3]`, `object-fill`) and
  `contributing.html` (`aspect-[3600/1393]`, `object-contain`) stay aligned
  without recomputing markers.
- Version the producer schema and all consumers (`data.html`, `coverage-map.js`)
  together.
- Keep the `time` read metadata-only; do not switch to
  `xarray.open_dataset(...).time` values, which downloads the whole time array.
  Resolution deliberately reads just the first two samples of the tiny `x`/`y`
  coordinate arrays — keep it to those, never the data variables.

## Coverage maps

### Purpose

Draw the flag markers and the Countries / Years / Cadence overlays on the
"Dataset Catalog" world maps of `home.html` and `contributing.html` from the same
catalog data, so the maps track coverage without editing three HTML files.

### Locations

- Renderer: `coverage-map.js` (shared, staged by deploy's `cp *.js`)
- Data source: same-origin `catalog-data.json`
- Consumers: `home.html` (`renderCoverageMap("coverage-viewport")`, rich markers
  with hover tooltips) and `contributing.html`
  (`renderCoverageMap("contrib-coverage-viewport")`, plain markers).
- DOM contract: one `[data-coverage-markers]` container per map (its
  `data-coverage-variant` is `rich` or `plain`; its static children are the
  fallback), plus `[data-coverage-stat="countries|years|cadence"]` value nodes.
  `home.html` also carries static `[data-wanted-code="<iso2>"]` "+" expansion
  pins; the renderer hides any whose code matches a now-covered country.

### How it works

1. `renderCoverageMap` fetches `catalog-data.json`; on an OK response it rebuilds
   the marker container from `markers[]` and sets the three overlay counters.
2. Marker positions and flags come from the JSON; tooltip presentation detail
   (provider, resolution, data range) comes from `COUNTRY_META` in the script — a
   covered country missing from `COUNTRY_META` still renders, with a reduced
   tooltip.
3. It then hides each `[data-wanted-code]` "+" pin whose ISO alpha-2 matches a
   marker's `country` (or `flag`), so a newly-covered country shows only its
   flag, not a flag plus a stale "help us" pin on the same spot.
4. On any failure the static HTML markers and numbers are left untouched.

### Safe modification notes

- Preserve the `[data-coverage-markers]` / `[data-coverage-stat]` contract and
  keep the static fallback markers in the HTML.
- `COUNTRY_META` is presentation-only; the covered set, positions, and flags are
  data-driven.
- Marker HTML is generated with `escapeHtml`; keep it around all injected values.

## Shared external dependencies

| Service | Use |
| --- | --- |
| GitHub REST API | Build-time repositories and contributor totals; the starter-issues fetch still runs but is currently unconsumed (see "Good-first issues" above). |
| GitHub profile images | Browser-loaded top-contributor avatars. |
| Raw GitHub content | Build-time precipitation catalog read (no longer browser-fetched). |
| ECMWF S3 (object store) | Build-time Zarr metadata reads for catalog impact stats. |
| Tailwind browser CDN | Runtime utility CSS with forms/container-query plugins. |
| Google Fonts | DM Sans, JetBrains Mono, and Material Symbols. |
| FlagCDN | Coverage-map and dataset country flags. |
| Slack, Google Docs, `mailto:` email | Outbound community actions; no embedded widget or form submission. A Microsoft Teams monthly-meeting link is mentioned in text but not linked from the site. |

## Current non-integrations

- There is no analytics beacon, iframe, WebSocket, EventSource, query-parameter
  reader, authenticated browser request, or native form-submission script.
- Generated `gh-stats.json`, `gh-issues.json`, and `catalog-data.json` are
  deployment artifacts, not repository source files.
