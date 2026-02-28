/**
 * utils.js
 * Constants and pure helper functions shared across all modules.
 */

// All available scales / modes (C4–C5 range)
const SCALES = {
  // Church modes rooted on C
  'C Major':            ['C4','D4','E4','F4','G4','A4','B4','C5'],
  'C Dorian':           ['C4','D4','Eb4','F4','G4','A4','Bb4','C5'],
  'C Phrygian':         ['C4','Db4','Eb4','F4','G4','Ab4','Bb4','C5'],
  'C Lydian':           ['C4','D4','E4','F#4','G4','A4','B4','C5'],
  'C Mixolydian':       ['C4','D4','E4','F4','G4','A4','Bb4','C5'],
  'C Natural Minor':    ['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5'],
  'C Locrian':          ['C4','Db4','Eb4','F4','Gb4','Ab4','Bb4','C5'],
  // Minor variants
  'C Harmonic Minor':   ['C4','D4','Eb4','F4','G4','Ab4','B4','C5'],
  'C Melodic Minor':    ['C4','D4','Eb4','F4','G4','A4','B4','C5'],
  // Pentatonic
  'C Major Pentatonic': ['C4','D4','E4','G4','A4','C5'],
  'C Minor Pentatonic': ['C4','Eb4','F4','G4','Bb4','C5'],
  // Symmetric & other
  'C Blues':            ['C4','Eb4','F4','F#4','G4','Bb4','C5'],
  'C Whole Tone':       ['C4','D4','E4','F#4','Ab4','Bb4','C5'],
  'C Diminished':       ['C4','D4','Eb4','F4','F#4','Ab4','A4','B4','C5'],
  'Chromatic':          ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5'],
};

// Default scale for backward compatibility
const SCALE = SCALES['C Major'];

// Equal-temperament frequencies (A4 = 440 Hz) — full chromatic C4–C5
const NOTE_FREQ = {
  C4:  261.63, 'C#4': 277.18, Db4: 277.18,
  D4:  293.66, 'D#4': 311.13, Eb4: 311.13,
  E4:  329.63,
  F4:  349.23, 'F#4': 369.99, Gb4: 369.99,
  G4:  392.00, 'G#4': 415.30, Ab4: 415.30,
  A4:  440.00, 'A#4': 466.16, Bb4: 466.16,
  B4:  493.88,
  C5:  523.25,
};

/**
 * randomPhrase — pick `len` notes at random from `scale`.
 * @param {number}   len    1–8 (clamped)
 * @param {string[]} scale  Array of note labels to draw from (defaults to SCALE)
 * @returns {string[]}
 */
function randomPhrase(len = 4, scale = SCALE) {
  const n = Math.max(1, Math.min(8, len));
  return Array.from({ length: n }, () =>
    scale[Math.floor(Math.random() * scale.length)]
  );
}

/**
 * applySyncopation — converts a string[] phrase to {note, dur}[] by randomly
 * assigning eighth-note duration (dur=1) to notes based on `probability`.
 * Notes not syncopated keep quarter-note duration (dur=2).
 * @param {string[]} phrase
 * @param {number}   probability  0–1
 * @returns {{ note: string, dur: number }[]}
 */
function applySyncopation(phrase, probability) {
  return phrase.map(note => ({
    note,
    dur: Math.random() < probability ? 1 : 2,
  }));
}

/**
 * bpmToMs — duration of one quarter-note beat in milliseconds.
 * @param {number} bpm
 * @returns {number}
 */
function bpmToMs(bpm) {
  return (60 / bpm) * 1000;
}
