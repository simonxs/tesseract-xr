// Aufbau greifen (eine Hand: verschieben/drehen) und zoomen (zwei Hände: Abstand = Maßstab).
// Ändert nur die Lage im Raum (Blickwinkel), nicht die 4D-Orientierung.

import * as THREE from 'three';
import { ZOOM_MIN, ZOOM_MAX } from '../config.js';

const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _yq = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

export class Manipulator {
  constructor(object) {
    this.obj = object;
    this.grabbers = [];
  }

  get count() { return this.grabbers.length; }

  add(p) {
    if (this.grabbers.length >= 2 || this.grabbers.includes(p)) return;
    this.grabbers.push(p);
    this.begin();
  }

  remove(p) {
    const k = this.grabbers.indexOf(p);
    if (k >= 0) this.grabbers.splice(k, 1);
    this.begin();
  }

  begin() {
    const o = this.obj;
    o.updateMatrixWorld();
    if (this.grabbers.length === 1) {
      const sp = this.grabbers[0].space;
      sp.updateMatrixWorld(true);
      this.offset = new THREE.Matrix4().copy(sp.matrixWorld).invert().multiply(o.matrixWorld);
    } else if (this.grabbers.length === 2) {
      this.handPositions(_a, _b);
      this.s0 = o.scale.x;
      this.p0 = o.position.clone();
      this.q0 = o.quaternion.clone();
      this.mid0 = _a.clone().add(_b).multiplyScalar(0.5);
      this.d0 = Math.max(0.02, _a.distanceTo(_b));
      this.yaw0 = Math.atan2(_b.x - _a.x, _b.z - _a.z);
    }
  }

  handPositions(a, b) {
    const [g0, g1] = this.grabbers;
    g0.space.updateMatrixWorld(true);
    g1.space.updateMatrixWorld(true);
    a.setFromMatrixPosition(g0.space.matrixWorld);
    b.setFromMatrixPosition(g1.space.matrixWorld);
  }

  /** Stick vor/zurück beim Greifen: Aufbau entlang des Strahls schieben (dz in Metern) */
  push(p, dz) {
    if (this.grabbers.length === 1 && this.grabbers[0] === p) {
      this.offset.premultiply(_m.makeTranslation(0, 0, dz));
    }
  }

  update() {
    const o = this.obj;
    if (this.grabbers.length === 1) {
      const sp = this.grabbers[0].space;
      sp.updateMatrixWorld(true);
      _m.multiplyMatrices(sp.matrixWorld, this.offset);
      _m.decompose(o.position, o.quaternion, _s);
    } else if (this.grabbers.length === 2) {
      this.handPositions(_a, _b);
      const d = Math.max(0.02, _a.distanceTo(_b));
      const s = THREE.MathUtils.clamp((this.s0 * d) / this.d0, ZOOM_MIN, ZOOM_MAX);
      const k = s / this.s0;
      const yaw = Math.atan2(_b.x - _a.x, _b.z - _a.z) - this.yaw0;
      _yq.setFromAxisAngle(UP, yaw);
      _mid.addVectors(_a, _b).multiplyScalar(0.5);
      o.position.copy(this.p0).sub(this.mid0).multiplyScalar(k).applyQuaternion(_yq).add(_mid);
      o.quaternion.copy(_yq).multiply(this.q0);
      o.scale.setScalar(s);
    }
  }
}
