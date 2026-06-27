# Vault Execution Loop Requirements

## Goal

ContentFlow must become the local execution station for Psychelog's daily content package. It should consume the vault import contract, turn the morning packet into an actionable video item, and export enough state for the cloud control tower to know whether work is moving.

## Scope

- Keep the existing paste/import flow working.
- Add a scriptable import path for `contentflow-import/YYYY-MM-DD.json`.
- Avoid duplicate imports for the same daily package.
- Write local topic, video, script, and production notes in the existing data format.
- Continue exporting `state/contentflow-active.json` through the vault sync script.
- Document how ContentFlow fits into the global loop.

## Non-Goals

- Do not build a cloud-hosted ContentFlow.
- Do not auto-edit or auto-publish videos.
- Do not change the local data directory selection model.

## Success Criteria

- A user can import today's vault packet without manually copying JSON from the browser.
- Re-running the import does not create duplicate work items.
- Existing UI paste import still works.
- `npm run build` continues to pass.
