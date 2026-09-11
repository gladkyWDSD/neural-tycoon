import type { Difficulty, GameDate, Nationality, Role } from './types'

export const START_MONEY = 10_000_000
export const START_YEAR = 2022
export const WEEKS_PER_YEAR = 52

export const START_DATE: GameDate = { year: START_YEAR, week: 1 }

export const DEFAULT_COMPANY_NAMES = ['Anpolus', 'ClosedAI', 'DeepBrain', 'WhyAI']

export const DEFAULT_AI_NAMES = [
  'ChatPT',
  'Clawd',
  'Geminix',
  'Grak',
  'DeepPeek',
  'Llam',
  'Mistrall',
  'Kwen',
  'Midway',
  'Doll-E',
  'Stable Fusion',
  'CoPilo',
]

export interface NationalityInfo {
  id: Nationality
  label: string
  flag: string
  specialty: string
  // skill bias per role (0-200 scale), added on top of a base roll
  mathBias: number
  codingBias: number
  marketingBias: number
  legalBias: number
}

export const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'researcher', label: 'Researcher', icon: '∑' },
  { id: 'engineer', label: 'Engineer', icon: '</>' },
  { id: 'marketer', label: 'Marketer', icon: '★' },
  { id: 'lawyer', label: 'Lawyer', icon: '§' },
  { id: 'hardware', label: 'Hardware', icon: '⌗' },
]

export const NATIONALITIES: Record<Nationality, NationalityInfo> = {
  china: {
    id: 'china',
    label: 'China',
    flag: '🇨🇳',
    specialty: 'Math',
    mathBias: 30,
    codingBias: 5,
    marketingBias: 0,
    legalBias: 0,
  },
  europe: {
    id: 'europe',
    label: 'Europe',
    flag: '🇪🇺',
    specialty: 'Programming',
    mathBias: 5,
    codingBias: 30,
    marketingBias: 0,
    legalBias: 0,
  },
  usa: {
    id: 'usa',
    label: 'USA',
    flag: '🇺🇸',
    specialty: 'Marketing & Legal',
    mathBias: 5,
    codingBias: 0,
    marketingBias: 25,
    legalBias: 25,
  },
}

export const MIN_HIRE_SCORE = 150
export const MAX_SCORE = 200
export const MIN_SCORE = 0

export const DESKS_PER_LEVEL = 6
export const OFFICE_UPGRADE_BASE_COST = 200000
export const MAX_OFFICE_LEVEL = 4

// What the market thinks the company is worth. Annualised revenue does most of
// the work; users, reach and research are what a buyer pays a premium for.
export const VALUATION_REVENUE_MULTIPLE = 20
export const VALUATION_PER_CUSTOMER = 1_000
export const VALUATION_PER_TRIAL_USER = 200
export const VALUATION_PER_FOLLOWER = 50
export const VALUATION_PER_RESEARCH = 10_000_000
export const IPO_VALUATION = 1_000_000_000 // you can go public once you are worth this much
export const IPO_RAISE_SHARE = 0.1 // and the float raises this share of the valuation in cash
export const WIN_VALUATION = 100_000_000_000 // reach this and you have won

// Rivals are meant to be hard to overtake. They grow faster than their raw model
// numbers suggest, ship new models often, and polish what they have every week.
// Everything the player's models earn in users is scaled by this. Lowering it
// makes every milestone take proportionally longer, which is the cleanest way to
// turn the whole game's difficulty up without distorting any single system.
// Game length and difficulty presets.
//
// The economy knobs barely move the finishing line on their own, because market
// saturation compensates for a slower grower. So they set how *hard* the race is
// (how strong rivals are next to you) and the tick length sets how *long* it runs.
// A win lands somewhere around game week 400 whatever the settings, so the week
// length is chosen to put that at the advertised hour count.
export interface DifficultySetting {
  id: Difficulty
  label: string
  blurb: string
  tickMs: number // real milliseconds per game week
  playerGrowth: number
  competitorGrowth: number
}

