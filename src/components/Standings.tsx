import type { LobbyPlayer } from '../game/multiplayer'
import { formatMoney } from '../game/format'
import './Lobby.css'

interface Props {
  players: LobbyPlayer[]
  selfId: string
  isHost: boolean
}

/** Live race standings, shown over the office while a multiplayer game runs. */
export function Standings({ players, selfId, isHost }: Props) {
  if (players.length === 0) return null
  const ranked = [...players].sort((a, b) => b.valuation - a.valuation)
  return (
    <div className="standings">
      <p className="standings-title">Race to $100B</p>
      {ranked.map((p, i) => {
        const mine = isHost ? p.isHost : p.id === selfId
        return (
          <div className={`standings-row ${mine ? 'me' : ''}`} key={p.id}>
            <span>
              {i + 1}. {p.nickname}
              {mine ? ' (you)' : ''}
            </span>
            <span className="value">{formatMoney(p.valuation)}</span>
          </div>
        )
      })}
    </div>
  )
}
