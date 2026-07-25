import { useMemo } from 'react'
import { scaleLinear, area as d3area, curveMonotoneX } from 'd3'
import type { PsdResult } from '../sim/psd'
import { LF_BAND, HF_BAND } from '../sim/psd'

const VB_W = 600
const VB_H = 200
const F_MAX = 0.5

export function PsdChart({ psd }: { psd: PsdResult }) {
  const { path, x, lfRect, hfRect } = useMemo(() => {
    const x = scaleLinear().domain([0, F_MAX]).range([0, VB_W])
    if (psd.freqs.length < 2) {
      return { path: '', x, lfRect: null as null | number[], hfRect: null as null | number[] }
    }

    let maxPower = 0
    for (const p of psd.power) if (p > maxPower) maxPower = p
    const y = scaleLinear()
      .domain([0, maxPower * 1.1 || 1])
      .range([VB_H - 12, 12])

    const points = psd.freqs
      .map((f, i) => ({ f, p: psd.power[i] }))
      .filter((d) => d.f <= F_MAX)

    const gen = d3area<{ f: number; p: number }>()
      .x((d) => x(d.f))
      .y0(VB_H - 12)
      .y1((d) => y(d.p))
      .curve(curveMonotoneX)

    return {
      path: gen(points) ?? '',
      x,
      lfRect: [x(LF_BAND[0]), x(LF_BAND[1])],
      hfRect: [x(HF_BAND[0]), x(HF_BAND[1])],
    }
  }, [psd])

  return (
    <div className="panel">
      <div className="panel__title">Frequency spectrum (PSD, last 60s)</div>
      <svg className="panel__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        {lfRect && (
          <rect x={lfRect[0]} y={0} width={lfRect[1] - lfRect[0]} height={VB_H} className="band band--lf" />
        )}
        {hfRect && (
          <rect x={hfRect[0]} y={0} width={hfRect[1] - hfRect[0]} height={VB_H} className="band band--hf" />
        )}
        <path d={path} className="trace trace--violet" />
        <text x={x((LF_BAND[0] + LF_BAND[1]) / 2)} y={VB_H - 2} className="band-label">
          LF
        </text>
        <text x={x((HF_BAND[0] + HF_BAND[1]) / 2)} y={VB_H - 2} className="band-label">
          HF
        </text>
      </svg>
    </div>
  )
}
