# Scenario Loading Analysis: TypeScript vs JSON

## Executive Summary

**Current System**: 24 hardcoded TypeScript scenarios in `dialogue.service.ts`
**Proposed System**: 18 JSON scenarios loaded from file
**Recommendation**: **Hybrid Approach** - Use JSON as primary source, keep TypeScript as fallback

---

## 📊 Comparison: TypeScript vs JSON

### Current TypeScript Scenarios (24 total)
```
LESSON 1: WELLNESS (4 scenarios)
├─ L1-1: Marcus's Energy Pills
├─ L1-2: Eli's Asthma Flare-up
├─ L1-3: Feeling Tired vs Sick
└─ L1-4: Grandma's Work Stories

LESSON 2: MEDICATION SAFETY (4 scenarios)
├─ L2-1: THC Gummies Look Like Candy
├─ L2-2: Eli's Inhaler Rules
├─ L2-3: Expired Medicine in Cabinet
└─ L2-4: Friend's 'Vitamins'

LESSON 3: DECISION MAKING (4 scenarios)
├─ L3-1: Party Peer Pressure
├─ L3-2: Sofia's Dilemma
├─ L3-3: Jaxson's Friends
└─ L3-4: Everyone's Doing It

LESSON 4: LABEL READING (4 scenarios)
├─ L4-1: Medicine Bottle Detective
├─ L4-2: Household Cleaners
├─ L4-3: Food Allergies vs Medicine
└─ L4-4: Natural Doesn't Mean Safe

LESSON 5: DANGER RECOGNITION (4 scenarios)
├─ L5-1: Sketchy Neighbor
├─ L5-2: Online Stranger Offering Help
├─ L5-3: Unlocked Medicine Cabinet
└─ L5-4: Party with No Adults

LESSON 6: HELP & RESPONSE (4 scenarios)
├─ L6-1: Saying No to Marcus
├─ L6-2: Telling Grandma About Danger
├─ L6-3: Helping a Friend in Trouble
└─ L6-4: Emergency Response - Eli's Attack
```

**Structure**:
```typescript
interface Scenario {
  id: string;              // e.g., "L1-1"
  lesson: number;          // 1-6
  number: number;          // 1-4
  title: string;
  context: string;         // Opening line
  dilemma: string;         // The problem
  questions: string[];     // 3 teaching questions
  learningObjective: string;
  ageRange: [number, number];
}
```

---

### Proposed JSON Scenarios (18 total)

```
making-good-choices (6 scenarios)
├─ accepting-pills-from-older-kids
├─ friend-wants-to-try-pills-they-found
├─ dealing-with-peer-pressure-to-take-pills
├─ saying-no-when-friend-offers-pills
├─ finding-unlabeled-pills-what-to-do
└─ seeing-someone-take-pills-at-school

reading-prescription-labels (4 scenarios)
├─ understanding-medicine-bottle-labels
├─ checking-if-medicine-is-expired
├─ reading-dosage-instructions-correctly
└─ identifying-warning-symbols-on-labels

medication-awareness (6 scenarios)
├─ why-some-pills-look-like-candy
├─ difference-between-medicine-and-vitamins
├─ what-happens-if-you-take-wrong-medicine
├─ why-you-shouldnt-share-prescription-medicine
├─ recognizing-safe-vs-unsafe-pills
└─ understanding-over-the-counter-vs-prescription

wellness-awareness (6 scenarios)
├─ knowing-when-to-tell-an-adult-you-feel-sick
├─ understanding-why-medicine-helps-when-sick
├─ difference-between-being-sick-and-being-injured
├─ knowing-when-to-call-for-help
├─ understanding-what-doctors-and-nurses-do
└─ importance-of-following-medicine-instructions
```

**Structure**:
```json
{
  "id": "unique-scenario-id",
  "category": "making-good-choices",
  "title": "Accepting Pills from Older Kids",
  "description": "...",
  "mia_context": {
    "scenario_setup": "...",
    "teaching_approach": "mirror_learning",
    "key_questions": [],
    "safety_notes": ""
  },
  "village_integration": { ... },
  "learning_objectives": [],
  "target_audience": { ... },
  "dialogue_branches": { ... },
  "risk_level": "medium",
  "search_keywords": []
}
```

---

## 🔍 Gap Analysis

### What JSON Has That TypeScript Doesn't ✅

1. **Richer Metadata**:
   - `risk_level` (low/medium/high/critical)
   - `search_keywords` for better matching
   - `dialogue_branches` for different user responses
   - `village_integration` with VOL station mappings

