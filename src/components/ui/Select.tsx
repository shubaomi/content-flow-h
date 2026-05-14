import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        ref={ref}
        style={{
          height: 32, padding: '0 10px', borderRadius: 7,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)', color: 'var(--text-primary)',
          fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          outline: 'none',
          ...style,
        }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
)
Select.displayName = 'Select'
