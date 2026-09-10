import './Screens.css'

interface Props {
  hasSave: boolean
  onContinue: () => void
  onMultiplayer: () => void
  onNewGame: () => void
}

export function TitleScreen({ hasSave, onContinue, onNewGame, onMultiplayer }: Props) {
  return (
    <div className="title-screen screen">
      <div className="title-box">
        <h1 className="game-title">
          NEURAL<span className="accent">TYCOON</span>
        </h1>
        <p className="subtitle">Build the world's most-used AI</p>
        {hasSave && (
          <button className="big-button" onClick={onContinue}>
            Continue
          </button>
        )}
        <button className="big-button" onClick={onNewGame}>
          New Game
        </button>
        <button className="big-button" onClick={onMultiplayer}>
          Play with Friends
        </button>
        <p className="hint">Start your company in 2022 with $3,500,000</p>
      </div>
    </div>
  )
}
