#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="$ROOT_DIR/infra/local-dev/data/s3/tenants"

SITES=(
  "guidogerbpublishing.com"
  "picklecheeze.com"
  "stream4cloud.com"
  "garygerber.com"
  "ggp.llc"
  "this-is-my-story.org"
)

workspace_name_for_site() {
  case "$1" in
    "guidogerbpublishing.com") echo "websites-guidogerbpublishing" ;;
    "picklecheeze.com") echo "websites-picklecheeze" ;;
    "stream4cloud.com") echo "websites-stream4cloud" ;;
    "garygerber.com") echo "websites-garygerber" ;;
    "ggp.llc") echo "websites-ggp-llc" ;;
    "this-is-my-story.org") echo "websites-this-is-my-story" ;;
    *) return 1 ;;
  esac
}

mkdir -p "$DATA_DIR"

for SITE in "${SITES[@]}"; do
  SRC="$ROOT_DIR/websites/$SITE/dist"
  DEST="$DATA_DIR/local.$SITE"

  if [[ ! -d "$SRC" ]]; then
    echo "[warn] build output not found for $SITE at $SRC" >&2
    if WORKSPACE_NAME=$(workspace_name_for_site "$SITE" 2>/dev/null); then
      echo "       run 'pnpm --filter $WORKSPACE_NAME build' or 'pnpm -r build' first" >&2
    else
      echo "       run 'pnpm -r build' first" >&2
    fi
    continue
  fi

  echo "[sync] copying $SITE"
  rm -rf "$DEST"
  mkdir -p "$DEST"
  cp -R "$SRC"/* "$DEST/"
done

echo "Done. Updated tenants live under infra/local-dev/data/s3/tenants"
