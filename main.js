import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 🎥 Setup Zappar camera
const canvas = document.getElementById('ar-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 🔑 Important: link Zappar with WebGL context
ZapparThree.glContextSet(renderer.getContext());

const scene = new THREE.Scene();
const camera = new ZapparThree.Camera();
scene.add(camera);

// ☀️ Light
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
scene.add(light);

// 📦 Model
let suitcase = null;
const loader = new GLTFLoader();

ZapparThree.permissionRequestUI().then(granted => {
  if (granted) {
    camera.start(); // ✅ start camera stream

    // Instant tracker
    const instantTracker = new ZapparThree.InstantWorldTracker();
    const trackerGroup = new ZapparThree.InstantWorldAnchorGroup(camera, instantTracker);
    scene.add(trackerGroup);

    // Load suitcase
    loader.load('/models/suitcase.glb', (gltf) => {
      suitcase = gltf.scene;
      suitcase.scale.set(1, 1, 1);
      trackerGroup.add(suitcase);
    });

    // Animation
    animate(trackerGroup, instantTracker);
  } else {
    alert("Camera permission denied. Cannot run AR.");
  }
});

// 🎨 UI Controls
document.getElementById('color-red').onclick = () => setColor(0xff0000);
document.getElementById('color-blue').onclick = () => setColor(0x0000ff);
document.getElementById('color-black').onclick = () => setColor(0x111111);

function setColor(colorHex) {
  if (!suitcase) return;
  suitcase.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.color.setHex(colorHex);
    }
  });
}

// 🔁 Animate loop
function animate(trackerGroup, instantTracker) {
  requestAnimationFrame(() => animate(trackerGroup, instantTracker));
  instantTracker.setAnchorPoseFromCameraOffset(0, 0, -5);
  renderer.render(scene, camera);
}

// 📱 Resize handling
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
