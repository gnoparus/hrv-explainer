// Shared retrieval-practice quiz checker, used by every lesson's recall-check block.
function checkAnswer(inputId, accepted, feedbackId) {
  var val = document.getElementById(inputId).value.trim().toLowerCase();
  var el = document.getElementById(feedbackId);
  var ok = accepted.some(function (a) { return a.toLowerCase() === val; });
  el.textContent = ok ? "Correct." : "Not quite — see section above and try again.";
  el.className = "feedback " + (ok ? "correct" : "incorrect");
}
