# RMSSD's biological-age claim: real citations, one overreaching sentence

All three papers cited on the RMSSD tile (Russoniello 2013, Choi 2020,
Martinez 2024) are real, checked by fetching each one rather than trusting
titles or search snippets — see [[0001-lf-hf-sympathovagal-balance-invalid]]
for why that distrust-by-default habit matters here too.

Each paper supports its specific narrow claim: Choi shows HRV declines with
chronological age (cross-sectional, R²≈0.3); Martinez validates RMSSD as a
vagal-tone measure (oncology-scoped); Russoniello supports "HRV has been
proposed as a biological-age marker" as its stated aim, though the variable
that actually won in that paper was maximum HR variation, not RMSSD.

`MetricsStrip.tsx`'s tooltip is hedged ("has been proposed as... a trend
worth watching, not a fixed trajectory") and matches what these papers show.
`SessionHistory.tsx`'s panel note is not — "a rising trend tracks a younger
biological-age profile" asserts a within-person longitudinal claim that no
cited paper tests (Choi is between-person; Russoniello's significant
correlate is a different variable). This is a candidate app-copy follow-up,
not something fixed in this workspace — the teach workspace doesn't touch
`main`.

The generalizable skill this produced: checking whether a citation supports
its *exact* attached claim (aim vs. secondary finding, cross-sectional vs.
longitudinal, right variable vs. a correlated stand-in, right population) is
a distinct, repeatable check from "is this citation real." Captured as
`reference/claim-strength-checklist.html` so it's reusable for the next
undefended claim — starting with `A_LF_BASE_MS` coupling LF amplitude to the
same `vagalTone` slider as HF (flagged in `RESOURCES.md`'s Gaps as a
candidate lesson 4).
