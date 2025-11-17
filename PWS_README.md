# PWS (Problems Worth Solving) Curriculum Assistant

> **A GraphRAG-powered AI teaching assistant using Gemini File Search**
> Embodies Lawrence Aronhime's teaching philosophy with multi-store architecture

## 🎯 Overview

The PWS Curriculum Assistant is an intelligent teaching aid that uses **GraphRAG concepts** implemented via Gemini File Search to provide citation-backed, contextually-aware responses about innovation and entrepreneurship curriculum.

### Key Features

✅ **GraphRAG Architecture**: 7 specialized File Search stores simulating graph relationships
✅ **Rich Metadata**: Simulates graph edges for relationship traversal
✅ **Federated Search**: Multi-store querying for comprehensive context
✅ **Aronhime Teaching Style**: Provocative questions, frameworks, stories, challenges
✅ **Multi-Hop Retrieval**: Simulates graph traversal across related content
✅ **Hierarchical Context**: From module overview to specific examples
✅ **Automatic Citations**: Track sources with full relationship metadata

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           PWS GraphRAG Architecture (Vector-Based)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Store #1     │  │ Store #2     │  │ Store #3     │    │
│  │ LECTURES     │  │ FRAMEWORKS   │  │ PROBLEM      │    │
│  │ (N01-N10)    │  │ (Theories)   │  │ TYPES        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Store #4     │  │ Store #5     │  │ Store #6     │    │
│  │ TOOLS        │  │ SYLLABUS     │  │ EXAMPLES     │    │
│  │ (Methods)    │  │ (Structure)  │  │ (Cases)      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐                                          │
│  │ Store #7     │                                          │
│  │ REFERENCES   │  ← Federated Search →                   │
│  │ (Books)      │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### Store Organization

| Store | Content | Chunking | Metadata |
|-------|---------|----------|----------|
| **Lectures** | N01-N10 core materials | 800/200 | week, module, frameworks, tools, relationships |
| **Frameworks** | 20+ innovation theories | 600/150 | author, year, applies_to, related_frameworks |
| **Problem Types** | Un/Ill/Well-defined guides | 700/175 | time_horizon, uncertainty, tools, examples |
| **Tools** | Practical methodologies | 700/175 | category, problem_type, difficulty, lecture |
| **Syllabus** | Week-by-week structure | 600/100 | week, objectives, deliverables |
| **Examples** | Case studies | 1000/200 | industry, problem_type, tools, frameworks |
| **References** | Academic books | 1000/250 | author, year, lectures, topics |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Organize Curriculum Files

Create this directory structure:

```
mia-websocket-server/
└── curriculum/
    ├── lectures/
    │   ├── N01_Introduction.pptx
    │   ├── N02_UnDefined.pptx
    │   ├── N03_IllDefined.pptx
    │   ├── N04_Wicked Problems.pptx
    │   ├── N05_Domains.pptx
    │   ├── N06_Portfolio.pptx
    │   ├── N07_Well-Defined.pptx
    │   ├── N08_Prior Art.pptx
    │   ├── N08b_Technical Plan.pptx
    │   ├── N09_Term Report.pptx
    │   └── N10_January Term.pptx
    ├── frameworks/
    │   ├── creative_destruction.txt
    │   ├── innovators_dilemma.txt
    │   └── [other frameworks]
    ├── problem_types/
    │   ├── un-defined.txt
    │   ├── ill-defined.txt
    │   └── well-defined.txt
    ├── tools/
    │   ├── trending_to_absurd.txt
    │   ├── scenario_analysis.txt
    │   └── [other tools]
    ├── examples/
    │   └── nato_hub_case.txt
    ├── docs/
    │   └── Syllabouse.pdf
    └── books/
        └── A More Beautiful Question.pdf
```

### 4. Upload Curriculum (GraphRAG)

```bash
npm run pws:upload:graphrag
```

This will:
- Create 7 specialized File Search stores
- Upload materials with rich metadata (simulating graph relationships)
- Index content for semantic search
- Generate embeddings

**Output:**
```
🚀 Starting PWS GraphRAG Curriculum Upload
📦 Using existing store: lectures (fileSearchStores/pws-lectures-xyz)
📦 Using existing store: frameworks (fileSearchStores/pws-frameworks-xyz)
...
✅ Uploaded: N01: Framework for Innovation
✅ Uploaded: Creative Destruction
...
📊 Upload Summary:
   ✅ Successful: 45
   ❌ Failed: 0
   📁 Total: 45
🎉 PWS GraphRAG Upload Complete!
```

