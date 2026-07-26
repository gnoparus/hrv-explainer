export interface Preset {
  key: string
  label: string
  breathingRateBrpm: number
  vagalTone: number
}

// Named scenarios for instant switching mid-demo (?preset=<key>) instead of dragging sliders
// under pressure. Mirrors the Young/Older presets already in Controls.tsx plus two combined
// breathing+vagal-tone scenarios useful for side-by-side contrast.
export const PRESETS: Preset[] = [
  { key: 'young-athlete', label: 'Young athlete', breathingRateBrpm: 6, vagalTone: 0.85 },
  { key: 'stressed-older', label: 'Stressed, older', breathingRateBrpm: 18, vagalTone: 0.25 },
]

export function getPreset(key: string | null): Preset | undefined {
  if (!key) return undefined
  return PRESETS.find((p) => p.key === key)
}
