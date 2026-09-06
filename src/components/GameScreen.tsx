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
import { DESKS_PER_LEVEL } from '../game/constants'
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
  onBuildDatacenter: () => void
  onRentDatacenter: () => void
  onUpgradeOffice: () => void
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
  onBuildDatacenter,
  onRentDatacenter,
  onUpgradeOffice,
}: Props) {
  const [panel, setPanel] = useState<PanelId>(null)

  const deskCount = Math.min(state.officeLevel * DESKS_PER_LEVEL, 12)

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
          <OfficeView staff={state.staff} desks={deskCount} />
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
          <TwitterPanel state={state} onPost={onPost} onSmear={onSmear} onClose={() => setPanel(null)} />
        )}
        {panel === 'datacenters' && (
          <DatacentersPanel
            state={state}
            onBuyGpu={onBuyGpu}
            onBuildDatacenter={onBuildDatacenter}
            onRentDatacenter={onRentDatacenter}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'competitors' && (
          <CompetitorsPanel state={state} onClose={() => setPanel(null)} />
        )}
        {panel === 'company' && (
          <CompanyPanel state={state} onUpgradeOffice={onUpgradeOffice} onClose={() => setPanel(null)} />
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
