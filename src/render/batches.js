// Instanzierte Zylinder (Kanten/Linien) und Kugeln (Ecken).
// Pro Frame: begin() → add(...) → end(). Ein Draw-Call pro Batch, auch bei hunderten Elementen.

import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();
const WHITE = new THREE.Color(1, 1, 1);

class Batch {
  constructor(geometry, material, max) {
    this.max = max;
    this.count = 0;
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let k = 0; k < max; k++) this.mesh.setColorAt(k, WHITE); // legt instanceColor an
    this.mesh.count = 0;
  }
  begin() { this.count = 0; }
  end() {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }
}

export class SegmentBatch extends Batch {
  constructor(max, material, radialSegments = 8) {
    super(new THREE.CylinderGeometry(1, 1, 1, radialSegments, 1, true), material, max);
  }
  /** Zylinder von a nach b mit Radius r */
  add(a, b, r, color) {
    if (this.count >= this.max) return;
    _dir.subVectors(b, a);
    const len = _dir.length();
    if (len < 1e-5) return; // zusammengefallene Kante: unsichtbar
    _mid.addVectors(a, b).multiplyScalar(0.5);
    _q.setFromUnitVectors(UP, _dir.divideScalar(len));
    _s.set(r, len, r);
    _m.compose(_mid, _q, _s);
    this.mesh.setMatrixAt(this.count, _m);
    this.mesh.setColorAt(this.count, color);
    this.count++;
  }
}

export class PointBatch extends Batch {
  constructor(max, material) {
    super(new THREE.SphereGeometry(1, 14, 10), material, max);
  }
  add(p, r, color) {
    if (this.count >= this.max) return;
    _q.identity();
    _s.set(r, r, r);
    _m.compose(p, _q, _s);
    this.mesh.setMatrixAt(this.count, _m);
    this.mesh.setColorAt(this.count, color);
    this.count++;
  }
}
