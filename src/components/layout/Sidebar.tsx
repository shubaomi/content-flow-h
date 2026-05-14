import { NavLink } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

const NAV = [
  {
    path: '/dashboard',
    label: '概览',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="1.5" width="5" height="5" rx="1.2"/><rect x="1.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/></svg>,
  },
  {
    path: '/kanban',
    label: '看板',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="1.5" y="2.5" width="3.5" height="11" rx="1.2"/><rect x="6.25" y="2.5" width="3.5" height="8" rx="1.2"/><rect x="11" y="2.5" width="3.5" height="5.5" rx="1.2"/></svg>,
  },
  {
    path: '/videos',
    label: '视频库',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="10" height="10" rx="1.5"/><path d="M11 6.5l4-2v7l-4-2"/></svg>,
  },
  {
    path: '/topics',
    label: '选题库',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.69 3.99L8 10.4l-3.59 1.9.69-4L2.2 5.68l4-.58z"/></svg>,
  },
  {
    path: '/scripts',
    label: '逐字稿',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="1.5" width="12" height="13" rx="1.5"/><line x1="5" y1="5.5" x2="11" y2="5.5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="10.5" x2="9" y2="10.5"/></svg>,
  },
  {
    path: '/analytics',
    label: '数据分析',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,12 5,7.5 8.5,10 12,5 15,3"/></svg>,
  },
]

export function Sidebar() {
  const saving = useAppStore(s => s.saving)
  const theme = useAppStore(s => s.data?.settings.theme ?? 'dark')
  const updateSettings = useAppStore(s => s.updateSettings)

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full"
      style={{
        width: 220,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l3.5 3.5L12 3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>IP 内容管理</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
              {saving ? '保存中…' : '本地数据'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 10px',
              borderRadius: 7,
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              textDecoration: 'none',
              transition: 'all .12s',
              marginBottom: 2,
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              paddingLeft: isActive ? 9 : 10,
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'var(--bg-hover)'
                el.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent'
                el.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '8px 10px', borderRadius: 7,
            fontSize: 13, color: 'var(--text-secondary)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'all .12s', marginBottom: 2,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.1" y2="11.9"/><line x1="11.9" y1="4.1" x2="12.95" y2="3.05"/></svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 9.5A6.5 6.5 0 016.5 2 6.5 6.5 0 1014 9.5z"/></svg>
          )}
          {theme === 'dark' ? '浅色模式' : '深色模式'}
        </button>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 7,
            fontSize: 13,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            textDecoration: 'none', transition: 'all .12s',
          })}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="2"/>
            <path d="M14 8c0-.35-.03-.7-.09-1.03l1.6-1.25-1.5-2.6-1.9.77a5.2 5.2 0 00-1.78-1.03L9.9 1H6.1l-.43 1.86A5.2 5.2 0 003.9 3.9l-1.9-.78-1.5 2.6 1.6 1.25A5.3 5.3 0 002 8c0 .35.03.7.09 1.03L.5 10.28l1.5 2.6 1.9-.77c.53.43 1.12.77 1.78 1.03L6.1 15h3.8l.43-1.86a5.2 5.2 0 001.78-1.03l1.9.78 1.5-2.6-1.6-1.25C13.97 8.7 14 8.35 14 8z"/>
          </svg>
          设置
        </NavLink>
      </div>
    </aside>
  )
}
