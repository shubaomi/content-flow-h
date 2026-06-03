# Video Relations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add explicit video-to-video relations with a freeform note so users can connect retries, remakes, viral follow-ups, and variant shoots.

**Architecture:** Store relations in a separate `videoRelations` collection on `AppData`, persisted as `videoRelations.json`. The UI reads relations bidirectionally by matching either endpoint, while store actions enforce no self-links, no duplicate pairs, and cleanup on video deletion.

**Tech Stack:** React, TypeScript, Zustand with Immer, browser File System Access API, Vite.

---

### Task 1: Add Types And ID Generator

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/id.ts`

**Step 1: Add the relation type**

In `src/types/index.ts`, add:

```ts
export interface VideoRelation {
  id: string
  fromVideoId: string
  toVideoId: string
  note?: string
  createdAt: string
  updatedAt: string
}
```

Then add `videoRelations: VideoRelation[]` to `AppData`.

**Step 2: Add relation ID helper**

In `src/utils/id.ts`, add:

```ts
export const videoRelationId = () => `rel_${nanoid(10)}`
```

Match the file's existing ID helper style.

**Step 3: Verify types**

Run: `npx tsc -b --pretty false`

Expected: Type errors appear in data construction and persistence until later tasks fill `videoRelations`.

---

### Task 2: Persist `videoRelations`

**Files:**
- Modify: `src/services/defaultData.ts`
- Modify: `src/services/fileSystem.ts`

**Step 1: Update default data**

In `defaultAppData()`, include:

```ts
videoRelations: [],
```

Keep demo relations empty to avoid sample noise.

**Step 2: Read and write the new JSON file**

In `writeSplitAppData()`, add:

```ts
writeSingleFile(dir, 'videoRelations.json', data.videoRelations),
```

In `readSplitAppData()`, read:

```ts
readJsonFile(dir, 'videoRelations.json', [] as AppData['videoRelations'])
```

Return `videoRelations` in the assembled `AppData`.

**Step 3: Handle old `data.json` migration**

In `migrateToSplitFormat()`, before writing split data, normalize:

```ts
const migratedData = { ...oldData, videoRelations: oldData.videoRelations ?? [] }
await writeSplitAppData(dir, migratedData)
```

**Step 4: Verify persistence type safety**

Run: `npx tsc -b --pretty false`

Expected: Any remaining errors point to store or app data construction only.

---

### Task 3: Add Store Actions

**Files:**
- Modify: `src/store/appStore.ts`

**Step 1: Import types and ID helper**

Add `VideoRelation` to the type import if needed, and import `videoRelationId` from `src/utils/id.ts`.

**Step 2: Extend `AppState`**

Add:

```ts
addVideoRelation: (fromVideoId: string, toVideoId: string, note?: string) => void
updateVideoRelation: (id: string, note: string | undefined) => void
deleteVideoRelation: (id: string) => void
```

**Step 3: Implement duplicate detection**

Add a local helper:

```ts
const isSameVideoPair = (relation: VideoRelation, a: string, b: string) =>
  (relation.fromVideoId === a && relation.toVideoId === b) ||
  (relation.fromVideoId === b && relation.toVideoId === a)