export const DIFFICULTIES: DifficultySetting[] = [
  {
    id: 'easy',
    label: 'Easy',
    blurb: 'About an hour. Fast weeks, gentle rivals.',
    tickMs: 11000,
    playerGrowth: 0.6,
    competitorGrowth: 1.05,
  },
  {
    id: 'medium',
    label: 'Medium',
    blurb: 'About two hours. A fair fight.',
    tickMs: 18000,
    playerGrowth: 0.36,
    competitorGrowth: 1.4,
  },
  {
    id: 'long',
    label: 'Long',
    blurb: 'Three to five hours. The full game.',
    tickMs: 30000,
    playerGrowth: 0.18,
    competitorGrowth: 1.9,
  },
]

export const DIFFICULTY_MAP: Record<Difficulty, DifficultySetting> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.id, d]),
) as Record<Difficulty, DifficultySetting>

export const DEFAULT_DIFFICULTY: Difficulty = 'long'

// How fast the world takes up AI: each model category's market grows by this
// share of its base size every week. It is the ceiling everyone competes under,
// so it sets the pace of the whole game more than any other number.
export const MARKET_GROWTH_PER_WEEK = 0.03

// Model quality. A hard clamp at 100 meant a starting team with a dozen cards
// already maxed it in the first year, which flattened the whole progression.
// The raw score now runs through a curve instead, so early models are rough,
// good models take a real team, and a perfect one takes an exceptional one.
export const QUALITY_CEILING_BASE = 25
export const QUALITY_CEILING_PER_SCORE = 0.18
export const QUALITY_REALIZATION_BASE = 0.35
export const QUALITY_REALIZATION_PER_SCORE = 0.001
export const QUALITY_SOFTNESS = 90

// Models age. What matters is not whether yours is the best in the world, but how
// far the world has moved since the day you shipped it: a launch is fine on its own
// terms, and then rivals keep improving and it slowly dates. Shipping a successor
// is how you keep a segment. A brand new model never decays, however modest it is,
// which is what lets a small company get started at all.
export const SOTA_DRIFT_PER_POINT = 0.004 // weekly share of users lost per point the world has moved on
export const SOTA_DECAY_CAP = 0.05 // never lose more than this share of a model's users in one week
export const SOTA_LEAD_BONUS = 0.012 // extra weekly growth per quality point ahead of the world's best
export const SUCCESSOR_MIGRATION = 0.35 // share of an older model's users that move to your new one

export const COMPETITOR_RELEASE_CHANCE = 0.28
// A rival only supports so many products at once. Past this, a new release
// replaces their oldest model and inherits its users, the way a real successor
// does, instead of stacking another growth engine on the pile forever.
export const COMPETITOR_MAX_MODELS = 4
export const COMPETITOR_QUALITY_CREEP = 0.3

// ----------------------------------------------------------- rival companies
// Rivals run their own books. These are the numbers their week is made of, kept
// on the same scale as the player's so the ladder compares like with like.
export const RIVAL_REV_PER_USER = 0.5
export const RIVAL_SALARY = 4_200
// what share of their weekly income a lab is willing to put into payroll
export const RIVAL_PAYROLL_SHARE = 0.35
// a funded lab staffs up to what its bank will carry for this long
export const RIVAL_RUNWAY_WEEKS = 45
// and the chance each week that an idle lab starts its next model
export const RIVAL_START_CHANCE = 0.3
// how much of an older model's crowd moves to a rival's successor
export const RIVAL_SUCCESSION = 0.6
export const RIVAL_HIRE_RUNWAY = 26 // weeks of a salary they want in the bank before hiring
export const RIVAL_MAX_STAFF = 34
export const RIVAL_GPU_COST = 5_000
export const RIVAL_GPUS_PER_ENGINEER = 9
export const RIVAL_ELECTRICITY = 400
export const RIVAL_RESEARCH_PER_RESEARCHER = 1.1
export const RIVAL_RESEARCH_COST = 34 // points for the next level
export const RIVAL_TRAIN_MIN_WEEKS = 9
export const RIVAL_TRAIN_MAX_WEEKS = 28
export const RIVAL_FOLLOWERS_PER_MARKETER = 420
export const RIVAL_QUALITY_SOFTNESS = 78

