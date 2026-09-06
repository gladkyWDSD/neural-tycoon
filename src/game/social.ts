import type { PostType } from './types'

export interface PostTypeInfo {
  id: PostType
  label: string
  icon: string
  baseFollowers: number
  description: string
}

export const POST_TYPES: PostTypeInfo[] = [
  { id: 'announcement', label: 'Announcement', icon: '📢', baseFollowers: 600, description: 'Big news about your company.' },
  { id: 'update', label: 'Update', icon: '🚀', baseFollowers: 400, description: 'Ship an update to your models.' },
  { id: 'hype', label: 'Hype', icon: '🔥', baseFollowers: 500, description: 'Generate excitement.' },
  { id: 'meme', label: 'Meme', icon: '😂', baseFollowers: 800, description: 'Go viral with humor.' },
]

export const POST_TYPE_MAP: Record<PostType, PostTypeInfo> = Object.fromEntries(
  POST_TYPES.map((p) => [p.id, p]),
) as Record<PostType, PostTypeInfo>

export const FOLLOWER_BOOST_DIVISOR = 25000 // 25k followers = 2x growth

export function followerBoost(followers: number): number {
  return 1 + followers / FOLLOWER_BOOST_DIVISOR
}

export function followerGain(info: PostTypeInfo, followers: number, customers: number): number {
  const viral = 1 + followers / 20000
  const audience = 1 + customers / 100000
  const jitter = 0.8 + Math.random() * 0.4
  return Math.round(info.baseFollowers * viral * audience * jitter)
}
