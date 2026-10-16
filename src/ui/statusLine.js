// Statuszeile unter dem Aufbau: Was dreht sich, was bleibt fest, worauf zeige ich gerade?

import { PLANES, AXES, AXIS_CSS, ROLE_CSS } from '../config.js';
import { t, DECIMAL } from '../i18n.js';
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
      const view = t(`view.${state.viewMode}`);
      const shape = state.viewMode === 'unfold' ? t('st.unfoldShapes') : state.shape.label;
      const center = t('st.center', { m: t(state.perspective ? 'persp' : 'ortho') });
      const mode = `${shape}  ·  ${view}  ·  ${center}  ·  Zoom ${zoom.toFixed(1).replace('.', DECIMAL)}×`;
      richText(ctx, [{ t: mode, c: UI.dim }], 36, 142, 'left', `500 27px ${FONT}`);
    });
  }

  line1(state) {
    if (state.grabbingSetup) return [{ t: t('st.grab') }];
    if (state.viewMode === 'unfold') {
      const c = 1 - state.unfold;
      const pct = { t: `  ·  ${t('fold.open', { pct: Math.round(state.unfold * 100) })}`, c: UI.accent };
      if (state.unfold >= 0.999) return [{ t: t('st.open') }, pct];
      if (state.unfold <= 0.001) return [{ t: t('st.closed') }, pct];
      if (c < LID_PHASE) return [{ t: t('st.theLid') }, { t: t('st.lid'), c: ROLE_CSS.lid }, { t: t('st.foldsInto') }, W, { t: t('st.dir') }, pct];
      return [{ t: t('st.the') }, { t: t('st.walls'), c: ROLE_CSS.wall }, { t: t('st.foldInto') }, W, { t: t('st.dir') }, pct];
    }
    if (state.activePlane != null) {
      const p = PLANES[state.activePlane];
      return [
        { t: t('st.rotIn') }, ...letters(p.name),
        { t: '  ·  ' }, ...letters(p.fixed), { t: t('st.fixed') },
        { t: `  ·  ${fmtDeg(state.knobAngles[state.activePlane])}`, c: UI.accent },
        ...(state.auto ? [{ t: `  ·  ${t('st.auto')}`, c: UI.dim }] : []),
      ];
    }
    return [{ t: t('st.idle') }];
  }

  line2(state, hover) {
    const msg = state.activeMessage;
    if (msg) return [{ t: msg, c: UI.accent }];
    if (hover?.type === 'knob' && hover.plane === 'fold') {
      return [{ t: t('st.foldHover'), c: UI.dim }];
    }
    if (hover?.type === 'knob') {
      const p = PLANES[hover.plane];
      return [{ t: t('st.knob'), c: UI.dim }, ...letters(p.name), { t: t('st.mixes'), c: UI.dim },
        { t: AXES[p.a], c: AXIS_CSS[p.a] }, { t: t('st.and'), c: UI.dim }, { t: AXES[p.b], c: AXIS_CSS[p.b] },
        { t: t('st.plane'), c: UI.dim }, ...letters(p.fixed), { t: t('st.still'), c: UI.dim }];
    }
    if (hover?.type === 'vertex') {
      return [{ t: t('st.vertex', { n: state.shape.vertexName(hover.i) }), c: UI.text }, { t: t('st.tapMark'), c: UI.dim }];
    }
    if (hover?.type === 'chip') {
      if (!hover.enabled) return [{ t: state.shape.unfoldReason || t('st.na'), c: UI.dim }];
      if (hover.group === 'shape') return [{ t: t('st.shapeChip', { l: SHAPE_BY_ID[hover.id].label }), c: UI.dim }];
      return [{ t: t('st.viewChip', { l: t(`view.${hover.id}`) }), c: UI.dim }];
    }
    if (hover?.type === 'button') return [{ t: t('st.button'), c: UI.dim }];
    if (state.viewMode === 'unfold') return [{ t: t('st.unfoldIdle'), c: UI.dim }];
    if (state.shape.selectable) return [{ t: t('st.selectIdle'), c: UI.dim }];
    return [{ t: state.shape.hint, c: UI.dim }];
  }
}
