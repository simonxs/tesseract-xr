// Übersetzungen. Sprache: ?lang=de|en in der Adresse, sonst gespeicherte Wahl, sonst Browsersprache.
// Neue Sprache: weiteren Block in DICT anlegen, fehlende Schlüssel fallen auf Englisch zurück.

const DICT = {
  de: {
    'shape.cube3d': '3D-Würfel',
    'shape.tesseract': '4D-Würfel',
    'shape.sphere3d': '3D-Kugel',
    'shape.sphere4d': '4D-Kugel',
    'shape.car': '3D-Auto',
    'shape.wormhole': 'Wurmloch',
    'hint.tesseract': 'Kantenfarbe = Achsenrichtung',
    'hint.cube3d': 'liegt flach bei w = 0',
    'hint.sphere3d': 'Kreise in den Achsenfarben = Koordinatenebenen',
    'hint.sphere4d': 'je ein Großkreis pro Drehebene, blasse Schalen bei w = ±0,9',
    'hint.car': 'Lenkrad links · Drehe XW auf 180°',
    'hint.wormhole': 'Gekrümmter 3D-Raum, W zeigt nur die Krümmung · Seitenansichten: der Trichter',
    'reason.sphere': 'Eine Kugel lässt sich nicht flach abwickeln',
    'reason.car': 'Ein Auto lässt sich nicht aufklappen',
    'reason.wormhole': 'Ein Wurmloch lässt sich nicht aufklappen',
    'msg.switchedRiss': '{reason}. Gewechselt zur Rissansicht.',

    'view.riss': 'Rissansicht',
    'view.single': 'nur Form',
    'view.unfold': 'Aufklappen',

    'pult.shape': 'FORM',
    'pult.view': 'ANSICHT',
    'pult.row3d': '3D-DREHUNGEN  ·  wie gewohnt',
    'pult.row4d': '4D-DREHUNGEN  ·  in die 4. Dimension',
    'pult.rowFold': 'FALTEN  ·  Würfel und Tesseract gemeinsam',
    'knob.fixed': 'fest: {p}',
    'fold.knob': 'Aufklappen',
    'fold.open': '{pct} % offen',
    'fold.hint': 'rechts drehen = auf',
    'btn.autoRot': 'Auto-Rotation: {s}',
    'btn.autoFold': 'Auto-Falten: {s}',
    'btn.reset': 'Zurücksetzen',
    'btn.center': 'Zentrum: {m}',
    'btn.clear': 'Auswahl löschen ({n})',
    'on': 'an', 'off': 'aus',
    'persp': 'perspektivisch', 'ortho': 'orthogonal',

    'st.grab': 'Du änderst nur den Blickwinkel. Die 4D-Lage bleibt gleich.',
    'st.open': 'Ganz offen: das Dalí-Kreuz aus 8 Würfeln',
    'st.closed': 'Zugeklappt: Würfel im Würfel',
    'st.the': 'Die ', 'st.theLid': 'Der ',
    'st.lid': 'Deckel', 'st.walls': 'Wände',
    'st.foldsInto': ' klappt in die ', 'st.foldInto': ' klappen in die ',
    'st.dir': '-Richtung',
    'st.rotIn': 'Drehung in ', 'st.fixed': ' bleibt fest', 'st.auto': 'Auto',
    'st.idle': 'Knopf greifen und Handgelenk drehen',
    'st.foldHover': 'Falt-Knopf: jede Wand dreht sich um 90° um die Fläche, die sie mit dem Boden teilt',
    'st.knob': 'Knopf ', 'st.mixes': ': mischt ', 'st.and': ' und ', 'st.plane': ', die Ebene ', 'st.still': ' bleibt stehen',
    'st.vertex': 'Ecke {n}', 'st.tapMark': '  ·  antippen zum Markieren',
    'st.shapeChip': 'Form: {l}', 'st.viewChip': 'Ansicht: {l}', 'st.na': 'nicht verfügbar',
    'st.button': 'Schaltfläche antippen',
    'st.unfoldIdle': 'Falt-Knopf drehen · links der Würfel als Vergleich eine Dimension tiefer',
    'st.selectIdle': 'Ecke antippen: markiert sie in allen Ansichten',
    'st.unfoldShapes': 'Würfel + Tesseract',
    'st.center': 'Zentrum {m}',

    'info.legend': 'LEGENDE',
    'info.dir': '-Richtung',
    'info.thick': 'Dicke Kante = näher in W',
    'info.marked': 'Markierte Ecken: ',
    'info.orient': 'ORIENTIERUNG  ·  Drehmatrix',
    'info.col1': 'Spalte = wohin die ursprüngliche',
    'info.col2': 'Achse jetzt zeigt',
    'role.base': 'Boden', 'role.wall': 'Wände', 'role.lid': 'Deckel',
    'info.cubeSum': 'Würfel:  1 + 4 + 1 = 6 Quadrate',
    'info.tessSum': 'Tesseract:  1 + 6 + 1 = 8 Würfel',
    'info.wallsW': 'Wände klappen in die W-Richtung',

    'view.without': 'ohne ', 'view.liesOn': ' liegt auf der ', 'view.dir': '-Richtung',
    'view.centerPersp': 'Zentrum · Perspektive aus ',
    'view.centerOrtho': 'Zentrum · ohne ', 'view.orthoSuffix': ' (orthogonal)',

    'unf.tess': 'Tesseract → 8 Würfel', 'unf.cube': 'Würfel → 6 Quadrate',
    'unf.base': '1 Boden', 'unf.walls6': '6 Wände', 'unf.walls4': '4 Wände', 'unf.lid': '1 Deckel',
    'unf.sheet': 'Blatt = Welt des Flachländers',
    'unf.shadow': 'Dunkel: sein Bild, der Schatten des Würfels',

    'vertex': 'Ecke',
  },

  en: {
    'shape.cube3d': '3D Cube',
    'shape.tesseract': '4D Cube',
    'shape.sphere3d': '3D Sphere',
    'shape.sphere4d': '4D Sphere',
    'shape.car': '3D Car',
    'shape.wormhole': 'Wormhole',
    'hint.tesseract': 'Edge color = axis direction',
    'hint.cube3d': 'lies flat at w = 0',
    'hint.sphere3d': 'Circles in axis colors = coordinate planes',
    'hint.sphere4d': 'one great circle per rotation plane, faint shells at w = ±0.9',
    'hint.car': 'Steering wheel on the left · turn XW to 180°',
    'hint.wormhole': 'Curved 3D space, W only shows the curvature · side views: the funnel',
    'reason.sphere': 'A sphere cannot be unrolled flat',
    'reason.car': 'A car cannot be unfolded',
    'reason.wormhole': 'A wormhole cannot be unfolded',
    'msg.switchedRiss': '{reason}. Switched to multi-view.',

    'view.riss': 'Multi-view',
    'view.single': 'Shape only',
    'view.unfold': 'Unfold',

    'pult.shape': 'SHAPE',
    'pult.view': 'VIEW',
    'pult.row3d': '3D ROTATIONS  ·  as usual',
    'pult.row4d': '4D ROTATIONS  ·  into the 4th dimension',
    'pult.rowFold': 'FOLDING  ·  cube and tesseract together',
    'knob.fixed': 'fixed: {p}',
    'fold.knob': 'Unfold',
    'fold.open': '{pct} % open',
    'fold.hint': 'turn right = open',
    'btn.autoRot': 'Auto-rotate: {s}',
    'btn.autoFold': 'Auto-fold: {s}',
    'btn.reset': 'Reset',
    'btn.center': 'Center: {m}',
    'btn.clear': 'Clear selection ({n})',
    'on': 'on', 'off': 'off',
    'persp': 'perspective', 'ortho': 'orthographic',

    'st.grab': 'You only change your viewpoint. The 4D orientation stays the same.',
    'st.open': 'Fully open: the Dalí cross of 8 cubes',
    'st.closed': 'Closed: a cube within a cube',
    'st.the': 'The ', 'st.theLid': 'The ',
    'st.lid': 'lid', 'st.walls': 'walls',
    'st.foldsInto': ' folds into the ', 'st.foldInto': ' fold into the ',
    'st.dir': ' direction',
    'st.rotIn': 'Rotation in ', 'st.fixed': ' stays fixed', 'st.auto': 'auto',
    'st.idle': 'Grab a knob and twist your wrist',
    'st.foldHover': 'Fold knob: each wall turns 90° about the face it shares with the base',
    'st.knob': 'Knob ', 'st.mixes': ': mixes ', 'st.and': ' and ', 'st.plane': ', the plane ', 'st.still': ' stays still',
    'st.vertex': 'Vertex {n}', 'st.tapMark': '  ·  tap to mark it',
    'st.shapeChip': 'Shape: {l}', 'st.viewChip': 'View: {l}', 'st.na': 'not available',
    'st.button': 'Tap the button',
    'st.unfoldIdle': 'Turn the fold knob · on the left, the cube for comparison, one dimension lower',
    'st.selectIdle': 'Tap a vertex to mark it in all views',
    'st.unfoldShapes': 'Cube + tesseract',
    'st.center': 'Center {m}',

    'info.legend': 'LEGEND',
    'info.dir': ' direction',
    'info.thick': 'Thicker edge = closer in W',
    'info.marked': 'Marked vertices: ',
    'info.orient': 'ORIENTATION  ·  rotation matrix',
    'info.col1': 'Column = where the original',
    'info.col2': 'axis points now',
    'role.base': 'Base', 'role.wall': 'Walls', 'role.lid': 'Lid',
    'info.cubeSum': 'Cube:  1 + 4 + 1 = 6 squares',
    'info.tessSum': 'Tesseract:  1 + 6 + 1 = 8 cubes',
    'info.wallsW': 'Walls fold into the W direction',

    'view.without': 'without ', 'view.liesOn': ' lies along the ', 'view.dir': ' direction',
    'view.centerPersp': 'Center · perspective from ',
    'view.centerOrtho': 'Center · without ', 'view.orthoSuffix': ' (orthographic)',

    'unf.tess': 'Tesseract → 8 cubes', 'unf.cube': 'Cube → 6 squares',
    'unf.base': '1 base', 'unf.walls6': '6 walls', 'unf.walls4': '4 walls', 'unf.lid': '1 lid',
    'unf.sheet': 'Sheet = the Flatlander’s world',
    'unf.shadow': 'Dark: what he sees, the cube’s shadow',

    'vertex': 'Vertex',
  },
};

export const LANGS = Object.keys(DICT);

function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && DICT[q]) {
      try { localStorage.setItem('lang', q); } catch {}
      return q;
    }
    const saved = localStorage.getItem('lang');
    if (saved && DICT[saved]) return saved;
  } catch {}
  const nav = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  return nav.startsWith('de') ? 'de' : 'en';
}

export const LANG = typeof window !== 'undefined' ? detect() : 'en';
export const DECIMAL = LANG === 'de' ? ',' : '.';

/** Text zum Schlüssel; {name} wird durch vars.name ersetzt */
export function t(key, vars) {
  let s = DICT[LANG][key] ?? DICT.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
