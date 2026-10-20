// Weitere 4D-Körper: 16-Zeller, 24-Zeller, Duoprisma (Sechseck × Sechseck).
//
// Ihre Kanten liegen nicht parallel zu einer Achse, sondern parallel zu einer Koordinatenebene.
// Deshalb ist jede Kante zweifarbig: die Hälfte in der Farbe der einen Achse, die andere in der
// Farbe der anderen, wie die Ringe der Drehknöpfe und die Großkreise der 4D-Kugel.
// Technisch bekommt jede Kante dafür einen Mittelpunkt; gezeichnet und anwählbar sind nur die
// ersten `pointCount` Ecken (die echten).

import { AXIS_COL, signs } from './common.js';
import { t } from '../i18n.js';

/** Die zwei Achsen, in denen sich zwei Punkte am stärksten unterscheiden = Ebene der Kante */
function planeOf(p, q) {
  const d = p.map((x, i) => Math.abs(q[i] - x));
  const order = [0, 1, 2, 3].sort((a, b) => d[b] - d[a]);
  return [Math.min(order[0], order[1]), Math.max(order[0], order[1])];
}

/** Kante i–j als zwei Hälften in den Farben der Ebene (a, b); a nahe i */
function addSplitEdge(shape, i, j, a, b) {
  const p = shape.vertices[i], q = shape.vertices[j];
  const m = shape.vertices.length;
  shape.vertices.push(p.map((x, k) => (x + q[k]) / 2));
  // Farbe der Hälfte bei p: die Achse, in der p "liegt" (größerer Betrag)
  const [ca, cb] = Math.abs(p[a]) >= Math.abs(p[b]) ? [a, b] : [b, a];
  shape.edges.push({ i, j: m, color: AXIS_COL[ca] }, { i: m, j, color: AXIS_COL[cb] });
}

function base(id, extra) {
  return {
    id,
    get label() { return t(`shape.${id}`); },
    get hint() { return t(`hint.${id}`); },
    vertices: [],
    edges: [],
    edgeScale: 0.8,
    showPoints: true,
    selectable: true,
    unfold: false,
    get unfoldReason() { return t('reason.polytope'); },
    ...extra,
  };
}

// ---------- 16-Zeller: Ecken ±R auf jeder Achse, jede Ecke mit allen außer der gegenüberliegenden ----------
export const cell16 = base('cell16');
{
  const R = 1.7, s = cell16;
  for (let a = 0; a < 4; a++) for (const sg of [1, -1]) { const v = [0, 0, 0, 0]; v[a] = sg * R; s.vertices.push(v); }
  s.pointCount = 8;
  s.vertexName = (i) => `${i & 1 ? '−' : '+'}${'XYZW'[i >> 1]}`;
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const ai = i >> 1, aj = j >> 1;
      if (ai === aj) continue; // gegenüberliegend
      addSplitEdge(s, i, j, Math.min(ai, aj), Math.max(ai, aj));
    }
  }
}

// ---------- 24-Zeller: alle Permutationen von (±1, ±1, 0, 0), Kantenlänge √2 ----------
export const cell24 = base('cell24', { edgeScale: 0.65 });
{
  const R = 1.25, s = cell24;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      for (const sa of [1, -1]) for (const sb of [1, -1]) {
        const v = [0, 0, 0, 0]; v[a] = sa * R; v[b] = sb * R; s.vertices.push(v);
      }
    }
  }
  s.pointCount = 24;
  s.vertexName = (i) => signs(s.vertices[i].map((x) => Math.sign(x)));
  for (let i = 0; i < 24; i++) {
    for (let j = i + 1; j < 24; j++) {
      const p = s.vertices[i], q = s.vertices[j];
      const d2 = p.reduce((sum, x, k) => sum + (x - q[k]) ** 2, 0);
      if (Math.abs(d2 - 2 * R * R) > 1e-6) continue;
      const [a, b] = planeOf(p, q);
      addSplitEdge(s, i, j, a, b);
    }
  }
}

// ---------- Duoprisma: Sechseck in XY × Sechseck in ZW ----------
export const duoprism = base('duoprism', { showPoints: false, selectable: false, edgeScale: 0.7 });
{
  const N = 6, R = 1.35, s = duoprism;
  const idx = (i, k) => i * N + k;
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < N; k++) {
      const a = (i / N) * Math.PI * 2, b = (k / N) * Math.PI * 2;
      s.vertices.push([R * Math.cos(a), R * Math.sin(a), R * Math.cos(b), R * Math.sin(b)]);
    }
  }
  s.pointCount = N * N;
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < N; k++) {
      addSplitEdge(s, idx(i, k), idx((i + 1) % N, k), 0, 1); // Sechseck-Kante in XY
      addSplitEdge(s, idx(i, k), idx(i, (k + 1) % N), 2, 3); // Sechseck-Kante in ZW
    }
  }
}
