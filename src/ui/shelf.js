// Formen-Regal: ein angedeuteter Schrank mit einem Boden pro Gruppe und einem Fach pro Form.
// In jedem Fach dreht sich ein kleines Modell der Form. Auf ein Fach zeigen und drücken wählt sie.

import * as THREE from 'three';
import { GROUPS } from '../shapes/index.js';
import { identity4, rotatePlane, applyMat, projectCenter } from '../core/math4d.js';
import { CanvasPanel, richText, FONT, UI } from './canvasPanel.js';
import { t } from '../i18n.js';

export const SHELF_COLS = 4;
const CELL_W = 0.092, CELL_H = 0.085, DEPTH = 0.07, LABEL_H = 0.026, BOARD = 0.008, TITLE_H = 0.032;
const WIDTH = SHELF_COLS * CELL_W + 2 * BOARD;
const ROW_H = LABEL_H + CELL_H + BOARD;
const ACTIVE = new THREE.Color(0xffc83d), HOVER = new THREE.Color(0xffffff);

/** Kleines Modell einer Form: Kanten als Linien (fest leicht in 4D gedreht), Flächenmodelle als Mesh */
function miniature(shape, size) {
  const g = new THREE.Group();
  const flat = shape.vertices.every((v) => Math.abs(v[3]) < 1e-9);
  const M = identity4();
  if (!flat) { rotatePlane(M, 0, 3, 0.45); rotatePlane(M, 1, 3, 0.3); }
  const r = [0, 0, 0, 0], p = new THREE.Vector3(), pos = [], col = [];
  for (const e of shape.edges) {
    for (const i of [e.i, e.j]) {
      projectCenter(applyMat(M, shape.vertices[i], r), 1, 4, p);
      pos.push(p.x, p.y, p.z);
      col.push(e.color.r, e.color.g, e.color.b);
    }
  }
  if (pos.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true })));
  }
  for (const part of shape.mesh || []) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(part.positions, 3));
    if (part.colors) geo.setAttribute('color', new THREE.BufferAttribute(part.colors, 3));
    if (part.uvs) geo.setAttribute('uv', new THREE.BufferAttribute(part.uvs, 2));
    const mat = part.map
      ? new THREE.MeshStandardMaterial({ map: part.map, side: THREE.DoubleSide, flatShading: true })
      : new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true });
    g.add(new THREE.Mesh(geo, mat));
  }
  // auf die Fachgröße skalieren und zentrieren
  const box = new THREE.Box3().setFromObject(g);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const k = size / Math.max(s.x, s.y, s.z, 1e-6);
  const wrap = new THREE.Group();
  g.position.copy(c).multiplyScalar(-1);
  wrap.add(g);
  wrap.scale.setScalar(k);
  return wrap;
}

function textPlane(text, worldW, pxW, pxH, font, color = UI.text, bg = null) {
  const p = new CanvasPanel(pxW, pxH, worldW);
  p.draw((ctx, w, h) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.textBaseline = 'middle';
    richText(ctx, [{ t: text, c: color }], w / 2, h / 2 + 1, 'center', font);
  });
  return p.mesh;
}

export class Shelf {
  constructor(state) {
    this.state = state;
    this.root = new THREE.Group();   // Ursprung = Mitte der Unterkante, Vorderseite zeigt nach +z
    this.root.name = 'shelf';
    this.cells = [];
    this.raycaster = new THREE.Raycaster();

    const wood = new THREE.MeshStandardMaterial({ color: 0x2c323e, roughness: 0.85 });
    const back = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.95 });
    const rows = GROUPS.length;
    const H = rows * ROW_H + BOARD + TITLE_H;
    const box = (w, h, d, x, y, z, m = wood) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z);
      this.root.add(b);
    };
    // Korpus: Seitenwände, Boden, Deckel, Rückwand
    box(BOARD, H, DEPTH, -WIDTH / 2 + BOARD / 2, H / 2, 0);
    box(BOARD, H, DEPTH, WIDTH / 2 - BOARD / 2, H / 2, 0);
    box(WIDTH, BOARD, DEPTH, 0, BOARD / 2, 0);
    box(WIDTH, BOARD, DEPTH, 0, H - BOARD / 2, 0);
    box(WIDTH, H, 0.004, 0, H / 2, -DEPTH / 2, back);

    const title = textPlane(t('shelf.title'), WIDTH * 0.9, 640, 52, `700 34px ${FONT}`, UI.dim);
    title.position.set(0, H - BOARD - TITLE_H / 2, DEPTH / 2 - 0.004);
    this.root.add(title);

    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    GROUPS.forEach((group, r) => {
      const top = H - BOARD - TITLE_H - r * ROW_H;           // Oberkante dieses Bodens
      const label = textPlane(t(`group.${group.id}`), WIDTH * 0.9, 640, 46, `600 30px ${FONT}`, '#c7cfdb');
      label.position.set(0, top - LABEL_H / 2, DEPTH / 2 - 0.004);
      this.root.add(label);
      const floorY = top - LABEL_H - CELL_H;
      box(WIDTH - 2 * BOARD, BOARD, DEPTH, 0, floorY - BOARD / 2, 0);   // Regalboden

      group.shapes.forEach((shape, c) => {
        const x = -WIDTH / 2 + BOARD + CELL_W * (c + 0.5);
        const cy = floorY + CELL_H / 2;
        // Hervorhebung als leuchtende Rückwand im Fach
        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL_W - 0.008, CELL_H - 0.006),
          new THREE.MeshBasicMaterial({ color: ACTIVE, transparent: true, opacity: 0 })
        );
        glow.position.set(x, cy, -DEPTH / 2 + 0.004);
        // Trennwand rechts vom Fach (außer am Ende)
        if (c < SHELF_COLS - 1) box(0.003, CELL_H, DEPTH * 0.8, x + CELL_W / 2, cy, -DEPTH * 0.1);
        const mini = miniature(shape, CELL_H * 0.55);
        mini.position.set(x, cy + 0.008, 0);
        const name = textPlane(shape.label, CELL_W - 0.006, 320, 56, `600 30px ${FONT}`);
        name.position.set(x, floorY + 0.008, DEPTH / 2 - 0.002);
        const hit = new THREE.Mesh(new THREE.BoxGeometry(CELL_W, CELL_H, DEPTH), hitMat);
        hit.position.set(x, cy, 0);
        hit.userData.shapeId = shape.id;
        this.root.add(glow, mini, name, hit);
        this.cells.push({ id: shape.id, glow, mini, hit });
      });
    });
    this.hitBoxes = this.cells.map((c) => c.hit);
  }

  /** Treffer: { type: 'shelf', id, point, distance } | null */
  hit(ray) {
    if (!this.root.visible) return null;
    this.raycaster.ray.copy(ray);
    const h = this.raycaster.intersectObjects(this.hitBoxes, false)[0];
    if (!h) return null;
    return { type: 'shelf', id: h.object.userData.shapeId, point: h.point, distance: h.distance };
  }

  update(dt, hover) {
    for (const c of this.cells) {
      const active = c.id === this.state.shapeId;
      const hov = hover?.type === 'shelf' && hover.id === c.id;
      c.glow.material.color.copy(hov ? HOVER : ACTIVE);
      c.glow.material.opacity = hov ? 0.22 : active ? 0.3 : 0;
      c.mini.rotation.y += dt * (active || hov ? 0.9 : 0.25);
    }
  }
}
