#!/usr/bin/env bash
# Fetch GitHub org stats at build time and write a static JSON the site reads.
# Avoids client-side GitHub API calls (60 req/hr unauthenticated -> 429s).
# Uses GITHUB_TOKEN when present (5000 req/hr); still works unauthenticated.
set -euo pipefail

ORG="${1:-mlcast-community}"
OUT="${2:-dist/gh-stats.json}"

AUTH=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  AUTH=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

api() {
  curl -sfL "${AUTH[@]}" -H "Accept: application/vnd.github+json" "$1"
}

# --- list all public repos in the org (paginated) ---
repos=()
page=1
while :; do
  resp="$(api "https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}&type=public" || true)"
  count="$(printf '%s' "$resp" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)"
  [ "$count" -eq 0 ] && break
  while IFS= read -r name; do repos+=("$name"); done < <(printf '%s' "$resp" | jq -r '.[].name')
  [ "$count" -lt 100 ] && break
  page=$((page + 1))
done

repo_count=${#repos[@]}

# Don't clobber the page's hardcoded fallback with zeros if the API was
# unreachable / rate-limited. No file -> client fetch 404s -> fallback stays.
if [ "$repo_count" -eq 0 ]; then
  echo "No repos fetched (API error or empty org); leaving $OUT untouched." >&2
  exit 0
fi

# --- accumulate contributions per login across all repos ---
declare -A contrib
total_commits=0
for repo in "${repos[@]}"; do
  cpage=1
  while :; do
    resp="$(api "https://api.github.com/repos/${ORG}/${repo}/contributors?per_page=100&page=${cpage}" || echo '[]')"
    # skip if not an array (e.g. empty repo returns 204 -> empty body)
    [ -z "$resp" ] && break
    count="$(printf '%s' "$resp" | jq 'if type=="array" then length else 0 end')"
    [ "$count" -eq 0 ] && break
    # Filter empty logins and bots in jq so read always gets 2 non-empty fields.
    while IFS=$'\t' read -r login n; do
      [ -z "$login" ] && continue
      contrib["$login"]=$(( ${contrib["$login"]:-0} + n ))
      total_commits=$(( total_commits + n ))
    done < <(printf '%s' "$resp" | jq -r '
      .[]
      | select(.login != null and .login != "" and .type != "Bot"
               and (.login | endswith("[bot]") | not))
      | [.login, (.contributions // 0)] | @tsv')
    [ "$count" -lt 100 ] && break
    cpage=$((cpage + 1))
  done
done

contributor_count=${#contrib[@]}

# --- top 4 contributors by contributions ---
top_json="$(
  for login in "${!contrib[@]}"; do
    printf '%s\t%s\n' "${contrib[$login]}" "$login"
  done | sort -rn -k1,1 | head -4 | jq -R -s 'split("\n") | map(select(length>0) | split("\t")[1])'
)"
[ -z "$top_json" ] && top_json='[]'

mkdir -p "$(dirname "$OUT")"
jq -n \
  --argjson repos "$repo_count" \
  --argjson contributors "$contributor_count" \
  --argjson commits "$total_commits" \
  --argjson top "$top_json" \
  '{repos:$repos, contributors:$contributors, commits:$commits, top:$top, generated:(now|todate)}' \
  > "$OUT"

echo "Wrote $OUT:"
cat "$OUT"
