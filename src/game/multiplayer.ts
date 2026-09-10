import type { AttackKind, Difficulty, Staff, StaffBid, StaffCard } from './types'
import { DEFAULT_DIFFICULTY } from './constants'

// Peer-to-peer lobbies. The site is a static page with no server of its own, so
// players connect directly to each other over WebRTC and only the free public
// PeerJS broker is used, and only to introduce them. Nothing about a game is
// stored anywhere: the host holds the roster in memory for as long as the tab is
// open, and everyone simulates their own economy. The only things on the wire
// are who is in the lobby, who is ready, and how much each company is worth.

const PEERJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js'

// No 0/O or 1/I/l, so a code read aloud or copied by hand is unambiguous.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#!%@$*+?'
export const CODE_LENGTH = 10

export function makeLobbyCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  return out
}

export function isLobbyCode(code: string): boolean {
  const c = code.trim().toUpperCase()
  return c.length === CODE_LENGTH && [...c].every((ch) => CODE_ALPHABET.includes(ch))
}

/**
 * Peer ids may only contain plain characters, but the code the player copies is
 * allowed symbols, so the code is encoded rather than used directly.
 */
export function codeToPeerId(code: string): string {
  let out = 'ntyc'
  for (const ch of code.trim().toUpperCase()) {
    out += CODE_ALPHABET.indexOf(ch).toString(36).padStart(2, '0')
  }
  return out
}

export interface LobbyPlayer {
  id: string
  /** the person's nickname, shown to everyone else */
  nickname: string
  /** the company they are running */
  name: string
  ready: boolean
  isHost: boolean
  valuation: number
  customers: number
  /** what everyone else may bid for */
  staff: StaffCard[]
  won: boolean
}

export interface LobbyState {
  phase: 'idle' | 'connecting' | 'lobby' | 'playing' | 'over'
  code: string | null
  selfId: string
  isHost: boolean
  players: LobbyPlayer[]
  difficulty: Difficulty
  winner: string | null
  /** the host has halted the race for everyone */
  hostPaused: boolean
  error: string | null
}

type Message =
  | { t: 'hello'; name: string; nickname: string }
  | { t: 'roster'; players: LobbyPlayer[]; difficulty: Difficulty; phase: LobbyState['phase']; winner: string | null }
  | { t: 'ready'; ready: boolean }
  | { t: 'start'; difficulty: Difficulty }
  | { t: 'progress'; valuation: number; customers: number; staff: StaffCard[] }
  | { t: 'won' }
  | { t: 'attack'; to: string; from: string; kind: AttackKind }
  | { t: 'bid'; to: string; bid: StaffBid }
  | { t: 'bidResult'; to: string; bidId: string; matched: boolean; staff?: Staff }
  | { t: 'kicked' }
  | { t: 'pause'; paused: boolean }

interface PeerConn {
  peer: string
  open: boolean
  send(data: unknown): void
  close(): void
  on(event: string, cb: (arg?: unknown) => void): void
}

interface PeerLike {
  id: string
  destroy(): void
  connect(id: string, opts?: unknown): PeerConn
  on(event: string, cb: (arg?: unknown) => void): void
}

let peerScript: Promise<void> | null = null

function loadPeerJs(): Promise<void> {
  if (peerScript) return peerScript
  peerScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PEERJS_URL}"]`)
    if (existing) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.src = PEERJS_URL
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('could not load the connection library'))
    document.head.appendChild(el)
  })
  return peerScript
}

export class LobbySession {
  state: LobbyState = {
    phase: 'idle',
    code: null,
    selfId: '',
    isHost: false,
    players: [],
    difficulty: DEFAULT_DIFFICULTY,
    winner: null,
    hostPaused: false,
    error: null,
  }

  private peer: PeerLike | null = null
  private conns = new Map<string, PeerConn>()
  private hostConn: PeerConn | null = null
  private listeners = new Set<(s: LobbyState) => void>()
  private attackListeners = new Set<(kind: AttackKind, from: string) => void>()
  private bidListeners = new Set<(bid: StaffBid) => void>()
  private bidResultListeners = new Set<(bidId: string, matched: boolean, staff?: Staff) => void>()
  private kickListeners = new Set<() => void>()
  private pauseListeners = new Set<(paused: boolean) => void>()
  private wasKicked = false
  private selfNickname = ''

