import type { VideoMetrics, Video, Platform, Tag } from '@/types'

export type Grade = 'S' | 'A' | 'B' | 'C'

export const GRADE_COLORS: Record<Grade, string> = {
  S: '#FBBF24',
  A: '#34D399',
  B: '#60A5FA',
  C: '#9CA3AF',
}

export const GRADE_LABELS: Record<Grade, string> = {
  S: '爆款',
  A: '优质',
  B: '普通',
  C: '待优化',
}

// 行业基准值（该值对应满分100）
const BENCHMARKS = {
  engagementRate: 0.10,  // 10% 互动率 = 100分
  saveRate:       0.05,  // 5%  收藏率 = 100分
  shareRate:      0.01,  // 1%  分享率 = 100分
}

function normalize(value: number, benchmark: number): number {
  return Math.min(100, (value / benchmark) * 100)
}

// 平台差异化互动率（0-1 小数）
export function calcPlatformEngagement(m: VideoMetrics): number {
  if (m.plays === 0) return 0
  switch (m.platform) {
    case 'douyin':
      return (m.likes + m.comments + m.shares) / m.plays
    case 'xiaohongshu':
      return (m.likes + m.comments + (m.saves ?? 0)) / m.plays
    case 'shipinhao':
      return (m.likes + m.comments + m.shares * 2) / m.plays
  }
}

export function calcSaveRate(m: VideoMetrics): number {
  if (!m.saves || m.plays === 0) return 0
  return m.saves / m.plays
}

export function calcShareRate(m: VideoMetrics): number {
  if (m.plays === 0) return 0
  return m.shares / m.plays
}

// 爆款综合评分（0-100）
// completionRate 存储的是百分比数值（0-100），不是小数
export function calcViralScore(m: VideoMetrics): number {
  const cr  = Math.min(100, m.completionRate ?? 0)
  const eng = normalize(calcPlatformEngagement(m), BENCHMARKS.engagementRate)
  const sav = normalize(calcSaveRate(m), BENCHMARKS.saveRate)
  const shr = normalize(calcShareRate(m), BENCHMARKS.shareRate)

  switch (m.platform) {
    case 'douyin':
      return +(cr * 0.40 + eng * 0.30 + shr * 0.30).toFixed(1)
    case 'xiaohongshu':
      return +(eng * 0.35 + sav * 0.40 + cr * 0.25).toFixed(1)
    case 'shipinhao':
      return +(cr * 0.35 + shr * 0.40 + eng * 0.25).toFixed(1)
  }
}

export function getGrade(score: number): Grade {
  if (score >= 80) return 'S'
  if (score >= 60) return 'A'
  if (score >= 40) return 'B'
  return 'C'
}

export interface EnrichedMetric extends VideoMetrics {
  videoTitle: string
  platformEngagement: number
  saveRate: number
  shareRate: number
  viralScore: number
  grade: Grade
}

export function enrichMetrics(
  metrics: VideoMetrics[],
  videos: Video[],
): EnrichedMetric[] {
  return metrics.map(m => {
    const video = videos.find(v => v.id === m.videoId)
    const engagement = calcPlatformEngagement(m)
    const score = calcViralScore(m)
    return {
      ...m,
      videoTitle: video?.title ?? '未知视频',
      platformEngagement: engagement,
      saveRate: calcSaveRate(m),
      shareRate: calcShareRate(m),
      viralScore: score,
      grade: getGrade(score),
    }
  })
}

export interface OverviewStats {
  avgCompletionRate: number | null
  avgEngagement: number
  viralCount: number
  bestThisMonth: EnrichedMetric | null
  bestPublishHour: number | null
  bestPlatform: Platform | null
}

