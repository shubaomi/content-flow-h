import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend, Cell,
} from 'recharts'
import type { EnrichedMetric } from './viralUtils'
import { GRADE_COLORS, GRADE_LABELS, buildPlatformRadarData } from './viralUtils'
import type { Platform } from '@/types'
import { PLATFORM_LABELS } from '@/types'
import { formatNumber } from '@/utils/format'

const PLATFORM_COLORS: Record<Platform, string> = {
  douyin:      '#3B82F6',
  xiaohongshu: '#F43F5E',
  shipinhao:   '#10B981',
}

const tooltipStyle = {
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
}

interface Props {
  enriched: EnrichedMetric[]
}

// 各平台最佳视频卡片
function BestVideoCard({ platform, enriched }: { platform: Platform; enriched: EnrichedMetric[] }) {
  const items = enriched.filter(m => m.platform === platform)
  const best = items.length > 0 ? items.reduce((a, b) => b.viralScore > a.viralScore ? b : a) : null
  return (
    <div style={{
      flex: 1, borderRadius: 10, padding: 14,
      border: `1px solid ${PLATFORM_COLORS[platform]}44`,
      background: PLATFORM_COLORS[platform] + '08',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: PLATFORM_COLORS[platform] + '22', color: PLATFORM_COLORS[platform],
        }}>{PLATFORM_LABELS[platform]}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>最佳视频</span>
      </div>
      {best ? (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
            {best.videoTitle.length > 20 ? best.videoTitle.slice(0, 20) + '…' : best.videoTitle}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: GRADE_COLORS[best.grade] }}>{best.viralScore}</p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>综合评分</p>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(best.platformEngagement * 100).toFixed(2)}%</p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>互动率</p>
            </div>
            {best.completionRate != null && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{best.completionRate.toFixed(0)}%</p>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>完播率</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(best.plays)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>播放量</p>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
              background: GRADE_COLORS[best.grade] + '20', color: GRADE_COLORS[best.grade],
            }}>{GRADE_LABELS[best.grade]}</span>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>暂无数据</p>
      )}
    </div>
  )
}

