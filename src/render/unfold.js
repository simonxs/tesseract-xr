// Aufklappen: links ein 3D-Würfel, der sich auf einem Blatt Papier zu 6 Quadraten auffaltet
// (mit seinem Schatten = das, was ein Flachländer sieht), rechts der Tesseract, der sich zu
// 8 Würfeln auffaltet (Dalí-Kreuz). Beide hängen am selben Falt-Knopf.
//
// Faltgrad: state.unfold 0 = zu, 1 = ganz offen. Daraus zwei Winkel (geschlossen = 90°):
//   β  Deckel gegen seine Wand  (beim Zuklappen zuerst, solange die Wände noch flach liegen)
//   α  Wände gegen den Boden    (danach; der Deckel wird mitgenommen und legt sich oben auf)
// Diese Reihenfolge hält den Deckel nahe an der 4D-Kamera fern, sonst wird er in der
// Perspektive riesig.
//
// Jede Wand dreht sich um die Fläche, die sie mit dem Boden teilt, und zwar
// beim Tesseract in die W-Richtung, beim Würfel in die Höhe (Y).

import * as THREE from 'three';
import { applyMat, projectCenter } from '../core/math4d.js';
import { ROLE_COLORS, EDGE_RADIUS, VERTEX_RADIUS, VERTEX_COLOR } from '../config.js';
import { SegmentBatch, PointBatch, QuadFill } from './batches.js';
import { CanvasPanel, richText, FONT, UI } from '../ui/canvasPanel.js';
import { t } from '../i18n.js';

const ROLE = Object.fromEntries(Object.entries(ROLE_COLORS).map(([k, v]) => [k, new THREE.Color(v)]));
const V_COL = new THREE.Color(VERTEX_COLOR);
const SHADOW_COL = new THREE.Color(0x1a1e26);
const LIGHT_H = 4; // Lichtquelle über dem Blatt (für den Schatten)

export const LID_PHASE = 0.3; // Anteil des Zuklappens, in dem nur der Deckel klappt

export function foldAngles(unfold) {
  const c = 1 - unfold; // 0 = offen, 1 = zu
  const B = (Math.PI / 2) * Math.min(1, c / LID_PHASE);
  const A = (Math.PI / 2) * Math.max(0, Math.min(1, (c - LID_PHASE) / (1 - LID_PHASE)));
  return [A, B];
}

// ---------- Tesseract: 8 Würfelzellen, lokale Koordinaten l = [a, b, c] ∈ {−1, 1}³ ----------
const T_CELLS = [{ role: 'base', f: (l, A, B, o) => { o[0] = l[0]; o[1] = l[1]; o[2] = l[2]; o[3] = -1; } }];
for (const k of [0, 1, 2]) {
  for (const sg of [1, -1]) {
    T_CELLS.push({
      role: 'wall',
      f: (l, A, B, o) => {
        const s = l[k] + 1; // Abstand vom Scharnier (0 … 2)
        o[0] = l[0]; o[1] = l[1]; o[2] = l[2];
        o[k] = sg * (1 + s * Math.cos(A));
        o[3] = -1 + s * Math.sin(A);
      },
    });
  }
}
// Deckel (Zelle w = +1) hängt an der Wand y = −1
T_CELLS.push({
  role: 'lid',
  f: (l, A, B, o) => {
    const t = l[1] + 1;
    const uy = -Math.cos(A), uw = Math.sin(A);                 // Richtung der Wand in der (y, w)-Ebene
    const dy = uy * Math.cos(B) + uw * Math.sin(B);             // um −β weitergedreht
    const dw = -uy * Math.sin(B) + uw * Math.cos(B);
    o[0] = l[0]; o[2] = l[2];
    o[1] = -(1 + 2 * Math.cos(A)) + t * dy;
    o[3] = -1 + 2 * Math.sin(A) + t * dw;
  },
});

