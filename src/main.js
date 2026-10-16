// Einstiegspunkt: Szene aufbauen, Module verbinden, Render-Schleife.

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { UNIT_RISS, UNIT_SINGLE } from './config.js';
import { AppState } from './core/state.js';
import { ViewSet } from './render/views.js';
import { Links } from './render/links.js';
import { Pult } from './ui/pult.js';
import { StatusLine } from './ui/statusLine.js';
import { InfoPanel } from './ui/infoPanel.js';
import { VertexLabels } from './ui/vertexLabels.js';
import { Interaction } from './input/interaction.js';

// ---------- Renderer & Szene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // transparent → Passthrough in AR, CSS-Hintergrund am Desktop
renderer.xr.enabled = true;
document.getElementById('app').appendChild(renderer.domElement);
document.body.appendChild(ARButton.createButton(renderer, { optionalFeatures: ['local-floor', 'hand-tracking'] }));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50);
camera.position.set(0.5, 1.62, 0.6);

scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(1, 3, 2);
scene.add(sun);

// ---------- Module ----------
const state = new AppState();

const setup = new THREE.Group();            // alles, was gegriffen/gezoomt wird
setup.name = 'setup';
scene.add(setup);

const views = new ViewSet();
setup.add(views.group);
let contentScale = UNIT_RISS;
views.group.scale.setScalar(contentScale);

const links = new Links();
views.group.add(links.mesh);

const pult = new Pult(state);
scene.add(pult.root);

const status = new StatusLine();
scene.add(status.panel.mesh);

const info = new InfoPanel();
let infoOnWrist = false;

const labels = new VertexLabels();
scene.add(...labels.objects);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;

// ---------- Platzierung ----------
function desktopLayout() {
  setup.position.set(0, 1.35, -0.6);
  setup.rotation.set(0, 0, 0);
  setup.scale.setScalar(1);
  pult.root.position.set(0.05, 1.0, -0.22);
  pult.root.rotation.set(0, 0, 0);
  scene.add(info.mesh);
  info.mesh.position.set(-0.36, 1.36, -0.5);
  info.mesh.rotation.set(0, 0.5, 0);
  info.mesh.scale.setScalar(1.4);
  info.panel.material.opacity = 1;
  info.mesh.visible = true;
  infoOnWrist = false;
  orbit.target.set(0, 1.25, -0.5);
  orbit.update();
}

const _head = new THREE.Vector3();
const _dir = new THREE.Vector3();

/** Aufbau 70 cm vor den Kopf, Pult darunter auf Greifhöhe */
function placeInFront() {
  camera.getWorldPosition(_head);
  camera.getWorldDirection(_dir);
  _dir.y = 0;
  if (_dir.lengthSq() < 1e-6) _dir.set(0, 0, -1);
  _dir.normalize();
  const yaw = Math.atan2(-_dir.x, -_dir.z);
  setup.position.copy(_head).addScaledVector(_dir, 0.7);
  setup.position.y = _head.y - 0.05;
  setup.rotation.set(0, yaw, 0);
  setup.scale.setScalar(1);
  pult.root.position.copy(_head).addScaledVector(_dir, 0.42);
  pult.root.position.y = _head.y - 0.42;
  pult.root.rotation.set(0, yaw, 0);
}

function attachInfoToWrist(p) {
  if (p.handedness !== 'left') return;
  p.grip.add(info.mesh);
  info.mesh.position.set(0, 0.07, 0.02);
  info.mesh.rotation.set(-Math.PI / 2 + 0.6, 0, 0);
  info.mesh.scale.setScalar(1);
  infoOnWrist = true;
}

// ---------- Eingabe ----------
const interaction = new Interaction({
  renderer, camera, scene, state, views, pult, setup, orbit, onPlace: placeInFront,
});
interaction.onConnected = attachInfoToWrist;

let placePending = 0;
renderer.xr.addEventListener('sessionstart', () => {
  placePending = 3; // ein paar Frames warten, bis die Kopfposition bekannt ist
  orbit.enabled = false;
  document.body.classList.add('xr');
});
renderer.xr.addEventListener('sessionend', () => {
  desktopLayout();
  orbit.enabled = true;
  document.body.classList.remove('xr');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

desktopLayout();

// ---------- Render-Schleife ----------
const clock = new THREE.Clock();
const _v = new THREE.Vector3();
const _n = new THREE.Vector3();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const xr = renderer.xr.isPresenting;
  if (placePending > 0 && xr && --placePending === 0) placeInFront();

  interaction.update(dt);
  state.update(dt);

  // Inhaltsmaßstab je Ansicht weich überblenden
  const target = state.viewMode === 'riss' ? UNIT_RISS : UNIT_SINGLE;
  contentScale += (target - contentScale) * Math.min(1, dt * 6);
  views.group.scale.setScalar(contentScale);

  views.update(state, interaction.hover);
  links.update(state, views);
  setup.updateMatrixWorld();

  camera.getWorldPosition(_head);

  // Statuszeile unter dem Aufbau, feste Größe, zur Kamera gedreht
  _v.set(0, -contentScale * 3.1, 0);
  setup.localToWorld(_v);
  _v.y -= 0.035;
  status.panel.mesh.position.copy(_v);
  status.panel.mesh.lookAt(_head);
  status.update(state, interaction.hover, setup.scale.x);

  pult.update(interaction.hover);
  labels.update(state, views);
  info.update(state);

  // Info-Panel am Handgelenk: sichtbar, wenn es zum Gesicht zeigt (oder angeheftet mit Y)
  if (infoOnWrist && xr) {
    info.mesh.getWorldPosition(_v);
    _n.set(0, 0, 1).transformDirection(info.mesh.matrixWorld);
    const facing = _n.dot(_head.clone().sub(_v).normalize());
    const want = state.infoPinned || facing > 0.55 ? 1 : 0;
    const m = info.panel.material;
    m.opacity += (want - m.opacity) * Math.min(1, dt * 10);
    info.mesh.visible = m.opacity > 0.02;
  }

  if (!xr) orbit.update();
  renderer.render(scene, camera);
});

// Für Tests und eigene Experimente in der Browser-Konsole
window.__tesseract = { state, views, setup, scene, camera, renderer };
