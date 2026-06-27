# Vault Execution Loop Design

## Role

ContentFlow is the execution board. Psychelog decides the daily topic and writes `contentflow-import/YYYY-MM-DD.json`; ContentFlow turns that package into local work items.

## Input Contract

The import JSON contains:

- `topicTitle`
- `videoTitle`
- `videoDescription`
- `scriptMarkdown`
- `thumbnailNote`
- `notes`
- `shootingFormats`

The contract is already represented by `ContentFlowImportPayload` in `src/types/index.ts`.

## Import Strategy

The UI import remains the primary manual fallback. A new script import reads a vault file and local ContentFlow data directory, then:

- creates or reuses the topic by title,
- creates or updates a video for the package,
- creates or updates a script draft,
- writes the oral script markdown,
- tags notes with the source vault import path.

## Export Strategy

The existing vault script `export-contentflow-state.mjs` remains responsible for writing `state/contentflow-active.json`. The global control tower reads that exported state.
