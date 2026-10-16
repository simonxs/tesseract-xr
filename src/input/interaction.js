// Einheitliche Eingabe: XR-Controller, Hand-Tracking (Pinch) und Maus am Desktop.
// Jeder Zeiger hat einen Strahl. Beim Drücken entscheidet das Ziel, was passiert:
//   Knopf → halten und Handgelenk drehen | Schaltfläche → auslösen | Ecke → markieren
//   leerer Raum (nur XR) → Aufbau greifen; zwei Hände → zoomen

import * as THREE from 'three';
import { PERSP_DIST, KNOB_GAIN, MOUSE_KNOB_GAIN } from '../config.js';
import { Manipulator } from './manipulator.js';

class Pointer {
  constructor(kind) {
    this.kind = kind;            // 'xr' | 'mouse'
    this.ray = new THREE.Ray();
    this.quat = new THREE.Quaternion();
    this.active = kind === 'mouse';
    this.grab = null;
    this.hover = null;
    this.pressCount = 0;
    this.prevButtons = [];
    this.handedness = 'none';
  }
  updateFromSpace() {
    this.space.updateMatrixWorld(true);
    this.ray.origin.setFromMatrixPosition(this.space.matrixWorld);
    this.ray.direction.set(0, 0, -1).transformDirection(this.space.matrixWorld);
    this.space.getWorldQuaternion(this.quat);
  }
  get gamepad() { return this.source?.gamepad || null; }
}

const _dq = new THREE.Quaternion();

export class Interaction {
  /** ctx: { renderer, camera, scene, state, views, pult, setup, orbit, onPlace } */
  constructor(ctx) {
    Object.assign(this, ctx);
    this.pointers = [];
    this.hover = null;
    this.manip = new Manipulator(this.setup);
    this.onConnected = null;
    this.initXR();
    this.initMouse();
    this.initKeys();
  }

