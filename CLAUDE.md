# CLAUDE.md — Accumulation Study

Developer context for AI assistants working on this codebase.

## What This Is

A vanilla-JS web app that generates and plays back a minimalist process composition called an "Accumulation Study." No build tools, no npm, no bundler — just plain HTML, CSS, and JS files loaded via `<script>` tags. Opens directly from `file://`.

## Architecture

```
utils.js → composition.js ─┐
                            ├─→ main.js (app entry point)
audio.js ──────────────────┤
notation.js ───────────────┘
```

**Load order matters.** `index.html` loads scripts in this sequence:
`utils.js` → `composition.js` → `audio.js` → `notation.js` → `main.js`

All symbols are global (no ES modules). Do not add `type="module"` to script tags without converting all files to use `import`/`export`.

## Key Files

### `js/composition.js` — Core Logic

`AccumulationStudy` is the heart of the app. It is pure data: no DOM access, no audio, no side effects. Given a config, its constructor builds a complete `phases` array that the rest of the app treats as read-only.

**Phase structure:**
```js
{
  step:          number,        // 1-indexed forward step number
  direction:     'accumulating' | 'diminishing',
  performers:    [{ performerIndex: number, pattern: string[] | null }],
  maxPatternLen: number,
  durationBeats: number,        // = maxPatternLen × repsPerStep
}
```

**Accumulation formula (1-indexed):**
- Total forward phases = `numPerformers + phraseLen − 1`
- At step `s`, performer `p` is active if `p ≤ s`
- Pattern at step `s`, performer `p` = `phrase.slice(0, min(s − p + 1, phraseLen))`
- Reverse phases = forward phases (excluding peak) in reverse order
- Total phases = `2 × totalForward − 1`

`noteAtBeat(phaseIdx, beat)` — convenience method that returns the sounding note for each performer at a given beat within a phase (handles the `beat % pattern.length` looping).

### `js/main.js` — App Controller

Three responsibilities:
1. **Phrase editor** — manages `state.phrase[]`, drives `#note-palette` and `#phrase-preview`
2. **Score grid** — `buildScoreGrid(study, phaseIdx)` renders the current phase; `highlightBeat(phase, beat)` toggles `.playing` on cells using `data-pi` and `data-slot` attributes
3. **Playback** — `Playback` class uses `setTimeout` loop at `bpmToMs(bpm)` intervals; rebuilds grid on phase change, fires `highlightBeat` every beat

**State object:**
```js
state = {
  phrase:   string[],         // current melodic cell
  study:    AccumulationStudy | null,
  playback: Playback | null,
}
```

Score grid cells use two `data-*` attributes for fast lookup:
- `data-pi`   — performer index (0-based)
- `data-slot` — note slot within the phrase (0-based)

### `js/audio.js` — Stub

`AudioEngine` is fully stubbed. The interface is defined but all methods are no-ops. To implement:
1. Add Tone.js via CDN in `index.html`
2. In `init()`: `await Tone.start()`, then create one `Tone.Synth` per performer
3. In `playNote(performerIndex, note, durationMs)`: call `triggerAttackRelease` on the corresponding synth
4. In `main.js` `Playback._tick()`: uncomment the audio block (lines 300–304)

### `js/notation.js` — Stub

`NotationRenderer` is fully stubbed. To implement:
1. Add VexFlow via CDN in `index.html`
2. In `render(study)`: iterate `study.phases`, draw one staff per performer per phase
3. Wire `highlightMeasure(phaseIdx, performerIndex)` to playback ticks

### `js/utils.js` — Constants

- `SCALE` — `string[]` of note labels (`'C4'` through `'C5'`, C major diatonic)
- `NOTE_FREQ` — label → Hz lookup (A4 = 440)
- `randomPhrase(len)` — picks `len` notes at random from `SCALE`
- `bpmToMs(bpm)` — returns milliseconds per quarter-note beat

## CSS Conventions

All sizing uses CSS custom properties defined in `:root`:
- `--cell` — width/height of note cells (currently `2.5rem`)
- `--accent` — primary blue (`#2563eb`)
- `--radius` — border radius (`6px`)

Note cell state classes (toggled by JS, never set inline):
- `.active-voice` — note is in this performer's current pattern
- `.playing` — note is sounding right now (toggled every beat tick)
- `.silent` — slot not yet accumulated

Phase chip state classes:
- `.done` — phase has been completed
- `.current` — phase currently playing
- `[data-peak]` — marks the climax phase (double-ring border)

## What Not to Change Without Care

- **Script load order** in `index.html` — globals must be available before `main.js` runs
- **`data-pi` / `data-slot` attributes** on `.note-cell` elements — `Playback._highlightBeat` depends on them; renaming breaks playback highlighting
- **`AccumulationStudy.phases` shape** — `main.js`, `audio.js`, and `notation.js` all read this array; changing the phase object structure requires updating all consumers
- **`bpmToMs`** — used by both `main.js` (Playback) and will be used by `audio.js` (Tone.js scheduling); keep it in `utils.js`
