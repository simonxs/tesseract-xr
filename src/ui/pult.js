// Das Bedienpult.
//   Kopfzeile:  Form (Tesseract, 3D-Würfel, …) und Ansicht (Rissansicht, nur Form, Aufklappen)
//   Knöpfe:     oben 3D-Ebenen, unten 4D-Ebenen, im Aufklapp-Modus stattdessen der Falt-Knopf
//   Rechts:     Schaltflächen
// Beschriftung und Schaltflächen sind auf eine Canvas-Fläche gezeichnet; die Knöpfe sind 3D-Objekte darauf.
// Treffer werden über die UV-Koordinate auf der Fläche bestimmt.

import * as THREE from 'three';
import { PLANES, AXES, AXIS_COLORS, AXIS_CSS, VIEW_MODES, ROLE_COLORS } from '../config.js';
import { SHAPES } from '../shapes/index.js';
import { fmtDeg } from '../core/math4d.js';
import { CanvasPanel, panelBg, richText, FONT, UI } from './canvasPanel.js';

const PX_W = 1024, PX_H = 660, WORLD_W = 0.44;
const R = 58; // Knopfradius in Pixeln
const ROW0 = 268, ROW1 = 512;
// Knopf-Layout: Zeile 1 = 3D-Ebenen, Zeile 2 = Ebenen mit W (oder Falt-Knopf)
const KNOBS = [
  { plane: 0, x: 110, y: ROW0 }, { plane: 1, x: 310, y: ROW0 }, { plane: 3, x: 510, y: ROW0 },
  { plane: 2, x: 110, y: ROW1 }, { plane: 4, x: 310, y: ROW1 }, { plane: 5, x: 510, y: ROW1 },
  { plane: 'fold', x: 310, y: ROW1 },
];
const SHAPE_CHIPS = SHAPES.map((s, k) => ({ group: 'shape', id: s.id, label: s.label, x: 150 + k * 174, y: 22, w: 166, h: 52 }));
const VIEW_CHIPS = VIEW_MODES.map((v, k) => ({ group: 'view', id: v.id, label: v.label, x: 150 + k * 228, y: 86, w: 220, h: 52 }));
const CHIPS = [...SHAPE_CHIPS, ...VIEW_CHIPS];
const BTN_X = 660, BTN_W = 332, BTN_H = 76;

