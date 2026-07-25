import { useMemo } from 'react'
import { scaleLinear, area as d3area, curveMonotoneX } from 'd3'
import type { PsdResult } from '../sim/psd'
import { LF_BAND, HF_BAND } from '../sim/psd'

const VB_W = 600
const VB_H = 200
const F_MAX = 0.5
const MARGIN_X = 20
const MARGIN_B = 14

export function PsdChart({ psd }: { psd: PsdResult }) {
  const plotBottom = VB_H - MARGIN_B

  const { path, x, lfRect, hfRect, hzTicks } = useMemo(() => {
    const x = scaleLinear().domain([0, F_MAX]).range([MARGIN_X, VB_W - MARGIN_X])
    const hzTicks = x.ticks(5).map((v) => ({ pos: x(v), label: v.toFixed(1) }))
    if (psd.freqs.length < 2) {
      return { path: '', x, lfRect: null as null | number[], hfRect: null as null | number[], hzTicks }
    }

    let maxPower = 0
    for (const p of psd.power) if (p > maxPower) maxPower = p
    const y = scaleLinear()
      .domain([0, maxPower * 1.1 || 1])
      .range([plotBottom - 12, 12])

    const points = psd.freqs
      .map((f, i) => ({ f, p: psd.power[i] }))
      .filter((d) => d.f <= F_MAX)

    const gen = d3area<{ f: number; p: number }>()
      .x((d) => x(d.f))
      .y0(plotBottom - 12)
      .y1((d) => y(d.p))
      .curve(curveMonotoneX)

    return {
      path: gen(points) ?? '',
      x,
      lfRect: [x(LF_BAND[0]), x(LF_BAND[1])],
      hfRect: [x(HF_BAND[0]), x(HF_BAND[1])],
      hzTicks,
    }
  }, [psd, plotBottom])

  return (
    <div className="panel">
      <div className="panel__title">Frequency spectrum (PSD, Hz, last 60s)</div>
      <svg className="panel__svg panel__svg--wide" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {lfRect && (
          <rect x={lfRect[0]} y={0} width={lfRect[1] - lfRect[0]} height={plotBottom} className="band band--lf" />
        )}
        {hfRect && (
          <rect x={hfRect[0]} y={0} width={hfRect[1] - hfRect[0]} height={plotBottom} className="band band--hf" />
        )}
        <path d={path} className="trace trace--violet" />
        <text x={x((LF_BAND[0] + LF_BAND[1]) / 2)} y={plotBottom - 6} className="band-label">
          LF
        </text>
        <text x={x((HF_BAND[0] + HF_BAND[1]) / 2)} y={plotBottom - 6} className="band-label">
          HF
        </text>
        {hzTicks.map((tick, i) => (
          <text key={i} x={tick.pos} y={VB_H - 2} textAnchor="middle" className="axis-tick">
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
