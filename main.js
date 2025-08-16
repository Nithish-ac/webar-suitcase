import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  20
);

// Renderer with XR enabled
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Add AR button
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// Light
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
scene.add(light);

// For testing before suitcase model: a small box
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.visible = false; // Start hidden
scene.add(cube);

// Hit testing setup
let hitTestSource = null;
let localSpace = null;
let hitTestSourceRequested = false;

function animate(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
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
        cube.visible = true;
        cube.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
      }
    }
  }

  renderer.render(scene, camera);
}

// Start AR render loop
renderer.setAnimationLoop(animate);
