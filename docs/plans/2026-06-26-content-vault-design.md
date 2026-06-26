# Content Vault Integration Design

## Architecture

```text
Psychelog cloud
  -> writes production brief JSON into hongrun-content-vault

Local sync agent
  -> pulls hongrun-content-vault
  -> makes brief files available to ContentFlow

ContentFlow
  -> imports brief into local FileSystem data
  -> exports active production state summary
  -> local sync agent pushes summary back to vault
```

ContentFlow stays local-first and browser-driven. The browser FileSystem API remains the source of truth for local production data. The vault receives only portable summaries and handoff files.

## Data Ownership

ContentFlow writes:

```text
state/contentflow-active.json
```

ContentFlow reads:

```text
inbox/psychelog-production-briefs/*.json
packets/*.json
```

ContentFlow local directory continues to own:

```text
videos.json
videoRelations.json
topics.json
scripts.json
metrics.json
tags.json
checklists.json
settings.json
scripts/<scriptId>.md
covers/
```

## Import Flow

1. User opens Settings or a future Import page.
2. User pastes JSON or chooses a brief file.
3. ContentFlow validates `contentFlowImport`.
4. ContentFlow creates a Topic with status `adopted`.
5. ContentFlow creates a Video with status `scripting` or `review`.
6. ContentFlow creates a Script linked to the Video and Topic.
7. ContentFlow writes `scripts/<scriptId>.md`.
8. ContentFlow stores `thumbnailNote`, `description`, `notes`, and `shootingFormats`.

Initial status recommendation:

- If `scriptMarkdown` is non-empty, use `review`.
- If `scriptMarkdown` is empty, use `scripting`.

## Export Flow

The first implementation can expose an in-app export button. Later the local sync agent can call a CLI or read existing JSON files.

Export logic:

- include videos with status `topic`, `scripting`, `review`, `filming`, or `editing`
- include recently published videos from the last 7 days
- derive a short `nextAction` from status
- avoid including full script text

Status to action mapping:

```text
topic -> 确认选题角度
scripting -> 完善口播稿
review -> 检查口播稿和拍摄提示
filming -> 今天录制
editing -> 剪辑并准备发布
published -> 记录数据和复盘
```

## Validation

`contentFlowImport` validation:

- `topicTitle`, `videoTitle`, and `scriptMarkdown` are strings.
- `shootingFormats` must be known ContentFlow formats.
- `notes`, `thumbnailNote`, and `videoDescription` are optional strings.
- Unknown fields are ignored.
- Import must be idempotent only when a future `sourceId` exists. V1 does not guess duplicates by title.

## Failure Modes

- Invalid JSON: show parse error, no data written.
- Unsupported shooting format: show validation error, no data written.
- Script file write fails: roll back in-memory records before save.
- Directory permission missing: use the existing DirectorySetup flow.

## Security And Privacy

- Imported data is treated as untrusted text.
- Do not execute commands or resolve file paths from imported JSON.
- Do not auto-fetch remote images from prompts.
- Do not export private full scripts unless explicitly requested.

## Acceptance Evidence

- Build passes.
- A sample import creates the expected local records.
- Export file contains only concise production state and no raw private biography content.

