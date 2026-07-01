# MLCast Website

Website for the MLCast Community — an open-source collaboration developing
machine learning "nowcasting" models for weather prediction.

Two parts are deployed together to GitHub Pages:

- **Static marketing site** (repo root) — plain HTML/CSS, served
  at the site root.
- **Documentation** (`docs/` + `myst.yml`) — a [Jupyter Book](https://next.jupyterbook.org/)
  (MyST) site, served under `/docs`.

The [deploy workflow](.github/workflows/deploy.yml) assembles both into one Pages
artifact:

- root → `https://webvalley2026.github.io/mlcast-website/`
- docs → `https://webvalley2026.github.io/mlcast-website/docs/`

## Static site

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
