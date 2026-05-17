import type { AppData } from '@/types'
import { defaultAppData } from './defaultData'

const IDB_DB = 'ip_content'
const IDB_STORE = 'handles'
const HANDLE_KEY = 'rootDir'

// ===== IndexedDB helpers for persisting directory handle =====

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB()
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
  })
}

// ===== Directory handle management =====

let _dirHandle: FileSystemDirectoryHandle | null = null

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (_dirHandle) return _dirHandle
  const stored = await getStoredHandle()
  if (stored) {
    // Re-verify permission
    const perm = await (stored as any).queryPermission?.({ mode: 'readwrite' })
    if (perm === 'granted') {
      _dirHandle = stored
      return _dirHandle
    }
    // Try to re-request
    const req = await (stored as any).requestPermission?.({ mode: 'readwrite' })
    if (req === 'granted') {
      _dirHandle = stored
      return _dirHandle
    }
  }
  return null
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
  _dirHandle = handle
  await storeHandle(handle)
  return handle
}

export async function clearStoredHandle(): Promise<void> {
  _dirHandle = null
  const db = await openIDB()
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(HANDLE_KEY)
    tx.oncomplete = () => resolve()
  })
}

// ===== data.json read / write =====

export async function readAppData(): Promise<AppData> {
  const dir = await getDirectoryHandle()
  if (!dir) throw new Error('NO_DIRECTORY')
  try {
    const fileHandle = await dir.getFileHandle('data.json', { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    const data = JSON.parse(text) as AppData
    // One-time migration: remove demo metrics seeded by old defaultData
    if (data.metrics?.some(m => m.videoId === 'vid_demo01')) {
      data.metrics = data.metrics.filter(m => m.videoId !== 'vid_demo01')
      await writeAppData(data)
    }
    // One-time migration: add checklistItems for existing installations
    if (!data.checklistItems) {
      data.checklistItems = defaultAppData().checklistItems
      await writeAppData(data)
    }
    // One-time migration: TopicStatus rename (idea→inspiration, approved→adopted, rejected→inspiration)
    const topicStatusMap: Record<string, string> = {
      idea: 'inspiration',
      approved: 'adopted',
      rejected: 'inspiration',
    }
    const needsTopicMigration = data.topics?.some(t => t.status in topicStatusMap)
    if (needsTopicMigration) {
      data.topics = data.topics.map(t => ({
        ...t,
        status: (topicStatusMap[t.status] ?? t.status) as typeof t.status,
      }))
      await writeAppData(data)
    }
    return data
  } catch {
    // First time — write defaults
    const data = defaultAppData()
    await writeAppData(data)
    return data
  }
}

export async function writeAppData(data: AppData): Promise<void> {
  const dir = await getDirectoryHandle()
  if (!dir) throw new Error('NO_DIRECTORY')
  const fileHandle = await dir.getFileHandle('data.json', { create: true })
  const writable = await (fileHandle as any).createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

// ===== scripts/<id>.md read / write =====

async function getScriptsDir(dir: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return dir.getDirectoryHandle('scripts', { create: true })
}

export async function readScriptContent(scriptId: string): Promise<string> {
  const dir = await getDirectoryHandle()
  if (!dir) return ''
  try {
    const scriptsDir = await getScriptsDir(dir)
    const fileHandle = await scriptsDir.getFileHandle(`${scriptId}.md`, { create: false })
    const file = await fileHandle.getFile()
    return file.text()
  } catch {
    return ''
  }
}

export async function writeScriptContent(scriptId: string, content: string): Promise<void> {
  const dir = await getDirectoryHandle()
  if (!dir) throw new Error('NO_DIRECTORY')
  const scriptsDir = await getScriptsDir(dir)
  const fileHandle = await scriptsDir.getFileHandle(`${scriptId}.md`, { create: true })
  const writable = await (fileHandle as any).createWritable()
  await writable.write(content)
  await writable.close()
}

export async function deleteScriptFile(scriptId: string): Promise<void> {
  const dir = await getDirectoryHandle()
  if (!dir) return
  try {
    const scriptsDir = await getScriptsDir(dir)
    await (scriptsDir as any).removeEntry(`${scriptId}.md`)
  } catch {
    // ignore
  }
}

export const isFileSystemSupported = (): boolean =>
  'showDirectoryPicker' in window
