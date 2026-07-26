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
  function hfAmplitudeMs(brpm) {
    var fHz = hzOf(brpm);
    var gauss = Math.exp(-Math.pow(fHz - F_RES_HZ, 2) / (2 * SIGMA_HF_HZ * SIGMA_HF_HZ));
    return A_HF_FLOOR_MS + (A_HF_PEAK_MS - A_HF_FLOOR_MS) * gauss;
  }

  // Simplified teaching proxy: successive-difference RMS ~ amplitude * frequency
  // (see src/sim/rrGenerator.ts comment). Not the exact discrete-sampling RMSSD.
  function rmssdProxy(ampMs, brpm) {
    return ampMs * hzOf(brpm);
  }

  function inBand(fHz, band) {
    return fHz >= band[0] && fHz <= band[1];
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

    var hfPower = inBand(fHz, HF_BAND) ? respPower : 0;
    var lfPower = baroreflexLfPower + (inBand(fHz, LF_BAND) ? respPower : 0);

    return { hfPower: hfPower, lfPower: lfPower, fHz: fHz };
  }

  return {
    LF_BAND: LF_BAND,
    HF_BAND: HF_BAND,
    hzOf: hzOf,
    hfAmplitudeMs: hfAmplitudeMs,
    rmssdProxy: rmssdProxy,
    bandPower: bandPower,
  };
})();