export const CAMPAIGN_DURATION = 4
export const CAMPAIGN_COOLDOWN = 10
export const CAMPAIGN_COST = 40000

export const COMPETITOR_POACH_GRACE_WEEKS = 4 // no poaching risk while you're still ramping up
export const COMPETITOR_POACH_BASE_CHANCE = 0.006 // per-staff weekly base, scaled by score & how underpaid they are
// Bidding for another player's employee. Making an offer costs a headhunter fee
// whatever happens, so you cannot spam offers to drain a rival's cash for free.
export const POACH_BID_FEE_SHARE = 0.2
export const POACH_MIN_BID_WEEKS = 6 // an offer must be worth at least this many weeks of their pay

export const FIRE_SEVERANCE_WEEKS = 4 // letting someone go costs this many weeks of their salary
export const POACH_COUNTER_PREMIUM = 1.2 // a rival's offer, as a multiple of today's market salary
export const POACH_COUNTER_BONUS_WEEKS = 4 // matching it also costs this many weeks of the new salary up front

export const HYPE_BOTS_COST = 25000
export const HYPE_BOTS_FOLLOWERS = 1500
export const HYPE_BOTS_COOLDOWN = 3 // weeks
export const HYPE_BOTS_BUST_CHANCE = 0.25 // chance the bots get called out instead of boosting you

export const COMPETITOR_BOT_CHANCE = 0.15 // weekly chance a rival buys their own wave of hype bots

// paid influence operations (Ads panel)
export const BOT_ATTACK_COST = 30000
export const BOT_ATTACK_COOLDOWN = 4
export const BOT_ATTACK_BACKFIRE_CHANCE = 0.2

export const HACKER_COST = 120000
export const HACKER_COOLDOWN = 8
export const HACKER_CAUGHT_CHANCE = 0.25
export const HACKER_FINE = 200000
export const HACKER_QUALITY_DAMAGE = 8

export const JOURNALIST_COST = 60000
export const JOURNALIST_COOLDOWN = 6

// Staff levels. A level-1 hire contributes their exam score; every level after
// that adds another whole helping of it, so level 10 is worth 10x level 1.
export const MAX_STAFF_LEVEL = 10
export const STAFF_TRAINING_BASE_COST = 150000 // price of the first level, then x2, x3, ... per level
export const STAFF_TRAINING_BASE_WEEKS = 3 // plus one more week for each level already earned

export const INVESTMENT_COOLDOWN_WEEKS = 15

export const DISCOUNT_DURATION = 3
export const DISCOUNT_COST = 5000
export const DISCOUNT_GROWTH_MULT = 1.6
export const DISCOUNT_REV_MULT = 0.6

export const FREE_TRIAL_DURATION = 2
export const FREE_TRIAL_COST = 15000
export const FREE_TRIAL_GROWTH_MULT = 2.6
export const FREE_TRIAL_REV_MULT = 0

// promo signups arrive as trial users and only part of them stay once the promo ends
export const DISCOUNT_CONVERSION = 0.75 // they were already paying something, so most stay
export const FREE_TRIAL_CONVERSION = 0.5 // half of a free crowd sticks around to pay

// rival bot armies swarming you (the mirror of your own BOT_ATTACK)
export const COMPETITOR_BOT_ATTACK_CHANCE = 0.14 // weekly, once rivals see you as a threat
export const COMPETITOR_BOT_ATTACK_GRACE_WEEKS = 8 // nobody bothers swarming a nobody
export const COMPETITOR_BOT_MARKETER_DEFENSE = 0.015 // per marketer moderating your community
export const COMPETITOR_BOT_MIN_CHANCE = 0.04 // a big enough marketing team never fully stops it
export const COMPETITOR_BOT_TRACE_CHANCE = 0.25 // chance the swarm is exposed and backfires on them

// US regulations
export const REGULATION_START_WEEK = 10 // regulators leave you alone for the first few months
export const REGULATION_CHECK_CHANCE = 0.05 // weekly chance a new regulation is enacted
export const MAX_ACTIVE_REGULATIONS = 4
export const REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE = 0.01 // ambient compliance risk, even with no regulations active

