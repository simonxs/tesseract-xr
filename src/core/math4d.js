// 4D-Mathematik ohne Three.js-Abhängigkeit.
import { DECIMAL } from '../i18n.js';
// Matrizen sind flache Arrays mit 16 Einträgen, zeilenweise: m[zeile * 4 + spalte].
// Spalte c = Bild der ursprünglichen Achse c (wohin X, Y, Z, W jetzt zeigen).

export function identity4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** Dreht in der Ebene (a, b) um theta, bezogen auf die festen Weltachsen: M ← G · M */
export function rotatePlane(m, a, b, theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  for (let col = 0; col < 4; col++) {
    const ra = m[a * 4 + col], rb = m[b * 4 + col];
    m[a * 4 + col] = c * ra - s * rb;
    m[b * 4 + col] = s * ra + c * rb;
  }
}

/** out = M · v */
export function applyMat(m, v, out) {
  for (let r = 0; r < 4; r++) {
    out[r] = m[r * 4] * v[0] + m[r * 4 + 1] * v[1] + m[r * 4 + 2] * v[2] + m[r * 4 + 3] * v[3];
  }
  return out;
}

/** Gram-Schmidt über die Spalten, damit sich Rundungsfehler nicht aufsummieren */
export function orthonormalize(m) {
  for (let c = 0; c < 4; c++) {
    for (let p = 0; p < c; p++) {
      let dot = 0;
      for (let r = 0; r < 4; r++) dot += m[r * 4 + c] * m[r * 4 + p];
      for (let r = 0; r < 4; r++) m[r * 4 + c] -= dot * m[r * 4 + p];
    }
    let len = 0;
    for (let r = 0; r < 4; r++) len += m[r * 4 + c] ** 2;
    len = Math.sqrt(len) || 1;
    for (let r = 0; r < 4; r++) m[r * 4 + c] /= len;
  }
}

/**
 * Zentrum: Mischung aus orthogonaler (t = 0) und perspektivischer (t = 1) Projektion 4D → 3D.
 * Die 4D-Kamera sitzt bei w = d und blickt Richtung −w. Bei w = 0 ist der Maßstab 1.
 */
export function projectCenter(v, t, d, out) {
  const f = 1 + t * (d / (d - v[3]) - 1);
  out.set(v[0] * f, v[1] * f, v[2] * f);
  return out;
}

/** Seitenansicht "ohne Achse a": Achse a wird weggelassen, W rückt auf ihren Platz. */
export function projectSide(v, a, out) {
  out.set(v[0], v[1], v[2]);
  out.setComponent(a, v[3]);
  return out;
}

/** Perspektivischer Faktor, z. B. für "dicker = näher in W" */
export function nearness(w) {
  return 1 + 0.25 * w; // w in [-2, 2] → 0.5 … 1.5
}

/** Zahl mit Vorzeichen im Format der Sprache: +0,71 (de) bzw. +0.71 (en) */
export function fmt(v, digits = 2) {
  if (Math.abs(v) < 0.5 * 10 ** -digits) return ' ' + (0).toFixed(digits).replace('.', DECIMAL);
  return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(digits).replace('.', DECIMAL);
}

/** Winkel (rad) → "+37°", gefaltet auf (−180°, 180°] */
export function fmtDeg(rad) {
  let d = ((rad * 180) / Math.PI) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  const r = Math.round(d);
  return (r === 0 ? '' : r > 0 ? '+' : '−') + Math.abs(r) + '°';
}
