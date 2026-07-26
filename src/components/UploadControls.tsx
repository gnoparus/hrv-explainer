import { useRef, useState, type ChangeEvent } from 'react'
import { parseRRText } from '../sim/parseRRFile'
import type { ParsedRR } from '../sim/parseRRFile'

export function UploadControls({ onLoaded }: { onLoaded: (data: ParsedRR | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState<ParsedRR | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file name after clearing
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseRRText(text, file.name)
      setLoaded(parsed)
      setError(null)
      onLoaded(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this file.')
      setLoaded(null)
      onLoaded(null)
    }
  }

  function clear() {
    setLoaded(null)
    setError(null)
    onLoaded(null)
  }

  return (
    <div className="controls control--upload">
      {loaded ? (
        <>
          <div className="upload-summary">
            <span className="upload-summary__name">{loaded.fileName}</span>
            <span className="upload-summary__stats">
              {loaded.points.length} beats · {Math.round(loaded.points[loaded.points.length - 1].t)}s recording
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
