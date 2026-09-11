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
import {
  CHIP_MAX_LEVEL,
  CHIP_UNLOCK_VALUATION,
  DATA_PER_CARD,
  FAB_CARDS_PER_WEEK,
  FAB_COST,
  FAB_COST_PER_CARD,
  FAB_UPKEEP,
  MAX_FABS,
  OPS_CAPACITY_MAX,
  OPS_CAPACITY_PER_HEAD,
  REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE,
  USERS_PER_CARD,
} from '../game/constants'
import {
  assignedCount,
  cardsFree,
  cardsTraining,
  chipDesignCost,
  chipDesignWeeks,
  chipEfficiency,
  chipPower,
  chipsUnlocked,
  companyValuation,
  serviceLoad,
  servedUsers,
  servingCapacity,
} from '../game/state'
import { formatMoney } from '../game/format'
import { DATA_SOURCES, curationFactor, dataInflow, dataQualityOf, dataUpkeep } from '../game/data'
import {
  regulationDatacenterShutdownChance,
  regulationElectricityMultiplier,
  regulationGpuCostMultiplier,
} from '../game/regulations'
import './Game.css'

interface Props {
  state: GameState
  onBuyDataSource: (id: string) => void
  onDesignChip: () => void
  onBuildFab: () => void
  onBuyGpu: (count: number) => void
  onBuyRam: (count: number) => void
  onBuySsd: (count: number) => void
  onBuildDatacenter: () => void
  onRentDatacenter: () => void
  onClose: () => void
}

