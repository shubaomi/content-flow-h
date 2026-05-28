import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import type { VideoStatus } from '@/types'
import { VIDEO_STATUS_LABELS, VIDEO_STATUS_ORDER } from '@/types'
import { fromNow, formatDate } from '@/utils/date'
import { formatNumber, calcEngagement } from '@/utils/format'

export function Dashboard() {
  const navigate = useNavigate()
  const videos = useAppStore(s => s.data?.videos ?? [])
  const metrics = useAppStore(s => s.data?.metrics ?? [])
  const topics = useAppStore(s => s.data?.topics ?? [])
  const scripts = useAppStore(s => s.data?.scripts ?? [])

  const inProgress = useMemo(() =>
    videos.filter(v => v.status === 'filming' || v.status === 'editing'),
    [videos]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<VideoStatus, number> = {} as Record<VideoStatus, number>
    for (const s of VIDEO_STATUS_ORDER) {
      counts[s] = videos.filter(v => v.status === s).length
    }
    return counts
  }, [videos])

  const now = new Date()
  const thisMonth = videos.filter(v => {
    const d = new Date(v.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const recentActivity = useMemo(() => {
    const events = videos.flatMap(v =>
      v.statusHistory.map(h => ({ videoTitle: v.title, videoId: v.id, ...h }))
    )
    return events.sort((a, b) => b.changedAt.localeCompare(a.changedAt)).slice(0, 8)
  }, [videos])

  const top3 = useMemo(() => {
    const withEngagement = metrics.map(m => {
      const video = videos.find(v => v.id === m.videoId)
      return {
        ...m,
        videoTitle: video?.title ?? '未知',
        videoId: m.videoId,
        engagement: calcEngagement(m.likes, m.comments, m.shares, m.plays),
      }
    })
    const byVideo: Record<string, typeof withEngagement[0]> = {}
    withEngagement.forEach(m => {
      if (!byVideo[m.videoId] || m.engagement > byVideo[m.videoId].engagement) {
        byVideo[m.videoId] = m
      }
    })
    return Object.values(byVideo).sort((a, b) => b.engagement - a.engagement).slice(0, 3)
  }, [metrics, videos])

  const pendingTopics = topics.filter(t => t.status === 'inspiration' || t.status === 'adopted')

  const rankColors = ['#FBBF24', '#9CA3AF', '#F97316']

  return (
    <PageContainer title="概览" subtitle={`${formatDate(new Date().toISOString())} · ${videos.length} 条视频`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {inProgress.length > 0 && (
          <div style={{
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: 'var(--accent-subtle)',
            padding: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              进行中 · {inProgress.length} 条
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inProgress.map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/videos/${v.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                >
                  <StatusBadge status={v.status} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{fromNow(v.updatedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: '已发布', value: statusCounts.published, sub: '条视频', accent: true, path: '/videos' },
            { label: '本月新建', value: thisMonth.length, sub: '条视频', accent: false, path: '/kanban' },
            { label: '待处理选题', value: pendingTopics.length, sub: '个想法', accent: false, path: '/topics' },
            { label: '逐字稿', value: scripts.length, sub: '篇稿件', accent: false, path: '/scripts' },
          ].map(stat => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              style={{
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                padding: 16,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color .12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
            >
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{stat.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: stat.accent ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{stat.sub}</p>
            </button>
          ))}
        </div>

        {/* Pipeline */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>内容管道</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {VIDEO_STATUS_ORDER.filter(s => s !== 'archived').map((s, i, arr) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => navigate('/kanban')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'border-color .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{VIDEO_STATUS_LABELS[s]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{statusCounts[s]}</span>
                </button>
                {i < arr.length - 1 && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M5 2l3 3-3 3" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top performers */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>爆款 Top 3</p>
            {top3.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 0' }}>录入平台数据后显示</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {top3.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/videos/${m.videoId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, width: 20, color: rankColors[idx] ?? 'var(--text-tertiary)' }}>#{idx + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.videoTitle}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <PlatformIcon platform={m.platform} size={12} />
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{formatNumber(m.plays)} 播放</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#34D399', flexShrink: 0 }}>{m.engagement}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>最近动态</p>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 0' }}>暂无动态</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentActivity.map((event, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/videos/${event.videoId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{event.videoTitle}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>→ {VIDEO_STATUS_LABELS[event.status]}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }}>{fromNow(event.changedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
