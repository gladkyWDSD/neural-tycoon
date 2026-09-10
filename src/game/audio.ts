const STORAGE_KEY = 'neural-tycoon-music'

// ---------------------------------------------------------------- transport

const BPM = 82
const STEPS_PER_BAR = 8 // eighth notes
const BARS_PER_SECTION = 8
const SECTIONS = 4
const TOTAL_STEPS = STEPS_PER_BAR * BARS_PER_SECTION * SECTIONS
const SECONDS_PER_STEP = 60 / BPM / 2
const SWING = 0.14 // offbeat eighths land this fraction of a step late
const SCHEDULE_AHEAD = 0.25
const LOOKAHEAD_MS = 60
const MASTER_VOLUME = 0.16
const SFX_BUS_VOLUME = 0.5

// ------------------------------------------------------------------- score

interface Chord {
  bass: number
  pad: number[]
  arp: number[]
}

// Eight bars in A minor: Am9 | Fmaj7 | Cmaj9 | G6/9 | Am9 | Dm9 | Em7 | G7.
// Voicings stay inside one octave so the pad moves by step rather than leaping.
const PROGRESSION: Chord[] = [
  { bass: 45, pad: [60, 64, 67, 71], arp: [57, 60, 64, 67, 71] },
  { bass: 41, pad: [57, 60, 64, 69], arp: [53, 57, 60, 64, 69] },
  { bass: 48, pad: [59, 64, 67, 71], arp: [55, 59, 64, 67, 71] },
  { bass: 43, pad: [57, 62, 64, 69], arp: [55, 59, 62, 64, 69] },
  { bass: 45, pad: [60, 64, 67, 71], arp: [57, 60, 64, 67, 71] },
  { bass: 38, pad: [57, 60, 65, 69], arp: [53, 57, 60, 65, 69] },
  { bass: 40, pad: [59, 62, 67, 71], arp: [55, 59, 62, 67, 71] },
  { bass: 43, pad: [59, 62, 65, 67], arp: [55, 59, 62, 65, 67] },
]

// Which chord tone the arpeggio plays on each eighth of a bar.
const ARP_PATTERN = [0, 2, 1, 3, 2, 4, 3, 5]
const ARP_GATE_FULL = [1, 0, 1, 1, 0, 1, 1, 1]
const ARP_GATE_SPARSE = [1, 0, 0, 1, 0, 0, 1, 0]

// A pentatonic top line, one entry per bar: [step in bar, midi note].
const LEAD: [number, number][][] = [
  [[0, 76], [3, 74], [6, 72]],
  [[0, 69], [4, 72]],
  [[0, 74], [2, 76], [5, 79]],
  [[0, 76], [4, 74]],
  [[0, 72], [3, 69], [6, 67]],
  [[0, 69], [4, 72], [6, 74]],
  [[0, 76], [2, 74], [5, 72]],
  [[0, 71], [4, 69]],
]

interface Section {
  kick: number // 0 none, 0.5 downbeats only, 1 full pattern
  snare: boolean
  hat: number // level multiplier, 0 for none
  openHat: boolean
  shaker: boolean
  arp: number // level multiplier
  arpBusy: boolean
  lead: boolean
  pad: number
}

// The loop is four eight-bar sections, so it plays for a minute and a half
// before it repeats and the texture keeps changing on the way through.
const ARRANGEMENT: Section[] = [
  { kick: 0, snare: false, hat: 0.5, openHat: false, shaker: false, arp: 0.45, arpBusy: false, lead: false, pad: 1 },
  { kick: 1, snare: true, hat: 1, openHat: false, shaker: true, arp: 0.9, arpBusy: true, lead: false, pad: 0.85 },
  { kick: 1, snare: true, hat: 1, openHat: true, shaker: true, arp: 1, arpBusy: true, lead: true, pad: 0.8 },
  { kick: 0.5, snare: false, hat: 0.6, openHat: false, shaker: false, arp: 0.6, arpBusy: false, lead: true, pad: 1 },
]

// --------------------------------------------------------------------- sfx

// hits are spaced out instead of stacking, so a burst reads as a fast run
const SFX_MIN_GAP = 0.05
// a hit that would have to wait longer than this is dropped rather than lagging behind
const SFX_MAX_QUEUE_AHEAD = 0.28
// major pentatonic, two octaves: the bar's fill level picks the degree
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]

