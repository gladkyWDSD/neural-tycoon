import { useState } from 'react'
import type { AIModel, GameState, PostType, PricingModel, PromoKind, Staff } from '../game/types'
import { TopBar } from './TopBar'
import { MAX_BARS, OfficeView } from './OfficeView'
import { CampusView } from './CampusView'
import { LabView } from './LabView'
import { DatacenterView } from './DatacenterView'
import type { Job } from './OfficeView'
import { StaffMenu } from './StaffMenu'
import { RunReport } from './RunReport'
import { Standings } from './Standings'
import type { LobbyPlayer } from '../game/multiplayer'
import type { AttackKind, StaffCard, TradeKind } from '../game/types'
import { BidModal } from './BidModal'
import { HirePanel } from './HirePanel'
import { ResearchPanel } from './ResearchPanel'
import { BuildPanel } from './BuildPanel'
import { TwitterPanel } from './TwitterPanel'
import { DatacentersPanel } from './DatacentersPanel'
import { CompetitorsPanel } from './CompetitorsPanel'
import { CompanyPanel } from './CompanyPanel'
import { AdsPanel } from './AdsPanel'
import { GovernmentPanel } from './GovernmentPanel'
import { TradingPanel } from './TradingPanel'
import { TradeModal } from './TradeModal'
import { PresidentCall } from './PresidentCall'
import { NewsPanel } from './NewsPanel'
import { SideNav } from './SideNav'
import type { PanelId } from './SideNav'
import { CAMPAIGN_DURATION } from '../game/constants'
import { RESEARCH_MAP } from '../game/research'
import { globalWeek, maxStaff, serviceLoad } from '../game/state'
import './Game.css'


interface Props {
  state: GameState
  musicOn: boolean
  onToggleMusic: () => void
  onTogglePause: () => void
  /** in a race, the nickname of whoever holds the clock, when it is not you */
  pauseLockedBy?: string | null
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
  onBuyBook: (id: string) => void
  onBuyHypeBots: () => void
  onStartTraining: (staffId: string) => void
  onFireStaff: (staffId: string) => void
  onGiveRaise: (staffId: string) => void
  /** present only when this game is a multiplayer race */
  race?: { players: LobbyPlayer[]; selfId: string; isHost: boolean; winner: string | null }
  onAttackPlayer: (targetId: string, targetName: string, kind: AttackKind) => void
  onBidForStaff: (targetId: string, targetName: string, staff: StaffCard, amount: number) => void
  onResolveBid: (matched: boolean) => void
  onBuyAmenity: (id: string) => void
  onBuyDataSource: (id: string) => void
  onDesignChip: () => void
  onBuildFab: () => void
  onAssignStaff: (staffId: string, assignment: Staff['assignment']) => void
  onRunAudit: () => void
  onHangUp: () => void
  onNewGame: () => void
  onAcquireCompetitor: (id: string, name: string) => void
  onSignContract: (id: string) => void
  onDeclineContract: (id: string) => void
  onOfferTrade: (
    targetId: string,
    targetName: string,
    kind: TradeKind,
    price: number,
    extra: { gpus?: number; researchId?: string; modelId?: string; datacenters?: number },
  ) => void
  onResolveTrade: (accepted: boolean) => void
  onBreakPact: (playerId: string) => void
  onKickPlayer: (playerId: string, nickname: string) => void
  onRaiseInvestment: () => void
  onStartPromo: (id: string, kind: PromoKind) => void
  onBotAttack: (competitorId: string) => void
  onHireHackers: (competitorId: string) => void
  onHireJournalists: () => void
  onEditModel: (id: string, name?: string, pricing?: PricingModel) => void
  onHireLobbyists: () => void
}

