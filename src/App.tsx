import { useState, type KeyboardEvent } from 'react'
import { useHrvSimulation } from './sim/useHrvSimulation'
import { MetricsStrip } from './components/MetricsStrip'
import { Controls } from './components/Controls'
import { Tachogram } from './components/Tachogram'
import { PsdChart } from './components/PsdChart'
import { PoincarePlot } from './components/PoincarePlot'
import { getPreset } from './sim/presets'
import { loadSessions, saveSession, deleteSession } from './sim/sessionStore'
import { SessionHistory } from './components/SessionHistory'

// Read once at module load, not per-render -- the URL doesn't change under this single-screen app.
const initialPreset = getPreset(new URLSearchParams(window.location.search).get('preset'))

const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'history', label: 'History' },
] as const
type TabKey = (typeof TABS)[number]['key']

function App() {
  const [breathingRateBrpm, setBreathingRateBrpm] = useState(initialPreset?.breathingRateBrpm ?? 12)
  const [vagalTone, setVagalTone] = useState(initialPreset?.vagalTone ?? 0.6)
  const [metricsWindow, setMetricsWindow] = useState<'live' | 'clinical'>('live')
  const [showPacer, setShowPacer] = useState(false)
  const [tab, setTab] = useState<TabKey>('live')
  const [sessions, setSessions] = useState(loadSessions)
  const snapshot = useHrvSimulation({ breathingRateBrpm, vagalTone })
  const active = metricsWindow === 'clinical' ? snapshot.clinical : snapshot.live

  function handleSave() {
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
              HRV Explainer
            </div>
            <button type="button" className="save-session-btn" onClick={handleSave}>
              Save session
            </button>
          </header>

          <MetricsStrip
            rmssdMs={active.rmssdMs}
            sdnnMs={active.sdnnMs}
            lfPower={active.lfPower}
            hfPower={active.hfPower}
            beatCount={snapshot.beatCount}
            metricsWindow={metricsWindow}
            onMetricsWindowChange={setMetricsWindow}
            clinicalReadySec={snapshot.clinicalReadySec}
          />

          <div className="chart-row">
            <Tachogram points={snapshot.points} />
            <PsdChart psd={active.psd} windowSeconds={metricsWindow === 'clinical' ? 300 : 60} />
            <PoincarePlot points={snapshot.points} />
          </div>
        </div>

        <div className="controls-bar">
          <Controls
            breathingRateBrpm={breathingRateBrpm}
            vagalTone={vagalTone}
            onBreathingRateChange={setBreathingRateBrpm}
            onVagalToneChange={setVagalTone}
            showPacer={showPacer}
            onTogglePacer={() => setShowPacer((v) => !v)}
          />
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
