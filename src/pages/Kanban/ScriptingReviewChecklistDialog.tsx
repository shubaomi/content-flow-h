import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface ScriptingReviewChecklistDialogProps {
  open: boolean
  videoTitle: string
  onConfirm: () => void
  onCancel: () => void
}

const HOOK_OPTIMIZATION_CHECK = '已完成开头优化（降低2～5秒跳出率）'

export function ScriptingReviewChecklistDialog({
  open,
  videoTitle,
  onConfirm,
  onCancel,
}: ScriptingReviewChecklistDialogProps) {
  const [checked, setChecked] = useState(false)

  const handleCancel = () => {
    setChecked(false)
    onCancel()
  }

  const handleConfirm = () => {
    if (!checked) return
    setChecked(false)
    onConfirm()
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size="sm"
      footer={
        <>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--bg-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-default)', cursor: 'pointer',
              transition: 'background .12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!checked}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
              color: checked ? '#fff' : 'var(--text-tertiary)',
              border: 'none', cursor: checked ? 'pointer' : 'not-allowed',
              transition: 'background .12s',
            }}
            onMouseEnter={e => {
              if (checked) (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
            }}
            onMouseLeave={e => {
              if (checked) (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
            }}
          >
            确认，提交审核
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-light)',
          border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--accent)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <path d="m9 10 2 2 4-4"/>
          </svg>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          确认提交到「待审核」
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
          提交审核前，请确认稿件开头已完成留存优化。
        </p>

        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'left', marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>视频</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
            {videoTitle}
          </p>
        </div>

        <label
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px', borderRadius: 8,
            background: checked ? 'var(--accent-light)' : 'var(--bg-elevated)',
            border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-subtle)'}`,
            textAlign: 'left', cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {HOOK_OPTIMIZATION_CHECK}
          </span>
        </label>
      </div>
    </Modal>
  )
}
