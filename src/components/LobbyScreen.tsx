import { useEffect, useMemo, useState } from 'react'
import type { Difficulty } from '../game/types'
import { DIFFICULTIES } from '../game/constants'
import { formatMoney } from '../game/format'
import { CODE_LENGTH, LobbySession, isLobbyCode } from '../game/multiplayer'
import { validateCompanyName } from '../game/profanity'
import './Screens.css'
import './Lobby.css'

interface Props {
  session: LobbySession
  onStart: (name: string, difficulty: Difficulty) => void
  onBack: () => void
}

export function LobbyScreen({ session, onStart, onBack }: Props) {
  const [, force] = useState(0)
  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => session.subscribe(() => force((n) => n + 1)), [session])

  const s = session.state
  const me = useMemo(() => s.players.find((p) => (s.isHost ? p.isHost : p.id === s.selfId)), [s])
  const everyoneReady = s.players.length >= 2 && s.players.every((p) => p.ready)

  // when the host starts, everyone drops into their own fresh company
  useEffect(() => {
    if (s.phase === 'playing') onStart(name.trim() || 'My Company', s.difficulty)
  }, [s.phase, s.difficulty, name, onStart])

  function checkEntries(): boolean {
    if (nickname.trim().length < 2) {
      setNameError('Pick a nickname so the others know who you are.')
      return false
    }
    const err = validateCompanyName(name)
    setNameError(err)
    return !err
  }

  if (s.phase === 'idle' || s.phase === 'connecting') {
    const busy = s.phase === 'connecting'
    return (
      <div className="naming-screen screen">
        <div className="title-box">
          <h2 className="heading">Play with friends</h2>
          <p className="lobby-note">
            One of you hosts and shares the code. Everyone races their own company. First to $100B wins.
          </p>
          <input
            autoFocus
            value={nickname}
            maxLength={16}
            placeholder="Your nickname..."
            onChange={(e) => {
              setNickname(e.target.value)
              setNameError(null)
            }}
          />
          <input
            value={name}
            maxLength={24}
            placeholder="Your company name..."
            onChange={(e) => {
              setName(e.target.value)
              setNameError(null)
            }}
          />
          {nameError && <p className="error">{nameError}</p>}
          {s.error && <p className="error">{s.error}</p>}

          <button className="big-button" disabled={busy} onClick={() => checkEntries() && session.host(nickname.trim(), name, s.difficulty)}>
            {busy ? 'Connecting...' : 'Host a game'}
          </button>

          <div className="lobby-join">
            <input
              value={code}
              maxLength={CODE_LENGTH}
              placeholder={`Friend's ${CODE_LENGTH}-character code`}
              className="lobby-code-input"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              className="big-button"
              disabled={busy || !isLobbyCode(code)}
              onClick={() => checkEntries() && session.join(code, nickname.trim(), name)}
            >
              Join
            </button>
          </div>

          <button className="chip" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="naming-screen screen">
      <div className="title-box lobby-box">
        <h2 className="heading">{s.isHost ? 'Your lobby' : 'Joined lobby'}</h2>

        {s.code && (
          <div className="lobby-code-row">
            <span className="lobby-code">{s.code}</span>
            <button
              className="chip"
              onClick={() => {
                void navigator.clipboard?.writeText(s.code ?? '')
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
        {s.isHost && <p className="lobby-note">Send that code to your friends so they can join.</p>}

        <div className="lobby-players">
          {s.players.map((p) => (
            <div className="lobby-player" key={p.id}>
              <span className="lobby-player-name">
                {p.isHost ? '👑 ' : ''}
                {p.nickname}
                {p.id === me?.id ? ' (you)' : ''}
                <span className="lobby-player-company">{p.name}</span>
              </span>
              {s.phase === 'playing' || s.phase === 'over' ? (
                <span className="lobby-player-value">{formatMoney(p.valuation)}</span>
              ) : (
                <span className={`lobby-player-ready ${p.ready ? 'yes' : ''}`}>{p.ready ? 'Ready' : 'Waiting'}</span>
              )}
              {s.isHost && !p.isHost && (
                <button className="chip kick-btn" title={`Remove ${p.nickname} from the lobby`} onClick={() => session.kick(p.id)}>
                  Kick
                </button>
              )}
            </div>
          ))}
          {s.players.length < 2 && <p className="lobby-note">Waiting for someone to join...</p>}
        </div>

        <div className="difficulty-picker">
          <h3 className="heading small">Game length</h3>
          <div className="difficulty-options">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`difficulty-option ${s.difficulty === d.id ? 'active' : ''}`}
                disabled={!s.isHost}
                onClick={() => session.setDifficulty(d.id)}
              >
                <span className="difficulty-label">{d.label}</span>
                <span className="difficulty-blurb">{d.blurb}</span>
              </button>
            ))}
          </div>
          {!s.isHost && <p className="lobby-note">The host picks the length.</p>}
        </div>

        <button className="big-button" onClick={() => session.setReady(!me?.ready)}>
          {me?.ready ? "I'm not ready" : "I'm ready"}
        </button>

        {s.isHost && (
          <button className="big-button" disabled={!everyoneReady} onClick={() => session.start()}>
            {everyoneReady ? 'Start the race' : 'Waiting for everyone to be ready'}
          </button>
        )}

        <button
          className="chip"
          onClick={() => {
            session.leave()
            onBack()
          }}
        >
          Leave lobby
        </button>
      </div>
    </div>
  )
}
