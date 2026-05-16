# Scripting Review Checklist Implementation Plan

**Goal:** Require a hook-optimization confirmation before moving a video from `scripting` to `review`.

**Architecture:** Add one focused dialog component under `src/pages/Kanban` and call it from the two existing Kanban transition paths. Keep state local to the Kanban board and slide-over because this is a transient gate, not persisted checklist data.

**Tech Stack:** React 19, TypeScript, Vite, existing `Modal` component.

---

### Task 1: Add The Dialog

**Files:**
- Create: `src/pages/Kanban/ScriptingReviewChecklistDialog.tsx`

**Steps:**
- Build a small modal with the video title, one checkbox, cancel action, and disabled confirm button until checked.
- Use the exact copy: `已完成开头优化（降低2～5秒跳出率）`.

### Task 2: Wire Kanban Drag Flow

**Files:**
- Modify: `src/pages/Kanban/index.tsx`

**Steps:**
- Add pending state for `scripting -> review`.
- In `onDragEnd`, open the dialog before `moveVideo` for that transition.
- On confirm, call `moveVideo(videoId, 'review')`.

### Task 3: Wire Slide-Over Flow

**Files:**
- Modify: `src/pages/Kanban/VideoSlideOver.tsx`

**Steps:**
- Add local dialog state.
- In the next-status button, open the dialog before moving `scripting -> review`.
- On confirm, call `moveVideo(video.id, 'review')` and close the slide-over.

### Task 4: Verify

**Commands:**
- `npm run build`

**Expected:**
- TypeScript and Vite build complete successfully.
