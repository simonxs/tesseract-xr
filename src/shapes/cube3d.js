// Normaler 3D-Würfel, im 4D-Raum flach bei w = 0 abgelegt (wie ein Blatt Papier im 3D-Raum).
// In der Ansicht "ohne X" (und Y, Z) ist er deshalb in Ruhe platt.

import { AXIS_COL, signs } from './common.js';

const vertices = Array.from({ length: 8 }, (_, i) => [0, 1, 2].map((b) => ((i >> b) & 1 ? 1 : -1)).concat(0));
const edges = [];
for (let i = 0; i < 8; i++) {
  for (let b = 0; b < 3; b++) {
    const j = i ^ (1 << b);
    if (i < j) edges.push({ i, j, axis: b, color: AXIS_COL[b] });
  }
}

export const cube3d = {
  id: 'cube3d',
  label: '3D-Würfel',
  vertices,
  edges,
  edgeScale: 1,
  showPoints: true,
  selectable: true,
  unfold: true,
  vertexName: (i) => signs(vertices[i], 3),
  hint: 'liegt flach bei w = 0',
};
