// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 MUSIC BOT FFT INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Author: BotForge
// Version: 1.0.0
// Purpose: Extract FFT data from Discord voice and stream to WebSocket server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WebSocket = require('ws');
const { Transform } = require('stream');
const prism = require('prism-media');

// ═══════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const WEBSOCKET_URL = 'wss://your-websocket-server.railway.app';
const FFT_SIZE = 64; // Number of frequency bins (must match visualizer)
const SAMPLE_RATE = 48000; // Discord audio sample rate
const UPDATE_RATE = 60; // Updates per second (60 FPS)

// ═══════════════════════════════════════════════════════════════════
// 🌐 WEBSOCKET CONNECTION
// ═══════════════════════════════════════════════════════════════════

let ws = null;
let isConnected = false;

function connectWebSocket() {
  try {
    ws = new WebSocket(WEBSOCKET_URL, {
      headers: {
        'User-Agent': 'MusicBot/1.0'
      }
    });

    ws.on('open', () => {
      console.log('✅ Connected to visualizer server');
      isConnected = true;
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      isConnected = false;
    });

    ws.on('close', () => {
      console.log('🔌 Disconnected from visualizer server');
      isConnected = false;
      
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    });

  } catch (err) {
    console.error('❌ Failed to connect to WebSocket:', err.message);
    setTimeout(connectWebSocket, 5000);
  }
}

// Start connection
connectWebSocket();

// ═══════════════════════════════════════════════════════════════════
// 🎵 FFT PROCESSOR
// ═══════════════════════════════════════════════════════════════════

class FFTProcessor extends Transform {
  constructor() {
    super();
    
    this.buffer = [];
    this.lastUpdate = 0;
    this.updateInterval = 1000 / UPDATE_RATE; // milliseconds
  }

  _transform(chunk, encoding, callback) {
    // Pass through the audio (don't modify it)
    this.push(chunk);
    
    // Process FFT
    this.processFFT(chunk);
    
    callback();
  }

  processFFT(chunk) {
    const now = Date.now();
    
    // Throttle updates to maintain target FPS
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    this.lastUpdate = now;
    
    try {
      // Convert chunk to Int16Array (PCM audio)
      const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
      
      // Calculate frequency bands using simple method
      // (For production, use a proper FFT library like fft.js or kiss-fft)
      const frequencies = this.calculateFrequencies(samples);
      
      // Send to WebSocket
      if (isConnected && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'fft',
          frequencies: frequencies,
          timestamp: now
        }));
      }
      
    } catch (err) {
      console.error('❌ FFT processing error:', err.message);
    }
  }

  calculateFrequencies(samples) {
    // Simple frequency band calculation
    // For production use, implement proper FFT (Fast Fourier Transform)
    
    const bands = FFT_SIZE;
    const frequencies = new Array(bands);
    const samplesPerBand = Math.floor(samples.length / bands);
    
    for (let i = 0; i < bands; i++) {
      const start = i * samplesPerBand;
      const end = start + samplesPerBand;
      
      // Calculate RMS (Root Mean Square) for this band
      let sum = 0;
      for (let j = start; j < end && j < samples.length; j++) {
        const normalized = samples[j] / 32768; // Normalize to -1 to 1
        sum += normalized * normalized;
      }
      
      const rms = Math.sqrt(sum / samplesPerBand);
      
      // Convert to 0-255 range
      const magnitude = Math.min(255, Math.floor(rms * 1000));
      frequencies[i] = magnitude;
    }
    
    return frequencies;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎮 DISCORD BOT INTEGRATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Start visualizer for current voice connection
 * Call this function when your bot starts playing music
 * 
 * @param {VoiceConnection} connection - Discord.js voice connection
 */
function startVisualizer(connection) {
  if (!connection) {
    console.error('❌ No voice connection provided');
    return;
  }

  console.log('🎵 Starting audio visualizer...');

  try {
    // Get the audio receiver
    const receiver = connection.receiver;
    
    // Subscribe to bot's own audio (what it's playing)
    // Note: This subscribes to the bot's audio output
    const audioStream = receiver.subscribe(connection.client.user.id, {
      end: {
        behavior: 'manual'
      }
    });

    // Create FFT processor
    const fftProcessor = new FFTProcessor();

    // Create decoder
    const decoder = new prism.opus.Decoder({
      rate: SAMPLE_RATE,
      channels: 2,
      frameSize: 960
    });

    // Pipe: Opus stream → Decoder → FFT Processor
    audioStream
      .pipe(decoder)
      .pipe(fftProcessor);

    console.log('✅ Visualizer started successfully');
    console.log(`📊 Streaming at ${UPDATE_RATE} FPS with ${FFT_SIZE} frequency bands`);

  } catch (err) {
    console.error('❌ Failed to start visualizer:', err.message);
  }
}

/**
 * Stop visualizer
 */
function stopVisualizer() {
  console.log('🛑 Stopping visualizer...');
  // Cleanup if needed
}

// ═══════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  startVisualizer,
  stopVisualizer,
  connectWebSocket,
  isConnected: () => isConnected
};

// ═══════════════════════════════════════════════════════════════════
// 📝 USAGE EXAMPLE
// ═══════════════════════════════════════════════════════════════════

/*

// In your music bot's play command:

const visualizer = require('./visualizer-integration');

// When bot joins voice channel and starts playing:
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.id === client.user.id) {
    if (newState.channel) {
      const connection = getVoiceConnection(newState.guild.id);
      if (connection) {
        visualizer.startVisualizer(connection);
      }
    } else {
      visualizer.stopVisualizer();
    }
  }
});

// Or in your play command:
async function playCommand(interaction) {
  // ... your existing play code ...
  
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator
  });
  
  // Start visualizer
  visualizer.startVisualizer(connection);
  
  // ... rest of your code ...
}

*/