### 5. Start Server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## 📡 API Usage

### REST Endpoints

#### Health Check
```bash
curl http://localhost:3001/api/pws/health
```

```json
{
  "status": "healthy",
  "stores": {
    "lectures": { "status": "healthy", "storeId": "fileSearchStores/..." },
    "frameworks": { "status": "healthy", "storeId": "fileSearchStores/..." },
    ...
  },
  "totalStores": 7
}
```

#### Query Assistant
```bash
curl -X POST http://localhost:3001/api/pws/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are Un-defined problems and which tools should I use?"
  }'
```

```json
{
  "response": "[Provocative question] Have you ever wondered why...\n\n[Framework & Context]...\n\n[Tools]...\n\n[Challenge]...",
  "citations": [
    {
      "source": "N02_UnDefined.pptx",
      "content": "...",
      "metadata": {
        "lecture_id": "N02",
        "tools_introduced": "trending_to_absurd,scenario_analysis",
        "related_lectures": "N01,N03,N04"
      }
    }
  ]
}
```

### WebSocket Events

#### Connect and Query

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Send query
socket.emit('pws_query', {
  query: 'Explain the Innovator\'s Dilemma using examples',
  sessionId: 'session-123',
  conversationHistory: []
});

// Receive response
socket.on('pws_response', (data) => {
  console.log('Answer:', data.response);
  console.log('Citations:', data.citations);
  console.log('Related Content:', data.relatedContent);
});
```

---

## 🎓 Lawrence Aronhime Teaching Style

The assistant embodies Aronhime's distinctive teaching methodology:

### 1. **Start with Provocative Questions**
> "Have you ever wondered why Blockbuster, with billions in revenue, couldn't see Netflix coming?"

### 2. **Frame the Journey**
> "We're exploring why established companies fail to innovate. By the end, you'll understand the Innovator's Dilemma and recognize when you're facing an Un-defined vs. Well-defined problem."

### 3. **Teach Frameworks, Not Facts**
- Problem Classification (Un/Ill/Well-defined)
- Innovation Portfolio (Now, New, Next)
- Creative Destruction (Schumpeter)
- Diffusion Theory (Rogers)

### 4. **Anchor in Stories**
- Blockbuster/Netflix failure
- Kodak's digital camera miss
- Nokia's smartphone crisis

### 5. **Close with Action**
- Synthesis: What did we discover?
- Challenge: What will you do differently?
- Next Step: What's coming next?

---

## 🔄 GraphRAG Concepts (Without Graph DB)

### Simulating Graph Relationships

The system uses **metadata** to simulate graph relationships:

```typescript
// Lecture N02 metadata
{
  lecture_id: 'N02',
  frameworks_mentioned: 'strategic_foresight,future_back_thinking',  // → Edges to frameworks
  tools_introduced: 'trending_to_absurd,scenario_analysis',           // → Edges to tools
  related_lectures: 'N01,N03,N04',                                    // → Edges to lectures
  problem_types: 'un-defined'                                         // → Edge to problem type
}
```

### Federated Search (Multi-Store Query)

```typescript
// Search across multiple stores for comprehensive context
const response = await federatedSearch({
  query: 'How do I explore future possibilities?',
  stores: ['lectures', 'tools', 'examples']
});
```

### Multi-Hop Retrieval (Graph Traversal)

```typescript
// Hop 1: Find lecture
const lecture = await searchStore('lectures', query);

// Hop 2: Follow framework relationships
const frameworks = await searchStore('frameworks',
  lecture.metadata.frameworks_mentioned);

// Hop 3: Get examples
const examples = await searchStore('examples',
  `framework_id IN (${frameworks.ids})`);
```

### Hierarchical Context Building

```
Module (Syllabus)
  ↓
Lecture (N02)
  ↓
Framework (Strategic Foresight)
  ↓
Tool (Trending to Absurd)
  ↓
