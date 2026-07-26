# HRV Simulator

Interactive R-R interval / HRV simulator. Drag breathing rate and vagal tone,
watch RMSSD, SDNN, and the LF/HF spectral split respond in real time. Built for
a live thesis-defense demo (HRV from consumer wearables in clinical
treatment) and as a teaching tool for the underlying physiology.

Live: https://hrv-explainer.pages.dev

Add `?preset=<key>` to the URL to jump straight to a named scenario instead
of dragging sliders live (`young-athlete`, `stressed-older` — see
`src/sim/presets.ts`).

## Features

- **Live tab** — the simulator: drag breathing rate/vagal tone, watch RMSSD,
  SDNN, LF/HF, tachogram, PSD, and Poincaré plot respond in real time.
- **Metrics window toggle** ("60s live" / "5 min clinical") — switch the
  metrics strip and PSD chart between the fast 60s window and the clinical
  5-minute standard.
- **Data source toggle** ("Simulated" / "Uploaded") — swap the RR-interval
  simulator for a real recording (CSV/txt, one RR value per line —
  `src/sim/parseRRFile.ts`). Sliders are replaced by a file picker while a
  file is loaded; all charts and metrics run on the uploaded series unchanged.
- **Breathing pacer** — an optional expanding/contracting ring paced to the
  breathing-rate slider, for a felt (not just numeric) resonance demo.
- **History tab** — save a session snapshot (params + metrics) to
  `localStorage`, compare up to 3 saved sessions side by side, and see an
  RMSSD trend across all saved sessions.

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
- Metrics (RMSSD/SDNN/PSD) default to a rolling 60s window for live
  responsiveness, shorter than the clinical 5-minute short-term HRV standard.
  A toggle above the metrics strip ("60s live" / "5 min clinical") switches
  to the full 5-minute window on demand — it reads "gathering… Ns/300s"
  until enough data has buffered, rather than showing a misleading partial
  number.
- Export snapshot captures the three SVG charts only, not panel titles or the
  metrics strip.
- Session history (`localStorage`, capped at 20) is per-browser, per-device —
  no export, sync, or account. Clearing site data clears it.
- The uploaded-file parser (`src/sim/parseRRFile.ts`) supports one RR value
  per line (optionally with a leading index/timestamp column — it reads the
  last numeric token per line), auto-detecting seconds vs. milliseconds by
  magnitude. It does not handle multi-column formats with a trailing
  quality-flag column, or binary export formats.
- Live capture from a Bluetooth heart-rate strap and an alternate AR/Burg
  frequency-domain method are tracked as open issues (#24, #25) but not
  implemented — the file-upload path above is the only real-data input today.

## PWA / offline

Installable to iOS home screen; works fully offline after first load
(service worker precaches the full app + icons — verify with airplane mode
after a fresh install on the actual demo device before relying on it live).
