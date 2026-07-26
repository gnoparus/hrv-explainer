import { useMemo, useState } from 'react'
import { scaleLinear, line as d3line, curveMonotoneX } from 'd3'
import type { Session } from '../sim/sessionStore'

const SPARK_W = 600
const SPARK_H = 120
const SPARK_MARGIN = 12

function Sparkline({ sessions }: { sessions: Session[] }) {
  const { path, gridY } = useMemo(() => {
    const values = sessions.map((s) => s.rmssdMs)
    const x = scaleLinear()
      .domain([0, Math.max(1, sessions.length - 1)])
      .range([SPARK_MARGIN, SPARK_W - SPARK_MARGIN])
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    // Pad around the actual min/max instead of anchoring at 0 -- with a realistic 2-3 saved
    // sessions per demo, close RMSSD values (e.g. 17.5ms/17.9ms) rendered against a 0-anchored
    // domain draw as a flat line. The maxV*0.05/1ms floors keep some pad when every value is
    // identical, where (maxV-minV)*0.2 alone would collapse to 0.
    const pad = Math.max((maxV - minV) * 0.2, maxV * 0.05, 1)
    const y = scaleLinear()
      .domain([minV - pad, maxV + pad])
      .range([SPARK_H - SPARK_MARGIN, SPARK_MARGIN])
    const lineGen = d3line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return { path: lineGen(values) ?? '', gridY: y(mean) }
  }, [sessions])

  return (
    <div className="panel">
      <div className="panel__title">RMSSD trend across saved sessions</div>
      <svg className="panel__svg panel__svg--wide" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}>
        <line x1={SPARK_MARGIN} y1={gridY} x2={SPARK_W - SPARK_MARGIN} y2={gridY} className="gridline" />
        <path d={path} className="trace trace--teal" fill="none" />
      </svg>
    </div>
  )
}

function CompareTable({ sessions }: { sessions: Session[] }) {
  // Explicit column count, not repeat(auto-fit, ...) -- auto-fit's repeat count is computed
  // treating the other 1fr (label) track as its max-content contribution, which collapses
  // the value columns to 1 instead of one-per-session. Session count is known here (<=3).
  const gridTemplateColumns = `1fr repeat(${sessions.length}, minmax(70px, 1fr))`
  return (
    <div className="panel">
      <div className="panel__title">Compare ({sessions.length} selected)</div>
      <div className="compare-table">
        <div className="compare-table__row compare-table__row--head" style={{ gridTemplateColumns }}>
          <span />
          {sessions.map((s) => (
            <span key={s.id}>{new Date(s.timestamp).toLocaleTimeString()}</span>
          ))}
        </div>
        {(
          [
            ['RMSSD ms', 'rmssdMs', '--c-teal'],
            ['SDNN ms', 'sdnnMs', '--c-violet'],
            ['HF power', 'hfPower', '--c-teal'],
            ['LF power', 'lfPower', '--c-amber'],
          ] as const
        ).map(([label, key, colorVar]) => (
          <div className="compare-table__row" key={key} style={{ gridTemplateColumns }}>
            <span className="compare-table__label">{label}</span>
            {sessions.map((s) => (
              <span key={s.id} className="compare-table__value" style={{ color: `var(${colorVar})` }}>
                {s[key].toFixed(1)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SessionHistory({ sessions, onDelete }: { sessions: Session[]; onDelete: (id: string) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="session-history">
        <div className="session-history__empty">
          Save a session from the Live tab to start building a history — drag the sliders,
          hit <strong>Save session</strong>, and it will show up here for comparison and trend
          tracking across runs.
        </div>
      </div>
    )
  }

  const selectedSessions = sessions.filter((s) => selected.includes(s.id))

  return (
    <div className="session-history">
      {sessions.length > 1 && <Sparkline sessions={sessions} />}
      {selectedSessions.length >= 2 && <CompareTable sessions={selectedSessions} />}

      <div className="session-list">
        {sessions
          .slice()
          .reverse()
          .map((s) => (
            <div className="session-list__row" key={s.id}>
              <label className="session-list__select">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggleSelect(s.id)}
                  aria-label={`Select session from ${new Date(s.timestamp).toLocaleString()} for comparison`}
                />
              </label>
              <span className="session-list__time">{new Date(s.timestamp).toLocaleString()}</span>
              <span className="session-list__params">
                {s.breathingRateBrpm.toFixed(1)} br/min · {Math.round(s.vagalTone * 100)}% vagal ·{' '}
                {s.metricsWindow === 'clinical' ? '5min' : '60s'}
              </span>
              <span className="session-list__metric" style={{ color: 'var(--c-teal)' }}>
                {s.rmssdMs.toFixed(1)} ms
              </span>
              <span className="session-list__metric" style={{ color: 'var(--c-violet)' }}>
                {s.sdnnMs.toFixed(1)} ms
              </span>
              <button
                type="button"
                className="session-list__delete"
                onClick={() => onDelete(s.id)}
                aria-label={`Delete session from ${new Date(s.timestamp).toLocaleString()}`}
              >
                ✕
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
