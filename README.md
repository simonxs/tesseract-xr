# Tesseract XR

**English** · [Deutsch](README.de.md)

An interactive way to explore the fourth dimension on the **Meta Quest 3 in AR (passthrough) mode**, built with WebXR and three.js. You turn 4D shapes with rotary knobs in the 6 planes of 4D space, see them in a **multi-view projection** like an engineering drawing, and can **unfold** the tesseract the way you unfold a cube.

Version 3 · October 2026 · Live: https://tesseract-xr.okercode.de

A non-commercial project driven by academic curiosity: how can the fourth dimension be made tangible? The visualizations are meant for learning and understanding.

![Multi-view of the 4D cube](docs/screenshot-multiview.png)

## Changes

| Version | Contents |
|---|---|
| 3 | English version (picked from the browser language, switchable), new shape order: 3D cube, 4D cube, 3D sphere, 4D sphere, 3D car; three.js served locally (no third-party requests), legal links, MIT license |
| 2 | Shape selection, unfold mode (cube → cross, tesseract → Dalí cross), edges as square beams, favicon |
| 1 | Tesseract, multi-view, 6 rotary knobs, reference lines, legend and rotation matrix, grab and zoom |

---

## Running it

WebXR only works over **HTTPS** (or `localhost`). There is no build step: the folder is served as it is. three.js (version 0.160.0) is included in `vendor/three/` and loaded through an import map, so no data goes to third-party servers.

| Where | How |
|---|---|
| Desktop, for testing | run `python3 -m http.server 8000` in the project folder, open `http://localhost:8000` |
| Quest 3 | put the folder on an HTTPS web server, open the address in the **Meta Quest Browser**, tap “Start AR” |
| Quest over USB, no server | `adb reverse tcp:8000 tcp:8000`, then open `http://localhost:8000` in the headset (localhost counts as secure) |

Double-clicking `index.html` does not work, because browsers block ES modules on `file://`.

**Language:** German for German browsers, English otherwise. Switch with `?lang=en` or `?lang=de` in the address, or with “DE · EN” on the start page (before entering AR). The choice is remembered in the browser.

---

## What you see

The header of the control desk has two rows: **Shape** and **View**. Not every combination makes sense; greyed-out options explain why in the status line.

| Shape | Multi-view | Shape only | Unfold | What it teaches |
|---|---|---|---|---|
| 3D cube (at w = 0) | ✓ | ✓ | ✓ | A 3D object is flat in 4D space: at rest it is squashed flat in “without X/Y/Z” |
| 4D cube (tesseract) | ✓ | ✓ | ✓ | The basic shape, rotation planes, cube within a cube |
| 3D sphere (at w = 0) | ✓ | ✓ | – | Turns into a disc in XW; after 180° it looks unchanged, because a sphere is its own mirror image |
| 4D sphere | ✓ | ✓ | – | One great circle per rotation plane: the circle of the active plane spins in place, the circle of the fixed plane stands still |
| 3D car (at w = 0) | ✓ | ✓ | – | **Mirrored after 180° in XW**: steering wheel on the right, licence plate reversed |

### Unfold

![Unfolding cube and tesseract](docs/screenshot-unfold.png)

On the left, a 3D cube unfolds on a **sheet of paper** into 6 squares. Its **shadow** lies on the sheet: that is all a Flatlander can see. On the right, the tesseract unfolds the same way into **8 cubes** (the Dalí cross). Both are driven by the same **fold knob**, which replaces the row of 4D knobs in this mode.

| Role | Cube | Tesseract | Color |
|---|---|---|---|
| Base | 1 square | 1 cube | grey |
| Walls | 4 squares | 6 cubes | blue |
| Lid | 1, on the back wall | 1, on the bottom wall | gold |

Each wall turns 90° about the face it shares with the base: upwards for the cube, into the W direction for the tesseract. When closing, the lid folds up first, then the walls. Fully closed you see the familiar cube within a cube, and the cube’s shadow shows the matching square within a square. Entering unfold mode resets the 4D orientation; the 3D knobs only turn the Dalí cross.

### Multi-view (default)

The idea comes from orthographic multi-view drawings: **each view drops one axis and is offset along exactly that axis.**

