/**
 * main.js
 * App controller — wires the UI to AccumulationStudy and drives visual playback.
 *
 * Depends on (loaded before this file via <script> tags):
 *   utils.js       → SCALE, NOTE_FREQ, randomPhrase, bpmToMs
 *   composition.js → AccumulationStudy
 *   audio.js       → AudioEngine
 *   notation.js    → NotationRenderer (stub)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PHRASE = 8;

// ── App State ─────────────────────────────────────────────────────────────────

const state = {
  phrase:          [],    // string[] — the melodic cell being built
  study:           null,  // AccumulationStudy | null
  playback:        null,  // Playback | null
  instruments:     [],    // string[] of instrument IDs, one per performer
  currentPhaseIdx: 0,     // tracks which phase is currently displayed
};

const audio = new AudioEngine();
let   notation = null;

// ── DOM Refs ──────────────────────────────────────────────────────────────────

const elNumPerformers    = document.getElementById('numPerformers');
const elBpm              = document.getElementById('bpm');
const elRepsPerStep      = document.getElementById('repsPerStep');
const elSyncopation      = document.getElementById('syncopation');
const elSyncopationValue = document.getElementById('syncopation-value');
const elScaleSelect      = document.getElementById('scale-select');
const elNotePalette   = document.getElementById('note-palette');
const elPhrasePreview = document.getElementById('phrase-preview');
const elBtnRandom     = document.getElementById('btn-random-phrase');
const elBtnClear      = document.getElementById('btn-clear-phrase');
const elBtnGenerate   = document.getElementById('btn-generate');
const elBtnPlay       = document.getElementById('btn-play');
const elBtnStop       = document.getElementById('btn-stop');
const elTimeline             = document.getElementById('timeline');
const elPhaseInfo            = document.getElementById('phase-info');
const elPhaseChips           = document.getElementById('phase-chips');
const elScoreNotation        = document.getElementById('score-notation');
const elTabNotation          = document.getElementById('tab-notation');
const elTabScore             = document.getElementById('tab-score');
const elInstrumentSelectors  = document.getElementById('instrument-selectors');
const elScoreHeader          = document.getElementById('score-header');
const elScoreGrid            = document.getElementById('score-grid');
const elNotationContainer    = document.getElementById('notation-container');

// ── Tab switching ──────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    elTabNotation.hidden = tab !== 'notation';
    elTabScore.hidden    = tab !== 'score';
  });
});

// ── Note Palette ──────────────────────────────────────────────────────────────

function getCurrentScale() {
  return SCALES[elScaleSelect.value] || SCALE;
}

function buildNotePalette() {
  elNotePalette.innerHTML = '';
  getCurrentScale().forEach(label => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.textContent = label;
    btn.title       = `Add ${label} to phrase`;
    // Accidentals (sharps / flats) have length > 2: C#4, Db4, Bb4, etc.
    if (label.length > 2) btn.classList.add('black-key');
    btn.addEventListener('click', () => addNote(label));
    elNotePalette.appendChild(btn);
  });
}

elScaleSelect.addEventListener('change', () => {
  state.phrase = [];
  buildNotePalette();
  renderPhrasePreview();
});

elSyncopation.addEventListener('input', () => {
  elSyncopationValue.textContent = `${elSyncopation.value}%`;
});

function addNote(label) {
  if (state.phrase.length >= MAX_PHRASE) return;
  state.phrase.push(label);
  renderPhrasePreview();
}

function removeNote(index) {
  state.phrase.splice(index, 1);
  renderPhrasePreview();
}

function renderPhrasePreview() {
  elPhrasePreview.innerHTML = '';

  if (state.phrase.length === 0) {
    const hint = document.createElement('span');
    hint.className   = 'phrase-hint';
    hint.textContent = 'Click notes above to build a melodic cell (up to 8 notes)';
    elPhrasePreview.appendChild(hint);
    return;
  }

  state.phrase.forEach((label, i) => {
    const chip = document.createElement('span');
    chip.className   = 'phrase-chip';
    chip.textContent = `${label} ×`;
    chip.title       = 'Click to remove';
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.addEventListener('click', () => removeNote(i));
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') removeNote(i);
    });
    elPhrasePreview.appendChild(chip);
  });
}

elBtnRandom.addEventListener('click', () => {
  const len = Math.floor(Math.random() * 5) + 3; // 3–7 notes
  state.phrase = randomPhrase(len, getCurrentScale());
  renderPhrasePreview();
});

elBtnClear.addEventListener('click', () => {
  state.phrase = [];
  renderPhrasePreview();
});

// ── Generate ──────────────────────────────────────────────────────────────────

elBtnGenerate.addEventListener('click', () => {
  // Auto-seed phrase if empty
  if (state.phrase.length === 0) {
    state.phrase = randomPhrase(4, getCurrentScale());
    renderPhrasePreview();
  }

  stopPlayback();

  const numPerformers = clamp(parseInt(elNumPerformers.value, 10), 2, 8);
  const bpm           = clamp(parseInt(elBpm.value, 10), 40, 240);
  const repsPerStep   = clamp(parseInt(elRepsPerStep.value, 10), 1, 8);
  const probability   = parseInt(elSyncopation.value, 10) / 100;
  const rhythmicPhrase = applySyncopation(state.phrase, probability);

  state.study = new AccumulationStudy({
    phrase: rhythmicPhrase,
    numPerformers,
    bpm,
    repsPerStep,
  });

  notation = new NotationRenderer(elNotationContainer);

  buildTimeline(state.study);
  buildInstrumentSelectors(numPerformers);

  // Reset active tab to Notation
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="notation"]').classList.add('active');
  elTabNotation.hidden = false;
  elTabScore.hidden    = true;

  buildScoreGrid(state.study, 0);

  elTimeline.hidden        = false;
  elScoreNotation.hidden   = false;
  elBtnPlay.disabled       = false;
  elBtnStop.disabled       = true;
});

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// ── Instrument Selectors ──────────────────────────────────────────────────────

function buildInstrumentSelectors(numPerformers) {
  elInstrumentSelectors.innerHTML = '';
  state.instruments = Array(numPerformers).fill('concert');
  for (let pi = 0; pi < numPerformers; pi++) {
    const row = document.createElement('div');
    row.className = 'instrument-row';
    const lbl = document.createElement('span');
    lbl.className   = 'performer-label';
    lbl.textContent = `P${pi + 1}`;
    const sel = document.createElement('select');
    sel.dataset.pi = pi;
    INSTRUMENTS.forEach(({ id, label }) => {
      const opt = document.createElement('option');
      opt.value       = id;
      opt.textContent = label;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      state.instruments[pi] = sel.value;
      if (notation) notation.renderPhase(state.study, state.currentPhaseIdx, state.instruments);
    });
    row.appendChild(lbl);
    row.appendChild(sel);
    elInstrumentSelectors.appendChild(row);
  }
}

// ── Score Grid ────────────────────────────────────────────────────────────────

/**
 * buildScoreGrid — renders the performer rows for phase `phaseIdx`.
 * Shows phraseLen cells per performer; unearned notes are grayed out.
 * Rebuilds on every phase change (cheap at musical tempos).
 */
