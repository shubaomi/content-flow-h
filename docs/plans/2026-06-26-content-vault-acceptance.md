# Content Vault Integration Acceptance Report

## Scope

This report covers ContentFlow changes for:

- importing Psychelog production brief payloads
- creating Topic, Video, and Script records from a `contentFlowImport`
- exporting active production state shape
- documenting the local data directory used by sync automation

## Verification Passed

Command run on 2026-06-26:

```bash
npm run build
```

Result:

- TypeScript project build passed.
- Vite production build passed.

## Acceptance Status

Passed by build/static verification:

- `ContentFlowImportPayload` and `ContentFlowStateSnapshot` types compile.
- Import validation helper compiles.
- Store action `importProductionBrief` compiles.
- Settings page import/export UI compiles.

Manual browser verification still recommended after first real ContentFlow startup:

1. Select `E:\Projects\contentflow-data` as the browser data directory.
2. Paste a Psychelog `contentFlowImport` JSON payload.
3. Confirm Topic, Video, and Script records appear.
4. Export the snapshot and confirm active videos appear in the documented shape.

