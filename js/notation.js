/**
 * notation.js
 * NotationRenderer — VexFlow 4 implementation.
 *
 * Renders one treble clef stave per performer showing the current phase's
 * patterns as quarter notes. Inactive performers (pattern = null) get heavily
 * grayed rests. Accumulated-but-not-yet-active slots get lighter rests.
 *
 * During playback, _setNoteColor() colors all SVG shapes within the active
 * note group directly — no re-render needed per beat.
 *
 * Depends on VexFlow loaded before this script via CDN in index.html.
 * All API accessed through the global `Vex.Flow.*`.
 */

// 'C4' → 'c/4',  'C5' → 'c/5'
function labelToVexKey(label) {
  return label[0].toLowerCase() + '/' + label.slice(-1);
}

class NotationRenderer {
  constructor(container) {
    this.container = container;
    // [{ pi, slot, el }] — rendered SVG <g> elements for real notes only
    this._noteRefs = [];
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * renderPhase — draw one treble stave per performer for the given phase.
   * Clears and rebuilds the SVG from scratch on every phase change.
   *
   * @param {AccumulationStudy} study
   * @param {number}            phaseIdx
   */
  renderPhase(study, phaseIdx) {
    if (typeof Vex === 'undefined') {
      console.warn('[NotationRenderer] VexFlow not loaded — skipping notation');
      return;
    }

    this.container.innerHTML = '';
    this._noteRefs = [];

    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;
    const phase     = study.phases[phaseIdx];
    const phraseLen = study.phraseLen;
    const numP      = study.numPerformers;

    // ── Layout constants ────────────────────────────────────────────────────
    const labelW = 36;                              // left margin for P-labels
    const staveX = labelW + 8;
    const staveW = Math.max(260, phraseLen * 54 + 60); // scale with phrase length
    const staveH = 95;                              // vertical spacing per stave
    const totalW = staveX + staveW + 12;
    const totalH = numP * staveH + 24;

    // Single SVG element holds all staves
    const renderer = new Renderer(this.container, Renderer.Backends.SVG);
    renderer.resize(totalW, totalH);
    const ctx = renderer.getContext();

    phase.performers.forEach(({ performerIndex: pi, pattern }) => {
      const staveY = 12 + pi * staveH;

      // ── Stave ─────────────────────────────────────────────────────────────
      const stave = new Stave(staveX, staveY, staveW);
      stave.addClef('treble');
      stave.setContext(ctx).draw();

      // ── Performer label (raw SVG — avoids VexFlow font API quirks) ────────
      const svg = this.container.querySelector('svg');
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', '4');
      txt.setAttribute('y', String(staveY + 30));
      txt.setAttribute('font-size', '11');
      txt.setAttribute('font-weight', 'bold');
      txt.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      txt.setAttribute('fill', '#6b7280');
      txt.textContent = `P${pi + 1}`;
      svg.appendChild(txt);

      // ── Notes ─────────────────────────────────────────────────────────────
      const notes = [];

      for (let slot = 0; slot < phraseLen; slot++) {
        let sn;
        if (pattern && slot < pattern.length) {
          // Active note in this performer's pattern
          sn = new StaveNote({ keys: [labelToVexKey(pattern[slot])], duration: 'q' });
        } else {
          // Quarter rest — color varies by reason
          sn = new StaveNote({ keys: ['b/4'], duration: 'qr' });
          if (!pattern) {
            // Performer hasn't entered yet — very light
            sn.setStyle({ fillStyle: '#e9eaec', strokeStyle: '#e9eaec' });
          } else {
            // Note not yet accumulated — medium light
            sn.setStyle({ fillStyle: '#d1d5db', strokeStyle: '#d1d5db' });
          }
        }
        notes.push(sn);
      }

      // ── Voice → Formatter → draw ─────────────────────────────────────────
      const voice = new Voice({ num_beats: phraseLen, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], staveW - 36);
      voice.draw(ctx, stave);

      // ── Store SVG element refs for live highlighting ───────────────────────
      // VexFlow prefixes rendered element IDs with 'vf-'
      notes.forEach((sn, slot) => {
        if (pattern && slot < pattern.length) {
          const el = document.getElementById('vf-' + sn.attrs.id);
          if (el) this._noteRefs.push({ pi, slot, el });
        }
      });
    });
  }

  /**
   * highlightBeat — accent the sounding notehead for each performer.
   * Called every beat tick during playback.
   *
   * @param {object} phase  Current phase from study.phases
   * @param {number} beat   0-indexed beat within the phase
   */
  highlightBeat(phase, beat) {
    // Reset all notes to default color
    this._noteRefs.forEach(({ el }) => this._setNoteColor(el, ''));

    // Accent the active slot for each performing voice
    phase.performers.forEach(({ performerIndex: pi, pattern }) => {
      if (!pattern) return;
      const slot = beat % pattern.length;
      const ref  = this._noteRefs.find(r => r.pi === pi && r.slot === slot);
      if (ref) this._setNoteColor(ref.el, '#2563eb');
    });
  }

  /**
   * clearHighlight — remove all beat highlighting without re-rendering.
   * Called on stop and between generations.
   */
  clearHighlight() {
    this._noteRefs.forEach(({ el }) => this._setNoteColor(el, ''));
  }

  /**
   * clear — wipe the container and drop all state.
   */
  clear() {
    this.container.innerHTML = '';
    this._noteRefs = [];
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /**
   * _setNoteColor — apply `color` to every SVG shape inside a note group.
   * Passing '' removes the inline style, reverting to the VexFlow default (black).
   */
  _setNoteColor(el, color) {
    if (!el) return;
    el.querySelectorAll('path, ellipse, rect').forEach(shape => {
      shape.style.fill   = color;
      shape.style.stroke = color;
    });
  }
}
