// Zentrale Konstanten. Farben, Größen und Layout hier ändern, nicht in den Modulen.

export const AXES = ['X', 'Y', 'Z', 'W'];

// Kantenfarben je Achse (Three.js-Hex und CSS für Canvas-Texte)
export const AXIS_COLORS = [0xff4d4d, 0x45d36a, 0x4d8dff, 0xe24dff];
export const AXIS_CSS    = ['#ff6060', '#5cdc7c', '#6aa0ff', '#e868ff'];

// Die 6 Drehebenen. "fixed" = die Ebene, die bei dieser Drehung komplett stehen bleibt.
// Reihenfolge = Index für Knöpfe, Tastatur (1–6) und state.knobAngles.
export const PLANES = [
  { a: 0, b: 1, name: 'XY', fixed: 'ZW' },
  { a: 0, b: 2, name: 'XZ', fixed: 'YW' },
  { a: 0, b: 3, name: 'XW', fixed: 'YZ' },
  { a: 1, b: 2, name: 'YZ', fixed: 'XW' },
  { a: 1, b: 3, name: 'YW', fixed: 'XZ' },
  { a: 2, b: 3, name: 'ZW', fixed: 'XY' },
];

// Maßstab: Meter pro Tesseract-Einheit (Ecken liegen bei ±1)
export const UNIT_RISS   = 0.035;  // Rissansicht (5 Darstellungen)
export const UNIT_SINGLE = 0.075;  // nur die Form
export const UNIT_UNFOLD = 0.03;   // Aufklappen (Würfel + Tesseract nebeneinander)

// Rissansicht: Jede Seitenansicht liegt entlang der Achse, die sie weglässt.
// Index = weggelassene Achse (0 = X, 1 = Y, 2 = Z). Z-Ansicht liegt hinter dem Zentrum.
export const SIDE_OFFSET = 4.5;
export const SIDE_DIR = [[1, 0, 0], [0, 1, 0], [0, 0, -1]];
export const SIDE_FRAME = 4.2;

// 4D-Perspektive: Abstand der "Kamera" auf der W-Achse (rechter Stick ändert ihn)
export const PERSP_DIST = 4;
export const PERSP_MIN = 2.6;
export const PERSP_MAX = 9;

// Kanten als 4-kantige Leisten ('beam') oder runde Rohre ('tube')
export const EDGE_STYLE = 'beam';

// Strichstärken in Tesseract-Einheiten
export const EDGE_RADIUS = 0.07;
export const VERTEX_RADIUS = 0.13;
export const LINK_RADIUS = 0.032;
export const VERTEX_COLOR = 0xa9b2c2;

// Markierte Ecken (max. 3), Farbe je Auswahl-Platz
export const SEL_COLORS = [0xffc83d, 0x5ef2d0, 0xffffff];
export const SEL_CSS    = ['#ffc83d', '#5ef2d0', '#ffffff'];
export const MAX_SELECTION = 3;

export const AUTO_SPEED = 0.35;       // rad/s
export const KNOB_GAIN = 1.0;         // Handgelenk-Drehung → Drehwinkel
export const MOUSE_KNOB_GAIN = 0.012; // rad pro Pixel
export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 5;

// Aufklappen: Farben nach Rolle der Zelle
export const ROLE_COLORS = { base: 0x9aa4b4, wall: 0x4da3ff, lid: 0xffc83d };
export const ROLE_CSS    = { base: '#a9b2c2', wall: '#5aaeff', lid: '#ffc83d' };
export const UNFOLD_SPEED = 0.15;     // Anteil pro Sekunde bei Auto-Falten

// Ansichten (Beschriftung kommt aus i18n.js: view.<id>)
export const VIEW_MODES = [{ id: 'riss' }, { id: 'single' }, { id: 'unfold' }];