export class Pult {
  constructor(state) {
    this.state = state;
    this.root = new THREE.Group();   // wird vor dem Nutzer platziert (Position + Gierwinkel)
    this.tilt = new THREE.Group();   // Pultneigung
    this.tilt.rotation.x = -0.7;
    this.root.add(this.tilt);

    this.panel = new CanvasPanel(PX_W, PX_H, WORLD_W);
    this.tilt.add(this.panel.mesh);
    this.raycaster = new THREE.Raycaster();

    const s = state;
    this.buttons = [
      { id: 'auto', label: () => (s.viewMode === 'unfold' ? `Auto-Falten: ${s.auto ? 'an' : 'aus'}` : `Auto-Rotation: ${s.auto ? 'an' : 'aus'}`), on: () => s.auto },
      { id: 'reset', label: () => 'Zurücksetzen' },
      { id: 'proj', label: () => `Zentrum: ${s.perspective ? 'perspektivisch' : 'orthogonal'}` },
      { id: 'clear', label: () => `Auswahl löschen (${s.selection.length})`, enabled: () => s.shape.selectable && s.viewMode !== 'unfold' },
    ].map((b, k) => ({ ...b, x: BTN_X, y: 176 + k * 94, w: BTN_W, h: BTN_H }));

    // 3D-Knöpfe
    const rm = (R / PX_W) * WORLD_W;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.6 });
    this.knobs = KNOBS.map((k) => {
      const [ca, cb] = k.plane === 'fold'
        ? [ROLE_COLORS.wall, ROLE_COLORS.lid]
        : [AXIS_COLORS[PLANES[k.plane].a], AXIS_COLORS[PLANES[k.plane].b]];
      const g = new THREE.Group();
      g.position.copy(this.pxToLocal(k.x, k.y));
      const body = new THREE.Mesh(new THREE.CylinderGeometry(rm, rm * 1.05, 0.018, 32), bodyMat);
      body.rotation.x = Math.PI / 2;
      body.position.z = 0.009;
      const ringGeo = new THREE.TorusGeometry(rm * 1.12, rm * 0.1, 8, 32, Math.PI);
      const ringA = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: ca }));
      const ringB = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: cb }));
      ringB.rotation.z = Math.PI;
      ringA.position.z = ringB.position.z = 0.004;
      const dial = new THREE.Group();
      const mark = new THREE.Mesh(new THREE.BoxGeometry(rm * 0.16, rm * 0.85, 0.004), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mark.position.set(0, rm * 0.45, 0.0185);
      dial.add(mark);
      g.add(body, ringA, ringB, dial);
      this.tilt.add(g);
      return { ...k, g, dial };
    });
  }

  pxToLocal(px, py) {
    const H = (WORLD_W * PX_H) / PX_W;
    return new THREE.Vector3((px / PX_W - 0.5) * WORLD_W, (0.5 - py / PX_H) * H, 0);
  }

  knobVisible(k) {
    const unfold = this.state.viewMode === 'unfold';
    if (k.plane === 'fold') return unfold;
    return !(unfold && k.y === ROW1);
  }

  chipEnabled(c) {
    if (c.group === 'view' && c.id === 'unfold') return this.state.shape.unfold;
    return true;
  }

  chipActive(c) {
    const s = this.state;
    return c.group === 'shape' ? s.shapeId === c.id : s.viewMode === c.id;
  }

  /** Treffer: { type: 'knob', plane } | { type: 'chip', group, id, enabled } | { type: 'button', id } | { type: 'panel' } | null */
  hit(ray) {
    if (!this.root.visible) return null;
    this.raycaster.ray.copy(ray);
    const hits = this.raycaster.intersectObject(this.panel.mesh, false);
    if (!hits.length) return null;
    const h = hits[0];
    const px = h.uv.x * PX_W, py = (1 - h.uv.y) * PX_H;
    const base = { point: h.point, distance: h.distance };
    const inRect = (b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    for (const k of this.knobs) {
      if (!this.knobVisible(k)) continue;
      if ((px - k.x) ** 2 + (py - k.y) ** 2 < (R * 1.35) ** 2) return { ...base, type: 'knob', plane: k.plane };
    }
    for (const c of CHIPS) if (inRect(c)) return { ...base, type: 'chip', group: c.group, id: c.id, enabled: this.chipEnabled(c) };
    for (const b of this.buttons) if (inRect(b)) return { ...base, type: 'button', id: b.id, enabled: b.enabled?.() ?? true };
    return { ...base, type: 'panel' };
  }

  /** Klick auf Chip oder Schaltfläche */
  action(t) {
    const s = this.state;
    if (t.type === 'chip') {
      if (t.group === 'shape') s.setShape(t.id);
      else s.setViewMode(t.id); // meldet selbst, wenn es nicht geht
      return;
    }
    if (t.enabled === false) return;
    if (t.id === 'auto') s.toggleAuto();
    else if (t.id === 'reset') { s.reset(); if (s.viewMode === 'unfold') s.turnFold(-1); }
    else if (t.id === 'proj') s.togglePerspective();
    else if (t.id === 'clear') s.clearSelection();
  }

  update(hover) {
    const s = this.state;
    for (const k of this.knobs) {
      k.g.visible = this.knobVisible(k);
      k.dial.rotation.z = k.plane === 'fold' ? -s.unfold * Math.PI : -s.knobAngles[k.plane];
    }
    const hk = hover ? `${hover.type}:${hover.plane ?? hover.id ?? ''}` : '';
    this.panel.drawIfChanged(`${s.version}|${hk}`, (ctx, w, h) => this.draw(ctx, w, h, hover));
  }

  draw(ctx, w, h, hover) {
    const s = this.state;
    const unfold = s.viewMode === 'unfold';
    panelBg(ctx, w, h, 28);
    ctx.textBaseline = 'middle';

    // Kopfzeile
    ctx.textAlign = 'left';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText('FORM', 34, 48);
    ctx.fillText('ANSICHT', 34, 112);
    for (const c of CHIPS) {
      const active = this.chipActive(c), enabled = this.chipEnabled(c);
      const hov = hover?.type === 'chip' && hover.group === c.group && hover.id === c.id;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.w, c.h, 26);
      ctx.fillStyle = active ? 'rgba(255,200,61,0.26)' : hov ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = active ? UI.accent : UI.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `600 24px ${FONT}`;
      ctx.fillStyle = enabled ? UI.text : 'rgba(233,237,243,0.32)';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 1);
    }
    ctx.strokeStyle = UI.line;
    ctx.beginPath();
    ctx.moveTo(24, 154);
    ctx.lineTo(w - 24, 154);
    ctx.stroke();

    // Zeilentitel
    ctx.textAlign = 'left';
    ctx.font = `600 25px ${FONT}`;
    ctx.fillStyle = UI.dim;
    ctx.fillText('3D-DREHUNGEN  ·  wie gewohnt', 34, 186);
    ctx.fillText(unfold ? 'FALTEN  ·  Würfel und Tesseract gemeinsam' : '4D-DREHUNGEN  ·  in die 4. Dimension', 34, 430);

    for (const k of this.knobs) {
      if (!this.knobVisible(k)) continue;
      const isHover = hover?.type === 'knob' && hover.plane === k.plane;
      const isActive = k.plane === 'fold' ? s.turning === 'fold' : s.activePlane === k.plane || s.turning === k.plane;
      if (isHover || isActive) {
        ctx.beginPath();
        ctx.arc(k.x, k.y, R + 20, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,200,61,0.16)';
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 3;
      const ticks = k.plane === 'fold' ? 6 : 12;
      for (let t = 0; t <= ticks; t++) {
        const an = k.plane === 'fold' ? (t / ticks) * Math.PI : (t / ticks) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(k.x + Math.sin(an) * (R + 8), k.y - Math.cos(an) * (R + 8));
        ctx.lineTo(k.x + Math.sin(an) * (R + 15), k.y - Math.cos(an) * (R + 15));
        ctx.stroke();
      }
      if (k.plane === 'fold') {
        richText(ctx, [{ t: 'Aufklappen', c: UI.text }], k.x, k.y + R + 30, 'center', `700 30px ${FONT}`);
        richText(ctx, [
          { t: `${Math.round(s.unfold * 100)} % offen`, c: UI.text },
          { t: '  ·  rechts drehen = auf', c: UI.dim },
        ], k.x, k.y + R + 58, 'center', `500 22px ${FONT}`);
        continue;
      }
      const p = PLANES[k.plane];
      richText(ctx, [{ t: AXES[p.a], c: AXIS_CSS[p.a] }, { t: AXES[p.b], c: AXIS_CSS[p.b] }],
        k.x, k.y + R + 30, 'center', `700 32px ${FONT}`);
      richText(ctx, [{ t: fmtDeg(s.knobAngles[k.plane]), c: UI.text }, { t: `  ·  fest: ${p.fixed}`, c: UI.dim }],
        k.x, k.y + R + 58, 'center', `500 22px ${FONT}`);
    }

    for (const b of this.buttons) {
      const isHover = hover?.type === 'button' && hover.id === b.id;
      const on = b.on?.();
      const enabled = b.enabled?.() ?? true;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 18);
      ctx.fillStyle = on ? 'rgba(255,200,61,0.24)' : isHover && enabled ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.strokeStyle = on ? UI.accent : UI.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `600 26px ${FONT}`;
      ctx.fillStyle = enabled ? UI.text : 'rgba(233,237,243,0.32)';
      ctx.textAlign = 'center';
      ctx.fillText(b.label(), b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
  }
}
