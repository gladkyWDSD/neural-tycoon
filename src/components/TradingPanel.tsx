import { useState } from 'react'
import type { GameState, TradeKind } from '../game/types'
import type { LobbyPlayer } from '../game/multiplayer'
import { formatMoney } from '../game/format'
import { RESEARCH_MAP } from '../game/research'
import { DATACENTER_COST, GPU_CARD_COST, activeCards } from '../game/gpu'
import { PACT_BREAK_FOLLOWER_LOSS, PACT_WEEKS } from '../game/constants'
import './Game.css'

interface Props {
  state: GameState
  race?: { players: LobbyPlayer[]; selfId: string; isHost: boolean }
  onOfferTrade: (
    targetId: string,
    targetName: string,
    kind: TradeKind,
    price: number,
    extra: { gpus?: number; researchId?: string; modelId?: string; datacenters?: number },
  ) => void
  onBreakPact: (playerId: string) => void
  onClose: () => void
}

export function TradingPanel({ state, race, onOfferTrade, onBreakPact, onClose }: Props) {
  const others = (race?.players ?? []).filter((p) => (race?.isHost ? !p.isHost : p.id !== race?.selfId))
  const [target, setTarget] = useState<string | null>(others[0]?.id ?? null)
  const [kind, setKind] = useState<TradeKind>('compute')
  const [gpus, setGpus] = useState(4)
  const [researchId, setResearchId] = useState('')
  const [modelId, setModelId] = useState('')
  const [halls, setHalls] = useState(1)
  const [price, setPrice] = useState(GPU_CARD_COST * 4)

  const player = others.find((p) => p.id === target) ?? null
  const idle = Math.max(0, state.gpuCards - activeCards(state))
  const sellable = state.researched.filter((id) => RESEARCH_MAP[id])
  const live = state.models.filter((m) => m.status === 'published')
  const pactWith = (id: string) => state.pacts.find((p) => p.playerId === id)
  const waiting = state.sentTrade

  // one reason, in the order the player would hit them
  const blocked = (): string | null => {
    if (!player) return 'Pick who you are dealing with.'
    if (waiting) return `Wait for ${waiting.targetName} to answer your last offer.`
    if (kind === 'compute' && (gpus < 1 || gpus > state.gpuCards)) {
      return `You own ${state.gpuCards} card${state.gpuCards === 1 ? '' : 's'}.`
    }
    if (kind === 'research' && !state.researched.includes(researchId)) {
      return sellable.length === 0 ? 'Finish some research first.' : 'Pick which findings to sell.'
    }
    if (kind === 'datacenter' && (halls < 1 || halls > state.datacenters)) {
      return state.datacenters === 0
        ? 'You have no datacenters of your own. Rented ones cannot be sold.'
        : `You own ${state.datacenters} built datacenter${state.datacenters === 1 ? '' : 's'}.`
    }
    if (kind === 'model' && !live.some((m) => m.id === modelId)) {
      return live.length === 0 ? 'You have nothing published to sell.' : 'Pick which model to sell.'
    }
    if (kind === 'pact' && pactWith(player.id)) return `You already have a pact with ${player.nickname}.`
    return null
  }
  const reason = blocked()
  const canSend = reason === null

  function send() {
    if (!player || !canSend) return
    onOfferTrade(player.id, player.nickname, kind, kind === 'pact' ? 0 : price, {
      gpus: kind === 'compute' ? gpus : undefined,
      researchId: kind === 'research' ? researchId : undefined,
      modelId: kind === 'model' ? modelId : undefined,
      datacenters: kind === 'datacenter' ? halls : undefined,
    })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Trading</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {others.length === 0 ? (
        <p className="placeholder">
          Trading is for races. Start a multiplayer game and you can sell compute, license your
          research and sign pacts with the other players.
        </p>
      ) : (
        <div className="trade-body">
          {state.pacts.length > 0 && (
            <div className="trade-section">
              <h4 className="model-list-title">Pacts in force</h4>
              {state.pacts.map((p) => (
                <div className="trade-row" key={p.playerId}>
                  <span className="trade-who">
                    {p.name}
                    <span className="comp-sub">
                      neither of you can attack the other for {Math.ceil(p.weeksLeft)} more week
                      {Math.ceil(p.weeksLeft) === 1 ? '' : 's'}
                    </span>
                  </span>
                  <button
                    className="hire-btn danger"
                    title={`Tear it up. You can attack them again, and it costs you ${Math.round(PACT_BREAK_FOLLOWER_LOSS * 100)}% of your followers.`}
                    onClick={() => onBreakPact(p.playerId)}
                  >
                    Break
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="trade-section">
            <h4 className="model-list-title">Who are you dealing with</h4>
            <div className="trade-players">
              {others.map((p) => (
                <button
                  key={p.id}
                  className={`trade-player ${target === p.id ? 'active' : ''}`}
                  onClick={() => setTarget(p.id)}
                >
                  <span className="trade-player-name">{p.nickname}</span>
                  <span className="comp-sub">
                    {formatMoney(p.valuation)}
                    {pactWith(p.id) ? ' · pact' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="trade-section">
            <h4 className="model-list-title">What are you offering</h4>
            <div className="trade-kinds">
              <button
                className={`hire-btn ${kind === 'compute' ? 'active' : ''}`}
                onClick={() => setKind('compute')}
              >
                Sell GPUs
              </button>
              <button
                className={`hire-btn ${kind === 'research' ? 'active' : ''}`}
                onClick={() => setKind('research')}
              >
                License research
              </button>
              <button
                className={`hire-btn ${kind === 'datacenter' ? 'active' : ''}`}
                onClick={() => setKind('datacenter')}
              >
                Sell a datacenter
              </button>
              <button
                className={`hire-btn ${kind === 'model' ? 'active' : ''}`}
                onClick={() => setKind('model')}
              >
                Sell a model
              </button>
              <button
                className={`hire-btn ${kind === 'pact' ? 'active' : ''}`}
                onClick={() => setKind('pact')}
              >
                Non-aggression pact
              </button>
            </div>

            {kind === 'compute' && (
              <>
                <p className="placeholder">
                  You own {state.gpuCards} card{state.gpuCards === 1 ? '' : 's'}, {idle} of them idle
                  for want of a datacenter. The cards are held aside until they answer.
                </p>
                <div className="trade-fields">
                  <label className="trade-field">
                    <span className="trade-label">Cards</span>
                    <input
                      type="number"
                      min={1}
                      max={state.gpuCards}
                      value={gpus}
                      onChange={(e) => setGpus(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    />
                  </label>
                  <label className="trade-field">
                    <span className="trade-label">Price</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={price}
                      onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                  </label>
                </div>
                <p className="placeholder">
                  New cards cost ${GPU_CARD_COST.toLocaleString()} each, so {gpus} is worth $
                  {(gpus * GPU_CARD_COST).toLocaleString()} at list price.
                </p>
              </>
            )}

            {kind === 'research' && (
              <>
                <p className="placeholder">
                  They get the findings outright. You keep yours, and you keep the money.
                </p>
                {sellable.length === 0 ? (
                  <p className="placeholder">You have not finished any research to sell yet.</p>
                ) : (
                  <div className="trade-fields">
                    <label className="trade-field wide">
                      <span className="trade-label">Findings</span>
                      <select value={researchId} onChange={(e) => setResearchId(e.target.value)}>
                        <option value="">Pick one</option>
                        {sellable.map((id) => (
                          <option key={id} value={id}>
                            {RESEARCH_MAP[id].name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="trade-field">
                      <span className="trade-label">Price</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                    </label>
                  </div>
                )}
                {researchId && RESEARCH_MAP[researchId] && (
                  <p className="placeholder">
                    {RESEARCH_MAP[researchId].name} cost you $
                    {RESEARCH_MAP[researchId].cost.toLocaleString()} and{' '}
                    {RESEARCH_MAP[researchId].weeks} weeks of a researcher's time.
                  </p>
                )}
              </>
            )}

            {kind === 'datacenter' && (
              <>
                <p className="placeholder">
                  Built halls only, with their ten card slots each. Rented ones are not yours to
                  sell. They are held aside until the other player answers.
                </p>
                <div className="trade-fields">
                  <label className="trade-field">
                    <span className="trade-label">Datacenters</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, state.datacenters)}
                      value={halls}
                      onChange={(e) => setHalls(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    />
                  </label>
                  <label className="trade-field">
                    <span className="trade-label">Price</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={price}
                      onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                  </label>
                </div>
                <p className="placeholder">
                  You own {state.datacenters} built and {state.rentedDatacenters} rented. Building one
                  costs ${DATACENTER_COST.toLocaleString()} and takes two weeks.
                </p>
              </>
            )}

            {kind === 'model' && (
              <>
                <p className="placeholder">
                  The model goes across with everyone using it. You lose the users and the revenue,
                  they gain both.
                </p>
                {live.length === 0 ? (
                  <p className="placeholder">You have nothing published to sell.</p>
                ) : (
                  <div className="trade-fields">
                    <label className="trade-field wide">
                      <span className="trade-label">Model</span>
                      <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
                        <option value="">Pick one</option>
                        {live.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — quality {Math.round(m.quality)},{' '}
                            {(m.customers + m.freeCustomers).toLocaleString()} users
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="trade-field">
                      <span className="trade-label">Price</span>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            {kind === 'pact' && (
              <p className="placeholder">
                Neither of you can swarm, hack or otherwise touch the other for {PACT_WEEKS} weeks.
                Poaching their staff still works, and so does theirs on you. Either side can tear it
                up early, at the cost of {Math.round(PACT_BREAK_FOLLOWER_LOSS * 100)}% of their
                followers.
              </p>
            )}
          </div>

          <div className="trade-send">
            {reason && <p className="placeholder">{reason}</p>}
            <button className="big-button" disabled={!canSend} onClick={send}>
              {player
                ? kind === 'pact'
                  ? `Propose a pact to ${player.nickname}`
                  : `Offer ${player.nickname} the deal`
                : 'Pick a player'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
