import { useEffect, useRef, useState } from 'react'

// Tap-to-reveal definition, touch-first (no hover dependency).
export function InfoTag({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span className="info-tag" ref={ref}>
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