// ------------------------------------------------------------------- state

let ctx: AudioContext | null = null
let musicBus: GainNode | null = null // everything the sequencer plays
let musicFade: GainNode | null = null // the node that fades music in and out
let sfxBus: GainNode | null = null
let reverbSend: GainNode | null = null
let echoSend: GainNode | null = null
let noise: AudioBuffer | null = null
let timer: number | null = null
let nextStepTime = 0
let step = 0
let sfxNextTime = 0
let sfxSeq = 0
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

// ------------------------------------------------------------- audio graph

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise) return noise
  const buf = c.createBuffer(1, Math.floor(c.sampleRate), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

/** A decaying noise burst makes a serviceable room without shipping an impulse file. */
function impulseBuffer(c: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  const preDelay = Math.floor(c.sampleRate * 0.015)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = preDelay; i < len; i++) {
      const t = (i - preDelay) / (len - preDelay)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay)
    }
  }
  return buf
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const c = new Ctor()
  ctx = c

  // Master bus: a gentle compressor glues the parts together and stops a burst
  // of progress-bar hits from clipping over the music.
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.knee.value = 14
  comp.ratio.value = 4
  comp.attack.value = 0.004
  comp.release.value = 0.25
  comp.connect(c.destination)

  musicFade = c.createGain()
  musicFade.gain.value = 0
  musicFade.connect(comp)

  // slow filter sweep over the music so the loop breathes
  const tone = c.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2400
  tone.Q.value = 0.6
  tone.connect(musicFade)
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.045
  const lfoDepth = c.createGain()
  lfoDepth.gain.value = 700
  lfo.connect(lfoDepth)
  lfoDepth.connect(tone.frequency)
  lfo.start()

  musicBus = c.createGain()
  musicBus.gain.value = 1
  musicBus.connect(tone)

  // sfx keep their own path so the music's filter sweep never dulls them
  sfxBus = c.createGain()
  sfxBus.gain.value = SFX_BUS_VOLUME
  sfxBus.connect(comp)

  // shared plate reverb
  reverbSend = c.createGain()
  reverbSend.gain.value = 1
  const convolver = c.createConvolver()
  convolver.buffer = impulseBuffer(c, 2.2, 2.6)
  const verbTone = c.createBiquadFilter()
  verbTone.type = 'lowpass'
  verbTone.frequency.value = 3600
  const verbReturn = c.createGain()
  verbReturn.gain.value = 0.5
  reverbSend.connect(convolver)
  convolver.connect(verbTone)
  verbTone.connect(verbReturn)
  verbReturn.connect(comp)

  // shared ping-pong echo, one dotted eighth per repeat
  echoSend = c.createGain()
  echoSend.gain.value = 1
  const echoTime = SECONDS_PER_STEP * 1.5
  const left = c.createDelay(2)
  left.delayTime.value = echoTime
  const right = c.createDelay(2)
  right.delayTime.value = echoTime
  const echoTone = c.createBiquadFilter()
  echoTone.type = 'lowpass'
  echoTone.frequency.value = 2200
  const feedback = c.createGain()
  feedback.gain.value = 0.42
  const echoReturn = c.createGain()
  echoReturn.gain.value = 0.4
  const panLeft = c.createStereoPanner()
  panLeft.pan.value = -0.6
  const panRight = c.createStereoPanner()
  panRight.pan.value = 0.6
  echoSend.connect(left)
  left.connect(panLeft)
  panLeft.connect(echoReturn)
  left.connect(right)
  right.connect(panRight)
  panRight.connect(echoReturn)
  right.connect(echoTone)
  echoTone.connect(feedback)
  feedback.connect(left)
  echoReturn.connect(comp)

  return c
}

interface Routing {
  bus?: GainNode
  pan?: number
  verb?: number
  echo?: number
}

/** Route a finished voice to its bus plus whatever share of the sends it wants. */
function route(c: AudioContext, src: AudioNode, r: Routing): void {
  let node: AudioNode = src
  if (r.pan) {
    const panner = c.createStereoPanner()
    panner.pan.value = r.pan
    src.connect(panner)
    node = panner
  }
  const bus = r.bus ?? musicBus
  if (bus) node.connect(bus)
  if (r.verb && reverbSend) {
    const g = c.createGain()
    g.gain.value = r.verb
    node.connect(g)
    g.connect(reverbSend)
  }
  if (r.echo && echoSend) {
    const g = c.createGain()
    g.gain.value = r.echo
    node.connect(g)
    g.connect(echoSend)
  }
}

