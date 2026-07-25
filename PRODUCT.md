# Product

## Register

product

## Users

Primary: doctors in an anti-aging-medicine master's program, evaluating this
live at a thesis defense — a clinician audience that already knows ANS/HRV
vocabulary, not students encountering it for the first time. Secondary:
students/self-learners exploring HRV physiology hands-on afterward. Both are
watching a screen, not reading a manual — the interface has to carry the
argument (RSA amplitude follows a resonance curve, LF/HF-as-balance is
invalid) through direct manipulation and real-time numeric/visual feedback,
not prose.

## Product Purpose

An interactive R-R interval / HRV simulator: drag breathing rate and vagal
tone, watch RMSSD, SDNN, and the LF/HF spectral split respond live. It exists
to make two physiology arguments demonstrable rather than merely stated —
that HF amplitude is resonance-shaped (not constant), and that the
LF/HF-as-sympathovagal-balance interpretation breaks down under paced
breathing. Success is a committee member, or a student, seeing the effect
happen under their own slider drag, not being told about it.

## Brand Personality

Clinical, precise, alive. Reads like a bedside monitor — dark theme, glowing
teal/violet/amber traces, a heartbeat pulse-dot — engineered instrument
credibility, not a decorated dashboard. "Alive" is literal: values and
traces should visibly respond to input, not just update.

## Anti-references

- Generic SaaS dashboard (cream backgrounds, card grids, gradient text,
  hero-metric tiles) — this is a clinical instrument, not a B2B product.
- Static textbook/paper-figure look — flat, printed, non-responsive. The
  whole point is that it's live under the presenter's hand, not a diagram.

## Design Principles

- Show, don't tell — the resonance curve and the LF/HF band-crossover are
  demonstrated by dragging a slider, not explained in a paragraph next to it.
- Instrument-grade legibility over decoration — every glow/pulse effect
  earns its place by reinforcing "this is live," never purely ornamental.
- One screen, no navigation — the whole argument fits in view during a
  live demo; nothing should require scrolling or clicking through screens
  mid-presentation.
- Numbers you can trust at a glance — tabular-nums, stable layout, no
  jitter that would undercut credibility in front of a thesis committee.

## Accessibility & Inclusion

- WCAG AA contrast minimum for all text and UI against the dark panels.
- Respect `prefers-reduced-motion`: pulse-dot flash and metric-tile glow-
  breathe animations need a static/instant alternative.
