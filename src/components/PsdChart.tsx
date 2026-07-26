import { useMemo } from 'react'
import { scaleLinear, area as d3area, curveMonotoneX } from 'd3'
import type { PsdResult } from '../sim/psd'
import { LF_BAND, HF_BAND } from '../sim/psd'

const VB_W = 600
const VB_H = 200
const F_MAX = 0.5
const MARGIN_X = 20
const MARGIN_B = 14

type Point = { f: number; p: number }

// Inserts a linearly-interpolated point at exactly targetF (if not already present) so
// band segments split from the same continuous series share an exact boundary coordinate
// -- otherwise adjacent segments (built from disjoint filtered arrays) don't touch and the
// area drops to baseline at each cut, and a band narrower than the FFT bin spacing can be
// left with zero interior points.
function insertBoundary(points: Point[], targetF: number): Point[] {
  if (points.length === 0 || targetF <= points[0].f || targetF >= points[points.length - 1].f) return points
  const idx = points.findIndex((p) => p.f > targetF)
  if (idx <= 0) return points
  if (points[idx - 1].f === targetF) return points
  const a = points[idx - 1]
  const b = points[idx]
  const t = (targetF - a.f) / (b.f - a.f)
  return [...points.slice(0, idx), { f: targetF, p: a.p + t * (b.p - a.p) }, ...points.slice(idx)]
}

export function PsdChart({ psd }: { psd: PsdResult }) {
  const plotBottom = VB_H - MARGIN_B

  const { lowPath, lfPath, hfPath, highPath, x, lfRect, hfRect, hzTicks } = useMemo(() => {
    const x = scaleLinear().domain([0, F_MAX]).range([MARGIN_X, VB_W - MARGIN_X])
    const hzTicks = x.ticks(5).map((v) => ({ pos: x(v), label: v.toFixed(1) }))
    const empty = { lowPath: '', lfPath: '', hfPath: '', highPath: '' }
    if (psd.freqs.length < 2) {
      return { ...empty, x, lfRect: null as null | number[], hfRect: null as null | number[], hzTicks }
    }

    let maxPower = 0
    for (const p of psd.power) if (p > maxPower) maxPower = p
    const y = scaleLinear()
      .domain([0, maxPower * 1.1 || 1])
      .range([plotBottom - 12, 12])

    let points: Point[] = psd.freqs.map((f, i) => ({ f, p: psd.power[i] })).filter((d) => d.f <= F_MAX)
    points = insertBoundary(points, LF_BAND[0])
    points = insertBoundary(points, LF_BAND[1])
    points = insertBoundary(points, HF_BAND[1])

    const gen = d3area<Point>()
      .x((d) => x(d.f))
      .y0(plotBottom - 12)
      .y1((d) => y(d.p))
      .curve(curveMonotoneX)

    // Split into 4 segments so the trace color follows the band it's over -- teal/amber
    // where the metrics are computed from, neutral gray for VLF/beyond-HF context. Boundary
    // points above are shared by the two segments they border, so segments touch exactly.
    const build = (filter: (d: Point) => boolean) => gen(points.filter(filter)) ?? ''

    return {
      lowPath: build((d) => d.f <= LF_BAND[0]),
      lfPath: build((d) => d.f >= LF_BAND[0] && d.f <= LF_BAND[1]),
      hfPath: build((d) => d.f >= HF_BAND[0] && d.f <= HF_BAND[1]),
      highPath: build((d) => d.f >= HF_BAND[1]),
      x,
      lfRect: [x(LF_BAND[0]), x(LF_BAND[1])],
      hfRect: [x(HF_BAND[0]), x(HF_BAND[1])],
      hzTicks,
    }
  }, [psd, plotBottom])

  const warming = psd.freqs.length < 2

  return (
    <div className="panel">
      <div className="panel__title">Frequency spectrum (PSD, Hz, last 60s)</div>
      <svg className="panel__svg panel__svg--wide" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {warming ? (
          <text x={VB_W / 2} y={VB_H / 2} textAnchor="middle" className="band-label">
            Collecting baseline…
          </text>
        ) : (
          <>
            {lfRect && (
              <rect x={lfRect[0]} y={0} width={lfRect[1] - lfRect[0]} height={plotBottom} className="band band--lf" />
            )}
            {hfRect && (
              <rect x={hfRect[0]} y={0} width={hfRect[1] - hfRect[0]} height={plotBottom} className="band band--hf" />
            )}
            <path d={lowPath} className="trace psd-trace--neutral" />
            <path d={lfPath} className="trace psd-trace--lf" />
            <path d={hfPath} className="trace psd-trace--hf" />
            <path d={highPath} className="trace psd-trace--neutral" />
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
          </>
        )}
      </svg>
    </div>
  )
}
