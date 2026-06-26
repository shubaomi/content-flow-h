import { useEffect, useRef } from 'react'

interface ScriptEditorProps {
  content: string
  onChange: (content: string) => void
  highlightRange?: { start: number; end: number } | null
}

export function ScriptEditor({ content, onChange, highlightRange }: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 当外部传入高亮范围时，选中并滚动到对应文本
  useEffect(() => {
    if (!highlightRange || !textareaRef.current) return
    const ta = textareaRef.current
    ta.focus()
    ta.setSelectionRange(highlightRange.start, highlightRange.end)

    // 滚动到选区可见：将光标位置滚动到可视区域
    // 通过临时设置 scrollTop 近似实现
    const lineHeight = 25.2 // 14px * 1.8
    const estimatedLine = Math.floor(highlightRange.start / 40) // 粗略估算每行40字符
    const estimatedScroll = Math.max(0, estimatedLine * lineHeight - 100)
    ta.scrollTop = estimatedScroll
  }, [highlightRange])

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <textarea
        ref={textareaRef}
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
          color: 'var(--text-primary)',
          overflowY: 'auto',
          height: '100%',
        }}
      />
    </div>
  )
}
