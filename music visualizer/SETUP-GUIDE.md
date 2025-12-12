# 🚀 COMPLETE SETUP GUIDE

**Real-time 60 FPS Discord Music Visualizer**

Follow these steps to deploy your own music visualizer!

---

## 📋 PREREQUISITES

✅ GitHub account (free)
✅ Railway account (free) - railway.app  
✅ Discord Bot (existing music bot)
✅ Node.js 16+ installed locally (for testing)

**Time to complete: ~20 minutes**

---

## 🎨 STEP 1: Deploy Visualizer to GitHub Pages

### 1.1 Create GitHub Repository

Visit GitHub.com and create new repository:
- Name: `music-visualizer`
- Public repository
- Do NOT initialize with README

### 1.2 Clone and Push

```bash
# Navigate to visualizer-app folder
cd visualizer-app

# Initialize git
git init
git branch -M main

# Add GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/music-visualizer.git

# Add and commit files
git add .
git commit -m "🎵 Initial visualizer"

# Push to GitHub
git push -u origin main
```

### 1.3 Enable GitHub Pages

1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: Deploy from branch
4. Branch: `main` → `/root`
5. Click "Save"

Wait 1-2 minutes for deployment.

### 1.4 Verify Deployment

Visit: `https://YOUR-USERNAME.github.io/music-visualizer/`

You should see the visualizer with "Connecting..." message.

✅ **Step 1 Complete!**

---

## 🌐 STEP 2: Deploy WebSocket Server

### 2.1 Setup Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"

### 2.2 Deploy Server

1. Create a new repository for `websocket-server` folder
2. Push to GitHub
3. Deploy on Railway
4. Wait for build (~2 minutes)

### 2.3 Get WebSocket URL

1. Click on your deployed service
2. Go to "Settings"
3. Generate Domain
4. Copy URL: `your-app.railway.app`

**Your WebSocket URL:** `wss://your-app.railway.app`

✅ **Step 2 Complete!**

---

## 🔗 STEP 3: Connect Everything

### 3.1 Update Visualizer

Edit `visualizer.js` and `visualizer-3d.js`:

```javascript
const WS_URL = 'wss://your-app.railway.app';
```

### 3.2 Update Bot Integration

Edit `bot-integration/visualizer-integration.js`:

```javascript
const WEBSOCKET_URL = 'wss://your-app.railway.app';
```

### 3.3 Push Changes

```bash
git add .
git commit -m "🔗 Update WebSocket URLs"
git push
```

✅ **Step 3 Complete!**

---

## 🎮 STEP 4: Discord Embedded App

### 4.1 Developer Portal

1. Visit https://discord.com/developers/applications
2. Select your bot
3. Go to "Embedded App SDK"
4. Enable SDK

### 4.2 Add URL Mapping

1. Click "Add URL Mapping"
2. Path: `/visualizer`
3. URL: `https://YOUR-USERNAME.github.io/music-visualizer/`
4. Save

✅ **Step 4 Complete!**

---

## 🤖 STEP 5: Integrate with Bot

### 5.1 Install Dependencies

```bash
npm install ws prism-media
```

### 5.2 Add Code

Copy `visualizer-integration.js` to your bot project.

### 5.3 Use in Bot

```javascript
const visualizer = require('./visualizer-integration');

// When playing music:
visualizer.startVisualizer(connection);

// When stopped:
visualizer.stopVisualizer();
```

### 5.4 Restart Bot

```bash
npm start
```

✅ **Complete!**

---

## ✅ TESTING

1. Start bot and join voice channel
2. Play music
3. Check Railway logs for "Bot connected"
4. Open visualizer in Discord Activity
5. See bars moving to music!

---

## 🐛 TROUBLESHOOTING

**"Disconnected" message:**
- Check Railway logs
- Verify WebSocket URLs
- Ensure bot is sending data

**No bars moving:**
- Check browser console (F12)
- Verify bot FFT integration
- Test WebSocket connection

**Activity won't open:**
- Check Discord Dev Portal settings
- Verify GitHub Pages URL
- Try different Discord client

---

## 💎 YOU'RE DONE!

Enjoy your real-time music visualizer! 🎵✨

**Total cost: $0/month (all FREE!)** 🎉
