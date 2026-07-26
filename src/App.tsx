import { useRef, useState } from 'react'
import { useHrvSimulation } from './sim/useHrvSimulation'
import { MetricsStrip } from './components/MetricsStrip'
import { Controls } from './components/Controls'
import { Tachogram } from './components/Tachogram'
import { PsdChart } from './components/PsdChart'
import { PoincarePlot } from './components/PoincarePlot'

// SVG charts are serialized standalone for export -- they don't inherit index.css, so the
// handful of rules that give the traces their stroke/fill/glow have to travel with the markup.
const EXPORT_SVG_STYLE = `
  .trace { stroke-width: 2.5; stroke-linecap: round; filter: drop-shadow(0 0 3px currentColor); }
  .trace--teal { stroke: #2fe7c9; color: #2fe7c9; }
  .trace--violet { stroke: #b18bff; color: #b18bff; fill: rgba(177,139,255,0.25); }
  .psd-trace--neutral { stroke: #7c8fa0; color: #7c8fa0; fill: rgba(124,143,160,0.15); }
  .psd-trace--lf { stroke: #ffc857; color: #ffc857; fill: rgba(255,200,87,0.25); }
  .psd-trace--hf { stroke: #2fe7c9; color: #2fe7c9; fill: rgba(47,231,201,0.25); }
  .gridline { stroke: #1b2733; stroke-width: 1; }
  .band { opacity: 0.12; }
  .band--lf { fill: #ffc857; }
  .band--hf { fill: #2fe7c9; }
  .band-label { fill: #7c8fa0; font-size: 11px; text-anchor: middle; }
  .axis-tick { fill: #7c8fa0; font-size: 10px; }
  .dot { fill: #2fe7c9; opacity: 0.55; filter: drop-shadow(0 0 1.5px #2fe7c9); }
`

function App() {
  const [breathingRateBrpm, setBreathingRateBrpm] = useState(12)
  const [vagalTone, setVagalTone] = useState(0.6)
  const snapshot = useHrvSimulation({ breathingRateBrpm, vagalTone })
  const exportRef = useRef<HTMLDivElement>(null)
  const [exportState, setExportState] = useState<'idle' | 'saved'>('idle')

  function handleExport() {
    const svgs = exportRef.current?.querySelectorAll('svg')
    if (!svgs || svgs.length === 0) return
    const grid = exportRef.current!.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = grid.width * 2
    canvas.height = grid.height * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    ctx.fillStyle = '#05080b'
    ctx.fillRect(0, 0, grid.width, grid.height)

    let remaining = svgs.length
    const finish = () => {
      remaining -= 1
      if (remaining > 0) return
      const link = document.createElement('a')
      link.download = `hrv-snapshot-${breathingRateBrpm}bpm-${Math.round(vagalTone * 100)}pct.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExportState('saved')
      setTimeout(() => setExportState('idle'), 1500)
    }

    svgs.forEach((svg) => {
      const rect = svg.getBoundingClientRect()
      const clone = svg.cloneNode(true) as SVGSVGElement
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style')
      styleEl.textContent = EXPORT_SVG_STYLE
      clone.insertBefore(styleEl, clone.firstChild)

      const xml = new XMLSerializer().serializeToString(clone)
      const img = new Image()
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      img.onload = () => {
        ctx.drawImage(img, rect.left - grid.left, rect.top - grid.top, rect.width, rect.height)
        URL.revokeObjectURL(url)
        finish()
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        finish()
      }
      img.src = url
    })
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <span className="pulse-dot" key={snapshot.beatCount} />
          HRV Explainer
        </div>
        <button
          type="button"
          className={`export-btn${exportState === 'saved' ? ' export-btn--saved' : ''}`}
          onClick={handleExport}
        >
          {exportState === 'saved' ? 'Saved' : 'Export snapshot'}
        </button>
      </header>

      <MetricsStrip
        rmssdMs={snapshot.rmssdMs}
        sdnnMs={snapshot.sdnnMs}
        lfPower={snapshot.lfPower}
        hfPower={snapshot.hfPower}
        beatCount={snapshot.beatCount}
      />

      <div className="chart-row" ref={exportRef}>
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
