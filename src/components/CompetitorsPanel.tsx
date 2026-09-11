import { useState } from 'react'
import type { AttackKind, GameState, StaffCard } from '../game/types'
import type { LobbyPlayer } from '../game/multiplayer'
import { MODEL_TYPE_MAP } from '../game/research'
import { globalWeek } from '../game/state'
import {
  BOT_ATTACK_COOLDOWN,
  BOT_ATTACK_COST,
  HACKER_COOLDOWN,
  HACKER_COST,
  POACH_BID_FEE_SHARE,
  POACH_MIN_BID_WEEKS,
  ROLES,
} from '../game/constants'
import { staffPower } from '../game/hiring'
import { formatMoney } from '../game/format'
import { acquisitionCost } from '../game/state'
import { rivalQuality, rivalStaffCount } from '../game/competitors'
import './Game.css'

interface Props {
  state: GameState
  onPoach: (competitorId: string) => void
  onClose: () => void
  /** present only in a multiplayer race */
  race?: { players: LobbyPlayer[]; selfId: string; isHost: boolean }
  onAttackPlayer?: (targetId: string, targetName: string, kind: AttackKind) => void
  onBidForStaff?: (targetId: string, targetName: string, staff: StaffCard, amount: number) => void
  /** host only: remove a player from the race */
  onKickPlayer?: (playerId: string, nickname: string) => void
  /** buy an AI rival outright, once you are public */
  onAcquire?: (competitorId: string, name: string) => void
}

