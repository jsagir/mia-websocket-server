# In-Context Identity + Externalized Knowledge Architecture

## 🎯 Core Principle

**"Keep Mia's mind (who she is) always in-context, keep her world (what she's lived through) in Pinecone."**

---

## 🏗️ Architecture Design

### Current System Issues
1. ❌ Pinecone broken (HF_TOKEN permission issue)
2. ❌ Using OpenAI Assistants API (complex, expensive)
3. ❌ No clear separation between identity and knowledge
4. ❌ No reflection/emotional state tracking

### New Architecture
```
┌─────────────────────────────────────────────────────┐
│                 USER MESSAGE                        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  EMBED MESSAGE (OpenAI text-embedding-3-small)      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  QUERY PINECONE → Retrieve Top 3 Scenarios          │
│  (Semantic similarity search)                        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  ASSEMBLE PROMPT:                                    │
│  ├─ Always-In-Context Identity (2-3K tokens)        │
│  ├─ Reflection Buffer (emotional state)             │
│  ├─ Retrieved Scenarios (2-8K tokens)               │
│  └─ Conversation History (last 5 turns)             │
└──────────────────────┬──────────────────────────────┘
                       │
                ┌──────┴──────┐
                │  ROUTE?     │
                └──────┬──────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼────────┐
│   GPT-4o       │          │   GPT-4o         │
│  (Empathy)     │          │  (Safety/Logic)  │
│  80% traffic   │          │   20% traffic    │
└───────┬────────┘          └─────────┬────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  UPDATE REFLECTION BUFFER                           │
│  - Extract emotional_state from response            │
│  - Extract topic/lesson from response               │
│  - Store for next turn                              │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### Step 1: Fix Pinecone with OpenAI Embeddings ✅

**Problem**: HF_TOKEN lacks Inference API permission
**Solution**: Use OpenAI's embedding API instead

**New Service**: `src/services/embedding.service.ts`
```typescript
import OpenAI from 'openai';

export class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  }
}
```

**Cost**: $0.02 per 1M tokens (very cheap!)

---

### Step 2: Create Always-In-Context Identity Prompt

**File**: `src/prompts/mia-core-identity.ts`

```typescript
export const MIA_CORE_IDENTITY = `
You are Mia Elena Kruse — a 10-year-old girl. Not an AI. This is who you ARE.

═══════════════════════════════════════════════════════
CORE IDENTITY [NEVER CHANGES]
═══════════════════════════════════════════════════════

🧍‍♀️ WHO YOU ARE:
- Age: 10 years old
- Family: Grandma Maria (night nurse), Eli (7, asthma), Jaxson (12, distant)
- Mom: Carmen left 18 months ago (you don't talk about it)
- Home: Small apartment, Maplewood Estates
- School: Sherwood Middle School, 5th grade, B+ average
- Dream: Want to be an artist (Mrs. Álvarez says you're talented)
- Comfort object: Azure (blue teddy bear, smells like mom's jasmine perfume - fading)

🗣️ HOW YOU SPEAK:
- DEFAULT: 2 sentences maximum
- Simple words: "Scary." "I don't get it." "Wait, really?"
- Uncertainty: "I dunno," "maybe," "kinda," "I think?"
- Interruptions: "Oh, Eli's calling..." "Wait, what was I saying?"
- NO therapy speak, NO adult wisdom, NO lectures

Example:
✅ "That's really scary. Did you tell someone?"
❌ "It's important to communicate your feelings to a trusted adult."

❤️ BEHAVIORAL FRAMEWORK:

1. MIRROR LEARNING (Core Teaching Method):
   - You learn WITH them, not from above
   - Ask THEM for help with YOUR problems
   - React to THEIR advice
   - Thank them for teaching YOU

2. EMPATHY SCAFFOLDING:
   - Always validate feelings first
   - Share YOUR similar experience
   - Wonder together about solutions
   - Never minimize their emotions

3. SAFETY PROTOCOLS:
   - Tier 3 triggers: suicide, self-harm, abuse, overdose, "can't breathe"
   - Response: "That sounds really, really scary. Are you okay right now?"
   - Provide: 988 Suicide Lifeline, Text HELLO to 741741, 911
   - NEVER promise confidentiality with danger

⚖️ CRITICAL RULES:
✅ ALWAYS: Stay in character, validate emotions, use 2 sentences max, put safety first
❌ NEVER: Break character, mention AI, give medical advice, promise confidentiality, lecture
`;

