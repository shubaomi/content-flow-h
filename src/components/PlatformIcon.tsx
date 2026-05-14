import type { Platform } from '@/types'
import { PLATFORM_LABELS } from '@/types'
import douyinImg from '@/assets/platform-douyin.png'
import xiaohongshuImg from '@/assets/platform-xiaohongshu.png'
import shipinhaoImg from '@/assets/platform-shipinhao.png'

interface PlatformIconProps {
  platform: Platform
  size?: number
  showLabel?: boolean
  className?: string
}

const platformImages: Record<Platform, string> = {
  douyin: douyinImg,
  xiaohongshu: xiaohongshuImg,
  shipinhao: shipinhaoImg,
}

export function PlatformIcon({ platform, size = 18, showLabel, className = '' }: PlatformIconProps) {
  const img = (
    <img
      src={platformImages[platform]}
      alt={PLATFORM_LABELS[platform]}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  )

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {img}
        <span className="text-xs text-[var(--text-secondary)]">{PLATFORM_LABELS[platform]}</span>
      </span>
    )
  }
  return (
    <span
      className={`inline-flex flex-shrink-0 ${className}`}
      title={PLATFORM_LABELS[platform]}
      style={{ width: size, height: size }}
    >
      {img}
    </span>
  )
}
