import { useEffect, useRef, useState } from 'react'
import { RRGenerator } from './rrGenerator'
import { rmssd, sdnn } from './metrics'
import { computePsd, bandPower, LF_BAND, HF_BAND, type PsdResult } from './psd'

const DISPLAY_WINDOW_SECONDS = 5 * 60 // tachogram/Poincare: clinical short-term duration, for visual continuity
const METRICS_WINDOW_SECONDS = 60 // RMSSD/SDNN/PSD: shorter so a slider drag visibly moves the numbers in a live demo

export interface HrvParams {
  breathingRateBrpm: number
  vagalTone: number
}

export interface HrvSnapshot {
  points: { t: number; rrMs: number }[]
  beatCount: number // monotonic, unlike points.length which plateaus once the display window fills
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  psd: PsdResult
}

const EMPTY_SNAPSHOT: HrvSnapshot = {
  points: [],
  beatCount: 0,
  rmssdMs: 0,
  sdnnMs: 0,
  lfPower: 0,
  hfPower: 0,
  psd: { freqs: [], power: [] },
}

// ponytail: beats arrive at heart-rate cadence (~1/s), not 60fps, so we just re-render React
// state on every beat instead of running a separate rAF scroll clock -- at ~300 SVG points
// updated once a second the DOM churn is negligible. Upgrade to a decoupled rAF scroll layer
// only if profiling on the actual iPad shows jank.
export function useHrvSimulation(params: HrvParams): HrvSnapshot {
  const [snapshot, setSnapshot] = useState<HrvSnapshot>(EMPTY_SNAPSHOT)
  const paramsRef = useRef(params)
  paramsRef.current = params

  useEffect(() => {
    const generator = new RRGenerator(Math.random)
    let raw: { t: number; rrMs: number }[] = []
    let beatCount = 0
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    function tick() {
      if (cancelled) return
      beatCount += 1
      const beat = generator.nextBeat({
        baselineRRms: 800,
        breathingRateBrpm: paramsRef.current.breathingRateBrpm,
        vagalTone: paramsRef.current.vagalTone,
      })
      raw.push(beat)
      const cutoff = beat.t - DISPLAY_WINDOW_SECONDS
      raw = raw.filter((p) => p.t >= cutoff)

      const metricsCutoff = beat.t - METRICS_WINDOW_SECONDS
      const recent = raw.filter((p) => p.t >= metricsCutoff)
      const rrValues = recent.map((p) => p.rrMs)
      const times = recent.map((p) => p.t)
      const psd = computePsd(times, rrValues)
      const lfPower = bandPower(psd.freqs, psd.power, ...LF_BAND)
      const hfPower = bandPower(psd.freqs, psd.power, ...HF_BAND)

      setSnapshot({
        points: raw,
        beatCount,
        rmssdMs: rmssd(rrValues),
        sdnnMs: sdnn(rrValues),
        lfPower,
        hfPower,
        psd,
      })

      const delay = Math.min(Math.max(beat.rrMs, 300), 2000)
      timeoutId = setTimeout(tick, delay)
    }

    tick()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  return snapshot
}
