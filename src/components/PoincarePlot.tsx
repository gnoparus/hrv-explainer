import { useMemo } from 'react'
import { scaleLinear } from 'd3'

const VB = 220
const MARGIN_L = 32
const MARGIN_B = 18
const MARGIN_TR = 10

export function PoincarePlot({ points }: { points: { t: number; rrMs: number }[] }) {
  const { pairs, xScale, yScale, ticks } = useMemo(() => {
    if (points.length < 2)
      return { pairs: [] as [number, number][], xScale: scaleLinear(), yScale: scaleLinear(), ticks: [] as number[] }
    const pairs: [number, number][] = []
    for (let i = 1; i < points.length; i++) pairs.push([points[i - 1].rrMs, points[i].rrMs])

    let lo = Infinity
    let hi = -Infinity
    for (const p of points) {
      if (p.rrMs < lo) lo = p.rrMs
      if (p.rrMs > hi) hi = p.rrMs
    }
    const pad = Math.max((hi - lo) * 0.15, 15)
    const domain: [number, number] = [lo - pad, hi + pad]
    const xScale = scaleLinear().domain(domain).range([MARGIN_L, VB - MARGIN_TR])
    const yScale = scaleLinear().domain(domain).range([VB - MARGIN_B, MARGIN_TR])
    return { pairs, xScale, yScale, ticks: xScale.ticks(3) }
  }, [points])

  return (
    <div className="panel">
      <div className="panel__title">Poincaré plot (RRₙ vs RRₙ₊₁, ms)</div>
      <svg className="panel__svg panel__svg--square" viewBox={`0 0 ${VB} ${VB}`}>
        <line x1={xScale(xScale.domain()[0])} y1={yScale(yScale.domain()[0])} x2={xScale(xScale.domain()[1])} y2={yScale(yScale.domain()[1])} className="gridline" />
        {pairs.map(([a, b], i) => (
          <circle key={i} cx={xScale(a)} cy={yScale(b)} r={2.2} className="dot" />
        ))}
        {ticks.map((v, i) => (
          <text key={`x${i}`} x={xScale(v)} y={VB - 4} textAnchor="middle" className="axis-tick">
            {Math.round(v)}
          </text>
        ))}
        {ticks.map((v, i) => (
          <text key={`y${i}`} x={2} y={yScale(v) + 3} className="axis-tick">
            {Math.round(v)}
          </text>
        ))}
      </svg>
    </div>
  )
}
