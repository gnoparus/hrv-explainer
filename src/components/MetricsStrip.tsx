import { useEffect, useRef, useState } from 'react'
import { InfoTag } from './InfoTag'

interface MetricTileProps {
  label: string
  value: number
  unit: string
  colorVar: string
  info: string
  warming: boolean
}

// Threshold below which a change is noise, not a real move worth flagging.
const DELTA_EPSILON = 0.05

function MetricTile({ label, value, unit, colorVar, info, warming }: MetricTileProps) {
  const prevRef = useRef(value)
  const deltaKeyRef = useRef(0)
  const [delta, setDelta] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (warming) {
      prevRef.current = value
      return
    }
    const diff = value - prevRef.current
    prevRef.current = value
    if (Math.abs(diff) <= DELTA_EPSILON) return
    // Bump the key so the indicator remounts (and its fade animation restarts) even when
    // the direction repeats -- otherwise setDelta('up') on an already-'up' state is a no-op
    // and consecutive same-direction moves after the first show no visible flash at all.
    deltaKeyRef.current += 1
    setDelta(diff > 0 ? 'up' : 'down')
    const id = setTimeout(() => setDelta(null), 900)
    return () => clearTimeout(id)
  }, [value, warming])

  return (
    <div className="metric-tile" style={{ ['--tile-color' as string]: `var(${colorVar})` }}>
      <div className="metric-tile__head">
        <span className="metric-tile__label">{label}</span>
        <InfoTag text={info} />
      </div>
      <div className="metric-tile__value">
        {warming ? (
          <span className="metric-tile__value--warming">—</span>
        ) : (
          <>
            {value.toFixed(1)}
            <span className="metric-tile__unit">{unit}</span>
            {delta && (
              <span
                key={deltaKeyRef.current}
                className={`metric-tile__delta metric-tile__delta--${delta}`}
                aria-hidden="true"
              >
                {delta === 'up' ? '▲' : '▼'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export type MetricsWindow = 'live' | 'clinical'

export function MetricsStrip({
  rmssdMs,
  sdnnMs,
  lfPower,
  hfPower,
  beatCount,
  metricsWindow,
  onMetricsWindowChange,
  clinicalReadySec,
}: {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  beatCount: number
  metricsWindow: MetricsWindow
  onMetricsWindowChange: (w: MetricsWindow) => void
  clinicalReadySec: number
}) {
  const isClinical = metricsWindow === 'clinical'
  // Live warms up on beat count (fast, ~8 beats); clinical warms up on buffered duration
  // (slow, the full 5-min window) -- two different readiness signals for two different windows.
  const warming = isClinical ? clinicalReadySec < 300 : beatCount < 8
  const caption = warming
    ? isClinical
      ? `gathering… ${Math.floor(clinicalReadySec)}/300s`
      : 'collecting baseline…'
    : isClinical
      ? 'rolling 5-min window (clinical standard)'
      : 'rolling 60s window'

  return (
    <div className="metrics-strip-wrap">
      <div className="window-toggle" role="group" aria-label="Metrics window">
        <button type="button" aria-pressed={!isClinical} onClick={() => onMetricsWindowChange('live')}>
          60s live
        </button>
        <button type="button" aria-pressed={isClinical} onClick={() => onMetricsWindowChange('clinical')}>
          5 min clinical
        </button>
      </div>
      {/* 3 columns mirror chart-row below: RMSSD sits above the Tachogram it summarizes,
          HF+LF sit paired above the one PSD chart they're both read from, SDNN sits above
          the Poincaré spread it summarizes. */}
      <div className="metrics-strip">
        <MetricTile
          label="RMSSD"
          value={rmssdMs}
          unit="ms"
          colorVar="--c-teal"
          warming={warming}
          info="Root mean square of successive RR differences -- the primary short-term vagal-tone outcome."
        />
        <div className="metrics-strip__pair">
          <MetricTile
            label="HF power"
            value={hfPower}
            unit="ms²"
            colorVar="--c-teal"
            warming={warming}
            info="Spectral power 0.15-0.4 Hz. Respiration-linked, vagally mediated. At slow paced breathing (~6/min) the respiratory peak moves into the LF band, so HF power can drop even as RMSSD rises."
          />
          <MetricTile
            label="LF power"
            value={lfPower}
            unit="ms²"
            colorVar="--c-amber"
            warming={warming}
            info="Spectral power 0.04-0.15 Hz. Mixed baroreflex activity, not purely sympathetic. The classic 'LF/HF = sympathovagal balance' interpretation is now widely considered invalid (Billman 2013) -- shown here descriptively, not as a mechanistic index."
          />
        </div>
        <MetricTile
          label="SDNN"
          value={sdnnMs}
          unit="ms"
          colorVar="--c-violet"
          warming={warming}
          info="SD of all RR intervals in the window -- total variability, both autonomic branches, not vagal-specific."
        />
      </div>
      <div className="metrics-strip__caption">{caption}</div>
    </div>
  )
}
