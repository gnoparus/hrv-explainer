import { useEffect, useRef, useState } from 'react'
import { RRGenerator } from './rrGenerator'
import { rmssd, sdnn } from './metrics'
import { computePsd, bandPower, LF_BAND, HF_BAND, type PsdResult } from './psd'

const DISPLAY_WINDOW_SECONDS = 5 * 60 // tachogram/Poincare: clinical short-term duration, for visual continuity
const METRICS_WINDOW_SECONDS = 60 // "live" metrics: shorter so a slider drag visibly moves the numbers in a demo
const CLINICAL_WINDOW_SECONDS = DISPLAY_WINDOW_SECONDS // "clinical" metrics: the 5-min short-term HRV standard

export interface HrvParams {
  breathingRateBrpm: number
  vagalTone: number
}

export interface WindowMetrics {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  psd: PsdResult
}

export interface HrvSnapshot {
  points: { t: number; rrMs: number }[]
  beatCount: number // monotonic, unlike points.length which plateaus once the display window fills
  live: WindowMetrics // rolling 60s window
  clinical: WindowMetrics // rolling 5-min window (clinical short-term standard)
  clinicalReadySec: number // seconds of data buffered toward the 5-min clinical window, capped at 300
}

const EMPTY_WINDOW: WindowMetrics = { rmssdMs: 0, sdnnMs: 0, lfPower: 0, hfPower: 0, psd: { freqs: [], power: [] } }

const EMPTY_SNAPSHOT: HrvSnapshot = {
  points: [],
  beatCount: 0,
  live: EMPTY_WINDOW,
  clinical: EMPTY_WINDOW,
  clinicalReadySec: 0,
}

function computeWindowMetrics(points: { t: number; rrMs: number }[]): WindowMetrics {
  const rrValues = points.map((p) => p.rrMs)
  const times = points.map((p) => p.t)
  const psd = computePsd(times, rrValues)
  return {
    rmssdMs: rmssd(rrValues),
    sdnnMs: sdnn(rrValues),
    lfPower: bandPower(psd.freqs, psd.power, ...LF_BAND),
    hfPower: bandPower(psd.freqs, psd.power, ...HF_BAND),
    psd,
  }
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

      // `raw` is already bounded to DISPLAY_WINDOW_SECONDS (== CLINICAL_WINDOW_SECONDS), so
      // the clinical window is just the full buffer -- no separate slice needed.
      const clinicalReadySec = Math.min(CLINICAL_WINDOW_SECONDS, raw.length ? raw[raw.length - 1].t - raw[0].t : 0)

      setSnapshot({
        points: raw,
        beatCount,
        live: computeWindowMetrics(recent),
        clinical: computeWindowMetrics(raw),
        clinicalReadySec,
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
