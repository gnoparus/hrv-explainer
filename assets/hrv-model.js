// Shared HRV model math for lesson widgets. Mirrors hrvployyy's own
// src/sim/rrGenerator.ts / src/sim/psd.ts constants so lesson widgets stay
// consistent with what the app actually computes, not a divorced toy model.
// vagalTone is fixed at 1 throughout -- these are teaching widgets, not the
// full parameterized simulator.

var HRV_MODEL = (function () {
  var A_HF_FLOOR_MS = 8;
  var A_HF_PEAK_MS = 60;
  var F_RES_HZ = 0.1;
  var SIGMA_HF_HZ = 0.095;
  var A_LF_BASE_MS = 25; // baroreflex floor, vagalTone = 1 -> A_LF_BASE_MS * 1.0

  var LF_BAND = [0.04, 0.15];
  var HF_BAND = [0.15, 0.4];

  function hzOf(brpm) {
    return brpm / 60;
  }

  // Respiratory (RSA) oscillator amplitude -- resonance curve peaking at 0.1 Hz.
  // vagalTone defaults to 1 (matches the fixed assumption noted above) so
  // existing callers that pass only brpm are unaffected.
  function hfAmplitudeMs(brpm, vagalTone) {
    if (vagalTone === undefined) vagalTone = 1;
    var fHz = hzOf(brpm);
    var gauss = Math.exp(-Math.pow(fHz - F_RES_HZ, 2) / (2 * SIGMA_HF_HZ * SIGMA_HF_HZ));
    return vagalTone * (A_HF_FLOOR_MS + (A_HF_PEAK_MS - A_HF_FLOOR_MS) * gauss);
  }

  // Baroreflex (LF) oscillator amplitude -- see src/sim/rrGenerator.ts
  // lfAmplitudeMs(). Lesson 4's subject: this scales off vagalTone with no
  // cited physiological derivation, unlike hfAmplitudeMs's resonance curve.
  function lfAmplitudeMs(vagalTone) {
    if (vagalTone === undefined) vagalTone = 1;
    return A_LF_BASE_MS * (0.5 + 0.5 * vagalTone);
  }

  // Simplified teaching proxy: successive-difference RMS ~ amplitude * frequency
  // (see src/sim/rrGenerator.ts comment). Not the exact discrete-sampling RMSSD.
  function rmssdProxy(ampMs, brpm) {
    return ampMs * hzOf(brpm);
  }

  // LF_BAND and HF_BAND share the boundary at 0.15 Hz -- treat it as HF
  // (matches Task Force convention: bands are [lo, hi), except the top band).
  // A single boolean, reused everywhere a band decision is made, so the
  // widget's "which band" label and its power split can never disagree at
  // the boundary itself.
  function isHf(fHz) {
    return fHz >= HF_BAND[0];
  }

  // Single-oscillator power split: the respiratory oscillator's power goes
  // entirely to whichever band its current frequency falls in (power ~ amplitude^2).
  // The baroreflex LF process contributes a roughly-constant floor to LF
  // regardless of breathing rate. Real app additionally has this LF process
  // wander stochastically; here it's held at its mean for a stable widget.
  function bandPower(brpm) {
    var fHz = hzOf(brpm);
    var respAmp = hfAmplitudeMs(brpm);
    var respPower = respAmp * respAmp;
    var baroreflexLfPower = A_LF_BASE_MS * A_LF_BASE_MS;
    var respInHf = isHf(fHz);

    var hfPower = respInHf ? respPower : 0;
    var lfPower = baroreflexLfPower + (respInHf ? 0 : respPower);

    return { hfPower: hfPower, lfPower: lfPower, fHz: fHz, isHf: respInHf };
  }

  // True maximum either bar can reach across the whole slider domain --
  // amplitude peaks exactly at 0.1 Hz, which sits inside LF_BAND, so that's
  // where LF power maxes out (baroreflex floor + peak respiratory power).
  // Fixed, not recomputed per frame, so bar height means the same thing on
  // every drag step instead of rescaling around whatever's on screen.
  var MAX_BAND_POWER = A_LF_BASE_MS * A_LF_BASE_MS + A_HF_PEAK_MS * A_HF_PEAK_MS;

  return {
    LF_BAND: LF_BAND,
    HF_BAND: HF_BAND,
    MAX_BAND_POWER: MAX_BAND_POWER,
    hzOf: hzOf,
    isHf: isHf,
    hfAmplitudeMs: hfAmplitudeMs,
    lfAmplitudeMs: lfAmplitudeMs,
    rmssdProxy: rmssdProxy,
    bandPower: bandPower,
  };
})();
