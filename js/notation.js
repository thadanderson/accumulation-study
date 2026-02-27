/**
 * notation.js
 * NotationRenderer stub — interface defined, implementation pending.
 *
 * TODO: Implement with VexFlow (https://github.com/0xfe/vexflow)
 *   <script src="https://cdn.jsdelivr.net/npm/vexflow@4/build/cjs/vexflow.js"></script>
 *
 * One stave per performer per phase, rendered as SVG inside `container`.
 */
class NotationRenderer {
  /**
   * @param {HTMLElement} container  DOM node to render notation into
   */
  constructor(container) {
    this.container = container;
    // TODO: const { Renderer } = Vex.Flow;
    //       this._renderer = new Renderer(container, Renderer.Backends.SVG);
  }

  /**
   * render — draw the full score for the given AccumulationStudy.
   * @param {AccumulationStudy} study
   */
  render(study) {
    // TODO: For each phase, render each performer's pattern on a staff.
    //       Highlight the currently-playing measure during playback.
    console.info('[NotationRenderer] stub — notation not yet implemented (VexFlow pending)');
  }

  /**
   * highlightMeasure — visually accent the active measure during playback.
   * @param {number} phaseIdx
   * @param {number} performerIndex
   */
  highlightMeasure(phaseIdx, performerIndex) {
    // TODO: update SVG element fill/stroke for the targeted measure
  }

  /**
   * clear — remove all rendered SVG from the container.
   */
  clear() {
    this.container.innerHTML = '';
  }
}
