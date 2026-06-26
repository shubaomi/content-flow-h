import type {
  AppData,
  ContentFlowImportPayload,
  ContentFlowStateSnapshot,
  Platform,
  ShootingFormat,
  Video,
  VideoStatus,
} from '@/types'
import { ALL_SHOOTING_FORMATS } from '@/types'

const formatSet = new Set<string>(ALL_SHOOTING_FORMATS)
const activeStatuses = new Set<VideoStatus>(['topic', 'scripting', 'review', 'filming', 'editing'])

export function parseContentFlowImport(input: unknown): ContentFlowImportPayload {
  const source = readRecord(input)
  const payload = readRecord(source.contentFlowImport ?? source)
  const topicTitle = readRequiredString(payload, 'topicTitle')
  const videoTitle = readRequiredString(payload, 'videoTitle')
  const scriptMarkdown = readRequiredString(payload, 'scriptMarkdown')
  const shootingFormats = readShootingFormats(payload.shootingFormats)

  return {
    topicTitle,
    videoTitle,
    videoDescription: readOptionalString(payload, 'videoDescription'),
    scriptMarkdown,
    thumbnailNote: readOptionalString(payload, 'thumbnailNote'),
    notes: readOptionalString(payload, 'notes'),
    shootingFormats,
  }
}

export function buildContentFlowSnapshot(data: AppData): ContentFlowStateSnapshot {
  const generatedAt = new Date().toISOString()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const activeVideos = data.videos
    .filter(video => activeStatuses.has(video.status))
    .map(video => ({
      id: video.id,
      title: video.title,
      status: video.status,
      topicId: video.topicId,
      scriptId: video.scriptId,
      nextAction: nextActionForStatus(video.status),
      shootingFormats: video.shootingFormats ?? [],
      platforms: uniquePlatforms(video),
      updatedAt: video.updatedAt,
    }))

  const recentlyPublished = data.videos
    .filter(video => video.status === 'published')
    .filter(video => Date.parse(video.updatedAt) >= sevenDaysAgo)
    .map(video => ({
      id: video.id,
      title: video.title,
      publishedAt: latestPublishedAt(video),
      platforms: uniquePlatforms(video),
      updatedAt: video.updatedAt,
    }))

  return {
    schemaVersion: '1.0',
    source: 'content-flow-h',
    generatedAt,
    summary: {
      readyToRecordCount: data.videos.filter(video => video.status === 'filming').length,
      scriptingCount: data.videos.filter(video => video.status === 'scripting' || video.status === 'review').length,
      editingCount: data.videos.filter(video => video.status === 'editing').length,
      publishedLast7Days: recentlyPublished.length,
    },
    activeVideos,
    stuckItems: activeVideos.filter(video => video.status === 'topic' || video.status === 'scripting'),
    recentlyPublished,
  }
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('导入内容必须是 JSON 对象')
  }
  return value as Record<string, unknown>
}

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`缺少必填字段：${key}`)
  }
  return value.trim()
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readShootingFormats(value: unknown): ShootingFormat[] {
  if (value === undefined) return ['talking']
  if (!Array.isArray(value)) throw new Error('shootingFormats 必须是数组')
  const formats = value.map(item => {
    if (typeof item !== 'string' || !formatSet.has(item)) {
      throw new Error(`不支持的拍摄格式：${String(item)}`)
    }
    return item as ShootingFormat
  })
  return formats.length > 0 ? formats : ['talking']
}

function nextActionForStatus(status: VideoStatus): string {
  switch (status) {
    case 'topic':
      return '确认选题角度'
    case 'scripting':
      return '完善口播稿'
    case 'review':
      return '检查口播稿和拍摄提示'
    case 'filming':
      return '今天录制'
    case 'editing':
      return '剪辑并准备发布'
    case 'published':
      return '记录数据和复盘'
    case 'archived':
      return '已归档'
  }
}

function uniquePlatforms(video: Video): Platform[] {
  return [...new Set(video.platforms.map(item => item.platform))]
}

function latestPublishedAt(video: Video): string | undefined {
  return video.platforms
    .map(item => item.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
}

