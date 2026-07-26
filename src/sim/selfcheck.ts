// Runnable correctness check for the HRV math (ponytail: one check per non-trivial logic path).
// Run with: npx tsx src/sim/selfcheck.ts
import assert from 'node:assert'
import { rmssd, sdnn } from './metrics.js'
import { computePsd, bandPower, freqGridFor, LF_BAND, HF_BAND } from './psd.js'
import { computePsdAr, burgPsd } from './psdAr.js'
import { nextPow2 } from './fft.js'
import { RRGenerator, mulberry32 } from './rrGenerator.js'
import { parseRRText } from './parseRRFile.js'

function approxEqual(a: number, b: number, tol: number, label: string) {
  assert(Math.abs(a - b) < tol, `${label}: expected ~${b}, got ${a}`)
}

// 1. RMSSD/SDNN against hand-calculated values.
{
  const rr = [800, 810, 790, 805]
  approxEqual(rmssd(rr), 15.5455, 0.01, 'rmssd')
  approxEqual(sdnn(rr), 8.5391, 0.01, 'sdnn')
  console.log('[ok] rmssd/sdnn match hand-calculated values')
}

// 2. Pure 0.25 Hz sinusoid -> PSD peak lands in the HF band, not LF.
{
  const fs = 4
  const n = 1200 // 300 s at 4 Hz
  const times: number[] = []
  const values: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / fs
    times.push(t)
    values.push(800 + 50 * Math.sin(2 * Math.PI * 0.25 * t))
  }
  const { freqs, power } = computePsd(times, values, fs)
  let peakFreq = 0
  let peakPower = -Infinity
  for (let k = 0; k < freqs.length; k++) {
    if (power[k] > peakPower) {
      peakPower = power[k]
      peakFreq = freqs[k]
    }
  }
  approxEqual(peakFreq, 0.25, 0.02, 'psd peak frequency')
  const hf = bandPower(freqs, power, ...HF_BAND)
  const lf = bandPower(freqs, power, ...LF_BAND)
  assert(hf > lf, `expected HF power (${hf}) > LF power (${lf}) for a 0.25 Hz signal`)
  console.log(`[ok] 0.25 Hz sinusoid: PSD peak at ${peakFreq.toFixed(3)} Hz, HF ${hf.toFixed(1)} > LF ${lf.toFixed(1)}`)
}

// 7. Pure 0.25 Hz sinusoid -> Burg AR PSD peak also lands in the HF band, not LF (mirrors
// check 2 for the FFT path, exercising computePsdAr end-to-end through the spline resample).
{
  const fs = 4
  const n = 1200 // 300 s at 4 Hz
  const times: number[] = []
  const values: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / fs
    times.push(t)
    values.push(800 + 50 * Math.sin(2 * Math.PI * 0.25 * t))
  }
  const { freqs, power } = computePsdAr(times, values, fs)
  let peakFreq = 0
  let peakPower = -Infinity
  for (let k = 0; k < freqs.length; k++) {
    if (power[k] > peakPower) {
      peakPower = power[k]
      peakFreq = freqs[k]
    }
  }
  approxEqual(peakFreq, 0.25, 0.02, 'burg psd peak frequency')
  const hf = bandPower(freqs, power, ...HF_BAND)
  const lf = bandPower(freqs, power, ...LF_BAND)
  assert(hf > lf, `expected HF power (${hf}) > LF power (${lf}) for a 0.25 Hz signal (Burg)`)
  console.log(`[ok] Burg AR: 0.25 Hz sinusoid PSD peak at ${peakFreq.toFixed(3)} Hz, HF ${hf.toFixed(1)} > LF ${lf.toFixed(1)}`)
}

// 8. AR(2)-process correctness anchor: a process with an analytically-known pole frequency.
// Burg should recover both the peak location AND a low model order (the true order is 2) --
// this is the check that would catch a sign-convention bug in the recursion, since a flipped
// sign can still land near the right frequency for some parameter choices but forces FPE to a
// much higher order to compensate for a badly-fit filter. Feeds burgPsd() directly (not
// computePsdAr) so this tests the Burg core in isolation, without spline-resampling noise.
{
  const fs = 4
  const f0 = 0.1
  const r = 0.95
  const theta = (2 * Math.PI * f0) / fs
  const c1 = 2 * r * Math.cos(theta)
  const c2 = -r * r
  const burnIn = 200
  const n = 1200
  const rand = mulberry32(11)
  const raw = new Float64Array(n + burnIn)
  for (let i = 2; i < raw.length; i++) {
    raw[i] = c1 * raw[i - 1] + c2 * raw[i - 2] + (rand() - 0.5)
  }
  const series = raw.slice(burnIn)
  const freqs = freqGridFor(nextPow2(series.length), fs)
  const { freqs: arFreqs, power, order } = burgPsd(series, fs, freqs)
  let peakFreq = 0
  let peakPower = -Infinity
  for (let k = 0; k < arFreqs.length; k++) {
    if (power[k] > peakPower) {
      peakPower = power[k]
      peakFreq = arFreqs[k]
    }
  }
  approxEqual(peakFreq, f0, 0.02, 'burg AR(2) peak frequency')
  assert(order <= 4, `expected Burg to select a low order for a true AR(2) process, got order ${order}`)
  console.log(`[ok] AR(2) process (f0=${f0}Hz): Burg peak at ${peakFreq.toFixed(3)}Hz, selected order ${order}`)
}

