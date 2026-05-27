import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { PageContainer } from '@/components/layout/PageContainer'
import type { DouyinRawRecord, ShipinhaoRawRecord } from '@/types'

type Platform = 'douyin' | 'shipinhao'

// ===== 排序工具 =====
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>
      {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

function useSortable<T>(data: T[], defaultKey: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggle = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => [...data].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (av === bv) return 0
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv), 'zh')
    return sortDir === 'asc' ? cmp : -cmp
  }), [data, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggle }
}

// ===== 表头单元格 =====
function Th({
  label, sortKey, currentKey, dir, onSort, numeric = false,
}: {
  label: string
  sortKey: string
  currentKey: string
  dir: SortDir
  onSort: (k: string) => void
  numeric?: boolean
}) {
  const active = currentKey === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '8px 12px',
        fontSize: 11, fontWeight: 600,
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        textAlign: numeric ? 'right' : 'left',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        position: 'sticky', top: 0, zIndex: 1,
        transition: 'color .1s',
      }}
    >
      {label}
      <SortIcon active={active} dir={dir} />
    </th>
  )
}

// ===== 数值单元格 =====
function NumCell({ value, format }: { value: number; format?: (v: number) => string }) {
  const display = format ? format(value) : value.toLocaleString()
  return (
    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
      {display}
    </td>
  )
}

function TextCell({ value, maxWidth = 240 }: { value: string; maxWidth?: number }) {
  return (
    <td style={{
      padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)',
      maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }} title={value}>
      {value}
    </td>
  )
}

// ===== 抖音数据表格 =====
function DouyinTable({ records }: { records: DouyinRawRecord[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSortable(records, 'plays')

  const thProps = (key: string, label: string, numeric = false) => ({
    label, sortKey: key, currentKey: sortKey as string, dir: sortDir,
    onSort: toggle as (k: string) => void, numeric,
  })

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`
  const sec = (v: number) => `${v.toFixed(1)}s`

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <Th {...thProps('title', '作品名称')} />
            <Th {...thProps('publishedAt', '发布时间')} />
            <Th {...thProps('genre', '体裁')} />
            <Th {...thProps('plays', '播放量', true)} />
            <Th {...thProps('completionRate', '完播率', true)} />
            <Th {...thProps('fiveSecRate', '5s完播率', true)} />
            <Th {...thProps('twoSecBounceRate', '2s跳出率', true)} />
            <Th {...thProps('avgPlayDuration', '均播时长', true)} />
            <Th {...thProps('likes', '点赞', true)} />
            <Th {...thProps('shares', '分享', true)} />
            <Th {...thProps('comments', '评论', true)} />
            <Th {...thProps('saves', '收藏', true)} />
            <Th {...thProps('profileVisits', '主页访问', true)} />
            <Th {...thProps('followerGain', '粉丝增量', true)} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id}
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)'}
            >
              <TextCell value={row.title} />
              <TextCell value={row.publishedAt.slice(0, 10)} maxWidth={100} />
              <TextCell value={row.genre} maxWidth={90} />
              <NumCell value={row.plays} />
              <NumCell value={row.completionRate} format={pct} />
              <NumCell value={row.fiveSecRate} format={pct} />
              <NumCell value={row.twoSecBounceRate} format={pct} />
              <NumCell value={row.avgPlayDuration} format={sec} />
              <NumCell value={row.likes} />
              <NumCell value={row.shares} />
              <NumCell value={row.comments} />
              <NumCell value={row.saves} />
              <NumCell value={row.profileVisits} />
              <NumCell value={row.followerGain} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== 视频号数据表格 =====
function ShipinhaoTable({ records }: { records: ShipinhaoRawRecord[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSortable(records, 'plays')

  const thProps = (key: string, label: string, numeric = false) => ({
    label, sortKey: key, currentKey: sortKey as string, dir: sortDir,
    onSort: toggle as (k: string) => void, numeric,
  })

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <Th {...thProps('description', '视频描述')} />
            <Th {...thProps('publishedAt', '发布时间')} />
            <Th {...thProps('plays', '播放量', true)} />
            <Th {...thProps('completionRate', '完播率', true)} />
            <Th {...thProps('avgPlayDuration', '均播时长')} />
            <Th {...thProps('recommendations', '推荐', true)} />
            <Th {...thProps('likes', '喜欢', true)} />
            <Th {...thProps('comments', '评论', true)} />
            <Th {...thProps('shares', '分享', true)} />
            <Th {...thProps('follows', '关注', true)} />
            <Th {...thProps('forwardChat', '转发', true)} />
            <Th {...thProps('setRingtone', '设为铃声', true)} />
            <Th {...thProps('setStatus', '设为状态', true)} />
            <Th {...thProps('setMomentCover', '朋友圈封面', true)} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id}
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)'}
            >
              <TextCell value={row.description} />
              <TextCell value={row.publishedAt} maxWidth={100} />
              <NumCell value={row.plays} />
              <NumCell value={row.completionRate} format={pct} />
              <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.avgPlayDuration}</td>
              <NumCell value={row.recommendations} />
              <NumCell value={row.likes} />
              <NumCell value={row.comments} />
              <NumCell value={row.shares} />
              <NumCell value={row.follows} />
              <NumCell value={row.forwardChat} />
              <NumCell value={row.setRingtone} />
              <NumCell value={row.setStatus} />
              <NumCell value={row.setMomentCover} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== 主页面 =====
export function Analytics() {
  const douyinRecords = useAppStore(s => s.data?.douyinRecords ?? [])
  const shipinhaoRecords = useAppStore(s => s.data?.shipinhaoRecords ?? [])
  const [platform, setPlatform] = useState<Platform>('douyin')

  const tabs: { id: Platform; label: string; count: number }[] = [
    { id: 'douyin', label: '抖音', count: douyinRecords.length },
    { id: 'shipinhao', label: '视频号', count: shipinhaoRecords.length },
  ]

  const totalRecords = douyinRecords.length + shipinhaoRecords.length

  return (
    <PageContainer title="数据分析" subtitle={`${totalRecords} 条记录`}>
      {/* Platform Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setPlatform(t.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none', background: 'transparent',
              borderBottom: `2px solid ${platform === t.id ? 'var(--accent)' : 'transparent'}`,
              color: platform === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              marginBottom: -1, transition: 'color .1s', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '1px 6px', borderRadius: 99,
              background: platform === t.id ? 'var(--accent)' : 'var(--bg-elevated)',
              color: platform === t.id ? '#fff' : 'var(--text-tertiary)',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        {platform === 'douyin' && (
          douyinRecords.length === 0
            ? <EmptyHint platform="抖音" />
            : <DouyinTable records={douyinRecords} />
        )}
        {platform === 'shipinhao' && (
          shipinhaoRecords.length === 0
            ? <EmptyHint platform="视频号" />
            : <ShipinhaoTable records={shipinhaoRecords} />
        )}
      </div>
    </PageContainer>
  )
}

function EmptyHint({ platform }: { platform: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>暂无{platform}数据</p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>从平台后台导出数据后录入</p>
    </div>
  )
}
