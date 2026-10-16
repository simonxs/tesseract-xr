// Tesseract (4D-Hyperwürfel): 16 Ecken (±1, ±1, ±1, ±1), 32 Kanten.
// Bit b des Eckenindex bestimmt das Vorzeichen von Achse b.
// Jede Kante verbindet zwei Ecken, die sich in genau einem Bit unterscheiden → Farbe dieser Achse.

import { AXIS_COL, signs } from './common.js';
import { t } from '../i18n.js';

const vertices = Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3].map((b) => ((i >> b) & 1 ? 1 : -1)));
const edges = [];
for (let i = 0; i < 16; i++) {
  for (let b = 0; b < 4; b++) {
    const j = i ^ (1 << b);
    if (i < j) edges.push({ i, j, axis: b, color: AXIS_COL[b] });
  }
}

export const tesseract = {
  id: 'tesseract',
  get label() { return t('shape.tesseract'); },
  vertices,
  edges,
  edgeScale: 1,
  showPoints: true,
  selectable: true,
  unfold: true,
  vertexName: (i) => signs(vertices[i]),
  get hint() { return t('hint.tesseract'); },
};