// lobbying (Government panel)
export const LOBBY_COST = 80000
export const LOBBY_COOLDOWN = 6 // weeks
export const LOBBY_DURATION = 8 // weeks of reduced regulatory risk

// ------------------------------------------------------- the president calls
// If most of your staff are American, the White House takes an interest in what
// you are building. It is a caricature and a phone call: praise when you are
// winning, a warning when you are sloppy, and a shouting when you are a mess.
export const PRESIDENT_COOLDOWN = 10
export const PRESIDENT_START_WEEK = 14
// what a call does to your standing with the public
export const PRESIDENT_PRAISE_FOLLOWERS = 0.06
export const PRESIDENT_RAGE_FOLLOWERS = 0.05
// and the chance an angry one is followed by a new rule
export const PRESIDENT_RAGE_REGULATION_CHANCE = 0.35

/**
 * He does not ring on a schedule. Every call is a reaction to something you did
 * that week, and what he says is about that thing.
 */
export type PresidentReason =
  | 'sota'
  | 'ipo'
  | 'contract'
  | 'acquisition'
  | 'won'
  | 'distill'
  | 'smear'
  | 'incident'
  | 'traced'
  | 'regulation'
  | 'crisis'
  | 'pact'

export const PRESIDENT_REASONS: Record<
  PresidentReason,
  { mood: 'happy' | 'annoyed' | 'furious'; lines: string[] }
> = {
  sota: {
    mood: 'happy',
    lines: [
      'The best model on the planet and it is ours. Not theirs. Ours. Tremendous work.',
      'I am told nothing out there is better than what you just shipped. That is how it should be.',
      'Everybody is calling me about your new model. Everybody. Keep going.',
    ],
  },
  ipo: {
    mood: 'happy',
    lines: [
      'You rang the bell and the whole country watched. Beautiful. Just beautiful.',
      'A public company now. American jobs, American AI, American money. Good job.',
    ],
  },
  contract: {
    mood: 'happy',
    lines: [
      'Big American companies buying American AI. That is what I like to see.',
      'I hear you signed a serious deal. Serious money. Very good.',
    ],
  },
  acquisition: {
    mood: 'happy',
    lines: [
      'You bought them out. Just like that. I love a winner.',
      'One less competitor and all their people work for you now. Smart. Very smart.',
    ],
  },
  won: {
    mood: 'happy',
    lines: [
      'A hundred billion dollars. Nobody has ever done what you just did. Nobody.',
      'They said it could not be done here. You did it here. Congratulations.',
    ],
  },
  distill: {
    mood: 'annoyed',
    lines: [
      'They caught you training on somebody else\'s model. Watch your mouth in public about it.',
      'Copying homework, they are saying. I do not like hearing that. Clean it up.',
    ],
  },
  smear: {
    mood: 'annoyed',
    lines: [
      'I saw what you posted about them. Funny. Also stupid. Watch your mouth.',
      'Fight them with product, not with your thumbs. People are noticing.',
    ],
  },
  incident: {
    mood: 'annoyed',
    lines: [
      'Your model made the news for the wrong reason. Fix it before it becomes my problem.',
      'People are complaining about what your AI said. A lot of complaining. Sort it out.',
    ],
  },
  traced: {
    mood: 'furious',
    lines: [
      'They traced it back to you. To you. You are getting cooked out there and you earned it.',
      'You sent people after a competitor and got caught doing it. This is a disaster.',
    ],
  },
  regulation: {
    mood: 'furious',
    lines: [
      'Congress just wrote a rule with your name all over it. Well done. Truly.',
      'I had to sign something today because of you. Think about that.',
    ],
  },
  crisis: {
    mood: 'furious',
    lines: [
      'Another one. That is it. My people are looking at you right now, today.',
      'One more story like that and you will wish you had never started this company.',
    ],
  },
  pact: {
    mood: 'annoyed',
    lines: [
      'You gave your word and then tore it up. People remember that. I remember that.',
      'Breaking a deal you signed. Not a good look. Watch yourself.',
    ],
  },
}

