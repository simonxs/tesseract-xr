// Koordinaten-Tooltips für markierte Ecken, über der Ecke im Zentrum.

import * as THREE from 'three';
import { AXES, AXIS_CSS, SEL_CSS, MAX_SELECTION } from '../config.js';
import { fmt } from '../core/math4d.js';
import { vertexName } from '../core/tesseract.js';
import { CanvasPanel, panelBg, richText, FONT } from './canvasPanel.js';

const _p = new THREE.Vector3();

export class VertexLabels {
  constructor() {
    this.items = Array.from({ length: MAX_SELECTION }, () => {
      const p = new CanvasPanel(560, 116, 0.13, { sprite: true, depthTest: false, renderOrder: 20 });
      p.mesh.visible = false;
      return p;
    });
    this.objects = this.items.map((p) => p.mesh);
  }

  update(state, views) {
    this.items.forEach((p, k) => {
      const i = state.selection[k];
      p.mesh.visible = i !== undefined;
      if (i === undefined) return;
      views.centerWorld(i, _p);
      p.mesh.position.copy(_p);
      p.mesh.position.y += 0.03 + 0.012 * k;
      const r = views.rot[i];
      p.drawIfChanged(`${state.version}|${i}|${k}`, (ctx, w, h) => {
        panelBg(ctx, w, h, 20);
        ctx.textBaseline = 'middle';
        richText(ctx, [{ t: `● Ecke ${vertexName(i)}`, c: SEL_CSS[k] }], 24, 34, 'left', `600 26px ${FONT}`);
        const segs = [];
        for (let a = 0; a < 4; a++) {
          segs.push({ t: AXES[a].toLowerCase() + ' ', c: AXIS_CSS[a], f: `700 25px ${FONT}` });
          segs.push({ t: fmt(r[a]) + (a < 3 ? '   ' : '') });
        }
        richText(ctx, segs, 24, 80, 'left', `500 25px ${FONT}`);
      }, 100);
    });
  }
}
