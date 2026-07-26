import { nextPow2 } from './fft.js'
import { resampleToGrid, freqGridFor, type PsdResult } from './psd.js'

export interface PsdArResult extends PsdResult {
  order: number
}

interface BurgStep {
  order: number
  coeffs: number[] // AR coefficients d[1..order], 0-indexed here as coeffs[0..order-1]
  xms: number // residual prediction-error variance at this order
}

// Burg's method (maximum-entropy AR spectral estimation), ported from Numerical Recipes in C
// sec. 13.7 ("memcof"/"evlmem") rather than derived from scratch -- Burg estimates AR
// coefficients directly from forward/backward prediction-error minimization (not
// autocorrelation-based Levinson-Durbin), which is why it resolves spectral peaks more sharply
// than FFT on short records. Using the reference's exact recursion and coefficient sign
// convention avoids the classic Burg implementation bug where a flipped sign still produces a
// plausible-looking spectrum with the peak in the wrong place (caught by the AR(2) selfcheck
// below, which asserts both peak frequency AND that a true low-order process selects a low order).
function burg(data: Float64Array, maxOrder: number): { steps: BurgStep[]; best: BurgStep | null } {
  const n = data.length
  let p = 0
  for (let i = 0; i < n; i++) p += data[i] * data[i]
  let xms = p / n

  let wk1 = new Float64Array(n)
  let wk2 = new Float64Array(n)
  wk1[0] = data[0]
  wk2[n - 2] = data[n - 1]
  for (let j = 1; j < n - 1; j++) {
    wk1[j] = data[j]
    wk2[j - 1] = data[j]
  }

  let d: number[] = []
  const steps: BurgStep[] = []
  let best: BurgStep | null = null
  let bestFpe = Infinity

  for (let k = 1; k <= maxOrder; k++) {
    const lim = n - k
    let num = 0
    let denom = 0
    for (let j = 0; j < lim; j++) {
      num += wk1[j] * wk2[j]
      denom += wk1[j] * wk1[j] + wk2[j] * wk2[j]
    }
    if (denom === 0) break
    const dk = (2 * num) / denom

    const newD = new Array<number>(k)
    for (let i = 1; i <= k - 1; i++) newD[i - 1] = d[i - 1] - dk * d[k - i - 1]
    newD[k - 1] = dk
    d = newD
    xms *= 1 - dk * dk

    const step: BurgStep = { order: k, coeffs: d.slice(), xms }
    steps.push(step)

    // FPE (Final Prediction Error, Burg 1975 / Ulrych-Bishop): trades residual error against
    // overfitting so a short HRV window (a few hundred samples, at most two real spectral
    // peaks) picks a low order instead of always maxing out.
    if (k >= 2) {
      const fpe = (xms * (n + k + 1)) / (n - k - 1)
      if (fpe < bestFpe) {
        bestFpe = fpe
        best = step
      }
    }

    if (k === maxOrder || n - k - 1 <= 0) break

    const newWk1 = new Float64Array(n)
    const newWk2 = new Float64Array(n)
    for (let j = 0; j < n - k - 1; j++) {
      newWk1[j] = wk1[j] - dk * wk2[j]
      newWk2[j] = wk2[j + 1] - dk * wk1[j + 1]
    }
    wk1 = newWk1
    wk2 = newWk2
  }

  return { steps, best }
}

// Pure Burg/AR PSD evaluator: takes an already-uniform, already-mean-removed series and the
// target frequency grid, returns the AR spectral density on that grid. Split out from
// computePsdAr so the AR(2)-process selfcheck can exercise the estimator core directly, without
// spline-resampling noise in the way.
export function burgPsd(centered: Float64Array, fs: number, freqs: number[]): PsdArResult {
  const n = centered.length
  if (n < 9) return { freqs: [], power: [], order: 0 }

  const maxOrder = Math.max(2, Math.min(20, Math.floor(n / 3)))
  const { best } = burg(centered, maxOrder)
  if (!best) return { freqs: [], power: [], order: 0 }

  const { coeffs, xms, order } = best
  const dt = 1 / fs
  // AR spectral density: S(f) = xms*dt / |1 - sum_i coeffs[i]*e^{-j*2*pi*f*i*dt}|^2 -- same
  // formula and sign convention as Numerical Recipes' evlmem, using the coeffs from burg() above.
  // This is the two-sided density; freqs only covers the nonnegative half, so double it here
  // to match computePsd's one-sided convention (see its own "double for one-sided spectrum"
  // comment) -- otherwise every AR band-power number is ~half the FFT one and the two methods
  // aren't comparable in the same units, which defeats the point of showing them side by side.
  const power = freqs.map((f) => {
    const theta = 2 * Math.PI * f * dt
    let sumr = 1
    let sumi = 0
    for (let i = 1; i <= order; i++) {
      sumr -= coeffs[i - 1] * Math.cos(i * theta)
      sumi -= coeffs[i - 1] * Math.sin(i * theta)
    }
    return (2 * xms * dt) / (sumr * sumr + sumi * sumi)
  })

  return { freqs, power, order }
}

// times: cumulative beat timestamps in seconds. rrMs: RR interval ending at each timestamp.
// Resamples to the same even grid computePsd uses (see resampleToGrid), then runs Burg/AR
// estimation on it -- sharing the FFT path's frequency grid (freqGridFor) means the two methods'
// traces land on identical x-positions and bandPower() works unchanged on either result.
export function computePsdAr(times: number[], rrMs: number[], fs = 4): PsdArResult {
  const n = times.length
  if (n < 8) return { freqs: [], power: [], order: 0 }

  const values = resampleToGrid(times, rrMs, fs)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const centered = new Float64Array(values.length)
  for (let i = 0; i < values.length; i++) centered[i] = values[i] - mean

  const nPad = nextPow2(values.length)
  const freqs = freqGridFor(nPad, fs)
  return burgPsd(centered, fs, freqs)
}
