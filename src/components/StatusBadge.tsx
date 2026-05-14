import type { VideoStatus } from '@/types'
import { VIDEO_STATUS_LABELS } from '@/types'

const STATUS_STYLE: Record<VideoStatus, { bg: string; color: string }> = {
  topic:     { bg: 'var(--status-topic-bg)',     color: 'var(--status-topic-text)' },
  scripting: { bg: 'var(--status-scripting-bg)', color: 'var(--status-scripting-text)' },
  review:    { bg: 'var(--status-review-bg)',    color: 'var(--status-review-text)' },
  filming:   { bg: 'var(--status-filming-bg)',   color: 'var(--status-filming-text)' },
  editing:   { bg: 'var(--status-editing-bg)',   color: 'var(--status-editing-text)' },
  published: { bg: 'var(--status-published-bg)', color: 'var(--status-published-text)' },
  archived:  { bg: 'var(--status-archived-bg)',  color: 'var(--status-archived-text)' },
}

export function StatusBadge({ status, className }: { status: VideoStatus; className?: string }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 9px', borderRadius: 99,
        fontSize: 11, fontWeight: 600,
        background: s.bg, color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {VIDEO_STATUS_LABELS[status]}
    </span>
  )
}
