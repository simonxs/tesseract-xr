// Text und 2D-Grafik in VR: ein Canvas als Textur auf einer Fläche (Mesh) oder einem Sprite.

import * as THREE from 'three';

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const UI = {
  bg: 'rgba(14, 18, 26, 0.86)',
  text: '#e9edf3',
  dim: '#9ba6b8',
  line: 'rgba(255, 255, 255, 0.14)',
  accent: '#ffc83d',
};

export class CanvasPanel {
  /**
   * @param pxW, pxH  Canvas-Auflösung
   * @param worldW    Breite in Welteinheiten (Meter, oder Tesseract-Einheiten wenn im Inhalt)
   * @param opts.sprite  true = dreht sich automatisch zur Kamera
   */
  constructor(pxW, pxH, worldW, { sprite = false, depthTest = true, renderOrder = 0 } = {}) {
    this.w = pxW;
    this.h = pxH;
    this.canvas = document.createElement('canvas');
    this.canvas.width = pxW;
    this.canvas.height = pxH;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.worldW = worldW;
    this.worldH = (worldW * pxH) / pxW;
    if (sprite) {
      this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthTest, depthWrite: false });
      this.mesh = new THREE.Sprite(this.material);
      this.mesh.scale.set(this.worldW, this.worldH, 1);
    } else {
      this.material = new THREE.MeshBasicMaterial({
        map: this.texture, transparent: true, depthTest, depthWrite: false, side: THREE.DoubleSide,
      });
      this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.worldW, this.worldH), this.material);
    }
    this.mesh.renderOrder = renderOrder;
    this._key = undefined;
    this._t = 0;
  }

  draw(fn) {
    this.ctx.clearRect(0, 0, this.w, this.h);
    fn(this.ctx, this.w, this.h);
    this.texture.needsUpdate = true;
  }

  /** Zeichnet nur neu, wenn sich key geändert hat, höchstens alle minMs Millisekunden. */
  drawIfChanged(key, fn, minMs = 90) {
    const now = performance.now();
    if (key === this._key || now - this._t < minMs) return;
    this._key = key;
    this._t = now;
    this.draw(fn);
  }
}

export function panelBg(ctx, w, h, r = 24) {
  ctx.beginPath();
  ctx.roundRect(3, 3, w - 6, h - 6, r);
  ctx.fillStyle = UI.bg;
  ctx.fill();
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Mehrfarbiger Text in einer Zeile. segs = [{ t: 'Text', c: '#farbe', f: 'font' }, …]
 * align: 'left' | 'center'
 */
export function richText(ctx, segs, x, y, align = 'left', baseFont) {
  if (baseFont) ctx.font = baseFont;
  const base = ctx.font;
  let total = 0;
  for (const s of segs) {
    ctx.font = s.f || base;
    total += ctx.measureText(s.t).width;
  }
  let cx = align === 'center' ? x - total / 2 : x;
  ctx.textAlign = 'left';
  for (const s of segs) {
    ctx.font = s.f || base;
    ctx.fillStyle = s.c || UI.text;
    ctx.fillText(s.t, cx, y);
    cx += ctx.measureText(s.t).width;
  }
  ctx.font = base;
}
