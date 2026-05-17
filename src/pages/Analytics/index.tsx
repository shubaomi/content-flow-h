import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatNumber } from '@/utils/format'
import { PLATFORM_LABELS } from '@/types'
import { enrichMetrics, calcOverviewStats } from './viralUtils'
import { OverviewCards } from './OverviewCards'
import { TabViralRadar } from './TabViralRadar'
import { TabPlatformInsight } from './TabPlatformInsight'
import { TabPatternFinder } from './TabPatternFinder'

type TabId = 'trends' | 'platforms' | 'viral-radar' | 'platform-insight' | 'pattern'

const tabs: { id: TabId; label: string }[] = [
  { id: 'trends',           label: '趋势分析' },
  { id: 'platforms',        label: '平台对比' },
  { id: 'viral-radar',      label: '爆款雷达' },
  { id: 'platform-insight', label: '平台洞察' },
  { id: 'pattern',          label: '规律发现' },
]

export function Analytics() {
  const videos = useAppStore(s => s.data?.videos ?? [])
  const metrics = useAppStore(s => s.data?.metrics ?? [])
  const tags = useAppStore(s => s.data?.tags ?? [])
  const [tab, setTab] = useState<TabId>('trends')

  const enriched = useMemo(() => enrichMetrics(metrics, videos), [metrics, videos])
  const overviewStats = useMemo(() => calcOverviewStats(enriched, videos), [enriched, videos])

  // 趋势分析数据
  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; plays: number }> = {}
    enriched.forEach(m => {
      const d = m.dataDate.slice(0, 10)
      if (!byDate[d]) byDate[d] = { date: d, plays: 0 }
      byDate[d].plays += m.plays
    })
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  }, [enriched])

  // 平台对比数据
  const platformData = useMemo(() => {
    const byPlatform: Record<string, { platform: string; avgEngagement: number; totalPlays: number; count: number }> = {}
    enriched.forEach(m => {
      if (!byPlatform[m.platform]) {
        byPlatform[m.platform] = { platform: PLATFORM_LABELS[m.platform], avgEngagement: 0, totalPlays: 0, count: 0 }
      }
      byPlatform[m.platform].totalPlays += m.plays
      byPlatform[m.platform].avgEngagement += m.platformEngagement * 100
      byPlatform[m.platform].count++
    })
    return Object.values(byPlatform).map(p => ({
      ...p,
      avgEngagement: p.count > 0 ? +(p.avgEngagement / p.count).toFixed(2) : 0,
    }))
  }, [enriched])

  const totalPromotionCost = useMemo(() =>
    videos.reduce((sum, v) =>
      sum + v.platforms.reduce((s, p) => s + (p.promotionCost ?? 0), 0), 0)
  , [videos])

  const platformCostData = useMemo(() => {
    const byPlatform: Record<string, { label: string; cost: number }> = {
      douyin:      { label: PLATFORM_LABELS['douyin'],      cost: 0 },
      xiaohongshu: { label: PLATFORM_LABELS['xiaohongshu'], cost: 0 },
      shipinhao:   { label: PLATFORM_LABELS['shipinhao'],   cost: 0 },
    }
    videos.forEach(v => {
      v.platforms.forEach(p => {
        if (p.promotionCost) byPlatform[p.platform].cost += p.promotionCost
      })
    })
    return Object.entries(byPlatform)
      .filter(([, d]) => d.cost > 0)
      .map(([platform, d]) => ({ platform, ...d }))
  }, [videos])

  const tooltipStyle = {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '12px',
  }

  return (
    <PageContainer title="数据分析" subtitle={`${metrics.length} 条数据记录`}>
      {/* 概览 KPI 卡片 */}
      <OverviewCards stats={overviewStats} />

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
          )}

          {tab === 'platforms' && (
            <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>各平台互动率对比（平台差异化算法）</p>
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
                {[...platformData].sort((a, b) => b.totalPlays - a.totalPlays).map(p => (
                  <div key={p.platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.platform}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span>累计播放 {formatNumber(p.totalPlays)}</span>
                      <span style={{ fontWeight: 500, color: '#34D399' }}>{p.avgEngagement}% 互动率</span>
                    </div>
                  </div>
                ))}
              </div>
              {platformCostData.length > 0 && (
                <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>投放成本</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {platformCostData.map(p => (
                      <div key={p.platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>¥{p.cost.toLocaleString()}</span>
                      </div>
                    ))}
                    {platformCostData.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 2 }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>合计</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>¥{totalPromotionCost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'viral-radar' && <TabViralRadar enriched={enriched} />}
          {tab === 'platform-insight' && <TabPlatformInsight enriched={enriched} />}
          {tab === 'pattern' && <TabPatternFinder enriched={enriched} videos={videos} tags={tags} />}
        </>
      )}

    </PageContainer>
  )
}
