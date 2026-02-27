/**
 * utils.js
 * Constants and pure helper functions shared across all modules.
 */

// C-major diatonic scale, C4–C5
const SCALE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

// Equal-temperament frequencies (A4 = 440 Hz)
const NOTE_FREQ = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
};

/**
 * randomPhrase — pick `len` notes at random from SCALE.
 * @param {number} len  1–8 (clamped)
 * @returns {string[]}
 */
function randomPhrase(len = 4) {
  const n = Math.max(1, Math.min(8, len));
  return Array.from({ length: n }, () =>
    SCALE[Math.floor(Math.random() * SCALE.length)]
  );
}

/**
 * bpmToMs — duration of one quarter-note beat in milliseconds.
 * @param {number} bpm
 * @returns {number}
 */
function bpmToMs(bpm) {
  return (60 / bpm) * 1000;
}