| View | Position | Shows | Notes |
|---|---|---|---|
| Center | middle | X Y Z | switchable: **perspective** (cube within a cube, 4D camera on the W axis) or **orthographic** (“without W”) |
| without X | right | W Y Z | W lies along the X direction |
| without Y | top | X W Z | W lies along the Y direction |
| without Z | behind | X Y W | W lies along the Z direction (walk around or turn the setup to see it) |

The side views are always orthographic. At 0° every view simply shows a cube, because the edges of the missing axis collapse to points, just as the vertical edges of a cube disappear in its floor plan.

### Colors and edges

| Element | Meaning |
|---|---|
| red / green / blue / magenta | edge parallel to X / Y / Z / W |
| edge thickness | closer in W = thicker |
| gold / teal / white | marked vertices 1–3 |
| magenta arcs | quarter circles that carry the W coordinate between side views |
| frame color of a side view | the axis missing there |

Edges are square beams rather than round tubes. Each beam is rolled so that one flat side faces away from the center of its view, which makes distorted cubes read as frames. Switch in `config.js`: `EDGE_STYLE = 'beam' | 'tube'`.

### Reference lines

Tapping a vertex marks it in every view and connects the copies:
- **center ↔ side view:** a straight line; with an orthographic center it is parallel to an axis, because both views share two coordinates.
- **side view ↔ side view:** straight to the offset plane, then a **quarter circle**, then straight again. This is the classic construction from technical drawing.

### Information

| Element | Where | Contents |
|---|---|---|
| status line | below the setup | active plane, which plane stays fixed, angle, what the ray points at, mode and zoom |
| legend + rotation matrix | left wrist (appears when you turn the controller towards your face); on desktop on the left | color meanings and the 4×4 matrix; column = where the original axis points now |
| vertex tooltip | above a marked vertex | current coordinates (x, y, z, w) |

The knob angles show how far each knob was turned. **Only the matrix describes the actual orientation**, because 4D rotations, like 3D rotations, depend on their order.

---

## Controls

### Quest 3 controllers

| Action | Input |
|---|---|
| rotate in a plane | point at a knob, hold trigger or grip, **twist your wrist** like a dial; or thumbstick left/right |
| unfold | same on the fold knob; half a turn to the right = fully open |
| pick shape / view | point at a header field + trigger |
| button | point at it + trigger |
| mark / unmark vertex | point at a vertex + trigger |
| move and turn the setup | hold trigger or grip in empty space and move your hand |
| pull closer / push away | thumbstick forward/back while holding |
| zoom (0.3× – 5×) | grab with **both** hands, move them apart/together |
| auto-rotate on/off (in unfold mode: auto-fold) | A or X |
| clear selection | B |
| pin/unpin the wrist panel | Y |
| place the setup in front of you again | press the left thumbstick |
| strength of the 4D perspective | right thumbstick left/right (while not grabbing) |

**Hand tracking:** a pinch acts as the trigger. Turning knobs works with the wrist as well.

Note: grabbing and turning the setup only changes your **viewpoint**; the matrix and the side views stay the same. The XY/XZ/YZ knobs, in contrast, rotate the shape **within its 4D space**.

### Desktop (for development)

Drag a knob with the mouse, click a vertex, drag the background to look around, scroll to zoom.

| Key | Function |
|---|---|
| S | next shape |
| V | next view (multi-view → shape only → unfold) |
| 1–6 | active plane: XY, XZ, XW, YZ, YW, ZW |
| ← → | turn the active plane by 5°; in unfold mode fold by 5 % |
| Space | auto-rotate / auto-fold |
| P | center perspective/orthographic |
| R | reset |
| C | clear selection |

`window.__tesseract` (state, views, setup, scene, …) is available in the browser console, e.g. `__tesseract.state.turn(2, Math.PI / 4)`.

---

## Code structure

