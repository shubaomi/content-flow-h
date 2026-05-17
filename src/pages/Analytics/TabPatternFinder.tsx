import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, Cell,
} from 'recharts'
import type { EnrichedMetric } from './viralUtils'
import { GRADE_COLORS, buildCompletionBuckets, buildTagCloud } from './viralUtils'
import type { Video, Tag } from '@/types'

const tooltipStyle = {
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
}

// 完播率区间颜色
const BUCKET_COLORS = ['#EF4444', '#F97316', '#EAB308', '#34D399', '#10B981']

interface Props {
  enriched: EnrichedMetric[]
  videos: Video[]
  tags: Tag[]
}

export function TabPatternFinder({ enriched, videos, tags }: Props) {
  const hasCompletionData = enriched.some(m => m.completionRate != null)

  // 完播率分布
  const completionBuckets = buildCompletionBuckets(enriched)

  // 互动率 vs 完播率 相关性散点
  const correlationData = enriched
    .filter(m => m.completionRate != null)
    .map(m => ({
      x: +m.completionRate!.toFixed(1),
      y: +(m.platformEngagement * 100).toFixed(2),
      grade: m.grade,
      title: m.videoTitle,
    }))

  // 时长 vs 完播率
  const durationData = enriched
    .filter(m => m.completionRate != null)
    .map(m => {
      const video = videos.find(v => v.id === m.videoId)
      return video?.duration ? { x: video.duration, y: +m.completionRate!.toFixed(1), title: m.videoTitle } : null
    })
    .filter(Boolean) as { x: number; y: number; title: string }[]

  // 标签云
  const tagFreq = buildTagCloud(enriched, videos, tags)
  const maxCount = tagFreq.length > 0 ? tagFreq[0].count : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 完播率区间分布 */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>完播率区间分布</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>各完播率区间的视频数量（抖音基准：≥40% 优秀）</p>
        {!hasCompletionData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>录入完播率数据后显示</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>在视频详情页的数据记录中填写完播率字段</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height={200}>
              <BarChart data={completionBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload as { label: string; count: number; avgScore: number }
                    return (
                      <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                        <p style={{ fontWeight: 600 }}>{d.label}</p>
                        <p>视频数: {d.count} 条</p>
                        <p>平均评分: {d.avgScore}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" name="视频数" radius={[4, 4, 0, 0]}>
                  {completionBuckets.map((_, i) => (
                    <Cell key={i} fill={BUCKET_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>区间详情</p>
              {completionBuckets.map((b, i) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: BUCKET_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 56 }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{b.count} 条</span>
                  {b.count > 0 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>均分 {b.avgScore}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 相关性 + 时长分析 并排 */}
      <div style={{ display: 'grid', gridTemplateColumns: durationData.length >= 3 ? '1fr 1fr' : '1fr', gap: 16 }}>

        {/* 互动率 vs 完播率 相关性 */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>互动率 × 完播率相关性</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>颜色表示内容等级（探索高完播是否带来高互动）</p>
          {correlationData.length < 3 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>数据不足</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>需要至少 3 条有完播率的数据</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    type="number" dataKey="x" name="完播率" unit="%"
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    label={{ value: '完播率 %', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <YAxis
                    type="number" dataKey="y" name="互动率" unit="%"
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    label={{ value: '互动率 %', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const d = payload[0]?.payload as { x: number; y: number; title: string; grade: string }
                      return (
                        <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                          <p style={{ fontWeight: 600 }}>{d.title?.length > 15 ? d.title.slice(0, 15) + '…' : d.title}</p>
                          <p>完播率: {d.x}%</p>
                          <p>互动率: {d.y}%</p>
                        </div>
                      )
                    }}
                  />
                  {(['S', 'A', 'B', 'C'] as const).map(grade => {
                    const data = correlationData.filter(d => d.grade === grade)
                    return data.length > 0 ? (
                      <Scatter
                        key={grade}
                        name={`${grade}级`}
                        data={data}
                        fill={GRADE_COLORS[grade]}
                        fillOpacity={0.8}
                      />
                    ) : null
                  })}
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {(['S', 'A', 'B', 'C'] as const).map(g => {
                  const cnt = correlationData.filter(d => d.grade === g).length
                  return cnt > 0 ? (
                    <span key={g} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: GRADE_COLORS[g] }} />
                      <span style={{ color: 'var(--text-tertiary)' }}>{g}级 {cnt}条</span>
                    </span>
                  ) : null
                })}
              </div>
            </>
          )}
        </div>

        {/* 时长 vs 完播率（条件渲染） */}
        {durationData.length >= 3 && (
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>视频时长 × 完播率</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>探索视频时长与完播率的关系</p>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  type="number" dataKey="x" name="时长" unit="s"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  label={{ value: '时长（秒）', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'var(--text-tertiary)' }}
                />
                <YAxis
                  type="number" dataKey="y" name="完播率" unit="%"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  label={{ value: '完播率 %', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: 'var(--text-tertiary)' }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload as { x: number; y: number; title: string }
                    return (
                      <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                        <p style={{ fontWeight: 600 }}>{d.title?.length > 15 ? d.title.slice(0, 15) + '…' : d.title}</p>
                        <p>时长: {d.x}秒</p>
                        <p>完播率: {d.y}%</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={durationData} fill="#7C3AED" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 爆款标签云 */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>爆款内容标签云</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>评分≥60 的优质内容中高频出现的标签（越大越高频）</p>
        {tagFreq.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>暂无高分视频标签数据</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '8px 0' }}>
            {tagFreq.map(({ tag, count }) => {
              const ratio = count / maxCount
              const fontSize = 12 + ratio * 10
              const opacity = 0.5 + ratio * 0.5
              return (
                <span
                  key={tag.id}
                  style={{
                    fontSize,
                    opacity,
                    color: tag.color,
                    fontWeight: ratio > 0.6 ? 700 : 400,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: tag.color + '15',
                    border: `1px solid ${tag.color}30`,
                    cursor: 'default',
                    transition: 'opacity .15s',
                  }}
                  title={`出现 ${count} 次`}
                >
                  {tag.name} <span style={{ fontSize: fontSize - 3, opacity: 0.6 }}>{count}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
