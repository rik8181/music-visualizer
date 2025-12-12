// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 REAL-TIME 60 FPS MUSIC VISUALIZER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Author: BotForge
// Version: 1.0.0
// Type: 2D Spectrum Analyzer with Neon Effects
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════════════════════
// 🎨 CANVAS SETUP
// ═══════════════════════════════════════════════════════════════════

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════════════════════════════
// 🌐 WEBSOCKET CONNECTION
// ═══════════════════════════════════════════════════════════════════

// IMPORTANT: Change this to your WebSocket server URL
const WS_URL = 'wss://music-visualizer-4tbg.onrender.com';

let ws = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

function connect() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to audio stream');
      isConnected = true;
      reconnectAttempts = 0;
      
      statusEl.textContent = '🎵 Connected • Waiting for audio...';
      statusEl.className = 'connected';
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'fft' && data.frequencies) {
          frequencyData = new Uint8Array(data.frequencies);
          
          // Update status on first data
          if (statusEl.classList.contains('pulse')) {
            statusEl.classList.remove('pulse');
            statusEl.textContent = '🎵 Audio streaming • 60 FPS';
          }
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from server');
      isConnected = false;
      
      statusEl.textContent = '❌ Disconnected • Reconnecting...';
      statusEl.className = 'disconnected pulse';
      
      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(connect, RECONNECT_DELAY);
      } else {
        statusEl.textContent = '❌ Connection failed • Refresh page';
      }
    };
  } catch (err) {
    console.error('Connection error:', err);
    statusEl.textContent = '❌ Connection error • Check console';
  }
}

// Start connection
connect();

// ═══════════════════════════════════════════════════════════════════
// 🎵 AUDIO DATA
// ═══════════════════════════════════════════════════════════════════

let frequencyData = new Uint8Array(64); // 64 frequency bins
let smoothedData = new Array(64).fill(0); // For smooth transitions

// ═══════════════════════════════════════════════════════════════════
// 🎨 VISUALIZER SETTINGS
// ═══════════════════════════════════════════════════════════════════

const config = {
  barCount: 64,
  barSpacing: 4,
  smoothingFactor: 0.7,
  minBarHeight: 5,
  glowIntensity: 20,
  mirrorEffect: true,
  colorMode: 'rainbow', // 'rainbow', 'neon', 'fire'
};

// ═══════════════════════════════════════════════════════════════════
// 🎨 COLOR SCHEMES
// ═══════════════════════════════════════════════════════════════════

function getColor(index, value, mode = 'rainbow') {
  const ratio = index / config.barCount;
  const intensity = value / 255;

  switch (mode) {
    case 'rainbow':
      const hue = ratio * 360;
      const saturation = 100;
      const lightness = 40 + (intensity * 40);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    case 'neon':
      const r = Math.floor(255 * intensity);
      const g = Math.floor(255 * (1 - ratio));
      const b = Math.floor(255 * ratio);
      return `rgb(${r}, ${g}, ${b})`;

    case 'fire':
      const fireHue = 60 - (ratio * 60); // Yellow to red
      return `hsl(${fireHue}, 100%, ${40 + intensity * 40}%)`;

    default:
      return '#00ff88';
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function drawBackground() {
  // Fade effect for trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  // Horizontal lines
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Center line
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function drawBars() {
  const barWidth = (canvas.width / config.barCount) - config.barSpacing;

  for (let i = 0; i < config.barCount; i++) {
    // Get frequency value
    const rawValue = frequencyData[i] || 0;
    
    // Smooth the data
    smoothedData[i] += (rawValue - smoothedData[i]) * config.smoothingFactor;
    const value = smoothedData[i];

    // Calculate dimensions
    const normalizedValue = value / 255;
    const barHeight = Math.max(
      config.minBarHeight,
      normalizedValue * canvas.height * 0.7
    );

    // Position
    const x = i * (barWidth + config.barSpacing);
    const y = (canvas.height / 2) - (barHeight / 2);

    // Get color
    const color = getColor(i, value, config.colorMode);

    // Draw main bar
    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Glow effect
    if (normalizedValue > 0.3) {
      ctx.shadowBlur = config.glowIntensity * normalizedValue;
      ctx.shadowColor = color;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }

    // Mirror effect (reflection)
    if (config.mirrorEffect) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.scale(1, -1);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, -canvas.height + (canvas.height / 2) - (barHeight / 2), barWidth, barHeight);
      ctx.restore();
    }

    // Peak cap
    const capHeight = 3;
    const capY = y - capHeight - 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, capY, barWidth, capHeight);
  }
}

function drawWaveform() {
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const step = canvas.width / config.barCount;

  for (let i = 0; i < config.barCount; i++) {
    const value = smoothedData[i] || 0;
    const normalizedValue = value / 255;
    const x = i * step;
    const y = canvas.height / 2 + (normalizedValue * 100 - 50);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawStats() {
  // Calculate average volume
  const avgVolume = smoothedData.reduce((a, b) => a + b, 0) / config.barCount;
  const volumePercent = Math.floor((avgVolume / 255) * 100);

  // Draw volume meter
  const meterWidth = 200;
  const meterHeight = 20;
  const meterX = canvas.width - meterWidth - 20;
  const meterY = 20;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

  // Fill
  const fillWidth = (volumePercent / 100) * meterWidth;
  const meterColor = volumePercent > 80 ? '#ff0088' : volumePercent > 50 ? '#ffaa00' : '#00ff88';
  ctx.fillStyle = meterColor;
  ctx.fillRect(meterX, meterY, fillWidth, meterHeight);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${volumePercent}%`, meterX - 10, meterY + 15);
}

// ═══════════════════════════════════════════════════════════════════
// 🎬 MAIN RENDER LOOP (60 FPS)
// ═══════════════════════════════════════════════════════════════════

let frameCount = 0;

function render() {
  frameCount++;

  // Clear and draw background
  drawBackground();

  // Draw visualizer elements
  drawBars();
  // drawWaveform(); // Optional: uncomment for waveform overlay

  // Draw stats
  if (isConnected) {
    drawStats();
  }

  // Continue loop
  requestAnimationFrame(render);
}

// Start rendering
console.log('🎨 Starting visualizer...');
render();

// ═══════════════════════════════════════════════════════════════════
// 🎮 KEYBOARD CONTROLS
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keypress', (e) => {
  switch (e.key) {
    case '1':
      config.colorMode = 'rainbow';
      console.log('🌈 Color mode: Rainbow');
      break;
    case '2':
      config.colorMode = 'neon';
      console.log('💜 Color mode: Neon');
      break;
    case '3':
      config.colorMode = 'fire';
      console.log('🔥 Color mode: Fire');
      break;
    case 'm':
      config.mirrorEffect = !config.mirrorEffect;
      console.log('🪞 Mirror:', config.mirrorEffect);
      break;
    case '+':
      config.smoothingFactor = Math.min(0.95, config.smoothingFactor + 0.05);
      console.log('🎚️ Smoothing:', config.smoothingFactor.toFixed(2));
      break;
    case '-':
      config.smoothingFactor = Math.max(0.1, config.smoothingFactor - 0.05);
      console.log('🎚️ Smoothing:', config.smoothingFactor.toFixed(2));
      break;
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎵 Music Visualizer Ready');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Keyboard controls:');
console.log('1 - Rainbow colors');
console.log('2 - Neon colors');
console.log('3 - Fire colors');
console.log('M - Toggle mirror effect');
console.log('+/- - Adjust smoothing');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
