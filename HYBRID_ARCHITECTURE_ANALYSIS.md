# Hybrid Mia System: Claude + GPT Architecture Analysis

## 🎯 Executive Summary

**Proposed**: Hybrid system using Claude 3.5 Sonnet (empathy/dialogue) + GPT-5 (reasoning/safety)
**Current**: GPT-4o with OpenAI Assistants API + Pinecone (broken)
**Recommendation**: **Incremental Hybrid in TypeScript** (keep existing infrastructure, add Claude as alternative)

---

## 📊 Current System Analysis

### What You Have Now (Working)

```
┌─────────────────────────┐
│   WebSocket Frontend    │
│  (test-mia-interface)   │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│  Node.js/TypeScript     │
│  - server.ts            │
│  - dialogue.service.ts  │
│  - mia.service.ts       │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼────────┐
│ GPT-4o │   │  Pinecone  │
│OpenAI  │   │  (broken)  │
│Assist. │   │ HF_TOKEN   │
└────────┘   └────────────┘
```

**Strengths:**
- ✅ Real-time WebSocket communication
- ✅ Dialogue management with state tracking
- ✅ Scenario bank (24 TypeScript scenarios)
- ✅ Safety tier detection
- ✅ GPT-4o with vector store (875 KB knowledge)
- ✅ Deployed on Railway (production ready)

**Weaknesses:**
- ❌ Pinecone broken (HF_TOKEN permission issue)
- ❌ Single model (no routing optimization)
- ❌ No fallback if GPT-4o has issues

---

## 🧠 Proposed Hybrid System

### Architecture Option A: Python Microservice (Proposal) ⚠️

**New Architecture:**
```
Frontend → Node.js WebSocket → Python Orchestrator → Claude/GPT-5 → Pinecone
```

**Pros:**
- ✅ Clean separation of concerns
- ✅ Python ecosystem for ML/AI
- ✅ Easy Pinecone integration

**Cons:**
- ❌ Complete rewrite of backend
- ❌ Adds latency (Node → Python → LLM)
- ❌ More complex deployment (2 services)
- ❌ Doubles infrastructure costs
- ❌ Loses existing dialogue management logic

**Verdict**: ❌ **Not Recommended** - Too disruptive, adds complexity without clear benefit

---

### Architecture Option B: TypeScript Hybrid (Recommended) ⭐

**Enhanced Architecture:**
```
┌─────────────────────────┐
│   WebSocket Frontend    │
└──────────┬──────────────┘
           │
┌──────────▼──────────────────────┐
│  Node.js/TypeScript             │
│  + NEW: Model Router            │
│    ├─ dialogue.service.ts       │
│    ├─ mia.service.ts            │
│    └─ NEW: claude.service.ts    │
└──────────┬─────────────────────┘
           │
    ┌──────┴──────────┐
    │                 │
┌───▼────────┐   ┌───▼──────────┐
│  Claude    │   │   GPT-4o     │
│ 3.5 Sonnet │   │ (existing)   │
│ (NEW)      │   │              │
└────────────┘   └──────────────┘
           │
    ┌──────▼──────────┐
    │  JSON Scenarios │
    │ (in context)    │
    └─────────────────┘
```

**Pros:**
- ✅ Keeps existing infrastructure
- ✅ Adds Claude without breaking GPT-4o
- ✅ TypeScript throughout (consistent)
- ✅ Minimal code changes
- ✅ Can route based on context
- ✅ No Python dependency
- ✅ Same deployment (Railway)

**Cons:**
- ⚠️ Need Anthropic API key
- ⚠️ Slightly higher costs (dual model)
- ⚠️ Routing logic complexity

**Verdict**: ✅ **RECOMMENDED** - Best balance of improvement vs disruption

---

## 🔍 Model Comparison: Claude vs GPT-4o

| Feature | Claude 3.5 Sonnet | GPT-4o | Winner |
|---------|-------------------|--------|--------|
| **Character Consistency** | ⭐⭐⭐⭐⭐ Excellent at maintaining persona | ⭐⭐⭐⭐ Very good | Claude |
| **Empathy & Tone** | ⭐⭐⭐⭐⭐ Natural, warm, human | ⭐⭐⭐⭐ Professional | Claude |
| **Reasoning & Logic** | ⭐⭐⭐⭐ Strong | ⭐⭐⭐⭐⭐ Excellent | GPT |
| **Safety Detection** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | GPT |
| **Following Instructions** | ⭐⭐⭐⭐⭐ Precise | ⭐⭐⭐⭐ Sometimes creative | Claude |
| **Context Window** | 200K tokens | 128K tokens | Claude |
| **Cost (per 1M tokens)** | $3 / $15 | $2.50 / $10 | GPT |
| **Latency** | ~1-2s | ~1-2s | Tie |

**Optimal Routing Strategy:**

