import { useMemo } from 'react'
import { scaleLinear, line as d3line, curveMonotoneX } from 'd3'

const VB_W = 600
const VB_H = 200
const WINDOW_SECONDS = 5 * 60
const MARGIN_L = 34
const MARGIN_B = 14

export function Tachogram({ points }: { points: { t: number; rrMs: number }[] }) {
  type Tick = { pos: number; label: string }
  const { path, xTicks, yTicks, plotBottom } = useMemo(() => {
    if (points.length < 2)
      return { path: '', xTicks: [] as Tick[], yTicks: [] as Tick[], plotBottom: VB_H - MARGIN_B }

    const tEnd = points[points.length - 1].t
    // Auto-scale to available history so early in a session the trace fills the plot
    // instead of showing a near-empty 5-minute window (cold-start looked broken).
    const tStart = Math.max(tEnd - WINDOW_SECONDS, points[0].t)
    const x = scaleLinear().domain([tStart, tEnd]).range([MARGIN_L, VB_W])

    let yMin = Infinity
    let yMax = -Infinity
    for (const p of points) {
      if (p.rrMs < yMin) yMin = p.rrMs
      if (p.rrMs > yMax) yMax = p.rrMs
    }
    const pad = Math.max((yMax - yMin) * 0.15, 10)
    const plotBottom = VB_H - MARGIN_B
    const y = scaleLinear()
      .domain([yMin - pad, yMax + pad])
      .range([plotBottom - 12, 12])

    const gen = d3line<{ t: number; rrMs: number }>()
      .x((d) => x(d.t))
      .y((d) => y(d.rrMs))
      .curve(curveMonotoneX)

    const ticks: { pos: number; label: string }[] = []
    const firstTick = Math.ceil(tStart / 60) * 60
    for (let tk = firstTick; tk <= tEnd; tk += 60) {
      const minAgo = Math.round((tEnd - tk) / 60)
      ticks.push({ pos: x(tk), label: minAgo === 0 ? 'now' : `-${minAgo}m` })
    }

    const yTicks = y.ticks(3).map((v) => ({ pos: y(v), label: `${Math.round(v)}` }))

    return { path: gen(points) ?? '', xTicks: ticks, yTicks, plotBottom }
  }, [points])

  return (
    <div className="panel">
      <div className="panel__title">Tachogram (R-R intervals, ms)</div>
      <svg className="panel__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        {xTicks.map((tick, i) => (
          <line key={i} x1={tick.pos} x2={tick.pos} y1={0} y2={plotBottom} className="gridline" />
        ))}
        <path d={path} className="trace trace--teal" fill="none" />
        {yTicks.map((tick, i) => (
          <text key={i} x={4} y={tick.pos + 3} className="axis-tick">
            {tick.label}
          </text>
        ))}
        {xTicks.map((tick, i) => (
          <text key={i} x={tick.pos} y={VB_H - 2} textAnchor="middle" className="axis-tick">
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
