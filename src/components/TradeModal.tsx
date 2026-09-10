import type { GameState } from '../game/types'
import { RESEARCH_MAP } from '../game/research'
import { GPU_CARD_COST } from '../game/gpu'
import { PACT_BREAK_FOLLOWER_LOSS } from '../game/constants'
import './EventModal.css'

interface Props {
  state: GameState
  onResolve: (accepted: boolean) => void
}

/** Another player has put a deal on the table. */
export function TradeModal({ state, onResolve }: Props) {
  const offer = state.pendingTrade
  if (!offer) return null
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const canAfford = state.money >= offer.price
  const known = offer.kind === 'research' && state.researched.includes(offer.researchId ?? '')

  const title =
    offer.kind === 'compute'
      ? `${offer.fromName} is selling you compute`
      : offer.kind === 'research'
        ? `${offer.fromName} is selling you research`
        : offer.kind === 'datacenter'
          ? `${offer.fromName} is selling you a datacenter`
          : offer.kind === 'model'
            ? `${offer.fromName} is selling you a model`
            : `${offer.fromName} wants a truce`

  const model = offer.model
  const body =
    offer.kind === 'datacenter'
      ? `${offer.datacenters} datacenter${(offer.datacenters ?? 0) === 1 ? '' : 's'} for ${money(offer.price)}, ten card slots each. Building one costs ${money(100_000)} and takes two weeks.`
      : offer.kind === 'model' && model
        ? `${model.name}, quality ${Math.round(model.quality)}, with ${(model.customers + model.freeCustomers).toLocaleString()} people already using it, for ${money(offer.price)}. Their revenue becomes yours.`
        : offer.kind === 'compute'
      ? `${offer.gpus} GPU card${(offer.gpus ?? 0) === 1 ? '' : 's'} for ${money(offer.price)}. New cards run ${money(GPU_CARD_COST)} each, so list price would be ${money((offer.gpus ?? 0) * GPU_CARD_COST)}.`
      : offer.kind === 'research'
        ? `${RESEARCH_MAP[offer.researchId ?? '']?.name ?? 'Their findings'} for ${money(offer.price)}. It lands finished, no researcher time and no waiting.`
        : `Neither of you can swarm, hack or sabotage the other for ${offer.weeks} weeks. Poaching still works, both ways.`

  const acceptable = offer.kind === 'pact' ? true : canAfford && !known

  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">🤝</div>
        <h3 className="event-title">{title}</h3>
        <p className="event-text">{body}</p>
        <div className="event-choices">
          <button
            className={acceptable ? 'event-choice' : 'event-choice is-disabled'}
            disabled={!acceptable}
            onClick={() => onResolve(true)}
          >
            <span className="event-choice-label">
              {offer.kind === 'pact' ? 'Shake on it' : `Accept, ${money(offer.price)}`}
            </span>
            <span className="event-choice-hint">
              {known
                ? 'You already know this. There is nothing here to buy.'
                : !canAfford
                  ? `You only have ${money(state.money)}.`
                  : offer.kind === 'pact'
                    ? `Either side can break it later, at ${Math.round(PACT_BREAK_FOLLOWER_LOSS * 100)}% of their followers.`
                    : 'The money leaves your account now.'}
            </span>
          </button>
          <button className="event-choice is-danger" onClick={() => onResolve(false)}>
            <span className="event-choice-label">Turn it down</span>
            <span className="event-choice-hint">
              {offer.kind === 'pact'
                ? 'Nothing changes, and they know where they stand.'
                : 'They keep it, you keep your money.'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
