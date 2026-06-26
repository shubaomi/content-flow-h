import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { branding } from '@/config/branding'
import { pickDirectory, isFileSystemSupported, isSecureContext } from '@/services/fileSystem'
import { useAppStore } from '@/store/appStore'

export function DirectorySetup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadData = useAppStore(s => s.loadData)

  const handlePick = async () => {
    if (!isSecureContext()) {
      setError('当前不在安全上下文中（需要 localhost 或 HTTPS）。Docker 部署时请通过 http://localhost:5174 访问，而非 IP 地址。')
      return
    }
    if (!isFileSystemSupported()) {
      setError('您的浏览器不支持 File System Access API，请使用 Chrome 或 Edge。')
      return
    }
    setLoading(true)
    setError('')
    try {
      await pickDirectory()
      await loadData()
      // 如果 loadData 完成后 data 仍为 null，说明有错误，读取 store error
      const storeError = useAppStore.getState().error
      if (storeError) {
        setError(`加载数据失败：${storeError}`)
      }
    } catch (e) {
      const err = e as Error
      if (err.name !== 'AbortError') {
        setError(`选择目录失败：${err.message || '请重试'}`)
        console.error('[DirectorySetup] pick failed:', e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-base)',
    }}>
      <div style={{ maxWidth: 360, width: '100%', margin: '0 16px', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(124,88,237,0.4)',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 16l6 6 14-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{branding.appName}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
          {branding.appSubtitle}<br />
          {branding.localDataDescription}
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
          {branding.localDataSteps.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" loading={loading} onClick={handlePick} style={{ width: '100%' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 10v2.5a1 1 0 001 1h11a1 1 0 001-1V10M8 1.5v8M5 5.5l3-3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          选择数据目录
        </Button>

        {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 12 }}>{error}</p>}

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 16 }}>
          需要 Chrome 86+ 或 Edge 86+ 以上版本
        </p>
      </div>
    </div>
  )
}