  /** Called when another player's dirty trick lands on this game. */
  onAttack(fn: (kind: AttackKind, from: string) => void): () => void {
    this.attackListeners.add(fn)
    return () => this.attackListeners.delete(fn)
  }

  /** Hand an addressed message to whoever is listening in this game. */
  private deliver(msg: Message) {
    if (msg.t === 'attack') this.receiveAttack(msg.kind, msg.from)
    else if (msg.t === 'bid') for (const fn of this.bidListeners) fn(msg.bid)
    else if (msg.t === 'bidResult') for (const fn of this.bidResultListeners) fn(msg.bidId, msg.matched, msg.staff)
  }

  private receiveAttack(kind: AttackKind, from: string) {
    for (const fn of this.attackListeners) fn(kind, from)
  }

  /** Called when someone bids for one of your employees. */
  onBid(fn: (bid: StaffBid) => void): () => void {
    this.bidListeners.add(fn)
    return () => this.bidListeners.delete(fn)
  }

  /** Called when the owner of an employee answers your offer. */
  onBidResult(fn: (bidId: string, matched: boolean, staff?: Staff) => void): () => void {
    this.bidResultListeners.add(fn)
    return () => this.bidResultListeners.delete(fn)
  }

  /** Called when the host halts or resumes the race. */
  onPause(fn: (paused: boolean) => void): () => void {
    this.pauseListeners.add(fn)
    return () => this.pauseListeners.delete(fn)
  }

  /** Host only: stop or restart the clock for everyone in the race. */
  setRacePaused(paused: boolean) {
    if (!this.state.isHost) return
    this.emit({ hostPaused: paused })
    const msg: Message = { t: 'pause', paused }
    for (const c of this.conns.values()) if (c.open) c.send(msg)
  }

  /** Called on a player the host has removed. */
  onKicked(fn: () => void): () => void {
    this.kickListeners.add(fn)
    return () => this.kickListeners.delete(fn)
  }

  /**
   * Remove someone from the session. Host only. They are told why, their
   * connection is dropped, and the roster everyone sees is rebuilt without them.
   */
  kick(playerId: string) {
    if (!this.state.isHost || playerId === 'host') return
    const conn = this.conns.get(playerId)
    // drop them from the address book first, or the roster broadcast below would
    // reach them straight after the kick and put them back in the lobby
    this.conns.delete(playerId)
    if (conn?.open) conn.send({ t: 'kicked' } satisfies Message)
    // give the message a moment to leave before the pipe closes
    setTimeout(() => conn?.close(), 500)
    this.emit({ players: this.state.players.filter((p) => p.id !== playerId) })
    this.broadcastRoster()
  }

  /** Route anything addressed to another player, going through the host if needed. */
  private route(msg: Message & { to: string }) {
    if (this.state.isHost) {
      const conn = this.conns.get(msg.to)
      if (conn?.open) conn.send(msg)
    } else {
      this.hostConn?.send(msg)
    }
  }

  sendBid(targetId: string, bid: StaffBid) {
    this.route({ t: 'bid', to: targetId, bid })
  }

  sendBidResult(targetId: string, bidId: string, matched: boolean, staff?: Staff) {
    this.route({ t: 'bidResult', to: targetId, bidId, matched, staff })
  }

  /** The id other players use to address this game. */
  get addressId(): string {
    return this.state.isHost ? 'host' : this.state.selfId
  }

  /** Aim a paid-for dirty trick at another player. The host relays it. */
  sendAttack(targetId: string, kind: AttackKind) {
    this.route({ t: 'attack', to: targetId, from: this.selfNickname, kind })
  }

  subscribe(fn: (s: LobbyState) => void): () => void {
    this.listeners.add(fn)
    fn(this.state)
    return () => this.listeners.delete(fn)
  }

