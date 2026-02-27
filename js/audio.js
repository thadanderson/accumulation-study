/**
 * audio.js
 * AudioEngine — Tone.js implementation.
 *
 * Each performer gets its own Synth voice, spread across the stereo field.
 * All voices share a reverb send for a subtle sense of space.
 *
 * Depends on Tone.js loaded before this script via CDN in index.html.
 */
class AudioEngine {
  constructor() {
    this._ready         = false;
    this._synths        = [];
    this._reverb        = null;
    this._numPerformers = 0;
  }

  /**
   * init — unlock the AudioContext and build synth voices.
   * Must be called inside a user-gesture handler (the Play button click).
   * Safe to call again if numPerformers changes; disposes and recreates voices.
   *
   * @param {number} numPerformers  Voices to create (1–8)
   * @returns {Promise<void>}
   */
  async init(numPerformers = 4) {
    // Unlock AudioContext — safe to call multiple times, resolves immediately
    // after the first successful call.
    await Tone.start();

    // Nothing to do if already set up for this performer count
    if (this._ready && numPerformers === this._numPerformers) return;

    // Tear down previous voices
    this._synths.forEach(s => s.dispose());
    if (this._reverb) this._reverb.dispose();

    this._numPerformers = numPerformers;

    // Shared reverb — subtle room without muddying the polyphony
    this._reverb = new Tone.Reverb({ decay: 1.2, wet: 0.15 });
    await this._reverb.ready;   // IR generation is async
    this._reverb.toDestination();

    // One synth per performer, spread left-to-right across the stereo field
    this._synths = Array.from({ length: numPerformers }, (_, i) => {
      // Pan range: -0.7 (left) → +0.7 (right)
      const pan = numPerformers > 1
        ? -0.7 + (i / (numPerformers - 1)) * 1.4
        : 0;

      const panner = new Tone.Panner(pan).connect(this._reverb);

      // Alternate triangle/sine so adjacent voices have slightly different timbre
      return new Tone.Synth({
        oscillator: { type: i % 2 === 0 ? 'triangle' : 'sine' },
        envelope: {
          attack:  0.01,
          decay:   0.08,
          sustain: 0.6,
          release: 0.3,
        },
        volume: -14,
      }).connect(panner);
    });

    this._ready = true;
  }

  /**
   * playNote — trigger a note on a performer's voice.
   * @param {number} performerIndex  0-indexed
   * @param {string} note            Tone.js note name, e.g. 'C4'
   * @param {number} durationMs      Note duration in milliseconds
   */
  playNote(performerIndex, note, durationMs) {
    if (!this._ready) return;
    const synth = this._synths[performerIndex];
    if (!synth) return;
    synth.triggerAttackRelease(note, durationMs / 1000, Tone.now());
  }

  /**
   * stop — release all active voices immediately.
   */
  stop() {
    if (!this._ready) return;
    const now = Tone.now();
    this._synths.forEach(s => {
      try { s.triggerRelease(now); } catch { /* already idle */ }
    });
  }
}
