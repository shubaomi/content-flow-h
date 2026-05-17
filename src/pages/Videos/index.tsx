import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/StatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import type { VideoStatus } from '@/types'
import { VIDEO_STATUS_LABELS, VIDEO_STATUS_ORDER } from '@/types'

type PlatformFilter = 'violated' | 'skipped'
import { fromNow } from '@/utils/date'

export function Videos() {
  const navigate = useNavigate()
  const videos = useAppStore(s => s.data?.videos ?? [])
  const tags = useAppStore(s => s.data?.tags ?? [])
  const addVideo = useAppStore(s => s.addVideo)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<VideoStatus | 'all'>('all')
  const [filterPlatform, setFilterPlatform] = useState<PlatformFilter | null>(null)
  const [newModal, setNewModal] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', description: '' })

  const setVideoFilter = (s: VideoStatus | 'all') => { setFilterStatus(s); setFilterPlatform(null) }
  const setPlatformFilter = (f: PlatformFilter) => {
    setFilterPlatform(prev => prev === f ? null : f)
    setFilterStatus('all')
  }

  const violated = videos.filter(v => v.platforms.some(p => (p.status ?? 'published') === 'violated'))
  const skipped = videos.filter(v => v.platforms.some(p => (p.status ?? 'published') === 'skipped'))

  const filtered = useMemo(() => {
    let list = videos
    if (filterPlatform) {
      list = list.filter(v => v.platforms.some(p => (p.status ?? 'published') === filterPlatform))
    } else if (filterStatus !== 'all') {
      list = list.filter(v => v.status === filterStatus)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v => v.title.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [videos, filterStatus, filterPlatform, search])

  const handleCreate = () => {
    if (!newForm.title.trim()) return
    addVideo({
      title: newForm.title.trim(),
      description: newForm.description.trim() || undefined,
      status: 'topic',
      tagIds: [],
      platforms: [],
    })
    setNewModal(false)
    setNewForm({ title: '', description: '' })
  }

  return (
    <PageContainer
      title="视频库"
      subtitle={`${videos.length} 条视频`}
      actions={
        <Button variant="primary" size="sm" onClick={() => setNewModal(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          新建视频
        </Button>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 260 }}>
          <Input
            placeholder="搜索视频…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <FilterChip
            active={filterStatus === 'all' && !filterPlatform}
            onClick={() => setVideoFilter('all')}
            label={`全部 (${videos.length})`}
          />
          {VIDEO_STATUS_ORDER.map(s => {
            const count = videos.filter(v => v.status === s).length
            if (count === 0) return null
            return (
              <FilterChip
                key={s}
                active={filterStatus === s && !filterPlatform}
                onClick={() => setVideoFilter(s === filterStatus && !filterPlatform ? 'all' : s)}
                label={`${VIDEO_STATUS_LABELS[s]} (${count})`}
              />
            )
          })}
          {violated.length > 0 && (
            <FilterChip
              active={filterPlatform === 'violated'}
              onClick={() => setPlatformFilter('violated')}
              label={`已违规 (${violated.length})`}
              color="#EF4444"
            />
          )}
          {skipped.length > 0 && (
            <FilterChip
              active={filterPlatform === 'skipped'}
              onClick={() => setPlatformFilter('skipped')}
              label={`已跳过 (${skipped.length})`}
              color="#9CA3AF"
            />
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="没有匹配的视频"
          description="调整筛选条件或新建视频"
          action={<Button variant="primary" size="sm" onClick={() => setNewModal(true)}>新建视频</Button>}
        />
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                {['标题', '状态', '平台', '标签', '更新'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((video, idx) => {
                const videoTags = tags.filter(t => video.tagIds.includes(t.id))
                return (
                  <tr
                    key={video.id}
                    onClick={() => navigate(`/videos/${video.id}`)}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                      background: 'var(--bg-surface)',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{video.title}</p>
                      {video.description && (
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{video.description}</p>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <StatusBadge status={video.status} />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {video.platforms
                          .filter(p => (p.status ?? 'published') === 'published')
                          .map(p => (
                            <PlatformIcon key={p.platform} platform={p.platform} size={16} />
                          ))}
                        {!video.platforms.some(p => (p.status ?? 'published') === 'published') && (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {videoTags.slice(0, 2).map(tag => (
                          <span
                            key={tag.id}
                            style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: `${tag.color}22`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {videoTags.length > 2 && (
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>+{videoTags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fromNow(video.updatedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="新建视频"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!newForm.title.trim()}>创建</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="视频标题 *"
            placeholder="例：普通人如何在30岁前实现财务自由"
            value={newForm.title}
            onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="简介（可选）"
            placeholder="视频的核心内容或角度"
            rows={3}
            value={newForm.description}
            onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
      </Modal>
    </PageContainer>
  )
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        border: active && color ? `1px solid ${color}50` : 'none',
        background: active ? (color ? color + '20' : 'var(--accent)') : 'transparent',
        color: active ? (color ?? '#fff') : 'var(--text-secondary)',
        transition: 'background .1s, color .1s',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}
