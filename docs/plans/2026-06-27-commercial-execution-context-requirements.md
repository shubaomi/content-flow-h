# Commercial Execution Context Requirements

## Goal

Keep ContentFlow focused on video execution while carrying enough commercial context from Psychelog to help editing, recording, and publishing decisions.

## Functional Requirements

- Continue importing `contentflow-import/YYYY-MM-DD.json` without duplicates.
- Preserve `commercialIntent` if it appears in the import payload.
- Surface commercial intent in video notes so the human can see why the video exists.
- Do not turn ContentFlow into a CRM or content strategy system.

## Acceptance Criteria

- Import script accepts old payloads and new payloads with `commercialIntent`.
- Imported video notes include a readable commercial intent block.
- Build still passes.