```typescript
// Use Claude for:
- Normal conversation (empathy, character consistency)
- Scenario delivery (storytelling, emotional authenticity)
- Mirror Learning dialogue (peer-to-peer feel)
- Casual chat, rapport building

// Use GPT-4o for:
- Safety tier 3 emergencies (crisis detection)
- Complex reasoning (ethical dilemmas)
- ADULT mode (fundraising, educational explanations)
- Harvey Friedman technical questions
```

---

## 💰 Cost Analysis

### Current System (GPT-4o only)
```
Avg conversation: 20 messages
Avg tokens per message:
  - Input: 3,000 (system prompt + history)
  - Output: 150 (Mia's response)

Cost per conversation:
= 20 * (3000 * $2.50/1M + 150 * $10/1M)
= 20 * ($0.0075 + $0.0015)
= 20 * $0.009
= $0.18 per conversation
```

### Hybrid System (Claude 80% / GPT-4o 20%)
```
Claude messages (16): 16 * (3000 * $3/1M + 150 * $15/1M) = $0.17
GPT messages (4): 4 * (3000 * $2.50/1M + 150 * $10/1M) = $0.04

Total: $0.21 per conversation
```

**Cost Increase**: +16.7% (~$0.03 per conversation)

**Break-even Analysis**:
- If Claude improves retention by 17%+ → Worth it
- If Claude reduces safety escalations → Worth it
- If Claude improves character consistency → Worth it

**Verdict**: ✅ **Marginal cost increase acceptable** for quality improvement

---

## 🏗️ Implementation Design

### Phase 1: Add Claude Service (Minimal Risk)

**New File**: `src/services/claude.service.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export class ClaudeService {
  private client: Anthropic;
  private systemPrompt: string;

  constructor(apiKey: string, systemPrompt: string) {
    this.client = new Anthropic({ apiKey });
    this.systemPrompt = systemPrompt;
  }

  async chat(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    scenarioContext?: string
  ): Promise<string> {
    try {
      // Build system prompt with scenario context
      const fullSystemPrompt = scenarioContext
        ? `${this.systemPrompt}\n\n--- Scenario Memory ---\n${scenarioContext}`
        : this.systemPrompt;

      // Convert history to Anthropic format
      const messages = conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.7,
        system: fullSystemPrompt,
        messages: messages
      });

      const text = response.content[0].text;
      logger.info(`✅ Claude response generated (${text.length} chars)`);
      return text;

    } catch (error) {
      logger.error('❌ Claude API error:', error);
      throw error;
    }
  }
}
```

---

### Phase 2: Add Model Router

**Update**: `src/services/dialogue.service.ts`

```typescript
export class DialogueService {
  // ... existing code ...

  private routeToModel(
    message: string,
    state: DialogueState,
    intent: string
  ): 'claude' | 'gpt' {

    // ALWAYS use GPT for safety emergencies
    const safetyTriggers = [
      /suicide|kill myself|want to die|end my life/i,
      /overdose|cant breathe|turning blue/i,
      /abuse|hurt me|hitting me/i
    ];

    if (safetyTriggers.some(regex => regex.test(message))) {
      logger.info('🚨 Safety trigger detected → Routing to GPT-4o');
      return 'gpt';
    }

    // Use GPT for ADULT mode (fundraising, complex explanations)
    if (state.currentMode === 'ADULT') {
      logger.info('💼 ADULT mode → Routing to GPT-4o');
      return 'gpt';
    }

    // Use GPT for Harvey Friedman questions (technical)
    if (/harvey friedman|math|logic|mit|theorem/i.test(message)) {
      logger.info('🧮 Technical question → Routing to GPT-4o');
      return 'gpt';
    }

    // Use Claude for everything else (empathy, scenarios, chat)
    logger.info('💬 Normal conversation → Routing to Claude 3.5');
    return 'claude';
  }
}
```

---

### Phase 3: Update Mia Service

**Update**: `src/services/mia.service.ts`

```typescript
import { ClaudeService } from './claude.service';

export class MiaService {
  private openaiAssistant: OpenAI.Beta.Assistant;
  private claudeService: ClaudeService;
  private useModel: 'claude' | 'gpt' = 'claude'; // Default to Claude

  constructor() {
    // Existing GPT-4o setup
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // NEW: Claude setup
    this.claudeService = new ClaudeService(
      process.env.ANTHROPIC_API_KEY!,
      this.getSystemPrompt() // Same system prompt!
    );
  }

  setModelPreference(model: 'claude' | 'gpt') {
    this.useModel = model;
    logger.info(`🔀 Model preference set to: ${model.toUpperCase()}`);
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
    conversationHistory: any[],
    scenarioContext?: string
  ): Promise<string> {

    // Route based on preference (set by dialogue.service.ts)
    if (this.useModel === 'claude') {
      return await this.sendViaClaude(userMessage, conversationHistory, scenarioContext);
    } else {
      return await this.sendViaGPT(sessionId, userMessage, conversationHistory, scenarioContext);
    }
  }

  private async sendViaGPT(
    sessionId: string,
    userMessage: string,
    conversationHistory: any[],
    scenarioContext?: string
  ): Promise<string> {
    // Existing GPT-4o logic (unchanged)
    // ...
  }

  private async sendViaClaude(
    userMessage: string,
    conversationHistory: any[],
    scenarioContext?: string
  ): Promise<string> {
    return await this.claudeService.chat(
      userMessage,
      conversationHistory,
      scenarioContext
    );
  }
}
```

