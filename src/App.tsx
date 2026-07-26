import { useState } from 'react'
import { useHrvSimulation } from './sim/useHrvSimulation'
import { MetricsStrip } from './components/MetricsStrip'
import { Controls } from './components/Controls'
import { Tachogram } from './components/Tachogram'
import { PsdChart } from './components/PsdChart'
import { PoincarePlot } from './components/PoincarePlot'

function App() {
  const [breathingRateBrpm, setBreathingRateBrpm] = useState(12)
  const [vagalTone, setVagalTone] = useState(0.6)
  const [metricsWindow, setMetricsWindow] = useState<'live' | 'clinical'>('live')
  const snapshot = useHrvSimulation({ breathingRateBrpm, vagalTone })
  const active = metricsWindow === 'clinical' ? snapshot.clinical : snapshot.live

  return (
    <div className="app">
      {/* Read zone: header + the live numbers + their source charts, grouped tightly.
          Kept as one block so the controls below can sit apart with more room -- the
          spatial gap itself marks "this is what you read" vs "this is what you touch". */}
      <div className="app__readout">
        <header className="app__header">
          <div className="app__title">
            <span className="pulse-dot" key={snapshot.beatCount} />
            HRV Explainer
          </div>
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
        />
      </div>
    </div>
  )
}

export default App
