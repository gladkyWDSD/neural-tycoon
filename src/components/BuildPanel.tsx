import { useState } from 'react'
import type { AIModel, GameState, PricingModel } from '../game/types'
import { MODEL_TYPES, PRICING_MODELS, DATA_TIERS, weeklyRevenue } from '../game/research'
import { activeCards, gpuQualityFactor, trainDuration, ssdQualityBonus } from '../game/gpu'
import { DEFAULT_AI_NAMES } from '../game/constants'
import { validateCompanyName } from '../game/profanity'
import './Game.css'

interface Props {
  state: GameState
  onStartModel: (model: AIModel) => void
  onPublish: (id: string, pricing: PricingModel) => void
  onClose: () => void
}

function isTypeUnlocked(typeId: string, researched: string[]): boolean {
  const type = MODEL_TYPES.find((t) => t.id === typeId)
  if (!type) return false
  return type.requires.every((r) => researched.includes(r))
}

function ModelRow({ model, onPublish }: { model: AIModel; onPublish: (id: string, pricing: PricingModel) => void }) {
  const [pricing, setPricing] = useState<PricingModel>('subscription')
  const t = MODEL_TYPES.find((x) => x.id === model.typeId)
  const rev = weeklyRevenue(model)
  const pricingLabel = model.pricing ? PRICING_MODELS.find((p) => p.id === model.pricing)?.label : null

  return (
    <div className="model-item">
      <div className="model-head">
        <span className="model-name">
          {t?.icon} {model.name}
        </span>
        <span className={`model-status ${model.status}`}>
          {model.status === 'training' && `Training ${model.weeksRemaining}wk`}
          {model.status === 'ready' && `Quality ${model.quality} · Ready`}
          {model.status === 'published' && `Quality ${model.quality} · ${pricingLabel}`}
        </span>
      </div>

      {model.status === 'training' && (
        <div className="model-meta">{model.gpus} GPUs allocated</div>
      )}

      {model.status === 'ready' && (
        <div className="publish-row">
          <div className="publish-pricing">
            {PRICING_MODELS.map((p) => (
              <button
                key={p.id}
                className={`filter-btn ${pricing === p.id ? 'active' : ''}`}
                onClick={() => setPricing(p.id)}
                title={p.description}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <button className="hire-btn" onClick={() => onPublish(model.id, pricing)}>
            Publish
          </button>
        </div>
      )}

      {model.status === 'published' && (
        <div className="model-meta">
          {model.customers.toLocaleString()} customers · ${rev.toLocaleString()}/wk
        </div>
      )}
    </div>
  )
}

export function BuildPanel({ state, onStartModel, onPublish, onClose }: Props) {
  const unlockedTypes = MODEL_TYPES.filter((t) => isTypeUnlocked(t.id, state.researched))
  const maxGpus = activeCards(state)
  const [typeId, setTypeId] = useState(unlockedTypes[0]?.id ?? '')
  const [name, setName] = useState('')
  const [gpus, setGpus] = useState(() => Math.max(1, maxGpus))
  const [dataTier, setDataTier] = useState('scraped')
  const [error, setError] = useState<string | null>(null)

  const hasResearcher = state.staff.some((s) => s.role === 'researcher')
  const engineerCount = state.staff.filter((s) => s.role === 'engineer').length
  const hasEngineer = engineerCount >= 1
  const hasGpu = maxGpus >= 1

  const effGpus = Math.max(1, Math.min(gpus, maxGpus))

  const activeTypeId = unlockedTypes.some((t) => t.id === typeId)
    ? typeId
    : (unlockedTypes[0]?.id ?? '')
  const modelType = MODEL_TYPES.find((t) => t.id === activeTypeId)

  const canStart = Boolean(modelType) && name.trim().length > 0 && hasEngineer && hasGpu

  function start() {
    if (!modelType) return
    const nameErr = validateCompanyName(name)
    if (nameErr) {
      setError(nameErr)
      return
    }
    const model: AIModel = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      typeId: modelType.id,
      quality: 0,
      status: 'training',
      weeksRemaining: trainDuration(effGpus, engineerCount, state.ram),
      totalWeeks: trainDuration(effGpus, engineerCount, state.ram),
      gpus: effGpus,
      customers: 0,
      dataTier,
    }
    onStartModel(model)
    setName('')
    setError(null)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Build AI</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="build-form">
        {unlockedTypes.length === 0 && (
          <p className="placeholder">
            No model types unlocked yet. Research "Large Language Models" or "Diffusion Models" first.
          </p>
        )}

        {unlockedTypes.length > 0 && (
          <div className="filter-group">
            <label>Model type</label>
            <div className="filter-buttons">
              {unlockedTypes.map((t) => (
                <button
                  key={t.id}
                  className={`filter-btn ${activeTypeId === t.id ? 'active' : ''}`}
                  onClick={() => setTypeId(t.id)}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-group">
          <label>AI name</label>
          <input
            value={name}
            maxLength={24}
            placeholder="Name your AI..."
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          <div className="default-names">
            {DEFAULT_AI_NAMES.map((n) => (
              <button key={n} className="chip" onClick={() => setName(n)}>
                {n}
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="filter-group">
          <label>GPUs to allocate ({maxGpus} available)</label>
          {maxGpus === 0 ? (
            <p className="placeholder">No GPUs. Buy cards and build a datacenter first.</p>
          ) : (
            <div className="gpu-stepper">
              <button className="stepper-btn" onClick={() => setGpus(Math.max(1, effGpus - 1))}>
                −
              </button>
              <span className="gpu-count">{effGpus}</span>
              <button
                className="stepper-btn"
                onClick={() => setGpus(Math.min(maxGpus, effGpus + 1))}
              >
                +
              </button>
              <span className="gpu-info">
                {trainDuration(effGpus, engineerCount, state.ram)}wk · ×{gpuQualityFactor(effGpus).toFixed(2)} quality
              </span>
            </div>
          )}
        </div>

        <div className="filter-group">
          <label>Training data quality (+{DATA_TIERS.find((t) => t.id === dataTier)?.quality ?? 0} quality)</label>
          <div className="filter-buttons">
            {DATA_TIERS.map((t) => (
              <button
                key={t.id}
                className={`filter-btn ${dataTier === t.id ? 'active' : ''}`}
                onClick={() => setDataTier(t.id)}
                title={t.description}
              >
                {t.label} {t.cost > 0 ? `($${(t.cost / 1000).toFixed(0)}k)` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="requirements">
          <span className={hasEngineer ? 'ok' : 'missing'}>
            {hasEngineer ? '✓' : '✗'} At least 1 Engineer
          </span>
          <span className={hasGpu ? 'ok' : 'missing'}>
            {hasGpu ? '✓' : '✗'} At least 1 GPU
          </span>
          <span className={hasResearcher ? 'ok' : 'dim'}>
            {hasResearcher ? '✓' : '·'} Researchers boost quality
          </span>
          <span className="dim">
            RAM {state.ram} · SSD {state.ssd} (+{ssdQualityBonus(state.ssd)} quality)
          </span>
        </div>

        <button className="big-button" disabled={!canStart} onClick={start}>
          Start Training
        </button>
        {!canStart && (
          <p className="hint">
            {unlockedTypes.length === 0
              ? 'Research a model type to unlock training.'
              : !name.trim()
                ? 'Enter a name for your AI.'
                : !hasEngineer
                  ? 'Hire an engineer to build the model.'
                  : 'Buy GPUs and build a datacenter.'}
          </p>
        )}
      </div>

      {state.models.length > 0 && (
        <div className="model-list">
          <h4 className="model-list-title">Your AI Models</h4>
          {state.models.map((m) => (
            <ModelRow key={m.id} model={m} onPublish={onPublish} />
          ))}
        </div>
      )}
    </div>
  )
}