Example (Energy Future Case)
```

---

## 📊 Curriculum Structure

### Problem Types Framework

| Problem Type | Time Horizon | Uncertainty | Tools | Lectures |
|--------------|--------------|-------------|-------|----------|
| **Un-defined** | 11-30 years | High | Trending to Absurd, Scenario Analysis, Weak Signals | N02 |
| **Ill-defined** | 2-10 years | Medium | 2x2 Matrix, Nested Hierarchies, Extensive/Intensive Search | N03, N04 |
| **Well-defined** | 0-1 years | Low | Gantt Charts, Technical Planning, Prior Art | N07, N08 |

### Module Organization

| Week | Module | Lectures | Difficulty |
|------|--------|----------|------------|
| 1-3 | Introduction & Problem Taxonomy | N01-N04 | Foundational |
| 4-6 | Exploration Tools | N05 | Intermediate |
| 7-9 | Execution Tools | N07-N08b | Intermediate/Advanced |
| 10-11 | Portfolio & Capstone | N06, N09-N10 | Advanced |

### Key Frameworks

- **Creative Destruction** (Schumpeter) - N01
- **Innovator's Dilemma** (Christensen) - N02, N06
- **Diffusion Theory** (Rogers) - N01, N03
- **Three Box Solution** (Govindarajan) - N06
- **Running Lean** (Maurya) - N08b
- **Problem Theory** (Rittel & Webber) - N04

---

## 🛠️ Development

### Adding New Curriculum Files

Edit `src/scripts/upload-pws-graphrag.ts`:

```typescript
const LECTURE_CONFIGS: Record<string, any> = {
  N11: {  // Add new lecture
    title: 'New Topic',
    week: 12,
    module: 'advanced',
    problemTypes: 'all',
    frameworks: 'new_framework',
    tools: 'new_tool',
    relatedLectures: 'N10',
    previousLecture: 'N10',
    difficulty: 'advanced'
  }
};
```

Run:
```bash
npm run pws:upload:graphrag
```

### Customizing Teaching Style

Edit `src/prompts/pws-system-prompt.ts`:

```typescript
export const PWS_SYSTEM_PROMPT = `
You are the PWS Curriculum Assistant, embodying Lawrence Aronhime's teaching philosophy...

[Customize response patterns, language, frameworks, etc.]
`;
```

### Adjusting Search Strategy

Edit `src/services/pws-assistant.service.ts`:

```typescript
// Change which stores to search for different query types
const storePriority = {
  'concept': ['lectures', 'frameworks', 'references'],
  'tool': ['tools', 'examples', 'lectures'],
  'framework': ['frameworks', 'lectures', 'references'],
  'how_to': ['tools', 'examples', 'syllabus'],
  'example': ['examples', 'lectures', 'references']
};
```

---

## 📈 Performance & Optimization

### Chunking Strategies

| Store | Max Tokens | Overlap | Rationale |
|-------|------------|---------|-----------|
| Lectures | 800 | 200 | Dense technical content |
| Frameworks | 600 | 150 | Conceptual definitions |
| Tools | 700 | 175 | Procedural instructions |
| Examples | 1000 | 200 | Narrative case studies |
| References | 1000 | 250 | Long-form academic text |

### Query Optimization

```typescript
// Use metadata filters to narrow search scope
socket.emit('pws_query', {
  query: 'Explain Un-defined problems',
  metadata: {
    problemType: 'undefined',
    module: 'problem_taxonomy',
    lectureNumber: 'N02'
  }
});
```

### Caching

- File Search has built-in 15-minute cache
- Repeated queries return faster
- Citations are cached with responses

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not found"
```bash
# Ensure .env file exists
cp .env.example .env

# Add your API key
echo "GEMINI_API_KEY=your-key-here" >> .env
```

### "Store not initialized"
```bash
# Run GraphRAG upload to create stores
npm run pws:upload:graphrag
```

### No citations in responses
1. Check files uploaded: `GET /api/pws/health`
2. Verify store health (all should be "healthy")
3. Ensure query matches curriculum content
4. Check metadata filters aren't too restrictive

### Low-quality responses
1. Upload more curriculum materials
2. Add richer metadata to files
3. Increase chunk overlap for more context
4. Use federated search across multiple stores

---

## 📚 Resources

- [Gemini File Search Docs](https://ai.google.dev/gemini-api/docs/file-search)
- [GraphRAG Concepts](https://microsoft.github.io/graphrag/)
- [Innovation Frameworks](https://en.wikipedia.org/wiki/Innovation)
- [Problems Worth Solving Methodology](curriculum/data/PWS_INNOVATION_BOOK.txt)

---

## 🎉 Next Steps

1. **Upload your curriculum**: `npm run pws:upload:graphrag`
2. **Start the server**: `npm run dev`
3. **Test queries**: `POST /api/pws/query`
4. **Build your PWA frontend** (connect via WebSocket)
5. **Customize teaching style** (edit system prompt)

---

## 📄 License

MIT

---

**Built with ❤️ for Problems Worth Solving**
