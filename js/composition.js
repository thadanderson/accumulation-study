/**
 * composition.js
 * AccumulationStudy — pure composition logic. No DOM, no audio, no side effects.
 *
 * ACCUMULATION RULE (forward phases, 1-indexed):
 *   Total forward phases = numPerformers + phraseLen - 1
 *
 *   At phase s:
 *     • Performer p is active if p ≤ s
 *     • Its pattern = phrase.slice(0, min(s − p + 1, phraseLen))
 *
 *   The phase with the highest step index is the "peak" — all performers are
 *   playing, though with different pattern lengths (staggered canon).
 *
 *   After the peak the process reverses: the forward phases (minus the peak)
 *   are replayed in reverse order, yielding a symmetric arch structure.
 *
 * POLYRHYTHM:
 *   Within a phase, all active performers play their patterns simultaneously
 *   and loop independently. Since patterns have different lengths, they fall
 *   naturally out of phase with each other.
 *
 *   At beat t (0-indexed within a phase):
 *     performer p plays pattern[t % pattern.length]
 *
 *   Phase duration (beats) = maxPatternLength × repsPerStep
 */
class AccumulationStudy {
  /**
   * @param {object}   cfg
   * @param {string[]} cfg.phrase         Array of note labels, 1–8 items
   * @param {number}   cfg.numPerformers  2–8
   * @param {number}   cfg.bpm            40–240
   * @param {number}   cfg.repsPerStep    1–8 repetitions of the pattern per phase
   */
  constructor({ phrase, numPerformers, bpm, repsPerStep }) {
    this.phrase        = phrase;
    this.phraseLen     = phrase.length;
    this.numPerformers = numPerformers;
    this.bpm           = bpm;
    this.repsPerStep   = repsPerStep;

    this.phases        = [];
    this.peakPhaseIdx  = -1;   // set by _buildPhases

    this._buildPhases();
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  _patternAt(step, performerIdx) {
    // performerIdx is 0-indexed; formula uses 1-indexed p
    const p = performerIdx + 1;
    if (p > step) return null;  // not yet active
    const len = Math.min(step - p + 1, this.phraseLen);
    return this.phrase.slice(0, len);
  }

  _patternDuration(pattern) {
    return pattern ? pattern.reduce((s, n) => s + n.dur, 0) : 0;
  }

  _buildForward() {
    const total = this.numPerformers + this.phraseLen - 1;
    const forward = [];

    for (let step = 1; step <= total; step++) {
      const performers = [];
      let maxLen = 0;
      let maxDur = 0;

      for (let pi = 0; pi < this.numPerformers; pi++) {
        const pattern = this._patternAt(step, pi);
        performers.push({ performerIndex: pi, pattern });
        if (pattern) {
          if (pattern.length > maxLen) maxLen = pattern.length;
          const dur = this._patternDuration(pattern);
          if (dur > maxDur) maxDur = dur;
        }
      }

      forward.push({
        step,
        direction:          'accumulating',
        performers,
        maxPatternLen:      maxLen,
        maxPatternDuration: maxDur,
        durationBeats:      maxDur * this.repsPerStep,
      });
    }

    return forward;
  }

  _buildPhases() {
    const forward = this._buildForward();
    this.peakPhaseIdx = forward.length - 1;

    // Reverse = forward minus the peak, flipped — direction label changes
    const reverse = forward
      .slice(0, -1)
      .reverse()
      .map(phase => ({ ...phase, direction: 'diminishing' }));

    this.phases = [...forward, ...reverse];
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * noteAtBeat — which note each performer plays at eighth-note tick `tick` in phase `phaseIdx`.
   * @param {number} phaseIdx
   * @param {number} tick      0-indexed eighth-note tick within the phase
   * @returns {{ performerIndex: number, note: string|null, noteIndex: number|null }[]}
   */
  noteAtBeat(phaseIdx, tick) {
    return this.phases[phaseIdx].performers.map(({ performerIndex, pattern }) => {
      if (!pattern) return { performerIndex, note: null, noteIndex: null };
      const totalDur = this._patternDuration(pattern);
      let t = tick % totalDur, acc = 0, noteIndex = 0;
      for (let i = 0; i < pattern.length; i++) {
        if (t < acc + pattern[i].dur) { noteIndex = i; break; }
        acc += pattern[i].dur;
      }
      return { performerIndex, note: pattern[noteIndex].note, noteIndex };
    });
  }

  get totalPhases() { return this.phases.length; }
}
