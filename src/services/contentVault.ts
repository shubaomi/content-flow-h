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
  const commercialIntent = readCommercialIntent(payload.commercialIntent ?? source.commercialIntent)
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
    notes: appendCommercialIntentNote(readOptionalString(payload, 'notes'), commercialIntent),
    shootingFormats,
    commercialIntent,
  }
}

export function buildContentFlowSnapshot(data: AppData): ContentFlowStateSnapshot {
  const generatedAt = new Date().toISOString()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
  const activeVideos = data.videos
    .filter(video => activeStatuses.has(video.status))
    .map(toVideoEvidence)

  const recentlyPublished = data.videos
    .filter(video => video.status === 'published')
    .filter(video => Date.parse(video.updatedAt) >= sevenDaysAgo)
    .map(video => ({
      ...toVideoEvidence(video),
      publishedAt: latestPublishedAt(video),
    }))
  const recentlyClosed = data.videos
    .filter(video => video.status === 'published' || video.status === 'archived')
    .filter(video => Date.parse(video.updatedAt) >= fourteenDaysAgo)
    .map(toVideoEvidence)
  const platformStatusCounts = countPlatformStatuses(data.videos)

  return {
    schemaVersion: '1.1',
    source: 'content-flow-h',
    generatedAt,
    summary: {
      readyToRecordCount: data.videos.filter(video => video.status === 'filming').length,
      scriptingCount: data.videos.filter(video => video.status === 'scripting' || video.status === 'review').length,
      editingCount: data.videos.filter(video => video.status === 'editing').length,
      publishedLast7Days: recentlyPublished.length,
      activeVideoCount: activeVideos.length,
      pendingCoverCount: activeVideos.filter(video => !video.hasCoverPortrait && !video.hasCoverLandscape).length,
      platformStatusCounts,
    },
    activeVideos,
    stuckItems: activeVideos.filter(video => video.status === 'topic' || video.status === 'scripting'),
    recentlyPublished,
    recentlyClosed,
  }
}

function toVideoEvidence(video: Video) {
  return {
    id: video.id,
    title: video.title,
    status: video.status,
    topicId: video.topicId,
    scriptId: video.scriptId,
    importMarker: extractImportMarker(video.notes),
    importDate: extractImportDate(video.notes),
    nextAction: nextActionForStatus(video.status),
    shootingFormats: video.shootingFormats ?? [],
    platforms: uniquePlatforms(video),
    platformStatuses: video.platforms.map(item => ({
      platform: item.platform,
      status: item.status ?? 'published',
      publishedAt: item.publishedAt,
      url: item.url,
      skipReason: item.skipReason,
      violationReason: item.violation?.reason,
    })),
    thumbnailNote: video.thumbnailNote ?? '',
    hasCoverPortrait: Boolean(video.coverPortrait),
    hasCoverLandscape: Boolean(video.coverLandscape),
    notesSummary: summarizeNotes(video.notes),
    statusHistory: video.statusHistory.slice(-6),
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  }
}

function countPlatformStatuses(videos: Video[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const video of videos) {
    for (const item of video.platforms) {
      const key = `${item.platform}:${item.status ?? 'published'}`
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return counts
}

function extractImportMarker(notes?: string): string {
  return String(notes || '').match(/vault-import:[^\s]+/u)?.[0] ?? ''
}

function extractImportDate(notes?: string): string {
  return String(notes || '').match(/vault-import:contentflow-import\/(\d{4}-\d{2}-\d{2})\.json/u)?.[1] ?? ''
}

function summarizeNotes(notes?: string): string {
  return String(notes || '')
    .split(/\n+/u)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('Source: vault-import:'))
    .slice(0, 6)
    .join('\n')
    .slice(0, 800)
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

function readCommercialIntent(value: unknown): ContentFlowImportPayload['commercialIntent'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const intent = {
    stage: readStringValue(record.stage),
    targetAudience: readStringValue(record.targetAudience),
    audiencePain: readStringValue(record.audiencePain),
    businessHypothesis: readStringValue(record.businessHypothesis),
    cta: readStringValue(record.cta),
    relatedOffer: readStringValue(record.relatedOffer),
  }
  return Object.values(intent).some(Boolean) ? intent : undefined
}

function readStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function appendCommercialIntentNote(notes: string | undefined, intent: ContentFlowImportPayload['commercialIntent']): string | undefined {
  const text = String(notes || '').trim()
  if (!intent || text.includes('商业意图:')) return text || undefined
  const block = [
    '商业意图:',
    intent.stage ? `- 阶段: ${intent.stage}` : '',
    intent.targetAudience ? `- 目标人群: ${intent.targetAudience}` : '',
    intent.audiencePain ? `- 痛点: ${intent.audiencePain}` : '',
    intent.businessHypothesis ? `- 假设: ${intent.businessHypothesis}` : '',
    intent.cta ? `- CTA: ${intent.cta}` : '',
    intent.relatedOffer ? `- 关联产品/服务: ${intent.relatedOffer}` : '',
  ].filter(Boolean).join('\n')
  return [text, block].filter(Boolean).join('\n\n')
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

