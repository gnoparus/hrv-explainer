import { useMemo } from 'react'
import { scaleLinear, area as d3area, line as d3line, curveMonotoneX } from 'd3'
import type { PsdResult } from '../sim/psd'
import { LF_BAND, HF_BAND } from '../sim/psd'
import type { PsdArResult } from '../sim/psdAr'
import { InfoTag } from './InfoTag'

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

const inLow = (d: Point) => d.f <= LF_BAND[0]
const inLf = (d: Point) => d.f >= LF_BAND[0] && d.f <= LF_BAND[1]
const inHf = (d: Point) => d.f >= HF_BAND[0] && d.f <= HF_BAND[1]
const inHigh = (d: Point) => d.f >= HF_BAND[1]

function toBandedPoints(freqs: number[], power: number[]): Point[] {
  let points: Point[] = freqs.map((f, i) => ({ f, p: power[i] })).filter((d) => d.f <= F_MAX)
  points = insertBoundary(points, LF_BAND[0])
  points = insertBoundary(points, LF_BAND[1])
  points = insertBoundary(points, HF_BAND[1])
  return points
}

export function PsdChart({ psd, psdAr, windowSeconds }: { psd: PsdResult; psdAr: PsdArResult; windowSeconds: number }) {
  const windowLabel = windowSeconds === 300 ? 'last 5 min' : `last ${windowSeconds}s`
  const plotBottom = VB_H - MARGIN_B

  const {
    lowPath,
    lfPath,
    hfPath,
    highPath,
    lowLine,
    lfLine,
    hfLine,
    highLine,
    lowLineAr,
    lfLineAr,
    hfLineAr,
    highLineAr,
    x,
    lfRect,
    hfRect,
    hzTicks,
  } = useMemo(() => {
    const x = scaleLinear().domain([0, F_MAX]).range([MARGIN_X, VB_W - MARGIN_X])
    const hzTicks = x.ticks(5).map((v) => ({ pos: x(v), label: v.toFixed(1) }))
    const empty = {
      lowPath: '',
      lfPath: '',
      hfPath: '',
      highPath: '',
      lowLine: '',
      lfLine: '',
      hfLine: '',
      highLine: '',
      lowLineAr: '',
      lfLineAr: '',
      hfLineAr: '',
      highLineAr: '',
    }
    if (psd.freqs.length < 2) {
      return { ...empty, x, lfRect: null as null | number[], hfRect: null as null | number[], hzTicks }
    }

    // Shared y-domain across both traces -- a per-trace rescale would silently mislead about
    // their relative peak heights.
    let maxPower = 0
    for (const p of psd.power) if (p > maxPower) maxPower = p
    for (const p of psdAr.power) if (p > maxPower) maxPower = p
    const y = scaleLinear()
      .domain([0, maxPower * 1.1 || 1])
      .range([plotBottom - 12, 12])

    const points = toBandedPoints(psd.freqs, psd.power)
    const arPoints = toBandedPoints(psdAr.freqs, psdAr.power)

    // Fill (closed shape, no stroke) and stroke (open line, no fill) are generated and
    // rendered separately -- a d3.area() path is closed, so stroking it also draws its
    // vertical closing edges at wherever that segment's point array starts/ends, which
    // would put a false colored cliff at each band boundary even though the fills
    // themselves touch exactly (shared boundary points, see insertBoundary above).
    const areaGen = d3area<Point>()
      .x((d) => x(d.f))
      .y0(plotBottom - 12)
      .y1((d) => y(d.p))
      .curve(curveMonotoneX)
    const lineGen = d3line<Point>()
      .x((d) => x(d.f))
      .y((d) => y(d.p))
      .curve(curveMonotoneX)

    const buildArea = (src: Point[], filter: (d: Point) => boolean) => areaGen(src.filter(filter)) ?? ''
    const buildLine = (src: Point[], filter: (d: Point) => boolean) => lineGen(src.filter(filter)) ?? ''

    return {
      lowPath: buildArea(points, inLow),
      lfPath: buildArea(points, inLf),
      hfPath: buildArea(points, inHf),
      highPath: buildArea(points, inHigh),
      lowLine: buildLine(points, inLow),
      lfLine: buildLine(points, inLf),
      hfLine: buildLine(points, inHf),
      highLine: buildLine(points, inHigh),
      // AR gets lines only, no fill -- two overlapping semi-transparent fills would make it
      // ambiguous which region belongs to which curve, whereas a dashed stroke unambiguously
      // reads as "the comparison overlay" rather than an equally-weighted second signal.
      lowLineAr: buildLine(arPoints, inLow),
      lfLineAr: buildLine(arPoints, inLf),
      hfLineAr: buildLine(arPoints, inHf),
      highLineAr: buildLine(arPoints, inHigh),
      x,
      lfRect: [x(LF_BAND[0]), x(LF_BAND[1])],
      hfRect: [x(HF_BAND[0]), x(HF_BAND[1])],
      hzTicks,
    }
  }, [psd, psdAr, plotBottom])

  const warming = psd.freqs.length < 2

  return (
    <div className="panel">
      <div className="panel__title">
        Frequency spectrum (PSD, Hz, {windowLabel})
        <InfoTag text="Solid = FFT/Welch periodogram (nonparametric, the established clinical default). Dashed = Burg autoregressive estimate (order shown in the metrics strip below) -- smoother, sharper peak resolution on short windows, but sensitive to the chosen model order. Expect them to broadly agree; large disagreement usually flags a poor AR order fit for this window, not a bad measurement." />
      </div>
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
            <path d={lowPath} className="psd-fill--neutral" />
            <path d={lfPath} className="psd-fill--lf" />
            <path d={hfPath} className="psd-fill--hf" />
            <path d={highPath} className="psd-fill--neutral" />
            <path d={lowLine} className="trace psd-trace--neutral" fill="none" />
            <path d={lfLine} className="trace psd-trace--lf" fill="none" />
            <path d={hfLine} className="trace psd-trace--hf" fill="none" />
            <path d={highLine} className="trace psd-trace--neutral" fill="none" />
            <path d={lowLineAr} className="trace psd-trace--neutral psd-trace--ar" fill="none" />
            <path d={lfLineAr} className="trace psd-trace--lf psd-trace--ar" fill="none" />
            <path d={hfLineAr} className="trace psd-trace--hf psd-trace--ar" fill="none" />
            <path d={highLineAr} className="trace psd-trace--neutral psd-trace--ar" fill="none" />
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
            <g className="psd-legend">
              <line x1={VB_W - 168} x2={VB_W - 140} y1={20} y2={20} className="psd-legend__swatch" />
              <text x={VB_W - 134} y={23} className="axis-tick">
                FFT/Welch
              </text>
              <line x1={VB_W - 168} x2={VB_W - 140} y1={34} y2={34} className="psd-legend__swatch psd-legend__swatch--ar" />
              <text x={VB_W - 134} y={37} className="axis-tick">
                Burg AR
              </text>
            </g>
          </>
        )}
      </svg>
    </div>
  )
}