export const PRESIDENT_MOOD_REASONS: Record<'happy' | 'annoyed' | 'furious', PresidentReason[]> = {
  happy: ['sota', 'ipo', 'contract', 'acquisition', 'won'],
  annoyed: ['distill', 'smear', 'incident', 'pact'],
  furious: ['traced', 'regulation', 'crisis'],
}

// ----------------------------------------------------------- acquisitions
// Buying a rival outright, once you are public. You pay over the odds for what
// they have, most of their users come with it, and they stop competing.
export const ACQUISITION_PREMIUM = 1.4
export const ACQUISITION_USER_KEPT = 0.7
export const ACQUISITION_FOLLOWERS_KEPT = 0.4

// ------------------------------------------------------------- enterprise
// Companies that pay properly for seats, on terms. They are worth far more per
// user than the public product, and they leave the moment you cannot hold up
// your end.
export const CONTRACT_START_WEEK = 18
export const CONTRACT_OFFER_CHANCE = 0.1
export const CONTRACT_MAX_OFFERS = 2
export const CONTRACT_OFFER_LIFE = 6 // weeks an unanswered offer stays on the table
// what a seat is worth per week, against $0.5 for a subscriber
export const CONTRACT_REV_PER_SEAT = 2.2
export const CONTRACT_MIN_WEEKS = 20
export const CONTRACT_MAX_WEEKS = 44
// the load at which an enterprise client walks over reliability
export const CONTRACT_BREACH_LOAD = 1.25
export const CONTRACT_PENALTY_WEEKS = 6
export const CONTRACT_CLIENTS = [
  'Northwind Bank',
  'Verdant Health',
  'Kestrel Logistics',
  'Halcyon Media',
  'Meridian Legal',
  'Ironclad Insurance',
  'Brightline Retail',
  'Fathom Energy',
]

// --------------------------------------------------------------- ai safety
// Risk you build up by shipping fast and cheap. It never causes anything on its
// own; it is the chance each week that something goes publicly wrong.
export const RISK_MAX = 100
// added when a model is published, by how it was built
export const RISK_PER_PUBLISH = 4
export const RISK_CHEAP_DATA = 5 // scraped data instead of licensed
export const RISK_DISTILLED = 10 // trained on somebody else's model
export const RISK_RUSHED = 8 // shipped in under this many weeks of training
export const RISK_RUSHED_WEEKS = 3
// what a safety team does about it, per week, per safety-minded head
export const RISK_DECAY_PER_WEEK = 1
export const RISK_PER_RESEARCHER = 0.35
// an audit is the deliberate way to buy it down
export const AUDIT_COST_PER_POINT = 9_000
export const AUDIT_MIN_COST = 60_000
export const AUDIT_CUT = 35 // points removed
export const AUDIT_COOLDOWN = 12
// the weekly chance of an incident, at full risk
export const INCIDENT_CHANCE_AT_MAX = 0.07
export const INCIDENT_START_WEEK = 12

// --------------------------------------------------------------- hype cycle
// How the world feels about AI this week. It multiplies what the company is
// judged to be worth and how fast strangers try the product, and it swings
// slowly between mania and an AI winter over the course of a run.
export const HYPE_START = 1
export const HYPE_MIN = 0.55
export const HYPE_MAX = 1.75
// how far the mood can move in a single week
export const HYPE_DRIFT = 0.035
// and the chance each week that something happens to shove it
export const HYPE_SHOCK_CHANCE = 0.05
export const HYPE_SHOCK_SIZE = 0.22
// growth only feels part of the mood; valuations feel all of it
export const HYPE_GROWTH_SHARE = 0.5

// ------------------------------------------------------------------- news
// The feed carries the world as well as the company. None of it changes a
// number; it is there so the game reads like somewhere that exists.
export const NEWS_KEPT = 40
export const WORLD_NEWS_CHANCE = 0.45
export const RIVAL_GOSSIP_CHANCE = 0.12