  // ---------- XR ----------
  initXR() {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
    for (let n = 0; n < 2; n++) {
      const p = new Pointer('xr');
      p.space = this.renderer.xr.getController(n);
      p.grip = this.renderer.xr.getControllerGrip(n);
      this.scene.add(p.space, p.grip);
      p.line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
      p.space.add(p.line);
      p.reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false })
      );
      p.reticle.renderOrder = 30;
      p.reticle.visible = false;
      this.scene.add(p.reticle);

      p.space.addEventListener('connected', (e) => {
        p.source = e.data;
        p.handedness = e.data.handedness;
        p.active = true;
        p.prevButtons = [];
        this.onConnected?.(p);
      });
      p.space.addEventListener('disconnected', () => {
        p.active = false;
        p.pressCount = 0;
        this.release(p);
        p.reticle.visible = false;
      });
      const down = () => { if (p.pressCount++ === 0) this.press(p); };
      const up = () => { if (p.pressCount > 0 && --p.pressCount === 0) this.release(p); };
      p.space.addEventListener('selectstart', down);
      p.space.addEventListener('selectend', up);
      p.space.addEventListener('squeezestart', down);
      p.space.addEventListener('squeezeend', up);
      this.pointers.push(p);
    }
  }

  // ---------- Maus (Desktop) ----------
  initMouse() {
    const el = this.renderer.domElement;
    const m = (this.mouse = new Pointer('mouse'));
    this.pointers.push(m);
    this.ndc = new THREE.Vector2(9, 9);
    this.rc = new THREE.Raycaster();
    const setNdc = (e) => {
      const r = el.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.rc.setFromCamera(this.ndc, this.camera);
      m.ray.copy(this.rc.ray);
    };
    // capture: true → läuft vor OrbitControls, damit Klicks auf Knöpfe nicht die Kamera drehen
    el.addEventListener('pointerdown', (e) => {
      if (this.renderer.xr.isPresenting) return;
      setNdc(e);
      if (this.pick(m)) {
        this.orbit.enabled = false;
        m.lastX = e.clientX;
        this.press(m);
      }
    }, { capture: true });
    el.addEventListener('pointermove', (e) => {
      setNdc(e);
      if (m.grab?.type === 'knob') {
        this.state.turn(m.grab.plane, (e.clientX - m.lastX) * MOUSE_KNOB_GAIN);
        m.lastX = e.clientX;
      }
    });
    window.addEventListener('pointerup', () => {
      if (m.grab) this.release(m);
      this.orbit.enabled = true;
    });
  }

  initKeys() {
    window.addEventListener('keydown', (e) => {
      const s = this.state;
      if (e.key >= '1' && e.key <= '6') { s.activePlane = +e.key - 1; s.bump(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        s.turn(s.activePlane ?? 2, (e.key === 'ArrowRight' ? 1 : -1) * (5 * Math.PI) / 180);
        e.preventDefault();
      }
      else if (e.code === 'Space') { s.toggleAuto(); e.preventDefault(); }
      else if (e.key === 'r') s.reset();
      else if (e.key === 'p') s.togglePerspective();
      else if (e.key === 'v') s.toggleViewMode();
      else if (e.key === 'c') s.clearSelection();
    });
  }

  // ---------- Logik ----------
  pick(p) {
    const ph = this.pult.hit(p.ray);
    const vh = this.views.pickVertex(p.ray, this.state.viewMode === 'riss');
    if (ph && vh) return ph.distance <= vh.distance ? ph : vh;
    return ph || vh;
  }

  press(p) {
    const s = this.state;
    const t = this.pick(p);
    if (!t) {
      if (p.kind === 'xr') {
        p.grab = { type: 'setup' };
        this.manip.add(p);
        s.grabbingSetup = true;
        s.bump();
      }
      return;
    }
    if (t.type === 'knob') {
      p.grab = { type: 'knob', plane: t.plane, q: p.quat.clone() };
      s.turning = t.plane;
      s.activePlane = t.plane;
      s.bump();
    } else if (t.type === 'button') {
      this.pult.action(t.id);
    } else if (t.type === 'vertex') {
      s.toggleSelect(t.i);
    }
  }

  release(p) {
    const s = this.state;
    if (p.grab?.type === 'knob') s.turning = null;
    if (p.grab?.type === 'setup') {
      this.manip.remove(p);
      s.grabbingSetup = this.manip.count > 0;
    }
    p.grab = null;
    s.bump();
  }

  update(dt) {
    const s = this.state;
    const xr = this.renderer.xr.isPresenting;
    this.hover = null;

    for (const p of this.pointers) {
      if (!p.active) continue;
      if (p.kind === 'mouse' && xr) continue;
      if (p.kind === 'xr') p.updateFromSpace();

      p.hover = p.grab?.type === 'knob' ? { type: 'knob', plane: p.grab.plane } : p.grab ? null : this.pick(p);
      if (p.hover && (!this.hover || p.handedness === 'right')) this.hover = p.hover;

      if (p.kind === 'xr') {
        const hit = p.hover?.point;
        p.reticle.visible = !!hit;
        if (hit) p.reticle.position.copy(hit);
        p.line.scale.z = hit ? p.hover.distance : 0.5;

        // Knopf drehen: Verdrehung des Controllers um seine Längsachse (Twist)
        if (p.grab?.type === 'knob') {
          _dq.copy(p.grab.q).invert().multiply(p.quat);
          let ang = 2 * Math.atan2(_dq.z, _dq.w);
          if (ang > Math.PI) ang -= 2 * Math.PI;
          if (ang < -Math.PI) ang += 2 * Math.PI;
          if (Math.abs(ang) > 1e-4) s.turn(p.grab.plane, -ang * KNOB_GAIN);
          p.grab.q.copy(p.quat);
        }
        this.gamepadInput(p, dt);
      }
    }
    this.manip.update();
  }

  gamepadInput(p, dt) {
    const gp = p.gamepad;
    if (!gp) return;
    const s = this.state;
    const pressed = (k) => gp.buttons[k]?.pressed && !p.prevButtons[k];
    const ax = gp.axes[2] ?? 0, ay = gp.axes[3] ?? 0;

    if (pressed(4)) s.toggleAuto();                                   // A / X
    if (pressed(5)) {                                                 // B / Y
      if (p.handedness === 'left') { s.infoPinned = !s.infoPinned; s.bump(); }
      else s.clearSelection();
    }
    if (pressed(3) && p.handedness === 'left') this.onPlace?.();      // linken Stick drücken

    if (p.grab?.type === 'knob' && Math.abs(ax) > 0.15) s.turn(p.grab.plane, ax * 1.2 * dt);
    else if (p.grab?.type === 'setup' && Math.abs(ay) > 0.15) this.manip.push(p, ay * 0.8 * dt);
    else if (!p.grab && p.handedness === 'right' && Math.abs(ax) > 0.15) s.setPerspDist(s.perspDist + ax * 2.5 * dt);

    p.prevButtons = gp.buttons.map((b) => b.pressed);
  }

  resetPerspective() { this.state.setPerspDist(PERSP_DIST); }
}
