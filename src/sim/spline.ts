// Natural cubic spline through (xs[i], ys[i]), xs strictly increasing.
// Returns a function sampling the spline at any x within [xs[0], xs[last]].
export function naturalCubicSpline(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length
  if (n < 3) {
    // Fall back to linear for degenerate input.
    return (x: number) => {
      let i = 0
      while (i < n - 2 && xs[i + 1] < x) i++
      const t = (x - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }

  const h = new Array(n - 1)
  for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i]

  // Solve tridiagonal system for second derivatives (natural boundary: c[0]=c[n-1]=0).
  const alpha = new Array(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1])
  }

  const l = new Array(n).fill(1)
  const mu = new Array(n).fill(0)
  const z = new Array(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]
    mu[i] = h[i] / l[i]
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]
  }

  const c = new Array(n).fill(0)
  const b = new Array(n).fill(0)
  const d = new Array(n).fill(0)
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1]
    b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3
    d[j] = (c[j + 1] - c[j]) / (3 * h[j])
  }

  return (x: number) => {
    let i = 0
    while (i < n - 2 && xs[i + 1] < x) i++
    const dx = x - xs[i]
    return ys[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx
  }
}