export function DatacentersPanel({ state, onBuyGpu, onBuyRam, onBuySsd, onBuildDatacenter, onRentDatacenter, onClose, onBuyDataSource, onDesignChip, onBuildFab }: Props) {
  const cards = activeCards(state)
  const capacity = (state.datacenters + state.rentedDatacenters) * DATACENTER_CAPACITY
  const idle = Math.max(0, state.gpuCards - capacity)
  const served = servedUsers(state)
  const opsHeads = assignedCount(state, 'ops')
  const opsBonus = Math.min(OPS_CAPACITY_MAX, opsHeads * OPS_CAPACITY_PER_HEAD)
  const curators = assignedCount(state, 'data')
  const chipHeads = state.staff.filter((p) => p.assignment === 'chips' && p.role === 'hardware').length
  const load = serviceLoad(state)
  const capacityPct = Number.isFinite(load) ? Math.round(load * 100) : 999
  const building = state.datacenterBuilds.length
  const gpuCostMult = regulationGpuCostMultiplier(state.activeRegulations)
  const gpuCost = Math.round(GPU_CARD_COST * gpuCostMult)
  const electricityMult = regulationElectricityMultiplier(state.activeRegulations)
  const shutdownChance =
    REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE + regulationDatacenterShutdownChance(state.activeRegulations)

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Compute &amp; Data</h3>
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

      <div className="load-block">
        <p className="dc-note">
          {cardsFree(state)} card{cardsFree(state) === 1 ? '' : 's'} serving,{' '}
          {cardsTraining(state)} tied up in training. Serving {served.toLocaleString()} of{' '}
          {servingCapacity(state).toLocaleString()} ({capacityPct}%). Each free card carries{' '}
          {USERS_PER_CARD.toLocaleString()} people
          {opsHeads > 0 ? `, plus ${Math.round(opsBonus * 100)}% from your ${opsHeads} on reliability` : ''}.
        </p>
        <span className="load-track">
          <span
            className={`load-fill ${load > 1 ? 'over' : load > 0.85 ? 'warn' : ''}`}
            style={{ width: `${Math.min(100, load * 100).toFixed(1)}%` }}
          />
        </span>
        {load > 1 && (
          <p className="dc-note danger-text">
            Over capacity. People are hitting errors and leaving. Buy cards and somewhere to put them.
          </p>
        )}
      </div>

      {idle > 0 && (
        <p className="dc-note">
          ⚠ {idle} card{idle > 1 ? 's' : ''} idle — add a datacenter to power them.
        </p>
      )}

      <div className="smear-section">
        <h4 className="model-list-title">Your own silicon</h4>
        {!chipsUnlocked(state) ? (
          <p className="placeholder">
            Designing a chip is a thing only a serious company does. Come back when you are worth{' '}
            {formatMoney(CHIP_UNLOCK_VALUATION)} — you are at {formatMoney(companyValuation(state))}.
          </p>
        ) : (
          <>
            <p className="placeholder">
              {state.chipLevel === 0
                ? 'Stop buying whatever the market sells. Your own chips make every card you own worth more, draw less power, and cost a fraction to make once a fab is running.'
                : `Generation ${state.chipLevel} silicon: every card is worth ${Math.round(chipPower(state) * 100 - 100)}% more and draws ${Math.round(100 - chipEfficiency(state) * 100)}% less power.`}
            </p>
            <div className="amenity-row">
              <span className="amenity-what">
                {state.chipDesign
                  ? `Designing generation ${state.chipDesign.toLevel}`
                  : state.chipLevel >= CHIP_MAX_LEVEL
                    ? 'Nothing left to design'
                    : `Design generation ${state.chipLevel + 1}`}
                <span className="comp-sub">
                  {state.chipDesign
                    ? `${Math.ceil(state.chipDesign.weeksRemaining)}wk left`
                    : `${chipDesignWeeks(state)}wk with your ${chipHeads} hardware ${chipHeads === 1 ? 'engineer' : 'engineers'} on it · $${chipDesignCost(state).toLocaleString()}`}
                </span>
              </span>
              <button
                className="hire-btn"
                disabled={
                  Boolean(state.chipDesign) ||
                  state.chipLevel >= CHIP_MAX_LEVEL ||
                  chipHeads < 1 ||
                  state.money < chipDesignCost(state)
                }
                title={chipHeads < 1 ? 'Hire a hardware engineer and put them on chips' : undefined}
                onClick={onDesignChip}
              >
                {state.chipDesign ? 'Running' : 'Start'}
              </button>
            </div>
            <div className="amenity-row">
              <span className="amenity-what">
                Fabrication lines: {state.fabs} of {MAX_FABS}
                <span className="comp-sub">
                  Each turns out {FAB_CARDS_PER_WEEK} cards a week at ${FAB_COST_PER_CARD.toLocaleString()} each,
                  against ${GPU_CARD_COST.toLocaleString()} on the market. ${FAB_UPKEEP.toLocaleString()}/wk to run.
                </span>
              </span>
              <button
                className="hire-btn"
                disabled={state.chipLevel < 1 || state.fabs >= MAX_FABS || state.money < FAB_COST}
                title={state.chipLevel < 1 ? 'Design a chip first' : undefined}
                onClick={onBuildFab}
              >
                Build (${(FAB_COST / 1e6).toFixed(0)}M)
              </button>
            </div>
          </>
        )}
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">The data pipeline</h4>
        <p className="placeholder">
          {Math.round(state.dataStock)} TB piled up · {dataInflow(state).toFixed(1)} TB a week in ·
          quality +{Math.round(dataQualityOf(state.dataSources))} on everything you train · $
          {dataUpkeep(state).toLocaleString()}/wk to run · {curators} on curation (×
          {curationFactor(state).toFixed(2)})
        </p>
        <p className="placeholder">
          A training run eats {DATA_PER_CARD} TB per card. Put people on curation from the office to
          fill the pile faster.
        </p>
        {DATA_SOURCES.map((d) => {
          const owned = state.dataSources.includes(d.id)
          return (
            <div className={`amenity-row ${owned ? 'owned' : ''}`} key={d.id}>
              <span className="amenity-what">
                {d.name}
                <span className="comp-sub">
                  {d.yield} TB/wk · +{d.quality} quality · ${d.upkeep.toLocaleString()}/wk · {d.description}
                </span>
              </span>
              <button
                className="hire-btn"
                disabled={owned || state.money < d.cost}
                onClick={() => onBuyDataSource(d.id)}
              >
                {owned ? 'Running' : d.cost === 0 ? 'Switch on' : `$${d.cost.toLocaleString()}`}
              </button>
            </div>
          )
        })}
      </div>

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
              Datacenter #{state.datacenters + i + 1} · {Math.ceil(w)}wk remaining
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
