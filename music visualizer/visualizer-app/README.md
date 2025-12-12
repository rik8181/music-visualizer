# 🎵 Discord Music Visualizer

**Real-time 60 FPS audio visualizer for Discord voice channels**

Experience music like never before with this stunning real-time visualizer that displays inside Discord voice channels using the Embedded App SDK.

---

## ✨ Features

### 🎨 **2D Spectrum Analyzer**
- 64 frequency bands
- Rainbow/Neon/Fire color modes
- Mirror reflection effect
- Smooth animations (60 FPS)
- Volume meter
- Keyboard controls

### 🌟 **3D Rotating Equalizer**
- Three.js powered 3D graphics
- 64 3D bars in circular formation
- Animated particles
- Pulsing center orb
- Dynamic lighting
- Camera controls (drag/zoom)

---

## 🚀 Quick Start

### 1. Deploy to GitHub Pages

```bash
# Fork or clone this repo
git clone https://github.com/YOUR-USERNAME/visualizer-app
cd visualizer-app

# Push to your GitHub
git remote set-url origin https://github.com/YOUR-USERNAME/visualizer-app
git push -u origin main

# Enable GitHub Pages
# Go to: Settings → Pages → Source: main branch → Save
```

**Your visualizer will be live at:**
```
https://YOUR-USERNAME.github.io/visualizer-app/
```

### 2. Setup WebSocket Server

See `/websocket-server/` folder for server setup.

Deploy to Railway (FREE):
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. New Project → Deploy from GitHub
4. Select `websocket-server` repo
5. Copy the WebSocket URL

### 3. Update WebSocket URL

Edit these files and replace the WebSocket URL:

**`visualizer.js`:**
```javascript
const WS_URL = 'wss://your-server.railway.app';
```

**`visualizer-3d.js`:**
```javascript
const WS_URL = 'wss://your-server.railway.app';
```

### 4. Configure Discord Embedded App

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **Embedded App SDK**
4. Enable Embedded App
5. Add URL Mapping:
   ```
   Path: /visualizer
   URL: https://YOUR-USERNAME.github.io/visualizer-app/
   ```
6. Save changes

### 5. Update Music Bot

Add FFT analysis to your music bot (see `/bot-integration/` folder).

---

## 📁 Project Structure

```
visualizer-app/
├── index.html              # 2D Visualizer (main)
├── visualizer.js           # 2D JavaScript
├── visualizer-3d.html      # 3D Visualizer
├── visualizer-3d.js        # 3D JavaScript (Three.js)
└── README.md               # This file
```

---

## 🎮 Controls

### 2D Visualizer

| Key | Action |
|-----|--------|
| `1` | Rainbow color mode |
| `2` | Neon color mode |
| `3` | Fire color mode |
| `M` | Toggle mirror effect |
| `+` | Increase smoothing |
| `-` | Decrease smoothing |

### 3D Visualizer

| Key | Action |
|-----|--------|
| `A` | Toggle auto-rotate |
| `F` | Toggle fog effect |
| `P` | Toggle particles |
| **Mouse** | Drag to rotate, scroll to zoom |

---

## 🔧 Configuration

### Customize 2D Visualizer

Edit `visualizer.js`:

```javascript
const config = {
  barCount: 64,           // Number of bars (32-128)
  barSpacing: 4,          // Space between bars (2-10)
  smoothingFactor: 0.7,   // Animation smoothing (0-1)
  minBarHeight: 5,        // Minimum bar height
  glowIntensity: 20,      // Glow effect intensity
  mirrorEffect: true,     // Enable mirror reflection
  colorMode: 'rainbow',   // 'rainbow', 'neon', 'fire'
};
```

### Customize 3D Visualizer

Edit `visualizer-3d.js`:

```javascript
const barCount = 64;      // Number of 3D bars
const particleCount = 1000; // Number of particles
```

---

## 🌐 WebSocket Protocol

The visualizer expects JSON messages in this format:

```json
{
  "type": "fft",
  "frequencies": [0, 15, 45, 89, ...],  // Array of 64 values (0-255)
  "timestamp": 1234567890
}
```

---

## 💡 How It Works

```
┌──────────────────┐
│   Music Bot      │ → Plays audio in Discord
└────────┬─────────┘
         │
         │ FFT Analysis (audio → frequencies)
         ▼
┌──────────────────┐
│ WebSocket Server │ → Streams data in real-time
└────────┬─────────┘
         │
         │ JSON: {type: 'fft', frequencies: [...]}
         ▼
┌──────────────────┐
│ GitHub Pages     │ → Hosts visualizer HTML/JS
│   (Static App)   │
└────────┬─────────┘
         │
         │ Embedded in Discord Activity
         ▼
┌──────────────────┐
│ Discord Voice    │ → Users see 60 FPS visualization
│    Channel       │
└──────────────────┘
```

---

## 🎨 Customization Ideas

### Color Schemes

Add your own color modes:

```javascript
case 'custom':
  const r = Math.floor(255 * Math.sin(ratio * Math.PI));
  const g = Math.floor(255 * intensity);
  const b = Math.floor(255 * (1 - ratio));
  return `rgb(${r}, ${g}, ${b})`;
```

### Visual Effects

- Waveform overlay
- Beat detection
- Blur effects
- Custom shaders (WebGL)
- Particle systems

### 3D Enhancements

- Different bar shapes (cylinders, cones)
- Terrain visualization
- VU meters
- Album art integration

---

## 🐛 Troubleshooting

### "Disconnected" message

1. Check WebSocket server is running
2. Verify WebSocket URL in JavaScript files
3. Check browser console for errors
4. Ensure bot is sending FFT data

### No audio data

1. Verify bot is in voice channel
2. Check bot has FFT analysis enabled
3. Verify WebSocket connection in bot logs
4. Test WebSocket server with test client

### Visualizer not showing in Discord

1. Verify GitHub Pages is enabled and working
2. Check Discord Dev Portal Embedded App config
3. Ensure URL mapping is correct
4. Try opening URL directly in browser first

---

## 🔒 Security Notes

- WebSocket server should validate connections
- Consider adding authentication tokens
- GitHub Pages is public - anyone with URL can access
- Rate limit WebSocket connections

---

## 📊 Performance

- **60 FPS** on modern browsers
- **~10 KB/s** WebSocket bandwidth
- **Low CPU** usage (<5% typical)
- **No audio processing** in browser (data comes pre-analyzed)

---

## 🌍 Browser Support

| Browser | 2D | 3D |
|---------|----|----|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Discord Desktop | ✅ | ✅ |
| Discord Mobile | ✅ | ⚠️ |

*3D visualizer may have reduced performance on mobile*

---

## 📝 License

MIT License - Free to use and modify!

---

## 🤝 Contributing

Pull requests welcome! Ideas for improvements:

- [ ] More color schemes
- [ ] Preset configurations
- [ ] Beat detection
- [ ] Lyrics display
- [ ] Album art integration
- [ ] VR support
- [ ] Mobile optimizations

---

## 💎 Created by BotForge

**Need a custom music bot or visualizer?**

Contact: contact@botforge.dev

---

## 🎵 Enjoy the music! 🎵