---

## 🧪 Testing Strategy

### Test Case 1: Empathy (Claude Should Win)
```
User: "I'm scared about Eli. What if something happens to him?"
Expected: Warm, peer-level empathy (Claude excels here)
```

### Test Case 2: Safety Emergency (GPT Should Route)
```
User: "I want to hurt myself"
Expected: Immediate crisis response with resources (GPT routing)
```

### Test Case 3: Scenario Delivery (Claude Should Win)
```
User: "pharmacy" → "label reading"
Expected: Natural storytelling with Mia's voice (Claude excels)
```

### Test Case 4: Adult Mode (GPT Should Route)
```
User: (age 25) "Tell me about the fundraising campaign"
Expected: Professional explanation (GPT routing)
```

---

## 📋 Implementation Checklist

### Prerequisites
- [ ] Get Anthropic API key (https://console.anthropic.com/)
- [ ] Add to Railway environment variables: `ANTHROPIC_API_KEY`
- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`

### Phase 1: Claude Integration (2-3 hours)
- [ ] Create `src/services/claude.service.ts`
- [ ] Write unit tests for Claude service
- [ ] Test Claude with simple prompts locally

### Phase 2: Routing Logic (1-2 hours)
- [ ] Add `routeToModel()` to dialogue.service.ts
- [ ] Update mia.service.ts with dual-model support
- [ ] Add model preference tracking

### Phase 3: Testing (2-3 hours)
- [ ] Test empathy scenarios (Claude)
- [ ] Test safety scenarios (GPT routing)
- [ ] Test ADULT mode (GPT routing)
- [ ] Test conversation flow end-to-end

### Phase 4: Deployment (1 hour)
- [ ] Update package.json with Anthropic dependency
- [ ] Set ANTHROPIC_API_KEY in Railway
- [ ] Deploy and monitor logs
- [ ] A/B test: Claude vs GPT responses

---

## 🎯 Success Metrics

### Qualitative
- **Character Consistency**: Does Mia feel more authentic?
- **Empathy**: Are responses warmer and more natural?
- **Safety**: Are emergencies still caught correctly?

### Quantitative
- **Response Quality**: User ratings (if available)
- **Conversation Length**: Do users engage longer with Claude?
- **Safety Detection Rate**: Maintain 100% crisis detection
- **Cost per Conversation**: Track actual costs

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude API downtime | High | Fallback to GPT-4o automatically |
| Cost overruns | Medium | Monitor usage, set budget alerts |
| Routing logic errors | High | Extensive testing, gradual rollout |
| Character drift between models | Medium | Use identical system prompts |

---

## 🚀 Recommended Next Steps

### Immediate (Today)
1. **Get Anthropic API key** (5 minutes)
2. **Create claude.service.ts** (1 hour)
3. **Test Claude locally with simple prompt** (30 minutes)

### Short-term (This Week)
4. **Implement routing logic** (2 hours)
5. **Test all 4 routing scenarios** (2 hours)
6. **Deploy to Railway staging** (1 hour)

### Medium-term (Next Week)
7. **A/B test Claude vs GPT responses** (ongoing)
8. **Monitor costs and quality metrics** (ongoing)
9. **Optimize routing rules based on data** (1-2 hours)

---

## 💡 Alternative: Gradual Rollout

**Option**: Start with Claude at 20%, gradually increase

```typescript
private routeToModel(message: string): 'claude' | 'gpt' {
  const CLAUDE_PERCENTAGE = 20; // Start at 20%

  // Safety always goes to GPT
  if (isSafetyEmergency(message)) return 'gpt';

  // Random routing for A/B testing
  return Math.random() * 100 < CLAUDE_PERCENTAGE ? 'claude' : 'gpt';
}
```

**Benefits**:
- Lower risk (80% still using proven GPT)
- Collect real data on Claude performance
- Easy to adjust percentage
- Can compare quality metrics

---

## ✅ Final Recommendation

**Implement Hybrid TypeScript Architecture (Option B)**

**Why**:
1. ✅ Minimal disruption to existing system
2. ✅ Leverages strengths of both models
3. ✅ Keeps cost increase minimal (+16%)
4. ✅ Easy rollback if issues arise
5. ✅ Same infrastructure (Railway, TypeScript)

**Not Recommended**:
- ❌ Full Python rewrite (too disruptive)
- ❌ Replacing GPT entirely (lose reasoning power)
- ❌ Complex microservice architecture (overkill)

---

**Ready to implement?** I can start with Phase 1: Creating the Claude service.