  private emit(patch: Partial<LobbyState> = {}) {
    this.state = { ...this.state, ...patch }
    for (const fn of this.listeners) fn(this.state)
  }

  private fail(message: string) {
    this.emit({ error: message, phase: 'idle' })
  }

  // ------------------------------------------------------------------ hosting

  async host(nickname: string, name: string, difficulty: Difficulty): Promise<void> {
    this.selfNickname = nickname
    this.emit({ phase: 'connecting', error: null, isHost: true, difficulty })
    try {
      await loadPeerJs()
    } catch {
      this.fail('Could not load the connection library. Check your internet and try again.')
      return
    }
    const code = makeLobbyCode()
    const Ctor = (window as unknown as { Peer?: new (id: string) => PeerLike }).Peer
    if (!Ctor) {
      this.fail('Connections are unavailable in this browser.')
      return
    }
    const peer = new Ctor(codeToPeerId(code))
    this.peer = peer

    peer.on('open', () => {
      this.emit({
        phase: 'lobby',
        code,
        selfId: 'host',
        players: [{ id: 'host', nickname, name, ready: false, isHost: true, valuation: 0, customers: 0, staff: [], won: false }],
      })
    })
    peer.on('error', (err) => {
      const msg = String((err as { type?: string })?.type ?? err)
      this.fail(msg.includes('unavailable') ? 'That lobby code is taken. Try again.' : `Connection problem: ${msg}`)
    })
    peer.on('connection', (c) => {
      const conn = c as PeerConn
      conn.on('open', () => {
        this.conns.set(conn.peer, conn)
      })
      conn.on('data', (raw) => this.onHostMessage(conn, raw as Message))
      conn.on('close', () => {
        this.conns.delete(conn.peer)
        this.emit({ players: this.state.players.filter((p) => p.id !== conn.peer) })
        this.broadcastRoster()
      })
    })
  }

  private onHostMessage(conn: PeerConn, msg: Message) {
    if (msg.t === 'attack' || msg.t === 'bid' || msg.t === 'bidResult') {
      // the host is the post office: either it lands here or it goes on to its target
      if (msg.to === 'host') this.deliver(msg)
      else {
        const onward = this.conns.get(msg.to)
        if (onward?.open) onward.send(msg)
      }
      return
    }
    const players = [...this.state.players]
    const idx = players.findIndex((p) => p.id === conn.peer)
    if (msg.t === 'hello') {
      if (idx === -1) {
        players.push({
          id: conn.peer,
          nickname: msg.nickname,
          name: msg.name,
          ready: false,
          isHost: false,
          valuation: 0,
          customers: 0,
          staff: [],
          won: false,
        })
      } else {
        players[idx] = { ...players[idx], name: msg.name, nickname: msg.nickname }
      }
      this.emit({ players })
      this.broadcastRoster()
      return
    }
    if (idx === -1) return
    if (msg.t === 'ready') players[idx] = { ...players[idx], ready: msg.ready }
    else if (msg.t === 'progress') players[idx] = { ...players[idx], valuation: msg.valuation, customers: msg.customers, staff: msg.staff }
    else if (msg.t === 'won') {
      players[idx] = { ...players[idx], won: true }
      if (!this.state.winner) {
        this.emit({ players, winner: players[idx].nickname, phase: 'over' })
        this.broadcastRoster()
        return
      }
    }
    this.emit({ players })
    this.broadcastRoster()
  }

  private broadcastRoster() {
    const msg: Message = {
      t: 'roster',
      players: this.state.players,
      difficulty: this.state.difficulty,
      phase: this.state.phase,
      winner: this.state.winner,
    }
    for (const c of this.conns.values()) if (c.open) c.send(msg)
  }

  // ------------------------------------------------------------------ joining

