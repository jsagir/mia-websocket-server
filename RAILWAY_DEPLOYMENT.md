# Railway Deployment Guide - Mia WebSocket Server

## 🚀 Deployment Status: LIVE

**Production URL:** https://mia-websocket-server-production.up.railway.app

**Last Deployment:** 2025-10-19 16:53:19 UTC

---

## ✅ Deployment Successful

### System Status
```
✅ Server running on port 8080
✅ Mia Assistant created: asst_WnDQrR4LgDb8uI7cyNKl3eZT
✅ Pinecone Context-Based Service initialized
   - Index: mia-scenarios-knowledge-base
   - Namespaces: 5 (CONTEXT_BASED/ADULT/URGENCY modes)
✅ OpenAI Integration working
✅ WebSocket server active
✅ Hugging Face embeddings ready (multilingual-e5-large)
✅ DialogueManager initialized with 24 scenarios
```

---

## 🔧 Railway Configuration

### Environment Variables (Configured in Railway)

| Variable | Status | Description |
|----------|--------|-------------|
| `OPENAI_API_KEY` | ✅ Set | OpenAI GPT-4o access |
| `PINECONE_API_KEY` | ✅ Set | Pinecone vector database |
| `PINECONE_INDEX_NAME` | ✅ Set | `mia-scenarios-knowledge-base` |
| `HF_TOKEN` | ✅ Set | Hugging Face embeddings |
| `ALLOWED_ORIGINS` | ✅ Set | `*` (all origins) |
| `JWT_SECRET` | ✅ Set | Session authentication |
| `LOG_LEVEL` | ✅ Set | `info` |
| `NODE_ENV` | ✅ Set | `production` |
| `PORT` | Auto | Railway assigns (8080) |

---

## 📝 How to Redeploy

### Option 1: Git Push (Automatic)
```bash
# Make your changes
git add .
git commit -m "Your changes"
git push

# Railway auto-deploys on push to main branch
```

### Option 2: Manual Redeploy
```bash
# From project directory
railway up --detach

# Check deployment status
railway status

# View logs
railway logs --tail 50
```

### Option 3: Railway Dashboard
1. Go to https://railway.com/project/beb4750a-f840-4e29-bab1-f9008d7e3546
2. Click "Deployments"
3. Click "Redeploy" button

---

## 🧪 Testing the Deployment

### Test Files Available

#### 1. **Railway Production Test** (Recommended)
**File:** `test-mia-railway.html`
**Connection:** https://mia-websocket-server-production.up.railway.app
**How to use:**
```bash
# Open in browser (no server needed, connects to Railway)
open test-mia-railway.html
```

Features:
- ✅ Connects directly to Railway production server
- ✅ Real-time context detection monitoring
- ✅ Safety tier visualization
- ✅ Dialogue state tracking
- ✅ Quick test scenarios
- ✅ Environment badge shows "RAILWAY PRODUCTION"

#### 2. **Local Development Test**
**File:** `test-mia-interface.html`
**Connection:** http://localhost:3000
**How to use:**
```bash
# Start local server first
npm run build && npm start

# Then open in browser
open test-mia-interface.html
```

---

## 📊 Monitoring & Logs

### View Live Logs
```bash
# Real-time logs (last 50 lines)
railway logs --tail 50

# Follow logs live
railway logs --follow

# Filter by service
railway logs --service mia-websocket-server
```

### Check Deployment Status
```bash
railway status
```

### View Metrics
```bash
# Open Railway dashboard
railway open
```

---

## 🎯 Context-Based Routing Architecture

### Active System: v2.0

**5 Pinecone Namespaces:**
1. `mia-identity` - Core personality (universal)
2. `context-based-content` - Ages 5-17, all 4 teaching approaches
3. `adult-content` - Ages 18+ educational/fundraising
4. `crisis-intervention` - Universal safety protocols
5. `therapeutic-techniques` - Universal coping tools

**3 Conversation Modes:**
- `CONTEXT_BASED` (ages 5-17) - Scenarios selected by emotional state + keywords
- `ADULT` (ages 18+) - Educational/fundraising content
- `URGENCY` (all ages) - Crisis intervention

**4 Teaching Approaches:**
1. Mirror Learning - Reflect & validate emotions
2. Curious Peer - Explore together, ask questions
3. Sharing Experience - Normalize through stories
4. Direct Teaching - Explain & provide tools

---

## 🔍 API Endpoints

### Health Check
```bash
curl https://mia-websocket-server-production.up.railway.app/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T16:53:19.000Z",
  "uptime": 123.45
}
```

### WebSocket Connection
```javascript
const socket = io('https://mia-websocket-server-production.up.railway.app', {
  transports: ['websocket', 'polling'],
  reconnection: true
});
```

---

## 🚨 Troubleshooting

### Server Not Responding
```bash
# Check if deployment is running
railway status

# View recent logs
railway logs --tail 100

# Trigger redeploy
railway up --detach
```

### Environment Variables Not Loading
```bash
# List all variables
railway variables

# Set a variable
railway variables --set "KEY=VALUE"

# Redeploy after changing variables
railway up --detach
```

### Connection Issues
```bash
# Check domain configuration
railway domain

# Verify CORS settings
railway variables | grep ALLOWED_ORIGINS
```

---

## 📦 Build Configuration

### Railway Build Settings

**Build Command:**
```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

**Start Command:**
```json
{
  "scripts": {
    "start": "node dist/server.js"
  }
}
```

**Detected Framework:** Node.js (Express + TypeScript)

---

## 🔐 Security

### Current Configuration
- ✅ HTTPS enforced (Railway provides SSL)
- ✅ Environment variables encrypted
- ✅ API keys secured in Railway secrets
- ✅ CORS configured (`ALLOWED_ORIGINS=*`)
- ✅ JWT session authentication active

### Production Checklist
- [x] OpenAI API key configured
- [x] Pinecone credentials set
- [x] Hugging Face token active
- [x] CORS properly configured
- [x] Logging level appropriate (info)
- [x] SSL/HTTPS enabled

---

## 📚 Quick Reference

### Common Commands

```bash
# Redeploy
railway up --detach

# View logs
railway logs --tail 50

# Check status
railway status

# Open dashboard
railway open

# List variables
railway variables

# Run migrations (if needed)
railway run npm run migrate:pinecone

# Local testing
npm run build && npm start
```

### Important URLs

- **Production Server:** https://mia-websocket-server-production.up.railway.app
- **Health Check:** https://mia-websocket-server-production.up.railway.app/health
- **Railway Dashboard:** https://railway.com/project/beb4750a-f840-4e29-bab1-f9008d7e3546
- **GitHub Repository:** https://github.com/jsagir/mia-websocket-server

---

## 🎉 Success Indicators

When deployment is successful, you should see:
```
✅ Server running on port 8080
✅ Mia Assistant created
✅ Pinecone Context-Based Service initialized
✅ WebSocket server running
✅ All environment variables loaded
```

**Current Status:** All indicators GREEN ✅

---

## 📞 Next Steps

1. **Test the Interface:**
   - Open `test-mia-railway.html` in your browser
   - Should connect to Railway production automatically

2. **Monitor Performance:**
   ```bash
   railway logs --follow
   ```

3. **Populate Pinecone:**
   - Run migration scripts if needed
   - Add context-based scenarios

4. **Production Testing:**
   - Test all 3 modes (CONTEXT_BASED, ADULT, URGENCY)
   - Verify safety tiers work correctly
   - Test all 4 teaching approaches

---

**Last Updated:** 2025-10-19
**Deployment:** Production ✅
**Status:** Active and Healthy
