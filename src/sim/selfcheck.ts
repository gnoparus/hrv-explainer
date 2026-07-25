// Runnable correctness check for the HRV math (ponytail: one check per non-trivial logic path).
// Run with: npx tsx src/sim/selfcheck.ts
import assert from 'node:assert'
import { rmssd, sdnn } from './metrics.js'
import { computePsd, bandPower, LF_BAND, HF_BAND } from './psd.js'
import { RRGenerator, mulberry32 } from './rrGenerator.js'

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

// 3. Direction check: slow breathing (6/min) must produce HIGHER RMSSD than fast (15/min).
// This is the critical physiology check -- see rrGenerator.ts comment on why A_HF can't be constant.
{
  function simulateRmssd(breathingRateBrpm: number): number {
    const gen = new RRGenerator(mulberry32(42))
    const rr: number[] = []
    while (gen.elapsedSeconds < 300) {
      const beat = gen.nextBeat({ baselineRRms: 800, breathingRateBrpm, vagalTone: 0.7 })
      rr.push(beat.rrMs)
    }
    return rmssd(rr)
  }

  const rmssdSlow = simulateRmssd(6)
  const rmssdFast = simulateRmssd(15)
  assert(
    rmssdSlow > rmssdFast,
    `expected RMSSD at 6 breaths/min (${rmssdSlow.toFixed(1)}) > RMSSD at 15 breaths/min (${rmssdFast.toFixed(1)})`,
  )
  console.log(`[ok] RMSSD direction correct: 6/min=${rmssdSlow.toFixed(1)}ms > 15/min=${rmssdFast.toFixed(1)}ms`)
}

console.log('\nAll self-checks passed.')
