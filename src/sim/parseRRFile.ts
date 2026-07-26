export interface ParsedRR {
  points: { t: number; rrMs: number }[]
  fileName: string
  skippedLines: number
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// Real RR intervals are always in this range (20-200bpm). Applied AFTER unit conversion, so a
// stray already-ms value in an otherwise-seconds file (e.g. a leftover "800" among "0.80"s)
// gets caught here instead of becoming 800000ms and dominating recording duration, RMSSD/SDNN,
// and every chart's scale.
const RR_MIN_MS = 300
const RR_MAX_MS = 2000

// ponytail: supports the common single-value-per-line RR export (Kubios plain .txt, Polar RR
// recordings) -- takes the LAST numeric token on each line so an optional leading index/timestamp
// column doesn't get mistaken for the RR value. A trailing annotation/quality-flag column (rare
// in these exports) would be misread as the RR value; add real column detection if that surfaces.
export function parseRRText(text: string, fileName: string): ParsedRR {
  const rrMsValues: number[] = []
  let skippedLines = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    if (trimmed === '') continue
    const nums = trimmed
      .split(/[,;\t ]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
    if (nums.length === 0) {
      skippedLines += 1
      continue
    }
    rrMsValues.push(nums[nums.length - 1])
  }
  if (rrMsValues.length < 2) {
    throw new Error('No usable RR-interval values found in this file.')
  }

  // Use the median rather than requiring every value to agree -- one stray bad line or unit
  // typo shouldn't flip the interpretation of the entire file the way `.every()` did.
  const looksLikeSeconds = median(rrMsValues) < 10
  const converted = looksLikeSeconds ? rrMsValues.map((v) => v * 1000) : rrMsValues

  const rr: number[] = []
  for (const v of converted) {
    if (v >= RR_MIN_MS && v <= RR_MAX_MS) rr.push(v)
    else skippedLines += 1
  }
  if (rr.length < 2) {
    throw new Error('No usable RR-interval values found in this file.')
  }

  let t = 0
  const points = rr.map((rrMs) => {
    t += rrMs / 1000
    return { t, rrMs }
  })
  return { points, fileName, skippedLines }
}