```

**Step 4: Implement add/update/delete**

`addVideoRelation` should:

- Return if `fromVideoId === toVideoId`.
- Return if either video does not exist.
- Return if a relation already exists for the pair.
- Push a new relation with trimmed note or `undefined`.
- Schedule save.

`updateVideoRelation` should:

- Find the relation.
- Trim note.
- Delete `note` when blank.
- Update `updatedAt`.
- Schedule save.

`deleteVideoRelation` should:

- Filter by ID.
- Schedule save.

**Step 5: Clean relations when deleting videos**

Inside `deleteVideo(id)`, also filter:

```ts
s.data.videoRelations = s.data.videoRelations.filter(
  r => r.fromVideoId !== id && r.toVideoId !== id,
)
```

**Step 6: Verify store typing**

Run: `npx tsc -b --pretty false`

Expected: PASS or only UI-related missing usages if introduced in parallel.

---

### Task 4: Build Video Detail UI

**Files:**
- Modify: `src/pages/Videos/VideoDetail.tsx`

**Step 1: Read relation data and actions**

Add selectors for:

```ts
const videoRelations = useAppStore(s => s.data?.videoRelations ?? [])
const addVideoRelation = useAppStore(s => s.addVideoRelation)
const updateVideoRelation = useAppStore(s => s.updateVideoRelation)
const deleteVideoRelation = useAppStore(s => s.deleteVideoRelation)
```

**Step 2: Derive related videos**

After `video` is available, derive:

```ts
const relatedRelations = videoRelations.filter(
  r => r.fromVideoId === video.id || r.toVideoId === video.id,
)
```

For each relation, find the other video ID.

**Step 3: Add local modal state**

Add:

```ts
const [relationModal, setRelationModal] = useState(false)
const [relationSearch, setRelationSearch] = useState('')
const [relationTargetId, setRelationTargetId] = useState('')
const [relationNote, setRelationNote] = useState('')
```

**Step 4: Insert “相关视频” section**

Place it after the existing “关联逐字稿” section and before “标签”.

Render:

- Section label: `相关视频`
- Empty state text: `暂无相关视频`
- Button: `关联视频`
- Existing relation cards with title, status badge, note, and actions `查看` / `移除`

Use existing `Button`, `StatusBadge`, and inline styles matching nearby sections.

**Step 5: Add relation modal**

Add a `Modal` with:

- Search `Input`
- Selectable list of candidate videos
- `Textarea` for optional note
- Footer buttons `取消` and `保存`

Candidates should exclude:

- Current video
- Already related videos

Search should match title case-insensitively.

On save:

```ts
addVideoRelation(video.id, relationTargetId, relationNote)
setRelationModal(false)
setRelationSearch('')
setRelationTargetId('')
setRelationNote('')
```

Disable save when no target is selected.

**Step 6: Verify the page compiles**

Run: `npx tsc -b --pretty false`

Expected: PASS.

---

### Task 5: Add Read-Only Summary To Kanban Drawer

**Files:**
- Modify: `src/pages/Kanban/VideoSlideOver.tsx`

**Step 1: Read relations**

Add:

```ts
const videos = useAppStore(s => s.data?.videos ?? [])
const videoRelations = useAppStore(s => s.data?.videoRelations ?? [])
```

Avoid shadowing the `video` prop.

**Step 2: Derive up to two related videos**

Filter relations containing `video.id`, find the other video from `videos`, and keep the first two.

**Step 3: Render below “关联逐字稿”**

If relations exist, render label `相关视频` with compact rows:

- Related video title
- Note summary when present

Clicking a row should navigate to `/videos/${relatedVideo.id}`.

**Step 4: Verify drawer typing**

Run: `npx tsc -b --pretty false`

Expected: PASS.

---

### Task 6: Run Full Verification And Document Results

**Files:**
- Modify: `tasks/todo.md`
- Modify: `tasks/lessons.md`

**Step 1: Run lint**

Run: `npm run lint`

Expected: PASS.

**Step 2: Run type check**

Run: `npx tsc -b --pretty false`

Expected: PASS.

**Step 3: Run build**

Run: `npm run build`

Expected: PASS.

**Step 4: Browser verify**

Run the app with the existing dev command:

```bash
npm run dev
```

Open `/videos/:id` with a real or demo video.

Manually verify:

- Add relation with note.
- Related card appears on current video.
- Related card appears from the other video's detail page.
- Duplicate relation cannot be created.
- Remove relation hides it from both videos.

**Step 5: Update task docs**

In `tasks/todo.md`, add review notes with exact commands run and observed results.

In `tasks/lessons.md`, add:

```md
- 视频之间的复拍/变体关系应独立于选题、逐字稿、视频的生产链关系存储，避免标题同步或流程状态误影响相关视频。
```

**Step 6: Final status**

Summarize changed files, verification commands, and any browser verification limits.
