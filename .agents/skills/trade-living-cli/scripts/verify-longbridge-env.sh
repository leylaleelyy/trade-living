#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT" || exit 1

failures=0

section() {
  printf '\n== %s ==\n' "$1"
}

pass() {
  printf 'PASS %s\n' "$1"
}

warn() {
  printf 'WARN %s\n' "$1"
}

fail() {
  printf 'FAIL %s\n' "$1"
  failures=$((failures + 1))
}

section "Repository"
if [ "$(pwd)" = "/Users/bytedance/Documents/trade-living" ]; then
  pass "cwd is /Users/bytedance/Documents/trade-living"
else
  fail "cwd is $(pwd), expected /Users/bytedance/Documents/trade-living"
fi

if [ -f "package.json" ] && [ -f "feature_list.json" ]; then
  pass "project files found"
else
  fail "package.json or feature_list.json missing"
fi

section "Node"
if command -v node >/dev/null 2>&1; then
  pass "node $(node --version)"
else
  fail "node is not installed"
fi

if command -v npm >/dev/null 2>&1; then
  pass "npm $(npm --version)"
else
  fail "npm is not installed"
fi

section "Project checks"
if npm run check >/tmp/trade-living-check.log 2>&1; then
  pass "npm run check"
else
  fail "npm run check failed; see /tmp/trade-living-check.log"
fi

if npm run build >/tmp/trade-living-build.log 2>&1; then
  pass "npm run build"
else
  fail "npm run build failed; see /tmp/trade-living-build.log"
fi

section "Longbridge Terminal"
if command -v longbridge >/dev/null 2>&1; then
  pass "longbridge found at $(command -v longbridge)"
  if longbridge check >/tmp/trade-living-longbridge-check.log 2>&1; then
    pass "longbridge check"
    sed -n '1,12p' /tmp/trade-living-longbridge-check.log
  else
    fail "longbridge check failed; see /tmp/trade-living-longbridge-check.log"
    sed -n '1,20p' /tmp/trade-living-longbridge-check.log
  fi
else
  fail "longbridge CLI is not installed or not on PATH"
fi

section "Longbridge SDK auth"
if [ -n "${LONGBRIDGE_APP_KEY:-}" ] && [ -n "${LONGBRIDGE_APP_SECRET:-}" ] && [ -n "${LONGBRIDGE_ACCESS_TOKEN:-}" ]; then
  pass "SDK API key env vars are configured"
elif [ -d "$HOME/.longbridge/openapi/tokens" ] && [ "$(find "$HOME/.longbridge/openapi/tokens" -type f 2>/dev/null | wc -l | tr -d ' ')" != "0" ]; then
  pass "OAuth token cache exists at ~/.longbridge/openapi/tokens"
else
  warn "No SDK API key env vars or OAuth token cache found"
fi

section "Option quote providers"
if [ -n "${TRADIER_TOKEN:-}" ]; then
  pass "TRADIER_TOKEN configured"
else
  warn "TRADIER_TOKEN not configured; Tradier option enrichment unavailable"
fi

if [ -n "${MARKETDATA_TOKEN:-}" ]; then
  pass "MARKETDATA_TOKEN configured"
else
  warn "MARKETDATA_TOKEN not configured; MarketData authenticated enrichment unavailable"
fi

section "CLI smoke"
if node dist/cli.js portfolio --json >/tmp/trade-living-portfolio-smoke.json 2>&1; then
  pass "offline portfolio smoke"
else
  fail "offline portfolio smoke failed; see /tmp/trade-living-portfolio-smoke.json"
fi

if [ "$failures" -eq 0 ]; then
  printf '\nPreflight complete: PASS\n'
else
  printf '\nPreflight complete: FAIL (%s failure(s))\n' "$failures"
fi

exit "$failures"
