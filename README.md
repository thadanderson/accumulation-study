# Accumulation Study

A generative minimalist process piece for open instrumentation, rendered in the browser.

The composition is built on an additive process: one performer enters at a time in a staggered, canon-like fashion, and one note is added to each active voice per phase until all performers are playing the full phrase — then the process reverses, creating a symmetric arch.

## How to Run

Open `index.html` directly in a browser. No server, build step, or dependencies required.

## Usage

1. **Set parameters** — choose the number of performers (2–8), tempo (BPM), and how many times each pattern repeats before a note is added (Reps / Phase)
2. **Build a melodic cell** — click notes in the palette to add them to the phrase (up to 8), or hit **Random** to generate one
3. **Generate** — computes the full composition and displays the score grid and timeline
4. **Play** — steps through the piece beat by beat, highlighting each voice's active note in real time
5. **Stop** — halts playback at any point; Generate resets to the beginning

## Composition Logic

The piece is structured in **phases** (accumulation steps):

- **Total forward phases** = `numPerformers + phraseLen − 1`
- At forward phase `s`, performer `p` is active if `p ≤ s` and plays `phrase[0 .. min(s−p+1, phraseLen)]`
- Since patterns have different lengths, voices loop independently and naturally drift out of phase (polyrhythm)
- Phase duration = `maxPatternLength × repsPerPhase` beats
- After the **peak** (all performers at full phrase), the forward phases replay in reverse — total phases = `2 × totalForward − 1`

**Example** — 3 performers, 4-note phrase `[C4 D4 E4 F4]`, 2 reps/phase:

| Phase | P1        | P2        | P3       |
|-------|-----------|-----------|----------|
| 1     | C4        | —         | —        |
| 2     | C4 D4     | C4        | —        |
| 3     | C4 D4 E4  | C4 D4     | C4       |
| 4     | C4 D4 E4 F4 | C4 D4 E4 | C4 D4  |
| 5     | C4 D4 E4 F4 | C4 D4 E4 F4 | C4 D4 E4 |
| 6 ◆  | C4 D4 E4 F4 | C4 D4 E4 F4 | C4 D4 E4 F4 |
| 7–11  | *(mirror of phases 5–1)* | | |

## File Structure

```
accumulation-study/
├── index.html          HTML shell; loads scripts in dependency order
├── style.css           Design system (CSS custom properties, minimal UI)
└── js/
    ├── utils.js        Constants (SCALE, NOTE_FREQ) and helpers (randomPhrase, bpmToMs)
    ├── composition.js  AccumulationStudy class — pure logic, no DOM or audio
    ├── audio.js        AudioEngine stub (Tone.js integration pending)
    ├── notation.js     NotationRenderer stub (VexFlow integration pending)
    └── main.js         App controller, score grid renderer, and Playback class
```

## Roadmap

- **Audio synthesis** — wire up `AudioEngine` in `audio.js` using [Tone.js](https://tonejs.github.io/); each performer gets its own synth voice with distinct timbre or panning
- **Music notation** — implement `NotationRenderer` in `notation.js` using [VexFlow](https://github.com/0xfe/vexflow) to display each voice on a proper staff
- **Scale / mode selection** — expose the note palette beyond C major diatonic
- **Rhythmic cells** — allow mixed durations (quarter, eighth, half notes) rather than uniform quarter notes
- **Export** — download the composition as MusicXML or MIDI
