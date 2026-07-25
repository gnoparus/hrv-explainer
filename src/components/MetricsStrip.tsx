import { InfoTag } from './InfoTag'

interface MetricTileProps {
  label: string
  value: number
  unit: string
  colorVar: string
  info: string
}

function MetricTile({ label, value, unit, colorVar, info }: MetricTileProps) {
  return (
    <div className="metric-tile" style={{ ['--tile-color' as string]: `var(${colorVar})` }}>
      <div className="metric-tile__head">
        <span className="metric-tile__label">{label}</span>
        <InfoTag text={info} />
      </div>
      <div className="metric-tile__value">
        {value.toFixed(1)}
        <span className="metric-tile__unit">{unit}</span>
      </div>
    </div>
  )
}

export function MetricsStrip({
  rmssdMs,
  sdnnMs,
  lfPower,
  hfPower,
}: {
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
}) {
  return (
    <div className="metrics-strip-wrap">
      <div className="metrics-strip">
      <MetricTile
        label="RMSSD"
        value={rmssdMs}
        unit="ms"
        colorVar="--c-teal"
        info="Root mean square of successive RR differences. Mostly reflects vagal (parasympathetic) tone -- the primary short-term HRV outcome."
      />
      <MetricTile
        label="SDNN"
        value={sdnnMs}
        unit="ms"
        colorVar="--c-violet"
        info="Standard deviation of all RR intervals in the window. Reflects total variability from both branches of the autonomic nervous system."
      />
      <MetricTile
        label="HF power"
        value={hfPower}
        unit="ms²"
        colorVar="--c-teal"
        info="Spectral power 0.15-0.4 Hz. Respiration-linked, vagally mediated. At slow paced breathing (~6/min) the respiratory peak moves into the LF band, so HF power can drop even as RMSSD rises."
      />
      <MetricTile
        label="LF power"
        value={lfPower}
        unit="ms²"
        colorVar="--c-amber"
        info="Spectral power 0.04-0.15 Hz. Mixed baroreflex activity, not purely sympathetic. The classic 'LF/HF = sympathovagal balance' interpretation is now widely considered invalid -- shown here descriptively, not as a mechanistic index."
      />
      </div>
      <div className="metrics-strip__caption">rolling 60s window</div>
    </div>
  )
}
