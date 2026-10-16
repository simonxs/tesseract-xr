// Legende + aktuelle Orientierung (4×4-Drehmatrix).
// In VR am linken Handgelenk, am Desktop fest neben dem Aufbau.

import { AXES, AXIS_CSS, SEL_CSS } from '../config.js';
import { fmt } from '../core/math4d.js';
import { CanvasPanel, panelBg, richText, FONT, UI } from './canvasPanel.js';

export class InfoPanel {
  constructor() {
    this.panel = new CanvasPanel(512, 690, 0.15);
    this.mesh = this.panel.mesh;
  }

  update(state) {
    this.panel.drawIfChanged(state.version, (ctx, w, h) => this.draw(ctx, w, h, state), 100);
  }

  draw(ctx, w, h, state) {
    panelBg(ctx, w, h, 26);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText('LEGENDE', 32, 40);

    for (let a = 0; a < 4; a++) {
      const y = 82 + a * 38;
      ctx.strokeStyle = AXIS_CSS[a];
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(86, y);
      ctx.stroke();
      richText(ctx, [{ t: AXES[a], c: AXIS_CSS[a], f: `700 26px ${FONT}` }, { t: '-Kanten  ·  8 Stück' }],
        104, y, 'left', `500 24px ${FONT}`);
    }
    ctx.font = `500 22px ${FONT}`;
    ctx.fillStyle = UI.text;
    ctx.fillText('Dicke Kante = näher in W', 36, 248);
    richText(ctx, [{ t: 'Markierte Ecken: ' }, ...SEL_CSS.map((c) => ({ t: '● ', c }))], 36, 280, 'left', `500 22px ${FONT}`);

    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText('ORIENTIERUNG  ·  Drehmatrix', 32, 330);

    const x0 = 110, cw = 92, y0 = 372, ch = 54;
    for (let c = 0; c < 4; c++) {
      richText(ctx, [{ t: AXES[c], c: AXIS_CSS[c] }], x0 + c * cw + cw / 2, y0, 'center', `700 28px ${FONT}`);
    }
    for (let r = 0; r < 4; r++) {
      const cy = y0 + 46 + r * ch;
      richText(ctx, [{ t: AXES[r].toLowerCase(), c: AXIS_CSS[r] }], 66, cy, 'center', `600 26px ${FONT}`);
      for (let c = 0; c < 4; c++) {
        const v = state.M[r * 4 + c];
        const cx = x0 + c * cw;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx + 3, cy - ch / 2 + 3, cw - 6, ch - 6);
        const mid = cx + cw / 2;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = AXIS_CSS[c];
        const bw = v * (cw / 2 - 6);
        ctx.fillRect(Math.min(mid, mid + bw), cy - ch / 2 + 6, Math.abs(bw), ch - 12);
        ctx.globalAlpha = 1;
        ctx.font = `500 21px ${FONT}`;
        ctx.fillStyle = UI.text;
        ctx.textAlign = 'center';
        ctx.fillText(fmt(v), mid, cy + 1);
      }
    }
    ctx.textAlign = 'left';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText('Spalte = wohin die ursprüngliche', 32, 622);
    ctx.fillText('Achse jetzt zeigt', 32, 650);
  }
}
