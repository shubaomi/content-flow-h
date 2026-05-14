import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Topic, TopicStatus } from '@/types'
import { TOPIC_STATUS_LABELS } from '@/types'
import { fromNow } from '@/utils/date'

const STATUS_COLORS: Record<TopicStatus, string> = {
  idea: '#6B7280',
  approved: '#7C3AED',
  in_progress: '#1D4ED8',
  done: '#059669',
  rejected: '#DC2626',
}

export function Topics() {
  const navigate = useNavigate()
  const topics = useAppStore(s => s.data?.topics ?? [])
  const addTopic = useAppStore(s => s.addTopic)
  const updateTopic = useAppStore(s => s.updateTopic)
  const deleteTopic = useAppStore(s => s.deleteTopic)
  const addVideo = useAppStore(s => s.addVideo)
  const updateVideo = useAppStore(s => s.updateVideo)
  const scripts = useAppStore(s => s.data?.scripts ?? [])
  const addScript = useAppStore(s => s.addScript)
  const updateScript = useAppStore(s => s.updateScript)

  const [filterStatus, setFilterStatus] = useState<TopicStatus | 'all'>('idea')
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; topic?: Topic } | null>(null)
  const [form, setForm] = useState({ title: '', description: '', status: 'idea' as TopicStatus, inspiration: '' })
  const [convertedToast, setConvertedToast] = useState<string | null>(null)
  const [statusPopover, setStatusPopover] = useState<string | null>(null)
  const [linkModal, setLinkModal] = useState<Topic | null>(null)
  const [linkScriptId, setLinkScriptId] = useState<string>('')

  useEffect(() => {
    if (!statusPopover) return
    const close = () => setStatusPopover(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [statusPopover])

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return topics
    return topics.filter(t => t.status === filterStatus)
  }, [topics, filterStatus])

  const openNew = () => {
    setForm({ title: '', description: '', status: 'idea', inspiration: '' })
    setModal({ mode: 'new' })
  }

  const openEdit = (topic: Topic) => {
    setForm({
      title: topic.title,
      description: topic.description ?? '',
      status: topic.status,
      inspiration: topic.inspiration ?? '',
    })
    setModal({ mode: 'edit', topic })
  }

  const convertTopicToVideo = (topic: Topic) => {
    const alreadyConverted = useAppStore.getState().data?.videos.some(v => v.topicId === topic.id)
    if (alreadyConverted) return

    addVideo({
      title: topic.title,
      description: topic.description,
      status: 'topic',
      tagIds: topic.tagIds,
      platforms: [],
      topicId: topic.id,
    })
    updateTopic(topic.id, { status: 'in_progress' })
    const existingScript = scripts.find(s => s.topicId === topic.id)
    if (existingScript) {
      setTimeout(() => {
        const newestVideo = useAppStore.getState().data?.videos.slice(-1)[0]
        if (newestVideo) {
          updateVideo(newestVideo.id, { scriptId: existingScript.id })
          updateScript(existingScript.id, { videoId: newestVideo.id })
        }
      }, 50)
    }
    setConvertedToast(topic.title)
    setTimeout(() => setConvertedToast(null), 3000)
  }

  const handleSave = () => {
    if (modal?.mode === 'new') {
      addTopic({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        tagIds: [],
        inspiration: form.inspiration.trim() || undefined,
      })
      if (form.status === 'approved') {
        setTimeout(() => {
          const newest = useAppStore.getState().data?.topics.slice(-1)[0]
          if (newest) convertTopicToVideo(newest)
        }, 50)
      }
    } else if (modal?.topic) {
      updateTopic(modal.topic.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        inspiration: form.inspiration.trim() || undefined,
      })
      if (form.status === 'approved' && modal.topic.status !== 'approved') {
        convertTopicToVideo({
          ...modal.topic,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        })
      }
    }
    setModal(null)
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
          新建选题
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
          action={<Button variant="primary" size="sm" onClick={openNew}>新建选题</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.map(topic => (
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative' }}>
                  <span
                    onClick={e => {
                      e.stopPropagation()
                      setStatusPopover(statusPopover === topic.id ? null : topic.id)
                    }}
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500,
                      background: `${STATUS_COLORS[topic.status]}18`,
                      color: STATUS_COLORS[topic.status],
                      cursor: 'pointer', userSelect: 'none',
                      border: `1px solid ${STATUS_COLORS[topic.status]}40`,
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}
                    title="点击快速切换状态"
                  >
                    {TOPIC_STATUS_LABELS[topic.status]}
                    <span style={{ fontSize: 8, opacity: 0.7 }}>▾</span>
                  </span>
                  {statusPopover === topic.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', top: '100%', left: 0, marginTop: 4,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 50, minWidth: 108, overflow: 'hidden',
                      }}
                    >
                      {(Object.keys(STATUS_COLORS) as TopicStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={e => {
                            e.stopPropagation()
                            if (s === 'approved' && topic.status !== 'approved') {
                              convertTopicToVideo(topic)
                            } else {
                              updateTopic(topic.id, { status: s })
                            }
                            setStatusPopover(null)
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            width: '100%', padding: '6px 10px',
                            border: 'none',
                            background: s === topic.status ? `${STATUS_COLORS[s]}18` : 'transparent',
                            color: s === topic.status ? STATUS_COLORS[s] : 'var(--text-secondary)',
                            fontSize: 12, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => { if (s !== topic.status) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                          onMouseLeave={e => { if (s !== topic.status) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s], flexShrink: 0 }} />
                          {TOPIC_STATUS_LABELS[s]}
                          {s === topic.status && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="topic-actions">
                  {(() => {
                    const existingScript = scripts.find(s => s.topicId === topic.id)
                    return (
                      <>
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
                      </>
                    )
                  })()}
                  <button
                    onClick={e => { e.stopPropagation(); deleteTopic(topic.id) }}
                    style={{
                      padding: 4, borderRadius: 4, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: 'var(--text-tertiary)', transition: 'all .1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#F87171' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M1 3h10M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M5 5.5v3M7 5.5v3M2 3l.6 7a1 1 0 001 .9h4.8a1 1 0 001-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{fromNow(topic.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? '新建选题' : '编辑选题'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>状态</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as TopicStatus }))}
              style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
              }}
            >
              {(Object.keys(TOPIC_STATUS_LABELS) as TopicStatus[]).map(s => (
                <option key={s} value={s}>{TOPIC_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {convertedToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1D4ED8', color: '#fff', borderRadius: 8,
          padding: '10px 16px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: 'none',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>「{convertedToast}」已加入看板</span>
        </div>
      )}
    </PageContainer>
  )
}