  async join(code: string, nickname: string, name: string): Promise<void> {
    this.selfNickname = nickname
    this.emit({ phase: 'connecting', error: null, isHost: false, code: code.trim().toUpperCase() })
    try {
      await loadPeerJs()
    } catch {
      this.fail('Could not load the connection library. Check your internet and try again.')
      return
    }
    const Ctor = (window as unknown as { Peer?: new () => PeerLike }).Peer
    if (!Ctor) {
      this.fail('Connections are unavailable in this browser.')
      return
    }
    const peer = new Ctor()
    this.peer = peer
    let settled = false

    peer.on('open', () => {
      const conn = peer.connect(codeToPeerId(code), { reliable: true })
      this.hostConn = conn
      conn.on('open', () => {
        settled = true
        this.emit({ phase: 'lobby', selfId: peer.id })
        conn.send({ t: 'hello', name, nickname } satisfies Message)
      })
      conn.on('data', (raw) => {
        const msg = raw as Message
        if (this.wasKicked) return // anything still in flight is no longer ours
        if (msg.t === 'roster') {
          this.emit({
            players: msg.players,
            difficulty: msg.difficulty,
            winner: msg.winner,
            phase: msg.winner ? 'over' : this.state.phase === 'playing' ? 'playing' : msg.phase === 'playing' ? 'playing' : 'lobby',
          })
        } else if (msg.t === 'start') {
          this.emit({ difficulty: msg.difficulty, phase: 'playing' })
        } else if (msg.t === 'pause') {
          this.emit({ hostPaused: msg.paused })
          for (const fn of this.pauseListeners) fn(msg.paused)
        } else if (msg.t === 'kicked') {
          this.wasKicked = true
          for (const fn of this.kickListeners) fn()
          this.emit({ phase: 'idle', players: [], code: null, error: 'The host removed you from the game.' })
        } else if (msg.t === 'attack' || msg.t === 'bid' || msg.t === 'bidResult') {
          this.deliver(msg)
        }
      })
      conn.on('close', () => {
        if (this.wasKicked) return
        if (this.state.phase !== 'over') this.fail('The host left the game.')
      })
      conn.on('error', () => {
        if (!settled) this.fail('No lobby with that code. Check the code and try again.')
      })
    })
    peer.on('error', (err) => {
      const msg = String((err as { type?: string })?.type ?? err)
      if (!settled) {
        this.fail(
          msg.includes('peer-unavailable')
            ? 'No lobby with that code. Check the code and try again.'
            : `Connection problem: ${msg}`,
        )
      }
    })
  }

  // ------------------------------------------------------------- during a game

  setDifficulty(difficulty: Difficulty) {
    if (!this.state.isHost) return
    this.emit({ difficulty })
    this.broadcastRoster()
  }

  setReady(ready: boolean) {
    if (this.state.isHost) {
      const players = this.state.players.map((p) => (p.isHost ? { ...p, ready } : p))
      this.emit({ players })
      this.broadcastRoster()
    } else {
      this.hostConn?.send({ t: 'ready', ready } satisfies Message)
    }
  }

  start() {
    if (!this.state.isHost) return
    const msg: Message = { t: 'start', difficulty: this.state.difficulty }
    for (const c of this.conns.values()) if (c.open) c.send(msg)
    this.emit({ phase: 'playing' })
    this.broadcastRoster()
  }

  reportProgress(valuation: number, customers: number, staff: StaffCard[] = []) {
    if (this.state.isHost) {
      const players = this.state.players.map((p) => (p.isHost ? { ...p, valuation, customers, staff } : p))
      this.emit({ players })
      this.broadcastRoster()
    } else {
      this.hostConn?.send({ t: 'progress', valuation, customers, staff } satisfies Message)
    }
  }

  reportWin() {
    if (this.state.isHost) {
      const me = this.state.players.find((p) => p.isHost)
      if (!this.state.winner) this.emit({ winner: me?.nickname ?? 'The host', phase: 'over' })
      this.broadcastRoster()
    } else {
      this.hostConn?.send({ t: 'won' } satisfies Message)
    }
  }

  leave() {
    for (const c of this.conns.values()) c.close()
    this.conns.clear()
    this.hostConn?.close()
    this.hostConn = null
    this.peer?.destroy()
    this.peer = null
    this.emit({ phase: 'idle', code: null, players: [], winner: null, error: null })
  }
}