export const REFLECTION_BUFFER_TEMPLATE = `
🧩 SHORT-TERM MEMORY (This Session):
- Emotional State: {emotional_state}
- Current Topic: {current_topic}
- Last Lesson Applied: {last_lesson}
- Conversation Turn: {turn_number}
`;
```

---

### Step 3: Upload Scenarios to Pinecone

**Script**: `src/scripts/upload-scenarios-to-pinecone.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { EmbeddingService } from '../services/embedding.service';
import { SCENARIO_BANK } from '../services/dialogue.service';

async function uploadScenarios() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index(process.env.PINECONE_INDEX_NAME!);
  const embedder = new EmbeddingService();

  console.log(`📤 Uploading ${SCENARIO_BANK.length} scenarios to Pinecone...`);

  for (const scenario of SCENARIO_BANK) {
    // Create rich text representation
    const fullText = `
Title: ${scenario.title}
Category: Lesson ${scenario.lesson}
Context: ${scenario.context}
Dilemma: ${scenario.dilemma}
Questions: ${scenario.questions.join(', ')}
Learning Objective: ${scenario.learningObjective}
    `.trim();

    // Create searchable summary
    const searchText = `${scenario.title} ${scenario.context} ${scenario.dilemma} ${scenario.learningObjective}`;

    // Generate embedding
    const embedding = await embedder.embed(searchText);

    // Upsert to Pinecone
    await index.namespace('mia-scenarios').upsert([{
      id: scenario.id,
      values: embedding,
      metadata: {
        lesson: scenario.lesson,
        title: scenario.title,
        context: scenario.context,
        dilemma: scenario.dilemma,
        questions: scenario.questions.join(' | '),
        learningObjective: scenario.learningObjective,
        ageRange: `${scenario.ageRange[0]}-${scenario.ageRange[1]}`,
        fullText: fullText
      }
    }]);

    console.log(`  ✅ ${scenario.id}: ${scenario.title}`);
  }

  console.log(`\n🎉 Successfully uploaded ${SCENARIO_BANK.length} scenarios!`);
}

uploadScenarios().catch(console.error);
```

**Run**: `npx ts-node src/scripts/upload-scenarios-to-pinecone.ts`

---

### Step 4: Implement Semantic Retrieval Service

**File**: `src/services/scenario-retrieval.service.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { EmbeddingService } from './embedding.service';
import { logger } from '../utils/logger';

export interface RetrievedScenario {
  id: string;
  title: string;
  fullText: string;
  score: number;
}

export class ScenarioRetrievalService {
  private pinecone: Pinecone;
  private index: any;
  private embedder: EmbeddingService;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    this.index = this.pinecone.index(process.env.PINECONE_INDEX_NAME!);
    this.embedder = new EmbeddingService();
  }

  async retrieveScenarios(
    userMessage: string,
    topK: number = 3
  ): Promise<RetrievedScenario[]> {
    try {
      // Generate embedding for user message
      const embedding = await this.embedder.embed(userMessage);

      // Query Pinecone
      const results = await this.index.namespace('mia-scenarios').query({
        vector: embedding,
        topK,
        includeMetadata: true
      });

      // Format results
      const scenarios = results.matches.map((match: any) => ({
        id: match.id,
        title: match.metadata.title,
        fullText: match.metadata.fullText,
        score: match.score
      }));

      logger.info(`🔍 Retrieved ${scenarios.length} scenarios for: "${userMessage.substring(0, 50)}..."`);
      scenarios.forEach(s => logger.info(`  - ${s.id}: ${s.title} (score: ${s.score.toFixed(3)})`));

      return scenarios;

    } catch (error) {
      logger.error('❌ Pinecone retrieval error:', error);
      return [];
    }
  }

  formatScenariosForPrompt(scenarios: RetrievedScenario[]): string {
    if (scenarios.length === 0) {
      return "No specific scenarios retrieved.";
    }

    return scenarios.map((s, i) => `
═══════════════════════════════════════════════════════
SCENARIO MEMORY ${i + 1}: ${s.title}
═══════════════════════════════════════════════════════
${s.fullText}
    `).join('\n');
  }
}
```

---

### Step 5: Add Reflection Buffer to Dialogue State

**Update**: `src/services/dialogue.service.ts`

```typescript
export interface DialogueState {
  sessionId: string;
  currentMode: 'GREETING' | 'CONTEXT_BASED' | 'ADULT';
  teachingStep: number;
  currentScenario: Scenario | null;
  scenariosCompleted: string[];
  conversationTurn: number;
  lastIntent: string;
  hasAskedName: boolean;
  hasAskedAge: boolean;
  hasAskedAboutVOL: boolean;
  userName: string | null;
  userAge: number | null;

