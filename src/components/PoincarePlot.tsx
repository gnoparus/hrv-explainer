import { useMemo } from 'react'
import { scaleLinear } from 'd3'

const VB = 220

export function PoincarePlot({ points }: { points: { t: number; rrMs: number }[] }) {
  const { pairs, scale } = useMemo(() => {
    if (points.length < 2) return { pairs: [] as [number, number][], scale: scaleLinear() }
    const pairs: [number, number][] = []
    for (let i = 1; i < points.length; i++) pairs.push([points[i - 1].rrMs, points[i].rrMs])

    let lo = Infinity
    let hi = -Infinity
    for (const p of points) {
      if (p.rrMs < lo) lo = p.rrMs
      if (p.rrMs > hi) hi = p.rrMs
    }
    const pad = Math.max((hi - lo) * 0.15, 15)
    const scale = scaleLinear()
      .domain([lo - pad, hi + pad])
      .range([16, VB - 16])
    return { pairs, scale }
  }, [points])

  return (
    <div className="panel">
      <div className="panel__title">Poincaré plot (RRₙ vs RRₙ₊₁)</div>
      <svg className="panel__svg panel__svg--square" viewBox={`0 0 ${VB} ${VB}`}>
        <line x1={0} y1={VB} x2={VB} y2={0} className="gridline" />
        {pairs.map(([a, b], i) => (
          <circle key={i} cx={scale(a)} cy={VB - scale(b)} r={2.2} className="dot" />
        ))}
      </svg>
    </div>
  )
}
