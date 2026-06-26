# Content Vault Integration Requirements

## Background

ContentFlow is the local short-video production cockpit. It owns video lifecycle, scripts, covers, platform publish records, and metrics. The daily content ecosystem needs ContentFlow to exchange a small, portable state summary with `hongrun-content-vault`, without requiring the cloud Psychelog service to access browser FileSystem handles or local databases.

## Goals

1. Export active video production state into a stable JSON snapshot.
2. Import Psychelog-generated production briefs into Topic, Video, Script, thumbnail notes, and production notes.
3. Keep large media files local and record only paths or prompts in the vault.
4. Allow the local machine to be offline; the cloud side should use the last exported snapshot.
5. Make future Windows to Mac migration possible by relying on JSON and Markdown files, not browser IndexedDB handles.

## Non-Goals

- Do not add cloud login or server deployment to ContentFlow.
- Do not make ContentFlow send Feishu reminders.
- Do not let Psychelog write directly into ContentFlow's working directory.
- Do not put raw video files into GitHub.

## Export Contract

ContentFlow owns:

```text
state/contentflow-active.json
```

Recommended shape:

```json
{
  "schemaVersion": "1.0",
  "source": "content-flow-h",
  "generatedAt": "2026-06-26T00:00:00.000Z",
  "summary": {
    "readyToRecordCount": 0,
    "scriptingCount": 0,
    "editingCount": 0,
    "publishedLast7Days": 0
  },
  "activeVideos": [
    {
      "id": "vid_x",
      "title": "string",
      "status": "scripting",
      "topicId": "topic_x",
      "scriptId": "script_x",
      "nextAction": "string",
      "shootingFormats": ["talking"],
      "platforms": ["shipinhao", "xiaohongshu"],
      "updatedAt": "2026-06-26T00:00:00.000Z"
    }
  ],
  "stuckItems": [],
  "recentlyPublished": []
}
```

Only concise summaries should be exported. Full script bodies already live in `scripts/<id>.md` inside the ContentFlow data directory and may be mirrored later by an explicit export.

## Import Contract

ContentFlow imports Psychelog handoff files:

```text
inbox/psychelog-production-briefs/*.json
packets/YYYY-MM-DD.json
```

The initial accepted `contentFlowImport` shape is the same as Psychelog production brief output:

```json
{
  "topicTitle": "string",
  "videoTitle": "string",
  "videoDescription": "string",
  "scriptMarkdown": "string",
  "thumbnailNote": "string",
  "notes": "string",
  "shootingFormats": ["talking"]
}
```

## User Stories

1. As the user, I want ContentFlow to export what is currently ready, blocked, or recently published, so tomorrow's cloud content packet can pick the right next action.
2. As the user, I want to import a Psychelog production brief without copying five fields manually, so the local production cockpit becomes usable faster.
3. As the user, I want imported records to remain editable in ContentFlow, so the brief is a starting point, not a locked AI output.
4. As the system owner, I want the export file to be small and stable, so it can be versioned in Git without noise.

## Acceptance Criteria

- A generated ContentFlow snapshot includes active videos grouped by production relevance.
- Importing a valid `contentFlowImport` creates one Topic, one Video, one Script, and writes script Markdown.
- Import rejects unsupported shooting formats with a visible error.
- Export and import do not modify unrelated videos.
- Existing `npm run build` still passes.

## Verification Commands

```bash
npm run build
```

Manual verification:

- Import one sample brief.
- Confirm the new video appears in Kanban.
- Confirm the script opens in Scripts.
- Confirm exporting state includes the new item.

