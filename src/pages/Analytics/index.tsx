import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatNumber, calcEngagement } from '@/utils/format'
import type { Platform } from '@/types'
import { PLATFORM_LABELS } from '@/types'

type TabId = 'trends' | 'top' | 'platforms'

export function Analytics() {
  const videos = useAppStore(s => s.data?.videos ?? [])
  const metrics = useAppStore(s => s.data?.metrics ?? [])
  const [tab, setTab] = useState<TabId>('trends')

  const enriched = useMemo(() => metrics.map(m => {
    const video = videos.find(v => v.id === m.videoId)
    return {
      ...m,
      videoTitle: video?.title ?? '未知视频',
      engagement: calcEngagement(m.likes, m.comments, m.shares, m.plays),
    }
  }), [metrics, videos])

  const topVideos = useMemo(() => {
    const byVideo: Record<string, { title: string; maxEngagement: number; totalPlays: number; platform: Platform }> = {}
    enriched.forEach(m => {
      if (!byVideo[m.videoId] || m.engagement > byVideo[m.videoId].maxEngagement) {
        byVideo[m.videoId] = {
          title: m.videoTitle,
          maxEngagement: m.engagement,
          totalPlays: m.plays,
          platform: m.platform,
        }
      }
    })
    return Object.entries(byVideo)
      .sort((a, b) => b[1].maxEngagement - a[1].maxEngagement)
      .slice(0, 10)
  }, [enriched])

  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; plays: number; count: number }> = {}
    enriched.forEach(m => {
      const d = m.dataDate.slice(0, 10)
      if (!byDate[d]) byDate[d] = { date: d, plays: 0, count: 0 }
      byDate[d].plays += m.plays
      byDate[d].count++
    })
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  }, [enriched])

  const platformData = useMemo(() => {
    const byPlatform: Record<string, { platform: string; avgEngagement: number; totalPlays: number; count: number }> = {}
    enriched.forEach(m => {
      if (!byPlatform[m.platform]) {
        byPlatform[m.platform] = { platform: PLATFORM_LABELS[m.platform], avgEngagement: 0, totalPlays: 0, count: 0 }
      }
      byPlatform[m.platform].totalPlays += m.plays
      byPlatform[m.platform].avgEngagement += m.engagement
      byPlatform[m.platform].count++
    })
    return Object.values(byPlatform).map(p => ({
      ...p,
      avgEngagement: p.count > 0 ? +(p.avgEngagement / p.count).toFixed(2) : 0,
    }))
  }, [enriched])

  const totalPlays = enriched.reduce((sum, m) => sum + m.plays, 0)
  const avgEngagement = enriched.length > 0
    ? (enriched.reduce((sum, m) => sum + m.engagement, 0) / enriched.length).toFixed(2)
    : '0'
  const publishedCount = videos.filter(v => v.status === 'published').length

  const tabs: { id: TabId; label: string }[] = [
    { id: 'trends', label: '趋势分析' },
    { id: 'platforms', label: '平台对比' },
    { id: 'top', label: '爆款分析' },
  ]

  const tooltipStyle = {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '12px',
  }

  const rankColors = ['#FBBF24', '#9CA3AF', '#F97316']

  return (
    <PageContainer title="数据分析" subtitle={`${metrics.length} 条数据记录`}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: '累计播放量', value: formatNumber(totalPlays), sub: `${publishedCount} 条已发布视频` },
          { label: '平均互动率', value: `${avgEngagement}%`, sub: '(点赞+评论+分享)/播放' },
          { label: '数据记录数', value: metrics.length.toString(), sub: '手动录入的数据条目' },
        ].map(stat => (
          <div key={stat.label} style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{stat.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none', background: 'transparent',
              borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              marginBottom: -1, transition: 'color .1s',
            }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {metrics.length === 0 ? (
        <EmptyState
          title="暂无数据"
          description="在视频详情页录入平台数据后，这里将显示分析图表"
          action={<Button variant="secondary" size="sm" onClick={() => window.history.back()}>前往视频详情录入</Button>}
        />
      ) : (
        <>
          {tab === 'trends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>播放量趋势（近30天）</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={formatNumber} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatNumber(Number(v)), '播放量']} />
                    <Line type="monotone" dataKey="plays" stroke="#7C3AED" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === 'platforms' && (
            <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>各平台互动率对比</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}%`, '平均互动率']} />
                  <Bar dataKey="avgEngagement" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {platformData.sort((a, b) => b.totalPlays - a.totalPlays).map(p => (
                  <div key={p.platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.platform}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span>累计播放 {formatNumber(p.totalPlays)}</span>
                      <span style={{ fontWeight: 500, color: '#34D399' }}>{p.avgEngagement}% 互动率</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'top' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>按最高互动率排序，共 {topVideos.length} 条视频有数据</p>
              {topVideos.map(([id, v], idx) => (
                <div
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    borderRadius: 12, border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)', padding: 16,
                    transition: 'border-color .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, width: 28, textAlign: 'center', flexShrink: 0, color: rankColors[idx] ?? 'var(--text-tertiary)' }}>
                    #{idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span>{PLATFORM_LABELS[v.platform]}</span>
                      <span>播放 {formatNumber(v.totalPlays)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#34D399' }}>{v.maxEngagement}%</p>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>互动率</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
