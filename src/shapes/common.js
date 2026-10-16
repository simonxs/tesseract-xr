// Hilfsfunktionen für Formen.
//
// Eine Form ist ein Objekt mit:
//   id, label           Kennung und Name für das Pult
//   vertices            Ecken als [x, y, z, w]
//   edges               Kanten als { i, j, color: THREE.Color }
//   edgeScale           Faktor für die Kantenstärke (dünner bei Kugeln)
//   showPoints          Ecken als Kugeln zeichnen
//   selectable          Ecken antippen/markieren möglich (mit Ordnungslinien)
//   unfold              Aufklappen möglich
//   unfoldReason        Text, falls Aufklappen nicht geht
//   mesh                optional: Flächen-Teile (siehe car.js), werden mitgedreht und projiziert
//   vertexName(i)       Kurzname einer Ecke
//   hint                eine Zeile für die Legende

import * as THREE from 'three';
import { AXIS_COLORS } from '../config.js';

export const AXIS_COL = AXIS_COLORS.map((c) => new THREE.Color(c));

export const signs = (v, n = 4) => v.slice(0, n).map((s) => (s > 0 ? '+' : s < 0 ? '−' : '0')).join('');

export const unit = (a) => {
  const v = [0, 0, 0, 0];
  v[a] = 1;
  return v;
};

/** Kreis mit Mittelpunkt c in der Ebene (u, v), Radius r. colorAt(k) liefert die Farbe von Segment k. */
export function addCircle(shape, c, u, v, r, colorAt, segs = 48) {
  const start = shape.vertices.length;
  for (let k = 0; k < segs; k++) {
    const th = (k / segs) * Math.PI * 2;
    const cs = Math.cos(th) * r, sn = Math.sin(th) * r;
    shape.vertices.push([0, 1, 2, 3].map((d) => c[d] + cs * u[d] + sn * v[d]));
  }
  for (let k = 0; k < segs; k++) {
    shape.edges.push({ i: start + k, j: start + ((k + 1) % segs), color: colorAt(k) });
  }
}

/** Zweifarbig gestrichelt, passend zu den zweifarbigen Knopf-Ringen */
export const dashed = (a, b, len = 4) => (k) => (Math.floor(k / len) % 2 ? AXIS_COL[b] : AXIS_COL[a]);
export const solid = (color) => () => color;