export function calcOverviewStats(
  enriched: EnrichedMetric[],
  videos: Video[],
): OverviewStats {
  const withCR = enriched.filter(m => m.completionRate != null)
  const avgCompletionRate = withCR.length > 0
    ? withCR.reduce((s, m) => s + m.completionRate!, 0) / withCR.length
    : null

  const avgEngagement = enriched.length > 0
    ? enriched.reduce((s, m) => s + m.platformEngagement, 0) / enriched.length
    : 0

  const viralCount = enriched.filter(m => m.viralScore >= 80).length

  const now = new Date()
  const thisMonthItems = enriched.filter(m => {
    const d = new Date(m.dataDate)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const bestThisMonth = thisMonthItems.length > 0
    ? thisMonthItems.reduce((best, m) => m.viralScore > best.viralScore ? m : best)
    : null

  const hourScores: Record<number, number[]> = {}
  enriched.forEach(m => {
    const video = videos.find(v => v.id === m.videoId)
    const pub = video?.platforms.find(p => p.platform === m.platform)
    if (pub?.publishedAt) {
      const hour = new Date(pub.publishedAt).getHours()
      if (!hourScores[hour]) hourScores[hour] = []
      hourScores[hour].push(m.viralScore)
    }
  })
  let bestPublishHour: number | null = null
  let bestHourAvg = -1
  Object.entries(hourScores).forEach(([h, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avg > bestHourAvg) { bestHourAvg = avg; bestPublishHour = parseInt(h) }
  })

  const platformScores: Partial<Record<Platform, number[]>> = {}
  enriched.forEach(m => {
    if (!platformScores[m.platform]) platformScores[m.platform] = []
    platformScores[m.platform]!.push(m.viralScore)
  })
  let bestPlatform: Platform | null = null
  let bestPlatformAvg = -1
  ;(Object.entries(platformScores) as [Platform, number[]][]).forEach(([p, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avg > bestPlatformAvg) { bestPlatformAvg = avg; bestPlatform = p }
  })

  return { avgCompletionRate, avgEngagement, viralCount, bestThisMonth, bestPublishHour, bestPlatform }
}

// 构建平台雷达图数据（5维度，归一化到0-100）
export interface PlatformRadarData {
  subject: string
  douyin: number
  xiaohongshu: number
  shipinhao: number
  fullMark: number
}

export function buildPlatformRadarData(enriched: EnrichedMetric[]): PlatformRadarData[] {
  function avgForPlatform(platform: Platform) {
    const items = enriched.filter(m => m.platform === platform)
    if (items.length === 0) return { cr: 0, eng: 0, sav: 0, shr: 0, score: 0 }
    return {
      cr:    Math.min(100, items.reduce((s, m) => s + (m.completionRate ?? 0), 0) / items.length),
      eng:   Math.min(100, items.reduce((s, m) => s + m.platformEngagement, 0) / items.length / BENCHMARKS.engagementRate * 100),
      sav:   Math.min(100, items.reduce((s, m) => s + m.saveRate, 0) / items.length / BENCHMARKS.saveRate * 100),
      shr:   Math.min(100, items.reduce((s, m) => s + m.shareRate, 0) / items.length / BENCHMARKS.shareRate * 100),
      score: items.reduce((s, m) => s + m.viralScore, 0) / items.length,
    }
  }

  const dy = avgForPlatform('douyin')
  const xhs = avgForPlatform('xiaohongshu')
  const sph = avgForPlatform('shipinhao')

  return [
    { subject: '完播率',   douyin: +dy.cr.toFixed(1),    xiaohongshu: +xhs.cr.toFixed(1),    shipinhao: +sph.cr.toFixed(1),    fullMark: 100 },
    { subject: '互动率',   douyin: +dy.eng.toFixed(1),   xiaohongshu: +xhs.eng.toFixed(1),   shipinhao: +sph.eng.toFixed(1),   fullMark: 100 },
    { subject: '收藏率',   douyin: +dy.sav.toFixed(1),   xiaohongshu: +xhs.sav.toFixed(1),   shipinhao: +sph.sav.toFixed(1),   fullMark: 100 },
    { subject: '分享率',   douyin: +dy.shr.toFixed(1),   xiaohongshu: +xhs.shr.toFixed(1),   shipinhao: +sph.shr.toFixed(1),   fullMark: 100 },
    { subject: '综合评分', douyin: +dy.score.toFixed(1), xiaohongshu: +xhs.score.toFixed(1), shipinhao: +sph.score.toFixed(1), fullMark: 100 },
  ]
}

// 完播率区间分布
export interface CompletionBucket {
  label: string
  count: number
  avgScore: number
}

export function buildCompletionBuckets(enriched: EnrichedMetric[]): CompletionBucket[] {
  const buckets = [
    { label: '0-20%',  min: 0,  max: 20  },
    { label: '20-40%', min: 20, max: 40  },
    { label: '40-60%', min: 40, max: 60  },
    { label: '60-80%', min: 60, max: 80  },
    { label: '80%+',   min: 80, max: 101 },
  ]
  return buckets.map(b => {
    const items = enriched.filter(m => m.completionRate != null && m.completionRate >= b.min && m.completionRate < b.max)
    return {
      label: b.label,
      count: items.length,
      avgScore: items.length > 0 ? +(items.reduce((s, m) => s + m.viralScore, 0) / items.length).toFixed(1) : 0,
    }
  })
}

// 爆款标签云
export interface TagFreq {
  tag: Tag
  count: number
}

export function buildTagCloud(enriched: EnrichedMetric[], videos: Video[], tags: Tag[]): TagFreq[] {
  const highScoreItems = enriched.filter(m => m.viralScore >= 60)
  const freqMap: Record<string, number> = {}
  highScoreItems.forEach(m => {
    const video = videos.find(v => v.id === m.videoId)
    video?.tagIds.forEach(tagId => {
      freqMap[tagId] = (freqMap[tagId] ?? 0) + 1
    })
  })
  return Object.entries(freqMap)
    .map(([id, count]) => ({ tag: tags.find(t => t.id === id)!, count }))
    .filter(item => item.tag != null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
}
