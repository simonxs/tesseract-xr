// Wurmloch als Einbettungsdiagramm (Ellis-Wurmloch).
//
// Ein gekrümmter 3D-Raum wird als Hyperfläche in den 4D-Raum gelegt, die W-Achse ist dabei eine
// Hilfsdimension, die nur die Krümmung sichtbar macht. Jede Kugelschale mit Radius r liegt bei
//   w = ±b · arcosh(r / b)        (4D-Katenoid, b = Radius des Schlunds)
// Das Vorzeichen trennt die beiden "Seiten" (Räume), die am Schlund r = b, w = 0 verbunden sind.
//
// In den Seitenansichten ("ohne X/Y/Z") rückt W an die Stelle einer Raumachse. Dort erscheinen die
// Kreise übereinander gestapelt: das bekannte Trichterbild aus den Lehrbüchern.

import * as THREE from 'three';
import { addCircle, solid, unit } from './common.js';
import { t } from '../i18n.js';

const B = 0.5;                            // Schlundradius
const RADII = [0.62, 0.85, 1.2, 1.75];    // weitere Schalen je Seite
const SIDE_A = new THREE.Color(0x5ef2d0); // w < 0
const SIDE_B = new THREE.Color(0xff9a5c); // w > 0
const THROAT = new THREE.Color(0xffc83d);
const MERIDIAN = new THREE.Color(0xc7cfdb);

const wOf = (r) => B * Math.acosh(Math.max(1, r / B));

export const wormhole = {
  id: 'wormhole',
  get label() { return t('shape.wormhole'); },
  get hint() { return t('hint.wormhole'); },
  vertices: [],
  edges: [],
  edgeScale: 0.5,
  showPoints: false,
  selectable: false,
  unfold: false,
  get unfoldReason() { return t('reason.wormhole'); },
  vertexName: () => '',
};

{
  const s = wormhole;
  const shell = (r, sign, col) => {
    const c = [0, 0, 0, sign * wOf(r)];
    addCircle(s, c, unit(0), unit(1), r, solid(col), 36);
    addCircle(s, c, unit(0), unit(2), r, solid(col), 36);
    addCircle(s, c, unit(1), unit(2), r, solid(col), 36);
  };
  shell(B, 1, THROAT);
  for (const r of RADII) {
    const k = (r - B) / (RADII[RADII.length - 1] - B); // 0 … 1 nach außen etwas heller
    shell(r, -1, SIDE_A.clone().lerp(new THREE.Color(0xffffff), 0.25 * (1 - k)));
    shell(r, +1, SIDE_B.clone().lerp(new THREE.Color(0xffffff), 0.25 * (1 - k)));
  }

  // Meridiane: von außen auf Seite A durch den Schlund nach außen auf Seite B, in ±X, ±Y, ±Z
  const STEPS = 14, RMAX = RADII[RADII.length - 1];
  for (let a = 0; a < 3; a++) {
    for (const dir of [1, -1]) {
      const start = s.vertices.length;
      for (let k = -STEPS; k <= STEPS; k++) {
        const u = k / STEPS;                      // −1 … 1
        const r = B + (RMAX - B) * u * u;         // dichter am Schlund
        const v = [0, 0, 0, Math.sign(u) * wOf(r)];
        v[a] = dir * r;
        s.vertices.push(v);
      }
      for (let k = 0; k < 2 * STEPS; k++) s.edges.push({ i: start + k, j: start + k + 1, color: MERIDIAN });
    }
  }
}
