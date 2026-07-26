import { useEffect, useRef, useState } from 'react'
import { InfoTag } from './InfoTag'

interface MetricTileProps {
  label: string
  value: number
  unit: string
  colorVar: string
  info: string
  warming: boolean
  live: boolean
}

// Threshold below which a change is noise, not a real move worth flagging.
const DELTA_EPSILON = 0.05

function MetricTile({ label, value, unit, colorVar, info, warming, live }: MetricTileProps) {
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
      <div className={`metric-tile__value${live ? ' metric-tile__value--live' : ''}`}>
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
  lfPowerAr,
  hfPowerAr,
  arOrder,
  beatCount,
  metricsWindow,
  onMetricsWindowChange,
  clinicalReadySec,
  isLiveSource,
}: {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  lfPowerAr: number
  hfPowerAr: number
  arOrder: number
  beatCount: number
  metricsWindow: MetricsWindow
  onMetricsWindowChange: (w: MetricsWindow) => void
  clinicalReadySec: number
  isLiveSource: boolean
}) {
  const isClinical = metricsWindow === 'clinical'
  // "Gathering" only makes sense for the live simulator, whose buffer is still filling.
  // An uploaded file is a fixed dataset -- if it's shorter than the window, that's just its
  // real duration, not a value waiting to arrive, so uploaded sources never show this state.
  // Blank (dash) only while there's truly no data (<8 beats) -- once the clinical window has
  // *some* beats, show the converging partial-window value instead of blanking the tiles for
  // up to 5 minutes while the charts below keep rendering fine; the "converging… Xs/300s"
  // caption below (via clinicalFilling) keeps the value's provisional status visible, not silent.
  const warming = isLiveSource && beatCount < 8
  // Was `clinicalReadySec >= 300 || isLiveSource` -- that OR made isLiveSource alone always
  // win, which was invisible while the tiles blanked below 300s (this branch was unreachable
  // for that case); now that partial-window values render instead of blanking, the bug would
  // show "rolling 5-min window" from the very first beat. Distinguish still-filling explicitly.
  const clinicalFilling = isClinical && isLiveSource && clinicalReadySec < 300
  // Pulse only while genuinely live-updating -- never for a fixed uploaded recording (nothing
  // is "arriving"), never while warming (nothing to pulse yet, the dash renders instead).
  const live = isLiveSource && !warming
  const caption = warming
    ? isClinical
      ? `gathering… ${Math.floor(clinicalReadySec)}/300s`
      : 'collecting baseline…'
    : isClinical
      ? clinicalFilling
        ? `converging — ${Math.floor(clinicalReadySec)}/300s toward the clinical standard`
        : clinicalReadySec >= 300 || isLiveSource
          ? 'rolling 5-min window (clinical standard)'
          : `full recording (${Math.floor(clinicalReadySec)}s, shorter than the 5-min standard)`
      : isLiveSource || clinicalReadySec >= 60
        ? 'rolling 60s window'
        : `full recording (${Math.floor(clinicalReadySec)}s)`

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
          live={live}
          info="Root mean square of successive RR differences -- the primary short-term vagal-tone outcome."
        />
        <div className="metrics-strip__pair-group">
          <span className="metrics-strip__pair-group-label">FFT/Welch</span>
          <div className="metrics-strip__pair">
            <MetricTile
              label="HF power"
              value={hfPower}
              unit="ms²"
              colorVar="--c-teal"
              warming={warming}
              live={live}
              info="Spectral power 0.15-0.4 Hz. Respiration-linked, vagally mediated. At slow paced breathing (~6/min) the respiratory peak moves into the LF band, so HF power can drop even as RMSSD rises. Two estimates shown below: FFT/Welch (established clinical-standard method) and Burg autoregressive -- expect close agreement; a large gap usually means the AR model order doesn't fit this window well, not that one method is 'more correct.'"
            />
            <MetricTile
              label="LF power"
              value={lfPower}
              unit="ms²"
              colorVar="--c-amber"
              warming={warming}
              live={live}
              info="Spectral power 0.04-0.15 Hz. Mixed baroreflex activity, not purely sympathetic. The classic 'LF/HF = sympathovagal balance' interpretation is now widely considered invalid (Billman 2013) -- shown here descriptively, not as a mechanistic index. Two estimates shown below: FFT/Welch (established clinical-standard method) and Burg autoregressive -- expect close agreement; a large gap usually means the AR model order doesn't fit this window well, not that one method is 'more correct.'"
            />
          </div>
          <span className="metrics-strip__pair-group-label">Burg AR (order {arOrder})</span>
          <div className="metrics-strip__pair">
            <MetricTile
              label="HF power"
              value={hfPowerAr}
              unit="ms²"
              colorVar="--c-teal"
              warming={warming}
              live={live}
              info="Same 0.15-0.4 Hz band, estimated via Burg autoregressive spectral estimation instead of FFT/Welch -- sharper peak resolution on short windows, at the cost of depending on the chosen model order (shown above)."
            />
            <MetricTile
              label="LF power"
              value={lfPowerAr}
              unit="ms²"
              colorVar="--c-amber"
              warming={warming}
              live={live}
              info="Same 0.04-0.15 Hz band, estimated via Burg autoregressive spectral estimation instead of FFT/Welch -- sharper peak resolution on short windows, at the cost of depending on the chosen model order (shown above)."
            />
          </div>
        </div>
        <MetricTile
          label="SDNN"
          value={sdnnMs}
          unit="ms"
          colorVar="--c-violet"
          warming={warming}
          live={live}
          info="SD of all RR intervals in the window -- total variability, both autonomic branches, not vagal-specific."
        />
      </div>
      <div className="metrics-strip__caption">{caption}</div>
    </div>
  )
}
