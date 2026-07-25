# HRV Explainer

Interactive R-R interval / HRV simulator. Drag breathing rate and vagal tone,
watch RMSSD, SDNN, and the LF/HF spectral split respond in real time. Built for
a live thesis-defense demo (HRV from consumer wearables in clinical
treatment) and as a teaching tool for the underlying physiology.

Live: https://hrv-explainer.pages.dev

## Physiology model

`src/sim/rrGenerator.ts` generates R-R intervals from two oscillators:

- **HF** (respiratory sinus arrhythmia) — amplitude follows a resonance curve
  peaking at ~0.1 Hz (6 breaths/min), not a constant. A constant HF amplitude
  would make RMSSD *fall* as breathing slows, which is backwards from real
  paced-breathing physiology.
- **LF** (baroreflex) — a band-limited stochastic (Ornstein-Uhlenbeck)
  process wandering around ~0.1 Hz within the 0.04-0.15 Hz LF band, present
  regardless of breathing rate. Deliberately not a fixed-frequency tone: a
  fixed 0.1 Hz LF oscillator sits right next to the HF oscillator's
  frequency at 6-12 breaths/min and beats against it, causing RMSSD to
  wobble non-monotonically in that range (issue #3).

LF/HF power is computed by integrating the actual PSD over each frequency
band (`src/sim/psd.ts`), not by attributing "the breathing oscillator" to HF —
at 6 breaths/min the respiratory peak sits at 0.1 Hz, inside the LF band, not
HF. This is deliberate: dragging breathing rate down to 6/min shows HF power
draining into LF *while RMSSD rises*, a live demonstration of why the
LF/HF-as-sympathovagal-balance interpretation is considered invalid (see the
tap-to-reveal info tags in the UI).

Run `npx tsx src/sim/selfcheck.ts` to verify the math: known-value RMSSD/SDNN
checks, a pure-sinusoid PSD peak-location check, the RMSSD-direction check
(6 breaths/min must produce higher RMSSD than 15/min), and an RMSSD
unimodality check across the 6-12 breaths/min resonance zone (no wobble).

## Development

```bash
npm install
npm run dev          # start dev server
npx tsc -b            # type-check
npx tsx src/sim/selfcheck.ts   # verify the HRV math
npm run build         # production build to dist/
npm run preview       # serve the production build locally
```

## Deploy

Static Cloudflare Pages site, no backend. All computation is client-side.

```bash
npm run build
npx wrangler pages deploy dist --project-name=hrv-explainer
```

CI (`.github/workflows/ci.yml`) runs type-check, the math self-check, and a
production build on every push/PR. CD (`.github/workflows/deploy.yml`)
deploys `main` to Cloudflare Pages automatically — requires the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets (see
Settings → Secrets and variables → Actions; token needs Pages:Edit
permission).

## Known limitations

- RMSSD peaks as a broad 6–12 breaths/min "resonance zone" rather than a
  single sharp point — scientifically defensible (real paced-breathing
  resonance is a broad zone, not a single frequency). Previously this zone
  also wobbled non-monotonically from beat-frequency interference between a
  fixed-frequency LF oscillator and the HF oscillator (issue #3); LF is now
  a band-limited stochastic process instead of a fixed tone, which reduces
  the wobble to residual seed-to-seed noise rather than a deterministic dip.
  Restoring the direction guarantee (6bpm RMSSD > 15bpm) without that fixed
  LF tone required narrowing the HF resonance curve, which makes HF power
  visibly thinner at fast breathing (20+ breaths/min) than before — a real
  tradeoff, not a free fix; see the `SIGMA_HF_HZ` comment in
  `src/sim/rrGenerator.ts`.
- Metrics (RMSSD/SDNN/PSD) compute over a rolling 60s window for live
  responsiveness, shorter than the clinical 5-minute short-term HRV standard
  used for the tachogram/Poincaré display. This is a deliberate trade for a
  live-interactive demo, not a clinical measurement tool.
- Export snapshot captures the three SVG charts only, not panel titles or the
  metrics strip.

## PWA / offline

Installable to iOS home screen; works fully offline after first load
(service worker precaches the full app + icons — verify with airplane mode
after a fresh install on the actual demo device before relying on it live).
