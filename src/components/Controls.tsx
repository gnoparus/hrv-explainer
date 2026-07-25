interface ControlsProps {
  breathingRateBrpm: number
  vagalTone: number
  onBreathingRateChange: (v: number) => void
  onVagalToneChange: (v: number) => void
}

export function Controls({
  breathingRateBrpm,
  vagalTone,
  onBreathingRateChange,
  onVagalToneChange,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="control">
        <label htmlFor="breathing-rate">
          Breathing rate <strong>{breathingRateBrpm.toFixed(1)}</strong> breaths/min
        </label>
        <input
          id="breathing-rate"
          type="range"
          min={6}
          max={24}
          step={0.5}
          value={breathingRateBrpm}
          onChange={(e) => onBreathingRateChange(Number(e.target.value))}
        />
      </div>

      <div className="control">
        <label htmlFor="vagal-tone">
          Vagal tone <strong>{Math.round(vagalTone * 100)}%</strong>
        </label>
        <input
          id="vagal-tone"
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={vagalTone}
          onChange={(e) => onVagalToneChange(Number(e.target.value))}
        />
      </div>

      <div className="control control--presets">
        <span className="control__preset-label">Age preset</span>
        <div className="preset-buttons">
          <button type="button" onClick={() => onVagalToneChange(0.85)}>
            Young
          </button>
          <button type="button" onClick={() => onVagalToneChange(0.25)}>
            Older
          </button>
        </div>
      </div>
    </div>
  )
}