// ---------- 3D-Würfel: 6 Quadrate, lokale Koordinaten l = [a, b] ∈ {−1, 1}² ----------
const C_CELLS = [{ role: 'base', f: (l, A, B, o) => o.set(l[0], -1, l[1]) }];
for (const k of [0, 2]) {
  for (const sg of [1, -1]) {
    C_CELLS.push({
      role: 'wall',
      f: (l, A, B, o) => {
        const s = l[1] + 1;
        const h = sg * (1 + s * Math.cos(A)), y = -1 + s * Math.sin(A);
        if (k === 0) o.set(h, y, l[0]); else o.set(l[0], y, h);
      },
    });
  }
}
// Deckel (oben, y = +1) hängt an der hinteren Wand z = −1
C_CELLS.push({
  role: 'lid',
  f: (l, A, B, o) => {
    const t = l[1] + 1;
    const uz = -Math.cos(A), uy = Math.sin(A);
    const dz = uz * Math.cos(B) + uy * Math.sin(B);
    const dy = -uz * Math.sin(B) + uy * Math.cos(B);
    o.set(l[0], -1 + 2 * Math.sin(A) + t * dy, -(1 + 2 * Math.cos(A)) + t * dz);
  },
});

// Ecken, Kanten und Flächen eines Würfels / Quadrats in lokalen Koordinaten
const CUBE_L = Array.from({ length: 8 }, (_, i) => [0, 1, 2].map((b) => ((i >> b) & 1 ? 1 : -1)));
const CUBE_E = [];
for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) { const j = i ^ (1 << b); if (i < j) CUBE_E.push([i, j]); }
const CUBE_F = [];
for (let k = 0; k < 3; k++) {
  const [p, q] = [0, 1, 2].filter((x) => x !== k);
  for (const v of [0, 1]) {
    CUBE_F.push([[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => (v << k) | (a << p) | (b << q)));
  }
}
const SQ_L = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

function label(lines, worldW) {
  const p = new CanvasPanel(640, 150, worldW, { sprite: true });
  p.draw((ctx, w) => {
    ctx.textBaseline = 'middle';
    richText(ctx, lines[0], w / 2, 48, 'center', `700 46px ${FONT}`);
    richText(ctx, lines[1], w / 2, 108, 'center', `500 32px ${FONT}`);
  });
  return p.mesh;
}

export class UnfoldScene {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'unfold';
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 });
    const pmat = new THREE.MeshStandardMaterial({ roughness: 0.3 });

    // Tesseract-Seite
    this.tess = new THREE.Group();
    this.tess.position.set(4.6, 1.0, 0);
    this.tEdges = new SegmentBatch(T_CELLS.length * 12, mat, { beam: true });
    this.tPoints = new PointBatch(T_CELLS.length * 8, pmat);
    this.tFill = new QuadFill(T_CELLS.length * 6, 0.13);
    this.tess.add(this.tEdges.mesh, this.tPoints.mesh, this.tFill.mesh);
    const tl = label([
      [{ t: t('unf.tess') }],
      [{ t: t('unf.base'), c: '#a9b2c2' }, { t: ' + ', c: UI.dim }, { t: t('unf.walls6'), c: '#5aaeff' },
        { t: ' + ', c: UI.dim }, { t: t('unf.lid'), c: '#ffc83d' }],
    ], 6.4);
    tl.position.set(0, 4.3, 0);
    this.tess.add(tl);

    // Würfel-Seite mit Blatt
    this.cube = new THREE.Group();
    this.cube.position.set(-5.4, -1.6, 0);
    this.cEdges = new SegmentBatch(C_CELLS.length * 4, mat, { beam: true });
    this.cPoints = new PointBatch(C_CELLS.length * 4, pmat);
    this.cFill = new QuadFill(C_CELLS.length, 0.22);
    this.sEdges = new SegmentBatch(C_CELLS.length * 4, new THREE.MeshBasicMaterial({ color: SHADOW_COL }));
    this.sFill = new QuadFill(C_CELLS.length, 0.28);
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 9.6),
      new THREE.MeshBasicMaterial({ color: 0xf4f6fa, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.set(0, -1.03, -1);
    this.cube.add(sheet, this.cEdges.mesh, this.cPoints.mesh, this.cFill.mesh, this.sEdges.mesh, this.sFill.mesh);
    const cl = label([
      [{ t: t('unf.cube') }],
      [{ t: t('unf.base'), c: '#a9b2c2' }, { t: ' + ', c: UI.dim }, { t: t('unf.walls4'), c: '#5aaeff' },
        { t: ' + ', c: UI.dim }, { t: t('unf.lid'), c: '#ffc83d' }],
    ], 6.4);
    cl.position.set(0, 3.0, -1);
    const sl = label([
      [{ t: t('unf.sheet'), f: `600 38px ${FONT}` }],
      [{ t: t('unf.shadow'), c: UI.dim }],
    ], 6.4);
    sl.position.set(0, -1.6, 4.4);
    this.cube.add(cl, sl);

    this.group.add(this.tess, this.cube);
    this._l = [0, 0, 0, 0];
    this._p4 = [0, 0, 0, 0];
    this._r4 = [0, 0, 0, 0];
    this.tc = Array.from({ length: 8 }, () => new THREE.Vector3());
    this.cc = Array.from({ length: 4 }, () => new THREE.Vector3());
    this.sc = Array.from({ length: 4 }, () => new THREE.Vector3());
  }

  update(state) {
    const [A, B] = foldAngles(state.unfold);
    const blend = state.easedBlend, d = Math.max(state.perspDist, 5), M = state.M;
    const er = EDGE_RADIUS, vr = VERTEX_RADIUS * 0.7;

    // Tesseract-Zellen: 4D-Punkte → Drehung (nur 3D-Knöpfe aktiv) → Projektion
    this.tEdges.begin(); this.tPoints.begin(); this.tFill.begin();
    for (const cell of T_CELLS) {
      const col = ROLE[cell.role];
      CUBE_L.forEach((l, i) => {
        cell.f(l, A, B, this._p4);
        applyMat(M, this._p4, this._r4);
        projectCenter(this._r4, blend, d, this.tc[i]);
      });
      const cen = this.cellCenter(this.tc);
      for (const [i, j] of CUBE_E) this.tEdges.add(this.tc[i], this.tc[j], er, col, cen);
      for (const f of CUBE_F) this.tFill.add(this.tc[f[0]], this.tc[f[1]], this.tc[f[2]], this.tc[f[3]], col);
      for (const p of this.tc) this.tPoints.add(p, vr, V_COL);
    }
    this.tEdges.end(); this.tPoints.end(); this.tFill.end();

    // Würfel-Quadrate + Schatten auf dem Blatt (Licht senkrecht über der Blattmitte)
    this.cEdges.begin(); this.cPoints.begin(); this.cFill.begin(); this.sEdges.begin(); this.sFill.begin();
    for (const cell of C_CELLS) {
      const col = ROLE[cell.role];
      SQ_L.forEach((l, i) => {
        const p = this.cc[i];
        cell.f(l, A, B, p);
        const f = LIGHT_H / (LIGHT_H - (p.y + 1));
        this.sc[i].set(p.x * f, -1.01, p.z * f);
      });
      const cen = this.cellCenter(this.cc);
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        this.cEdges.add(this.cc[i], this.cc[j], er, col, cen);
        this.sEdges.add(this.sc[i], this.sc[j], er * 0.35, SHADOW_COL);
        this.cPoints.add(this.cc[i], vr, V_COL);
      }
      this.cFill.add(this.cc[0], this.cc[1], this.cc[2], this.cc[3], col);
      this.sFill.add(this.sc[0], this.sc[1], this.sc[2], this.sc[3], SHADOW_COL);
    }
    this.cEdges.end(); this.cPoints.end(); this.cFill.end(); this.sEdges.end(); this.sFill.end();
  }

  cellCenter(pts) {
    const c = (this._cen ||= new THREE.Vector3()).set(0, 0, 0);
    for (const p of pts) c.add(p);
    return c.divideScalar(pts.length);
  }
}
