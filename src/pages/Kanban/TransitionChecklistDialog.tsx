import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/appStore'
import type { TransitionKey } from '@/types'

interface TransitionChecklistDialogProps {
  open: boolean
  videoTitle: string
  transitionKey: TransitionKey
  title: string
  description: string
  confirmLabel: string
  accentColor: string
  iconSvg: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function TransitionChecklistDialog({
  open,
  videoTitle,
  transitionKey,
  title,
  description,
  confirmLabel,
  accentColor,
  iconSvg,
  onConfirm,
  onCancel,
}: TransitionChecklistDialogProps) {
  const items = useAppStore(s => s.data?.transitionChecklists[transitionKey] ?? [])
  const [checked, setChecked] = useState<boolean[]>([])

  const effectiveChecked = items.map((_, i) => checked[i] ?? false)
  const allChecked = items.length === 0 || effectiveChecked.every(Boolean)

  const toggle = (i: number) =>
    setChecked(() => {
      const next = [...effectiveChecked]
      next[i] = !next[i]
      return next
    })

  const handleCancel = () => {
    setChecked([])
    onCancel()
  }

  const handleConfirm = () => {
    if (!allChecked) return
    setChecked([])
    onConfirm()
  }

  const hexToRgb = (color: string) => {
    if (color.startsWith('var(')) return '99,102,241'
    const hex = color.replace('#', '')
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `${r},${g},${b}`
    }
    return '99,102,241'
  }

  const rgb = hexToRgb(accentColor)
  const bgAlpha = `rgba(${rgb},0.15)`
  const borderAlpha = `rgba(${rgb},0.3)`
  const checkedBg = `rgba(${rgb},0.08)`
  const checkedBorder = `rgba(${rgb},0.4)`

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
              background: allChecked ? accentColor : 'var(--bg-elevated)',
              color: allChecked ? '#fff' : 'var(--text-tertiary)',
              border: 'none', cursor: allChecked ? 'pointer' : 'not-allowed',
              transition: 'background .12s',
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: bgAlpha,
          border: `1px solid ${borderAlpha}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {iconSvg}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
          {description}
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

        {items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <label
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 8,
                  background: effectiveChecked[i] ? checkedBg : 'var(--bg-elevated)',
                  border: `1px solid ${effectiveChecked[i] ? checkedBorder : 'var(--border-subtle)'}`,
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'background .12s, border-color .12s',
                }}
              >
                <input
                  type="checkbox"
                  checked={effectiveChecked[i]}
                  onChange={() => toggle(i)}
                  style={{ marginTop: 2, accentColor, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: bgAlpha,
            border: `1px solid ${borderAlpha}`,
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 12, color: accentColor, lineHeight: 1.5, margin: 0 }}>
              此操作表示内容已通过人工审核。状态变更后将记录在进度历史中。
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
