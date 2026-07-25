// Two-oscillator R-R interval model:
//   RR(t) = baseline + A_HF(f_breath) * sin(2*pi*f_breath*t)   -- respiratory sinus arrhythmia
//         + A_LF               * sin(lfPhase(t))               -- baroreflex, wanders ~0.04-0.15 Hz
//         + noise
//
// A_HF is a resonance curve peaking at f_breath = 0.1 Hz (6 breaths/min), NOT a constant.
// For a sinusoid sampled at beat spacing, successive-difference RMS scales with amplitude *
// frequency, so a constant HF amplitude would make RMSSD fall as breathing slows -- backwards
// from real paced-breathing physiology, where slow ~6/min breathing produces the largest RSA
// and the highest RMSSD. The resonance curve is what makes the direction correct. Do not
// "simplify" this back to a constant.
//
// LF is a band-limited Ornstein-Uhlenbeck process, not a fixed 0.1 Hz tone (issue #3): a fixed
// LF tone sits right next to the HF oscillator's frequency when breathing 6-12/min (both ~0.1 Hz),
// and two deterministic sinusoids that close in frequency beat against each other, making RMSSD
// wobble non-monotonically instead of rising cleanly into the resonance zone. Letting the LF
// frequency wander stochastically around 0.1 Hz removes that deterministic coherence.

import { LF_BAND } from './psd.js'

export interface RRParams {
  baselineRRms: number
  breathingRateBrpm: number // breaths per minute
  vagalTone: number // 0..1
}

const A_HF_FLOOR_MS = 8
const A_HF_PEAK_MS = 60
const F_RES_HZ = 0.1 // resonance frequency = 6 breaths/min
const SIGMA_HF_HZ = 0.095 // narrow enough that HF amplitude alone (independent of any LF coupling)
// reliably gives 6bpm>15bpm RMSSD -- widening this re-exposes issue #3: at the old 0.12 the HF
// resonance curve was too gentle to give the correct direction on its own, and direction only held
// because the old fixed-frequency LF tone happened to add constructively with HF at 6bpm -- the
// same coincidence that caused the wobble. This is a real tradeoff, not free: narrowing the curve
// to guarantee direction also makes HF amplitude thinner at fast breathing (~7ms at 20bpm vs ~11ms
// before), so the "HF power drains into LF as you slow down" demo is a bit less dramatic at the
// fast end than pre-fix. Don't widen this back without re-deriving the sigma bound (see
// scratchpad sigma sweep in the issue #3 PR description for the derivation).
const A_LF_BASE_MS = 25
const NOISE_SIGMA_MS = 4

// LF frequency OU process: mean-reverts to F_LF_MEAN_HZ, clamped to LF_BAND (psd.ts).
const F_LF_MEAN_HZ = 0.1
const F_LF_THETA = 0.05 // mean-reversion rate, 1/s (~20s time constant)
const F_LF_SIGMA_HZ = 0.0063 // stationary stddev = sigma/sqrt(2*theta) ~= 0.02 Hz

export function hfAmplitudeMs(breathingRateBrpm: number, vagalTone: number): number {
  const fHz = breathingRateBrpm / 60
  const gauss = Math.exp(-((fHz - F_RES_HZ) ** 2) / (2 * SIGMA_HF_HZ ** 2))
  return vagalTone * (A_HF_FLOOR_MS + (A_HF_PEAK_MS - A_HF_FLOOR_MS) * gauss)
}

export function lfAmplitudeMs(vagalTone: number): number {
  return A_LF_BASE_MS * (0.5 + 0.5 * vagalTone)
}

// Seeded mulberry32 PRNG so the self-check is reproducible; live UI can pass Math.random.
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export class RRGenerator {
  private t = 0 // seconds, cumulative
  private rng: () => number
  private lfFreqHz = F_LF_MEAN_HZ
  private lfPhase = 0 // radians, integrated from lfFreqHz since it varies over time
  private lastDt = 0.8 // seconds; seeds the first OU step before a real beat interval exists

  constructor(rng: () => number = Math.random) {
    this.rng = rng
  }

  get elapsedSeconds(): number {
    return this.t
  }

  nextBeat(params: RRParams): { t: number; rrMs: number } {
    const dt = this.lastDt
    this.lfFreqHz += F_LF_THETA * (F_LF_MEAN_HZ - this.lfFreqHz) * dt + F_LF_SIGMA_HZ * Math.sqrt(dt) * gaussian(this.rng)
    this.lfFreqHz = Math.min(LF_BAND[1], Math.max(LF_BAND[0], this.lfFreqHz))
    this.lfPhase += 2 * Math.PI * this.lfFreqHz * dt

    const fHz = params.breathingRateBrpm / 60
    const hf = hfAmplitudeMs(params.breathingRateBrpm, params.vagalTone) * Math.sin(2 * Math.PI * fHz * this.t)
    const lf = lfAmplitudeMs(params.vagalTone) * Math.sin(this.lfPhase)
    const noise = gaussian(this.rng) * NOISE_SIGMA_MS
    const rrMs = params.baselineRRms + hf + lf + noise
    this.t += rrMs / 1000
    this.lastDt = rrMs / 1000
    return { t: this.t, rrMs }
  }
}