function buildScoreGrid(study, phaseIdx) {
  state.currentPhaseIdx = phaseIdx;
  elScoreGrid.innerHTML = '';
  const phase = study.phases[phaseIdx];

  // Header
  const dir = phaseIdx === study.peakPhaseIdx ? 'peak'
    : phase.direction === 'accumulating' ? '▲ accumulating'
    : '▼ diminishing';

  elScoreHeader.textContent =
    `Phase ${phaseIdx + 1} of ${study.totalPhases} · ${dir}`;

  // Performer rows
  for (let pi = 0; pi < study.numPerformers; pi++) {
    const { pattern } = phase.performers[pi];

    const row = document.createElement('div');
    row.className = 'performer-row';

    const label = document.createElement('div');
    label.className   = 'performer-label';
    label.textContent = `P${pi + 1}`;
    row.appendChild(label);

    const cells = document.createElement('div');
    cells.className = 'note-cells';

    for (let slot = 0; slot < study.phraseLen; slot++) {
      const cell = document.createElement('div');
      cell.className      = 'note-cell';
      cell.dataset.pi     = pi;
      cell.dataset.slot   = slot;

      if (!pattern || slot >= pattern.length) {
        cell.classList.add('silent');
      } else {
        cell.classList.add('active-voice');
        cell.textContent = pattern[slot].note;
        if (pattern[slot].dur === 1) cell.classList.add('dur-eighth');
      }

      cells.appendChild(cell);
    }

    row.appendChild(cells);
    elScoreGrid.appendChild(row);
  }

  // Render notation for this phase (no-op if VexFlow unavailable)
  if (notation) notation.renderPhase(study, phaseIdx, state.instruments);
}