  // 🆕 REFLECTION BUFFER
  reflectionBuffer: {
    emotionalState: 'curious' | 'anxious' | 'calm' | 'scared' | 'excited' | 'confused';
    currentTopic: string;
    lastLessonApplied: string | null;
  };
}
```

**Update Reflection After Each Turn**:
```typescript
private updateReflectionBuffer(
  state: DialogueState,
  userMessage: string,
  miaResponse: string
): void {
  // Extract emotional state from Mia's response
  const emotionalKeywords = {
    scared: /scared|afraid|terrified|nervous/i,
    anxious: /worried|anxious|stressed|uncertain/i,
    calm: /okay|fine|good|peaceful/i,
    excited: /excited|happy|awesome|cool/i,
    confused: /confused|don't get it|don't understand/i,
    curious: /wonder|curious|interesting|hmm/i
  };

  for (const [emotion, regex] of Object.entries(emotionalKeywords)) {
    if (regex.test(miaResponse)) {
      state.reflectionBuffer.emotionalState = emotion as any;
      break;
    }
  }

  // Extract topic from recent conversation
  const topicKeywords = {
    'medicine': /medicine|pill|medication|prescription/i,
    'peer_pressure': /friend|pressure|everyone|party/i,
    'safety': /danger|unsafe|scary|911/i,
    'label_reading': /label|bottle|warning|dosage/i,
    'help': /help|tell|adult|grandma/i
  };

  for (const [topic, regex] of Object.entries(topicKeywords)) {
    if (regex.test(userMessage) || regex.test(miaResponse)) {
      state.reflectionBuffer.currentTopic = topic;
      break;
    }
  }

  // Track which lesson was applied (if scenario active)
  if (state.currentScenario) {
    state.reflectionBuffer.lastLessonApplied = `L${state.currentScenario.lesson}`;
  }

  logger.info(`🧩 Reflection updated: ${JSON.stringify(state.reflectionBuffer)}`);
}
```

---

### Step 6: Implement Prompt Assembly

**File**: `src/services/prompt-assembler.service.ts`

```typescript
import { MIA_CORE_IDENTITY, REFLECTION_BUFFER_TEMPLATE } from '../prompts/mia-core-identity';
import { DialogueState } from './dialogue.service';
import { RetrievedScenario } from './scenario-retrieval.service';

export class PromptAssemblerService {

  assembleSystemPrompt(
    state: DialogueState,
    retrievedScenarios: RetrievedScenario[]
  ): string {

    // 1. Always-in-context identity (2-3K tokens)
    let prompt = MIA_CORE_IDENTITY;

    // 2. Reflection buffer (emotional state)
    const reflection = REFLECTION_BUFFER_TEMPLATE
      .replace('{emotional_state}', state.reflectionBuffer.emotionalState)
      .replace('{current_topic}', state.reflectionBuffer.currentTopic)
      .replace('{last_lesson}', state.reflectionBuffer.lastLessonApplied || 'None yet')
      .replace('{turn_number}', state.conversationTurn.toString());

    prompt += '\n\n' + reflection;

    // 3. Retrieved scenarios from Pinecone (2-8K tokens)
    if (retrievedScenarios.length > 0) {
      prompt += '\n\n' + this.formatScenarios(retrievedScenarios);
    }

    return prompt;
  }

  private formatScenarios(scenarios: RetrievedScenario[]): string {
    const header = `
═══════════════════════════════════════════════════════
SCENARIO MEMORY (Your Life Experiences)
═══════════════════════════════════════════════════════
These are things that have happened to you recently.
Refer to them naturally, as if they're your real memories.
NEVER say "scenario" to the user.
`;

    const scenarioText = scenarios.map((s, i) => `
--- Memory ${i + 1}: ${s.title} ---
${s.fullText}
    `).join('\n');

    return header + scenarioText;
  }
}
```

---

### Step 7: Implement Model Routing

**File**: `src/services/model-router.service.ts`

```typescript
import { logger } from '../utils/logger';

export type ModelChoice = 'gpt-4o-empathy' | 'gpt-4o-safety';

export class ModelRouterService {

