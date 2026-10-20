// Alle Formen, gruppiert wie die Fächer im Regal (eine Gruppe = ein Regalboden).
// Neue Form: Datei in diesem Ordner anlegen und hier in eine Gruppe eintragen.
// Ein Regalboden hat Platz für SHELF_COLS Formen (siehe ui/shelf.js).

import { tesseract } from './tesseract.js';
import { cube3d } from './cube3d.js';
import { sphere3d, sphere4d } from './spheres.js';
import { cell16, cell24, duoprism } from './polytopes.js';
import { car } from './car.js';
import { klein } from './klein.js';
import { wormhole } from './wormhole.js';

export const GROUPS = [
  { id: 'basic', shapes: [cube3d, tesseract, sphere3d, sphere4d] },
  { id: 'polytopes', shapes: [cell16, cell24, duoprism] },
  { id: 'special', shapes: [car, klein, wormhole] },
];

export const SHAPES = GROUPS.flatMap((g) => g.shapes);
export const SHAPE_BY_ID = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
