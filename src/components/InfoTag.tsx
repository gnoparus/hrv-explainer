import { useState } from 'react'

// Tap-to-reveal definition, touch-first (no hover dependency).
export function InfoTag({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="info-tag">
      <button
        type="button"
        className="info-tag__btn"
        aria-label="What is this metric?"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        i
      </button>
      {open && (
        <span className="info-tag__popover" role="tooltip" onClick={() => setOpen(false)}>
          {text}
        </span>
      )}
    </span>
  )
}
