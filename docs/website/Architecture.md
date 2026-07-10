# Website architecture

## Purpose

The MLCast repository combines two static outputs:

- The MLCast Community website consists of root-level HTML, CSS, and JavaScript.
- The MyST/Jupyter Book source lives in `docs/` and is published under `/docs/`.

There is no application server or client build system. Tailwind runs through its
browser CDN. GitHub community data is generated during deployment, while the
dataset catalog is fetched by the visitor's browser.

## Deployment

`.github/workflows/deploy.yml` assembles the GitHub Pages artifact on pushes to
`main`, manual dispatches, and a daily schedule:

1. Copy root `*.html`, `*.css`, `*.js`, `img/`, and `video/` into `dist/`.
2. Copy `home.html` to `dist/index.html`.
3. Run `scripts/fetch-gh-stats.sh` and `scripts/fetch-gh-issues.sh` with the
   Actions `GITHUB_TOKEN`, producing `dist/gh-stats.json` and
   `dist/gh-issues.json` when GitHub returns usable data.
4. Run `scripts/fetch-catalog-stats.py` (via `uv run`) to read the precipitation
   catalog plus its Zarr metadata and produce `dist/catalog-data.json` (dataset
   list, per-country coverage-map markers computed from the staged
   `dist/img/world.svg`, and impact stats). The same step rewrites the
   covered-country highlight rule inside `dist/img/world.svg` in place, so it
   runs after step 1 has copied `img/` into `dist/`.
5. Build the MyST site and stage it in `dist/docs/`.
6. Upload and deploy the combined artifact.

The daily schedule refreshes GitHub-derived JSON and the catalog stats even when
the website source has not changed.

## Page map

| Page | Responsibility |
| --- | --- |
| `home.html` | Landing page, coverage map (markers/overlays from `catalog-data.json` via `coverage-map.js`), project overview, and community summary loaded from `gh-stats.json`. |
| `software.html` | Software ecosystem, copyable commands, step navigation, and client-side configuration preview. |
| `data.html` | Dataset overview, catalog dataset list, and impact-spotlight counters — all loaded from `catalog-data.json`. |
| `software_and_data.html` | Legacy combined overview for software and dataset details. Not linked from the primary header nav or from `software.html`/`data.html`; reachable only by direct URL. |
| `community.html` | Community introduction, scroll-linked story, testimonials, and contact links. |
| `contributing.html` | Contributor paths, coverage map (via `coverage-map.js`), and current infrastructure-support credits. |
| `faq.html` | Static FAQ using native `<details>` elements. |

## Shared files

- `header.js` injects the shared header, desktop/mobile navigation, footer,
  mobile-menu behavior, and copy-on-select behavior for terminal windows. Pages
  provide `#site-header` and `#site-footer` mount elements. The header "Docs"
  link uses the relative `docs/` path (not a hardcoded origin) so it resolves
  against whatever base serves the site — matching the inline `docs/...` links
  in `software.html`/`contributing.html`.
- `tailwind-config.js` is the single source of truth for Tailwind theme colors,
  spacing, radii, and font aliases.
- `coverage-map.js` renders the coverage-map flag markers and Countries/Years/
  Cadence overlays from `catalog-data.json`. Pages call
  `renderCoverageMap(viewportId)` and provide a `[data-coverage-markers]`
  container plus `[data-coverage-stat]` nodes (see
  [Integration.md](Integration.md)).
- `home.css` contains shared navigation, cards, focus states, terminal styling,
  section navigation, responsive rules, and common interaction styles.
- `img/` and `video/` contain published media. `img/world.svg` is the shared
  coverage-map base: a high-resolution equirectangular (plate carrée) Natural
  Earth map whose `<path id>` is each country's ISO 3166-1 alpha-2 code, viewBox
  `-1800 -835.6 3600 1393.5`. `home.html` renders it into a squarer
  `aspect-[4/3]` box (`object-fill`, default view zoomed to Europe);
  `contributing.html` uses a `aspect-[3600/1393]` box (`object-contain`). Marker
  `left/top` percents are viewBox-relative, so alignment holds at any box aspect.
  Covered
  countries are filled via an id-selector rule in its `<style>` that the deploy
  step regenerates from the catalog; markers overlay it by `left/top` percent.
- Page-local `<style>` and `<script>` blocks own behavior that is not shared.
- UI conventions are documented in [UI_UX_Instructions.md](UI_UX_Instructions.md).

## Data flow

### Build-time GitHub data

```text
GitHub Actions GITHUB_TOKEN
    -> scripts/fetch-gh-stats.sh / scripts/fetch-gh-issues.sh
    -> GitHub REST API
    -> dist/gh-stats.json / dist/gh-issues.json
    -> browser fetches same-origin JSON
    -> DOM update or static HTML fallback
```

