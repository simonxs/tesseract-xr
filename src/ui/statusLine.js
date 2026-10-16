// Statuszeile unter dem Aufbau: Was dreht sich, was bleibt fest, worauf zeige ich gerade?

import { PLANES, AXES, AXIS_CSS, ROLE_CSS, VIEW_MODES } from '../config.js';
import { fmtDeg } from '../core/math4d.js';
import { SHAPE_BY_ID } from '../shapes/index.js';
import { CanvasPanel, panelBg, richText, FONT, UI } from './canvasPanel.js';
import { LID_PHASE } from '../render/unfold.js';

const letters = (str) => [...str].map((ch) => ({ t: ch, c: AXIS_CSS[AXES.indexOf(ch)] }));
const W = { t: 'W', c: AXIS_CSS[3] };

/** Zeile so klein setzen, dass sie in maxW passt */
function fitText(ctx, segs, y, maxW, weight, size) {
  let px = size;
  for (; px > 16; px -= 2) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    const width = segs.reduce((sum, s) => sum + ctx.measureText(s.t).width, 0);
    if (width <= maxW) break;
  }
  richText(ctx, segs, 36, y, 'left', `${weight} ${px}px ${FONT}`);
}

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
      fitText(ctx, this.line1(state), 50, w - 72, 600, 36);
      fitText(ctx, this.line2(state, hover), 100, w - 72, 500, 27);
      const view = VIEW_MODES.find((v) => v.id === state.viewMode).label;
      const shape = state.viewMode === 'unfold' ? 'Würfel + Tesseract' : state.shape.label;
      const mode = `${shape}  ·  ${view}  ·  Zentrum ${state.perspective ? 'perspektivisch' : 'orthogonal'}  ·  Zoom ${zoom
        .toFixed(1).replace('.', ',')}×`;
      richText(ctx, [{ t: mode, c: UI.dim }], 36, 142, 'left', `500 27px ${FONT}`);
    });
  }

  line1(state) {
    if (state.grabbingSetup) return [{ t: 'Du änderst nur den Blickwinkel. Die 4D-Lage bleibt gleich.' }];
    if (state.viewMode === 'unfold') {
      const c = 1 - state.unfold;
      const pct = { t: `  ·  ${Math.round(state.unfold * 100)} % offen`, c: UI.accent };
      if (state.unfold >= 0.999) return [{ t: 'Ganz offen: das Dalí-Kreuz aus 8 Würfeln' }, pct];
      if (state.unfold <= 0.001) return [{ t: 'Zugeklappt: Würfel im Würfel' }, pct];
      if (c < LID_PHASE) return [{ t: 'Der ' }, { t: 'Deckel', c: ROLE_CSS.lid }, { t: ' klappt in die ' }, W, { t: '-Richtung' }, pct];
      return [{ t: 'Die ' }, { t: 'Wände', c: ROLE_CSS.wall }, { t: ' klappen in die ' }, W, { t: '-Richtung' }, pct];
    }
    if (state.activePlane != null) {
      const p = PLANES[state.activePlane];
      return [
        { t: 'Drehung in ' }, ...letters(p.name),
        { t: '  ·  ' }, ...letters(p.fixed), { t: ' bleibt fest' },
        { t: `  ·  ${fmtDeg(state.knobAngles[state.activePlane])}`, c: UI.accent },
        ...(state.auto ? [{ t: '  ·  Auto', c: UI.dim }] : []),
      ];
    }
    return [{ t: 'Knopf greifen und Handgelenk drehen' }];
  }

  line2(state, hover) {
    const msg = state.activeMessage;
    if (msg) return [{ t: msg, c: UI.accent }];
    if (hover?.type === 'knob' && hover.plane === 'fold') {
      return [{ t: 'Falt-Knopf: jede Wand dreht sich um 90° um die Fläche, die sie mit dem Boden teilt', c: UI.dim }];
    }
    if (hover?.type === 'knob') {
      const p = PLANES[hover.plane];
      return [{ t: 'Knopf ', c: UI.dim }, ...letters(p.name), { t: ': mischt ', c: UI.dim },
        { t: AXES[p.a], c: AXIS_CSS[p.a] }, { t: ' und ', c: UI.dim }, { t: AXES[p.b], c: AXIS_CSS[p.b] },
        { t: ', die Ebene ', c: UI.dim }, ...letters(p.fixed), { t: ' bleibt stehen', c: UI.dim }];
    }
    if (hover?.type === 'vertex') {
      return [{ t: `Ecke ${state.shape.vertexName(hover.i)}`, c: UI.text }, { t: '  ·  antippen zum Markieren', c: UI.dim }];
    }
    if (hover?.type === 'chip') {
      if (!hover.enabled) return [{ t: state.shape.unfoldReason || 'nicht verfügbar', c: UI.dim }];
      const label = hover.group === 'shape' ? SHAPE_BY_ID[hover.id].label : VIEW_MODES.find((v) => v.id === hover.id).label;
      return [{ t: `${hover.group === 'shape' ? 'Form' : 'Ansicht'}: ${label}`, c: UI.dim }];
    }
    if (hover?.type === 'button') return [{ t: 'Schaltfläche antippen', c: UI.dim }];
    if (state.viewMode === 'unfold') return [{ t: 'Falt-Knopf drehen · links der Würfel als Vergleich eine Dimension tiefer', c: UI.dim }];
    if (state.shape.selectable) return [{ t: 'Ecke antippen: markiert sie in allen Ansichten', c: UI.dim }];
    return [{ t: state.shape.hint, c: UI.dim }];
  }
}
