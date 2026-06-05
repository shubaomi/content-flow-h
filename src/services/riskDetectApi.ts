import type { RiskFinding } from '@/types'

export async function detectRisk(content: string): Promise<RiskFinding[]> {
  const res = await fetch('/api/detect-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `请求失败 (${res.status})`)
  }

  return res.json()
}
