import { useEffect, useRef } from 'react'
import type { PendingEvent } from '../game/types'
import { drawCharacter } from './sprites'
import { traitsOf } from '../game/people'
import './EventModal.css'

/** The person doing the asking, drawn big, because this is about them. */
function Portrait({ event }: { event: PendingEvent }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const person = event.person
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !person) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    let raf = 0
    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(3, 0, 0, 3, 0, 0)
      drawCharacter(ctx, person, 2, 0, now, false, false)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [person])
  if (!person) return null
  return (
    <div className="event-person">
      <canvas ref={ref} className="event-portrait" width={96} height={120} />
      <div className="event-person-lines">
        <span className="event-person-name">{person.name}</span>
        {traitsOf(person).map((t) => (
          <span className="event-person-trait" key={t.id} title={t.blurb}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  )
}

interface Props {
  event: PendingEvent
  onResolve: (choiceIndex: number) => void
}

export function EventModal({ event, onResolve }: Props) {
  return (
    <div className="event-overlay">
      <div className={`event-modal${event.person ? ' is-person' : ''}`}>
        <div className="event-icon">{event.icon}</div>
        <h3 className="event-title">{event.title}</h3>
        {event.person && <Portrait event={event} />}
        <p className="event-text">{event.text}</p>
        <div className="event-choices">
          {event.choices.map((c, i) => (
            <button
              key={i}
              className={c.disabled ? 'event-choice is-disabled' : 'event-choice'}
              onClick={() => onResolve(i)}
              disabled={c.disabled}
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
