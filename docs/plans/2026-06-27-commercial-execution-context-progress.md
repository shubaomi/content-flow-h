# Commercial Execution Context Progress

## Checklist

- [x] Requirements/design/implementation/progress docs created.
- [x] Import parser accepts optional commercial intent.
- [x] Commercial intent note block is appended.
- [x] Old import regression passes.
- [x] New import test passes.
- [x] Build passes.

## Running Notes

- 2026-06-27: Started ContentFlow commercial execution context pass.
- 2026-06-27: Updated both command-line and UI import parsers to accept optional `commercialIntent` from either the root packet or `contentFlowImport`.
- 2026-06-27: Appended a readable commercial intent block to imported notes; old payloads remain valid.
- 2026-06-27: Added UTF-8 BOM tolerant JSON parsing to the command-line import path.
- 2026-06-27: Temporary import tests passed for old payload, repeated old payload, and new payload with commercial intent. `node --check scripts/import-vault-packet.mjs` and `npm run build` passed.
