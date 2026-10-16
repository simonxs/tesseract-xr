// Geometrie des Tesseracts (4D-Hyperwürfel): 16 Ecken, 32 Kanten.
// Ecke i hat die Koordinaten (±1, ±1, ±1, ±1); Bit b von i bestimmt das Vorzeichen von Achse b.

export const VERTICES = Array.from({ length: 16 }, (_, i) =>
  [0, 1, 2, 3].map((b) => ((i >> b) & 1 ? 1 : -1))
);

// Jede Kante verbindet zwei Ecken, die sich in genau einem Bit unterscheiden.
// "axis" = die Achse, zu der die Kante parallel ist → bestimmt ihre Farbe.
export const EDGES = [];
for (let i = 0; i < 16; i++) {
  for (let b = 0; b < 4; b++) {
    const j = i ^ (1 << b);
    if (i < j) EDGES.push({ i, j, axis: b });
  }
}

/** Kurzname einer Ecke aus ihren Vorzeichen, z. B. "+−+−" */
export function vertexName(i) {
  return VERTICES[i].map((s) => (s > 0 ? '+' : '−')).join('');
}
