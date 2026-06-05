import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ScriptEditor } from './ScriptEditor'
import { ScriptRiskPanel } from '@/components/ScriptRiskPanel'
import type { Script, RiskFinding, RawRiskFinding } from '@/types'
import { fromNow, formatDate } from '@/utils/date'
import { formatDuration } from '@/utils/date'
import { readScriptContent, writeScriptContent, deleteScriptFile } from '@/services/fileSystem'
import { detectRisk } from '@/services/riskDetectApi'
import { genId } from '@/utils/id'

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function Scripts() {
  const { id: urlId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const scripts = useAppStore(s => s.data?.scripts ?? [])
  const videos = useAppStore(s => s.data?.videos ?? [])
  const topics = useAppStore(s => s.data?.topics ?? [])
  const addScript = useAppStore(s => s.addScript)
  const updateScript = useAppStore(s => s.updateScript)
  const deleteScript = useAppStore(s => s.deleteScript)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(urlId ?? null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [newModal, setNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  // 风险检测
  const [findings, setFindings] = useState<RiskFinding[]>([])
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null)
  const [dismissedFindingIds, setDismissedFindingIds] = useState<Set<string>>(new Set())
  const [detectionStale, setDetectionStale] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [detectionDone, setDetectionDone] = useState(false)
  // 记录检测时使用的内容快照（用于判断内容是否变更）
  const detectionSnapshotRef = useRef('')

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // track latest content + id for use inside async save without stale closure
  const pendingRef = useRef<{ id: string; content: string } | null>(null)

  const sortedScripts = useMemo(() =>
    [...scripts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [scripts]
  )

  const fuse = useMemo(() => new Fuse(sortedScripts, {
    keys: ['title'],
    threshold: 0.35,
    includeMatches: true,
  }), [sortedScripts])

  const filteredScripts = useMemo(() => {
    if (!searchQuery.trim()) return sortedScripts
    return fuse.search(searchQuery).map(r => r.item)
  }, [searchQuery, fuse, sortedScripts])

  const selectedScript = scripts.find(s => s.id === selectedId)

  useEffect(() => {
    let cancelled = false
    const loadContent = async () => {
      if (!selectedId) {
        setEditorContent('')
        setSaveState('idle')
        return
      }
      setLoadingContent(true)
      setSaveState('idle')
      const content = await readScriptContent(selectedId)
      if (cancelled) return
      setEditorContent(content)
      setLoadingContent(false)
    }

    void loadContent()
    return () => { cancelled = true }
  }, [selectedId])

  const doSave = useCallback(async (id: string, content: string) => {
    setSaveState('saving')
    try {
      await writeScriptContent(id, content)
      const wordCount = content.replace(/\s+/g, '').length
      updateScript(id, { wordCount, estimatedDuration: Math.round(wordCount / 3.5) })
      setSaveState('saved')
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      setSaveState('error')
      console.error('[save] failed:', e)
    }
  }, [updateScript])

  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content)
    if (!selectedId) return

    pendingRef.current = { id: selectedId, content }
    setSaveState('pending')

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      const p = pendingRef.current
      if (p) doSave(p.id, p.content)
    }, 1000)
  }, [selectedId, doSave])

  const handleCopy = useCallback(async () => {
    if (!editorContent) return
    await navigator.clipboard.writeText(editorContent)
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 1500)
  }, [editorContent])

  // ── 风险检测 ──
  const handleDetect = useCallback(async () => {
    if (!editorContent.trim()) return
    setDetecting(true)
    setDetectError(null)
    setDetectionDone(false)
    try {
      const rawResults = await detectRisk(editorContent) as RawRiskFinding[]
      if (!Array.isArray(rawResults)) return
      const results: RiskFinding[] = rawResults.map(f => {
        const start = f.evidence ? editorContent.indexOf(f.evidence) : -1
        return {
          ...f,
          id: genId('risk'),
          start: start >= 0 ? start : 0,
          end: start >= 0 ? start + f.evidence.length : 0,
        }
      })
      setFindings(results)
      setDismissedFindingIds(new Set())
      setDetectionStale(false)
      setDetectionDone(true)
      detectionSnapshotRef.current = editorContent
      if (results.length > 0) {
        setHighlightedFindingId(results[0].id)
      }
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : '检测失败')
    } finally {
      setDetecting(false)
    }
  }, [editorContent])

  const handleFindingClick = useCallback((finding: RiskFinding) => {
    setHighlightedFindingId(finding.id)
  }, [])

  const handleDismissRisk = useCallback((id: string) => {
    setDismissedFindingIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setHighlightedFindingId(prev => prev === id ? null : prev)
  }, [])

  const handleRedetect = useCallback(() => {
    setDetectionStale(false)
    handleDetect()
  }, [handleDetect])

  // 内容变更时标记检测结果过期
  const handleContentChangeWithDetection = useCallback((content: string) => {
    handleContentChange(content)
    if (findings.length > 0 && content !== detectionSnapshotRef.current) {
      setDetectionStale(true)
    }
    if (content !== detectionSnapshotRef.current) {
      setDetectionDone(false)
    }
  }, [handleContentChange, findings.length])

  // 当选中的 script 变化时清除检测结果
  useEffect(() => {
    setFindings([])
    setHighlightedFindingId(null)
    setDismissedFindingIds(new Set())
    setDetectionStale(false)
    setDetectionDone(false)
    detectionSnapshotRef.current = ''
  }, [selectedId])

  // 检测通过提示 5 秒后自动消失
  useEffect(() => {
    if (!detectionDone || findings.length > 0) return
    const t = setTimeout(() => setDetectionDone(false), 5000)
    return () => clearTimeout(t)
  }, [detectionDone, findings.length])

  // 计算当前高亮范围
  const activeFinding = highlightedFindingId
    ? findings.find(f => f.id === highlightedFindingId)
    : null
  const highlightRange = activeFinding
    ? { start: activeFinding.start, end: activeFinding.end }
    : null

  // Cmd+S 立即保存，不等防抖
  const handleForceSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    const p = pendingRef.current
    if (p) {
      doSave(p.id, p.content)
    } else if (selectedId && editorContent) {
      doSave(selectedId, editorContent)
    }
  }, [selectedId, editorContent, doSave])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleForceSave()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleForceSave])

  // 清理 timer
  useEffect(() => () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
  }, [])

  const handleCreate = () => {
    if (!newTitle.trim()) return
    addScript({
      title: newTitle.trim(),
      wordCount: 0,
      estimatedDuration: 0,
      tagIds: [],
    })
    setNewModal(false)
    setNewTitle('')
    setTimeout(() => {
      const newest = useAppStore.getState().data?.scripts.slice(-1)[0]
      if (newest) {
        setSelectedId(newest.id)
        navigate(`/scripts/${newest.id}`, { replace: true })
      }
    }, 50)
  }

  const handleDelete = async (id: string) => {
    await deleteScriptFile(id)
    deleteScript(id)
    if (selectedId === id) {
      setSelectedId(null)
      navigate('/scripts', { replace: true })
    }
    setDeleteConfirm(null)
  }

  const handleSelect = (script: Script) => {
    setSelectedId(script.id)
    navigate(`/scripts/${script.id}`, { replace: true })
  }

  const handleTitleSave = () => {
    if (selectedScript && titleValue.trim() && titleValue.trim() !== selectedScript.title) {
      updateScript(selectedScript.id, { title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  const saveLabel =
    saveState === 'pending' ? null :
    saveState === 'saving'  ? '保存中…' :
    saveState === 'saved'   ? '已保存' :
    saveState === 'error'   ? '保存失败' :
    null

  const saveLabelColor =
    saveState === 'saving' ? 'var(--text-tertiary)' :
    saveState === 'saved'  ? 'var(--success)' :
    saveState === 'error'  ? 'var(--danger)' :
    'var(--text-tertiary)'

  return (
    <PageContainer
      title="逐字稿"
      subtitle={`${scripts.length} 篇稿件`}
      noPadding
      actions={
        <Button variant="primary" size="sm" onClick={() => setNewModal(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          新建逐字稿
        </Button>
      }
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Left: list */}
        <div style={{
          width: 288, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
            <Input
              placeholder="搜索稿件…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredScripts.length === 0 ? (
              <EmptyState
                title="暂无稿件"
                description={searchQuery ? '没有匹配的结果' : '点击「新建逐字稿」开始创作'}
              />
            ) : (
              filteredScripts.map(script => {
                const topic = script.topicId ? topics.find(t => t.id === script.topicId) : null
                const video = !topic ? videos.find(v => v.scriptId === script.id) : null
                const isSelected = selectedId === script.id
                return (
                  <div
                    key={script.id}
                    onClick={() => handleSelect(script)}
                    style={{
                      position: 'relative',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    className="group"
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {script.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span>{script.wordCount} 字</span>
                      <span>·</span>
                      <span>{formatDuration(script.estimatedDuration)}</span>
                      {topic && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{topic.title}</span>
                        </>
                      )}
                      {!topic && video && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{video.title}</span>
                        </>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{fromNow(script.updatedAt)}</p>

                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(script.id) }}
                      style={{
                        position: 'absolute', right: 10, top: 10,
                        opacity: 0, padding: 4, borderRadius: 4, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        color: 'var(--text-tertiary)', transition: 'opacity .1s, background .1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.12)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                      className="delete-btn"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 3h10M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M5 5.5v3M7 5.5v3M2 3l.6 7a1 1 0 001 .9h4.8a1 1 0 001-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedScript ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
                background: 'var(--bg-surface)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingTitle ? (
                    <input
                      autoFocus
                      value={titleValue}
                      onChange={e => setTitleValue(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleTitleSave()
                        if (e.key === 'Escape') { setTitleValue(selectedScript.title); setEditingTitle(false) }
                      }}
                      style={{
                        width: '100%', fontSize: 16, fontWeight: 600,
                        background: 'transparent', border: 'none',
                        borderBottom: '2px solid var(--accent)',
                        color: 'var(--text-primary)', outline: 'none',
                        fontFamily: 'inherit', padding: '2px 0',
                      }}
                    />
                  ) : (
                    <h2
                      onClick={() => { setTitleValue(selectedScript.title); setEditingTitle(true) }}
                      title="点击编辑标题"
                      style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', cursor: 'text', transition: 'color .1s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                    >
                      {selectedScript.title}
                    </h2>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    <span>{editorContent.replace(/\s+/g, '').length} 字</span>
                    <span>·</span>
                    <span>预估 {formatDuration(Math.round(editorContent.replace(/\s+/g, '').length / 3.5))}</span>
                    <span>·</span>
                    <span>更新于 {formatDate(selectedScript.updatedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {saveLabel && (
                    <span style={{ fontSize: 12, color: saveLabelColor, transition: 'color .2s' }}>
                      {saveLabel}
                    </span>
                  )}

                  {/* 检测按钮 */}
                  <button
                    onClick={handleDetect}
                    disabled={!editorContent.trim() || detecting}
                    title="检测内容合规风险（抖音/小红书/视频号）"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 5, border: 'none',
                      background: findings.length > 0 ? 'var(--accent-subtle)' : 'transparent',
                      color: findings.length > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                      cursor: editorContent.trim() ? 'pointer' : 'not-allowed',
                      opacity: editorContent.trim() ? 1 : 0.4,
                      fontSize: 12, fontWeight: findings.length > 0 ? 600 : 400,
                      transition: 'background .15s, color .15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      if (editorContent.trim()) (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)'
                    }}
                    onMouseLeave={e => {
                      if (editorContent.trim()) {
                        (e.currentTarget as HTMLElement).style.background = findings.length > 0 ? 'var(--accent-subtle)' : 'transparent'
                      }
                    }}
                  >
                    {detecting ? (
                      <span style={{ width: 12, height: 12, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M6.5 1L1.5 11h10L6.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M6.5 4.5v2.5M6.5 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                    {detecting ? '检测中…' : findings.length > 0 ? `风险 ${findings.length}` : '检测'}
                  </button>

                  {/* 检测通过提示 */}
                  {detectionDone && findings.length === 0 && (
                    <span style={{
                      fontSize: 12, color: 'var(--success)',
                      display: 'flex', alignItems: 'center', gap: 3,
                      animation: 'fadeIn .2s ease-out',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 6.5l2 2 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      未发现风险
                    </span>
                  )}

                  <button
                    onClick={handleCopy}
                    disabled={!editorContent}
                    title="复制全文"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 5, border: 'none',
                      background: copyState === 'copied' ? 'rgba(52,211,153,0.12)' : 'transparent',
                      color: copyState === 'copied' ? 'var(--success)' : 'var(--text-tertiary)',
                      cursor: editorContent ? 'pointer' : 'not-allowed',
                      opacity: editorContent ? 1 : 0.4,
                      fontSize: 12, transition: 'background .15s, color .15s',
                    }}
                    onMouseEnter={e => { if (editorContent && copyState === 'idle') (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (copyState === 'idle') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {copyState === 'copied' ? (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 7l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 3V2.5A1.5 1.5 0 012.5 1H2A1.5 1.5 0 00.5 2.5v6A1.5 1.5 0 002 10h.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                    {copyState === 'copied' ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              {loadingContent ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  <ScriptEditor
                    key={selectedId}
                    content={editorContent}
                    onChange={handleContentChangeWithDetection}
                    highlightRange={highlightRange}
                  />
                  {findings.length > 0 && (
                    <ScriptRiskPanel
                      findings={findings}
                      onFindingClick={handleFindingClick}
                      onDismiss={handleDismissRisk}
                      onRedetect={handleRedetect}
                      dismissedIds={dismissedFindingIds}
                      activeFindingId={highlightedFindingId}
                      stale={detectionStale}
                    />
                  )}
                  {detectError && (
                    <div style={{
                      position: 'absolute', bottom: 12, right: 16,
                      padding: '6px 12px', borderRadius: 6,
                      background: 'rgba(248,113,113,0.12)',
                      color: 'var(--danger)', fontSize: 12,
                    }}>
                      {detectError}
                      <button
                        onClick={() => setDetectError(null)}
                        style={{ marginLeft: 8, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="4" width="36" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 16h20M14 24h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                }
                title="选择一篇稿件开始编辑"
                description="从左侧列表选择，或新建一篇逐字稿"
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="新建逐字稿"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!newTitle.trim()}>创建</Button>
          </>
        }
      >
        <Input
          label="稿件标题"
          placeholder="例：我用这个方法1个月读了12本书"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
        />
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="删除逐字稿"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              确认删除
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          删除后将同时删除本地的 .md 文件，此操作不可撤销。
        </p>
      </Modal>
    </PageContainer>
  )
}