function burst(c: AudioContext, time: number, dur: number): AudioBufferSourceNode {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  // start at a random point so repeated hits are not bit-identical
  src.start(time, Math.random() * 0.8)
  src.stop(time + dur)
  return src
}

// ------------------------------------------------------------- instruments

/** Two detuned saws per note through a slow filter, which is what makes a pad warm. */
function playPad(c: AudioContext, time: number, notes: number[], dur: number, level: number): void {
  notes.forEach((n, i) => {
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.9
    filter.frequency.setValueAtTime(480, time)
    filter.frequency.linearRampToValueAtTime(1250, time + dur * 0.55)
    filter.frequency.linearRampToValueAtTime(620, time + dur)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.05 * level, time + 0.7)
    gain.gain.setValueAtTime(0.05 * level, time + dur - 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    filter.connect(gain)
    for (const detune of [-7, 7]) {
      const osc = c.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = midiToFreq(n)
      osc.detune.value = detune
      osc.connect(filter)
      osc.start(time)
      osc.stop(time + dur + 0.1)
    }
    // spread the voicing across the stereo field, low notes left
    route(c, gain, { pan: (i / (notes.length - 1) - 0.5) * 0.7, verb: 0.4 })
  })
}

/** Round bass: a filtered triangle with a sine an octave down under it. */
function playBass(c: AudioContext, time: number, midi: number, dur: number): void {
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, time)
  filter.frequency.exponentialRampToValueAtTime(260, time + 0.35)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.42, time + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  filter.connect(gain)

  const body = c.createOscillator()
  body.type = 'triangle'
  body.frequency.value = midiToFreq(midi)
  body.connect(filter)
  body.start(time)
  body.stop(time + dur + 0.05)

  const sub = c.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = midiToFreq(midi - 12)
  const subGain = c.createGain()
  subGain.gain.setValueAtTime(0.0001, time)
  subGain.gain.linearRampToValueAtTime(0.3, time + 0.03)
  subGain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.8)
  sub.connect(subGain)
  sub.start(time)
  sub.stop(time + dur + 0.05)

  route(c, gain, { verb: 0.05 })
  route(c, subGain, {})
}

/** Plucked arpeggio: a saw through a resonant filter that snaps shut. */
function playArp(c: AudioContext, time: number, midi: number, level: number, pan: number): void {
  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = midiToFreq(midi)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 7
  filter.frequency.setValueAtTime(3200, time)
  filter.frequency.exponentialRampToValueAtTime(520, time + 0.18)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.1 * level, time + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3)
  osc.connect(filter)
  filter.connect(gain)
  osc.start(time)
  osc.stop(time + 0.35)
  route(c, gain, { pan, verb: 0.2, echo: 0.3 })
}

/** Lead line: a triangle with a detuned sine shadow, soft on the attack. */
function playLead(c: AudioContext, time: number, midi: number, dur: number): void {
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.11, time + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  for (const [type, detune, level] of [
    ['triangle', 0, 1],
    ['sine', 9, 0.5],
  ] as const) {
    const osc = c.createOscillator()
    osc.type = type
    osc.frequency.value = midiToFreq(midi)
    osc.detune.value = detune
    const g = c.createGain()
    g.gain.value = level
    osc.connect(g)
    g.connect(gain)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  }
  route(c, gain, { pan: 0.18, verb: 0.35, echo: 0.35 })
}

function playKick(c: AudioContext, time: number, level: number): void {
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.1)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.55 * level, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28)
  osc.connect(gain)
  osc.start(time)
  osc.stop(time + 0.3)
  route(c, gain, {})

  // beater click, so the kick still reads on small speakers
  const click = burst(c, time, 0.01)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1400
  const clickGain = c.createGain()
  clickGain.gain.setValueAtTime(0.14 * level, time)
  clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02)
  click.connect(hp)
  hp.connect(clickGain)
  route(c, clickGain, {})
}