```
index.html              page, import map, favicons, desktop help, legal links
vendor/three/           three.js 0.160.0 (module build, ARButton, OrbitControls, LICENSE)
favicon.svg/.ico, apple-touch-icon.png
docs/                   screenshots for this README
src/
  config.js             all constants: colors, planes, sizes, speeds, edge style
  i18n.js               translations (de, en) and language detection
  main.js               scene, placement, wiring of modules, render loop
  core/
    math4d.js           4D rotation, projections, number formatting (no three.js)
    state.js            AppState: shape, view, matrix, knob angles, fold amount, selection, messages
  shapes/
    common.js           shape format description, circle helper
    cube3d.js           3D cube at w = 0
    tesseract.js        16 vertices, 32 edges (colored by axis)
    spheres.js          3D sphere and 4D sphere as circle grids
    car.js              convertible made of primitives (surface model, textured plate)
    index.js            list of shapes in desk order
  render/
    batches.js          instanced beams/tubes, spheres, dynamic quads
    views.js            center + 3 side views for the chosen shape, vertex picking
    meshProjector.js    sends surface models (the car) through rotation and projection
    links.js            reference lines and quarter-circle arcs
    unfold.js           unfolding: cube with sheet and shadow, tesseract as Dalí cross
  ui/
    canvasPanel.js      canvas texture on a plane/sprite, text helpers, UI colors
    pult.js             control desk with header, knobs and buttons
    statusLine.js       status line
    infoPanel.js        legend + rotation matrix
    vertexLabels.js     coordinate tooltips
  input/
    interaction.js      pointers (XR controllers, hands, mouse), hit testing, gamepad buttons
    manipulator.js      grab, move and zoom the setup
```

Code comments are in German.

### Data flow per frame

```
Interaction.update   read input → change state (turn, toggle, …)
AppState.update      auto-rotation/folding, projection blend, re-orthonormalize the matrix
ViewSet.update       rotate vertices (M·v) and project → edge/vertex batches
  or UnfoldScene.update
Links.update         reference lines for marked vertices
UI modules           redraw their canvas only when state.version changes (throttled)
renderer.render
```

### The math in brief

- **Orientation:** a 4×4 matrix `M` (row-major array). Vertex `v` becomes `M·v`.
- **Rotation in plane (a, b) by θ:** rows a and b of `M` are mixed (`M ← G·M`), so rotations always refer to the fixed axes of the view, not to already rotated ones.
- **Fixed plane:** rotating in (a, b) leaves the plane of the other two axes completely unchanged (XW ↔ YZ, YW ↔ XZ, ZW ↔ XY).
- **Perspective:** camera at w = d, factor `d / (d − w)`. The blend to orthographic uses `1 + t·(factor − 1)`.
- **Side view without a:** coordinate a is replaced by w, then offset by `SIDE_OFFSET` along a.

---

## Extending it

| Goal | Where to start |
|---|---|
| colors, sizes, spacing | `config.js` only |
| change texts, add a language | `i18n.js`: add a block with the same keys; missing keys fall back to English |
| new button | `Pult.buttons` (label) + `Pult.action` + a method in `AppState` |
| new view (e.g. a slicing mode) | a new module in `render/` following `views.js`, hooked into `main.js`, a new value for `state.viewMode` |
| new shape (e.g. 16-cell, 24-cell, cube pyramid) | a file in `src/shapes/` following the format in `common.js`, added to `shapes/index.js`; it appears on the desk automatically |
| other input | `Interaction.press/release/update`; pointers only provide a ray and a quaternion |

### Roadmap

1. **Guided tour:** 6 chapters as presets, each with one task in the status line
2. Hints at special moments (e.g. at 90°: “X and W have swapped”), selecting individual cells
3. Slicing mode (3D cross-section at w = c, ideal for the 4D sphere), turning the tesseract directly with your hands
4. More shapes: cube pyramid, duoprism, 16-cell, 24-cell

### Known limitations

- The “without Z” view sits behind the center and is hidden from the front; move your head sideways or turn the setup.
- Line thicknesses are tuned for viewing from about 50–80 cm; they get thin when zoomed far out.
- Knob angles are shown folded to ±180°.
- Unfold mode has no multi-view and no vertex selection.
- Switching the language reloads the page, so do it before entering AR.

---

## License

[MIT](LICENSE) © 2026 Simon Schliecker. three.js 0.160.0 is included in `vendor/three/` under its own MIT license; the app loads nothing from third-party servers.
