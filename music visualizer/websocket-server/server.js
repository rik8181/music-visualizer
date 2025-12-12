// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 WEBSOCKET SERVER FOR REAL-TIME AUDIO STREAMING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Author: BotForge
// Version: 1.0.0
// Purpose: Stream FFT data from bot to visualizer clients
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WebSocket = require('ws');
const http = require('http');

// ═══════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 8080;
const MAX_CLIENTS = 100;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// ═══════════════════════════════════════════════════════════════════
// 🌐 HTTP SERVER
// ═══════════════════════════════════════════════════════════════════

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: viewers.size,
      botConnected: botConnection !== null,
      uptime: process.uptime()
    }));
    return;
  }

  // Info endpoint
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🎵 Audio Streaming Server</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
          }
          h1 { color: #00ff88; }
          .status {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .connected { color: #00ff88; }
          .disconnected { color: #ff0088; }
          code {
            background: #000;
            padding: 2px 5px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>🎵 Audio Streaming Server</h1>
        
        <div class="status">
          <h2>Status</h2>
          <p>Server: <span class="connected">✅ Running</span></p>
          <p>Bot: <span class="${botConnection ? 'connected' : 'disconnected'}">${botConnection ? '✅ Connected' : '❌ Disconnected'}</span></p>
          <p>Viewers: <strong>${viewers.size}</strong></p>
          <p>Uptime: <strong>${Math.floor(process.uptime())}s</strong></p>
        </div>

        <div class="status">
          <h2>WebSocket Connection</h2>
          <p>Connect to: <code>wss://${req.headers.host}</code></p>
          <p>Protocol: WebSocket</p>
          <p>Format: JSON</p>
        </div>

        <div class="status">
          <h2>Documentation</h2>
          <p>Bot connection: Include <code>User-Agent: MusicBot/1.0</code> header</p>
          <p>Viewer connection: Any other User-Agent</p>
          <p>Message format:</p>
          <pre><code>{
  "type": "fft",
  "frequencies": [0-255, ...],
  "timestamp": 1234567890
}</code></pre>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ═══════════════════════════════════════════════════════════════════
// 🔌 WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  perMessageDeflate: false // Disable compression for lower latency
});

// Connection storage
const viewers = new Set();
let botConnection = null;

// Statistics
let stats = {
  totalConnections: 0,
  totalMessages: 0,
  totalBytes: 0,
  startTime: Date.now()
};

// ═══════════════════════════════════════════════════════════════════
// 👥 CONNECTION HANDLER
// ═══════════════════════════════════════════════════════════════════

wss.on('connection', (ws, req) => {
  stats.totalConnections++;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔌 New connection from ${ip}`);
  console.log(`User-Agent: ${userAgent}`);
  
  // Check if this is the music bot
  const isMusicBot = userAgent.includes('MusicBot') || userAgent.includes('Discord-Bot');
  
  if (isMusicBot) {
    // ═══════════════════════════════════════════════════════════════
    // 🎵 MUSIC BOT CONNECTION
    // ═══════════════════════════════════════════════════════════════
    
    if (botConnection) {
      console.log(`⚠️  Bot already connected, closing old connection`);
      botConnection.close();
    }
    
    botConnection = ws;
    console.log(`✅ Music bot connected`);
    console.log(`👁️  Active viewers: ${viewers.size}`);
    
    // Handle FFT data from bot
    ws.on('message', (data) => {
      try {
        stats.totalMessages++;
        stats.totalBytes += data.length;
        
        // Validate data
        const message = JSON.parse(data);
        
        if (message.type !== 'fft' || !Array.isArray(message.frequencies)) {
          console.error('❌ Invalid message format from bot');
          return;
        }
        
        // Broadcast to all viewers
        let sent = 0;
        viewers.forEach(viewer => {
          if (viewer.readyState === WebSocket.OPEN) {
            viewer.send(data);
            sent++;
          }
        });
        
        // Log occasionally
        if (stats.totalMessages % 100 === 0) {
          console.log(`📊 Broadcasted ${stats.totalMessages} messages to ${sent} viewers`);
        }
        
      } catch (err) {
        console.error('❌ Error processing bot message:', err.message);
      }
    });
    
    ws.on('close', () => {
      console.log('🎵 Music bot disconnected');
      botConnection = null;
      
      // Notify all viewers
      const notification = JSON.stringify({
        type: 'status',
        message: 'Bot disconnected',
        connected: false
      });
      
      viewers.forEach(viewer => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(notification);
        }
      });
    });
    
    ws.on('error', (error) => {
      console.error('❌ Bot connection error:', error.message);
    });
    
  } else {
    // ═══════════════════════════════════════════════════════════════
    // 👁️ VIEWER CONNECTION
    // ═══════════════════════════════════════════════════════════════
    
    if (viewers.size >= MAX_CLIENTS) {
      console.log(`⚠️  Max clients reached, rejecting connection`);
      ws.close(1008, 'Server full');
      return;
    }
    
    viewers.add(ws);
    console.log(`👁️  Viewer connected (${viewers.size} total)`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'status',
      message: 'Connected to audio stream',
      connected: botConnection !== null,
      viewers: viewers.size
    }));
    
    // If bot is connected, notify viewer
    if (botConnection) {
      ws.send(JSON.stringify({
        type: 'status',
        message: 'Bot is streaming',
        connected: true
      }));
    }
    
    ws.on('message', (data) => {
      // Viewers shouldn't send data, but handle gracefully
      console.log(`📨 Received message from viewer (ignored)`);
    });
    
    ws.on('close', () => {
      viewers.delete(ws);
      console.log(`👁️  Viewer disconnected (${viewers.size} remaining)`);
    });
    
    ws.on('error', (error) => {
      console.error('❌ Viewer connection error:', error.message);
      viewers.delete(ws);
    });
  }
  
  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});

// ═══════════════════════════════════════════════════════════════════
// 💓 HEARTBEAT (Keep connections alive)
// ═══════════════════════════════════════════════════════════════════

const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      console.log('💔 Connection timed out, terminating');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeat);
});

// ═══════════════════════════════════════════════════════════════════
// 📊 STATISTICS LOGGER
// ═══════════════════════════════════════════════════════════════════

setInterval(() => {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  const avgMsgPerSec = (stats.totalMessages / uptime).toFixed(2);
  const avgBytesPerSec = (stats.totalBytes / uptime / 1024).toFixed(2);
  
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║        📊 SERVER STATISTICS           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`🎵 Bot: ${botConnection ? 'Connected' : 'Disconnected'}`);
  console.log(`👁️  Viewers: ${viewers.size}`);
  console.log(`📨 Total messages: ${stats.totalMessages}`);
  console.log(`📊 Avg msg/sec: ${avgMsgPerSec}`);
  console.log(`💾 Avg KB/sec: ${avgBytesPerSec}`);
  console.log(`⏱️  Uptime: ${uptime}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}, 60000); // Every minute

// ═══════════════════════════════════════════════════════════════════
// 🚀 START SERVER
// ═══════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🎵 AUDIO STREAMING SERVER STARTED   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('');
  console.log('Waiting for connections...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// ═══════════════════════════════════════════════════════════════════
// 🛑 GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  wss.clients.forEach(ws => {
    ws.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════════
// ❌ ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});
