import { useMemo, useState, type KeyboardEvent } from 'react'
import { useHrvSimulation, snapshotFromPoints } from './sim/useHrvSimulation'
import { MetricsStrip } from './components/MetricsStrip'
import { Controls } from './components/Controls'
import { UploadControls } from './components/UploadControls'
import { Tachogram } from './components/Tachogram'
import { PsdChart } from './components/PsdChart'
import { PoincarePlot } from './components/PoincarePlot'
import { getPreset } from './sim/presets'
import { loadSessions, saveSession, deleteSession } from './sim/sessionStore'
import { SessionHistory } from './components/SessionHistory'
import type { ParsedRR } from './sim/parseRRFile'

// Read once at module load, not per-render -- the URL doesn't change under this single-screen app.
const initialPreset = getPreset(new URLSearchParams(window.location.search).get('preset'))

const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'history', label: 'History' },
] as const
type TabKey = (typeof TABS)[number]['key']

// The state a "Reset" click returns to -- whatever the demo actually opened with (a URL
// preset, if given), not a hardcoded default that would ignore a presenter's deep link.
const initialBreathingRateBrpm = initialPreset?.breathingRateBrpm ?? 12
const initialVagalTone = initialPreset?.vagalTone ?? 0.6

function App() {
  const [breathingRateBrpm, setBreathingRateBrpm] = useState(initialBreathingRateBrpm)
  const [vagalTone, setVagalTone] = useState(initialVagalTone)
  const [metricsWindow, setMetricsWindow] = useState<'live' | 'clinical'>('live')
  const [showPacer, setShowPacer] = useState(false)
  const [tab, setTab] = useState<TabKey>('live')
  const [sessions, setSessions] = useState(loadSessions)
  const [source, setSource] = useState<'simulated' | 'uploaded'>('simulated')
  const [uploadedData, setUploadedData] = useState<ParsedRR | null>(null)
  // Bumped on every slider/preset/reset interaction so MetricsStrip's aria-live announcer can
  // debounce off real user input instead of a free-running interval that never goes quiet.
  const [interactionTick, setInteractionTick] = useState(0)
  const bumpInteraction = () => setInteractionTick((t) => t + 1)

  // Always run the simulator (hooks can't be conditional) -- its output is simply unused
  // while an uploaded file is the active source.
  const { snapshot: liveSnapshot, markParamJump } = useHrvSimulation({ breathingRateBrpm, vagalTone })
  const uploadedSnapshot = useMemo(
    () => (uploadedData ? snapshotFromPoints(uploadedData.points) : null),
    [uploadedData],
  )
  const awaitingUpload = source === 'uploaded' && !uploadedSnapshot
  const snapshot = source === 'uploaded' && uploadedSnapshot ? uploadedSnapshot : liveSnapshot
  const active = metricsWindow === 'clinical' ? snapshot.clinical : snapshot.live
  // Same readiness condition MetricsStrip uses to show dashes -- saving a still-warming
  // (near-zero/partial) value would record it in history as if it were a real result.
  // Keyed off liveWindowBeatCount, not the monotonic beatCount, so this also re-arms after a
  // preset/reset jump (see markParamJump) the same way it does on a cold start.
  const metricsWarming =
    source === 'simulated' &&
    (metricsWindow === 'clinical' ? snapshot.clinicalReadySec < 300 : snapshot.liveWindowBeatCount < 8)

  function handlePresetVagalTone(v: number) {
    setVagalTone(v)
    markParamJump()
    bumpInteraction()
  }

  function handleReset() {
    setBreathingRateBrpm(initialBreathingRateBrpm)
    setVagalTone(initialVagalTone)
    markParamJump()
    bumpInteraction()
  }

  function handleSave() {
    if (metricsWarming) return
    setSessions(
      saveSession({
        breathingRateBrpm,
        vagalTone,
        metricsWindow,
        rmssdMs: active.rmssdMs,
        sdnnMs: active.sdnnMs,
        lfPower: active.lfPower,
        hfPower: active.hfPower,
      }),
    )
  }

  function handleTabKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const i = TABS.findIndex((t) => t.key === tab)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length]
    setTab(next.key)
    document.getElementById(`tab-${next.key}`)?.focus()
  }

  return (
    <div className="app">
      <div className="tabbar" role="tablist" aria-label="View" onKeyDown={handleTabKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`tabpanel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            className="tabbar__tab"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hidden via CSS, not unmounted -- the simulation keeps running underneath so switching
          back to Live doesn't lose beat history or restart the RR generator. */}
      <div id="tabpanel-live" role="tabpanel" aria-labelledby="tab-live" hidden={tab !== 'live'} className="app__tabpanel">
        {/* Read zone: header + the live numbers + their source charts, grouped tightly.
            Kept as one block so the controls below can sit apart with more room -- the
            spatial gap itself marks "this is what you read" vs "this is what you touch". */}
        <div className="app__readout">
          <header className="app__header">
            <div className="app__title">
              <span className="pulse-dot" key={snapshot.beatCount} />
              HRV Simulator
            </div>
            {source === 'simulated' && (
              <div className="save-session">
                <button
                  type="button"
                  className="save-session-btn"
                  onClick={handleSave}
                  disabled={metricsWarming}
                  aria-describedby={metricsWarming ? 'save-session-reason' : undefined}
                >
                  Save session
                </button>
                {metricsWarming && (
                  <span id="save-session-reason" className="save-session__reason">
                    collecting baseline&hellip;
                  </span>
                )}
              </div>
            )}
          </header>

          {awaitingUpload ? (
            <div className="panel awaiting-upload">
              <div className="panel__title">No file loaded</div>
              <p>Choose an RR-interval file below to see its metrics and charts here.</p>
            </div>
          ) : (
            <>
              {/* Teaches the Three-Signal Rule's color->meaning mapping once, persistently, instead
                  of leaving it locked inside each metric tile's individual info-tag popover -- a
                  committee member glancing between tachogram/PSD/Poincaré shouldn't have to
                  reconstruct "what does violet mean again?" from memory (Nielsen #6). */}
              <div className="signal-legend" aria-hidden="true">
                <span className="signal-legend__item signal-legend__item--teal">Vagal tone &middot; HF</span>
                <span className="signal-legend__item signal-legend__item--violet">Variability &middot; SDNN</span>
                <span className="signal-legend__item signal-legend__item--amber">LF &middot; contested</span>
              </div>

              <MetricsStrip
                rmssdMs={active.rmssdMs}
                sdnnMs={active.sdnnMs}
                lfPower={active.lfPower}
                hfPower={active.hfPower}
                lfPowerAr={active.lfPowerAr}
                hfPowerAr={active.hfPowerAr}
                arOrder={active.psdAr.order}
                liveWindowBeatCount={snapshot.liveWindowBeatCount}
                metricsWindow={metricsWindow}
                onMetricsWindowChange={setMetricsWindow}
                clinicalReadySec={snapshot.clinicalReadySec}
                isLiveSource={source === 'simulated'}
                announceTrigger={interactionTick}
              />

              <div className="chart-row">
                <Tachogram points={snapshot.points} />
                <PsdChart psd={active.psd} psdAr={active.psdAr} windowSeconds={metricsWindow === 'clinical' ? 300 : 60} />
                <PoincarePlot points={snapshot.points} />
              </div>
            </>
          )}
        </div>

        <div className="controls-bar">
          <div className="window-toggle source-toggle" role="group" aria-label="Data source">
            <button
              type="button"
              aria-pressed={source === 'simulated'}
              onClick={() => setSource('simulated')}
            >
              Simulated
            </button>
            <button
              type="button"
              aria-pressed={source === 'uploaded'}
              onClick={() => setSource('uploaded')}
            >
              Uploaded
            </button>
          </div>

          {source === 'simulated' ? (
            <Controls
              breathingRateBrpm={breathingRateBrpm}
              vagalTone={vagalTone}
              onBreathingRateChange={(v) => {
                setBreathingRateBrpm(v)
                bumpInteraction()
              }}
              onVagalToneChange={(v) => {
                setVagalTone(v)
                bumpInteraction()
              }}
              onPresetVagalTone={handlePresetVagalTone}
              onReset={handleReset}
              showPacer={showPacer}
              onTogglePacer={() => setShowPacer((v) => !v)}
            />
          ) : (
            <UploadControls value={uploadedData} onLoaded={setUploadedData} />
          )}
        </div>
      </div>

      {tab === 'history' && (
        <div id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history" className="app__tabpanel app__tabpanel--history">
          <SessionHistory sessions={sessions} onDelete={(id) => setSessions(deleteSession(id))} />
        </div>
      )}
    </div>
  )
}

export default App
