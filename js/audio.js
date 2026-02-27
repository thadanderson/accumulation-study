/**
 * audio.js
 * AudioEngine stub — interface defined, implementation pending.
 *
 * TODO: Implement with Tone.js
 *   import * as Tone from 'https://cdn.jsdelivr.net/npm/tone@latest/build/Tone.js';
 *
 * Each performer will get its own synth voice so timbre and panning can
 * distinguish voices (e.g., slightly different oscillator types or pan positions).
 */
class AudioEngine {
  constructor() {
    this._ready = false;
    // TODO: this._synths = [];  // one Tone.Synth per performer
  }

  /**
   * init — must be called inside a user-gesture handler to unlock AudioContext.
   * @returns {Promise<void>}
   */
  async init() {
    if (this._ready) return;
    // TODO: await Tone.start();
    // TODO: this._synths = Array.from({ length: 8 }, (_, i) =>
    //   new Tone.Synth({ oscillator: { type: 'triangle' } })
    //     .toDestination()
    // );
    this._ready = true;
    console.info('[AudioEngine] stub — audio not yet implemented (Tone.js pending)');
  }

  /**
   * playNote — trigger a note on the given performer's synth voice.
   * @param {number} performerIndex  0-indexed
   * @param {string} note            e.g. 'C4'
   * @param {number} durationMs      note duration in milliseconds
   */
  playNote(performerIndex, note, durationMs) {
    if (!this._ready) return;
    // TODO: const duration = Tone.Time(durationMs / 1000).toNotation();
    //       this._synths[performerIndex].triggerAttackRelease(note, duration);
  }

  /**
   * stop — silence all voices immediately.
   */
  stop() {
    if (!this._ready) return;
    // TODO: this._synths.forEach(s => s.triggerRelease());
    //       Tone.Transport.stop();
  }
}
