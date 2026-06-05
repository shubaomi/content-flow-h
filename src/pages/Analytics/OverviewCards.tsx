import type { OverviewStats } from './viralUtils'
import { GRADE_COLORS, GRADE_LABELS } from './viralUtils'
import { PLATFORM_LABELS } from '@/types'

interface Props {
  stats: OverviewStats
}

interface CardProps {
  label: string
  value: string
  sub: string
  valueColor?: string
  badge?: { text: string; color: string }
}

function StatCard({ label, value, sub, valueColor, badge }: CardProps) {
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: valueColor ?? 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
            background: badge.color + '20', color: badge.color,
          }}>{badge.text}</span>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sub}</p>
    </div>
  )
}

export function OverviewCards({ stats }: Props) {
  const { avgCompletionRate, avgEngagement, viralCount, bestThisMonth, bestPublishHour, bestPlatform } = stats

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
      <StatCard
        label="平均完播率"
        value={avgCompletionRate != null ? `${avgCompletionRate.toFixed(1)}%` : '—'}
        sub={avgCompletionRate != null ? '有完播率记录' : '尚无完播率数据'}
        valueColor={avgCompletionRate != null ? (avgCompletionRate >= 40 ? 'var(--success)' : avgCompletionRate >= 20 ? 'var(--info)' : 'var(--text-primary)') : undefined}
      />
      <StatCard
        label="平均互动率"
        value={`${(avgEngagement * 100).toFixed(2)}%`}
        sub="平台差异化算法"
        valueColor={avgEngagement >= 0.1 ? 'var(--success)' : avgEngagement >= 0.05 ? 'var(--info)' : undefined}
      />
      <StatCard
        label="爆款视频数"
        value={viralCount.toString()}
        sub="综合评分 ≥ 80"
        valueColor={viralCount > 0 ? 'var(--warning)' : undefined}
      />
      <StatCard
        label="本月新高"
        value={bestThisMonth ? `${bestThisMonth.viralScore}分` : '—'}
        sub={bestThisMonth
          ? bestThisMonth.videoTitle.length > 10
            ? bestThisMonth.videoTitle.slice(0, 10) + '…'
            : bestThisMonth.videoTitle
          : '本月暂无数据'}
        badge={bestThisMonth ? { text: GRADE_LABELS[bestThisMonth.grade], color: GRADE_COLORS[bestThisMonth.grade] } : undefined}
      />
      <StatCard
        label="最佳发布时段"
        value={bestPublishHour != null ? `${String(bestPublishHour).padStart(2, '0')}:00` : '—'}
        sub={bestPublishHour != null ? '该时段平均评分最高' : '发布数据不足'}
      />
      <StatCard
        label="平台最优"
        value={bestPlatform ? PLATFORM_LABELS[bestPlatform] : '—'}
        sub={bestPlatform ? '平均爆款评分最高' : '暂无平台数据'}
      />
    </div>
  )
}
