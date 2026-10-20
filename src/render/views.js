// Darstellung der gewählten Form: Zentrum (perspektivisch/orthogonal) und in der Rissansicht
// zusätzlich die Seitenansichten "ohne X/Y/Z". Alles liegt in this.group, deren Maßstab = Meter pro Einheit.

import * as THREE from 'three';
import { applyMat, projectCenter, projectSide, nearness } from '../core/math4d.js';
import {
  AXES, AXIS_COLORS, AXIS_CSS, SIDE_OFFSET, SIDE_DIR, SIDE_FRAME, EDGE_STYLE,
  EDGE_RADIUS, VERTEX_RADIUS, VERTEX_COLOR, SEL_COLORS,
} from '../config.js';
import { SegmentBatch, PointBatch } from './batches.js';
import { MeshProjector } from './meshProjector.js';
import { CanvasPanel, richText, FONT, UI } from '../ui/canvasPanel.js';
import { t } from '../i18n.js';

const SEL_COL = SEL_COLORS.map((c) => new THREE.Color(c));
const V_COL = new THREE.Color(VERTEX_COLOR);
const HOVER_COL = new THREE.Color(0xffffff);
const ORIGIN = new THREE.Vector3();

export class ViewSet {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'views';
    this.edgeMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 });
    this.vertMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 });
    this.sideOffset = SIDE_DIR.map((d) => new THREE.Vector3(...d).multiplyScalar(SIDE_OFFSET));
    this.projectors = [];

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
        richText(ctx, [{ t: t('view.without') }, { t: AXES[a], c: AXIS_CSS[a] }], w / 2, 40, 'center', `700 46px ${FONT}`);
        richText(ctx, [
          { t: 'W', c: AXIS_CSS[3] }, { t: t('view.liesOn'), c: UI.dim },
          { t: AXES[a], c: AXIS_CSS[a] }, { t: t('view.dir'), c: UI.dim },
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

  /** Neue Form: Batches und Flächenmodelle passend anlegen */
  setShape(shape) {
    this.shape = shape;
    if (this.edges) {
      this.group.remove(this.edges.mesh, this.points.mesh);
      this.edges.dispose();
      this.points.dispose();
    }
    for (const { p } of this.projectors) { this.group.remove(p.mesh); p.dispose(); }
    this.projectors = [];

    const nV = shape.vertices.length, nE = shape.edges.length;
    this.edges = new SegmentBatch(Math.max(1, nE * 4), this.edgeMat, { beam: EDGE_STYLE === 'beam' });
    this.points = new PointBatch(Math.max(1, nV * 4), this.vertMat);
    this.group.add(this.edges.mesh, this.points.mesh);

    this.rot = shape.vertices.map(() => [0, 0, 0, 0]);
    this.center = shape.vertices.map(() => new THREE.Vector3());
    this.side = [0, 1, 2].map(() => shape.vertices.map(() => new THREE.Vector3()));

    if (shape.mesh) {
      for (let view = 0; view < 4; view++) {
        for (const part of shape.mesh) {
          const p = new MeshProjector(part);
          this.group.add(p.mesh);
          this.projectors.push({ view, p });
        }
      }
    }
  }

  /** Projiziert alle Ecken neu und befüllt die Batches. hover = { type: 'vertex', i } | null */
  update(state, hover) {
    const shape = this.shape;
    const M = state.M, blend = state.easedBlend, d = state.perspDist;
    const riss = state.viewMode === 'riss';
    const V = shape.vertices;

    for (let i = 0; i < V.length; i++) {
      const r = applyMat(M, V[i], this.rot[i]);
      projectCenter(r, blend, d, this.center[i]);
      if (riss) for (let a = 0; a < 3; a++) projectSide(r, a, this.side[a][i]).add(this.sideOffset[a]);
    }

    const views = riss ? [this.center, ...this.side] : [this.center];
    const centroids = [ORIGIN, ...this.sideOffset];
    const er = EDGE_RADIUS * shape.edgeScale;

    this.edges.begin();
    views.forEach((P, v) => {
      for (const e of shape.edges) {
        const w = (this.rot[e.i][3] + this.rot[e.j][3]) / 2;
        this.edges.add(P[e.i], P[e.j], er * nearness(w), e.color, centroids[v]);
      }
    });
    this.edges.end();

    this.points.begin();
    if (shape.showPoints) {
      for (const P of views) {
        for (let i = 0; i < (shape.pointCount ?? V.length); i++) {
          const s = state.selection.indexOf(i);
          const hov = hover && hover.type === 'vertex' && hover.i === i;
          const col = s >= 0 ? SEL_COL[s] : hov ? HOVER_COL : V_COL;
          const k = s >= 0 ? 1.8 : hov ? 1.5 : 1;
          this.points.add(P[i], VERTEX_RADIUS * nearness(this.rot[i][3]) * k, col);
        }
      }
    }
    this.points.end();

    for (const { view, p } of this.projectors) {
      p.mesh.visible = view === 0 || riss;
      if (!p.mesh.visible) continue;
      if (view === 0) p.update(M, (r, o) => projectCenter(r, blend, d, o));
      else {
        const a = view - 1, off = this.sideOffset[a];
        p.update(M, (r, o) => projectSide(r, a, o).add(off));
      }
    }

    for (const g of this.sideDecor) g.visible = riss;

    this.centerLabel.drawIfChanged(`${state.perspective}`, (ctx, w) => {
      ctx.textBaseline = 'middle';
      const segs = state.perspective
        ? [{ t: t('view.centerPersp') }, { t: 'W', c: AXIS_CSS[3] }]
        : [{ t: t('view.centerOrtho') }, { t: 'W', c: AXIS_CSS[3] }, { t: t('view.orthoSuffix') }];
      richText(ctx, segs, w / 2, 40, 'center', `600 34px ${FONT}`);
    }, 0);
  }

  /** Nächste Ecke entlang eines Strahls (Weltkoordinaten) oder null */
  pickVertex(ray, riss) {
    if (!this.shape?.selectable || !this.group.visible) return null;
    this.group.updateMatrixWorld();
    const inv = new THREE.Matrix4().copy(this.group.matrixWorld).invert();
    const local = ray.clone().applyMatrix4(inv);
    const scale = this.group.matrixWorld.getMaxScaleOnAxis();
    const thr = Math.max(VERTEX_RADIUS * 2.5, 0.012 / scale);
    const views = riss ? [this.center, ...this.side] : [this.center];
    let best = null, bestT = Infinity;
    const tmp = new THREE.Vector3();
    for (const P of views) {
      for (let i = 0; i < (this.shape.pointCount ?? P.length); i++) {
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

  centerWorld(i, out) {
    return out.copy(this.center[i]).applyMatrix4(this.group.matrixWorld);
  }
}
