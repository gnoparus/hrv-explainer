import { fft, nextPow2 } from './fft.js'
import { naturalCubicSpline } from './spline.js'

export interface PsdResult {
  freqs: number[]
  power: number[] // ms^2/Hz
}

// times: cumulative beat timestamps in seconds. rrMs: RR interval ending at each timestamp.
// Resamples to an even grid at fs Hz (cubic spline, matching clinical HRV practice) before FFT,
// since raw R-R samples are beat-spaced, not time-spaced.
export function computePsd(times: number[], rrMs: number[], fs = 4): PsdResult {
  const n = times.length
  if (n < 8) return { freqs: [], power: [] }

  const spline = naturalCubicSpline(times, rrMs)
  const t0 = times[0]
  const t1 = times[n - 1]
  const gridN = Math.floor((t1 - t0) * fs) + 1
  const values = new Float64Array(gridN)
  for (let k = 0; k < gridN; k++) values[k] = spline(t0 + k / fs)

  const mean = values.reduce((a, b) => a + b, 0) / gridN
  let windowSumSq = 0
  const windowed = new Float64Array(gridN)
  for (let k = 0; k < gridN; k++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * k) / (gridN - 1)))
    windowed[k] = (values[k] - mean) * w
    windowSumSq += w * w
  }

  const nPad = nextPow2(gridN)
  const re = new Float64Array(nPad)
  const im = new Float64Array(nPad)
  re.set(windowed)
  fft(re, im)

  const half = nPad / 2
  const freqs: number[] = new Array(half)
  const power: number[] = new Array(half)
  // Periodogram scaling: normalize by fs * sum(window^2), double for one-sided spectrum.
  const scale = 2 / (fs * windowSumSq)
  for (let k = 0; k < half; k++) {
    freqs[k] = (k * fs) / nPad
    power[k] = scale * (re[k] * re[k] + im[k] * im[k])
  }
  return { freqs, power }
}

// Trapezoidal integration of power over [loHz, hiHz).
export function bandPower(freqs: number[], power: number[], loHz: number, hiHz: number): number {
  let sum = 0
  for (let k = 1; k < freqs.length; k++) {
    if (freqs[k] < loHz || freqs[k] > hiHz) continue
    const df = freqs[k] - freqs[k - 1]
    sum += ((power[k] + power[k - 1]) / 2) * df
  }
  return sum
}

export const LF_BAND: [number, number] = [0.04, 0.15]
export const HF_BAND: [number, number] = [0.15, 0.4]
