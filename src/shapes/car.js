// Ein einfaches Cabrio aus Grundformen, flach bei w = 0 im 4D-Raum.
// Absichtlich asymmetrisch: Lenkrad links, Kennzeichen mit Schrift.
// Nach 180° in XW (oder YW, ZW) kommt es als Spiegelbild zurück: Lenkrad rechts, Schrift spiegelverkehrt.
//
// Fahrtrichtung = +x, oben = +y, links (in Fahrtrichtung) = −z.

import * as THREE from 'three';
import { t } from '../i18n.js';

const C = {
  body: 0xf2a93b, dark: 0x2b2f37, seat: 0x3d4350, glass: 0x9fd3ff, wheel: 0x1f2228,
  hub: 0xc9ced8, black: 0x15171b, head: 0xfff1a8, tail: 0xff3b3b,
};

function plateTexture(text) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#111';
  g.lineWidth = 10;
  g.strokeRect(5, 5, 502, 118);
  g.fillStyle = '#2050c8';
  g.fillRect(10, 10, 56, 108);
  g.fillStyle = '#111';
  g.font = 'bold 84px system-ui, sans-serif';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(text, 290, 68);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildCar() {
  const pos = [], col = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  const color = new THREE.Color();

  const add = (geo, [x, y, z], hex, rot = [0, 0, 0]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(...rot)), s);
    g.applyMatrix4(m);
    const p = g.attributes.position.array;
    color.setHex(hex);
    for (let k = 0; k < p.length; k += 3) {
      pos.push(p[k], p[k + 1], p[k + 2]);
      col.push(color.r, color.g, color.b);
    }
  };
  const box = (sx, sy, sz, at, hex, rot) => add(new THREE.BoxGeometry(sx, sy, sz), at, hex, rot);

  // Karosserie
  box(3.4, 0.5, 1.6, [0, -0.33, 0], C.body);
  box(0.9, 0.18, 1.6, [1.2, -0.0, 0], C.body);            // Motorhaube
  box(0.8, 0.22, 1.6, [-1.3, 0.0, 0], C.body);            // Heck
  box(1.9, 0.14, 0.12, [-0.1, 0.0, -0.74], C.body);       // Seitenwand links
  box(1.9, 0.14, 0.12, [-0.1, 0.0, 0.74], C.body);        // Seitenwand rechts
  // Windschutzscheibe (schräg) und Armaturenbrett
  box(0.06, 0.5, 1.5, [0.62, 0.3, 0], C.glass, [0, 0, -0.45]);
  box(0.18, 0.16, 1.4, [0.5, 0.08, 0], C.dark);
  // Sitze
  for (const z of [-0.38, 0.38]) {
    box(0.5, 0.14, 0.52, [-0.2, -0.02, z], C.seat);
    box(0.12, 0.55, 0.52, [-0.48, 0.25, z], C.seat, [0, 0, 0.12]);
  }
  // Lenkrad links (z < 0) mit Lenksäule
  add(new THREE.TorusGeometry(0.17, 0.035, 8, 24), [0.28, 0.28, -0.38], C.black, [0, Math.PI / 2, 0.35]);
  box(0.28, 0.05, 0.05, [0.4, 0.2, -0.38], C.black, [0, 0, 0.5]);
  // Räder
  for (const x of [-1.1, 1.1]) {
    for (const z of [-0.75, 0.75]) {
      add(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 18), [x, -0.55, z], C.wheel, [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.14, 0.14, 0.27, 12), [x, -0.55, z], C.hub, [Math.PI / 2, 0, 0]);
    }
  }
  // Lichter
  for (const z of [-0.55, 0.55]) {
    box(0.05, 0.14, 0.3, [1.71, -0.2, z], C.head);
    box(0.05, 0.14, 0.3, [-1.71, -0.2, z], C.tail);
  }

  // Kennzeichen vorn und hinten (eigene Teile mit Textur)
  const plate = (x, ry) => {
    const g = new THREE.PlaneGeometry(0.8, 0.2).toNonIndexed();
    g.applyMatrix4(m.compose(new THREE.Vector3(x, -0.42, 0), q.setFromEuler(e.set(0, ry, 0)), s));
    return { positions: new Float32Array(g.attributes.position.array), uvs: new Float32Array(g.attributes.uv.array) };
  };
  const map = plateTexture('4D·XR 1');
  const front = plate(1.725, Math.PI / 2), back = plate(-1.725, -Math.PI / 2);

  const SCALE = 0.9;
  const scaleArr = (a) => a.map((v) => v * SCALE);
  return [
    { positions: scaleArr(new Float32Array(pos)), colors: new Float32Array(col) },
    { positions: scaleArr(front.positions), uvs: front.uvs, map },
    { positions: scaleArr(back.positions), uvs: back.uvs, map },
  ];
}

export const car = {
  id: 'car',
  get label() { return t('shape.car'); },
  vertices: [],
  edges: [],
  edgeScale: 1,
  showPoints: false,
  selectable: false,
  unfold: false,
  get unfoldReason() { return t('reason.car'); },
  vertexName: () => '',
  get hint() { return t('hint.car'); },
  get mesh() { return (this._mesh ||= buildCar()); },
};
