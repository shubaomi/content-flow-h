import type { EditorialReviewNote, EditorialReviewSeverity } from '@/services/editorialReviewNote'

interface Props {
  review: EditorialReviewNote | null
  compact?: boolean
}

export function EditorialReviewPanel({ review, compact = false }: Props) {
  if (!review) return null

  const issueLimit = compact ? 3 : 6

  return (
    <div style={{
      marginBottom: 16,
      padding: compact ? 12 : 14,
      borderRadius: 10,
      border: '1px solid var(--status-review-border)',
      background: 'var(--status-review-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-review-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          人工审稿参考
        </span>
        {(review.status || review.scoreText) && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
            {[review.status, review.scoreText].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {review.conclusion && (
        <p style={{ fontSize: compact ? 12 : 13, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: review.issues.length ? 8 : 0 }}>
          {review.conclusion}
        </p>
      )}

      {review.issues.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {review.issues.slice(0, issueLimit).map((issue, index) => (
            <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0,
                marginTop: 2,
                fontSize: 10,
                fontWeight: 700,
                color: severityColor(issue.severity),
              }}>
                {severityLabel(issue.severity)}
              </span>
              <p style={{ fontSize: compact ? 12 : 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                {issue.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {!compact && review.suggestions.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--status-review-border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>修改建议</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {review.suggestions.slice(0, 4).map((suggestion, index) => (
              <p key={index} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                {index + 1}. {suggestion}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function severityLabel(severity: EditorialReviewSeverity) {
  if (severity === 'error') return '必须'
  if (severity === 'warning') return '建议'
  return '提示'
}

function severityColor(severity: EditorialReviewSeverity) {
  if (severity === 'error') return 'var(--danger)'
  if (severity === 'warning') return 'var(--status-review-text)'
  return 'var(--text-tertiary)'
}
