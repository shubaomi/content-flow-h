import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/StatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Platform, ViolationCategory } from '@/types'
import {
  VIDEO_STATUS_LABELS, VIDEO_STATUS_ORDER, ALL_PLATFORMS, PLATFORM_LABELS,
  PLATFORM_STATUS_LABELS, PLATFORM_STATUS_COLORS,
  VIOLATION_CATEGORY_LABELS,
} from '@/types'
import { formatDate, fromNow } from '@/utils/date'
import { calcEngagement, formatNumber } from '@/utils/format'

export function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const videos = useAppStore(s => s.data?.videos ?? [])
  const tags = useAppStore(s => s.data?.tags ?? [])
  const scripts = useAppStore(s => s.data?.scripts ?? [])
  const metrics = useAppStore(s => s.data?.metrics ?? [])
  const updateVideo = useAppStore(s => s.updateVideo)
  const moveVideo = useAppStore(s => s.moveVideo)
  const deleteVideo = useAppStore(s => s.deleteVideo)
  const addMetric = useAppStore(s => s.addMetric)
  const setPlatformEntry = useAppStore(s => s.setPlatformEntry)

  const video = videos.find(v => v.id === id)
  const script = scripts.find(s => s.id === video?.scriptId)
  const videoMetrics = metrics.filter(m => m.videoId === id)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(video?.title ?? '')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [metricModal, setMetricModal] = useState(false)
  const [metricForm, setMetricForm] = useState({
    platform: 'douyin' as Platform,
    plays: '', likes: '', comments: '', shares: '', saves: '', follows: '', completionRate: '',
    dataDate: new Date().toISOString().split('T')[0],
  })

  const fillFromLastMetric = (platform: Platform) => {
    const last = [...videoMetrics]
      .filter(m => m.platform === platform)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0]
    return {
      platform,
      plays: last ? String(last.plays) : '',
      likes: last ? String(last.likes) : '',
      comments: last ? String(last.comments) : '',
      shares: last ? String(last.shares) : '',
      saves: last?.saves != null ? String(last.saves) : '',
      follows: last?.follows != null ? String(last.follows) : '',
      completionRate: last?.completionRate != null ? String(last.completionRate) : '',
      dataDate: new Date().toISOString().split('T')[0],
    }
  }

  const openMetricModal = () => {
    setMetricForm(fillFromLastMetric('douyin'))
    setMetricModal(true)
  }

  // Platform modals
  const [skipModal, setSkipModal] = useState<Platform | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [violationModal, setViolationModal] = useState<Platform | null>(null)
  const [violationForm, setViolationForm] = useState({
    category: 'content' as ViolationCategory,
    reason: '',
  })

  if (!video) {
    return (
      <PageContainer title="视频不存在">
        <Button onClick={() => navigate('/videos')}>返回列表</Button>
      </PageContainer>
    )
  }

  const currentIdx = VIDEO_STATUS_ORDER.indexOf(video.status)
  const nextStatus = currentIdx < VIDEO_STATUS_ORDER.length - 2 ? VIDEO_STATUS_ORDER[currentIdx + 1] : null
  const prevStatus = currentIdx > 0 ? VIDEO_STATUS_ORDER[currentIdx - 1] : null

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== video.title) {
      updateVideo(video.id, { title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  const handleAddMetric = () => {
    addMetric({
      videoId: video.id,
      platform: metricForm.platform,
      dataDate: metricForm.dataDate,
      plays: Number(metricForm.plays),
      likes: Number(metricForm.likes),
      comments: Number(metricForm.comments),
      shares: Number(metricForm.shares),
      saves: metricForm.saves ? Number(metricForm.saves) : undefined,
      follows: metricForm.follows ? Number(metricForm.follows) : undefined,
      completionRate: metricForm.completionRate ? Number(metricForm.completionRate) : undefined,
    })
    setMetricModal(false)
  }

  const statusOrderFiltered = VIDEO_STATUS_ORDER.filter(s => s !== 'archived')

  return (
    <PageContainer
      title={video.title}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={video.status} />
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>删除</Button>
        </div>
      }
    >
      <div style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Title inline edit */}
        <div>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') { setTitleValue(video.title); setEditingTitle(false) }
              }}
              style={{
                width: '100%', fontSize: 22, fontWeight: 700,
                background: 'transparent', borderBottom: '2px solid var(--accent)',
                color: 'var(--text-primary)', outline: 'none', paddingBottom: 4,
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <h1
              onClick={() => { setTitleValue(video.title); setEditingTitle(true) }}
              style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', cursor: 'text', transition: 'color .1s' }}
              title="点击编辑标题"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            >
              {video.title}
            </h1>
          )}
        </div>

        {/* Status workflow */}
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>工作流进度</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {statusOrderFiltered.map((s, i) => {
              const currentI = VIDEO_STATUS_ORDER.indexOf(video.status)
              const thisI = VIDEO_STATUS_ORDER.indexOf(s)
              const done = thisI < currentI
              const active = s === video.status
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => moveVideo(video.id, s)}
                    style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      border: 'none', cursor: 'pointer', transition: 'all .12s',
                      background: active ? 'var(--accent)' : done ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                      color: active ? '#fff' : done ? 'var(--text-tertiary)' : 'var(--text-tertiary)',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = done ? 'var(--text-tertiary)' : 'var(--text-tertiary)' }}
                  >
                    {VIDEO_STATUS_LABELS[s]}
                  </button>
                  {i < statusOrderFiltered.length - 1 && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M3 2l4 3-4 3" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            {prevStatus && (
              <Button variant="secondary" size="sm" onClick={() => moveVideo(video.id, prevStatus)}>
                ← 退回「{VIDEO_STATUS_LABELS[prevStatus]}」
              </Button>
            )}
            {nextStatus && (
              <Button variant="primary" size="sm" onClick={() => moveVideo(video.id, nextStatus)}>
                推进到「{VIDEO_STATUS_LABELS[nextStatus]}」→
              </Button>
            )}
            {video.status !== 'archived' && (
              <Button variant="ghost" size="sm" onClick={() => moveVideo(video.id, 'archived')}>
                归档
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>视频简介</p>
              <Textarea
                value={video.description ?? ''}
                onChange={e => updateVideo(video.id, { description: e.target.value })}
                placeholder="视频核心内容或亮点…"
                rows={4}
              />
            </div>

            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>关联逐字稿</p>
              {script ? (
                <button
                  onClick={() => navigate(`/scripts/${script.id}`)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="1.5" width="12" height="13" rx="1.5"/>
                    <path d="M5 5.5h6M5 8h6M5 10.5h4"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{script.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{script.wordCount} 字 · v{script.version}</p>
                  </div>
                </button>
              ) : (
                <Select
                  options={[
                    { value: '', label: '不关联' },
                    ...scripts.map(s => ({ value: s.id, label: s.title })),
                  ]}
                  value={video.scriptId ?? ''}
                  onChange={e => updateVideo(video.id, { scriptId: e.target.value || undefined })}
                />
              )}
            </div>

            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>标签</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(tag => {
                  const selected = video.tagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const newTagIds = selected
                          ? video.tagIds.filter(t => t !== tag.id)
                          : [...video.tagIds, tag.id]
                        updateVideo(video.id, { tagIds: newTagIds })
                      }}
                      style={{
                        padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${selected ? tag.color : 'var(--border-subtle)'}`,
                        background: selected ? `${tag.color}20` : 'transparent',
                        color: selected ? tag.color : 'var(--text-tertiary)',
                        cursor: 'pointer', transition: 'all .1s',
                      }}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Platform status */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>发布平台</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALL_PLATFORMS.map(platform => {
                  const pub = video.platforms.find(p => p.platform === platform)
                  const status = pub?.status ?? 'published'
                  const color = pub ? PLATFORM_STATUS_COLORS[status] : 'var(--border-subtle)'

                  return (
                    <div
                      key={platform}
                      style={{
                        borderRadius: 9,
                        border: `1px solid ${pub ? color + '40' : 'var(--border-subtle)'}`,
                        background: pub ? color + '08' : 'transparent',
                        padding: '10px 12px',
                      }}
                    >
                      {/* Row header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlatformIcon platform={platform} size={16} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
                          {PLATFORM_LABELS[platform]}
                        </span>

                        {/* Status badge */}
                        {pub && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: color + '20', color,
                          }}>
                            {PLATFORM_STATUS_LABELS[status]}
                          </span>
                        )}

                        {/* Actions — 三个状态平级，任意切换 */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(!pub || status !== 'published') && (
                            <ActionBtn
                              label="已发布"
                              color="#10B981"
                              onClick={() => setPlatformEntry(video.id, platform, {
                                status: 'published',
                                publishedAt: new Date().toISOString(),
                              })}
                            />
                          )}
                          {(!pub || status !== 'violated') && (
                            <ActionBtn
                              label="已违规"
                              color="#EF4444"
                              onClick={() => { setViolationForm({ category: 'content', reason: '' }); setViolationModal(platform) }}
                            />
                          )}
                          {(!pub || status !== 'skipped') && (
                            <ActionBtn
                              label="已跳过"
                              color="#9CA3AF"
                              onClick={() => { setSkipReason(''); setSkipModal(platform) }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Detail row */}
                      {pub && status === 'published' && pub.publishedAt && (
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          {formatDate(pub.publishedAt)}
                        </p>
                      )}
                      {pub && status === 'violated' && pub.violation && (
                        <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4, lineHeight: 1.5 }}>
                          {VIOLATION_CATEGORY_LABELS[pub.violation.category]} · {pub.violation.reason}
                        </p>
                      )}
                      {pub && status === 'skipped' && pub.skipReason && (
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5 }}>
                          {pub.skipReason}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>备注</p>
              <Textarea
                value={video.notes ?? ''}
                onChange={e => updateVideo(video.id, { notes: e.target.value })}
                placeholder="自由记录想法…"
                rows={4}
              />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p>创建：{formatDate(video.createdAt)}</p>
              <p>最后更新：{fromNow(video.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>平台数据</p>
            <Button variant="secondary" size="sm" onClick={openMetricModal}>
              + 录入数据
            </Button>
          </div>
          {videoMetrics.length > 0 ? (
            <div style={{ overflow: 'auto', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    {['平台', '日期', '播放', '点赞', '评论', '分享', '收藏', '完播率', '互动率'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {videoMetrics.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: i < videoMetrics.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '8px 12px' }}><PlatformIcon platform={m.platform} size={14} showLabel /></td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatDate(m.dataDate)}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{formatNumber(m.plays)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatNumber(m.likes)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatNumber(m.comments)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatNumber(m.shares)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.saves ? formatNumber(m.saves) : '—'}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.completionRate != null ? `${m.completionRate}%` : '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#34D399', fontWeight: 500 }}>
                        {calcEngagement(m.likes, m.comments, m.shares, m.plays)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '16px 0' }}>暂无数据记录，点击「录入数据」开始追踪</p>
          )}
        </div>
      </div>

      {/* Metric modal */}
      <Modal
        open={metricModal}
        onClose={() => setMetricModal(false)}
        title="录入平台数据"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMetricModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleAddMetric} disabled={!metricForm.plays}>保存</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="平台"
            options={ALL_PLATFORMS.map(p => ({ value: p, label: PLATFORM_LABELS[p] }))}
            value={metricForm.platform}
            onChange={e => setMetricForm(fillFromLastMetric(e.target.value as Platform))}
          />
          <Input
            label="数据日期"
            type="date"
            value={metricForm.dataDate}
            onChange={e => setMetricForm(f => ({ ...f, dataDate: e.target.value }))}
          />
          <Input label="播放量 *" type="number" placeholder="0" value={metricForm.plays} onChange={e => setMetricForm(f => ({ ...f, plays: e.target.value }))} />
          <Input label="点赞数" type="number" placeholder="0" value={metricForm.likes} onChange={e => setMetricForm(f => ({ ...f, likes: e.target.value }))} />
          <Input label="评论数" type="number" placeholder="0" value={metricForm.comments} onChange={e => setMetricForm(f => ({ ...f, comments: e.target.value }))} />
          <Input label="分享数" type="number" placeholder="0" value={metricForm.shares} onChange={e => setMetricForm(f => ({ ...f, shares: e.target.value }))} />
          <Input label="收藏数（小红书）" type="number" placeholder="0" value={metricForm.saves} onChange={e => setMetricForm(f => ({ ...f, saves: e.target.value }))} />
          <Input label="新增关注" type="number" placeholder="0" value={metricForm.follows} onChange={e => setMetricForm(f => ({ ...f, follows: e.target.value }))} />
          <Input label="完播率 (%)" type="number" placeholder="0" value={metricForm.completionRate} onChange={e => setMetricForm(f => ({ ...f, completionRate: e.target.value }))} />
        </div>
      </Modal>

      {/* Skip modal */}
      <Modal
        open={skipModal !== null}
        onClose={() => setSkipModal(null)}
        title={`跳过 · ${skipModal ? PLATFORM_LABELS[skipModal] : ''}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSkipModal(null)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!skipModal) return
                setPlatformEntry(video.id, skipModal, {
                  status: 'skipped',
                  skipReason: skipReason.trim() || undefined,
                })
                setSkipModal(null)
              }}
            >
              确认跳过
            </Button>
          </>
        }
      >
        <Textarea
          label="跳过原因（可选）"
          placeholder="例：本期账号流量异常，暂缓发布…"
          rows={3}
          value={skipReason}
          onChange={e => setSkipReason(e.target.value)}
        />
      </Modal>

      {/* Violation modal */}
      <Modal
        open={violationModal !== null}
        onClose={() => setViolationModal(null)}
        title={`标记违规 · ${violationModal ? PLATFORM_LABELS[violationModal] : ''}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViolationModal(null)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!violationModal || !violationForm.reason.trim()) return
                const existing = video.platforms.find(p => p.platform === violationModal)
                setPlatformEntry(video.id, violationModal, {
                  status: 'violated',
                  publishedAt: existing?.publishedAt,
                  violation: {
                    category: violationForm.category,
                    reason: violationForm.reason.trim(),
                    reportedAt: new Date().toISOString(),
                  },
                })
                setViolationModal(null)
              }}
              disabled={!violationForm.reason.trim()}
            >
              确认违规
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="违规分类"
            options={Object.entries(VIOLATION_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            value={violationForm.category}
            onChange={e => setViolationForm(f => ({ ...f, category: e.target.value as ViolationCategory }))}
          />
          <Textarea
            label="违规原因 *"
            placeholder="描述违规的具体情况，例如：平台判定内容涉及医疗建议，本期放弃该平台…"
            rows={3}
            value={violationForm.reason}
            onChange={e => setViolationForm(f => ({ ...f, reason: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="删除视频"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>取消</Button>
            <Button variant="danger" onClick={() => { deleteVideo(video.id); navigate('/videos') }}>确认删除</Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>删除后此视频及相关记录将被移除，此操作不可撤销。</p>
      </Modal>
    </PageContainer>
  )
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 8px', borderRadius: 5, fontSize: 11,
        border: `1px solid ${color}50`,
        background: 'transparent',
        color,
        cursor: 'pointer',
        transition: 'background .1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color + '15' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}