This design keeps credentials and high-volume GitHub API calls out of the
browser. See [Integration.md](Integration.md).

### Browser-side dataset catalog

```text
data.html
    -> raw GitHub precipitation catalog YAML
    -> narrow in-page parser
    -> escaped dataset cards and generated code examples
    -> local search filtering
```

## Script ownership by page

### `home.html`

- Local coverage-map pan and zoom. Markers counter-scale with zoom (set via the
  `--marker-scale` CSS variable on `#coverage-map`) so pins/tooltips shrink
  partially when zooming in and grow when zooming out, clamped at both ends. The
  dashed expansion ("Help us with your data!") markers are links to
  `contributing.html`, each tagged `data-wanted-code="<iso2>"`; `coverage-map.js`
  hides the one for any country that becomes covered so it doesn't sit under the
  new flag.
- `coverage-map.js` (`renderCoverageMap("coverage-viewport")`) rebuilds the live
  flag markers and Countries/Years/Cadence overlays from `catalog-data.json`,
  keeping the static markers/numbers on failure.
- Hero canvas animation and muted inline video playback.
- Clipboard helper and section-navigation scroll behavior.
- Fetches same-origin `gh-stats.json` and updates community counts/avatars.
- A static `#networks` section ("Integrated into European Meteorological
  Networks, Open to the world.") links out to EUMETNET, its Nowcasting and
  E-AI Programmes, the European Weather Cloud, and EUMETSAT, and closes with a
  note that contribution is open regardless of geography. It is included in
  the section-nav panel; no fetch or DOM update is involved.

### `data.html`

- Fetches same-origin `catalog-data.json` (no client-side YAML parsing).
- Builds searchable dataset cards and copyable `xarray` examples from its
  `datasets[]` array.
- Updates the impact-spotlight counters (`#stat-countries`, `#stat-years`,
  `#stat-timesteps`, `#stat-cadence`) from the same file, keeping the hard-coded
  card values on failure.
- Section-navigation scroll behavior.

### `contributing.html`

- Contributor-path navigation with click locking and scroll synchronization.
- The "Share Data" coverage map (live-country flags only, no pan/zoom or
  expansion markers) has its markers and Countries/Years/Cadence overlays
  rebuilt from `catalog-data.json` by `coverage-map.js`
  (`renderCoverageMap("contrib-coverage-viewport")`), falling back to the static
  markers on failure.
- No longer renders a starter-issues section (removed as repetitive with the
  "Ways to Contribute" paths above it); see [Integration.md](Integration.md)
  for the now-orphaned `gh-issues.json` producer this left behind.

The "Support the Community" card lists current infrastructure support (EWC S3
storage via DWD, GPU hours via CINECA on Leonardo HPC) as static text and
partner logos loaded from `img/dwd-logo.png`, `img/eumetnet-logo.png`,
`img/cineca-logo.png`, and `img/leonardo-logo.png`; update both the copy and
these four files together if the support arrangement changes.

### `software.html`

- Copy helpers, quick-start step tabs, configuration preview, and terminal-output
  expansion.

### `community.html`

- Who/What/Why stepper synchronized with desktop photo panels.
- Small presentation-only helpers; shared navigation comes from `header.js`.

### `software_and_data.html`

- Static routing content plus shared site chrome.
- Retains an effectively empty page-local script block; shared behavior belongs
  in `header.js`.
- Not included in the primary header nav (`header.js` links directly to
  `software.html` and `data.html`), and `software.html`/`data.html` no longer
  link back to it; this page is reachable only by direct URL.

### `faq.html`

No page-local body JavaScript; disclosure behavior is native HTML/CSS.

## Coupling and maintenance boundaries

- Page scripts depend on DOM IDs, `data-*` attributes, and classes in the same
  HTML file.
- `header.js` owns site-wide navigation/footer links; do not copy that markup
  back into individual pages.
- `tailwind-config.js` must load after the Tailwind CDN script and before classes
  are generated.
- The build scripts require Bash, `curl`, and `jq`.
- Generated JSON is deployment output and should not be edited as source.
- Remote strings inserted through `innerHTML` must remain escaped.
- Static fallback content must remain honest and useful when generated JSON or
  the remote catalog is unavailable.

## Architecture-change checklist

- Search for every affected selector, mount, endpoint, and output filename.
- Update shared behavior in the shared file rather than duplicating it.
- Preserve static fallback and accessible loading/status behavior.
- Test direct page entry and both generated-JSON success/failure paths.
- Update [Integration.md](Integration.md) for endpoint or data-contract changes.
- Update the UI guide for new tokens, components, or responsive conventions.
