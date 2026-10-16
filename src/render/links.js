// Ordnungslinien für markierte Ecken in der Rissansicht.
//
// Zentrum ↔ Seitenansicht "ohne a": gerade Linie. Im orthogonalen Zentrum ist sie achsparallel
//   (entlang Achse a), weil beide Darstellungen die übrigen zwei Koordinaten teilen.
// Seitenansicht a ↔ Seitenansicht b: wie beim technischen Zeichnen über einen Viertelkreis.
//   Er überträgt die W-Koordinate von der a-Richtung in die b-Richtung (Mittelpunkt = Ecke,
//   an der sich die Versatzachsen treffen; Radius = w).

import * as THREE from 'three';
import { SegmentBatch } from './batches.js';
import { SIDE_OFFSET, SIDE_DIR, LINK_RADIUS, SEL_COLORS, AXIS_COLORS } from '../config.js';

const SEL_COL = SEL_COLORS.map((c) => new THREE.Color(c));
const ARC_COL = new THREE.Color(AXIS_COLORS[3]);
const PAIRS = [[0, 1], [0, 2], [1, 2]];
const ARC_STEPS = 16;

export class Links {
  constructor() {
    this.batch = new SegmentBatch(600, new THREE.MeshBasicMaterial(), { radialSegments: 6 });
    this.mesh = this.batch.mesh;
    this.off = SIDE_DIR.map((d, a) => SIDE_OFFSET * d[a]); // vorzeichenbehafteter Versatz je Achse
    this._p = Array.from({ length: ARC_STEPS + 4 }, () => new THREE.Vector3());
  }

  update(state, views) {
    this.batch.begin();
    if (state.viewMode === 'riss' && views.shape.selectable) {
      state.selection.forEach((i, k) => {
        const col = SEL_COL[k];
        const C = views.center[i];
        for (let a = 0; a < 3; a++) this.batch.add(C, views.side[a][i], LINK_RADIUS, col);
        for (const [a, b] of PAIRS) this.arcPath(views, i, a, b, col);
      });
    }
    this.batch.end();
  }

  arcPath(views, i, a, b, col) {
    const Sa = views.side[a][i], Sb = views.side[b][i];
    const w = views.rot[i][3];
    const oa = this.off[a], ob = this.off[b];
    // Sa → P1: entlang b bis zur Versatz-Ebene von b
    const P1 = this._p[0].copy(Sa).setComponent(b, ob);
    this.batch.add(Sa, P1, LINK_RADIUS, col);
    // Viertelkreis um (oa, ob) mit Radius w
    let prev = P1;
    for (let s = 1; s <= ARC_STEPS; s++) {
      const th = (s / ARC_STEPS) * (Math.PI / 2);
      const q = this._p[s].copy(Sa);
      q.setComponent(a, oa + w * Math.cos(th));
      q.setComponent(b, ob + w * Math.sin(th));
      this.batch.add(prev, q, LINK_RADIUS, ARC_COL);
      prev = q;
    }
    // P2 → Sb: entlang a
    this.batch.add(prev, Sb, LINK_RADIUS, col);
  }
}