export function CompetitorsPanel({
  state,
  onPoach,
  onClose,
  race,
  onAttackPlayer,
  onBidForStaff,
  onKickPlayer,
  onAcquire,
}: Props) {
  const [poachOpen, setPoachOpen] = useState<string | null>(null)
  const [bids, setBids] = useState<Record<string, string>>({})
  // the same cooldowns and prices as the tricks you can pull on an AI rival
  const botsIn = BOT_ATTACK_COOLDOWN - (globalWeek(state) - state.lastBotAttackWeek)
  const hackIn = HACKER_COOLDOWN - (globalWeek(state) - state.lastHackerWeek)
  const botsReady = botsIn <= 0 && state.money >= BOT_ATTACK_COST
  const hackReady = hackIn <= 0 && state.money >= HACKER_COST
  const week = globalWeek(state)
  const playerCustomers = state.models.reduce(
    (sum, m) => sum + (m.status === 'published' ? m.customers + m.freeCustomers : 0),
    0,
  )

  const entries = [
    { id: 'you', name: state.companyName || 'You', icon: '⭐', customers: playerCustomers, isYou: true },
    ...state.competitors.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      customers: c.models.reduce(
        (sum, m) => sum + (m.releaseWeek <= week ? m.customers : 0),
        0,
      ),
      isYou: false,
    })),
  ].sort((a, b) => b.customers - a.customers)

  const totalCustomers = entries.reduce((sum, e) => sum + e.customers, 0)
  const share = totalCustomers > 0 ? Math.round((playerCustomers / totalCustomers) * 100) : 0
  // a pact is a promise the rules keep: no swarming or hacking whoever you signed with
  const pactWith = (id: string) => state.pacts.find((pact) => pact.playerId === id)

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Competitors</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {race && race.players.length > 0 && (
        <div className="comp-players">
          <h4 className="comp-players-title">Players in this race</h4>
          <p className="comp-players-note">
            Real people, each running their own company. First to $100B wins.
          </p>
          {[...race.players]
            .sort((a, b) => b.valuation - a.valuation)
            .map((p, i) => {
              const mine = race.isHost ? p.isHost : p.id === race.selfId
              return (
                <div className={`comp-row ${mine ? 'you' : ''}`} key={p.id}>
                  <span className="comp-rank">#{i + 1}</span>
                  <span className="comp-icon">{p.isHost ? '👑' : '👤'}</span>
                  <span className="comp-name">
                    {p.nickname}
                    {mine ? ' (you)' : ''}
                    <span className="comp-sub">{p.name}</span>
                  </span>
                  <span className="comp-customers">
                    {formatMoney(p.valuation)}
                    <span className="comp-sub">{p.customers.toLocaleString()} users</span>
                  </span>
                  {!mine && onAttackPlayer && (
                    <span className="comp-attacks">
                      <button
                        className="hire-btn"
                        disabled={!botsReady || Boolean(pactWith(p.id))}
                        title={
                          pactWith(p.id)
                            ? `Your pact with ${p.nickname} holds for ${Math.ceil(pactWith(p.id)?.weeksLeft ?? 0)} more weeks. Break it in Trading first.`
                            : botsIn > 0
                              ? `Your bot farm is lying low for ${botsIn}wk`
                              : `Swarm them with bots. $${BOT_ATTACK_COST.toLocaleString()}, and they may trace it back to you.`
                        }
                        onClick={() => onAttackPlayer(p.id, p.nickname, 'bots')}
                      >
                        Swarm
                      </button>
                      <button
                        className="hire-btn"
                        disabled={p.staff.length === 0 || Boolean(state.sentBid)}
                        title={
                          state.sentBid
                            ? 'You already have an offer on the table'
                            : p.staff.length === 0
                              ? 'They have nobody to take'
                              : 'Make one of their people an offer they have to match'
                        }
                        onClick={() => setPoachOpen(poachOpen === p.id ? null : p.id)}
                      >
                        Poach
                      </button>
                      <button
                        className="hire-btn"
                        disabled={!hackReady || Boolean(pactWith(p.id))}
                        title={
                          pactWith(p.id)
                            ? `Your pact with ${p.nickname} holds for ${Math.ceil(pactWith(p.id)?.weeksLeft ?? 0)} more weeks. Break it in Trading first.`
                            : hackIn > 0
                              ? `Your hackers are cooling off for ${hackIn}wk`
                              : `Break into their labs and damage their models. $${HACKER_COST.toLocaleString()}, with a real chance of a fine.`
                        }
                        onClick={() => onAttackPlayer(p.id, p.nickname, 'hackers')}
                      >
                        Hack
                      </button>
                      {race.isHost && onKickPlayer && (
                        <button
                          className="hire-btn"
                          title={`Remove ${p.nickname} from the race`}
                          onClick={() => onKickPlayer(p.id, p.nickname)}
                        >
                          Kick
                        </button>
                      )}
                    </span>
                  )}
                  {poachOpen === p.id && onBidForStaff && (
                    <div className="poach-list">
                      {[...p.staff]
                        .sort((a, b) => staffPower(b) - staffPower(a))
                        .map((c) => {
                          const minimum = c.salary * POACH_MIN_BID_WEEKS
                          const typed = Number(bids[c.id] ?? '')
                          const amount = Number.isFinite(typed) && typed >= minimum ? Math.round(typed) : minimum
                          const fee = Math.round(amount * POACH_BID_FEE_SHARE)
                          return (
                            <div className="poach-row" key={c.id}>
                              <span className="poach-who">
                                {c.name}
                                <span className="comp-sub">
                                  {ROLES.find((r) => r.id === c.role)?.label} · Lv {c.level} ·{' '}
                                  {staffPower(c).toLocaleString()} pts · ${c.salary.toLocaleString()}/wk
                                </span>
                              </span>
                              <input
                                className="poach-bid"
                                value={bids[c.id] ?? String(minimum)}
                                onChange={(e) => setBids((b) => ({ ...b, [c.id]: e.target.value.replace(/[^0-9]/g, '') }))}
                                title={`At least $${minimum.toLocaleString()}`}
                              />
                              <button
                                className="hire-btn"
                                disabled={state.money < fee || Boolean(state.sentBid)}
                                title={`Costs $${fee.toLocaleString()} to the headhunter now, and $${amount.toLocaleString()} more only if they let them go.`}
                                onClick={() => {
                                  onBidForStaff(p.id, p.nickname, c, amount)
                                  setPoachOpen(null)
                                }}
                              >
                                Offer
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      <div className="comp-overview">
        <div className="comp-overview-stat">
          <span className="comp-big">{playerCustomers.toLocaleString()}</span>
          <span className="comp-label">your customers</span>
        </div>
        <div className="comp-overview-stat">
          <span className="comp-big">{share}%</span>
          <span className="comp-label">market share</span>
        </div>
      </div>

      <div className="comp-leaderboard">
        {entries.map((e, i) => (
          <div key={e.id} className={`comp-row ${e.isYou ? 'you' : ''}`}>
            <span className="comp-rank">#{i + 1}</span>
            <span className="comp-icon">{e.icon}</span>
            <span className="comp-name">{e.name}</span>
            <span className="comp-customers">{e.customers.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="comp-detail-list">
        {state.competitors.map((c) => (
          <div className="comp-detail" key={c.id}>
            <div className="comp-detail-head">
              <span className="comp-name">
                {c.icon} {c.name}
              </span>
              <span className="comp-model-customers">{c.followers.toLocaleString()} followers</span>
              {onAcquire && (
                <button
                  className="hire-btn"
                  disabled={!state.isPublic || state.money < acquisitionCost(state, c.id)}
                  title={
                    !state.isPublic
                      ? 'Go public first. Buying a company takes stock behind you.'
                      : `Buy ${c.name} outright for $${acquisitionCost(state, c.id).toLocaleString()}. Most of their users move to your best model and they stop competing.`
                  }
                  onClick={() => onAcquire(c.id, c.name)}
                >
                  Buy ${formatMoney(acquisitionCost(state, c.id)).replace('$', '')}
                </button>
              )}
            </div>
            <p className="comp-company">
              {rivalStaffCount(c)} staff ({c.staff.researcher}R {c.staff.engineer}E {c.staff.marketer}M{' '}
              {c.staff.lawyer}L) · {c.gpus} GPUs · research level {c.researchLevel} · can build quality{' '}
              {rivalQuality(c)}
              {c.training
                ? ` · training ${c.training.name}, ${Math.ceil(c.training.weeksLeft)}wk left`
                : ' · nothing in training'}
            </p>
            {c.models.map((m) => {
              const t = MODEL_TYPE_MAP[m.typeId]
              const active = m.releaseWeek <= week
              return (
                <div className="comp-model" key={m.id}>
                  <span className="comp-model-name">
                    {t?.icon} {m.name}
                  </span>
                  {active ? (
                    <span className="comp-model-customers">{m.customers.toLocaleString()}</span>
                  ) : (
                    <span className="comp-model-soon">Wk {m.releaseWeek}</span>
                  )}
                </div>
              )
            })}
            <button
              className="hire-btn"
              disabled={state.poached.includes(c.id) || state.money < 200000}
              onClick={() => onPoach(c.id)}
            >
              {state.poached.includes(c.id) ? 'Poached' : 'Poach talent ($200k)'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
