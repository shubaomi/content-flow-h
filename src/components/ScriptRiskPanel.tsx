import type { RiskFinding, RiskLevel } from '@/types'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, RISK_LEVEL_ORDER } from '@/types'
import { Button } from '@/components/ui/Button'

interface ScriptRiskPanelProps {
  findings: RiskFinding[]
  onFindingClick: (finding: RiskFinding) => void
  onDismiss: (id: string) => void
  onRedetect: () => void
  dismissedIds: Set<string>
  activeFindingId?: string | null
  stale?: boolean
}

const LEVEL_DOTS: Record<RiskLevel, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
}

function getStats(findings: RiskFinding[]) {
  return {
    total: findings.length,
    critical: findings.filter(f => f.level === 'critical').length,
    high: findings.filter(f => f.level === 'high').length,
    medium: findings.filter(f => f.level === 'medium').length,
    low: findings.filter(f => f.level === 'low').length,
  }
}

export function ScriptRiskPanel({
  findings,
  onFindingClick,
  onDismiss,
  onRedetect,
  dismissedIds,
  activeFindingId,
  stale,
}: ScriptRiskPanelProps) {
  const visible = findings.filter(f => !dismissedIds.has(f.id))
  const sorted = [...visible].sort((a, b) => {
    const lv = RISK_LEVEL_ORDER[a.level] - RISK_LEVEL_ORDER[b.level]
    if (lv !== 0) return lv
    return a.start - b.start
  })
  const stats = getStats(visible)

  if (findings.length === 0 && !stale) return null

  return (
    <div style={{
      width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L1.5 12h11L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M7 5v2.5M7 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            风险检测
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {stats.total} 项
        </span>
      </div>

      {/* Stats bar */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', gap: 10, fontSize: 11,
      }}>
        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(lv => {
          const count = stats[lv]
          if (count === 0) return null
          return (
            <span key={lv} style={{
              color: RISK_LEVEL_COLORS[lv],
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {LEVEL_DOTS[lv]} {RISK_LEVEL_LABELS[lv]} {count}
            </span>
          )
        })}
      </div>

      {/* Stale warning */}
      {stale && (
        <div style={{
          padding: '6px 16px', fontSize: 11,
          color: 'var(--warning)',
          background: 'rgba(251,191,36,0.08)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          内容已修改，检测结果可能已过期
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            fontSize: 12, color: 'var(--text-tertiary)',
          }}>
            {findings.filter(f => !dismissedIds.has(f.id)).length === 0
              ? (findings.length > 0 ? '所有风险项已处理' : '未发现风险 ✅')
              : '所有风险项已处理'}
          </div>
        ) : (
          sorted.map(f => {
            const isActive = activeFindingId === f.id
            const color = RISK_LEVEL_COLORS[f.level]
            return (
              <div
                key={f.id}
                onClick={() => onFindingClick(f)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                      background: `${color}18`, color,
                    }}>
                      {RISK_LEVEL_LABELS[f.level]}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {f.rule}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDismiss(f.id) }}
                    title="忽略此项"
                    style={{
                      width: 20, height: 20, borderRadius: 4, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-tertiary)', fontSize: 12, transition: 'background .1s, color .1s',
                    }}
                    onMouseEnter={el => {
                      el.currentTarget.style.background = 'var(--bg-hover)'
                      el.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={el => {
                      el.currentTarget.style.background = 'transparent'
                      el.currentTarget.style.color = 'var(--text-tertiary)'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Evidence snippet */}
                <div style={{
                  fontSize: 11, color: 'var(--text-tertiary)',
                  padding: '4px 8px', borderRadius: 4,
                  background: 'var(--bg-elevated)',
                  marginBottom: 6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  borderLeft: `2px solid ${color}`,
                }}>
                  「{f.evidence.length > 60 ? f.evidence.slice(0, 60) + '…' : f.evidence}」
                </div>

                {/* Message */}
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
                  {f.message}
                </p>

                {/* Suggestion */}
                <p style={{ fontSize: 11, color: 'var(--success)', lineHeight: 1.5 }}>
                  💡 {f.suggestion}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <Button
          variant="primary"
          size="sm"
          onClick={onRedetect}
          style={{ width: '100%' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <path d="M1.5 6.5A4.5 4.5 0 0110.25 4M10.5 5.5A4.5 4.5 0 011.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M10.5 1v3h-3M1.5 11V8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          重新检测
        </Button>
      </div>
    </div>
  )
}
