# MLCast Website

The official website of the MLCast Community — an open-source collaboration
developing machine learning "nowcasting" models for weather prediction.

Two parts are deployed together to GitHub Pages:

- **Website** (repo root) — plain HTML/CSS, served at the site root.
- **Documentation** (`docs/` + `myst.yml`) — a [Jupyter Book](https://next.jupyterbook.org/)
  (MyST) site, served under `/docs`.

The [deploy workflow](.github/workflows/deploy.yml) assembles both into one Pages
artifact.

## Build-time data (kept fresh by GitHub Actions)

The site is fully static, so two build steps in the deploy workflow generate the
"live" numbers as JSON before publishing. Both run on every push to `main` and on
a daily schedule, so the figures stay current without any client-side API calls.
Each has an honest fallback: if generation fails, the JSON is simply absent and
the page keeps its hard-coded values.

### Community card — [`scripts/fetch-gh-stats.sh`](scripts/fetch-gh-stats.sh)

Populates the community card on `home.html`. Using the Actions `GITHUB_TOKEN`, it
paginates the GitHub REST API over every public repository in the
`mlcast-community` org and each repo's contributors, filters out bots, and sums
GitHub's per-contributor `contributions` totals. It writes
`gh-stats.json` (`repos`, `contributors`, `commits`, and the top four
contributors), which `home.html` fetches to fill the repo/contributor/commit
counters and the contributor avatars. Keeping the token in the workflow avoids
GitHub's 60 req/hr anonymous limit hitting visitors' browsers.

### Catalog data — [`scripts/fetch-catalog-stats.py`](scripts/fetch-catalog-stats.py)

Produces `catalog-data.json`, the single source for everything the site derives
from the catalog: the dataset list and impact-spotlight counters on `data.html`
and the coverage-map markers on `home.html`/`contributing.html`. It parses the
public precipitation `catalog.yml`, infers each dataset's country/flag and
cadence, and for each dataset opens **only the Zarr metadata** (via `fsspec` —
`.zmetadata`, `.zarray`, or Zarr v3 `zarr.json`), never the array data, to derive
countries, cumulative years, total time steps, and best cadence. A dataset's date
range comes from the `time` variable's `units` attribute plus `steps × cadence`,
so no coordinate arrays are downloaded (reading exact end timestamps would mean
pulling whole time arrays — ~16 MB for a single source). Map-marker positions are
computed from `img/world.svg` — the bounding-box centre of each country's named
`<path>` (via `svgpathtools`). `data.html` and `coverage-map.js` fetch the JSON
and keep hard-coded fallbacks on failure.

## Website

Edit the HTML/CSS in the repo root. `home.html` is the landing page
(published as `index.html`). Open the files directly in a browser to preview.

## Documentation (Jupyter Book)

Requires [uv](https://docs.astral.sh/uv/). The book content lives in `docs/`, with
the table of contents and site config in `myst.yml`.

```sh
# Live preview with hot-reload (http://localhost:3000)
uv run jupyter book start

# Static build -> _build/html/
uv run jupyter book build --html
```

its automatically built with github actions.
