// Die fünf Darstellungen: Zentrum (perspektivisch/orthogonal) und die drei Seitenansichten
// "ohne X/Y/Z" der Rissansicht. Alles liegt in this.group, deren Maßstab = Meter pro Einheit.
//
// Hinweis: Die Rissansicht hat 4 Ansichten ("ohne W" = Zentrum orthogonal + 3 Seitenansichten).

import * as THREE from 'three';
import { VERTICES, EDGES } from '../core/tesseract.js';
import { applyMat, projectCenter, projectSide, nearness } from '../core/math4d.js';
import {
  AXES, AXIS_COLORS, AXIS_CSS, SIDE_OFFSET, SIDE_DIR, SIDE_FRAME,
  EDGE_RADIUS, VERTEX_RADIUS, VERTEX_COLOR, SEL_COLORS,
} from '../config.js';
import { SegmentBatch, PointBatch } from './batches.js';
import { CanvasPanel, richText, FONT, UI } from '../ui/canvasPanel.js';

const AXIS_COL = AXIS_COLORS.map((c) => new THREE.Color(c));
const SEL_COL = SEL_COLORS.map((c) => new THREE.Color(c));
const V_COL = new THREE.Color(VERTEX_COLOR);
const HOVER_COL = new THREE.Color(0xffffff);

export class ViewSet {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'views';

    const edgeMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 });
    const vertMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 });
    this.edges = new SegmentBatch(EDGES.length * 4, edgeMat);
    this.points = new PointBatch(VERTICES.length * 4, vertMat);
    this.group.add(this.edges.mesh, this.points.mesh);

    // Positionen in Tesseract-Einheiten (lokal in this.group)
    this.rot = VERTICES.map(() => [0, 0, 0, 0]);
    this.center = VERTICES.map(() => new THREE.Vector3());
    this.side = [0, 1, 2].map(() => VERTICES.map(() => new THREE.Vector3()));
    this.sideOffset = SIDE_DIR.map((d) => new THREE.Vector3(...d).multiplyScalar(SIDE_OFFSET));

    // Rahmen + Beschriftung je Seitenansicht, Rahmenfarbe = weggelassene Achse
    this.sideDecor = [0, 1, 2].map((a) => {
      const g = new THREE.Group();
      g.position.copy(this.sideOffset[a]);
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(SIDE_FRAME, SIDE_FRAME, SIDE_FRAME)),
        new THREE.LineBasicMaterial({ color: AXIS_COLORS[a], transparent: true, opacity: 0.35 })
      );
      const label = new CanvasPanel(512, 128, 4.2, { sprite: true });
      label.draw((ctx, w) => {
        ctx.textBaseline = 'middle';
        richText(ctx, [{ t: 'ohne ' }, { t: AXES[a], c: AXIS_CSS[a] }], w / 2, 40, 'center', `700 46px ${FONT}`);
        richText(ctx, [
          { t: 'W', c: AXIS_CSS[3] }, { t: ' liegt auf der ', c: UI.dim },
          { t: AXES[a], c: AXIS_CSS[a] }, { t: '-Richtung', c: UI.dim },
        ], w / 2, 96, 'center', `500 30px ${FONT}`);
      });
      label.mesh.position.set(0, SIDE_FRAME / 2 + 0.75, 0);
      g.add(frame, label.mesh);
      this.group.add(g);
      return g;
    });

    this.centerLabel = new CanvasPanel(512, 80, 4.2, { sprite: true });
    this.centerLabel.mesh.position.set(0, -2.65, 0);
    this.group.add(this.centerLabel.mesh);
  }

  /** Projiziert alle Ecken neu und befüllt die Batches. hover = { type: 'vertex', i } | null */
  update(state, hover) {
    const M = state.M, t = state.easedBlend, d = state.perspDist;
    const riss = state.viewMode === 'riss';

    for (let i = 0; i < VERTICES.length; i++) {
      const r = applyMat(M, VERTICES[i], this.rot[i]);
      projectCenter(r, t, d, this.center[i]);
      if (riss) for (let a = 0; a < 3; a++) projectSide(r, a, this.side[a][i]).add(this.sideOffset[a]);
    }

    const views = riss ? [this.center, ...this.side] : [this.center];

    this.edges.begin();
    for (const P of views) {
      for (const e of EDGES) {
        const w = (this.rot[e.i][3] + this.rot[e.j][3]) / 2;
        this.edges.add(P[e.i], P[e.j], EDGE_RADIUS * nearness(w), AXIS_COL[e.axis]);
      }
    }
    this.edges.end();

    this.points.begin();
    for (const P of views) {
      for (let i = 0; i < VERTICES.length; i++) {
        const s = state.selection.indexOf(i);
        const hov = hover && hover.type === 'vertex' && hover.i === i;
        const col = s >= 0 ? SEL_COL[s] : hov ? HOVER_COL : V_COL;
        const k = s >= 0 ? 1.8 : hov ? 1.5 : 1;
        this.points.add(P[i], VERTEX_RADIUS * nearness(this.rot[i][3]) * k, col);
      }
    }
    this.points.end();

    for (const g of this.sideDecor) g.visible = riss;

    this.centerLabel.drawIfChanged(`${state.perspective}|${riss}`, (ctx, w) => {
      ctx.textBaseline = 'middle';
      const segs = state.perspective
        ? [{ t: 'Zentrum · Perspektive aus ' }, { t: 'W', c: AXIS_CSS[3] }]
        : [{ t: 'Zentrum · ohne ' }, { t: 'W', c: AXIS_CSS[3] }, { t: ' (orthogonal)' }];
      richText(ctx, segs, w / 2, 40, 'center', `600 34px ${FONT}`);
    }, 0);
  }

  /** Nächste Ecke entlang eines Strahls (Weltkoordinaten) oder null */
  pickVertex(ray, riss) {
    this.group.updateMatrixWorld();
    const inv = new THREE.Matrix4().copy(this.group.matrixWorld).invert();
    const local = ray.clone().applyMatrix4(inv);
    const scale = this.group.matrixWorld.getMaxScaleOnAxis();
    const thr = Math.max(VERTEX_RADIUS * 2.5, 0.012 / scale);
    const views = riss ? [this.center, ...this.side] : [this.center];
    let best = null, bestT = Infinity;
    const tmp = new THREE.Vector3();
    for (const P of views) {
      for (let i = 0; i < P.length; i++) {
        if (local.distanceSqToPoint(P[i]) > thr * thr) continue;
        const tt = tmp.subVectors(P[i], local.origin).dot(local.direction);
        if (tt > 0 && tt < bestT) {
          bestT = tt;
          best = { type: 'vertex', i, point: P[i].clone().applyMatrix4(this.group.matrixWorld) };
        }
      }
    }
    if (best) best.distance = best.point.distanceTo(ray.origin);
    return best;
  }

  /** Weltposition der Ecke i im Zentrum */
  centerWorld(i, out) {
    return out.copy(this.center[i]).applyMatrix4(this.group.matrixWorld);
  }
}
