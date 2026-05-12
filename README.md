# Trade Living CLI

Trade Living CLI is a TypeScript command-line trading analysis workbench based on the Triple Screen Trading System.

It is designed for analysis and risk control only. It does not place trades.

## Quick Start

```bash
npm install
npm run check
npm test
npm run build
npm run dev -- analyze AAPL.US --pretty
```

## Commands

```bash
trade-living portfolio
trade-living init
trade-living init --channel telegram --telegram-chat-id 123456 --model-provider codex --daemon
trade-living init --yes --json --dry-run --channel telegram --telegram-chat-id 123456
trade-living daemon start --command "trade-living portfolio --json" --interval 300
trade-living daemon status
trade-living analyze AAPL.US
trade-living momentum AAPL.US
trade-living triple AAPL.US
trade-living force AAPL.US
trade-living risk AAPL.US --entry 210 --stop 201 --equity 100000
trade-living report
```

All commands are expected to support `--json`, `--markdown`, `--pretty`, and `--debug` as the implementation matures.

## Release

Publishing is automated through GitHub Actions.

1. Add an npm automation token as the repository secret `NPM_TOKEN`.
2. Update `package.json` version.
3. Commit the version change.
4. Create and push a matching semver tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow verifies type-check, tests, build, and package contents before running `npm publish --access public`.
