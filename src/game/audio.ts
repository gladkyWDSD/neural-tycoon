const STORAGE_KEY = 'neural-tycoon-music'

const BPM = 84
const STEPS_PER_BAR = 8
const BARS = 4
const TOTAL_STEPS = STEPS_PER_BAR * BARS
const SECONDS_PER_STEP = 60 / BPM / 2
const SCHEDULE_AHEAD = 0.25
const LOOKAHEAD_MS = 60
const MASTER_VOLUME = 0.18

// Am7 → Fmaj7 → Cmaj7 → G7, one bar each (MIDI note numbers)
const CHORDS: { pad: number[]; bass: number }[] = [
  { pad: [57, 60, 64, 67], bass: 45 },
  { pad: [53, 57, 60, 64], bass: 41 },
  { pad: [48, 52, 55, 59], bass: 36 },
  { pad: [55, 59, 62, 65], bass: 43 },
]

const ARP_STEPS = [0, 2, 3, 5, 6]

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let timer: number | null = null
let nextStepTime = 0
let step = 0
let enabled = loadPreference()

function loadPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function savePreference(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // storage unavailable — ignore
  }
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = 0
  // gentle lowpass keeps the square waves from sounding harsh over long sessions
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2600
  master.connect(filter)
  filter.connect(ctx.destination)
  return ctx
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise) return noise
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.1), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

function playBass(c: AudioContext, out: GainNode, time: number, midi: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.value = midiToFreq(midi)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.5, time + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55)
  osc.connect(gain)
  gain.connect(out)
  osc.start(time)
  osc.stop(time + 0.6)
}

function playPad(c: AudioContext, out: GainNode, time: number, notes: number[], dur: number): void {
  for (const n of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(n)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.09, time + 0.35)
    gain.gain.setValueAtTime(0.09, time + dur - 0.4)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    osc.connect(gain)
    gain.connect(out)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  }
}

function playArp(c: AudioContext, out: GainNode, time: number, midi: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.value = midiToFreq(midi)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.12, time + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22)
  osc.connect(gain)
  gain.connect(out)
  osc.start(time)
  osc.stop(time + 0.25)
}

function playKick(c: AudioContext, out: GainNode, time: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, time)
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12)
  gain.gain.setValueAtTime(0.5, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18)
  osc.connect(gain)
  gain.connect(out)
  osc.start(time)
  osc.stop(time + 0.2)
}

function playHat(c: AudioContext, out: GainNode, time: number): void {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.08, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
  src.connect(hp)
  hp.connect(gain)
  gain.connect(out)
  src.start(time)
  src.stop(time + 0.06)
}

function scheduleStep(c: AudioContext, out: GainNode, index: number, time: number): void {
  const bar = Math.floor(index / STEPS_PER_BAR) % BARS
  const inBar = index % STEPS_PER_BAR
  const chord = CHORDS[bar]

  if (inBar === 0) {
    playPad(c, out, time, chord.pad, SECONDS_PER_STEP * STEPS_PER_BAR)
  }
  if (inBar === 0 || inBar === 4) {
    playBass(c, out, time, chord.bass)
    playKick(c, out, time)
  }
  if (inBar % 2 === 1) {
    playHat(c, out, time)
  }
  const arpIndex = ARP_STEPS.indexOf(inBar)
  if (arpIndex >= 0) {
    playArp(c, out, time, chord.pad[arpIndex % chord.pad.length] + 12)
  }
}

function tick(): void {
  if (!ctx || !master) return
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(ctx, master, step, nextStepTime)
    nextStepTime += SECONDS_PER_STEP
    step = (step + 1) % TOTAL_STEPS
  }
}

export function isMusicEnabled(): boolean {
  return enabled
}

export function startMusic(): void {
  if (!enabled) return
  const c = ensureContext()
  if (!c || !master) return
  if (c.state === 'suspended') void c.resume()
  master.gain.cancelScheduledValues(c.currentTime)
  master.gain.setValueAtTime(master.gain.value, c.currentTime)
  master.gain.linearRampToValueAtTime(MASTER_VOLUME, c.currentTime + 1.5)
  if (timer !== null) return
  nextStepTime = c.currentTime + 0.1
  timer = window.setInterval(tick, LOOKAHEAD_MS)
}

export function stopMusic(): void {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
  if (!ctx || !master) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
}

export function setMusicEnabled(on: boolean): void {
  enabled = on
  savePreference(on)
  if (on) startMusic()
  else stopMusic()
}
