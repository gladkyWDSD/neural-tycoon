import { useEffect, useReducer, useState } from 'react'
import { initialState, reducer } from './game/state'
import { parseCommand } from './game/commands'
import { clearSave, loadState, saveState } from './game/save'
import { TitleScreen } from './components/TitleScreen'
import { NamingScreen } from './components/NamingScreen'
import { GameScreen } from './components/GameScreen'
import { DevConsole } from './components/DevConsole'
import { EventModal } from './components/EventModal'

const TICK_MS = 30000 // 1 week = 30s, so 2 weeks = 1 minute

export default function App() {
  const [savedState] = useState(() => loadState())
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), TICK_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (state.screen !== 'title') {
      saveState(state)
    }
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
        />
      )}
      {state.screen === 'naming' && (
        <NamingScreen onFound={(name) => dispatch({ type: 'SET_COMPANY_NAME', name })} />
      )}
      {state.screen === 'main' && (
        <GameScreen
          state={state}
          onTogglePause={() => dispatch({ type: 'TOGGLE_PAUSE' })}
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
          onRaiseInvestment={() => dispatch({ type: 'RAISE_INVESTMENT' })}
          onStartPromo={(id, kind) => dispatch({ type: 'START_PROMO', modelId: id, kind })}
        />
      )}
      <DevConsole onCommand={runCommand} />
      {state.pendingEvent && (
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
