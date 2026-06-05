# Video Cover Download Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local download support for video cover images in the video detail page.

**Architecture:** Keep the current cover storage model unchanged. Add a small file-system service helper that reads the stored cover image as a `File`, then let the detail page create a short-lived object URL and trigger the browser's native download behavior.

**Tech Stack:** React, TypeScript, Vite, File System Access API, existing `Button` and inline video detail UI.

---

### Task 1: Add Cover File Reader

**Files:**
- Modify: `src/services/fileSystem.ts`

**Steps:**
1. Add `readCoverFile(videoId, orientation, ext): Promise<File | null>` beside `readCoverImage`.
2. Reuse `getDirectoryHandle`, `getCoversDir`, and the existing filename convention.
3. Return `null` if the directory is unavailable, the cover file is missing, or file access fails.
4. Keep `readCoverImage` behavior unchanged so existing previews continue to work.

**Verification:**
- Run `npx tsc -b --pretty false`.

### Task 2: Add Detail Page Download Action

**Files:**
- Modify: `src/pages/Videos/VideoDetail.tsx`

**Steps:**
1. Import `readCoverFile`.
2. Add a filename sanitizer for video titles.
3. Add `handleCoverDownload(orientation)` in `VideoDetail`.
4. Pass `canDownload` and `onDownload` props into each `CoverSlot`.
5. In `CoverSlot`, show a compact “下载” action when a cover exists, alongside “更换” and “删除”.
6. Stop event propagation from the action buttons so the upload picker does not open unexpectedly.

**Verification:**
- Run `npm run lint`.
- Run `npx tsc -b --pretty false`.
- Run `npm run build`.
- Open a video detail page and confirm existing cover slots still render and download buttons only appear when a cover URL exists.

### Task 3: Document Results

**Files:**
- Modify: `tasks/todo.md`
- Modify: `tasks/lessons.md`

**Steps:**
1. Mark completed implementation and verification tasks.
2. Add review notes with commands run and any browser limitation.
3. Add a concise lesson about keeping file retrieval separate from preview URLs.
