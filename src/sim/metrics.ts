// RR intervals in milliseconds.

export function rmssd(rr: number[]): number {
  if (rr.length < 2) return 0
  let sumSq = 0
  for (let i = 1; i < rr.length; i++) {
    const d = rr[i] - rr[i - 1]
    sumSq += d * d
  }
  return Math.sqrt(sumSq / (rr.length - 1))
}

export function sdnn(rr: number[]): number {
  if (rr.length < 2) return 0
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length
  const variance = rr.reduce((a, b) => a + (b - mean) ** 2, 0) / (rr.length - 1)
  return Math.sqrt(variance)
}
