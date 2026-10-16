// Statuszeile unter dem Aufbau: Was dreht sich, was bleibt fest, worauf zeige ich gerade?

import { PLANES, AXES, AXIS_CSS } from '../config.js';
import { fmtDeg } from '../core/math4d.js';
import { vertexName } from '../core/tesseract.js';
import { CanvasPanel, panelBg, richText, FONT, UI } from './canvasPanel.js';

const letters = (str) => [...str].map((ch) => ({ t: ch, c: AXIS_CSS[AXES.indexOf(ch)] }));

export class StatusLine {
  constructor() {
    this.panel = new CanvasPanel(1024, 176, 0.34);
  }

  update(state, hover, zoom) {
    const hk = hover ? `${hover.type}:${hover.plane ?? hover.id ?? hover.i ?? ''}` : '';
    const key = `${state.version}|${hk}|${zoom.toFixed(1)}|${state.grabbingSetup}`;
    this.panel.drawIfChanged(key, (ctx, w, h) => {
      panelBg(ctx, w, h, 26);
      ctx.textBaseline = 'middle';
      const f1 = `600 36px ${FONT}`, f2 = `500 27px ${FONT}`;

      // Zeile 1: aktuelle Drehung
      let l1;
      if (state.grabbingSetup) {
        l1 = [{ t: 'Du änderst nur den Blickwinkel. Die 4D-Lage bleibt gleich.' }];
      } else if (state.activePlane != null) {
        const p = PLANES[state.activePlane];
        l1 = [
          { t: 'Drehung in ' }, ...letters(p.name),
          { t: '  ·  ' }, ...letters(p.fixed), { t: ' bleibt fest' },
          { t: `  ·  ${fmtDeg(state.knobAngles[state.activePlane])}`, c: UI.accent },
          ...(state.auto ? [{ t: '  ·  Auto', c: UI.dim }] : []),
        ];
      } else {
        l1 = [{ t: 'Knopf greifen und Handgelenk drehen' }];
      }
      richText(ctx, l1, 36, 50, 'left', f1);

      // Zeile 2: worauf gezeigt wird
      let l2 = [{ t: 'Ecke antippen: markiert sie in allen Ansichten', c: UI.dim }];
      if (hover?.type === 'knob') {
        const p = PLANES[hover.plane];
        l2 = [{ t: 'Knopf ', c: UI.dim }, ...letters(p.name), { t: ': mischt ', c: UI.dim },
          { t: AXES[p.a], c: AXIS_CSS[p.a] }, { t: ' und ', c: UI.dim }, { t: AXES[p.b], c: AXIS_CSS[p.b] },
          { t: ', die Ebene ', c: UI.dim }, ...letters(p.fixed), { t: ' bleibt stehen', c: UI.dim }];
      } else if (hover?.type === 'vertex') {
        l2 = [{ t: `Ecke ${vertexName(hover.i)}`, c: UI.text }, { t: '  ·  antippen zum Markieren', c: UI.dim }];
      } else if (hover?.type === 'button') {
        l2 = [{ t: 'Schaltfläche antippen', c: UI.dim }];
      }
      richText(ctx, l2, 36, 100, 'left', f2);

      // Zeile 3: Modus
      const mode = `${state.viewMode === 'riss' ? 'Rissansicht' : 'nur Tesseract'}  ·  Zentrum ${
        state.perspective ? 'perspektivisch' : 'orthogonal'}  ·  Zoom ${zoom.toFixed(1).replace('.', ',')}×`;
      richText(ctx, [{ t: mode, c: UI.dim }], 36, 142, 'left', f2);
    });
  }
}
