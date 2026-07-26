# LF amplitude/vagal-tone coupling: no defense exists, and that's the honest answer

`rrGenerator.ts`'s `lfAmplitudeMs(vagalTone)` scales LF amplitude off the
same `vagalTone` slider that drives HF (`hfAmplitudeMs`), with no comment or
citation — unlike HF, whose resonance-curve derivation is fully documented
(see [[0001-lf-hf-sympathovagal-balance-invalid]]).

Went looking for a source that would defend the coupling and didn't find
one — instead found the opposite. Billman (2013) already established LF is
mixed-origin, not purely sympathetic. The next candidate explanation —
Rahman & Goldstein (2011), LF reflects baroreflex gain rather than raw
sympathetic tone — looked promising, but Martelli et al. (2014) tested it
directly via implanted cardiac sympathetic nerve recordings in sheep and
rejected it: LF HRV tracked neither CSNA nor directly-measured baroreflex
sensitivity. So the honest defense of the app's single-slider design isn't
"we modeled the shared mechanism" — it's "no single mechanism is well
enough established to model, so we didn't pretend one exists." That's a
different, weaker-sounding but more defensible answer than the instinct to
search for a validating citation.

Generalizable pattern for future lessons: when a code choice has no
citation, don't assume it's indefensible by default OR reach for the first
plausible-sounding paper — check whether the *literature itself* still
disagrees. Here it does, all the way down to direct physiological
measurement (Martelli's nerve recordings > any HRV-only inference). The
[[claim-strength-checklist]] reference doc's checks (aim vs. secondary
finding, right variable, effect size) extend naturally to a fourth check
this lesson surfaced: has a proposed mechanism itself been directly tested
and rejected by a *later, more rigorous* study? Citing an early reframe
without checking whether it survived is its own kind of overreach.
