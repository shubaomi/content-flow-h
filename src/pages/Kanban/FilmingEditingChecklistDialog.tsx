import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface FilmingEditingChecklistDialogProps {
  open: boolean
  videoTitle: string
  onConfirm: () => void
  onCancel: () => void
}

const FILMING_EDITING_CHECKS = [
  '自己看回放满意，无需重拍',
  '已和剪辑同学同步剪辑建议和要点',
] as const

export function FilmingEditingChecklistDialog({
  open,
  videoTitle,
  onConfirm,
  onCancel,
}: FilmingEditingChecklistDialogProps) {
  const [checked, setChecked] = useState([false, false])

  const allChecked = checked.every(Boolean)

  const handleCancel = () => {
    setChecked([false, false])
    onCancel()
  }

  const handleConfirm = () => {
    if (!allChecked) return
    setChecked([false, false])
    onConfirm()
  }

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)))

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
            disabled={!allChecked}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: allChecked ? '#8b5cf6' : 'var(--bg-elevated)',
              color: allChecked ? '#fff' : 'var(--text-tertiary)',
              border: 'none', cursor: allChecked ? 'pointer' : 'not-allowed',
              transition: 'background .12s',
            }}
            onMouseEnter={e => {
              if (allChecked) (e.currentTarget as HTMLElement).style.background = '#7c3aed'
            }}
            onMouseLeave={e => {
              if (allChecked) (e.currentTarget as HTMLElement).style.background = '#8b5cf6'
            }}
          >
            确认，进入剪辑
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="6" cy="18" r="3"/>
            <line x1="20" y1="4" x2="8.12" y2="15.88"/>
            <line x1="14.47" y1="14.48" x2="20" y2="20"/>
            <line x1="8.12" y1="8.12" x2="12" y2="12"/>
          </svg>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          确认推进到「剪辑中」
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
          进入剪辑前，请确认以下两项均已完成。
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FILMING_EDITING_CHECKS.map((text, i) => (
            <label
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 8,
                background: checked[i] ? 'rgba(139,92,246,0.08)' : 'var(--bg-elevated)',
                border: `1px solid ${checked[i] ? 'rgba(139,92,246,0.4)' : 'var(--border-subtle)'}`,
                textAlign: 'left', cursor: 'pointer',
                transition: 'background .12s, border-color .12s',
              }}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                style={{ marginTop: 2, accentColor: '#8b5cf6', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {text}
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
