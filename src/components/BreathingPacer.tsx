// Felt demonstration of resonance breathing: a ring that expands on the inhale half of the
// cycle and contracts on the exhale half, paced to the breathing-rate slider. Pure CSS
// animation (duration derived from the prop) -- no animation library needed for one shape.
export function BreathingPacer({ breathingRateBrpm }: { breathingRateBrpm: number }) {
  const cycleSeconds = 60 / breathingRateBrpm
  return (
    <div className="breathing-pacer" aria-hidden="true">
      <div className="breathing-pacer__ring" style={{ animationDuration: `${cycleSeconds}s` }} />
    </div>
  )
}
