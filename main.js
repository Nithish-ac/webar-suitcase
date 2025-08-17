import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Add AR button
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// Light
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
scene.add(light);

// Load suitcase model
let suitcase = null;
const loader = new GLTFLoader();
loader.load('/models/suitcase.glb', (gltf) => {
  suitcase = gltf.scene;
  suitcase.visible = false;
  suitcase.scale.set(1, 1, 1);
  scene.add(suitcase);

  // ✅ UI Handlers
  document.getElementById('color-red').onclick = () => setColor(0xff0000);
  document.getElementById('color-blue').onclick = () => setColor(0x0000ff);
  document.getElementById('color-black').onclick = () => setColor(0x111111);

  document.getElementById('size-small').onclick = () => setSize(0.5);
  document.getElementById('size-medium').onclick = () => setSize(1);
  document.getElementById('size-large').onclick = () => setSize(1.5);
});

function setColor(colorHex) {
  if (!suitcase) return;
  suitcase.traverse((child) => {
    if (child.isMesh) {
      child.material.color.setHex(colorHex);
    }
  });
}

function setSize(scale) {
  if (!suitcase) return;
  suitcase.scale.set(scale, scale, scale);
}


// Hit testing
let hitTestSource = null;
let hitTestSourceRequested = false;

let placed = false; // track if already placed

function animate(timestamp, frame) {
  if (frame && suitcase && !placed) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((space) => {
        session.requestHitTestSource({ space }).then((source) => {
          hitTestSource = source;
        });
      });
      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        suitcase.visible = true;
        suitcase.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );

        placed = true; // ✅ lock position after first placement
      }
    }
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
