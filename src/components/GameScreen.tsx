import { useState } from 'react'
import type { AIModel, GameState, PostType, PricingModel, Staff } from '../game/types'
import { TopBar } from './TopBar'
import { OfficeView } from './OfficeView'
import { HirePanel } from './HirePanel'
import { ResearchPanel } from './ResearchPanel'
import { BuildPanel } from './BuildPanel'
import { TwitterPanel } from './TwitterPanel'
import { DatacentersPanel } from './DatacentersPanel'
import { CompetitorsPanel } from './CompetitorsPanel'
import { CompanyPanel } from './CompanyPanel'
import { NewsFeed } from './NewsFeed'
import { DESKS_PER_LEVEL, CAMPAIGN_DURATION } from '../game/constants'
import './Game.css'

type PanelId =
  | 'hire'
  | 'build'
  | 'research'
  | 'datacenters'
  | 'twitter'
  | 'competitors'
  | 'company'
  | null

interface Props {
  state: GameState
  onTogglePause: () => void
  onHire: (staff: Staff) => void
  onStartResearch: (id: string) => void
  onStartModel: (model: AIModel) => void
  onPublish: (id: string, pricing: PricingModel) => void
  onPost: (text: string, type: PostType) => void
  onSmear: (competitorId: string) => void
  onBuyGpu: (count: number) => void
  onBuyRam: (count: number) => void
  onBuySsd: (count: number) => void
  onPoach: (competitorId: string) => void
  onBuildDatacenter: () => void
  onRentDatacenter: () => void
  onUpgradeOffice: () => void
  onIpo: () => void
  onLaunchCampaign: () => void
}

export function GameScreen({
  state,
  onTogglePause,
  onHire,
  onStartResearch,
  onStartModel,
  onPublish,
  onPost,
  onSmear,
  onBuyGpu,
  onBuyRam,
  onBuySsd,
  onPoach,
  onBuildDatacenter,
  onRentDatacenter,
  onUpgradeOffice,
  onIpo,
  onLaunchCampaign,
}: Props) {
  const [panel, setPanel] = useState<PanelId>(null)

  const deskCount = Math.min(state.officeLevel * DESKS_PER_LEVEL, 12)

  const researchProgress = state.researching.length > 0
    ? 1 - Math.min(...state.researching.map((r) => r.weeksRemaining / (r.totalWeeks || 1)))
    : null

  const trainingModels = state.models.filter((m) => m.status === 'training')
  const trainingProgress = trainingModels.length > 0
    ? 1 - Math.min(...trainingModels.map((m) => m.weeksRemaining / (m.totalWeeks || 1)))
    : null

  const researchTotalWeeks = state.researching.length > 0 ? state.researching[0].totalWeeks : null
  const trainingTotalWeeks = trainingModels.length > 0 ? trainingModels[0].totalWeeks : null

  const campaignActive = state.campaignWeeksLeft > 0
  const campaignProgress = campaignActive ? 1 - state.campaignWeeksLeft / CAMPAIGN_DURATION : null

  const menuItems: { id: PanelId; label: string }[] = [
    { id: 'hire', label: 'Hire Staff' },
    { id: 'build', label: 'Build AI' },
    { id: 'research', label: 'Research' },
    { id: 'twitter', label: 'Twitter' },
    { id: 'datacenters', label: 'Datacenters' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'company', label: 'Company' },
  ]

  return (
    <div className="game-screen screen">
      <TopBar state={state} onTogglePause={onTogglePause} />

      <div className="game-body">
        <div className="office-wrap">
          <OfficeView
            staff={state.staff}
            desks={deskCount}
            researchProgress={researchProgress}
            trainingProgress={trainingProgress}
            researchTotalWeeks={researchTotalWeeks}
            trainingTotalWeeks={trainingTotalWeeks}
            marketingProgress={campaignProgress}
            marketingTotalWeeks={campaignActive ? CAMPAIGN_DURATION : null}
          />
          <NewsFeed state={state} />
        </div>

        {panel === 'hire' && (
          <HirePanel state={state} onHire={onHire} onClose={() => setPanel(null)} />
        )}
        {panel === 'research' && (
          <ResearchPanel state={state} onStartResearch={onStartResearch} onClose={() => setPanel(null)} />
        )}
        {panel === 'build' && (
          <BuildPanel
            state={state}
            onStartModel={onStartModel}
            onPublish={onPublish}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'twitter' && (
          <TwitterPanel
            state={state}
            onPost={onPost}
            onSmear={onSmear}
            onLaunchCampaign={onLaunchCampaign}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'datacenters' && (
          <DatacentersPanel
            state={state}
            onBuyGpu={onBuyGpu}
            onBuyRam={onBuyRam}
            onBuySsd={onBuySsd}
            onBuildDatacenter={onBuildDatacenter}
            onRentDatacenter={onRentDatacenter}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'competitors' && (
          <CompetitorsPanel state={state} onPoach={onPoach} onClose={() => setPanel(null)} />
        )}
        {panel === 'company' && (
          <CompanyPanel
            state={state}
            onUpgradeOffice={onUpgradeOffice}
            onIpo={onIpo}
            onClose={() => setPanel(null)}
          />
        )}
      </div>

      <div className="menubar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-btn ${panel === item.id ? 'active' : ''}`}
            onClick={() => setPanel(panel === item.id ? null : item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
