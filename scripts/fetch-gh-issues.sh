#!/usr/bin/env bash
# Fetch open "good first issue" issues at build time and write a static JSON
# the site reads. Avoids client-side GitHub API calls (60 req/hr unauthenticated
# -> 429s). Uses GITHUB_TOKEN when present (5000 req/hr); still works without.
set -euo pipefail

ORG="${1:-mlcast-community}"
OUT="${2:-dist/gh-issues.json}"
LIMIT="${3:-6}"

AUTH=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  AUTH=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

q="org:${ORG}+label:%22good+first+issue%22+state:open"
url="https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=${LIMIT}"

resp="$(curl -sfL "${AUTH[@]}" -H "Accept: application/vnd.github+json" "$url" || true)"

# Don't clobber the page's hardcoded fallback with an empty list if the API was
# unreachable / rate-limited. No file -> client fetch 404s -> fallback stays.
if [ -z "$resp" ] || [ "$(printf '%s' "$resp" | jq -r 'has("items")')" != "true" ]; then
  echo "No issues fetched (API error or rate-limited); leaving $OUT untouched." >&2
  exit 0
fi

mkdir -p "$(dirname "$OUT")"
printf '%s' "$resp" | jq '{
  items: [ .items[] | {
    repo:   (.repository_url | split("/") | last),
    title:  .title,
    number: .number,
    url:    .html_url
  } ],
  generated: (now | todate)
}' > "$OUT"

echo "Wrote $OUT:"
cat "$OUT"
