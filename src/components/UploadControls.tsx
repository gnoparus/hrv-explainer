import { useRef, useState, type ChangeEvent } from 'react'
import { parseRRText } from '../sim/parseRRFile'
import type { ParsedRR } from '../sim/parseRRFile'

// `value` is parent-owned (App.tsx's uploadedData) rather than local state -- this component
// gets unmounted whenever the source toggle flips to "Simulated", and a purely local "loaded"
// state would reset to null on remount even though the parent still has the file active,
// making the picker misleadingly show "Choose file" for an already-loaded recording.
export function UploadControls({
  value,
  onLoaded,
}: {
  value: ParsedRR | null
  onLoaded: (data: ParsedRR | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file name after clearing
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseRRText(text, file.name)
      setError(null)
      onLoaded(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this file.')
      onLoaded(null)
    }
  }

  function clear() {
    setError(null)
    onLoaded(null)
  }

  return (
    <div className="controls control--upload">
      {value ? (
        <>
          <div className="upload-summary">
            <span className="upload-summary__name">{value.fileName}</span>
            <span className="upload-summary__stats">
              {value.points.length} beats · {Math.round(value.points[value.points.length - 1].t)}s recording
              {value.skippedLines > 0 &&
                ` · ${value.skippedLines} line${value.skippedLines === 1 ? '' : 's'} skipped (unreadable or implausible)`}
            </span>
          </div>
          <div className="preset-buttons">
            <button type="button" onClick={() => inputRef.current?.click()}>
              Load different file
            </button>
            <button type="button" onClick={clear}>
              Clear
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="control__preset-label" htmlFor="rr-upload">
            RR-interval file (CSV/txt, one value per line)
          </label>
          <div className="preset-buttons">
            <button type="button" onClick={() => inputRef.current?.click()}>
              Choose file
            </button>
          </div>
          {error && <div className="upload-error">{error}</div>}
        </>
      )}
      <input ref={inputRef} id="rr-upload" type="file" accept=".csv,.txt" onChange={handleFile} hidden />
    </div>
  )
}
