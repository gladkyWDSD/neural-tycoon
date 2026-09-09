import type { GameState } from '../game/types'
import {
  DATACENTER_BUILD_WEEKS,
  DATACENTER_CAPACITY,
  DATACENTER_COST,
  ELECTRICITY_PER_CARD_WEEK,
  GPU_CARD_COST,
  RAM_COST,
  RENT_DISPUTE_CHANCE,
  RENT_WEEKLY_FEE,
  SSD_COST,
  activeCards,
} from '../game/gpu'
import { REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE } from '../game/constants'
import {
  regulationDatacenterShutdownChance,
  regulationElectricityMultiplier,
  regulationGpuCostMultiplier,
} from '../game/regulations'
import './Game.css'

interface Props {
  state: GameState
  onBuyGpu: (count: number) => void
  onBuyRam: (count: number) => void
  onBuySsd: (count: number) => void
  onBuildDatacenter: () => void
  onRentDatacenter: () => void
  onClose: () => void
}

export function DatacentersPanel({ state, onBuyGpu, onBuyRam, onBuySsd, onBuildDatacenter, onRentDatacenter, onClose }: Props) {
  const cards = activeCards(state)
  const capacity = (state.datacenters + state.rentedDatacenters) * DATACENTER_CAPACITY
  const idle = Math.max(0, state.gpuCards - capacity)
  const building = state.datacenterBuilds.length
  const gpuCostMult = regulationGpuCostMultiplier(state.activeRegulations)
  const gpuCost = Math.round(GPU_CARD_COST * gpuCostMult)
  const electricityMult = regulationElectricityMultiplier(state.activeRegulations)
  const shutdownChance =
    REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE + regulationDatacenterShutdownChance(state.activeRegulations)

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Datacenters</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="dc-stats">
        <div className="dc-stat">
          <span className="dc-value">{state.gpuCards}</span>
          <span className="dc-label">GPU cards owned</span>
        </div>
        <div className="dc-stat">
          <span className="dc-value">{state.datacenters}</span>
          <span className="dc-label">Built</span>
        </div>
        <div className="dc-stat">
          <span className="dc-value">{state.rentedDatacenters}</span>
          <span className="dc-label">Rented</span>
        </div>
        <div className="dc-stat">
          <span className="dc-value">{cards}</span>
          <span className="dc-label">Active GPUs</span>
        </div>
      </div>

      <p className="dc-note">
        Electricity ${Math.round(cards * ELECTRICITY_PER_CARD_WEEK * electricityMult).toLocaleString()}/wk · Rent $
        {(state.rentedDatacenters * RENT_WEEKLY_FEE).toLocaleString()}/wk
      </p>

      {idle > 0 && (
        <p className="dc-note">
          ⚠ {idle} card{idle > 1 ? 's' : ''} idle — add a datacenter to power them.
        </p>
      )}

      {state.datacenters > 0 && (
        <p className="dc-note">
          🏛️ ~{(shutdownChance * 100).toFixed(1)}%/wk chance a built datacenter is shut down by regulators — see the
          Government panel.
        </p>
      )}

      <div className="dc-actions">
        <div className="dc-action">
          <div className="dc-action-info">
            <span className="dc-action-title">GPU Card</span>
            <span className="dc-action-desc">
              ${(gpuCost / 1000).toFixed(1)}k each · powers model training
              {gpuCostMult > 1 && ` (🏛️ +${Math.round((gpuCostMult - 1) * 100)}% from regulations)`}
            </span>
          </div>
          <div className="dc-action-btns">
            <button className="hire-btn" disabled={state.money < gpuCost} onClick={() => onBuyGpu(1)}>
              Buy 1
            </button>
            <button
              className="hire-btn"
              disabled={state.money < gpuCost * 10}
              onClick={() => onBuyGpu(10)}
            >
              Buy 10
            </button>
          </div>
        </div>

        <div className="dc-action">
          <div className="dc-action-info">
            <span className="dc-action-title">Build Datacenter</span>
            <span className="dc-action-desc">
              ${(DATACENTER_COST / 1000).toFixed(0)}k · holds {DATACENTER_CAPACITY} cards · {DATACENTER_BUILD_WEEKS}wk · 🌱 eco risk
            </span>
          </div>
          <button
            className="hire-btn"
            disabled={state.money < DATACENTER_COST}
            onClick={onBuildDatacenter}
          >
            Build
          </button>
        </div>

        <div className="dc-action">
          <div className="dc-action-info">
            <span className="dc-action-title">Rent Datacenter</span>
            <span className="dc-action-desc">
              ${(RENT_WEEKLY_FEE / 1000).toFixed(0)}k/wk · holds {DATACENTER_CAPACITY} cards · ⚡ {Math.round(RENT_DISPUTE_CHANCE * 100)}% dispute risk
            </span>
          </div>
          <button className="hire-btn" onClick={onRentDatacenter}>
            Rent
          </button>
        </div>

        <div className="dc-action">
          <div className="dc-action-info">
            <span className="dc-action-title">RAM</span>
            <span className="dc-action-desc">
              ${(RAM_COST / 1000).toFixed(1)}k each · speeds up training (owned: {state.ram})
            </span>
          </div>
          <div className="dc-action-btns">
            <button className="hire-btn" disabled={state.money < RAM_COST} onClick={() => onBuyRam(1)}>
              Buy 1
            </button>
            <button className="hire-btn" disabled={state.money < RAM_COST * 10} onClick={() => onBuyRam(10)}>
              Buy 10
            </button>
          </div>
        </div>

        <div className="dc-action">
          <div className="dc-action-info">
            <span className="dc-action-title">SSD</span>
            <span className="dc-action-desc">
              ${(SSD_COST / 1000).toFixed(1)}k each · boosts model quality (owned: {state.ssd})
            </span>
          </div>
          <div className="dc-action-btns">
            <button className="hire-btn" disabled={state.money < SSD_COST} onClick={() => onBuySsd(1)}>
              Buy 1
            </button>
            <button className="hire-btn" disabled={state.money < SSD_COST * 10} onClick={() => onBuySsd(10)}>
              Buy 10
            </button>
          </div>
        </div>
      </div>

      {building > 0 && (
        <div className="dc-building">
          {state.datacenterBuilds.map((w, i) => (
            <div key={i} className="dc-build-row">
              Datacenter #{state.datacenters + i + 1} · {w}wk remaining
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