function playSnare(c: AudioContext, time: number, level: number): void {
  const src = burst(c, time, 0.2)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1900
  bp.Q.value = 0.8
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.3 * level, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
  src.connect(bp)
  bp.connect(gain)
  route(c, gain, { verb: 0.3 })

  const tone = c.createOscillator()
  tone.type = 'triangle'
  tone.frequency.setValueAtTime(210, time)
  tone.frequency.exponentialRampToValueAtTime(150, time + 0.08)
  const toneGain = c.createGain()
  toneGain.gain.setValueAtTime(0.16 * level, time)
  toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09)
  tone.connect(toneGain)
  tone.start(time)
  tone.stop(time + 0.12)
  route(c, toneGain, {})
}

function playHat(c: AudioContext, time: number, level: number, open: boolean, pan: number): void {
  const dur = open ? 0.24 : 0.05
  const src = burst(c, time, dur + 0.02)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = open ? 7000 : 8800
  const gain = c.createGain()
  gain.gain.setValueAtTime((open ? 0.07 : 0.085) * level, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  src.connect(hp)
  hp.connect(gain)
  route(c, gain, { pan, verb: open ? 0.15 : 0 })
}

function playShaker(c: AudioContext, time: number, level: number): void {
  const src = burst(c, time, 0.08)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 6200
  bp.Q.value = 1.2
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(0.05 * level, time + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07)
  src.connect(bp)
  bp.connect(gain)
  route(c, gain, { pan: -0.3 })
}

// --------------------------------------------------------------- sequencer

function scheduleStep(c: AudioContext, index: number, time: number): void {
  const bar = Math.floor(index / STEPS_PER_BAR) % BARS_PER_SECTION
  const section = ARRANGEMENT[Math.floor(index / (STEPS_PER_BAR * BARS_PER_SECTION)) % SECTIONS]
  const inBar = index % STEPS_PER_BAR
  const chord = PROGRESSION[bar]
  const barSeconds = SECONDS_PER_STEP * STEPS_PER_BAR
  const lastBar = bar === BARS_PER_SECTION - 1

  if (inBar === 0) {
    playPad(c, time, chord.pad, barSeconds, section.pad)
    playBass(c, time, chord.bass, barSeconds * 0.5)
  }
  if (inBar === 4) playBass(c, time, chord.bass + (bar % 2 === 0 ? 7 : 5), barSeconds * 0.35)

  if (section.kick > 0) {
    const full = section.kick === 1
    if (inBar === 0 || (full && inBar === 6) || (full && lastBar && inBar === 3)) playKick(c, time, 1)
  }
  if (section.snare && (inBar === 4 || (lastBar && (inBar === 5 || inBar === 7)))) {
    playSnare(c, time, inBar === 4 ? 1 : 0.7)
  }
  if (section.hat > 0 && inBar % 2 === 1) {
    const open = section.openHat && lastBar && inBar === 7
    playHat(c, time, section.hat, open, inBar % 4 === 1 ? -0.22 : 0.22)
  }
  if (section.shaker && inBar % 2 === 0) playShaker(c, time, inBar === 0 ? 1 : 0.7)

  const gate = section.arpBusy ? ARP_GATE_FULL : ARP_GATE_SPARSE
  if (gate[inBar]) {
    const note = chord.arp[ARP_PATTERN[inBar] % chord.arp.length] + 12
    playArp(c, time, note, section.arp, inBar % 4 < 2 ? -0.35 : 0.35)
  }

  if (section.lead) {
    for (const [at, note] of LEAD[bar]) {
      if (at === inBar) playLead(c, time, note, SECONDS_PER_STEP * 2.2)
    }
  }
}

function tick(): void {
  if (!ctx) return
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
    // offbeats land late, which is what turns a straight grid into a groove
    const swung = step % 2 === 1 ? nextStepTime + SECONDS_PER_STEP * SWING : nextStepTime
    scheduleStep(ctx, step, swung)
    nextStepTime += SECONDS_PER_STEP
    step = (step + 1) % TOTAL_STEPS
  }
}

/** The chord the loop is on, so sfx always land in key with the music. */
function currentChord(): Chord {
  return PROGRESSION[Math.floor(step / STEPS_PER_BAR) % BARS_PER_SECTION]
}

// --------------------------------------------------------------------- sfx

export type WorkSfx = 'research' | 'training' | 'marketing'

/**
 * A work particle (🧠 / </> / $) hitting a progress bar.
 *
 * `progress` is how full that bar is, and it picks the note off a pentatonic
 * ladder, so a bar filling up literally sounds like it is rising. `pan` places
 * the hit where it landed on screen.
 */
