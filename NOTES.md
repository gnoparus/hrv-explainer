# Notes

- User wants spectral-pitfall lessons grouped by natural topic cluster
  (LF/HF + VLF/ULF together) rather than split into one narrow lesson per
  claim, when the topics share a root cause (over-interpreting spectral
  bands). Apply this clustering judgment to future lesson scoping too.
- User already arrives with citation-level prior knowledge on some claims
  (see [[0001-lf-hf-sympathovagal-balance-invalid]]) — check learning
  records before assuming a claim needs full introduction from scratch.
- Repo convention: all branch/workspace file work happens in a git worktree
  under `.claude/worktrees/<name>` (primary dir stays on `main`). This
  teach workspace lives in `.claude/worktrees/teach-hrv-physiology`.
- User wants lessons visual/interactive (confirmed after seeing lesson 2's
  slider widget) — this is the default going forward for skills-heavy
  lessons, not just an occasional add-on. Keep the app itself restrained
  per PRODUCT.md's anti-textbook stance; interactivity belongs in the teach
  workspace, not the deployed instrument.
- Caught a real bug this way: shipped a widget whose prose claimed "RMSSD
  rises smoothly toward the 6 br/min peak," but the widget's own formula
  (amplitude × frequency) actually peaks nearer 10 br/min, inside the
  broader 6–12 zone — verified by hand-computing several points, not by
  eyeballing the chart. Lesson: when a widget computes a derived quantity,
  numerically check a few points before writing prose about its shape —
  don't trust the intuitive claim just because the underlying amplitude
  curve does peak exactly where expected.
