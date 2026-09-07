import type { GameState, PendingEvent } from './types'
import { DESKS_PER_LEVEL } from './constants'

export function pickRandomEvent(state: GameState): PendingEvent | null {
  const hasModels = state.models.some((m) => m.status === 'published')
  const hasEngineer = state.staff.some((s) => s.role === 'engineer')
  const lawyerCount = state.staff.filter((s) => s.role === 'lawyer').length
  const canHire = state.staff.length < state.officeLevel * DESKS_PER_LEVEL

  const options: (() => PendingEvent)[] = [
    () => investorEvent(state.money),
    () => gpuDealEvent(),
  ]
  if (hasModels) options.push(() => lawsuitEvent(lawyerCount))
  if (hasModels) options.push(() => breachEvent())
  if (state.followers > 100) options.push(() => viralEvent(state.followers))
  if (hasEngineer) options.push(() => headhunterEvent())
  if (canHire) options.push(() => superstarEvent())
  if (hasModels) options.push(() => mediaEvent())

  const pick = options[Math.floor(Math.random() * options.length)]
  return pick()
}

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function lawsuitEvent(lawyers: number): PendingEvent {
  return {
    id: id(),
    icon: '⚖️',
    title: 'Lawsuit!',
    text: 'ClosedAI is suing you, claiming your model was trained on their outputs!',
    choices: [
      {
        label: lawyers > 0 ? `Fight it in court (${lawyers} lawyer${lawyers > 1 ? 's' : ''})` : 'Fight it in court (no lawyers!)',
        hint: lawyers > 0 ? 'Your legal team is ready.' : 'Risky — you have no lawyers.',
        news: lawyers > 0 ? 'You won the lawsuit! Only legal fees to pay.' : 'You lost the case and paid damages.',
        effects: { lawsuit: true },
      },
      {
        label: 'Settle quietly ($100k)',
        hint: 'No customer loss.',
        news: 'You settled the lawsuit out of court.',
        effects: { money: -100000 },
      },
    ],
  }
}

function breachEvent(): PendingEvent {
  return {
    id: id(),
    icon: '🦠',
    title: 'Data breach!',
    text: 'Hackers leaked some of your training data. Customers are worried.',
    choices: [
      {
        label: 'Invest in security ($80k)',
        hint: 'Stop the bleeding.',
        news: 'You patched the breach and reassured customers.',
        effects: { money: -80000 },
      },
      {
        label: 'Ignore it',
        hint: 'Customers may leave.',
        news: 'Customers left after the breach was ignored.',
        effects: { customersPct: -8 },
      },
    ],
  }
}

function viralEvent(followers: number): PendingEvent {
  const big = Math.round(2000 + followers * 0.1)
  return {
    id: id(),
    icon: '📈',
    title: 'Going viral!',
    text: 'One of your posts is exploding on Twitter!',
    choices: [
      {
        label: `Ride the wave (+${big.toLocaleString()} followers)`,
        hint: 'Post more content.',
        news: `Your viral moment gained ${big.toLocaleString()} followers!`,
        effects: { followers: big },
      },
      {
        label: 'Stay humble',
        hint: 'Small boost.',
        news: 'You gained a modest number of followers.',
        effects: { followers: 500 },
      },
    ],
  }
}

function headhunterEvent(): PendingEvent {
  return {
    id: id(),
    icon: '💼',
    title: 'Headhunter!',
    text: 'Gargle Brain is trying to poach your best engineer with a huge offer.',
    choices: [
      {
        label: 'Match the offer ($60k)',
        hint: 'Keep your engineer.',
        news: 'You matched the offer and kept your engineer.',
        effects: { money: -60000 },
      },
      {
        label: 'Let them go',
        hint: 'You lose your best engineer.',
        news: 'Your best engineer left for Gargle Brain.',
        effects: { loseBestEngineer: true },
      },
    ],
  }
}

function investorEvent(money: number): PendingEvent {
  const offer = Math.max(1000000, Math.round(money * 0.6))
  return {
    id: id(),
    icon: '💰',
    title: 'Investor meeting',
    text: `A VC fund offers $${offer.toLocaleString()} for 20% of your company.`,
    choices: [
      {
        label: `Take the money (+$${offer.toLocaleString()})`,
        hint: 'Instant cash injection.',
        news: `You took $${offer.toLocaleString()} in funding!`,
        effects: { money: offer },
      },
      {
        label: 'Decline',
        hint: 'You keep full ownership.',
        news: 'You declined the offer — investors are impressed.',
        effects: { followers: 500 },
      },
    ],
  }
}

function gpuDealEvent(): PendingEvent {
  return {
    id: id(),
    icon: '🖥️',
    title: 'GPU deal',
    text: 'A supplier offers you 10 GPU cards at 40% off!',
    choices: [
      {
        label: 'Buy 10 GPUs ($30k)',
        hint: 'Great price.',
        news: 'You bought 10 discounted GPUs!',
        effects: { money: -30000, gpus: 10 },
      },
      {
        label: 'Pass',
        hint: 'Maybe later.',
        news: 'You passed on the GPU deal.',
        effects: {},
      },
    ],
  }
}

function superstarEvent(): PendingEvent {
  return {
    id: id(),
    icon: '🌟',
    title: 'Superstar applicant',
    text: 'A legendary researcher (top 0.1%) wants to join your company!',
    choices: [
      {
        label: 'Hire them',
        hint: 'Top talent, top salary.',
        news: 'The legendary researcher joined your team!',
        effects: { hireRole: 'researcher' },
      },
      {
        label: 'Decline',
        hint: 'Too expensive.',
        news: 'You passed on the superstar.',
        effects: {},
      },
    ],
  }
}

interface InterviewQuestion {
  q: string
  answers: { text: string; correct: boolean }[]
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    q: 'Tech Weekly asks: "What does LLM stand for?"',
    answers: [
      { text: 'Large Language Model', correct: true },
      { text: 'Low Latency Machine', correct: false },
      { text: 'Long Linear Matrix', correct: false },
    ],
  },
  {
    q: 'Tech Weekly asks: "What powers modern AI image generators?"',
    answers: [
      { text: 'Diffusion models', correct: true },
      { text: 'Ray tracing', correct: false },
      { text: 'Data compression', correct: false },
    ],
  },
  {
    q: 'Tech Weekly asks: "What is the biggest cost when training a huge model?"',
    answers: [
      { text: 'Compute / GPUs', correct: true },
      { text: 'Office snacks', correct: false },
      { text: 'Marketing', correct: false },
    ],
  },
  {
    q: 'Tech Weekly asks: "What does AGI mean?"',
    answers: [
      { text: 'Artificial General Intelligence', correct: true },
      { text: 'Awesome Gaming Interface', correct: false },
      { text: 'Advanced Graphics Integration', correct: false },
    ],
  },
]

function mediaEvent(): PendingEvent {
  const q = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)]
  return {
    id: id(),
    icon: '🎤',
    title: 'Media interview',
    text: q.q,
    choices: q.answers.map((a) => ({
      label: a.text,
      hint: a.correct ? undefined : 'Answer carefully...',
      news: a.correct
        ? 'Great answer! Your reputation soared.'
        : 'That was the wrong answer — the internet noticed.',
      effects: a.correct
        ? { followers: 4000, customersPct: 5 }
        : { followers: 200 },
    })),
  }
}