export function playWorkSfx(kind: WorkSfx, progress = 0, pan = 0): void {
  if (!enabled) return
  // never build a context here: sfx ride along with the music, which starts from a real click
  const c = ctx
  if (!c || !sfxBus || c.state !== 'running') return

  const now = c.currentTime
  const time = Math.max(now + 0.005, sfxNextTime)
  if (time - now > SFX_MAX_QUEUE_AHEAD) return
  sfxNextTime = time + SFX_MIN_GAP

  const t = Math.max(0, Math.min(1, progress))
  const degree = Math.min(PENTATONIC.length - 1, Math.floor(t * (PENTATONIC.length - 2)) + (sfxSeq % 2))
  sfxSeq++
  const midi = currentChord().bass + 24 + PENTATONIC[degree]
  const freq = midiToFreq(midi) * (1 + (Math.random() - 0.5) * 0.006)
  const place = Math.max(-0.8, Math.min(0.8, pan))

  if (kind === 'research') {
    // an FM bell: a sine carrier bent by a sine modulator whose depth decays
    const carrier = c.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.value = freq
    const modulator = c.createOscillator()
    modulator.type = 'sine'
    modulator.frequency.value = freq * 2.01
    const depth = c.createGain()
    depth.gain.setValueAtTime(freq * 2.4, time)
    depth.gain.exponentialRampToValueAtTime(freq * 0.04, time + 0.28)
    modulator.connect(depth)
    depth.connect(carrier.frequency)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.15, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6)
    carrier.connect(gain)
    modulator.start(time)
    modulator.stop(time + 0.65)
    carrier.start(time)
    carrier.stop(time + 0.65)
    route(c, gain, { bus: sfxBus, pan: place, verb: 0.5, echo: 0.18 })
    return
  }

  if (kind === 'training') {
    // a synth pluck: saw through a resonant filter that closes fast
    const osc = c.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 5
    filter.frequency.setValueAtTime(4600, time)
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.14)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.14, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22)
    osc.connect(filter)
    filter.connect(gain)
    osc.start(time)
    osc.stop(time + 0.25)
    route(c, gain, { bus: sfxBus, pan: place, verb: 0.15, echo: 0.28 })
    return
  }

  // money: a two-note flick with a coin-like tick in front of it
  const coinTick = burst(c, time, 0.012)
  const tickHp = c.createBiquadFilter()
  tickHp.type = 'highpass'
  tickHp.frequency.value = 5000
  const tickGain = c.createGain()
  tickGain.gain.setValueAtTime(0.05, time)
  tickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02)
  coinTick.connect(tickHp)
  tickHp.connect(tickGain)
  route(c, tickGain, { bus: sfxBus, pan: place })

  for (const [offset, semis, dur] of [
    [0, 0, 0.08],
    [0.055, 7, 0.2],
  ] as const) {
    const osc = c.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq * Math.pow(2, semis / 12)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, time + offset)
    gain.gain.linearRampToValueAtTime(0.075, time + offset + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + dur)
    osc.connect(gain)
    osc.start(time + offset)
    osc.stop(time + offset + dur + 0.02)
    route(c, gain, { bus: sfxBus, pan: place, verb: 0.2, echo: 0.22 })
  }
}

// ----------------------------------------------------------------- controls

export function isMusicEnabled(): boolean {
  return enabled
}

export function startMusic(): void {
  if (!enabled) return
  const c = ensureContext()
  if (!c || !musicFade) return
  if (c.state === 'suspended') void c.resume()
  musicFade.gain.cancelScheduledValues(c.currentTime)
  musicFade.gain.setValueAtTime(musicFade.gain.value, c.currentTime)
  musicFade.gain.linearRampToValueAtTime(MASTER_VOLUME, c.currentTime + 2)
  if (timer !== null) return
  nextStepTime = c.currentTime + 0.1
  timer = window.setInterval(tick, LOOKAHEAD_MS)
}

export function stopMusic(): void {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
  if (!ctx || !musicFade) return
  musicFade.gain.cancelScheduledValues(ctx.currentTime)
  musicFade.gain.setValueAtTime(musicFade.gain.value, ctx.currentTime)
  musicFade.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
}

export function setMusicEnabled(on: boolean): void {
  enabled = on
  savePreference(on)
  if (on) startMusic()
  else stopMusic()
}
