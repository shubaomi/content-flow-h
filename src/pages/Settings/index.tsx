import { useState } from 'react'

const PRESET_COLORS = ['#7C3AED','#2563EB','#0EA5E9','#059669','#84CC16','#D97706','#DC2626','#DB2777','#64748B','#374151']
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { clearStoredHandle, pickDirectory } from '@/services/fileSystem'
import type { Tag, ChecklistItem } from '@/types'

export function Settings() {
  const data = useAppStore(s => s.data)
  const tags = data?.tags ?? []
  const updateSettings = useAppStore(s => s.updateSettings)
  const addTag = useAppStore(s => s.addTag)
  const updateTag = useAppStore(s => s.updateTag)
  const deleteTag = useAppStore(s => s.deleteTag)
  const loadData = useAppStore(s => s.loadData)

  const checklistItems = data?.checklistItems ?? []
  const addChecklistItem = useAppStore(s => s.addChecklistItem)
  const updateChecklistItem = useAppStore(s => s.updateChecklistItem)
  const deleteChecklistItem = useAppStore(s => s.deleteChecklistItem)

  const [tagModal, setTagModal] = useState<{ mode: 'new' | 'edit'; tag?: Tag } | null>(null)
  const [tagForm, setTagForm] = useState({ name: '', color: '#7C3AED' })
  const [checklistModal, setChecklistModal] = useState<{ mode: 'new' | 'edit'; item?: ChecklistItem } | null>(null)
  const [checklistText, setChecklistText] = useState('')
  const [reconnecting, setReconnecting] = useState(false)

  const openNewTag = () => { setTagForm({ name: '', color: '#7C3AED' }); setTagModal({ mode: 'new' }) }
  const openEditTag = (tag: Tag) => { setTagForm({ name: tag.name, color: tag.color }); setTagModal({ mode: 'edit', tag }) }

  const openNewChecklist = () => { setChecklistText(''); setChecklistModal({ mode: 'new' }) }
  const openEditChecklist = (item: ChecklistItem) => { setChecklistText(item.text); setChecklistModal({ mode: 'edit', item }) }

  const handleSaveChecklist = () => {
    if (!checklistText.trim()) return
    if (checklistModal?.mode === 'new') {
      addChecklistItem(checklistText.trim())
    } else if (checklistModal?.item) {
      updateChecklistItem(checklistModal.item.id, checklistText.trim())
    }
    setChecklistModal(null)
  }

  const handleSaveTag = () => {
    if (!tagForm.name.trim()) return
    if (tagModal?.mode === 'new') {
      addTag({ name: tagForm.name.trim(), color: tagForm.color })
    } else if (tagModal?.tag) {
      updateTag(tagModal.tag.id, { name: tagForm.name.trim(), color: tagForm.color })
    }
    setTagModal(null)
  }

  const handleExport = () => {
    if (!data) return
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ip_content_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReconnect = async () => {
    setReconnecting(true)
    try {
      await clearStoredHandle()
      await pickDirectory()
      await loadData()
    } finally {
      setReconnecting(false)
    }
  }

  const sectionTitle = (text: string) => (
    <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{text}</h2>
  )

  return (
    <PageContainer title="设置">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Theme */}
        <section>
          {sectionTitle('外观')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(['dark', 'light'] as const).map(t => {
              const active = data?.settings.theme === t
              return (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'all .12s',
                  }}
                >
                  {t === 'dark' ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M12 7.5A5 5 0 016.5 2 5 5 0 1012 7.5z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M2.8 11.2l1.1-1.1M10.1 3.9l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {t === 'dark' ? '深色模式' : '浅色模式'}
                </button>
              )
            })}
          </div>
        </section>

        {/* Tags */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            {sectionTitle('标签管理')}
            <Button variant="secondary" size="sm" onClick={openNewTag}>+ 新建标签</Button>
          </div>
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {tags.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>暂无标签</div>
            ) : (
              tags.map((tag, i) => (
                <div
                  key={tag.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < tags.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background .1s',
                    background: 'var(--bg-surface)',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{tag.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => openEditTag(tag)}
                      style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'color .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'color .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F87171'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Checklist Items */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            {sectionTitle('发布前检查项')}
            <Button variant="secondary" size="sm" onClick={openNewChecklist}>+ 新建检查项</Button>
          </div>
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {checklistItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>暂无检查项</div>
            ) : (
              checklistItems.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < checklistItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: 'var(--bg-surface)',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.text}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => openEditChecklist(item)}
                      style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'color .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'color .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F87171'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Data management */}
        <section>
          {sectionTitle('数据管理')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                title: '导出备份',
                desc: '将所有数据导出为 JSON 文件',
                action: <Button variant="secondary" size="sm" onClick={handleExport}>导出</Button>,
              },
              {
                title: '重新选择数据目录',
                desc: '更改或重新授权本地数据存储目录',
                action: <Button variant="secondary" size="sm" loading={reconnecting} onClick={handleReconnect}>重新选择</Button>,
              },
            ].map(item => (
              <div key={item.title} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</p>
                </div>
                {item.action}
              </div>
            ))}
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section>
          {sectionTitle('快捷键')}
          <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {[
              ['Cmd + S', '保存逐字稿'],
              ['Esc', '关闭弹窗 / 侧边栏'],
            ].map(([key, desc], i, arr) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</span>
                <kbd style={{
                  padding: '2px 8px', borderRadius: 4,
                  border: '1px solid var(--border-default)',
                  fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)',
                }}>{key}</kbd>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tag modal */}
      <Modal
        open={!!tagModal}
        onClose={() => setTagModal(null)}
        title={tagModal?.mode === 'new' ? '新建标签' : '编辑标签'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTagModal(null)}>取消</Button>
            <Button variant="primary" onClick={handleSaveTag} disabled={!tagForm.name.trim()}>保存</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="标签名称"
            value={tagForm.name}
            onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>颜色</label>
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                background: `${tagForm.color}20`, color: tagForm.color,
              }}>
                {tagForm.name || '预览'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setTagForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: tagForm.color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                    outline: tagForm.color === c ? '2px solid var(--bg-surface)' : 'none',
                    outlineOffset: '-4px',
                    cursor: 'pointer', padding: 0, flexShrink: 0,
                    transition: 'border .12s, outline .12s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
      {/* Checklist modal */}
      <Modal
        open={!!checklistModal}
        onClose={() => setChecklistModal(null)}
        title={checklistModal?.mode === 'new' ? '新建检查项' : '编辑检查项'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChecklistModal(null)}>取消</Button>
            <Button variant="primary" onClick={handleSaveChecklist} disabled={!checklistText.trim()}>保存</Button>
          </>
        }
      >
        <Input
          label="检查项内容"
          value={checklistText}
          onChange={e => setChecklistText(e.target.value)}
          autoFocus
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSaveChecklist() }}
        />
      </Modal>
    </PageContainer>
  )
}
