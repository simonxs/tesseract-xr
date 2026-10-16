// Zentraler Anwendungszustand. Darstellung und Eingabe lesen/ändern nur über diese Klasse.
// "version" wird bei jeder Änderung erhöht; Panels zeichnen sich neu, wenn sie sich ändert.

import { identity4, rotatePlane, orthonormalize } from './math4d.js';
import {
  PLANES, AUTO_SPEED, PERSP_DIST, PERSP_MIN, PERSP_MAX, MAX_SELECTION, UNFOLD_SPEED,
} from '../config.js';
import { SHAPE_BY_ID } from '../shapes/index.js';
import { t } from '../i18n.js';

export class AppState {
  constructor() {
    this.version = 0;
    this.shapeId = 'tesseract';
    this.viewMode = 'riss';      // 'riss' | 'single' | 'unfold'
    this.perspective = true;     // Zentrum perspektivisch (true) oder orthogonal (false)
    this.blend = 1;              // animierter Übergang 0 = orthogonal … 1 = perspektivisch
    this.perspDist = PERSP_DIST;
    this.selection = [];         // markierte Ecken (Indizes), max. MAX_SELECTION
    this.turning = null;         // Knopf, der gerade gehalten wird (Ebenen-Index oder 'fold')
    this.grabbingSetup = false;  // Aufbau wird gerade bewegt
    this.infoPinned = false;     // Info-Panel am Handgelenk dauerhaft zeigen
    this.unfold = 0;             // Aufklappen: 0 = zu, 1 = ganz offen
    this.unfoldDir = 1;
    this.message = null;         // kurze Meldung in der Statuszeile { text, until }
    this.reset();
  }

  get shape() { return SHAPE_BY_ID[this.shapeId]; }

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

  turnFold(delta) {
    this.unfold = Math.min(1, Math.max(0, this.unfold + delta));
    this.bump();
  }

  toggleAuto() {
    if (this.viewMode !== 'unfold' && this.activePlane == null) this.activePlane = 2; // XW als Startebene
    this.auto = !this.auto;
    this.bump();
  }

  togglePerspective() { this.perspective = !this.perspective; this.bump(); }

  setShape(id) {
    if (id === this.shapeId || !SHAPE_BY_ID[id]) return;
    this.shapeId = id;
    this.selection = [];
    if (this.viewMode === 'unfold' && !this.shape.unfold) {
      this.viewMode = 'riss';
      this.flash(t('msg.switchedRiss', { reason: this.shape.unfoldReason }));
    }
    this.bump();
  }

  setViewMode(mode) {
    if (mode === this.viewMode) return;
    if (mode === 'unfold') {
      if (!this.shape.unfold) { this.flash(this.shape.unfoldReason); return; }
      // Beim Aufklappen nur 3D-Drehungen: 4D-Lage zurücksetzen
      this.reset();
      this.perspective = true;
      this.selection = [];
    }
    this.viewMode = mode;
    this.bump();
  }

  cycleViewMode() {
    const order = ['riss', 'single', 'unfold'];
    let k = order.indexOf(this.viewMode);
    for (let n = 0; n < 3; n++) {
      k = (k + 1) % 3;
      if (order[k] !== 'unfold' || this.shape.unfold) break;
    }
    this.setViewMode(order[k]);
  }

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

  flash(text, ms = 4000) {
    this.message = { text, until: performance.now() + ms };
    this.bump();
  }

  get activeMessage() {
    return this.message && performance.now() < this.message.until ? this.message.text : null;
  }

  /** Weicher Übergang orthogonal ↔ perspektivisch */
  get easedBlend() {
    const t = this.blend;
    return t * t * (3 - 2 * t);
  }

  update(dt) {
    if (this.auto) {
      if (this.viewMode === 'unfold') {
        let u = this.unfold + this.unfoldDir * UNFOLD_SPEED * dt;
        if (u >= 1) { u = 1; this.unfoldDir = -1; }
        if (u <= 0) { u = 0; this.unfoldDir = 1; }
        this.unfold = u;
        this.bump();
      } else if (this.activePlane != null) {
        this.turn(this.activePlane, AUTO_SPEED * dt);
      }
    }
    const target = this.perspective ? 1 : 0;
    if (this.blend !== target) {
      const step = dt / 0.9;
      this.blend = target > this.blend ? Math.min(target, this.blend + step) : Math.max(target, this.blend - step);
      this.bump();
    }
    if (this.message && performance.now() >= this.message.until) { this.message = null; this.bump(); }
    orthonormalize(this.M);
  }
}
