// 3D-Kugel (bei w = 0) und 4D-Kugel (Hypersphäre), als Gitternetz aus Kreisen.
// Zweifarbig gestrichelte Kreise liegen in den Koordinatenebenen und tragen die Farben ihrer
// zwei Achsen, genau wie die Ringe der Drehknöpfe.

import * as THREE from 'three';
import { PLANES, AXIS_COLORS } from '../config.js';
import { addCircle, dashed, solid, unit } from './common.js';
import { t } from '../i18n.js';

const R = 1.5;
const GREY = new THREE.Color(0x8792a6);

function base(id) {
  return {
    id,
    get label() { return t(`shape.${id}`); },
    get hint() { return t(`hint.${id}`); },
    vertices: [], edges: [],
    edgeScale: 0.55,
    showPoints: false,
    selectable: false,
    unfold: false,
    get unfoldReason() { return t('reason.sphere'); },
    vertexName: () => '',
  };
}

// ---------- 3D-Kugel ----------
export const sphere3d = base('sphere3d');
{
  const s = sphere3d, O = [0, 0, 0, 0];
  addCircle(s, O, unit(0), unit(1), R, dashed(0, 1));   // XY
  addCircle(s, O, unit(0), unit(2), R, dashed(0, 2));   // XZ (Äquator)
  addCircle(s, O, unit(1), unit(2), R, dashed(1, 2));   // YZ
  for (const phi of [Math.PI / 4, (3 * Math.PI) / 4]) {  // weitere Meridiane
    addCircle(s, O, [Math.cos(phi), 0, Math.sin(phi), 0], unit(1), R, solid(GREY));
  }
  for (const lat of [-60, -30, 30, 60]) {                // Breitenkreise
    const a = (lat * Math.PI) / 180;
    addCircle(s, [0, R * Math.sin(a), 0, 0], unit(0), unit(2), R * Math.cos(a), solid(GREY));
  }
}

// ---------- 4D-Kugel ----------
export const sphere4d = base('sphere4d');
{
  const s = sphere4d, O = [0, 0, 0, 0];
  for (const p of PLANES) addCircle(s, O, unit(p.a), unit(p.b), R, dashed(p.a, p.b));
  // "w-Schalen": 3D-Kugeln, die bei festem w im Inneren liegen (wie Breitenkreise eine Stufe höher)
  for (const k of [-0.6, 0.6]) {
    const col = GREY.clone().lerp(new THREE.Color(AXIS_COLORS[3]), k > 0 ? 0.45 : 0.1);
    const r = R * Math.sqrt(1 - k * k);
    const c = [0, 0, 0, k * R];
    addCircle(s, c, unit(0), unit(1), r, solid(col), 40);
    addCircle(s, c, unit(0), unit(2), r, solid(col), 40);
    addCircle(s, c, unit(1), unit(2), r, solid(col), 40);
  }
}
