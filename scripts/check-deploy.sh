#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <deployed_base_url> (e.g. https://user.github.io/repo/)"
  exit 2
fi

BASE="$1"
# ensure trailing slash
if [[ "$BASE" != */ ]]; then BASE="$BASE/"; fi

SITE_DIR="dist"
# allow passing a custom site dir as second arg or via SITE_DIR env var
if [ $# -ge 2 ] && [ -n "$2" ]; then
  SITE_DIR="$2"
fi
if [ -n "${SITE_DIR_ENV:-}" ]; then
  SITE_DIR="$SITE_DIR_ENV"
fi

if [ -f "$SITE_DIR/index.html" ]; then
  INDEX_FILE="$SITE_DIR/index.html"
elif [ -f dist/index.html ]; then
  INDEX_FILE="dist/index.html"
elif [ -f index.html ]; then
  INDEX_FILE="index.html"
else
  echo "index.html not found in $SITE_DIR, dist/ or repo root — run 'npm run build' first or specify the correct site directory"
  exit 2
fi

# extract first script src and first stylesheet href from the chosen index.html
JS=$(grep -oP 'src="\K[^"]+' "$INDEX_FILE" | head -n1 || true)
CSS=$(grep -oP 'href="\K[^"]+' "$INDEX_FILE" | head -n1 || true)

norm(){ echo "$1" | sed 's#^\./##; s#^/##'; }
JSN=$(norm "$JS")
CSSN=$(norm "$CSS")

URLS=("${BASE}${JSN}" "${BASE}${CSSN}" "${BASE}")

echo "Checking deployed URLs under: $BASE"
failed=0
for u in "${URLS[@]}"; do
  printf "Checking %s ... " "$u"
  code=$(curl -s -o /dev/null -w '%{http_code}' -L "$u" || echo "000")
  if [ "$code" = "200" ]; then
    echo "OK (200)"
  else
    echo "FAIL ($code)"
    failed=1
  fi
done

if [ $failed -eq 1 ]; then
  echo "One or more checks failed. Make sure you've deployed the full 'dist/' contents and that the site is served at the provided base URL."
  exit 1
fi

echo "All checks passed."
exit 0
