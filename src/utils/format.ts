export const formatNumber = (n: number): string => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}亿`
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`
  return n.toLocaleString()
}

export const calcEngagement = (
  likes: number,
  comments: number,
  shares: number,
  plays: number,
): number => {
  if (plays === 0) return 0
  return +((( likes + comments + shares) / plays) * 100).toFixed(2)
}

export const estimateDuration = (wordCount: number): number =>
  Math.round(wordCount / 3.5)
