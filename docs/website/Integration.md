# Integrations and dynamic data

## Integration model

The site has no private backend. Inline browser scripts call public endpoints and
write results into existing HTML. Therefore:

- requests are anonymous and subject to browser, CORS, availability, and
  provider rate limits;
- no secret or API token can be safely embedded;
- initial HTML must remain useful when JavaScript or a remote service fails;
- remote strings must be escaped before insertion through `innerHTML`.

## Home-page community summary

### Purpose

Show current MLCast organization activity in the community card near the bottom
of `home.html`, without maintaining a separate site backend or manually updating
repository, contributor, and contribution totals.

### Location

- Page: `home.html`
- Script: final inline script containing `const ORG = "mlcast-community"`
- DOM targets: `#gh-contributors`, `#gh-repos`, `#gh-commits`,
  `#gh-collab-count`, and `#gh-avatars`
- Cache: `sessionStorage["mlcast_gh_stats"]`

### How it works

1. Read and parse the session cache. If valid, update the card and stop.
2. Request up to 100 public organization repositories from
   `GET https://api.github.com/orgs/mlcast-community/repos?per_page=100`.
3. For every returned repository, request up to 100 contributors from
   `GET /repos/{org}/{repo}/contributors?per_page=100`.
4. Exclude bot accounts, aggregate each login's `contributions`, sum the values,
   sort contributors, and keep four top logins for avatars.
5. Update the card and cache `{repos, contributors, commits, top}` for the
   current browser session.

The displayed “commits” value is the sum of the GitHub contributor endpoint's
`contributions` values. It is not a full paginated audit of organization commit
history.

### Dependencies and connections

- GitHub REST API v3 JSON responses.
- GitHub profile images at `https://github.com/{login}.png?size=64`.
- The contributor avatar group links to the GitHub organization people page.
- `contributing.html` reads the same cache key to display a contributor count.

### Failure handling

Errors are swallowed and the static HTML values remain visible. The script does
not show an explicit error state. A failed per-repository contributor request
increments its completion counter but does not run the final completion check,
so one partial failure can prevent all fresh values from rendering.

### Safe modification notes

- Handle `response.ok`, pagination, empty organizations, and partial completion.
- Avoid the current N+1 request pattern if repository count grows.
- Preserve bot filtering and deduplication when changing aggregation.
- Version the cache key if the stored object shape changes.
- Do not label a value “commits” unless its calculation still supports that
  meaning.

### Testing checklist

- Test with and without `mlcast_gh_stats` in session storage.
- Verify all five DOM targets and the four generated avatars.
- Simulate the repository request failing and one contributor request failing.
- Check GitHub rate-limit responses and an empty repository array.
- Navigate from `home.html` to `contributing.html` in the same tab and verify
  cache reuse.

## Contributing-page good-first issues

### Purpose

Populate the “Current good first issues” section with up to three current,
low-friction tasks from MLCast repositories.

### Location

- Page: `contributing.html`
- Script: inline block that defines `issueList` and `issuesSearchUrl`
- DOM target: `#issue-list`

### How it works

1. Request GitHub's issue search endpoint with organization
   `mlcast-community`, label `good first issue`, state `open`, update sorting,
   and `per_page=3`.
2. Expect a JSON object with an `items` array.
3. Derive the repository name from `repository_url`.
4. Escape repository name, title, and number before generating issue cards.
5. Link each card to the issue's `html_url`.

### Dependencies and connections

- GitHub Search API.
- The fallback and “View all” action use the equivalent GitHub web search URL.
- No cache is used.

### Failure handling

Non-OK responses, network errors, and empty results render one full-width card
linking to the GitHub search page. The section remains actionable even without
API data.

### Safe modification notes

- Keep `escapeHtml` around every remote text field.
- Validate any new URL field before assigning it to `href`.
- Search API limits differ from other GitHub REST limits; keep request volume
  low.
- Keep the fallback usable and visible.

### Testing checklist

- Test populated, empty, malformed, rate-limited, and offline responses.
- Verify long titles wrap and repository/issue links open correctly.
- Confirm the `aria-live` region changes without disruptive focus movement.

## Contributing-page community counts

### Purpose

Show lightweight repository and dataset-repository counts without fabricating
statistics.

### Location

- Page: `contributing.html`
- Script: inline block labeled “Support-the-community stats”
- DOM targets: `#gh-dataset-count`, `#gh-repo-count`, `#gh-contrib-count`

### How it works

1. Try to read the home page's `mlcast_gh_stats` session cache and use its
   `contributors` value.
2. Fetch up to 100 organization repositories.
3. Display the array length as repository count.
4. Count repository names beginning with `mlcast-dataset-` as “Datasets.”

### Dependencies and connections

