# Vault Execution Loop Implementation

## Planned Changes

1. Add `scripts/import-vault-packet.mjs`.
2. Add package script `vault:import-packet`.
3. Reuse the current local JSON data layout and avoid app-level refactors.
4. Add source markers in notes so repeat imports are idempotent.
5. Update README with the daily import command.

## Usage Shape

```powershell
$env:CONTENTFLOW_DATA_DIR="E:\Projects\contentflow-data"
$env:HONGRUN_CONTENT_VAULT_DIR="E:\Projects\hongrun-content-vault"
npm run vault:import-packet
```

Optional:

```powershell
npm run vault:import-packet -- --date 2026-06-27
```

## Validation

- Run the import against a copy or current local data.
- Run `npm run build`.
