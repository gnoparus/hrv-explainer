# HRV Physiology Resources

## Knowledge

- [Billman, G.E. (2013) "The LF/HF ratio does not accurately measure cardiac sympatho-vagal balance." *Frontiers in Physiology*, 4:26.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3576706/)
  The primary critique this workspace's first lesson is built on. Disproves
  the "LF/HF = sympatho-vagal balance" hypothesis via four flawed
  assumptions (mixed LF origin, non-linear PNS/SNS interaction, respiratory
  confound) and pharmacological-blockade evidence (Randall et al. 1991).
  Use for: anything about why LF/HF is contested.

- [Task Force of the European Society of Cardiology and the North American Society of Pacing and Electrophysiology (1996) "Heart rate variability: Standards of measurement, physiological interpretation, and clinical use." *Circulation*, 93:1043-1065.](https://doi.org/10.1161/01.CIR.93.5.1043)
  The original standardization paper — defines the VLF/LF/HF/ULF frequency
  bands and the orthodox interpretation Billman's critique pushes against.
  Use for: exact band definitions, the historical "sympatho-vagal balance"
  framing before it was contested.

- [Shaffer, F. & Ginsberg, J.P. (2017) "An Overview of Heart Rate Variability Metrics and Norms." *Frontiers in Public Health*, 5:258.](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2017.00258/full)
  Accessible, well-cited synthesis of Task Force band definitions plus later
  critiques (cites Billman directly). Good first-pass overview before going
  to primary sources for a specific claim.
  Use for: band definitions table, VLF/ULF recording-duration requirements,
  a fast orientation before deep-diving a primary source.

- [Lehrer, P.M. & Gevirtz, R. (2014) "Heart rate variability biofeedback: how and why does it work?" *Frontiers in Psychology*, 5:756.](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00756)
  Primary source for lesson 2 (RSA resonance curve). Explains resonance-frequency breathing (~0.1 Hz / 6 cpm, individually 4.5–7 cpm) via baroreflex-RSA interaction.
  Use for: anything about why paced slow breathing raises HRV, the physiological mechanism behind the app's `hfAmplitudeMs()` resonance curve.

- [Russoniello, C.V., Zhirnov, Y.N., Pougatchev, V.I. & Gribkov, E.N. (2013) "Heart Rate Variability and Biological Age: Implications for Health and Gaming." *Cyberpsychology, Behavior, and Social Networking*.](https://pubmed.ncbi.nlm.nih.gov/23574369/)
  Fetched and read past the title for lesson 3 — dual-aim study: validates PPG
  against ECG for HRV, and separately asks which HRV variable best predicts
  ANS/biological aging. The variable with the strongest age correlation
  (r=−0.67) was *maximum variation of heart rate*, not RMSSD.
  Use for: "HRV has been proposed as a biological-age marker" (supports the
  aim). Do NOT use to claim RMSSD specifically was validated as an age
  marker — it wasn't the variable that won in this paper.

- [Choi, J., Cha, W. & Park, M.G. (2020) "Declining Trends of Heart Rate Variability According to Aging in Healthy Asian Adults." *Frontiers in Aging Neuroscience*, 12:610626.](https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2020.610626/full)
  Cross-sectional, n=291 healthy adults ages 19–69, single time point per
  person. All HRV indices decline with age (p<0.001); HRV-index R²=0.298,
  SDNN R²=0.343, LF R²=0.414.
  Use for: "HRV declines with chronological age" as a population-level,
  between-person finding. Do NOT use to support a within-person trend claim
  (e.g. "this session's rise means this person got younger") — that's a
  different kind of evidence this study doesn't provide.

- [Martinez, C. et al. (2024) "How to properly evaluate cardiac vagal tone in oncology studies: a state-of-the-art review." *Journal of the National Cancer Center*.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11256691/)
  Measurement-methodology review, scoped to cardiac vagal tone assessment in
  cancer patients. Validates RMSSD as a good vagal-tone estimate; notes RMSSD
  is "not a survival prognostic factor" in that population (SDNN does
  better there). Says nothing about aging.
  Use for: "RMSSD is a validated vagal-tone measure" — general claim, oncology-
  specific source. Do NOT use for anything about age.

## Gaps

- No primary source yet on what *should* be said instead of LF/HF for
  autonomic balance (e.g. respiratory sinus arrhythmia amplitude,
  time-domain vagal indices like RMSSD, or direct microneurography) — needed
  for a follow-up lesson once VLF/ULF pitfalls are covered.
- No source yet specifically on short-term-recording validity limits for
  VLF (Shaffer & Ginsberg gives "at least 5 min" but flags mechanism
  uncertainty even then) — worth a primary source if a future lesson
  isolates VLF/ULF as its own topic.
- No source yet defending `A_LF_BASE_MS` scaling LF amplitude off the same
  `vagalTone` slider that drives HF — a candidate lesson 4, since LF's mixed
  sympathetic/parasympathetic origin (lesson 1) makes that coupling an easy
  target for a clinician who's paying attention.
- No longitudinal (within-person, repeated-measures) HRV/biological-age
  study found yet — this is the specific evidence type `SessionHistory.tsx`'s
  copy would need to be fully defensible as written; worth searching for if
  the app copy itself gets revisited.

## Wisdom (Communities)

- Not yet explored. The thesis-defense mission is presentation-facing, not
  community-facing — revisit if the user wants peer feedback on the
  physiology framing itself (e.g. an HRV research forum) before the defense.
