export interface ParsedRR {
  points: { t: number; rrMs: number }[]
  fileName: string
}

// ponytail: supports the common single-value-per-line RR export (Kubios plain .txt, Polar RR
// recordings) -- takes the LAST numeric token on each line so an optional leading index/timestamp
// column doesn't get mistaken for the RR value. A trailing annotation/quality-flag column (rare
// in these exports) would be misread as the RR value; add real column detection if that surfaces.
export function parseRRText(text: string, fileName: string): ParsedRR {
  const rrMsValues: number[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const nums = rawLine
      .trim()
      .split(/[,;\t ]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
    if (nums.length === 0) continue
    rrMsValues.push(nums[nums.length - 1])
  }
  if (rrMsValues.length < 2) {
    throw new Error('No usable RR-interval values found in this file.')
  }

  // Real RR intervals are always in the 300-2000ms range. A run of values all under 10 is
  // almost certainly seconds (some Kubios exports use seconds), not milliseconds.
  const looksLikeSeconds = rrMsValues.every((v) => v < 10)
  const rr = looksLikeSeconds ? rrMsValues.map((v) => v * 1000) : rrMsValues

  let t = 0
  const points = rr.map((rrMs) => {
    t += rrMs / 1000
    return { t, rrMs }
  })
  return { points, fileName }
}
