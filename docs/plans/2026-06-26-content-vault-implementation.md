# Content Vault Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ContentFlow import/export contracts that connect local video production state to `hongrun-content-vault`.

**Architecture:** Keep ContentFlow local-first. Add pure validation and transformation helpers first, then wire them into store actions and a small Settings UI entry. The browser data directory remains authoritative.

**Tech Stack:** React 19, TypeScript, Zustand, Web FileSystem API, Vite.

---

### Task 1: Define Import And Snapshot Types

**Files:**
- Modify: `src/types/index.ts`

**Steps:**

1. Add `ContentFlowImportPayload`.
2. Add `ContentFlowStateSnapshot`.
3. Reuse existing `ShootingFormat`, `VideoStatus`, and `Platform` unions.
4. Run `npm run build`.

**Acceptance:**

- Types compile without runtime changes.

### Task 2: Add Import Validation Helpers

**Files:**
- Create: `src/services/contentVault.ts`

**Steps:**

1. Implement `parseContentFlowImport(input: unknown)`.
2. Validate required string fields.
3. Validate `shootingFormats`.
4. Return a typed payload or throw a readable `Error`.
5. Add `buildContentFlowSnapshot(data: AppData)`.
6. Run `npm run build`.

**Acceptance:**

- Helper is pure and does not touch FileSystem.
- Unsupported formats are rejected.

### Task 3: Add Store Action For Import

**Files:**
- Modify: `src/store/appStore.ts`

**Steps:**

1. Add `importProductionBrief(payload)`.
2. Create Topic, Video, and Script ids.
3. Link records through `topicId`, `scriptId`, and `videoId`.
4. Save app data.
5. Write script Markdown through existing script file service.
6. Run `npm run build`.

**Acceptance:**

- Imported video appears in the `review` status when script text exists.
- Script can be opened in the Scripts page.

### Task 4: Add Manual Import UI

**Files:**
- Modify: `src/pages/Settings/index.tsx`

**Steps:**

1. Add a textarea for pasted Psychelog `contentFlowImport` JSON.
2. Add an import button.
3. Show success or error state.
4. Keep UI small and inside Settings.
5. Run `npm run build`.

**Acceptance:**

- User can paste JSON and import without leaving the browser app.

### Task 5: Add Snapshot Export UI

**Files:**
- Modify: `src/pages/Settings/index.tsx`
- Modify: `src/services/contentVault.ts`

**Steps:**

1. Build snapshot from current store data.
2. Offer copy-to-clipboard or download `contentflow-active.json`.
3. Do not write directly to GitHub.
4. Run `npm run build`.

**Acceptance:**

- Exported JSON validates against the documented snapshot contract.

### Task 6: Verification

**Commands:**

```bash
npm run build
```

**Manual Checks:**

1. Choose a ContentFlow data directory.
2. Paste a valid sample `contentFlowImport`.
3. Confirm Topic, Video, Script, and script Markdown are created.
4. Export snapshot.
5. Confirm active imported video appears in `state/contentflow-active.json` shape.

