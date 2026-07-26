# Mission: HRV Physiology for hrvployyy's Thesis Defense

## Why
`hrvployyy` is being built for a live demo at an anti-aging-medicine master's
thesis defense, in front of doctors who already know ANS/HRV vocabulary. The
app has to carry physiology arguments (RSA resonance, LF/HF invalidity)
through direct manipulation, not prose — which means whoever presents it
needs to actually understand the underlying physiology well enough to field
questions from a clinician audience live, not just read text off tooltips.

## Success looks like
- Can explain, unprompted, why LF/HF is no longer accepted as a
  sympatho-vagal balance index, citing the specific mechanisms (mixed LF
  origin, non-linear PNS/SNS interaction, respiratory confound).
- Can defend every physiological claim baked into `hrvployyy`'s simulator
  (`src/sim/rrGenerator.ts`, `src/sim/psd.ts`) against a skeptical
  clinician's question, with a primary source to point to.
- Can explain what VLF and ULF power are (and are not) safe to claim from a
  short-term recording, since the app only simulates short windows.

## Constraints
- Time-boxed against the thesis defense date — depth should track what's
  actually demoed in the app, not a full HRV textbook.
- Learning happens in short sessions between other work on the repo; lessons
  need to be quick, single-concept wins (per the teach skill's design).

## Out of scope
- General cardiology/ECG interpretation beyond HRV.
- HRV in specific disease populations (heart failure, diabetes) unless the
  app's audience/demo scope expands to cover them.
- Time-domain-only HRV apps/wearables comparison — not relevant to this
  spectral-analysis-focused simulator.
