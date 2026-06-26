# Local Data Directory Setup

## Purpose

ContentFlow uses the browser File System Access API. The selected directory is the local source of truth for:

- `videos.json`
- `topics.json`
- `scripts.json`
- `scripts/<scriptId>.md`
- `covers/`

The local sync script in `hongrun-content-vault` reads the same directory through the `CONTENTFLOW_DATA_DIR` environment variable to export `state/contentflow-active.json`.

## Recommended Local Directory

```text
E:\Projects\contentflow-data
```

This directory has already been prepared for local use.

## Required User Action In Browser

When starting ContentFlow for the first time:

1. Open ContentFlow.
2. Choose the local data directory.
3. Select:

```text
E:\Projects\contentflow-data
```

4. Keep using this directory on the same machine.

## Environment Variable

The local sync system expects:

```powershell
CONTENTFLOW_DATA_DIR=E:\Projects\contentflow-data
```

The current Windows user environment has been configured with this value.

## Verification

Run from `hongrun-content-vault`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\sync-local.ps1
```

Expected:

- If ContentFlow has not been used yet, `state/contentflow-active.json` is exported with empty lists.
- After ContentFlow has videos, the file includes active production items.

