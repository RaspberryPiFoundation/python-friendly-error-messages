#!/usr/bin/env bash
# release.sh — cut a release entirely from your machine: bump, build, test,
# publish to npm, push, and create the GitHub Release.
#
# Usage:
#   ./scripts/release.sh patch     # 0.3.0 → 0.3.1
#   ./scripts/release.sh minor     # 0.3.0 → 0.4.0
#   ./scripts/release.sh major     # 0.3.0 → 1.0.0
#   ./scripts/release.sh 1.2.3     # explicit version
#
# Prerequisites (one-time): `npm login` (publishing uses your local npm auth,
# including a 2FA OTP prompt if enabled) and `gh auth login` (for the release).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

current="$(node -p "require('./package.json').version")"

# ── Resolve the bump ────────────────────────────────────────────────────────
if [[ -z "${1:-}" ]]; then
  echo "Usage: ./scripts/release.sh <patch|minor|major|x.y.z>" >&2
  echo "Current version: $current" >&2
  exit 1
fi

bump="$1"
case "$bump" in
  patch|minor|major) ;;
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "Error: '$bump' must be patch, minor, major, or an explicit x.y.z" >&2; exit 1 ;;
esac

# ── Safety checks ───────────────────────────────────────────────────────────
branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != "main" ]]; then
  echo "Error: releases must be cut from 'main' (currently on '$branch')." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean — commit or stash changes first." >&2
  exit 1
fi

echo "Syncing with origin/main…"
git fetch --quiet origin main
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo "Error: local main is not in sync with origin/main — pull/push first." >&2
  exit 1
fi

if ! npm whoami >/dev/null 2>&1; then
  echo "Error: not logged in to npm — run 'npm login' first." >&2
  exit 1
fi

# ── Validate (before bumping, so a failure leaves no dangling version) ───────
echo "Running tests…"
npm test
echo "Building…"
npm run build:all

# ── Bump + tag (local only so far) ──────────────────────────────────────────
# npm version updates package.json + package-lock.json, commits, and tags vX.Y.Z.
newtag="$(npm version "$bump" -m "Release v%s")"   # prints e.g. "v0.4.0"
echo "Bumped $current → $newtag"

# ── Publish to npm ──────────────────────────────────────────────────────────
echo "Publishing to npm (enter your 2FA OTP if prompted)…"
if ! npm publish; then
  echo "" >&2
  echo "Error: npm publish failed. The version bump was committed and tagged locally," >&2
  echo "but nothing was pushed. To undo and retry:" >&2
  echo "  git tag -d $newtag && git reset --hard HEAD~1" >&2
  exit 1
fi

# ── Point the demo at the just-published version ────────────────────────────
# The demo's "vendored release" build (served on GitHub Pages) is regenerated from the published npm package pinned in docs/
newversion="${newtag#v}"
pkg="@raspberrypifoundation/python-friendly-error-messages"
echo "Pointing the demo at $newtag…"
if ( cd "$ROOT/docs" && npm pkg set "dependencies.$pkg=^$newversion" && npm install >/dev/null 2>&1 ); then
  git add docs/package.json docs/package-lock.json
  git commit -m "chore: point demo at $newtag" >/dev/null
else
  echo "Warning: couldn't update the demo dependency — the new version may not have" >&2
  echo "propagated to npm yet. Once it has, run:" >&2
  echo "  (cd docs && npm install $pkg@^$newversion) && git commit -am 'chore: point demo at $newtag' && git push" >&2
  git checkout -- docs/package.json docs/package-lock.json 2>/dev/null || true
fi

# ── Push + GitHub Release ───────────────────────────────────────────────────
git push --follow-tags origin main

repo="RaspberryPiFoundation/python-friendly-error-messages"
if command -v gh >/dev/null 2>&1; then
  if ! gh release create "$newtag" --title "$newtag" --generate-notes; then
    echo "Warning: GitHub Release creation failed (npm publish + push already succeeded)." >&2
    echo "Create it manually: gh release create $newtag --title $newtag --generate-notes" >&2
  fi
else
  echo "Warning: gh CLI not found — GitHub Release not created." >&2
  echo "Install gh, then run: gh release create $newtag --title $newtag --generate-notes" >&2
fi

echo ""
echo "✓ Released $newtag"
echo "  npm:    https://www.npmjs.com/package/@raspberrypifoundation/python-friendly-error-messages/v/${newtag#v}"
echo "  GitHub: https://github.com/$repo/releases/tag/$newtag"
