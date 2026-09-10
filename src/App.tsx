import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { companyValuation, initialState, reducer, settingsOf } from './game/state'
import { LobbySession } from './game/multiplayer'
import type { LobbyState } from './game/multiplayer'
import { LobbyScreen } from './components/LobbyScreen'
import { parseCommand } from './game/commands'
import { clearSave, loadState, saveState } from './game/save'
import { isMusicEnabled, setMusicEnabled, startMusic, stopMusic } from './game/audio'
import { TitleScreen } from './components/TitleScreen'
import { NamingScreen } from './components/NamingScreen'
import { GameScreen } from './components/GameScreen'
import { DevConsole } from './components/DevConsole'
import { EventModal } from './components/EventModal'

// A game week lasts as long as the chosen length preset says. Research, training
// and construction advance on a finer clock so a job that says "1 week" really
// does take a week from the moment it started, instead of finishing whenever the
// next week boundary happens to come round.
const JOB_TICK_MS = 250
// a sleeping machine or a throttled background tab must not dump hours of game
// time into one step, so each step is capped
// Solo, a long gap (a sleeping laptop) should not dump hours of game time into
// one step. In a race the opposite is true: every player must credit the same
// real time or their weeks drift apart, so the cap is only there to survive a
// machine that was actually asleep.
const MAX_STEP_MS = 1000
const MAX_RACE_STEP_MS = 60000

