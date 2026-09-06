import type { GameState } from './types'
import type { Action } from './state'
import { globalWeek } from './state'

export interface CommandResult {
  action?: Action
  response: string
}

function numberArg(args: string[]): number | null {
  if (args.length === 0) return null
  const n = Number(args[0].replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function parseCommand(input: string, state: GameState): CommandResult {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) {
    return { response: 'Commands start with / — type /help for the list.' }
  }

  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/)
  const command = cmd.toLowerCase()
  const arg = numberArg(rest)

  switch (command) {
    case 'help':
      return {
        response: [
          'Commands:',
          '  /setweek N    - jump to week N (simulates all weeks)',
          '  /setmoney N   - set money to $N',
          '  /addmoney N   - add $N',
          '  /gpu N        - set owned GPU cards',
          '  /datacenter N - set built datacenters',
          '  /finish       - complete all research & training now',
          '  /researchall  - unlock all research',
          '  /week         - show current week',
          '  /money        - show current money',
        ].join('\n'),
      }
    case 'setweek': {
      if (arg === null) return { response: 'Usage: /setweek N' }
      return {
        action: { type: 'SET_WEEK', week: arg },
        response: `Jumping to week ${arg}...`,
      }
    }
    case 'setmoney': {
      if (arg === null) return { response: 'Usage: /setmoney N' }
      return {
        action: { type: 'SET_MONEY', money: arg },
        response: `Money set to $${arg.toLocaleString()}.`,
      }
    }
    case 'addmoney': {
      if (arg === null) return { response: 'Usage: /addmoney N' }
      return {
        action: { type: 'ADD_MONEY', amount: arg },
        response: `Added $${arg.toLocaleString()}.`,
      }
    }
    case 'finish':
      return { action: { type: 'FINISH_ALL' }, response: 'Completed all research & training.' }
    case 'researchall':
      return { action: { type: 'RESEARCH_ALL' }, response: 'All research unlocked.' }
    case 'gpu': {
      if (arg === null) return { response: 'Usage: /gpu N' }
      return { action: { type: 'SET_GPU', count: arg }, response: `GPU cards set to ${arg}.` }
    }
    case 'datacenter': {
      if (arg === null) return { response: 'Usage: /datacenter N' }
      return { action: { type: 'SET_DATACENTERS', count: arg }, response: `Datacenters set to ${arg}.` }
    }
    case 'week':
      return { response: `Current week: ${globalWeek(state)} (${state.date.year}, Wk ${state.date.week})` }
    case 'money':
      return { response: `Money: $${Math.round(state.money).toLocaleString()}` }
    default:
      return { response: `Unknown command "/${command}". Type /help for the list.` }
  }
}
