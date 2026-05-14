export type Platform = 'douyin' | 'xiaohongshu' | 'shipinhao'

export type VideoStatus =
  | 'topic'
  | 'scripting'
  | 'review'
  | 'filming'
  | 'editing'
  | 'published'
  | 'archived'

export type TopicStatus = 'idea' | 'approved' | 'in_progress' | 'done' | 'rejected'

export type PlatformPublishStatus = 'published' | 'violated' | 'skipped'

export type ViolationCategory =
  | 'content'
  | 'copyright'
  | 'misleading'
  | 'spam'
  | 'policy'
  | 'other'

export interface ViolationInfo {
  category: ViolationCategory
  reason: string
  reportedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface PlatformPublish {
  platform: Platform
  status: PlatformPublishStatus
  publishedAt?: string
  url?: string
  platformVideoId?: string
  violation?: ViolationInfo
  skipReason?: string
}

export interface StatusHistoryEntry {
  status: VideoStatus
  changedAt: string
}

export interface Video {
  id: string
  title: string
  status: VideoStatus
  tagIds: string[]
  scriptId?: string
  topicId?: string
  statusHistory: StatusHistoryEntry[]
  platforms: PlatformPublish[]
  thumbnailNote?: string
  duration?: number
  description?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface Topic {
  id: string
  title: string
  description?: string
  status: TopicStatus
  tagIds: string[]
  inspiration?: string
  linkedVideoId?: string
  createdAt: string
  updatedAt: string
}

export interface Script {
  id: string
  videoId?: string
  topicId?: string
  title: string
  wordCount: number
  estimatedDuration: number
  tagIds: string[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface VideoMetrics {
  id: string
  videoId: string
  platform: Platform
  recordedAt: string
  dataDate: string
  plays: number
  likes: number
  comments: number
  shares: number
  saves?: number
  follows?: number
  completionRate?: number
}

export interface AppSettings {
  theme: 'dark' | 'light'
  defaultPlatforms: Platform[]
}

export interface AppData {
  version: string
  tags: Tag[]
  videos: Video[]
  topics: Topic[]
  metrics: VideoMetrics[]
  scripts: Script[]
  settings: AppSettings
}

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  topic: '选题',
  scripting: '写稿中',
  review: '待审核',
  filming: '拍摄中',
  editing: '剪辑中',
  published: '已发布',
  archived: '已归档',
}

export const VIDEO_STATUS_ORDER: VideoStatus[] = [
  'topic', 'scripting', 'review', 'filming', 'editing', 'published', 'archived',
]

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  idea: '想法',
  approved: '已批准',
  in_progress: '进行中',
  done: '已完成',
  rejected: '已放弃',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  shipinhao: '视频号',
}

export const ALL_PLATFORMS: Platform[] = ['douyin', 'xiaohongshu', 'shipinhao']

export const PLATFORM_STATUS_LABELS: Record<PlatformPublishStatus, string> = {
  published: '已发布',
  violated: '已违规',
  skipped: '已跳过',
}

export const PLATFORM_STATUS_COLORS: Record<PlatformPublishStatus, string> = {
  published: '#10B981',
  violated: '#EF4444',
  skipped: '#9CA3AF',
}

export const VIOLATION_CATEGORY_LABELS: Record<ViolationCategory, string> = {
  content: '内容违规',
  copyright: '版权问题',
  misleading: '虚假信息',
  spam: '广告营销',
  policy: '平台政策',
  other: '其他原因',
}
