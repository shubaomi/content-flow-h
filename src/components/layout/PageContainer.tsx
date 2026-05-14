import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  noPadding?: boolean
}

export function PageContainer({ title, subtitle, actions, children, noPadding }: PageContainerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: noPadding ? 'hidden' : 'auto',
        ...(noPadding ? {} : { padding: '24px' }),
      }}>
        {children}
      </div>
    </div>
  )
}
