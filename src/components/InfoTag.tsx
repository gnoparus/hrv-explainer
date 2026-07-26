import { useEffect, useRef, useState } from 'react'

// Tap-to-reveal definition, touch-first (no hover dependency).
const POPOVER_WIDTH = 240
const VIEWPORT_MARGIN = 8

export function InfoTag({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [popoverLeft, setPopoverLeft] = useState(0)
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
        onClick={() => {
          if (!open && ref.current) {
            // Clamp against both viewport edges (not a binary left/right flip) -- a tag
            // near the left edge can overflow left just as easily as one near the right
            // edge overflows right once the popover is that wide.
            const rect = ref.current.getBoundingClientRect()
            const minOffset = VIEWPORT_MARGIN - rect.left
            const maxOffset = window.innerWidth - VIEWPORT_MARGIN - POPOVER_WIDTH - rect.left
            setPopoverLeft(Math.min(Math.max(0, minOffset), maxOffset))
          }
          setOpen((o) => !o)
        }}
      >
        i
      </button>
      {open && (
        <span className="info-tag__popover" role="tooltip" style={{ left: popoverLeft }} onClick={() => setOpen(false)}>
          {text}
        </span>
      )}
    </span>
  )
}
