'use client'

// All sounds synthesised with Web Audio API — no asset files needed.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export async function unlockAudio() {
  if (typeof window === 'undefined') return

  const ac = getCtx()
  if (ac.state === 'suspended') {
    await ac.resume().catch(() => undefined)
  }

  const t = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.03)
}

function gain(ac: AudioContext, value: number, at: number, decayTo = 0, decayAt?: number): GainNode {
  const g = ac.createGain()
  g.gain.setValueAtTime(value, at)
  if (decayAt !== undefined) g.gain.exponentialRampToValueAtTime(Math.max(decayTo, 0.001), decayAt)
  return g
}

// ─── Dice roll ────────────────────────────────────────────────────────────────
export function playDiceRoll() {
  const ac = getCtx()
  const t = ac.currentTime

  // White noise burst
  const bufLen = ac.sampleRate * 0.4
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const src = ac.createBufferSource()
  src.buffer = buf

  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(800, t)
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.4)
  filter.Q.value = 0.5

  const g = gain(ac, 0.4, t, 0, t + 0.4)
  src.connect(filter).connect(g).connect(ac.destination)
  src.start(t)
  src.stop(t + 0.4)

  // 3 sharp clicks to simulate dice tumbling
  for (let i = 0; i < 3; i++) {
    const at = t + i * 0.12
    const osc = ac.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 300 + i * 80
    const cg = gain(ac, 0.3, at, 0, at + 0.06)
    osc.connect(cg).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 0.06)
  }
}

// ─── Token move ───────────────────────────────────────────────────────────────
export function playTokenMove() {
  const ac = getCtx()
  const t = ac.currentTime

  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, t)
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.08)

  const g = gain(ac, 0.25, t, 0, t + 0.12)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.12)
}

// ─── Token capture ────────────────────────────────────────────────────────────
export function playTokenCapture() {
  const ac = getCtx()
  const t = ac.currentTime

  // Impact thud
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.3)

  const g = gain(ac, 0.6, t, 0, t + 0.35)

  const dist = ac.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1
    curve[i] = ((Math.PI + 200) * x) / (Math.PI + 200 * Math.abs(x))
  }
  dist.curve = curve

  osc.connect(dist).connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.35)
}

// ─── Token reaches home column ────────────────────────────────────────────────
export function playTokenHome() {
  const ac = getCtx()
  const t = ac.currentTime
  const notes = [523, 659, 784]
  notes.forEach((freq, i) => {
    const at = t + i * 0.1
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = gain(ac, 0.3, at, 0, at + 0.15)
    osc.connect(g).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 0.15)
  })
}

// ─── Triple six penalty ───────────────────────────────────────────────────────
export function playTripleSix() {
  const ac = getCtx()
  const t = ac.currentTime
  const notes = [880, 700, 500, 300]
  notes.forEach((freq, i) => {
    const at = t + i * 0.12
    const osc = ac.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq
    const g = gain(ac, 0.35, at, 0, at + 0.12)
    osc.connect(g).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 0.12)
  })
}

// ─── Win fanfare ──────────────────────────────────────────────────────────────
export function playWin() {
  const ac = getCtx()
  const t = ac.currentTime
  const melody = [523, 659, 784, 1047, 784, 1047, 1319]
  melody.forEach((freq, i) => {
    const at = t + i * 0.15
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = gain(ac, 0.4, at, 0, at + 0.18)
    osc.connect(g).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 0.18)
  })
}

// ─── Emoji sounds ─────────────────────────────────────────────────────────────
// Each emoji gets a distinct short sound.
const EMOJI_SOUNDS: Record<string, () => void> = {}

function makeEmojiSound(freqs: number[], type: OscillatorType, vol = 0.3, dur = 0.12) {
  return () => {
    const ac = getCtx()
    const t = ac.currentTime
    freqs.forEach((freq, i) => {
      const at = t + i * dur
      const osc = ac.createOscillator()
      osc.type = type
      osc.frequency.value = freq
      const g = gain(ac, vol, at, 0, at + dur)
      osc.connect(g).connect(ac.destination)
      osc.start(at)
      osc.stop(at + dur)
    })
  }
}

// 😂 laughing — ascending triplet
EMOJI_SOUNDS['😂'] = makeEmojiSound([400, 500, 600], 'sine', 0.3)
// 🤣 rolling on floor — rapid staccato
EMOJI_SOUNDS['🤣'] = makeEmojiSound([350, 450, 350, 450], 'sine', 0.3, 0.08)
// 😭 crying — descending minor
EMOJI_SOUNDS['😭'] = makeEmojiSound([500, 400, 300], 'triangle', 0.25)
// 🔥 fire — noise crackle (reuse capture-ish)
EMOJI_SOUNDS['🔥'] = () => {
  const ac = getCtx()
  const t = ac.currentTime
  const bufLen = ac.sampleRate * 0.2
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const f = ac.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 2000
  const g = gain(ac, 0.25, t, 0, t + 0.2)
  src.connect(f).connect(g).connect(ac.destination)
  src.start(t)
  src.stop(t + 0.2)
}
// 💀 skull — spooky descend
EMOJI_SOUNDS['💀'] = makeEmojiSound([220, 196, 165, 147], 'sawtooth', 0.2)
// 👑 crown — royal fanfare snippet
EMOJI_SOUNDS['👑'] = makeEmojiSound([523, 659, 784, 1047], 'triangle', 0.3)
// 🎯 target hit — sharp ping
EMOJI_SOUNDS['🎯'] = makeEmojiSound([1200, 900], 'sine', 0.3, 0.08)
// 💪 flex — power chord
EMOJI_SOUNDS['💪'] = makeEmojiSound([261, 330, 392], 'square', 0.2, 0.1)

export function playEmojiSound(emoji: string) {
  const fn = EMOJI_SOUNDS[emoji]
  if (fn) fn()
}

// ─── Tease (auto-fires on capture) ───────────────────────────────────────────
export function playTease() {
  // Ha-ha descending laugh
  playEmojiSound('😂')
}
