export type EditorialReviewSeverity = 'error' | 'warning' | 'info'

export interface EditorialReviewNote {
  status?: string
  scoreText?: string
  conclusion?: string
  issues: Array<{
    severity: EditorialReviewSeverity
    message: string
  }>
  suggestions: string[]
}

export function parseEditorialReviewNote(notes?: string): EditorialReviewNote | null {
  const text = String(notes || '')
  const start = text.indexOf('人工审稿参考:')
  if (start < 0) return null

  const afterStart = text.slice(start)
  const sourceIndex = afterStart.search(/\n\s*Source:\s+vault-import:/u)
  const block = (sourceIndex >= 0 ? afterStart.slice(0, sourceIndex) : afterStart).trim()
  const lines = block.split(/\r?\n/u).map(line => line.trim()).filter(Boolean)
  const review: EditorialReviewNote = { issues: [], suggestions: [] }
  let inSuggestions = false

  for (const line of lines) {
    if (line === '人工审稿参考:') continue
    const status = line.match(/^-\s*状态:\s*(.+)$/u)
    if (status) {
      review.status = status[1].trim()
      continue
    }
    const score = line.match(/^-\s*分数:\s*(.+)$/u)
    if (score) {
      review.scoreText = score[1].trim()
      continue
    }
    const conclusion = line.match(/^-\s*结论:\s*(.+)$/u)
    if (conclusion) {
      review.conclusion = conclusion[1].trim()
      continue
    }
    if (/^-\s*修改建议:/u.test(line)) {
      inSuggestions = true
      continue
    }
    const issue = line.match(/^-\s*\[(error|warning|info)\]\s*(.+)$/u)
    if (issue) {
      review.issues.push({
        severity: issue[1] as EditorialReviewSeverity,
        message: issue[2].trim(),
      })
      continue
    }
    if (inSuggestions && line.startsWith('- ')) {
      review.suggestions.push(line.slice(2).trim())
    }
  }

  if (!review.status && !review.scoreText && !review.conclusion && review.issues.length === 0) {
    return null
  }

  return review
}
