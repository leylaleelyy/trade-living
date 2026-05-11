#!/bin/bash
set -euo pipefail

echo "=== Trade Living CLI initialization ==="

echo "=== Installing dependencies ==="
npm install

echo "=== Type check ==="
npm run check

echo "=== Tests ==="
npm test

echo "=== Build ==="
npm run build

echo "=== Verification complete ==="
echo "Next: read feature_list.json and work on exactly one unfinished feature."
