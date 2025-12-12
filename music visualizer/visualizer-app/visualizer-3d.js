// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 3D REAL-TIME MUSIC VISUALIZER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Author: BotForge
// Version: 1.0.0
// Type: 3D Rotating Equalizer with Three.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ═══════════════════════════════════════════════════════════════════
// 🎨 SCENE SETUP
// ═══════════════════════════════════════════════════════════════════

const container = document.getElementById('container');
const statusEl = document.getElementById('status');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 20, 100);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 15, 30);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 100;

// ═══════════════════════════════════════════════════════════════════
// 💡 LIGHTING
// ═══════════════════════════════════════════════════════════════════

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00ff88, 1, 100);
pointLight1.position.set(0, 20, 0);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff0088, 0.8, 100);
pointLight2.position.set(10, 10, 10);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0x0088ff, 0.8, 100);
pointLight3.position.set(-10, 10, -10);
scene.add(pointLight3);

// ═══════════════════════════════════════════════════════════════════
// 🎵 AUDIO BARS
// ═══════════════════════════════════════════════════════════════════

const barCount = 64;
const bars = [];
const barGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);

for (let i = 0; i < barCount; i++) {
  // Rainbow color
  const hue = (i / barCount) * 360;
  const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.2
  });

  const bar = new THREE.Mesh(barGeometry, material);

  // Position in circle
  const angle = (i / barCount) * Math.PI * 2;
  const radius = 12;
  bar.position.x = Math.cos(angle) * radius;
  bar.position.z = Math.sin(angle) * radius;
  bar.position.y = 0;

  // Rotate to face center
  bar.lookAt(0, 0, 0);

  scene.add(bar);
  bars.push({
    mesh: bar,
    targetHeight: 1,
    currentHeight: 1,
    angle: angle
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🌟 PARTICLES
// ═══════════════════════════════════════════════════════════════════

const particleCount = 1000;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 50;
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
  opacity: 0.6
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// ═══════════════════════════════════════════════════════════════════
// 🎯 CENTER ORBS
// ═══════════════════════════════════════════════════════════════════

const orbGeometry = new THREE.SphereGeometry(2, 32, 32);
const orbMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff88,
  emissive: 0x00ff88,
  emissiveIntensity: 1,
  metalness: 0.8,
  roughness: 0.2,
  transparent: true,
  opacity: 0.8
});

const centerOrb = new THREE.Mesh(orbGeometry, orbMaterial);
scene.add(centerOrb);

// ═══════════════════════════════════════════════════════════════════
// 🌐 WEBSOCKET CONNECTION
// ═══════════════════════════════════════════════════════════════════

const WS_URL = 'wss://music-visualizer-4tbg.onrender.com';

let ws = null;
let isConnected = false;
let frequencyData = new Uint8Array(64);

function connect() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to audio stream');
      isConnected = true;
      statusEl.textContent = '🎵 Connected • 3D Visualizer Active';
      statusEl.style.borderColor = '#00ff88';
      statusEl.style.color = '#00ff88';
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'fft' && data.frequencies) {
          frequencyData = new Uint8Array(data.frequencies);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected');
      isConnected = false;
      statusEl.textContent = '❌ Disconnected • Reconnecting...';
      statusEl.style.borderColor = '#ff0088';
      statusEl.style.color = '#ff0088';
      setTimeout(connect, 3000);
    };
  } catch (err) {
    console.error('Connection error:', err);
  }
}

connect();

// ═══════════════════════════════════════════════════════════════════
// 🎬 ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════════

let time = 0;

function animate() {
  requestAnimationFrame(animate);

  time += 0.01;

  // Calculate average volume
  let avgVolume = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    avgVolume += frequencyData[i];
  }
  avgVolume /= frequencyData.length;
  const normalizedVolume = avgVolume / 255;

  // Update bars
  bars.forEach((bar, i) => {
    // Get frequency value
    const value = frequencyData[i] || 0;
    const normalizedValue = value / 255;

    // Calculate target height
    bar.targetHeight = 1 + (normalizedValue * 15);

    // Smooth transition
    bar.currentHeight += (bar.targetHeight - bar.currentHeight) * 0.3;

    // Apply scale
    bar.mesh.scale.y = bar.currentHeight;
    bar.mesh.position.y = (bar.currentHeight - 1) / 2;

    // Update emissive intensity
    bar.mesh.material.emissiveIntensity = 0.2 + (normalizedValue * 0.8);

    // Subtle rotation
    bar.mesh.rotation.y += 0.01;

    // Pulsing effect
    const pulse = Math.sin(time * 2 + bar.angle * 4) * 0.1;
    bar.mesh.scale.x = 1 + pulse * normalizedValue;
    bar.mesh.scale.z = 1 + pulse * normalizedValue;
  });

  // Update center orb
  centerOrb.scale.setScalar(1 + normalizedVolume * 0.5);
  centerOrb.rotation.y += 0.01;
  centerOrb.rotation.x += 0.005;
  centerOrb.material.emissiveIntensity = 0.5 + normalizedVolume;

  // Rotate particles
  particles.rotation.y += 0.0005;
  particles.rotation.x += 0.0002;

  // Animate lights
  pointLight2.position.x = Math.cos(time) * 15;
  pointLight2.position.z = Math.sin(time) * 15;
  pointLight2.intensity = 0.5 + normalizedVolume * 0.5;

  pointLight3.position.x = Math.sin(time * 0.7) * 15;
  pointLight3.position.z = Math.cos(time * 0.7) * 15;
  pointLight3.intensity = 0.5 + normalizedVolume * 0.5;

  // Auto-rotate camera (subtle)
  if (!controls.autoRotate) {
    camera.position.x = Math.cos(time * 0.1) * 30;
    camera.position.z = Math.sin(time * 0.1) * 30;
    camera.lookAt(0, 5, 0);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════════
// 📱 RESPONSIVE
// ═══════════════════════════════════════════════════════════════════

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════════════════════════════
// 🎮 KEYBOARD CONTROLS
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keypress', (e) => {
  switch (e.key) {
    case 'a':
      controls.autoRotate = !controls.autoRotate;
      console.log('🔄 Auto-rotate:', controls.autoRotate);
      break;
    case 'f':
      scene.fog.density = scene.fog.density === 0.02 ? 0 : 0.02;
      console.log('🌫️ Fog:', scene.fog.density > 0);
      break;
    case 'p':
      particles.visible = !particles.visible;
      console.log('✨ Particles:', particles.visible);
      break;
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🚀 START
// ═══════════════════════════════════════════════════════════════════

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎵 3D Music Visualizer Ready');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Keyboard controls:');
console.log('A - Toggle auto-rotate');
console.log('F - Toggle fog');
console.log('P - Toggle particles');
console.log('Mouse - Drag to rotate, scroll to zoom');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

animate();