// -------------------------------------------------------------- own silicon
// Past a certain size a lab stops buying whatever the market sells and builds
// its own chips. It is a big, slow investment that makes every card you own
// worth more and every new one far cheaper.
export const CHIP_UNLOCK_VALUATION = 5_000_000_000
export const CHIP_DESIGN_WEEKS = 26 // for one hardware engineer; more is faster
export const CHIP_DESIGN_COST = 40_000_000
export const CHIP_COST_GROWTH = 1.8 // each generation costs this much more
export const CHIP_MAX_LEVEL = 4
// what a generation of your own silicon is worth
export const CHIP_POWER_PER_LEVEL = 0.3 // more users served and faster training
export const CHIP_EFFICIENCY_PER_LEVEL = 0.12 // less power drawn per card
// a fab line, and what it turns out
export const FAB_COST = 25_000_000
export const FAB_UPKEEP = 120_000
export const FAB_CARDS_PER_WEEK = 3
export const FAB_COST_PER_CARD = 1_400 // against $5,000 on the open market
export const MAX_FABS = 6

// ------------------------------------------------------------ the data chain
// Data is not a thing you buy per model any more, it is a stock you build up.
// Sources produce a few terabytes a week, the people you put on curation clean
// them faster, and a training run eats the pile.
export const DATA_PER_CARD = 6 // terabytes a training run needs, per card on it
export const CURATION_PER_HEAD = 0.16 // how much faster a curator makes the pipeline
export const CURATION_MAX = 2.6

// Ops keep the lights on: every head on reliability stretches what a card can
// serve, and softens what an incident does.
export const OPS_CAPACITY_PER_HEAD = 0.05
export const OPS_CAPACITY_MAX = 0.55
export const OPS_INCIDENT_SHIELD = 0.06

// ------------------------------------------------------------- serving load
// Published models are used, not just trained. Every active card serves this
// many people; go past that and the service starts falling over.
export const USERS_PER_CARD = 25_000
// how far over capacity you can run before anyone notices
export const OVERLOAD_GRACE = 1.05
// the worst weekly churn an overloaded service can cause, as a share of users
export const OVERLOAD_MAX_CHURN = 0.06
// and what it does to your following when it happens
export const OVERLOAD_FOLLOWER_LOSS = 0.04

// ------------------------------------------------------------------ trading
export const PACT_WEEKS = 20 // how long a non-aggression pact holds before it lapses
// Breaking your word is public. You keep the freedom to attack and lose this
// share of your following for it.
export const PACT_BREAK_FOLLOWER_LOSS = 0.15
export const LOBBY_RISK_REDUCTION = 0.4 // multiplier applied to regulation/shutdown/fine chance while lobbying is active
export const LOBBY_REPEAL_CHANCE = 0.35 // chance a lobbying push repeals a random active regulation instead

// distillation — training your model on a rival's model
export const DISTILL_RESEARCH_ID = 'distillation'
export const DISTILL_COST_BASE = 30000 // API access to start querying the teacher
export const DISTILL_COST_PER_QUALITY = 1200 // better teachers charge more per query
export const DISTILL_QUALITY_TRANSFER = 0.55 // fraction of the quality gap to the teacher you close
export const DISTILL_SPEED_MULT = 0.6 // training on synthetic outputs is faster
export const DISTILL_CAUGHT_CHANCE = 0.35 // rolled once, when the distilled model is published
export const DISTILL_TRANSPARENCY_RISK = 0.15 // extra risk while the AI Transparency Act is active
export const DISTILL_LAWYER_PROTECTION = 0.07 // per lawyer, scaled by their exam score
export const DISTILL_MIN_CAUGHT_CHANCE = 0.05 // you are never fully safe
export const DISTILL_FINE_PER_QUALITY = 4000 // fine when caught, scaled by teacher quality
export const DISTILL_FOLLOWER_LOSS = 0.12 // followers lost to the scandal
export const DISTILL_ACCUSER_FOLLOWER_GAIN = 0.05 // sympathy followers the accuser gains

// A week off you hand out yourself, rather than one somebody asks for.
export const BREAK_COOLDOWN_WEEKS = 20
export const BREAK_MORALE = 25