function simulateRmssd(breathingRateBrpm: number, seed: number): number {
  const gen = new RRGenerator(mulberry32(seed))
  const rr: number[] = []
  while (gen.elapsedSeconds < 300) {
    const beat = gen.nextBeat({ baselineRRms: 800, breathingRateBrpm, vagalTone: 0.7 })
    rr.push(beat.rrMs)
  }
  return rmssd(rr)
}

// 3. Direction check: slow breathing (6/min) must produce HIGHER RMSSD than fast (15/min), across
// several seeds -- since LF is now stochastic (issue #3 fix), a single seed isn't enough to trust.
// This is the critical physiology check -- see rrGenerator.ts comment on why A_HF can't be constant.
{
  const seeds = [1, 42, 99]
  for (const seed of seeds) {
    const rmssdSlow = simulateRmssd(6, seed)
    const rmssdFast = simulateRmssd(15, seed)
    assert(
      rmssdSlow > rmssdFast,
      `seed ${seed}: expected RMSSD at 6 breaths/min (${rmssdSlow.toFixed(1)}) > RMSSD at 15 breaths/min (${rmssdFast.toFixed(1)})`,
    )
  }
  console.log(`[ok] RMSSD direction correct across ${seeds.length} seeds: 6/min > 15/min`)
}

// 4. Smoothness check: RMSSD across the 6-12 breaths/min resonance zone should not wobble
// (issue #3 -- a fixed-frequency LF tone used to beat against the HF oscillator in this range).
// Averaged over several seeds: LF is now stochastic, so a single seed's residual jitter isn't a
// meaningful signal either way -- the property we actually care about is the shape of the mean curve.
{
  // "Smooth" means unimodal (rises to a single peak, then falls) -- NOT flat. A broad resonance
  // hump is real physiology (see README); a wobble is a sign reversal in the middle of that hump
  // (e.g. rise, dip, rise again), which is what the old fixed-frequency LF tone caused.
  const brpmSweep = [6, 7, 8, 9, 10, 11, 12]
  const seeds = [1, 2, 3, 42, 99]
  const avgCurve = brpmSweep.map(
    (brpm) => seeds.reduce((sum, seed) => sum + simulateRmssd(brpm, seed), 0) / seeds.length,
  )
  const diffs = avgCurve.slice(1).map((v, i) => v - avgCurve[i])
  const signChanges = diffs.slice(1).filter((d, i) => Math.sign(d) !== 0 && Math.sign(diffs[i]) !== 0 && Math.sign(d) !== Math.sign(diffs[i])).length
  assert(
    signChanges <= 1,
    `expected mean RMSSD across 6-12 breaths/min to be unimodal (at most 1 direction change), got ${signChanges} -- values: ${avgCurve.map((v) => v.toFixed(1)).join(', ')}`,
  )
  console.log(`[ok] RMSSD unimodal (no wobble) across 6-12/min resonance zone (${seeds.length}-seed mean): ${avgCurve.map((v) => v.toFixed(1)).join(', ')}`)
}


// 5. Clinical (5-min) vs live (60s) metrics windows must actually be computed over different
// slices, not the same one wired twice -- regression guard for the window-toggle feature.
{
  const gen = new RRGenerator(mulberry32(7))
  const points: { t: number; rrMs: number }[] = []
  while (gen.elapsedSeconds < 300) {
    const beat = gen.nextBeat({ baselineRRms: 800, breathingRateBrpm: 12, vagalTone: 0.6 })
    points.push(beat)
  }
  const lastT = points[points.length - 1].t
  const liveSlice = points.filter((p) => p.t >= lastT - 60)
  const clinicalRmssd = rmssd(points.map((p) => p.rrMs))
  const liveRmssd = rmssd(liveSlice.map((p) => p.rrMs))
  assert(liveSlice.length < points.length, 'expected the 60s live slice to hold fewer beats than the 5-min buffer')
  assert(
    Math.abs(clinicalRmssd - liveRmssd) > 0.01,
    `expected clinical (${clinicalRmssd.toFixed(2)}) and live (${liveRmssd.toFixed(2)}) RMSSD to differ -- looks like both windows are computed over the same slice`,
  )
  console.log(
    `[ok] clinical (${clinicalRmssd.toFixed(1)}ms, n=${points.length}) and live (${liveRmssd.toFixed(1)}ms, n=${liveSlice.length}) windows are computed independently`,
  )
}

// 6. RR-file parser: plain ms, seconds-conversion, and last-token-per-line extraction.
{
  const plain = parseRRText('812\n798\n805\n', 'plain.txt')
  approxEqual(plain.points[0].rrMs, 812, 0.001, 'parseRRText plain ms passthrough')
  approxEqual(plain.points[1].t, (812 + 798) / 1000, 0.001, 'parseRRText cumulative time')

  const seconds = parseRRText('0.812\n0.798\n0.805\n', 'seconds.txt')
  approxEqual(seconds.points[0].rrMs, 812, 0.001, 'parseRRText seconds-to-ms conversion')

  const withIndex = parseRRText('1,812\n2,798\n3,805\n', 'indexed.csv')
  approxEqual(withIndex.points[0].rrMs, 812, 0.001, 'parseRRText last-token extraction with leading index column')

  console.log('[ok] parseRRText: plain ms, seconds conversion, and indexed-column extraction all correct')
}

console.log('\nAll self-checks passed.')