export function GameScreen({
  state,
  musicOn,
  onToggleMusic,
  onTogglePause,
  pauseLockedBy,
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
  onBuyBook,
  onBuyHypeBots,
  onStartTraining,
  onFireStaff,
  onGiveRaise,
  race,
  onAttackPlayer,
  onBidForStaff,
  onResolveBid,
  onBuyAmenity,
  onBuyDataSource,
  onDesignChip,
  onBuildFab,
  onAssignStaff,
  onRunAudit,
  onHangUp,
  onNewGame,
  onAcquireCompetitor,
  onSignContract,
  onDeclineContract,
  onOfferTrade,
  onResolveTrade,
  onBreakPact,
  onKickPlayer,
  onRaiseInvestment,
  onStartPromo,
  onBotAttack,
  onHireHackers,
  onHireJournalists,
  onEditModel,
  onHireLobbyists,
}: Props) {
  const [panel, setPanel] = useState<PanelId>(null)
  // right-clicking someone in the office opens their menu at the pointer
  const [staffMenu, setStaffMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [winSeen, setWinSeen] = useState(false)
  // the report can also be opened on purpose, from the Company panel
  const [reportOpen, setReportOpen] = useState(false)
  // where you are standing: your desk, the field, the lab or a server hall
  const [place, setPlace] = useState<'office' | 'campus' | 'lab' | 'hall'>('office')
  const myRaceName = race?.players.find((p) => (race.isHost ? p.isHost : p.id === race.selfId))?.name
  const menuStaff = staffMenu ? state.staff.find((s) => s.id === staffMenu.id) : undefined

  // one desk per person the office can hold, all the way up to the top upgrade
  const deskCount = maxStaff(state)
  // researchers have a lab of their own, so they are not also at a desk in here
  // researchers and hardware engineers work in the lab, not on the office floor
  const deskStaff = state.staff.filter((s) => s.role !== 'researcher' && s.role !== 'hardware')

  // Everything running right now gets its own bar over the office, oldest
  // first so a bar keeps its place while it fills. Only the first few fit.
  const jobs: Job[] = [
    ...state.researching.map((r) => ({
      id: `research:${r.id}`,
      kind: 'research' as const,
      progress: 1 - r.weeksRemaining / (r.totalWeeks || 1),
      label: RESEARCH_MAP[r.id]?.name ?? 'Research',
    })),
    ...state.models
      .filter((m) => m.status === 'training')
      .map((m) => ({
        id: `model:${m.id}`,
        kind: 'training' as const,
        progress: 1 - m.weeksRemaining / (m.totalWeeks || 1),
        label: m.name,
      })),
    ...(state.campaignWeeksLeft > 0
      ? [
          {
            id: 'campaign',
            kind: 'marketing' as const,
            progress: 1 - state.campaignWeeksLeft / CAMPAIGN_DURATION,
            label: 'Campaign',
          },
        ]
      : []),
  ].slice(0, MAX_BARS)

  return (
    <div className="game-screen screen">
      <TopBar
        state={state}
        musicOn={musicOn}
        onToggleMusic={onToggleMusic}
        onTogglePause={onTogglePause}
        pauseLockedBy={pauseLockedBy}
        onOpenPanel={setPanel}
        panel={panel}
      />

      <div className="game-body">
        <SideNav state={state} panel={panel} racing={Boolean(race)} onOpen={setPanel} />

        <div className="office-wrap">
          {place === 'campus' ? (
            <CampusView
              state={state}
              onEnter={() => setPlace('office')}
              onEnterLab={() => setPlace('lab')}
              onEnterHall={() => setPlace('hall')}
            />
          ) : place === 'lab' ? (
            <LabView
              state={state}
              onLeave={() => setPlace('campus')}
              onStaffMenu={(id, x, y) => setStaffMenu({ id, x, y })}
            />
          ) : place === 'hall' ? (
            <DatacenterView state={state} onLeave={() => setPlace('campus')} />
          ) : (
          <OfficeView
            staff={deskStaff}
            desks={deskCount}
            jobs={jobs}
            amenities={state.amenities}
            week={globalWeek(state)}
            load={Number.isFinite(serviceLoad(state)) ? serviceLoad(state) : 9}
            onStaffMenu={(id, x, y) => setStaffMenu({ id, x, y })}
            onLeave={() => setPlace('campus')}
          />
          )}
          {race && <Standings players={race.players} selfId={race.selfId} isHost={race.isHost} />}
        </div>

        {panel === 'hire' && (
          <HirePanel state={state} onHire={onHire} onStartTraining={onStartTraining} onClose={() => setPanel(null)} />
        )}
        {panel === 'research' && (
          <ResearchPanel state={state} onStartResearch={onStartResearch} onClose={() => setPanel(null)} />
        )}
        {panel === 'build' && (
          <BuildPanel
            state={state}
            onStartModel={onStartModel}
            onPublish={onPublish}
            onStartPromo={onStartPromo}
            onBuyBook={onBuyBook}
            onEditModel={onEditModel}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'twitter' && (
          <TwitterPanel
            state={state}
            onPost={onPost}
            onSmear={onSmear}
            onLaunchCampaign={onLaunchCampaign}
            onBuyHypeBots={onBuyHypeBots}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'ads' && (
          <AdsPanel
            state={state}
            onBotAttack={onBotAttack}
            onHireHackers={onHireHackers}
            onHireJournalists={onHireJournalists}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'datacenters' && (
          <DatacentersPanel
            state={state}
            onBuyGpu={onBuyGpu}
            onBuyRam={onBuyRam}
            onBuySsd={onBuySsd}
            onBuyDataSource={onBuyDataSource}
            onDesignChip={onDesignChip}
            onBuildFab={onBuildFab}
            onBuildDatacenter={onBuildDatacenter}
            onRentDatacenter={onRentDatacenter}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'competitors' && (
          <CompetitorsPanel
            state={state}
            onPoach={onPoach}
            onClose={() => setPanel(null)}
            race={race}
            onAttackPlayer={onAttackPlayer}
            onBidForStaff={onBidForStaff}
            onKickPlayer={onKickPlayer}
            onAcquire={onAcquireCompetitor}
          />
        )}
        {panel === 'company' && (
          <CompanyPanel
            state={state}
            onUpgradeOffice={onUpgradeOffice}
            onIpo={onIpo}
            onRaiseInvestment={onRaiseInvestment}
            onBuyAmenity={onBuyAmenity}
            onSignContract={onSignContract}
            onDeclineContract={onDeclineContract}
            onShowReport={() => setReportOpen(true)}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'trading' && (
          <TradingPanel
            state={state}
            race={race}
            onOfferTrade={onOfferTrade}
            onBreakPact={onBreakPact}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'government' && (
          <GovernmentPanel
            state={state}
            onHireLobbyists={onHireLobbyists}
            onRunAudit={onRunAudit}
            onClose={() => setPanel(null)}
          />
        )}
      </div>

      <NewsPanel state={state} />

      {!state.lost && state.pendingBid && <BidModal state={state} onResolve={onResolveBid} />}
      {!state.lost && state.pendingTrade && <TradeModal state={state} onResolve={onResolveTrade} />}
      {!state.lost && state.presidentCall && <PresidentCall state={state} onHangUp={onHangUp} />}

      {state.lost ? (
        <RunReport
          state={state}
          outcome={{ won: false, lost: true }}
          onClose={onNewGame}
          closeLabel="Start again"
          closeHint="A new company, from the beginning."
        />
      ) : race?.winner ? (
        <RunReport
          state={state}
          outcome={{ won: race.winner === myRaceName, winner: race.winner, isMe: race.winner === myRaceName }}
          onClose={() => setReportOpen(false)}
          closeLabel="Close"
          closeHint="Your company is still yours to run."
        />
      ) : (
        state.won &&
        !winSeen && (
          <RunReport
            state={state}
            outcome={{ won: true }}
            onClose={() => setWinSeen(true)}
            closeLabel="Keep playing"
            closeHint={
              state.paused
                ? 'The game is paused. Press play when you want to carry on.'
                : 'Carry on building for as long as you like.'
            }
          />
        )
      )}

      {reportOpen && !race?.winner && !(state.won && !winSeen) && (
        <RunReport state={state} onClose={() => setReportOpen(false)} />
      )}

      {staffMenu && menuStaff && (
        <StaffMenu
          staff={menuStaff}
          state={state}
          x={staffMenu.x}
          y={staffMenu.y}
          onTrain={onStartTraining}
          onAssign={onAssignStaff}
          onRaise={onGiveRaise}
          onFire={onFireStaff}
          onClose={() => setStaffMenu(null)}
        />
      )}
    </div>
  )
}
