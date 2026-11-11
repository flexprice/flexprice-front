# Reproduce the source inventories

Run from the repository root with TypeScript installed (normally after `npm ci`):

```sh
node .context/findings/frontend-audit-2026-09-19-public/scripts/inventory.cjs
python3 .context/findings/frontend-audit-2026-09-19-public/scripts/supplement.py
python3 .context/findings/frontend-audit-2026-09-19-public/scripts/report.py
```

If TypeScript is installed elsewhere, set `TYPESCRIPT_PATH` to its package path for the Node command. The scripts overwrite generated source inventories beside these documents. `supplement.py` also writes provenance for the checkout being inspected; the dated narrative report records the original audit baseline separately.

The browser harness, credentials, session storage, screenshots and live account/network exports are excluded from this public review copy. These static helpers do not contact the production app or create test data.
