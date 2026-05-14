import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppData, Video, Topic, Script, Tag, VideoMetrics, AppSettings, VideoStatus, Platform, PlatformPublish } from '@/types'
import { now } from '@/utils/date'
import { videoId, topicId, scriptId, tagId, metricId } from '@/utils/id'
import { readAppData, writeAppData } from '@/services/fileSystem'

interface AppState {
  data: AppData | null
  loading: boolean
  saving: boolean
  error: string | null

  // Lifecycle
  loadData: () => Promise<void>
  saveData: () => Promise<void>

  // Videos
  addVideo: (v: Omit<Video, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>) => void
  updateVideo: (id: string, patch: Partial<Video>) => void
  deleteVideo: (id: string) => void
  moveVideo: (id: string, status: VideoStatus) => void

  // Topics
  addTopic: (t: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTopic: (id: string, patch: Partial<Topic>) => void
  deleteTopic: (id: string) => void

  // Scripts
  addScript: (s: Omit<Script, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => void
  updateScript: (id: string, patch: Partial<Script>) => void
  deleteScript: (id: string) => void

  // Tags
  addTag: (t: Omit<Tag, 'id' | 'createdAt'>) => void
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void

  // Platform entries
  setPlatformEntry: (videoId: string, platform: Platform, entry: Omit<PlatformPublish, 'platform'> | null) => void

  // Metrics
  addMetric: (m: Omit<VideoMetrics, 'id' | 'recordedAt'>) => void
  deleteMetric: (id: string) => void

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

const scheduleSave = (getState: () => AppState) => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => getState().saveData(), 600)
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    data: null,
    loading: false,
    saving: false,
    error: null,

    loadData: async () => {
      set(s => { s.loading = true; s.error = null })
      try {
        const data = await readAppData()
        // 去重：每个 videoId+platform 只保留 recordedAt 最新的一条
        const latest = new Map<string, typeof data.metrics[0]>()
        for (const m of data.metrics) {
          const key = `${m.videoId}:${m.platform}`
          const existing = latest.get(key)
          if (!existing || m.recordedAt > existing.recordedAt) latest.set(key, m)
        }
        data.metrics = Array.from(latest.values())
        set(s => { s.data = data; s.loading = false })
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', data.settings.theme)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        set(s => { s.loading = false; s.error = msg })
      }
    },

    saveData: async () => {
      const { data } = get()
      if (!data) return
      set(s => { s.saving = true })
      try {
        await writeAppData(data)
      } finally {
        set(s => { s.saving = false })
      }
    },

    // ---- Videos ----
    addVideo: (v) => {
      set(s => {
        if (!s.data) return
        const id = videoId()
        s.data.videos.push({
          ...v,
          id,
          statusHistory: [{ status: v.status, changedAt: now() }],
          createdAt: now(),
          updatedAt: now(),
        })
      })
      scheduleSave(get)
    },

    updateVideo: (id, patch) => {
      set(s => {
        if (!s.data) return
        const idx = s.data.videos.findIndex(v => v.id === id)
        if (idx === -1) return
        Object.assign(s.data.videos[idx], patch, { updatedAt: now() })
      })
      scheduleSave(get)
    },

    deleteVideo: (id) => {
      set(s => {
        if (!s.data) return
        s.data.videos = s.data.videos.filter(v => v.id !== id)
      })
      scheduleSave(get)
    },

    moveVideo: (id, status) => {
      set(s => {
        if (!s.data) return
        const v = s.data.videos.find(v => v.id === id)
        if (!v) return
        v.status = status
        v.statusHistory.push({ status, changedAt: now() })
        v.updatedAt = now()
      })
      scheduleSave(get)
    },

    // ---- Topics ----
    addTopic: (t) => {
      set(s => {
        if (!s.data) return
        s.data.topics.push({ ...t, id: topicId(), createdAt: now(), updatedAt: now() })
      })
      scheduleSave(get)
    },

    updateTopic: (id, patch) => {
      set(s => {
        if (!s.data) return
        const idx = s.data.topics.findIndex(t => t.id === id)
        if (idx === -1) return
        Object.assign(s.data.topics[idx], patch, { updatedAt: now() })
      })
      scheduleSave(get)
    },

    deleteTopic: (id) => {
      set(s => {
        if (!s.data) return
        s.data.topics = s.data.topics.filter(t => t.id !== id)
      })
      scheduleSave(get)
    },

    // ---- Scripts ----
    addScript: (s_) => {
      set(s => {
        if (!s.data) return
        s.data.scripts.push({ ...s_, id: scriptId(), version: 1, createdAt: now(), updatedAt: now() })
      })
      scheduleSave(get)
    },

    updateScript: (id, patch) => {
      set(s => {
        if (!s.data) return
        const idx = s.data.scripts.findIndex(sc => sc.id === id)
        if (idx === -1) return
        const sc = s.data.scripts[idx]
        Object.assign(sc, patch, { version: sc.version + 1, updatedAt: now() })
      })
      scheduleSave(get)
    },

    deleteScript: (id) => {
      set(s => {
        if (!s.data) return
        s.data.scripts = s.data.scripts.filter(sc => sc.id !== id)
      })
      scheduleSave(get)
    },

    // ---- Tags ----
    addTag: (t) => {
      set(s => {
        if (!s.data) return
        s.data.tags.push({ ...t, id: tagId(), createdAt: now() })
      })
      scheduleSave(get)
    },

    updateTag: (id, patch) => {
      set(s => {
        if (!s.data) return
        const idx = s.data.tags.findIndex(t => t.id === id)
        if (idx === -1) return
        Object.assign(s.data.tags[idx], patch)
      })
      scheduleSave(get)
    },

    deleteTag: (id) => {
      set(s => {
        if (!s.data) return
        s.data.tags = s.data.tags.filter(t => t.id !== id)
        s.data.videos.forEach(v => { v.tagIds = v.tagIds.filter(tid => tid !== id) })
        s.data.topics.forEach(t => { t.tagIds = t.tagIds.filter(tid => tid !== id) })
        s.data.scripts.forEach(sc => { sc.tagIds = sc.tagIds.filter(tid => tid !== id) })
      })
      scheduleSave(get)
    },

    // ---- Platform entries ----
    setPlatformEntry: (videoId, platform, entry) => {
      set(s => {
        if (!s.data) return
        const video = s.data.videos.find(v => v.id === videoId)
        if (!video) return
        video.platforms = video.platforms.filter(p => p.platform !== platform)
        if (entry !== null) {
          video.platforms.push({ platform, ...entry })
        }
        video.updatedAt = now()
      })
      scheduleSave(get)
    },

    // ---- Metrics ----
    addMetric: (m) => {
      set(s => {
        if (!s.data) return
        const idx = s.data.metrics.findIndex(x => x.videoId === m.videoId && x.platform === m.platform)
        const entry = { ...m, id: metricId(), recordedAt: now() }
        if (idx !== -1) {
          s.data.metrics[idx] = entry
        } else {
          s.data.metrics.push(entry)
        }
      })
      scheduleSave(get)
    },

    deleteMetric: (id) => {
      set(s => {
        if (!s.data) return
        s.data.metrics = s.data.metrics.filter(m => m.id !== id)
      })
      scheduleSave(get)
    },

    // ---- Settings ----
    updateSettings: (patch) => {
      set(s => {
        if (!s.data) return
        Object.assign(s.data.settings, patch)
        if (patch.theme) {
          document.documentElement.setAttribute('data-theme', patch.theme)
        }
      })
      scheduleSave(get)
    },
  }))
)
