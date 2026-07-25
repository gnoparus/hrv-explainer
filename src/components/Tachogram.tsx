import { useMemo } from 'react'
import { scaleLinear, line as d3line, curveMonotoneX } from 'd3'

const VB_W = 600
const VB_H = 200
const WINDOW_SECONDS = 5 * 60

export function Tachogram({ points }: { points: { t: number; rrMs: number }[] }) {
  const { path, xTicks } = useMemo(() => {
    if (points.length < 2) return { path: '', xTicks: [] as number[] }

    const tEnd = points[points.length - 1].t
    const tStart = tEnd - WINDOW_SECONDS
    const x = scaleLinear().domain([tStart, tEnd]).range([0, VB_W])

    let yMin = Infinity
    let yMax = -Infinity
    for (const p of points) {
      if (p.rrMs < yMin) yMin = p.rrMs
      if (p.rrMs > yMax) yMax = p.rrMs
    }
    const pad = Math.max((yMax - yMin) * 0.15, 10)
    const y = scaleLinear()
      .domain([yMin - pad, yMax + pad])
      .range([VB_H - 12, 12])

    const gen = d3line<{ t: number; rrMs: number }>()
      .x((d) => x(d.t))
      .y((d) => y(d.rrMs))
      .curve(curveMonotoneX)

    const ticks: number[] = []
    const firstTick = Math.ceil(tStart / 60) * 60
    for (let tk = firstTick; tk <= tEnd; tk += 60) ticks.push(x(tk))

    return { path: gen(points) ?? '', xTicks: ticks }
  }, [points])

  return (
    <div className="panel">
      <div className="panel__title">Tachogram (R-R intervals, 5 min)</div>
      <svg className="panel__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        {xTicks.map((tx, i) => (
          <line key={i} x1={tx} x2={tx} y1={0} y2={VB_H} className="gridline" />
        ))}
        <path d={path} className="trace trace--teal" fill="none" />
      </svg>
    </div>
  )
}
