# Website architecture

## Purpose

`mlcast-website-carbotti/` is a static, multi-page marketing website for MLCast.
It uses plain HTML, one shared CSS file, page-local Tailwind configuration, and
inline JavaScript. It does not contain an API server, database, package manifest,
bundler, or shared JavaScript module.

The repository deployment workflow copies this directory to the GitHub Pages
root and copies `home.html` to `index.html`. The separate MyST/Jupyter Book in
the repository-level `docs/` directory is built into `/docs/`.

## Page map

| Page | Responsibility |
| --- | --- |
| `home.html` | Landing page, coverage map, project overview, and live GitHub community summary. |
| `software_and_data.html` | Landing page routing visitors to software and dataset detail pages. |
| `software.html` | Software ecosystem, copyable commands, step navigation, and client-side configuration preview. |
| `data.html` | Dataset overview and remote precipitation catalog browser. |
| `community.html` | Community introduction, scroll-linked story, testimonials, and contact links. |
| `contributing.html` | Contributor paths, coverage map, live GitHub starter issues, and repository statistics. |
| `faq.html` | Static FAQ using native `<details>` elements. |
| `docs.html` | Empty placeholder; it is not the deployed documentation site. |

Navigation, mobile-menu markup, and footers are copied between pages rather than
generated from a template. Changes to one page do not propagate automatically.

## Shared assets and styling

- `home.css` contains shared navigation, mobile menu, cards, focus states,
  terminal styling, section navigation, and common interaction styles.
- `img/` contains local maps, photographs, and testimonial portraits.
- Page-local `<style>` blocks handle one-off components such as the community
  stepper and contributor navigation.
- Most pages load Tailwind's browser CDN and define `tailwind.config` inline.
  There is no compiled Tailwind output. Classes are interpreted in the browser.
- Google Fonts supplies Geist, Inter, JetBrains Mono, and Material Symbols.
- Colors, spacing, and type conventions are documented in
  [UI_UX_Instructions.md](UI_UX_Instructions.md).

## Runtime model and data flow

All dynamic behavior executes after the HTML is loaded:

```text
static HTML fallback
    -> inline script finds DOM targets by ID/class
    -> optional external fetch
    -> validation/parsing/escaping
    -> DOM text or generated markup update
    -> fallback remains or is replaced on failure
```

There is no shared script bundle. Cross-page state is limited to browser APIs;
the main example is the `mlcast_gh_stats` `sessionStorage` value written by
`home.html` and read by `contributing.html`.

## Embedded-script inventory

### `home.html`

- Coverage map: local pointer, wheel, and zoom state; no remote map service.
- Mobile menu: toggles shared menu classes and `aria-expanded`.
- Hero canvas: draws and animates a local particle network.
- Hero video: forces muted inline autoplay and adjusts playback rate.
- Clipboard helper: copies visible command text.
- Section navigation: scrollspy, progressive reveal, and moving position dot.
- GitHub community data: fetches repositories and contributors, calculates
  summary values, updates the community card, and caches the result per session.
  See [Integration.md](Integration.md#home-page-community-summary).

### `data.html`

- Clipboard helper for generated dataset-opening examples.
- Remote catalog loader: fetches YAML, parses selected source fields, adds
  hard-coded display metadata, filters by search input, and renders cards.
  See [Integration.md](Integration.md#dataset-catalog).
- Section scrollspy and moving navigation dot.

### `contributing.html`

- Contributor-path navigation with click locking and scroll synchronization.
- GitHub starter-issue loader and fallback search link.
- GitHub repository/dataset counts plus reuse of the home-page session cache.
  See [Integration.md](Integration.md#contributing-page-good-first-issues) and
  [Integration.md](Integration.md#contributing-page-community-counts).
- Local coverage-map pan/zoom behavior.
- Section scrollspy, moving navigation dot, and mobile menu.

### `software.html`

- Clipboard helper for installation and training commands.
- Step-tab state for the quick-start sequence.
- Configuration preview that converts form control values into a displayed CLI
  command. It does not submit data or run MLCast.
- One inline click handler expands/collapses terminal output.

### `community.html`

- Mobile menu behavior.
- Who/What/Why stepper: uses `IntersectionObserver` to synchronize the active
  text step and progress line with desktop photo panels; clicking a step scrolls
  to its panel.

### `software_and_data.html`

- A legacy sidebar toggle expects `#menu-btn`, but that element is absent; the
  unguarded listener currently throws when this script runs.
- A separate guarded mobile-menu script also finds no mobile menu/overlay markup
  and returns. Treat this page's mobile control as incomplete until markup and
  script ownership are reconciled.

### `faq.html` and `docs.html`

`faq.html` has no body JavaScript; FAQ disclosure uses native HTML and CSS.
`docs.html` is empty and has no scripts. Both are included here to make the
all-page audit explicit.

## Coupling and maintenance boundaries

- Script behavior is coupled to DOM IDs, `data-*` attributes, and class names in
  the same file.
- Shared navigation behavior is copied into several pages. Fixes may need to be
  repeated or deliberately centralized.
- Tailwind design tokens are duplicated in page heads. Changing only one config
  can create silent visual drift.
- Dynamically generated markup must keep remote text escaped before assigning
  `innerHTML`.
- The live integrations are public, anonymous browser requests. They cannot rely
  on secrets and must degrade safely.

## Architecture-change checklist

- Identify every page and selector affected with `rg`.
- Decide whether behavior is page-specific or should move to a shared script.
- Preserve static fallback content and accessible live/status regions.
- Re-test direct page entry, not only navigation from `home.html`.
- Update [Integration.md](Integration.md) for endpoint or data-contract changes.
- Update the UI guide for new tokens, shared components, or breakpoint rules.
