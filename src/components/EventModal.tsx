import type { PendingEvent } from '../game/types'
import './EventModal.css'

interface Props {
  event: PendingEvent
  onResolve: (choiceIndex: number) => void
}

export function EventModal({ event, onResolve }: Props) {
  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">{event.icon}</div>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-text">{event.text}</p>
        <div className="event-choices">
          {event.choices.map((c, i) => (
            <button
              key={i}
              className="event-choice"
              onClick={() => onResolve(i)}
              title={c.hint}
            >
              <span className="event-choice-label">{c.label}</span>
              {c.hint && <span className="event-choice-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
