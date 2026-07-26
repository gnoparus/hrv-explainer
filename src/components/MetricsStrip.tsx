import { useEffect, useRef, useState } from 'react'
import { InfoTag } from './InfoTag'
import { METRICS_WINDOW_SECONDS } from '../sim/useHrvSimulation'

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
  liveWindowBeatCount,
  metricsWindow,
  onMetricsWindowChange,
  clinicalReadySec,
  isLiveSource,
  announceTrigger,
}: {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
  lfPowerAr: number
  hfPowerAr: number
  arOrder: number
  liveWindowBeatCount: number
  metricsWindow: MetricsWindow
  onMetricsWindowChange: (w: MetricsWindow) => void
  clinicalReadySec: number
  isLiveSource: boolean
  // Bumped by the caller on every slider/preset/reset interaction -- see the aria-live effect
  // below for why this (not a free-running interval) is what drives the announcement.
  announceTrigger: number
}) {
  const [showAr, setShowAr] = useState(false)
  const isClinical = metricsWindow === 'clinical'
  // "Gathering" only makes sense for the live simulator, whose buffer is still filling.
  // An uploaded file is a fixed dataset -- if it's shorter than the window, that's just its
  // real duration, not a value waiting to arrive, so uploaded sources never show this state.
  // Blank (dash) only while there's truly no data (<8 beats) -- once the clinical window has
  // *some* beats, show the converging partial-window value instead of blanking the tiles for
  // up to 5 minutes while the charts below keep rendering fine; the "converging… Xs/300s"
  // caption below (via clinicalFilling) keeps the value's provisional status visible, not silent.
  // liveWindowBeatCount (not the monotonic total beat count) so this re-arms after a preset/reset
  // jump the same way it does on a cold start -- see useHrvSimulation's markParamJump.
  const warming = isLiveSource && liveWindowBeatCount < 8
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

  // Dragging a slider is the app's core interaction, and it had zero non-visual feedback --
  // the ▲/▼ delta arrows are aria-hidden (correctly, as decoration) but nothing spoke a text
  // equivalent. `announceTrigger` bumps on every slider/preset/reset interaction (not on every
  // simulator beat), so this effect only resets its timers while the user is actually touching
  // a control, and stays silent indefinitely while the app is just running with nobody
  // interacting -- unlike a plain interval. The `warming` dependency covers the two cases with
  // no direct interaction to key off: the initial cold-start reveal and a preset/reset's
  // post-jump settle (see markParamJump).
  //
  // Two announcements per settle, not one: the live 60s window takes up to METRICS_WINDOW_SECONDS
  // to fully mature after a reset (see useHrvSimulation), so a single announcement shortly after
  // the user stops interacting would speak a still-converging mid-window value and then never
  // update again. The quick one gives immediate "something changed" feedback (parity with the
  // sighted delta arrows firing right away); the second, once the window's had enough real time
  // to refill, speaks the actually-settled reading.
  const latestRef = useRef({ rmssdMs, sdnnMs, hfPower, lfPower })
  latestRef.current = { rmssdMs, sdnnMs, hfPower, lfPower }
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    if (warming) return
    const announce = () => {
      const v = latestRef.current
      setAnnouncement(
        `RMSSD ${v.rmssdMs.toFixed(1)} milliseconds, SDNN ${v.sdnnMs.toFixed(1)} milliseconds, ` +
          `HF power ${v.hfPower.toFixed(1)}, LF power ${v.lfPower.toFixed(1)}`,
      )
    }
    const soonId = setTimeout(announce, 900)
    const settledId = setTimeout(announce, METRICS_WINDOW_SECONDS * 1000)
    return () => {
      clearTimeout(soonId)
      clearTimeout(settledId)
    }
  }, [warming, announceTrigger])

  return (
    <div className="metrics-strip-wrap">
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <div className="window-toggle" role="group" aria-label="Metrics window">
        <button type="button" aria-pressed={!isClinical} onClick={() => onMetricsWindowChange('live')}>
          60s Live
        </button>
        <button type="button" aria-pressed={isClinical} onClick={() => onMetricsWindowChange('clinical')}>
          5 min Clinical
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
          info="Root mean square of successive RR differences -- the primary short-term vagal-tone outcome. HRV declines with chronological age (Choi et al. 2020), and paced-breathing HRV has been proposed as a marker of biological, not just chronological, age (Russoniello et al. 2013) -- a trend worth watching across sessions, not a fixed trajectory."
        />
        <div className="metrics-strip__pair-group">
          <div className="metrics-strip__pair-group-head">
            <span className="metrics-strip__pair-group-label">FFT periodogram</span>
            {/* Burg AR starts hidden -- shown together the two estimates push the strip to 6
                tiles, past the 4-item chunking limit for a single glance. AR is a diagnostic
                cross-check (see its own info copy), not a primary reading, so it's opt-in. */}
            <button
              type="button"
              className="metrics-strip__ar-toggle"
              aria-pressed={showAr}
              onClick={() => setShowAr((v) => !v)}
            >
              {showAr ? 'Hide Burg AR' : 'Compare Burg AR'}
            </button>
          </div>
          <div className="metrics-strip__pair">
            <MetricTile
              label="HF power"
              value={hfPower}
              unit="ms²"
              colorVar="--c-teal"
              warming={warming}
              live={live}
              info="Spectral power 0.15-0.4 Hz. Respiration-linked, vagally mediated. At slow paced breathing (~6/min) the respiratory peak moves into the LF band, so HF power can drop even as RMSSD rises. FFT/Hann periodogram: a single windowed FFT over the whole record, not segment-averaged Welch -- the established clinical-standard method. Tap 'Compare Burg AR' above for a second estimate; expect close agreement, a large gap usually means the AR model order doesn't fit this window well, not that one method is 'more correct.'"
            />
            <MetricTile
              label="LF power"
              value={lfPower}
              unit="ms²"
              colorVar="--c-amber"
              warming={warming}
              live={live}
              info="Spectral power 0.04-0.15 Hz. Mixed baroreflex activity, not purely sympathetic. The classic 'LF/HF = sympathovagal balance' interpretation is now widely considered invalid (Billman 2013) -- shown here descriptively, not as a mechanistic index. FFT/Hann periodogram: a single windowed FFT over the whole record, not segment-averaged Welch -- the established clinical-standard method. Tap 'Compare Burg AR' above for a second estimate; expect close agreement, a large gap usually means the AR model order doesn't fit this window well, not that one method is 'more correct.'"
            />
          </div>
          {/* Always mounted (not gated behind `showAr &&`) so the height-animation below has
              real content to grow from -- an instant mount+reflow was the original P2, this
              is the "animate the height change" fix rather than reserving dead space. `inert`
              when collapsed removes the two AR InfoTag buttons from tab order and the a11y
              tree -- without it they're invisible (zero height + overflow:hidden) but still
              focusable and screen-reader-reachable. */}
          <div className={`metrics-strip__ar-row${showAr ? ' metrics-strip__ar-row--open' : ''}`} inert={!showAr}>
            <div className="metrics-strip__ar-row-inner">
              <span className="metrics-strip__pair-group-label">Burg AR (order {arOrder})</span>
              <div className="metrics-strip__pair">
                <MetricTile
                  label="HF power"
                  value={hfPowerAr}
                  unit="ms²"
                  colorVar="--c-teal"
                  warming={warming}
                  live={live}
                  info="Same 0.15-0.4 Hz band, estimated via Burg autoregressive spectral estimation instead of the FFT periodogram -- sharper peak resolution on short windows, at the cost of depending on the chosen model order (shown above)."
                />
                <MetricTile
                  label="LF power"
                  value={lfPowerAr}
                  unit="ms²"
                  colorVar="--c-amber"
                  warming={warming}
                  live={live}
                  info="Same 0.04-0.15 Hz band, estimated via Burg autoregressive spectral estimation instead of the FFT periodogram -- sharper peak resolution on short windows, at the cost of depending on the chosen model order (shown above)."
                />
              </div>
            </div>
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
