import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { EnrichedMetric } from './viralUtils'
import { GRADE_COLORS, GRADE_LABELS } from './viralUtils'
import { PLATFORM_LABELS } from '@/types'
import { formatNumber } from '@/utils/format'

const PLATFORM_COLORS: Record<string, string> = {
  douyin:      '#3B82F6',
  xiaohongshu: '#F43F5E',
  shipinhao:   '#10B981',
}

const rankColors = ['#FBBF24', '#9CA3AF', '#F97316']

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

function GradeBadge({ grade }: { grade: keyof typeof GRADE_COLORS }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      background: GRADE_COLORS[grade] + '22', color: GRADE_COLORS[grade],
      border: `1px solid ${GRADE_COLORS[grade]}44`,
    }}>{GRADE_LABELS[grade]}</span>
  )
}

// 自定义气泡 shape
function CustomBubble(props: Record<string, unknown>) {
  const cx = props.cx as number
  const cy = props.cy as number
  const payload = props.payload as { z: number }
  const fill = props.fill as string
  const r = Math.max(4, Math.min(18, Math.sqrt(payload.z ?? 100) / 60))
  return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={1} />
}

export function TabViralRadar({ enriched }: Props) {
  const sorted = [...enriched].sort((a, b) => b.viralScore - a.viralScore).slice(0, 15)

  const withCR = enriched.filter(m => m.completionRate != null)
  const scatterByPlatform = {
    douyin:      withCR.filter(m => m.platform === 'douyin').map(m => ({ x: +m.completionRate!.toFixed(1), y: +(m.platformEngagement * 100).toFixed(2), z: m.plays, title: m.videoTitle })),
    xiaohongshu: withCR.filter(m => m.platform === 'xiaohongshu').map(m => ({ x: +m.completionRate!.toFixed(1), y: +(m.platformEngagement * 100).toFixed(2), z: m.plays, title: m.videoTitle })),
    shipinhao:   withCR.filter(m => m.platform === 'shipinhao').map(m => ({ x: +m.completionRate!.toFixed(1), y: +(m.platformEngagement * 100).toFixed(2), z: m.plays, title: m.videoTitle })),
  }

  const pieData = [
    { name: `S级 ${GRADE_LABELS.S}`, value: enriched.filter(m => m.grade === 'S').length, color: GRADE_COLORS.S },
    { name: `A级 ${GRADE_LABELS.A}`, value: enriched.filter(m => m.grade === 'A').length, color: GRADE_COLORS.A },
    { name: `B级 ${GRADE_LABELS.B}`, value: enriched.filter(m => m.grade === 'B').length, color: GRADE_COLORS.B },
    { name: `C级 ${GRADE_LABELS.C}`, value: enriched.filter(m => m.grade === 'C').length, color: GRADE_COLORS.C },
  ].filter(d => d.value > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 排行榜 */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>爆款排行榜</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>按综合爆款评分排序（各平台使用差异化权重算法）</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((m, idx) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: idx < 3 ? GRADE_COLORS.S + '08' : 'transparent',
            }}>
              <span style={{
                fontSize: 14, fontWeight: 700, width: 24, textAlign: 'center', flexShrink: 0,
                color: rankColors[idx] ?? 'var(--text-tertiary)',
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.videoTitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: PLATFORM_COLORS[m.platform] + '22',
                    color: PLATFORM_COLORS[m.platform],
                    fontWeight: 600,
                  }}>{PLATFORM_LABELS[m.platform]}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>播放 {formatNumber(m.plays)}</span>
                </div>
              </div>
              {/* 指标列 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: 'center', minWidth: 48 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {m.completionRate != null ? `${m.completionRate.toFixed(0)}%` : '—'}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>完播率</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 52 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {(m.platformEngagement * 100).toFixed(2)}%
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>互动率</p>
                </div>
                {m.saveRate > 0 && (
                  <div style={{ textAlign: 'center', minWidth: 48 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {(m.saveRate * 100).toFixed(2)}%
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>收藏率</p>
                  </div>
                )}
                {m.shareRate > 0 && (
                  <div style={{ textAlign: 'center', minWidth: 48 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {(m.shareRate * 100).toFixed(2)}%
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>分享率</p>
                  </div>
                )}
                <div style={{ textAlign: 'center', minWidth: 44 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: GRADE_COLORS[m.grade] }}>{m.viralScore}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>评分</p>
                </div>
                <GradeBadge grade={m.grade} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 下方两栏：气泡图 + 饼图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 气泡图 */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>完播率 × 互动率分布</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>气泡大小 ∝ 播放量</p>
          {withCR.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>录入完播率数据后显示</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>在视频详情页的数据记录中填写完播率字段</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
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
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload as { x: number; y: number; z: number; title: string }
                    return (
                      <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                        <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.title}</p>
                        <p>完播率: {d.x}%</p>
                        <p>互动率: {d.y}%</p>
                        <p>播放量: {formatNumber(d.z)}</p>
                      </div>
                    )
                  }}
                />
                {Object.entries(scatterByPlatform).map(([platform, data]) =>
                  data.length > 0 ? (
                    <Scatter
                      key={platform}
                      name={PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]}
                      data={data}
                      fill={PLATFORM_COLORS[platform]}
                      shape={<CustomBubble />}
                    />
                  ) : null
                )}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 质量分布饼图 */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>内容质量分布</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>按综合爆款评分划分等级</p>
          {pieData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>暂无数据</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    outerRadius={80} innerRadius={40}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} 条`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.map(d => {
                  const pct = ((d.value / enriched.length) * 100).toFixed(0)
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.value}条</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{pct}%</span>
                    </div>
                  )
                })}
                {/* 评分说明 */}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(['S', 'A', 'B', 'C'] as const).map(g => (
                    <p key={g} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      <span style={{ color: GRADE_COLORS[g], fontWeight: 600 }}>{g}级</span>：{g === 'S' ? '≥80分' : g === 'A' ? '60-79分' : g === 'B' ? '40-59分' : '<40分'}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
