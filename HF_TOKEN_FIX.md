# 🔴 CRITICAL: Fix Hugging Face Token for Pinecone Search

## The Problem

Your current `HF_TOKEN` doesn't have "Inference API" permissions, causing Pinecone semantic search to fail:

```
❌ Hugging Face embedding error: This authentication method does not have sufficient permissions
❌ Pinecone search error: Failed to perform inference
⚠️ Pinecone returned no match - falling back to keyword-based selection
```

**Impact:**
- User says "pharmacy label reading" → Gets random scenario instead of relevant L4 Label Reading scenario
- Pinecone semantic search (the smart AI matching) doesn't work
- System falls back to keyword matching (improved, but not as good as Pinecone)

---

## ✅ The Fix (5 Minutes)

### Step 1: Create New Hugging Face Token

1. Go to **https://huggingface.co/settings/tokens**
2. Click **"Create new token"**
3. Name it: `mia-pinecone-inference`
4. **IMPORTANT:** Check the box that says:
   - ✅ **"Make calls to the serverless Inference API"**
5. Click **"Create token"**
6. **Copy the token** (it will start with `hf_...`)

### Step 2: Update Railway Environment Variable

**Option A: Using Railway CLI (Fastest)**
```bash
railway variables --set "HF_TOKEN=hf_YOUR_NEW_TOKEN_HERE"
```

**Option B: Using Railway Dashboard**
1. Go to https://railway.com/project/beb4750a-f840-4e29-bab1-f9008d7e3546
2. Click "Variables" tab
3. Find `HF_TOKEN`
4. Click "Edit"
5. Paste your new token
6. Click "Save"

### Step 3: Redeploy

Railway will automatically redeploy when you change variables, OR you can trigger it manually:

```bash
railway up --detach
```

---

## 🧪 How to Verify It's Working

After redeployment, check the Railway logs:

### ✅ SUCCESS (What You Should See):
```
✅ Pinecone Context-Based Service initialized
   Index: mia-scenarios-knowledge-base
   Namespaces: 5 (aligned with CONTEXT_BASED/ADULT/URGENCY modes)
```

When a user chats:
```
🔍 Attempting Pinecone semantic search...
✅ Pinecone found scenario: L4-1 - "Medicine Bottle Detective"
🎭 Starting scenario L4-1: "Medicine Bottle Detective"
```

### ❌ STILL BROKEN (What You Don't Want):
```
❌ Hugging Face embedding error: This authentication method does not have sufficient permissions
⚠️ Pinecone returned no match - falling back to keyword-based selection
```

---

## 📊 Before vs After

### BEFORE (Current - Broken Pinecone):
```
User: "pharmacy"
User: "label reading"
→ System: Falls back to keyword matching
→ Detects keywords: ['pharmacy', 'label', 'reading']
→ Matches to: LESSON 4 Label Reading ✓ (but not semantic matching)
```

### AFTER (With Fixed HF_TOKEN):
```
User: "pharmacy"
User: "label reading"
→ System: Pinecone semantic search active
→ Embeds: "pharmacy label reading" into vector
→ Searches: context-based-content namespace
→ Finds: L4-1 "Medicine Bottle Detective" with 0.92 relevance score ✓
→ Perfect match with semantic understanding!
```

---

## 🎯 Why This Matters

**Keyword matching** (current fallback):
- ✅ Works okay for obvious keywords
- ❌ Doesn't understand context
- ❌ Doesn't understand synonyms
- ❌ Can't handle nuanced conversations

**Pinecone semantic search** (when HF_TOKEN works):
- ✅ Understands meaning, not just words
- ✅ Handles synonyms ("medicine" = "pills" = "medication")
- ✅ Contextual understanding
- ✅ Relevance scoring (picks BEST match, not just any match)

---

## 🔧 Current Status

**Code Fixes Applied:** ✅
- Acknowledgment steps added
- Gate check improved (turn 6 instead of turn 3)
- Keyword-based fallback added (better than random!)

**Still Needed:** ⚠️
- HF_TOKEN with Inference API permission
- Railway redeploy

**Once HF_TOKEN is Fixed:**
- Pinecone semantic search will work perfectly
- User conversations will get the MOST relevant scenarios
- System will use both semantic matching AND keyword fallback

---

## 🚀 Quick Commands

```bash
# 1. Update HF_TOKEN
railway variables --set "HF_TOKEN=hf_YOUR_NEW_TOKEN_HERE"

# 2. Verify it was set
railway variables | grep HF_TOKEN

# 3. Redeploy
railway up --detach

# 4. Check logs
railway logs --tail 50

# 5. Look for this SUCCESS message:
# "✅ Pinecone Context-Based Service initialized"
```

---

**Next Step:** Create your new HF token with Inference API permissions! 🎯
