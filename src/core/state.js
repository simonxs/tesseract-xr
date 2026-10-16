// Zentraler Anwendungszustand. Darstellung und Eingabe lesen/ändern nur über diese Klasse.
// "version" wird bei jeder Änderung erhöht; Panels zeichnen sich neu, wenn sie sich ändert.

import { identity4, rotatePlane, orthonormalize } from './math4d.js';
import { PLANES, AUTO_SPEED, PERSP_DIST, PERSP_MIN, PERSP_MAX, MAX_SELECTION } from '../config.js';

export class AppState {
  constructor() {
    this.version = 0;
    this.viewMode = 'riss';      // 'riss' | 'single'
    this.perspective = true;     // Zentrum perspektivisch (true) oder orthogonal (false)
    this.blend = 1;              // animierter Übergang 0 = orthogonal … 1 = perspektivisch
    this.perspDist = PERSP_DIST;
    this.selection = [];         // markierte Ecken (Indizes), max. MAX_SELECTION
    this.turning = null;         // Ebene, deren Knopf gerade gehalten wird
    this.grabbingSetup = false;  // Aufbau wird gerade bewegt
    this.infoPinned = false;     // Info-Panel am Handgelenk dauerhaft zeigen
    this.reset();
  }

  bump() { this.version++; }

  reset() {
    this.M = identity4();
    this.knobAngles = new Array(PLANES.length).fill(0);
    this.activePlane = null;
    this.auto = false;
    this.bump();
  }

  /** Dreht um delta (rad) in Ebene p (Index in PLANES) */
  turn(p, delta) {
    const { a, b } = PLANES[p];
    rotatePlane(this.M, a, b, delta);
    this.knobAngles[p] += delta;
    this.activePlane = p;
    this.bump();
  }

  toggleAuto() {
    if (this.activePlane == null) this.activePlane = 2; // XW als Startebene
    this.auto = !this.auto;
    this.bump();
  }

  togglePerspective() { this.perspective = !this.perspective; this.bump(); }
  toggleViewMode() { this.viewMode = this.viewMode === 'riss' ? 'single' : 'riss'; this.bump(); }

  setPerspDist(d) {
    this.perspDist = Math.min(PERSP_MAX, Math.max(PERSP_MIN, d));
    this.bump();
  }

  toggleSelect(i) {
    const k = this.selection.indexOf(i);
    if (k >= 0) this.selection.splice(k, 1);
    else {
      this.selection.push(i);
      if (this.selection.length > MAX_SELECTION) this.selection.shift();
    }
    this.bump();
  }

  clearSelection() { this.selection = []; this.bump(); }

  /** Weicher Übergang orthogonal ↔ perspektivisch */
  get easedBlend() {
    const t = this.blend;
    return t * t * (3 - 2 * t);
  }

  update(dt) {
    if (this.auto && this.activePlane != null) this.turn(this.activePlane, AUTO_SPEED * dt);
    const target = this.perspective ? 1 : 0;
    if (this.blend !== target) {
      const step = dt / 0.9;
      this.blend = target > this.blend ? Math.min(target, this.blend + step) : Math.max(target, this.blend - step);
      this.bump();
    }
    orthonormalize(this.M);
  }
}