export default function App() {
  const [savedState] = useState(() => loadState())
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [musicOn, setMusicOn] = useState(() => isMusicEnabled())

  // One lobby session for the tab. It is idle unless the player opens the
  // multiplayer screen, so a solo game never touches the network.
  const session = useMemo(() => new LobbySession(), [])
  const [lobby, setLobby] = useState<LobbyState>(session.state)
  useEffect(() => session.subscribe(setLobby), [session])
  const inRace = lobby.phase === 'playing' || lobby.phase === 'over'

  // dirty tricks aimed at this company by another player
  useEffect(() => session.onAttack((kind, from) => dispatch({ type: 'INCOMING_ATTACK', kind, from })), [session])
  useEffect(() => session.onBid((bid) => dispatch({ type: 'INCOMING_BID', bid })), [session])
  // the host halting the race halts everyone's clock, not just their own
  useEffect(() => session.onPause((paused) => dispatch({ type: 'SET_PAUSED', paused })), [session])
  useEffect(
    () => session.onKicked(() => dispatch({ type: 'NOTE', text: '🚪 The host removed you from the race. Your company is still yours to run.' })),
    [session],
  )
  useEffect(
    () => session.onBidResult((bidId, matched, staff) => dispatch({ type: 'BID_RESULT', bidId, matched, staff })),
    [session],
  )

  // whatever this company has decided, on its way to the player it concerns
  useEffect(() => {
    const out = state.outbox
    if (!out) return
    if (out.t === 'attack') session.sendAttack(out.targetId, out.kind)
    else if (out.t === 'bid') session.sendBid(out.targetId, out.bid)
    else session.sendBidResult(out.targetId, out.bidId, out.matched, out.staff)
    dispatch({ type: 'CLEAR_OUTBOX' })
  }, [state.outbox, session])

  // the race needs the live valuation, without re-arming a timer on every tick
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    if (lobby.phase !== 'playing') return
    const id = setInterval(() => {
      const cur = stateRef.current
      const users = cur.models.reduce(
        (sum, m) => sum + (m.status === 'published' ? m.customers + m.freeCustomers : 0),
        0,
      )
      session.reportProgress(
        companyValuation(cur),
        users,
        cur.staff.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          examScore: p.examScore,
          level: p.level,
          salary: p.salary,
        })),
      )
      if (stateRef.current.won) session.reportWin()
    }, 3000)
    return () => clearInterval(id)
  }, [lobby.phase, session])

  const tickMs = settingsOf(state).tickMs
  // The clock only runs while you are actually playing. It used to run on every
  // screen, so weeks passed and events fired over the title, naming and lobby
  // screens, and a brand new company could start life already in week 2.
  const playing = state.screen === 'main'

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let sinceWeek = 0
    const id = setInterval(() => {
      const now = performance.now()
      const racing = stateRef.current.inRace
      // A background tab gets its timers throttled, so the callback fires far less
      // often. Crediting only the interval length would quietly lose real time and
      // leave that player weeks behind everyone else, so a race credits the whole
      // gap. Being paused credits nothing, and the host pauses everyone together.
      const gap = now - last
      const dt = stateRef.current.paused ? 0 : Math.min(racing ? MAX_RACE_STEP_MS : MAX_STEP_MS, gap)
      last = now
      if (dt <= 0) return
      dispatch({ type: 'ADVANCE_JOBS', delta: dt / tickMs })
      // both clocks are driven off the same elapsed time, so they never drift apart
      sinceWeek += dt
      let weeks = 0
      while (sinceWeek >= tickMs) {
        sinceWeek -= tickMs
        weeks++
      }
      // catching up in one go would freeze the tab, so a long gap is paid off over
      // a few steps while the rest stays owed in sinceWeek
      const burst = Math.min(weeks, 8)
      sinceWeek += (weeks - burst) * tickMs
      for (let i = 0; i < burst; i++) dispatch({ type: 'TICK' })
    }, JOB_TICK_MS)
    return () => clearInterval(id)
  }, [tickMs, playing])

  // Right-click belongs to the game, not to the browser. Text fields keep their
  // own menu so right-click paste still works on things like the lobby code.
  useEffect(() => {
    const swallow = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea')) return
      e.preventDefault()
    }
    window.addEventListener('contextmenu', swallow)
    return () => window.removeEventListener('contextmenu', swallow)
  }, [])

  // reaching the main screen always follows a click, which satisfies the browser's autoplay gesture rule
  useEffect(() => {
    if (state.screen === 'main') startMusic()
    else stopMusic()
  }, [state.screen])

  function toggleMusic() {
    const next = !musicOn
    setMusicEnabled(next)
    setMusicOn(next)
  }

  // state now changes several times a second while a job is running, so saves are
  // coalesced instead of hitting localStorage on every step
  useEffect(() => {
    if (state.screen === 'title') return
    const id = setTimeout(() => saveState(state), 1000)
    return () => clearTimeout(id)
  }, [state])

  function runCommand(text: string): string {
    const result = parseCommand(text, state)
    if (result.action) dispatch(result.action)
    return result.response
  }

  function newGame() {
    clearSave()
    dispatch({ type: 'NEW_GAME' })
  }

  function continueGame() {
    if (savedState) dispatch({ type: 'LOAD_STATE', state: savedState })
  }

  return (
    <>
      {state.screen === 'title' && (
        <TitleScreen
          hasSave={savedState !== null}
          onContinue={continueGame}
          onNewGame={newGame}
          onMultiplayer={() => dispatch({ type: 'SET_SCREEN', screen: 'lobby' })}
        />
      )}
      {state.screen === 'lobby' && (
        <LobbyScreen
          session={session}
          onStart={(name, difficulty) => dispatch({ type: 'START_GAME', name, difficulty })}
          onBack={() => dispatch({ type: 'SET_SCREEN', screen: 'title' })}
        />
      )}
      {state.screen === 'naming' && (
        <NamingScreen
          difficulty={state.difficulty}
          onPickDifficulty={(difficulty) => dispatch({ type: 'SET_DIFFICULTY', difficulty })}
          onFound={(name) => dispatch({ type: 'SET_COMPANY_NAME', name })}
        />
      )}
      {state.screen === 'main' && (
        <GameScreen
          state={state}
          musicOn={musicOn}
          onToggleMusic={toggleMusic}
          onTogglePause={() => {
            // in a race only the host holds the clock, and it holds it for everyone
            if (inRace && !lobby.isHost) return
            if (inRace) session.setRacePaused(!state.paused)
            dispatch({ type: 'TOGGLE_PAUSE' })
          }}
          pauseLockedBy={inRace && !lobby.isHost ? (lobby.players.find((p) => p.isHost)?.nickname ?? 'the host') : null}
          onHire={(staff) => dispatch({ type: 'HIRE_STAFF', staff })}
          onStartResearch={(id) => dispatch({ type: 'START_RESEARCH', id })}
          onStartModel={(model) => dispatch({ type: 'START_MODEL', model })}
          onPublish={(id, pricing) => dispatch({ type: 'PUBLISH_MODEL', id, pricing })}
          onPost={(text, postType) => dispatch({ type: 'MAKE_POST', text, postType })}
          onSmear={(competitorId) => dispatch({ type: 'SMEAR', competitorId })}
          onBuyGpu={(count) => dispatch({ type: 'BUY_GPU', count })}
          onBuyRam={(count) => dispatch({ type: 'BUY_RAM', count })}
          onBuySsd={(count) => dispatch({ type: 'BUY_SSD', count })}
          onPoach={(competitorId) => dispatch({ type: 'POACH', competitorId })}
          onBuildDatacenter={() => dispatch({ type: 'BUILD_DATACENTER' })}
          onRentDatacenter={() => dispatch({ type: 'RENT_DATACENTER' })}
          onUpgradeOffice={() => dispatch({ type: 'UPGRADE_OFFICE' })}
          onIpo={() => dispatch({ type: 'IPO' })}
          onLaunchCampaign={() => dispatch({ type: 'LAUNCH_CAMPAIGN' })}
          onBuyBook={(id) => dispatch({ type: 'BUY_BOOK', id })}
          onBuyHypeBots={() => dispatch({ type: 'BUY_HYPE_BOTS' })}
          onStartTraining={(staffId) => dispatch({ type: 'START_STAFF_TRAINING', staffId })}
          onFireStaff={(staffId) => dispatch({ type: 'FIRE_STAFF', staffId })}
          onGiveRaise={(staffId) => dispatch({ type: 'GIVE_RAISE', staffId })}
          race={
            inRace
              ? { players: lobby.players, selfId: lobby.selfId, isHost: lobby.isHost, winner: lobby.winner }
              : undefined
          }
          onAttackPlayer={(targetId, targetName, kind) =>
            dispatch({ type: 'ATTACK_PLAYER', targetId, targetName, kind })
          }
          onBidForStaff={(targetId, targetName, staff, amount) =>
            dispatch({
              type: 'BID_FOR_STAFF',
              targetId,
              targetName,
              fromId: session.addressId,
              fromName: lobby.players.find((p) => (lobby.isHost ? p.isHost : p.id === lobby.selfId))?.nickname ?? 'A rival',
              staff,
              amount,
            })
          }
          onResolveBid={(matched) => dispatch({ type: 'RESOLVE_BID', matched })}
          onKickPlayer={(playerId, nickname) => {
            session.kick(playerId)
            dispatch({ type: 'NOTE', text: `🚪 You removed ${nickname} from the race.` })
          }}
          onRaiseInvestment={() => dispatch({ type: 'RAISE_INVESTMENT' })}
          onStartPromo={(id, kind) => dispatch({ type: 'START_PROMO', modelId: id, kind })}
          onBotAttack={(competitorId) => dispatch({ type: 'BOT_ATTACK', competitorId })}
          onHireHackers={(competitorId) => dispatch({ type: 'HIRE_HACKERS', competitorId })}
          onHireJournalists={() => dispatch({ type: 'HIRE_JOURNALISTS' })}
          onEditModel={(id, name, pricing) => dispatch({ type: 'EDIT_MODEL', id, name, pricing })}
          onHireLobbyists={() => dispatch({ type: 'HIRE_LOBBYISTS' })}
        />
      )}
      <DevConsole onCommand={runCommand} />
      {playing && state.pendingEvent && (
        <EventModal
          event={state.pendingEvent}
          onResolve={(choiceIndex) =>
            dispatch({ type: 'RESOLVE_EVENT', id: state.pendingEvent!.id, choiceIndex })
          }
        />
      )}
    </>
  )
}
