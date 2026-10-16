// Legende + aktuelle Orientierung (4×4-Drehmatrix).
// In VR am linken Handgelenk, am Desktop fest neben dem Aufbau.

import { AXES, AXIS_CSS, SEL_CSS, ROLE_CSS } from '../config.js';
import { fmt } from '../core/math4d.js';
import { CanvasPanel, panelBg, richText, FONT, UI } from './canvasPanel.js';
import { t } from '../i18n.js';

export class InfoPanel {
  constructor() {
    this.panel = new CanvasPanel(512, 690, 0.15);
    this.mesh = this.panel.mesh;
  }

  update(state) {
    this.panel.drawIfChanged(`${state.version}`, (ctx, w, h) => this.draw(ctx, w, h, state), 100);
  }

  draw(ctx, w, h, state) {
    panelBg(ctx, w, h, 26);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText(t('info.legend'), 32, 40);

    if (state.viewMode === 'unfold') this.legendUnfold(ctx);
    else this.legendAxes(ctx, state);

    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText(t('info.orient'), 32, 330);

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
    ctx.fillText(t('info.col1'), 32, 622);
    ctx.fillText(t('info.col2'), 32, 650);
  }

  legendAxes(ctx, state) {
    for (let a = 0; a < 4; a++) {
      const y = 82 + a * 38;
      ctx.strokeStyle = AXIS_CSS[a];
      ctx.lineWidth = 9;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(86, y);
      ctx.stroke();
      richText(ctx, [{ t: AXES[a], c: AXIS_CSS[a], f: `700 26px ${FONT}` }, { t: t('info.dir') }],
        104, y, 'left', `500 24px ${FONT}`);
    }
    ctx.font = `500 22px ${FONT}`;
    ctx.fillStyle = UI.text;
    ctx.fillText(t('info.thick'), 36, 248);
    if (state.shape.selectable) {
      richText(ctx, [{ t: t('info.marked') }, ...SEL_CSS.map((c) => ({ t: '● ', c }))], 36, 282, 'left', `500 22px ${FONT}`);
    } else {
      richText(ctx, [{ t: state.shape.hint, c: UI.dim }], 36, 282, 'left', `500 20px ${FONT}`);
    }
  }

  legendUnfold(ctx) {
    const rows = ['base', 'wall', 'lid'].map((r) => [r, t(`role.${r}`)]);
    rows.forEach(([role, name], k) => {
      const y = 82 + k * 38;
      ctx.fillStyle = ROLE_CSS[role];
      ctx.fillRect(36, y - 9, 50, 18);
      richText(ctx, [{ t: name, c: ROLE_CSS[role], f: `700 24px ${FONT}` }], 104, y, 'left', `500 24px ${FONT}`);
    });
    ctx.font = `500 22px ${FONT}`;
    ctx.fillStyle = UI.text;
    ctx.fillText(t('info.cubeSum'), 36, 210);
    ctx.fillText(t('info.tessSum'), 36, 244);
    ctx.fillStyle = UI.dim;
    ctx.fillText(t('info.wallsW'), 36, 282);
  }
}
