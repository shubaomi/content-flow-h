import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 7, fontWeight: 500, cursor: 'pointer',
  transition: 'all .12s', userSelect: 'none', border: 'none',
  fontFamily: 'inherit',
}

const VARIANTS: Record<string, React.CSSProperties> = {
  primary:   { background: 'var(--accent)', color: '#fff', boxShadow: '0 1px 3px rgba(124,58,237,.35)' },
  secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
  ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: 'none' },
  danger:    { background: 'transparent', color: '#f87171', border: 'none' },
}

const SIZES: Record<string, React.CSSProperties> = {
  sm: { height: 28, padding: '0 10px', fontSize: 12, gap: 5 },
  md: { height: 32, padding: '0 12px', fontSize: 13, gap: 6 },
  lg: { height: 36, padding: '0 16px', fontSize: 14, gap: 7 },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon, children, style, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...SIZES[size],
        opacity: (disabled || loading) ? 0.5 : 1,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading
        ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
        : icon
      }
      {children}
    </button>
  )
)
Button.displayName = 'Button'
