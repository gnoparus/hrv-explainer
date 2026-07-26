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

export function MetricsStrip({
  rmssdMs,
  sdnnMs,
  lfPower,
  hfPower,
  beatCount,
}: {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  beatCount: number
}) {
  const warming = beatCount < 8
  return (
    <div className="metrics-strip-wrap">
      <div className="metrics-strip">
      <MetricTile
        label="RMSSD"
        value={rmssdMs}
        unit="ms"
        colorVar="--c-teal"
        warming={warming}
        info="Root mean square of successive RR differences -- the primary short-term vagal-tone outcome."
      />
      <MetricTile
        label="SDNN"
        value={sdnnMs}
        unit="ms"
        colorVar="--c-violet"
        warming={warming}
        info="SD of all RR intervals in the window -- total variability, both autonomic branches, not vagal-specific."
      />
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
      <div className="metrics-strip__caption">{warming ? 'collecting baseline…' : 'rolling 60s window'}</div>
    </div>
  )
}