- GitHub organization repositories endpoint.
- Cross-page dependency on the cache populated by `home.html`.
- “Datasets” means repositories matching a naming convention, not entries in
  the Intake catalog shown by `data.html`.

### Failure handling

Errors are swallowed. Existing em-dash placeholders remain. Direct visits to
`contributing.html` do not fetch contributor details, so the contributor count
can stay blank when no session cache exists.

### Safe modification notes

- Keep the repository naming rule synchronized with actual organization naming.
- If direct-entry accuracy matters, remove the implicit home-page dependency or
  provide an intentional fallback request.
- Check `response.ok` before parsing and add pagination if the organization can
  exceed 100 repositories.

### Testing checklist

- Test direct entry and navigation from `home.html`.
- Test missing, malformed, and stale cache data.
- Test repository names that do and do not match `^mlcast-dataset-`.
- Verify failure leaves an honest placeholder rather than a misleading number.

## Dataset catalog

### Purpose

Render the current public precipitation catalog in `data.html` from its source
repository, so website dataset cards track upstream catalog changes without
manual duplication.

### Location

- Page: `data.html`
- Remote source:
  `https://raw.githubusercontent.com/mlcast-community/mlcast-datasets/main/src/mlcast_datasets/catalog/precipitation/catalog.yml`
- DOM targets: `#dataset-search`, `#dataset-catalog-list`,
  `#dataset-catalog-count`, and `#dataset-catalog-status`
- Global debug/state hook: `window.datasetCatalogLinks`

### How it works

1. Fetch the raw YAML as text and require an OK response.
2. Use a small indentation-based parser to find the top-level `sources` mapping.
3. For each source, read only `description`, `driver`, `urlpath`,
   `endpoint_url`, and `consolidated`.
4. Normalize source names, infer a country flag, and add hard-coded provider,
   range, cadence, and variable metadata based on source-name patterns.
5. Generate escaped HTML, including an `xarray.open_dataset` example.
6. Filter the in-memory result as the visitor types in the search input.

This is not a general YAML parser. Nested structures, multiline scalars, aliases,
changed indentation, or renamed keys may not parse correctly.

### Dependencies and connections

- Raw GitHub content for catalog YAML.
- GitHub catalog page URL as a stored fallback/reference.
- FlagCDN country SVGs generated from inferred country codes.
- The visible “View catalog file” link currently points to the published
  `mlcast-datasets` site, not `CATALOG_PAGE_URL`.
- The static Intake example elsewhere in `data.html` references
  `catalog/catalog.yml`, while the live browser uses
  `catalog/precipitation/catalog.yml`; verify both when paths change.
- The dataset count is independent from the repository-prefix count on
  `contributing.html`.

### Failure handling

Fetch, HTTP, or parser errors are logged to the console. The count, screen-reader
status, and list are replaced with a visible “Unable to load” state. There is no
cache or retry, so every page load makes a fresh request.

### Safe modification notes

- Prefer a real parser or prebuilt JSON if the upstream schema becomes complex.
- Keep `escapeHtml` for every upstream value inserted into markup or code.
- Treat hard-coded impact metadata as a second data source and update it when
  catalog naming changes.
- Keep loading, empty-search, empty-catalog, and error states distinct.
- Verify generated code examples against the actual driver and storage options.

### Testing checklist

- Test a valid catalog, non-OK response, empty `sources`, schema change, and
  malformed YAML.
- Search by name, description, driver, URL path, and endpoint.
- Check flags and hard-coded metadata for every known source.
- Copy every generated code example and verify HTML entities become plain code.
- Test via HTTP and inspect CORS behavior in the browser.

## Shared third-party runtime dependencies

| Service | Use | Pages |
| --- | --- | --- |
| Tailwind browser CDN | Generates utility CSS at runtime; loads `forms` and `container-queries` plugins. | All styled pages; not `docs.html`. |
| Google Fonts | Geist, Inter, JetBrains Mono, and Material Symbols. | All styled pages. |
| FlagCDN | Static country flags in coverage maps and generated dataset cards. | `home.html`, `contributing.html`, `data.html`. |
| GitHub web/profile URLs | Repository links, organization links, issue fallback, and avatars. | Several pages. |
| Slack, Microsoft Teams, Google Docs, `mailto:` | Outbound community actions only; no embedded widget or form submission. | Primarily `community.html`, `contributing.html`, and footers. |

If these resources fail, fonts/icons/flags or utility styling may degrade even
when page HTML remains available.

## Explicitly absent

The audited HTML currently contains no analytics beacon, embedded iframe,
WebSocket, EventSource, query-parameter reader, authenticated request, or native
form submission script. The contribution-interest “form” is an outbound Google
Docs link, and the newsletter action is a `mailto:` subscription link.
