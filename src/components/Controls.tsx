import { useEffect, useState } from 'react'
import { BreathingPacer } from './BreathingPacer'

interface ControlsProps {
  breathingRateBrpm: number
  vagalTone: number
  onBreathingRateChange: (v: number) => void
  onVagalToneChange: (v: number) => void
  showPacer: boolean
  onTogglePacer: () => void
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function Controls({
  breathingRateBrpm,
  vagalTone,
  onBreathingRateChange,
  onVagalToneChange,
  showPacer,
  onTogglePacer,
}: ControlsProps) {
  const [breathingFocused, setBreathingFocused] = useState(false)
  const [breathingInput, setBreathingInput] = useState(breathingRateBrpm.toFixed(1))
  const [breathingClamped, setBreathingClamped] = useState(false)
  useEffect(() => {
    if (!breathingFocused) {
      setBreathingInput(breathingRateBrpm.toFixed(1))
      setBreathingClamped(false)
    }
  }, [breathingRateBrpm, breathingFocused])

  const [vagalFocused, setVagalFocused] = useState(false)
  const [vagalInput, setVagalInput] = useState(String(Math.round(vagalTone * 100)))
  const [vagalClamped, setVagalClamped] = useState(false)
  useEffect(() => {
    if (!vagalFocused) {
      setVagalInput(String(Math.round(vagalTone * 100)))
      setVagalClamped(false)
    }
  }, [vagalTone, vagalFocused])

  return (
    <div className="controls">
      <div className="control">
        <div className="control__breathing-head">
          <label htmlFor="breathing-rate">
            Breathing rate <strong>{breathingRateBrpm.toFixed(1)}</strong> breaths/min
          </label>
          <button type="button" className="pacer-toggle" aria-pressed={showPacer} onClick={onTogglePacer}>
            Pacer
          </button>
        </div>
        <div className="control__row">
          <input
            id="breathing-rate"
            type="range"
            min={6}
            max={24}
            step={0.5}
            value={breathingRateBrpm}
            onChange={(e) => onBreathingRateChange(Number(e.target.value))}
          />
          <input
            className={`control__number${breathingClamped ? ' control__number--clamped' : ''}`}
            type="number"
            inputMode="decimal"
            aria-label="Breathing rate, breaths per minute"
            min={6}
            max={24}
            step={0.5}
            value={breathingInput}
            onFocus={() => setBreathingFocused(true)}
            onBlur={() => setBreathingFocused(false)}
            onChange={(e) => {
              const raw = e.target.value
              setBreathingInput(raw)
              const parsed = Number(raw)
              if (raw !== '' && !Number.isNaN(parsed)) {
                setBreathingClamped(parsed < 6 || parsed > 24)
                onBreathingRateChange(clamp(parsed, 6, 24))
              }
            }}
          />
        </div>
        {showPacer && <BreathingPacer breathingRateBrpm={breathingRateBrpm} />}
      </div>

      <div className="control">
        <label htmlFor="vagal-tone">
          Vagal tone <strong>{Math.round(vagalTone * 100)}%</strong>
        </label>
        <div className="control__row">
          <input
            id="vagal-tone"
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={vagalTone}
            onChange={(e) => onVagalToneChange(Number(e.target.value))}
          />
          <input
            className={`control__number${vagalClamped ? ' control__number--clamped' : ''}`}
            type="number"
            inputMode="numeric"
            aria-label="Vagal tone, percent"
            min={10}
            max={100}
            step={1}
            value={vagalInput}
            onFocus={() => setVagalFocused(true)}
            onBlur={() => setVagalFocused(false)}
            onChange={(e) => {
              const raw = e.target.value
              setVagalInput(raw)
              const parsed = Number(raw)
              if (raw !== '' && !Number.isNaN(parsed)) {
                setVagalClamped(parsed < 10 || parsed > 100)
                onVagalToneChange(clamp(parsed, 10, 100) / 100)
              }
            }}
          />
        </div>
      </div>

      <div className="control control--presets">
        <span className="control__preset-label">Vagal tone preset</span>
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
