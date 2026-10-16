// Flächenmodell (z. B. das Auto) durch 4D-Drehung und Projektion schicken.
// Jede Ansicht hat ihren eigenen MeshProjector, weil die Projektion verschieden ist.
// flatShading berechnet die Normalen im Shader. Das funktioniert auch bei Spiegelung
// (umgedrehter Dreiecks-Umlaufsinn), deshalb sind die Flächen beidseitig.

import * as THREE from 'three';
import { applyMat } from '../core/math4d.js';

export class MeshProjector {
  /** part: { positions: Float32Array (3D, w = 0), colors?, uvs?, map? } */
  constructor(part) {
    this.base = part.positions;
    this.n = this.base.length / 3;
    this.pos = new Float32Array(this.base.length);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    if (part.colors) g.setAttribute('color', new THREE.BufferAttribute(part.colors, 3));
    if (part.uvs) g.setAttribute('uv', new THREE.BufferAttribute(part.uvs, 2));
    const material = part.map
      ? new THREE.MeshStandardMaterial({ map: part.map, side: THREE.DoubleSide, flatShading: true, roughness: 0.6 })
      : new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true, roughness: 0.55 });
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.frustumCulled = false;
    this._v = [0, 0, 0, 0];
    this._r = [0, 0, 0, 0];
    this._o = new THREE.Vector3();
  }

  /** project(r4, outVector3) */
  update(M, project) {
    const b = this.base, p = this.pos, v = this._v, r = this._r, o = this._o;
    for (let i = 0; i < this.n; i++) {
      v[0] = b[3 * i]; v[1] = b[3 * i + 1]; v[2] = b[3 * i + 2]; v[3] = 0;
      applyMat(M, v, r);
      project(r, o);
      p[3 * i] = o.x; p[3 * i + 1] = o.y; p[3 * i + 2] = o.z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
