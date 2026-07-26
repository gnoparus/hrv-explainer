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
  const snapshot = useHrvSimulation({ breathingRateBrpm, vagalTone })

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <span className="pulse-dot" key={snapshot.beatCount} />
          HRV Explainer
        </div>
      </header>

      <MetricsStrip
        rmssdMs={snapshot.rmssdMs}
        sdnnMs={snapshot.sdnnMs}
        lfPower={snapshot.lfPower}
        hfPower={snapshot.hfPower}
        beatCount={snapshot.beatCount}
      />

      <div className="chart-row">
        <Tachogram points={snapshot.points} />
        <PsdChart psd={snapshot.psd} />
        <PoincarePlot points={snapshot.points} />
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