  route(userMessage: string, conversationContext: any): ModelChoice {

    // PRIORITY 1: Safety emergencies → Safety model
    const safetyTriggers = [
      /suicide|kill myself|want to die|end my life/i,
      /overdose|can't breathe|turning blue|dying/i,
      /abuse|hitting me|hurting me|touching me/i,
      /self.?harm|cut myself|hurt myself/i
    ];

    if (safetyTriggers.some(regex => regex.test(userMessage))) {
      logger.warn('🚨 SAFETY TRIGGER DETECTED → Routing to GPT-4o Safety Mode');
      return 'gpt-4o-safety';
    }

    // PRIORITY 2: Complex reasoning / ADULT mode
    if (conversationContext.mode === 'ADULT') {
      logger.info('💼 ADULT mode → Routing to GPT-4o Safety Mode (reasoning)');
      return 'gpt-4o-safety';
    }

    // PRIORITY 3: Technical questions
    if (/harvey friedman|math|logic|theorem|proof/i.test(userMessage)) {
      logger.info('🧮 Technical question → Routing to GPT-4o Safety Mode');
      return 'gpt-4o-safety';
    }

    // DEFAULT: Empathy model for normal conversation
    logger.info('💬 Normal conversation → Routing to GPT-4o Empathy Mode');
    return 'gpt-4o-empathy';
  }
}
```

---

### Step 8: Update Mia Service

**File**: `src/services/mia.service.ts`

```typescript
import OpenAI from 'openai';
import { ScenarioRetrievalService } from './scenario-retrieval.service';
import { PromptAssemblerService } from './prompt-assembler.service';
import { ModelRouterService } from './model-router.service';
import { DialogueState } from './dialogue.service';

export class MiaService {
  private openai: OpenAI;
  private scenarioRetriever: ScenarioRetrievalService;
  private promptAssembler: PromptAssemblerService;
  private modelRouter: ModelRouterService;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.scenarioRetriever = new ScenarioRetrievalService();
    this.promptAssembler = new PromptAssemblerService();
    this.modelRouter = new ModelRouterService();
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
    state: DialogueState,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {

    // 1. Retrieve relevant scenarios from Pinecone
    const scenarios = await this.scenarioRetriever.retrieveScenarios(userMessage, 3);

    // 2. Assemble system prompt (identity + reflection + scenarios)
    const systemPrompt = this.promptAssembler.assembleSystemPrompt(state, scenarios);

    // 3. Route to appropriate model
    const modelChoice = this.modelRouter.route(userMessage, { mode: state.currentMode });

    // 4. Generate response
    const response = await this.generateResponse(
      systemPrompt,
      conversationHistory,
      userMessage,
      modelChoice
    );

    return response;
  }

  private async generateResponse(
    systemPrompt: string,
    conversationHistory: any[],
    userMessage: string,
    modelChoice: 'gpt-4o-empathy' | 'gpt-4o-safety'
  ): Promise<string> {

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add last 5 turns of conversation history
    const recentHistory = conversationHistory.slice(-5);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Call OpenAI
    const temperature = modelChoice === 'gpt-4o-empathy' ? 0.8 : 0.6;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature,
      max_tokens: 500
    });

    return completion.choices[0].message.content || '';
  }
}
```

---

## 📊 Token Usage Breakdown

| Component | Tokens | Purpose |
|-----------|--------|---------|
| Core Identity | 2,000 | Who Mia is (always included) |
| Reflection Buffer | 200 | Emotional state (session memory) |
| Retrieved Scenarios (3x) | 6,000 | Relevant life experiences |
| Conversation History (5 turns) | 1,500 | Recent dialogue context |
| **TOTAL INPUT** | **~9,700** | Per message |
| **OUTPUT** | **~150** | Mia's response |

**Cost per message**: ~$0.03 (much cheaper than Assistants API!)

---

## ✅ Benefits of This Architecture

| Aspect | Before | After |
|--------|--------|-------|
| **Identity Consistency** | ⚠️ Mixed with scenarios | ✅ Always in-context |
| **Knowledge Retrieval** | ❌ Broken (HF_TOKEN) | ✅ OpenAI embeddings |
| **Cost per conversation** | $0.18 (Assistants API) | $0.12 (Chat API) |
| **Scalability** | ❌ Limited by context | ✅ Infinite scenarios |
| **Emotional Memory** | ❌ None | ✅ Reflection buffer |
| **Model Flexibility** | ❌ Single model | ✅ Route by context |

---

## 🚀 Deployment Checklist

- [ ] Install dependencies: `npm install`
- [ ] Upload scenarios to Pinecone: `npx ts-node src/scripts/upload-scenarios-to-pinecone.ts`
- [ ] Test retrieval: `npm run test:retrieval`
- [ ] Test full conversation: `npm run test:conversation`
- [ ] Deploy to Railway
- [ ] Monitor logs for retrieval quality
- [ ] Track cost savings

---

## 🎯 Expected Results

**Before** (Broken Pinecone + Assistants API):
```
User: "pharmacy label reading"
→ Random scenario (L1-2 Asthma) ❌
→ Cost: $0.018 per message
→ No emotional memory
```

**After** (OpenAI Embeddings + Chat API):
```
User: "pharmacy label reading"
→ Pinecone retrieves: L4-1 Medicine Bottle Detective ✅
→ Cost: $0.012 per message
→ Reflection: emotional_state="curious", topic="label_reading"
→ Next turn remembers emotional context
```

---

**Ready to implement?**
