# AGENTS.md

Trade Living CLI is a TypeScript trading analysis workbench for market structure, Triple Screen analysis, momentum, risk, and trade-plan quality scoring.

## Startup Workflow

Before writing code:

1. Confirm working directory with `pwd`.
2. Read this file completely.
3. Read `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`.
4. Run `./init.sh` to verify the baseline when dependencies are available.
5. Read `feature_list.json` and pick exactly one unfinished feature.
6. Review recent context in `progress.md` and `session-handoff.md`.

If baseline verification is failing, fix that before adding new product scope.

## Working Rules

- One feature at a time: work from `feature_list.json`.
- Analysis only: do not add automatic order placement or trade execution.
- Keep Longbridge access behind adapters; domain logic must be testable without network or credentials.
- Prefer deterministic indicator and risk functions with focused unit tests.
- Verification is required before claiming done.
- Update `progress.md` and `feature_list.json` before ending a session.

## Required Artifacts

- `feature_list.json`: feature state tracker and scope source of truth.
- `progress.md`: session continuity log.
- `session-handoff.md`: restart notes for longer or interrupted sessions.
- `init.sh`: standard install, type-check, test, and build path.
- `docs/PRODUCT.md`: product intent and command behavior.
- `docs/ARCHITECTURE.md`: module map and boundaries.

## Definition of Done

A feature is done only when all of the following are true:

- [ ] Target behavior is implemented.
- [ ] Unit tests or CLI smoke coverage exist for meaningful behavior.
- [ ] `npm run check`, `npm test`, and `npm run build` pass.
- [ ] Evidence is recorded in `feature_list.json` or `progress.md`.
- [ ] The repository remains restartable through `./init.sh`.

## Verification Commands

```bash
./init.sh
npm run check
npm test
npm run build
npm run dev -- analyze AAPL.US --pretty
```

## End of Session

Before ending:

1. Update `progress.md`.
2. Update the active feature in `feature_list.json`.
3. Record blockers, risks, and verification evidence.
4. Leave a clear next action in `session-handoff.md`.
5. Commit only when the work is in a safe, coherent state.
