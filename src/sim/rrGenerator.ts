// Two-oscillator R-R interval model:
//   RR(t) = baseline + A_HF(f_breath) * sin(2*pi*f_breath*t)   -- respiratory sinus arrhythmia
//         + A_LF               * sin(2*pi*0.1*t)               -- baroreflex, ~0.1 Hz
//         + noise
//
// A_HF is a resonance curve peaking at f_breath = 0.1 Hz (6 breaths/min), NOT a constant.
// For a sinusoid sampled at beat spacing, successive-difference RMS scales with amplitude *
// frequency, so a constant HF amplitude would make RMSSD fall as breathing slows -- backwards
// from real paced-breathing physiology, where slow ~6/min breathing produces the largest RSA
// and the highest RMSSD. The resonance curve is what makes the direction correct. Do not
// "simplify" this back to a constant.

export interface RRParams {
  baselineRRms: number
  breathingRateBrpm: number // breaths per minute
  vagalTone: number // 0..1
}

const A_HF_FLOOR_MS = 8
const A_HF_PEAK_MS = 60
const F_RES_HZ = 0.1 // resonance frequency = 6 breaths/min
const SIGMA_HF_HZ = 0.12 // wide enough that HF amplitude stays visible across most of the slider range, not just a narrow spike at 6/min
const A_LF_BASE_MS = 25
const F_LF_HZ = 0.1
const NOISE_SIGMA_MS = 4

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

  constructor(rng: () => number = Math.random) {
    this.rng = rng
  }

  get elapsedSeconds(): number {
    return this.t
  }

  nextBeat(params: RRParams): { t: number; rrMs: number } {
    const fHz = params.breathingRateBrpm / 60
    const hf = hfAmplitudeMs(params.breathingRateBrpm, params.vagalTone) * Math.sin(2 * Math.PI * fHz * this.t)
    const lf = lfAmplitudeMs(params.vagalTone) * Math.sin(2 * Math.PI * F_LF_HZ * this.t)
    const noise = gaussian(this.rng) * NOISE_SIGMA_MS
    const rrMs = params.baselineRRms + hf + lf + noise
    this.t += rrMs / 1000
    return { t: this.t, rrMs }
  }
}
