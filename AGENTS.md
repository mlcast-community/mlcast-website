# MLCast repository agent guide

## Scope and purpose

This repository contains the plain HTML/CSS MLCast marketing site in
`mlcast-website-carbotti/` and a separate MyST/Jupyter Book in `docs/`. The
marketing site is deployed to the root of GitHub Pages; `home.html` is also
published as `index.html`. There is no application server for the site. Any
backend-like website behavior runs in the browser from inline scripts.

## Read the smallest relevant document

- [Website architecture](docs/website/Architecture.md): pages, deployment,
  shared assets, inline script ownership, and client-side data flow.
- [UI palette and UX rules](docs/website/UI_UX_Instructions.md):
  color tokens, typography, components, responsive behavior, and accessibility.
- [Integrations](docs/website/Integration.md): GitHub API calls, the remote
  dataset catalog, third-party dependencies, fallbacks, and maintenance risks.
- [`README.md`](README.md): repository-level deployment and documentation
  build overview.

Claude Code loads [`CLAUDE.md`](CLAUDE.md), which imports this file. Keep
repository-wide rules here and reserve `CLAUDE.md` for lean Claude-specific
workflow guidance.

## Rules for agents

1. Inspect the whole target page before editing. Header, footer, Tailwind config,
   inline styles, DOM targets, and scripts are duplicated across pages in
   `mlcast-website-carbotti/`.
2. Treat inline scripts as client code, not a trusted backend. Never add secrets,
   private tokens, privileged API calls, or sensitive data to HTML.
3. Preserve the contract between scripts and their DOM IDs/classes. Search for
   every reference before renaming an element.
4. For remote data, keep a visible loading state, a useful failure state, output
   escaping, and accessible status updates. Check `response.ok`.
5. GitHub requests are unauthenticated and may be rate-limited. Consider
   pagination, request fan-out, caching, partial failures, and stale data before
   changing counts.
6. The catalog parser in `mlcast-website-carbotti/data.html` intentionally
   understands only a narrow subset of the current YAML structure. Update its
   tests/checks and
   [Integration.md](docs/website/Integration.md) if the upstream schema changes.
7. Shared UI belongs in `mlcast-website-carbotti/home.css`; page-specific layout
   may remain in the page. Keep repeated Tailwind tokens aligned across every
   HTML file.
8. Major changes MUST be reported in the appropriate documentation file as part
   of the same task. Documentation is part of the definition of done:
   - Adding, removing, or renaming a page; changing navigation, shared scripts,
     deployment, or architecture → update
     [Architecture.md](docs/website/Architecture.md).
   - Changing an API, remote data source, request/response assumptions, cache
     key, fallback, or cross-page data flow → update
     [Integration.md](docs/website/Integration.md).
   - Changing the palette, typography, shared component styling, layout rules,
     breakpoints, motion, or accessibility conventions → update
     [the UI/UX guide](docs/website/UI_UX_Instructions.md).
   - Changing repository-wide agent workflow or validation requirements →
     update this `AGENTS.md`.
   Agents must not report a major change as complete while its documentation is
   stale. If no documentation update is needed, state why in the final report.

## Safe validation

- Run `git diff --check`.
- Preview through a local HTTP server; do not validate remote fetches from source
  inspection alone.
- Check the browser console and Network panel with a normal response, a failed
  request, and cached data where applicable.
- Test desktop and mobile layouts, keyboard focus, menu behavior, live regions,
  copy buttons, and reduced-motion behavior.
- Recheck local links and every script-owned DOM ID after structural edits.
- For deployment-sensitive changes, inspect `.github/workflows/deploy.yml`; it
  copies `mlcast-website-carbotti/` to the Pages root and duplicates `home.html`
  as `index.html`.
