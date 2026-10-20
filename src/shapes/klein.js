// Kleinsche Flasche: im 3D-Raum muss sie sich selbst durchdringen, im 4D-Raum nicht.
//
// x, y, z: die klassische "Flaschen"-Form (Immersion in 3D, Parameter u ∈ [0, π), v ∈ [0, 2π)).
// w = 0,6 · sin(2u) hebt die Fläche in die 4. Dimension. An jeder Stelle, an der sich die Flasche
// in 3D durchdringt, liegen die beiden Flächenstücke dann mindestens 1,0 Einheiten auseinander
// (numerisch geprüft; w wird nicht mitskaliert). Die Farbe zeigt w: türkis = negativ, grau = 0, orange = positiv.
// Naht: (u = π, v) wird mit (u = 0, π − v) verbunden.

import * as THREE from 'three';
import { t } from '../i18n.js';

const NU = 48, NV = 24, RING_EVERY = 4, LINE_EVERY = 3;
const W_AMP = 0.6, SCALE = 0.72, OFFSET = [-0.15, -2.1, 0];
const NEG = new THREE.Color(0x5ef2d0), MID = new THREE.Color(0x9aa4b4), POS = new THREE.Color(0xff9a5c);

function bottle(u, v) {
  const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
  const x = (-2 / 15) * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su);
  const y = (-1 / 15) * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su
    + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su);
  const z = (2 / 15) * (3 + 5 * cu * su) * sv;
  return [(x + OFFSET[0]) * SCALE, (y + OFFSET[1]) * SCALE, z * SCALE, W_AMP * Math.sin(2 * u)];
}

const colorOf = (w) => {
  const k = Math.max(-1, Math.min(1, w / W_AMP));
  return k < 0 ? MID.clone().lerp(NEG, -k) : MID.clone().lerp(POS, k);
};

export const klein = {
  id: 'klein',
  get label() { return t('shape.klein'); },
  get hint() { return t('hint.klein'); },
  vertices: [],
  edges: [],
  edgeScale: 0.5,
  showPoints: false,
  selectable: false,
  unfold: false,
  get unfoldReason() { return t('reason.klein'); },
  vertexName: () => '',
};

{
  const s = klein;
  const idx = (i, k) => i * NV + ((k % NV) + NV) % NV;
  for (let i = 0; i < NU; i++) {
    for (let k = 0; k < NV; k++) s.vertices.push(bottle((i / NU) * Math.PI, (k / NV) * Math.PI * 2));
  }
  const edge = (a, b) => {
    const w = (s.vertices[a][3] + s.vertices[b][3]) / 2;
    s.edges.push({ i: a, j: b, color: colorOf(w) });
  };
  // Ringe quer zur Flasche
  for (let i = 0; i < NU; i += RING_EVERY) for (let k = 0; k < NV; k++) edge(idx(i, k), idx(i, k + 1));
  // Linien entlang der Flasche, über die Naht mit Spiegelung von v
  for (let k = 0; k < NV; k += LINE_EVERY) {
    for (let i = 0; i < NU - 1; i++) edge(idx(i, k), idx(i + 1, k));
    edge(idx(NU - 1, k), idx(0, NV / 2 - k));
  }
}
