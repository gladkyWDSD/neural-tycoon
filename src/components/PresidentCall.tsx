import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import { PORTRAIT_H, PORTRAIT_W, drawPresident } from './presidentArt'
import './EventModal.css'
import './Game.css'

interface Props {
  state: GameState
  onHangUp: () => void
}

const HEADING = {
  happy: 'The White House is on the line',
  annoyed: 'The White House is on the line',
  furious: 'The White House is shouting',
}

const SIGNOFF = {
  happy: 'Thank him',
  annoyed: 'Say nothing',
  furious: 'Hang up',
}

const HINT = {
  happy: 'A word from the podium is worth a few percent more followers.',
  annoyed: 'Nothing has happened yet. Clean up the safety debt before it does.',
  furious: 'Followers are already leaving, and a new rule may follow this call.',
}

/** A caricature of a head of state, ringing to tell you how you are doing. */
export function PresidentCall({ state, onHangUp }: Props) {
  const call = state.presidentCall
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el || !call) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, el.width, el.height)
    drawPresident(ctx, call.mood)
  }, [call])

  if (!call) return null

  return (
    <div className="event-overlay">
      <div className="event-modal call-modal">
        <div className="call-head">
          <canvas
            ref={canvas}
            className={`call-portrait ${call.mood}`}
            width={PORTRAIT_W}
            height={PORTRAIT_H}
          />
          <div className="call-who">
            <h3 className="event-title">{HEADING[call.mood]}</h3>
            <p className="call-sub">
              The President · week {call.week} · {state.companyName}, an American company
            </p>
            <p className="call-about">About {call.about}.</p>
          </div>
        </div>

        <p className="call-line">&ldquo;{call.line}&rdquo;</p>

        <div className="event-choices">
          <button className="event-choice" onClick={onHangUp}>
            <span className="event-choice-label">{SIGNOFF[call.mood]}</span>
            <span className="event-choice-hint">{HINT[call.mood]}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
