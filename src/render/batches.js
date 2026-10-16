// Instanzierte Kanten (Leisten oder Rohre), Ecken (Kugeln) und dynamische Vierecks-Flächen.
// Pro Frame: begin() → add(...) → end(). Ein Draw-Call pro Batch, auch bei tausenden Elementen.

import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _x = new THREE.Vector3();
const _z = new THREE.Vector3();
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
  dispose() { this.mesh.geometry.dispose(); this.mesh.dispose?.(); }
}

export class SegmentBatch extends Batch {
  /**
   * beam: true  → 4-kantige Leiste (Box). Eine flache Seite zeigt von "centroid" weg,
   *               damit die Leisten eines Würfels wie ein gleichmäßiger Rahmen wirken.
   * beam: false → rundes Rohr (Zylinder)
   */
  constructor(max, material, { beam = false, radialSegments = 8 } = {}) {
    const geo = beam ? new THREE.BoxGeometry(1, 1, 1) : new THREE.CylinderGeometry(1, 1, 1, radialSegments, 1, true);
    super(geo, material, max);
    this.beam = beam;
  }

  add(a, b, r, color, centroid = ORIGIN) {
    if (this.count >= this.max) return;
    _dir.subVectors(b, a);
    const len = _dir.length();
    if (len < 1e-5) return; // zusammengefallene Kante: unsichtbar
    _dir.divideScalar(len);
    _mid.addVectors(a, b).multiplyScalar(0.5);
    if (this.beam) {
      // x-Achse der Leiste: Richtung vom Mittelpunkt der Ansicht weg, senkrecht zur Kante
      _x.subVectors(_mid, centroid);
      _x.addScaledVector(_dir, -_x.dot(_dir));
      if (_x.lengthSq() < 1e-8) {
        _x.set(Math.abs(_dir.x) > 0.9 ? 0 : 1, 0, Math.abs(_dir.x) > 0.9 ? 1 : 0);
        _x.addScaledVector(_dir, -_x.dot(_dir));
      }
      _x.normalize();
      _z.crossVectors(_x, _dir);
      _m.makeBasis(_x, _dir, _z);
      _m.scale(_s.set(r * 1.8, len, r * 1.8));
      _m.setPosition(_mid);
    } else {
      _q.setFromUnitVectors(UP, _dir);
      _m.compose(_mid, _q, _s.set(r, len, r));
    }
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
    _m.compose(p, _q, _s.set(r, r, r));
    this.mesh.setMatrixAt(this.count, _m);
    this.mesh.setColorAt(this.count, color);
    this.count++;
  }
}

/** Halbtransparente Vierecke (z. B. Zellflächen), Eckpunkte jedes Frame neu */
export class QuadFill {
  constructor(max, opacity = 0.16) {
    this.max = max;
    this.count = 0;
    this.pos = new Float32Array(max * 18);
    this.col = new Float32Array(max * 18);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    }));
    this.mesh.frustumCulled = false;
  }
  begin() { this.count = 0; }
  add(p0, p1, p2, p3, color) {
    if (this.count >= this.max) return;
    let o = this.count * 18;
    for (const p of [p0, p1, p2, p0, p2, p3]) {
      this.pos[o] = p.x; this.pos[o + 1] = p.y; this.pos[o + 2] = p.z;
      this.col[o] = color.r; this.col[o + 1] = color.g; this.col[o + 2] = color.b;
      o += 3;
    }
    this.count++;
  }
  end() {
    const g = this.mesh.geometry;
    g.setDrawRange(0, this.count * 6);
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  }
}
