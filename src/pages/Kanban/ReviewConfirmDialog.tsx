import { Modal } from '@/components/ui/Modal'

interface ReviewConfirmDialogProps {
  open: boolean
  videoTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function ReviewConfirmDialog({ open, videoTitle, onConfirm, onCancel }: ReviewConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#f97316', color: '#fff',
              border: 'none', cursor: 'pointer',
              transition: 'background .12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ea6c0a'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f97316'}
          >
            已确认，推进拍摄
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        {/* 图标区 */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>

        {/* 标题 */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          确认推进到「拍摄中」
        </h3>

        {/* 说明文字 */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
          请确认以下内容已通过人工审核，方可推进至拍摄阶段。
        </p>

        {/* 视频标题卡片 */}
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

        {/* 警示框 */}
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.2)',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 12, color: '#f97316', lineHeight: 1.5, margin: 0 }}>
            此操作表示内容已通过人工审核。状态变更后将记录在进度历史中。
          </p>
        </div>
      </div>
    </Modal>
  )
}