function highlightBeat(phaseIdx, tick) {
  // Clear previous highlight
  elScoreGrid.querySelectorAll('.note-cell.playing').forEach(c =>
    c.classList.remove('playing')
  );

  state.study.noteAtBeat(phaseIdx, tick).forEach(({ performerIndex: pi, noteIndex }) => {
    if (noteIndex === null) return;
    const cell = elScoreGrid.querySelector(
      `.note-cell[data-pi="${pi}"][data-slot="${noteIndex}"]`
    );
    if (cell) cell.classList.add('playing');
  });

  if (notation) notation.highlightBeat(state.study.phases[phaseIdx], tick);
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function buildTimeline(study) {
  elPhaseChips.innerHTML = '';
  elPhaseInfo.textContent = '';

  study.phases.forEach((phase, i) => {
    const chip = document.createElement('div');
    chip.className   = 'phase-chip';
    chip.dataset.idx = i;
    chip.textContent = i + 1;

    const perf = phase.performers.filter(p => p.pattern).length;
    const maxN = phase.maxPatternLen;
    chip.title = `Phase ${i + 1}: ${perf} performer${perf !== 1 ? 's' : ''}, up to ${maxN} note${maxN !== 1 ? 's' : ''} · ${phase.direction}`;

    // Mark the peak
    if (i === study.peakPhaseIdx) chip.dataset.peak = '';

    elPhaseChips.appendChild(chip);
  });
}

function updateTimeline(study, phaseIdx, beat) {
  const phase = study.phases[phaseIdx];
  const rep   = Math.floor(beat / phase.maxPatternDuration) + 1;
  const totalReps = study.repsPerStep;

  elPhaseInfo.textContent =
    `Phase ${phaseIdx + 1}/${study.totalPhases} · Rep ${rep}/${totalReps} · Beat ${beat + 1}/${phase.durationBeats}`;

  elPhaseChips.querySelectorAll('.phase-chip').forEach((chip, i) => {
    chip.classList.remove('current', 'done');
    if (i < phaseIdx)  chip.classList.add('done');
    if (i === phaseIdx) chip.classList.add('current');
  });
}

// ── Playback ──────────────────────────────────────────────────────────────────

/**
 * Playback — drives visual (and eventually audio) playback of an AccumulationStudy.
 * Uses setTimeout for beat-accurate visual updates.
 */
class Playback {
  constructor(study, audio) {
    this.study     = study;
    this.audio     = audio;
    this._timerId  = null;
    this._running  = false;
    this._phaseIdx = 0;
    this._beat     = 0;
  }

  start() {
    if (this._running) return;
    this._running  = true;
    this._phaseIdx = 0;
    this._beat     = 0;
    buildScoreGrid(this.study, 0);
    this._tick();
  }

  stop() {
    this._running = false;
    clearTimeout(this._timerId);
    this._timerId = null;
    elScoreGrid.querySelectorAll('.note-cell.playing').forEach(c =>
      c.classList.remove('playing')
    );
    this.audio.stop();
    elBtnPlay.disabled = false;
    elBtnStop.disabled = true;
  }

  _tick() {
    if (!this._running) return;

    const { study }  = this;
    const phaseIdx   = this._phaseIdx;
    const beat       = this._beat;
    const phase      = study.phases[phaseIdx];
    const beatMs     = bpmToMs(study.bpm) / 2;  // eighth-note resolution

    // Visual update
    highlightBeat(phaseIdx, beat);
    updateTimeline(study, phaseIdx, beat);

    // Trigger audio for this beat
    const notes = study.noteAtBeat(phaseIdx, beat);
    notes.forEach(({ performerIndex, note }) => {
      if (note) audio.playNote(performerIndex, note, beatMs * 0.85);
    });

    // Advance cursor
    this._beat++;
    if (this._beat >= phase.durationBeats) {
      this._beat = 0;
      this._phaseIdx++;

      if (this._phaseIdx < study.phases.length) {
        // Rebuild grid for the new phase
        buildScoreGrid(study, this._phaseIdx);
      }
    }

    // Schedule next tick or wrap up
    if (this._phaseIdx < study.phases.length) {
      this._timerId = setTimeout(() => this._tick(), beatMs);
    } else {
      this._timerId = setTimeout(() => {
        this._running = false;
        elScoreGrid.querySelectorAll('.note-cell.playing').forEach(c =>
          c.classList.remove('playing')
        );
        elPhaseInfo.textContent = 'Complete';
        elPhaseChips.querySelectorAll('.phase-chip').forEach(c => {
          c.classList.remove('current');
          c.classList.add('done');
        });
        elBtnPlay.disabled  = false;
        elBtnStop.disabled  = true;
      }, beatMs);
    }
  }
}

// ── Play / Stop ───────────────────────────────────────────────────────────────

elBtnPlay.addEventListener('click', async () => {
  elBtnPlay.disabled = true;
  elBtnStop.disabled = false;
  elBtnPlay.textContent = 'Loading…';
  await audio.init(state.study.numPerformers);
  elBtnPlay.textContent = 'Play';
  startPlayback();
});

elBtnStop.addEventListener('click', stopPlayback);

function startPlayback() {
  if (!state.study) return;
  stopPlayback();
  state.playback = new Playback(state.study, audio);
  state.playback.start();
}

function stopPlayback() {
  if (state.playback) {
    state.playback.stop();
    state.playback = null;
  }
  if (notation) notation.clearHighlight();
}

// ── Init ──────────────────────────────────────────────────────────────────────

buildNotePalette();
renderPhrasePreview();
