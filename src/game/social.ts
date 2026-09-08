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
  { id: 'devlog', label: 'Devlog', icon: '🛠️', baseFollowers: 450, description: 'Show behind the scenes.' },
  { id: 'opensource', label: 'Open Source', icon: '🐙', baseFollowers: 700, description: 'Release something for free.' },
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

export const TRENDING_HASHTAGS = [
  '#AIsafety',
  '#OpenSource',
  '#AGI',
  '#TechLayoffs',
  '#PromptEngineering',
  '#FutureOfWork',
  '#DataPrivacy',
  '#Superintelligence',
  '#NoCode',
  '#TrainingRun',
]

export const TRENDING_ROTATE_WEEKS = 3
export const TRENDING_BONUS_MULTIPLIER = 1.6

export function pickTrendingHashtag(exclude?: string): string {
  const pool = exclude ? TRENDING_HASHTAGS.filter((h) => h !== exclude) : TRENDING_HASHTAGS
  return pool[Math.floor(Math.random() * pool.length)] ?? TRENDING_HASHTAGS[0]
}

export function usesTrendingHashtag(text: string, hashtag: string): boolean {
  return text.toLowerCase().includes(hashtag.toLowerCase())
}

export const COMPETITOR_CLAPBACKS = [
  "Nice try — our users aren't going anywhere.",
  'Cute post. We just shipped something better.',
  'Thanks for the free marketing 😉',
  'Imitation is the sincerest form of flattery.',
  'Our roadmap says otherwise.',
  'Big talk for a company with your burn rate.',
  'lol ok',
  "We'll let our product speak for itself.",
]

export const COMPETITOR_REACTION_CHANCE = 0.25
export const COMPETITOR_SMEAR_REACTION_CHANCE = 0.4