2. **More Teaching Detail**:
   - Explicit `teaching_approach` (mirror_learning, curious_peer, etc.)
   - Multiple `learning_objectives` (not just one)
   - `safety_notes` for each scenario

3. **Better Flexibility**:
   - Categories instead of rigid lesson numbers
   - More nuanced target audience (age + comprehension level)
   - Conditional content based on context

### What TypeScript Has That JSON Doesn't ⚠️

1. **More Scenarios**: 24 vs 18 (6 extra scenarios)
2. **Simpler Structure**: Easier to load and parse
3. **Direct Access**: No file I/O, always available

### Coverage Overlap

**Both Systems Cover**:
- ✅ Medication safety basics
- ✅ Label reading
- ✅ Peer pressure scenarios
- ✅ Emergency response
- ✅ Decision making

**Only in TypeScript**:
- Grandma's Work Stories (L1-4)
- Expired Medicine (L2-3)
- Jaxson's Friends (L3-3)
- Food Allergies vs Medicine (L4-3)
- Online Stranger Scam (L5-2)
- Unlocked Medicine Cabinet (L5-3)

**Only in JSON**:
- More wellness awareness scenarios
- Over-the-counter vs prescription distinction
- More granular medication awareness

---

## 🎯 Recommended Implementation: Hybrid Approach

### Option A: JSON Primary, TypeScript Fallback ⭐ RECOMMENDED

**Why This Works**:
1. JSON scenarios are richer and more flexible
2. TypeScript scenarios ensure system never fails
3. Easy to update JSON without redeploying code
4. Can extend JSON over time

**Implementation**:
```typescript
// 1. Load JSON scenarios at service initialization
class DialogueService {
  private jsonScenarios: Scenario[] = [];
  private fallbackScenarios: Scenario[] = SCENARIO_BANK; // TypeScript

  async initialize() {
    try {
      const jsonData = await fs.readFile('./scenarios/mia_ai_scenarios.json', 'utf-8');
      const parsed = JSON.parse(jsonData);
      this.jsonScenarios = this.convertJSONToScenarios(parsed.scenarios);
      logger.info(`✅ Loaded ${this.jsonScenarios.length} scenarios from JSON`);
    } catch (error) {
      logger.warn('⚠️ JSON scenarios failed to load, using TypeScript fallback');
      this.jsonScenarios = [];
    }
  }

  private getScenarioBank(): Scenario[] {
    return this.jsonScenarios.length > 0
      ? this.jsonScenarios
      : this.fallbackScenarios;
  }
}
```

**Advantages**:
- ✅ Richer metadata from JSON
- ✅ No dependency on Pinecone (fixes HF_TOKEN issue)
- ✅ Always has fallback
- ✅ Can update scenarios without code changes
- ✅ Maintains all current functionality

**Disadvantages**:
- ⚠️ Need to convert JSON structure to TypeScript interface
- ⚠️ File I/O adds minimal startup time

---

### Option B: Merge Both (Best of Both Worlds)

**Why This Works**:
- Keep all 24 TypeScript scenarios
- Add 18 JSON scenarios
- Total: 42 scenarios (massive variety!)
- Deduplicate by topic

**Implementation**:
```typescript
async initialize() {
  const jsonScenarios = await this.loadJSONScenarios();
  const allScenarios = [...SCENARIO_BANK, ...jsonScenarios];

  // Deduplicate by similarity (keep richer JSON version if duplicate)
  this.scenarios = this.deduplicateScenarios(allScenarios);
  logger.info(`✅ Loaded ${this.scenarios.length} total scenarios`);
}
```

**Advantages**:
- ✅ Maximum scenario variety
- ✅ Best coverage of all topics
- ✅ Richer metadata where available

**Disadvantages**:
- ⚠️ More complex deduplication logic
- ⚠️ Larger memory footprint

---

### Option C: JSON Only (Simplest)

**Why This Could Work**:
- Single source of truth
- Easier to maintain
- No duplication

**Implementation**:
```typescript
// Remove SCENARIO_BANK entirely
// Load only from JSON
```

**Advantages**:
- ✅ Clean, single source
- ✅ All scenarios have rich metadata

**Disadvantages**:
- ❌ No fallback if JSON fails
- ❌ Lose 6 unique TypeScript scenarios
- ❌ System fails if file missing

---

## 📝 Implementation Plan: Option A (Hybrid)

### Step 1: Create JSON File Structure
```bash
mkdir -p /home/jsagi/projects/mia-websocket-server/scenarios
# Create mia_ai_scenarios.json with user's 18 scenarios
```

