import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Topic, TopicStatus } from '@/types'
import { TOPIC_STATUS_LABELS, VIDEO_STATUS_LABELS } from '@/types'
import { fromNow } from '@/utils/date'

const STATUS_COLORS: Record<TopicStatus, string> = {
  inspiration: '#6B7280',
  adopted:     '#7C3AED',
  in_progress: '#1D4ED8',
  done:        '#059669',
}

export function Topics() {
  const navigate = useNavigate()
  const topics = useAppStore(s => s.data?.topics ?? [])
  const addTopic = useAppStore(s => s.addTopic)
  const updateTopic = useAppStore(s => s.updateTopic)
  const adoptTopic = useAppStore(s => s.adoptTopic)
  const abandonTopic = useAppStore(s => s.abandonTopic)
  const scripts = useAppStore(s => s.data?.scripts ?? [])
  const addScript = useAppStore(s => s.addScript)
  const updateScript = useAppStore(s => s.updateScript)
  const videos = useAppStore(s => s.data?.videos ?? [])

  const [filterStatus, setFilterStatus] = useState<TopicStatus | 'all'>('inspiration')
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; topic?: Topic } | null>(null)
  const [form, setForm] = useState({ title: '', description: '', inspiration: '' })
  const [adoptedToast, setAdoptedToast] = useState<string | null>(null)
  const [abandonConfirm, setAbandonConfirm] = useState<Topic | null>(null)
  const [linkModal, setLinkModal] = useState<Topic | null>(null)
  const [linkScriptId, setLinkScriptId] = useState<string>('')
  const [linkVideoModal, setLinkVideoModal] = useState<Topic | null>(null)
  const [linkVideoId, setLinkVideoId] = useState<string>('')
  const linkTopicToVideo = useAppStore(s => s.linkTopicToVideo)

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return topics
    return topics.filter(t => t.status === filterStatus)
  }, [topics, filterStatus])

  const openNew = () => {
    setForm({ title: '', description: '', inspiration: '' })
    setModal({ mode: 'new' })
  }

  const openEdit = (topic: Topic) => {
    setForm({
      title: topic.title,
      description: topic.description ?? '',
      inspiration: topic.inspiration ?? '',
    })
    setModal({ mode: 'edit', topic })
  }

  const handleSave = () => {
    if (modal?.mode === 'new') {
      addTopic({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: 'inspiration',
        tagIds: [],
        inspiration: form.inspiration.trim() || undefined,
      })
    } else if (modal?.topic) {
      updateTopic(modal.topic.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        inspiration: form.inspiration.trim() || undefined,
      })
    }
    setModal(null)
  }

  const handleAdopt = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation()
    const alreadyConverted = videos.some(v => v.topicId === topic.id)
    if (alreadyConverted) {
      const linkedVideo = videos.find(v => v.topicId === topic.id)
      if (linkedVideo) navigate('/kanban')
      return
    }
    adoptTopic(topic.id)
    setAdoptedToast(topic.title)
    setTimeout(() => setAdoptedToast(null), 3000)
  }

  const handleAbandonConfirm = () => {
    if (!abandonConfirm) return
    abandonTopic(abandonConfirm.id)
    setAbandonConfirm(null)
  }

  const openLinkModal = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation()
    setLinkScriptId('')
    setLinkModal(topic)
  }

  const handleLinkScript = () => {
    if (!linkModal || !linkScriptId) return
    updateScript(linkScriptId, { topicId: linkModal.id })
    setLinkModal(null)
  }

  const handleLinkVideo = () => {
    if (!linkVideoModal || !linkVideoId) return
    linkTopicToVideo(linkVideoModal.id, linkVideoId)
    setLinkVideoModal(null)
    setLinkVideoId('')
  }

  const openLinkVideoModal = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation()
    setLinkVideoId('')
    setLinkVideoModal(topic)
  }

  const handleWriteScript = (topic: Topic) => {
    const existing = scripts.find(s => s.topicId === topic.id)
    if (existing) {
      navigate(`/scripts/${existing.id}`)
      return
    }
    addScript({ title: topic.title, topicId: topic.id, wordCount: 0, estimatedDuration: 0, tagIds: topic.tagIds })
    setTimeout(() => {
      const newest = useAppStore.getState().data?.scripts.slice(-1)[0]
      if (newest) navigate(`/scripts/${newest.id}`)
    }, 50)
  }

  return (
    <PageContainer
      title="选题库"
      subtitle={`${topics.length} 个选题`}
      actions={
        <Button variant="primary" size="sm" onClick={openNew}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          新建灵感
        </Button>
      }
    >
      {/* Status filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            border: 'none', cursor: 'pointer',
            background: filterStatus === 'all' ? 'var(--accent)' : 'transparent',
            color: filterStatus === 'all' ? '#fff' : 'var(--text-secondary)',
          }}
          onMouseEnter={e => { if (filterStatus !== 'all') (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { if (filterStatus !== 'all') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          全部 ({topics.length})
        </button>
        {(Object.keys(TOPIC_STATUS_LABELS) as TopicStatus[]).map(s => {
          const count = topics.filter(t => t.status === s).length
          const active = filterStatus === s
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s === filterStatus ? 'all' : s)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'background .1s',
                background: active ? STATUS_COLORS[s] : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {TOPIC_STATUS_LABELS[s]} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="暂无选题"
          action={<Button variant="primary" size="sm" onClick={openNew}>新建灵感</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.map(topic => {
            const existingScript = scripts.find(s => s.topicId === topic.id)
            const isInspiration = topic.status === 'inspiration'
            const isReadOnly = topic.status === 'in_progress' || topic.status === 'done'
            const linkedVideo = videos.find(v => v.topicId === topic.id || v.id === topic.linkedVideoId)
            const needsSync = topic.status === 'in_progress' && linkedVideo?.status === 'published'
            const notLinked = topic.status === 'in_progress' && !linkedVideo

            return (
              <div
                key={topic.id}
                onClick={() => openEdit(topic)}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${STATUS_COLORS[topic.status]}`,
                  background: 'var(--bg-surface)',
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'border-color .12s',
                  position: 'relative',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${STATUS_COLORS[topic.status]}`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                className="topic-card"
              >
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>{topic.title}</h3>

                {topic.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{topic.description}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {/* 状态徽章：只读，不可点击 */}
                  <span
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500,
                      background: `${STATUS_COLORS[topic.status]}18`,
                      color: STATUS_COLORS[topic.status],
                      border: `1px solid ${STATUS_COLORS[topic.status]}40`,
                      flexShrink: 0,
                    }}
                  >
                    {TOPIC_STATUS_LABELS[topic.status]}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="topic-actions">
                    {/* 已在制作中/完成：显示查看看板链接 */}
                    {isReadOnly && linkedVideo && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/kanban') }}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'rgba(29,78,216,0.12)', color: '#60A5FA',
                          transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                      >
                        → 查看看板
                      </button>
                    )}

                    {/* 视频已发布但选题未同步 */}
                    {needsSync && (
                      <button
                        onClick={e => { e.stopPropagation(); linkTopicToVideo(topic.id, linkedVideo!.id) }}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'rgba(5,150,105,0.15)', color: '#34d399',
                          fontWeight: 600, transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                      >
                        ↻ 同步状态
                      </button>
                    )}

                    {/* 制作中但未关联视频 */}
                    {notLinked && (
                      <button
                        onClick={e => openLinkVideoModal(e, topic)}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                          fontWeight: 600, transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                      >
                        关联视频
                      </button>
                    )}

                    {/* 逐字稿操作 */}
                    <button
                      onClick={e => { e.stopPropagation(); handleWriteScript(topic) }}
                      style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: existingScript ? 'rgba(52,211,153,0.12)' : 'var(--bg-elevated)',
                        color: existingScript ? '#34d399' : 'var(--text-secondary)',
                        transition: 'all .1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    >
                      {existingScript ? '✓ 编辑逐字稿' : '✍ 写逐字稿'}
                    </button>
                    {!existingScript && (
                      <button
                        onClick={e => openLinkModal(e, topic)}
                        title="关联已有逐字稿"
                        style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                      >
                        关联
                      </button>
                    )}

                    {/* 采纳按钮：仅灵感阶段 */}
                    {isInspiration && (
                      <button
                        onClick={e => handleAdopt(e, topic)}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'rgba(124,58,237,0.15)', color: '#A78BFA',
                          fontWeight: 600, transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.25)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.15)' }}
                      >
                        ✓ 采纳
                      </button>
                    )}

                    {/* 放弃按钮：灵感和已采纳阶段可放弃 */}
                    {!isReadOnly && (
                      <button
                        onClick={e => { e.stopPropagation(); setAbandonConfirm(topic) }}
                        style={{
                          padding: 4, borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: 'transparent', color: 'var(--text-tertiary)', transition: 'all .1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#F87171' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                        title="放弃此选题"
                      >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M1 3h10M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M5 5.5v3M7 5.5v3M2 3l.6 7a1 1 0 001 .9h4.8a1 1 0 001-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }}>{fromNow(topic.updatedAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 关联看板视频弹窗 */}
      <Modal
        open={!!linkVideoModal}
        onClose={() => setLinkVideoModal(null)}
        title="关联看板视频"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinkVideoModal(null)}>取消</Button>
            <Button variant="primary" onClick={handleLinkVideo} disabled={!linkVideoId}>关联</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            选择对应的看板视频，关联后选题状态将自动同步。
          </p>
          {videos.filter(v => !v.topicId).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
              暂无可关联的视频（所有视频已关联其他选题）
            </p>
          ) : (
            videos.filter(v => !v.topicId).map(v => (
              <button
                key={v.id}
                onClick={() => setLinkVideoId(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: linkVideoId === v.id ? 'var(--accent)' : 'var(--border-subtle)',
                  background: linkVideoId === v.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .1s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{v.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, marginLeft: 8 }}>
                  {VIDEO_STATUS_LABELS[v.status]}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* 关联逐字稿弹窗 */}
      <Modal
        open={!!linkModal}
        onClose={() => setLinkModal(null)}
        title="关联已有逐字稿"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinkModal(null)}>取消</Button>
            <Button variant="primary" onClick={handleLinkScript} disabled={!linkScriptId}>关联</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scripts.filter(s => !s.topicId).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
              暂无可关联的逐字稿（所有逐字稿已关联其他选题）
            </p>
          ) : (
            scripts.filter(s => !s.topicId).map(s => (
              <button
                key={s.id}
                onClick={() => setLinkScriptId(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: linkScriptId === s.id ? 'var(--accent)' : 'var(--border-subtle)',
                  background: linkScriptId === s.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .1s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {s.wordCount} 字
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* 新建/编辑选题弹窗（无状态选择） */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? '新建灵感' : '编辑选题'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>取消</Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.title.trim()}>保存</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="选题标题 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <Textarea label="角度描述" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="这个选题的独特角度或核心卖点" />
          <Input label="灵感来源" value={form.inspiration} onChange={e => setForm(f => ({ ...f, inspiration: e.target.value }))} placeholder="某个爆款视频、热搜词或用户反馈" />
        </div>
      </Modal>

      {/* 放弃确认弹窗 */}
      <Modal
        open={!!abandonConfirm}
        onClose={() => setAbandonConfirm(null)}
        title="放弃此选题"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAbandonConfirm(null)}>取消</Button>
            <Button
              variant="primary"
              onClick={handleAbandonConfirm}
              style={{ background: '#EF4444' }}
            >
              确认放弃
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {abandonConfirm && videos.some(v => v.topicId === abandonConfirm.id) ? (
            <>
              选题「<strong style={{ color: 'var(--text-primary)' }}>{abandonConfirm?.title}</strong>」已有关联的看板卡片，放弃后该卡片将被自动归档。
            </>
          ) : (
            <>
              确认放弃选题「<strong style={{ color: 'var(--text-primary)' }}>{abandonConfirm?.title}</strong>」？此操作不可撤销。
            </>
          )}
        </p>
      </Modal>

      {/* 采纳成功 Toast */}
      {adoptedToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#7C3AED', color: '#fff', borderRadius: 8,
          padding: '10px 16px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: 'none',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>「{adoptedToast}」已采纳，加入看板</span>
        </div>
      )}
    </PageContainer>
  )
}
