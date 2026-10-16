// Alle Formen in der Reihenfolge am Pult. Neue Form: Datei in diesem Ordner anlegen und hier eintragen.

import { tesseract } from './tesseract.js';
import { cube3d } from './cube3d.js';
import { sphere3d, sphere4d } from './spheres.js';
import { car } from './car.js';

export const SHAPES = [cube3d, tesseract, sphere3d, sphere4d, car];
export const SHAPE_BY_ID = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