// 完播率区间分布（抖音）
function CompletionDistChart({ items }: { items: EnrichedMetric[] }) {
  const withCR = items.filter(m => m.completionRate != null)
  if (withCR.length === 0) {
    return <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>无完播率数据</p>
  }
  const buckets = [
    { label: '<20%',   items: withCR.filter(m => m.completionRate! < 20) },
    { label: '20-40%', items: withCR.filter(m => m.completionRate! >= 20 && m.completionRate! < 40) },
    { label: '40-60%', items: withCR.filter(m => m.completionRate! >= 40 && m.completionRate! < 60) },
    { label: '60-80%', items: withCR.filter(m => m.completionRate! >= 60 && m.completionRate! < 80) },
    { label: '80%+',   items: withCR.filter(m => m.completionRate! >= 80) },
  ].map(b => ({ label: b.label, count: b.items.length }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={buckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} 条`]} />
        <Bar dataKey="count" name="视频数" fill={PLATFORM_COLORS.douyin} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 互动率 vs 收藏率散点（小红书）
function SaveScatterChart({ items }: { items: EnrichedMetric[] }) {
  const withSave = items.filter(m => m.saveRate > 0)
  if (withSave.length < 2) {
    return <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>收藏数据不足</p>
  }
  const data = withSave.map(m => ({
    x: +(m.platformEngagement * 100).toFixed(2),
    y: +(m.saveRate * 100).toFixed(2),
    title: m.videoTitle,
  }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis type="number" dataKey="x" name="互动率" unit="%" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
        <YAxis type="number" dataKey="y" name="收藏率" unit="%" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
        <Tooltip
          contentStyle={tooltipStyle}
          content={({ payload }) => {
            if (!payload?.length) return null
            const d = payload[0]?.payload as { x: number; y: number; title: string }
            return (
              <div style={{ ...tooltipStyle, padding: '6px 10px' }}>
                <p style={{ fontWeight: 600 }}>{d.title?.length > 15 ? d.title.slice(0, 15) + '…' : d.title}</p>
                <p>互动率: {d.x}%</p>
                <p>收藏率: {d.y}%</p>
              </div>
            )
          }}
        />
        <Scatter data={data} fill={PLATFORM_COLORS.xiaohongshu} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// 分享率区间分布（视频号）
function ShareDistChart({ items }: { items: EnrichedMetric[] }) {
  const buckets = [
    { label: '<0.5%', items: items.filter(m => m.shareRate < 0.005) },
    { label: '0.5-1%', items: items.filter(m => m.shareRate >= 0.005 && m.shareRate < 0.01) },
    { label: '1-2%',  items: items.filter(m => m.shareRate >= 0.01 && m.shareRate < 0.02) },
    { label: '2%+',   items: items.filter(m => m.shareRate >= 0.02) },
  ].map(b => ({ label: b.label, count: b.items.length }))
  if (items.length === 0) {
    return <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>暂无数据</p>
  }
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={buckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} 条`]} />
        <Bar dataKey="count" name="视频数" fill={PLATFORM_COLORS.shipinhao} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TabPlatformInsight({ enriched }: Props) {
  const radarData = buildPlatformRadarData(enriched)

  const platforms: Platform[] = ['douyin', 'xiaohongshu', 'shipinhao']
  const platformAvgScore = platforms.map(p => {
    const items = enriched.filter(m => m.platform === p)
    return {
      name: PLATFORM_LABELS[p],
      platform: p,
      avgScore: items.length > 0 ? +(items.reduce((s, m) => s + m.viralScore, 0) / items.length).toFixed(1) : 0,
      count: items.length,
    }
  }).filter(d => d.count > 0)

  const hasPlatformData = platforms.some(p => enriched.some(m => m.platform === p))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 三平台最佳视频卡片 */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>各平台最佳视频</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {platforms.map(p => <BestVideoCard key={p} platform={p} enriched={enriched} />)}
        </div>
      </div>

      {/* 雷达图 + 平台评分柱图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 三平台综合能力雷达图 */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>三平台综合能力对比</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>5 维度归一化得分（100分制）</p>
          {!hasPlatformData ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke="var(--border-subtle)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickCount={4} />
                {platforms.map(p => {
                  const hasData = enriched.some(m => m.platform === p)
                  return hasData ? (
                    <Radar
                      key={p}
                      name={PLATFORM_LABELS[p]}
                      dataKey={p}
                      stroke={PLATFORM_COLORS[p]}
                      fill={PLATFORM_COLORS[p]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ) : null
                })}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 平台综合评分柱图 */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>平台平均爆款评分</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>各平台视频综合评分均值</p>
          {platformAvgScore.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>暂无数据</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={platformAvgScore}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} 分`, '平均爆款评分']} />
                  <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                    {platformAvgScore.map((entry) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform as Platform]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {platformAvgScore.map(p => (
                  <div key={p.platform} style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: PLATFORM_COLORS[p.platform as Platform] }}>{p.avgScore}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{p.name} · {p.count}条</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 平台特有指标分析 */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>平台差异化指标</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>抖音看完播率分布 · 小红书看互动vs收藏 · 视频号看分享率分布</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: PLATFORM_COLORS.douyin, marginBottom: 8 }}>抖音 · 完播率分布</p>
            <CompletionDistChart items={enriched.filter(m => m.platform === 'douyin')} />
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>基准：≥40% 优秀，≥30% 合格</p>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: PLATFORM_COLORS.xiaohongshu, marginBottom: 8 }}>小红书 · 互动率 × 收藏率</p>
            <SaveScatterChart items={enriched.filter(m => m.platform === 'xiaohongshu')} />
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>基准：互动率≥10% 有爆款潜力</p>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: PLATFORM_COLORS.shipinhao, marginBottom: 8 }}>视频号 · 分享率分布</p>
            <ShareDistChart items={enriched.filter(m => m.platform === 'shipinhao')} />
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>基准：≥0.5% 佳，≥1% 强传播</p>
          </div>
        </div>
      </div>
    </div>
  )
}
