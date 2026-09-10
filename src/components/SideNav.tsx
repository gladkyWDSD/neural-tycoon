import type { GameState } from '../game/types'
import { maxStaff } from '../game/state'
import { activeCards } from '../game/gpu'
import { serviceLoad } from '../game/state'
import { RESEARCH_MAP } from '../game/research'
import { CAMPAIGN_DURATION } from '../game/constants'
import './Game.css'

export type PanelId =
  | 'hire'
  | 'build'
  | 'research'
  | 'datacenters'
  | 'twitter'
  | 'ads'
  | 'competitors'
  | 'company'
  | 'government'
  | 'trading'
  | null

interface Tile {
  id: Exclude<PanelId, null>
  label: string
  value: string
  note?: string
  /** something is running here right now, so the tile glows */
  busy?: boolean
  title: string
}

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return `${Math.round(n)}`
}

/** Every readout is also the way into the panel behind it. */
function tilesFor(state: GameState, racing: boolean): Tile[] {
  const training = state.models.filter((m) => m.status === 'training')
  const ready = state.models.filter((m) => m.status === 'ready').length
  const live = state.models.filter((m) => m.status === 'published').length
  const research = state.researching.length > 0
    ? [...state.researching].sort((a, b) => a.weeksRemaining - b.weeksRemaining)[0]
    : null
  const learning = state.staffTraining.length
  const rawLoad = serviceLoad(state)
  const load = Number.isFinite(rawLoad) ? rawLoad : 9.99

  return [
    {
      id: 'hire',
      label: 'Staff',
      value: `${state.staff.length}/${maxStaff(state)}`,
      note: learning > 0 ? `${learning} in training` : undefined,
      busy: learning > 0,
      title: 'Hire and train people',
    },
    {
      id: 'build',
      label: 'Models',
      value: training.length > 0 ? `${Math.ceil(training[0].weeksRemaining)}w left` : `${live} live`,
      note: training.length > 1
        ? `${training.length} training`
        : training.length === 1
          ? `training ${training[0].name}`
          : ready > 0
            ? `${ready} ready to ship`
            : undefined,
      busy: training.length > 0,
      title: 'Train and publish AI models',
    },
    {
      id: 'research',
      label: 'Research',
      value: research ? `${Math.ceil(research.weeksRemaining)}w left` : `${state.researched.length} done`,
      note: state.researching.length > 1
        ? `${state.researching.length} running`
        : research
          ? RESEARCH_MAP[research.id]?.name
          : undefined,
      busy: Boolean(research),
      title: 'Unlock new techniques',
    },
    {
      id: 'datacenters',
      label: 'Compute',
      value: `${activeCards(state)} GPU`,
      note: load > 1
        ? `over capacity, ${Math.round(load * 100)}%`
        : state.datacenterBuilds.length > 0
          ? `${state.datacenterBuilds.length} building`
          : `${Math.round(load * 100)}% of capacity used`,
      busy: state.datacenterBuilds.length > 0 || load > 1,
      title: 'Buy hardware and datacenters',
    },
    {
      id: 'twitter',
      label: 'Followers',
      value: compact(state.followers),
      note: state.campaignWeeksLeft > 0
        ? `campaign ${CAMPAIGN_DURATION - state.campaignWeeksLeft}/${CAMPAIGN_DURATION}`
        : undefined,
      busy: state.campaignWeeksLeft > 0,
      title: 'Post, trend and run campaigns',
    },
    {
      id: 'ads',
      label: 'Dirty tricks',
      value: 'Ads',
      note: 'bots · hackers · press',
      title: 'Bot swarms, hackers and paid journalists',
    },
    ...(racing
      ? [
          {
            id: 'trading' as const,
            label: 'Trading',
            value: state.pacts.length > 0 ? `${state.pacts.length} pact${state.pacts.length > 1 ? 's' : ''}` : 'Deals',
            note: state.sentTrade ? `offer with ${state.sentTrade.targetName}` : 'compute · research · pacts',
            busy: Boolean(state.sentTrade),
            title: 'Sell compute, license research and sign pacts with the other players',
          },
        ]
      : []),
    {
      id: 'government',
      label: 'Regulation',
      value: state.activeRegulations.length > 0 ? `${state.activeRegulations.length} laws` : 'Clear',
      note: state.lobbyWeeksLeft > 0 ? `lobbying ${state.lobbyWeeksLeft}w` : undefined,
      busy: state.lobbyWeeksLeft > 0,
      title: 'Laws you live under, and lobbyists',
    },
  ]
}

export function SideNav({ state, panel, racing, onOpen }: {
  state: GameState
  panel: PanelId
  /** the Trading tab only exists while a race is running */
  racing: boolean
  onOpen: (id: PanelId) => void
}) {
  return (
    <nav className="sidenav">
      {tilesFor(state, racing).map((t) => (
        <button
          key={t.id}
          className={`nav-tile ${panel === t.id ? 'active' : ''} ${t.busy ? 'busy' : ''}`}
          onClick={() => onOpen(panel === t.id ? null : t.id)}
          title={t.title}
        >
          <span className="nav-label">{t.label}</span>
          <span className="nav-value">{t.value}</span>
          {t.note && <span className="nav-note">{t.note}</span>}
        </button>
      ))}
    </nav>
  )
}