### Step 2: Add JSON-to-TypeScript Converter
```typescript
private convertJSONToScenarios(jsonScenarios: any[]): Scenario[] {
  return jsonScenarios.map((js, index) => {
    // Map JSON structure to TypeScript Scenario interface
    const category = js.category;
    const lessonMap = {
      'wellness-awareness': 1,
      'medication-awareness': 2,
      'making-good-choices': 3,
      'reading-prescription-labels': 4,
    };

    return {
      id: js.id,
      lesson: lessonMap[category] || 2,
      number: index + 1,
      title: js.title,
      context: js.mia_context.scenario_setup,
      dilemma: js.description,
      questions: js.mia_context.key_questions,
      learningObjective: js.learning_objectives.join('; '),
      ageRange: [
        js.target_audience.age_range.min,
        js.target_audience.age_range.max
      ] as [number, number],
      // ⭐ NEW: Store extra JSON metadata
      riskLevel: js.risk_level,
      searchKeywords: js.search_keywords,
      teachingApproach: js.mia_context.teaching_approach
    };
  });
}
```

### Step 3: Update Scenario Interface
```typescript
export interface Scenario {
  id: string;
  lesson: number;
  number: number;
  title: string;
  context: string;
  dilemma: string;
  questions: string[];
  learningObjective: string;
  ageRange: [number, number];
  // ⭐ NEW: Optional JSON metadata
  riskLevel?: string;
  searchKeywords?: string[];
  teachingApproach?: string;
}
```

### Step 4: Initialize on Startup
```typescript
// In server.ts or dialogue.service.ts constructor
async initializeDialogueService() {
  await dialogueService.initialize();
}
```

### Step 5: Update Keyword Matching
```typescript
private selectScenarioWithKeywords(
  scenarios: Scenario[],
  keywords: string[]
): Scenario | null {

  // ⭐ NEW: Use JSON search_keywords if available
  for (const scenario of scenarios) {
    if (scenario.searchKeywords) {
      const matches = scenario.searchKeywords.some(kw =>
        keywords.includes(kw.toLowerCase())
      );
      if (matches) {
        logger.info(`🎯 Matched scenario via JSON keywords: ${scenario.id}`);
        return scenario;
      }
    }
  }

  // Fallback to existing keyword matching...
}
```

---

## 🚀 Benefits of This Approach

1. **Solves HF_TOKEN Issue**: No longer dependent on Pinecone for scenario selection
2. **Richer Scenarios**: JSON metadata enables better matching
3. **Fallback Safety**: TypeScript scenarios ensure system never breaks
4. **Easy Updates**: Edit JSON file, redeploy (no code changes)
5. **Better Matching**: `search_keywords` array enables precise scenario selection

---

## 🧪 Testing Plan

### Test Case 1: JSON Loads Successfully
```
Expected:
✅ Loaded 18 scenarios from JSON
🎯 Using JSON scenarios as primary source
```

### Test Case 2: JSON File Missing
```
Expected:
⚠️ JSON scenarios failed to load, using TypeScript fallback
✅ Using 24 TypeScript scenarios
```

### Test Case 3: Keyword Matching with JSON
```
User: "pharmacy" → "label reading"
Expected:
🔍 Fallback keywords detected: pharmacy, label, reading
🎯 Matched scenario via JSON keywords: understanding-medicine-bottle-labels
```

---

## 📊 Migration Impact

### Files to Modify:
1. `src/services/dialogue.service.ts` (add JSON loading)
2. Create `scenarios/mia_ai_scenarios.json`
3. Update `package.json` (add fs dependency if needed)

### Files NOT Changed:
- `src/services/mia.service.ts` (system prompt stays the same)
- `src/server.ts` (minor async init call)
- `test-mia-interface.html` (no changes)

### Deployment:
1. Add JSON file to repository
2. Commit changes
3. Push to Railway
4. **No environment variables needed!**

---

## ✅ Recommendation

**Implement Option A: JSON Primary, TypeScript Fallback**

**Reasoning**:
1. Fixes the Pinecone dependency issue immediately
2. Maintains system reliability with fallback
3. Richer scenario metadata enables better matching
4. Easy to extend and maintain
5. No dependency on external services (Pinecone, Hugging Face)

**Next Steps**:
1. Create `scenarios/mia_ai_scenarios.json` with user's 18 scenarios
2. Implement JSON loader in `dialogue.service.ts`
3. Update Scenario interface with optional metadata
4. Test locally
5. Commit and deploy to Railway

---

**Ready to implement?** This approach will solve the conversation flow issues without requiring the HF_TOKEN fix.
