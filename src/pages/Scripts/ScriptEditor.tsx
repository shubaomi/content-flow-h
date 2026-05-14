import { useAppStore } from '@/store/appStore'

interface ScriptEditorProps {
  content: string
  onChange: (content: string) => void
}

export function ScriptEditor({ content, onChange }: ScriptEditorProps) {
  const theme = useAppStore(s => s.data?.settings.theme ?? 'dark')

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          boxSizing: 'border-box',
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '24px 40px',
          maxWidth: 720,
          margin: '0 auto',
          display: 'block',
          fontFamily: '"Inter", "PingFang SC", sans-serif',
          fontSize: 14,
          lineHeight: 1.8,
          background: 'var(--bg-base)',
          color: theme === 'dark' ? '#E4E4E7' : '#111113',
          overflowY: 'auto',
          height: '100%',
        }}
      />
    </div>
  )
}
