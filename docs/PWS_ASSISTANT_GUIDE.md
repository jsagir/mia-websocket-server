# PWS (Problems Worth Solving) Curriculum Assistant

## Overview

The PWS Curriculum Assistant is a RAG-enhanced AI teaching assistant built on Gemini File Search. It embodies Lawrence Aronhime's teaching philosophy and provides intelligent, citation-backed responses to student queries about innovation and entrepreneurship.

## Features

- **RAG-Enhanced Responses**: Semantic search across 900+ curriculum chunks
- **Aronhime Teaching Style**: Provocative questions, framework-driven thinking, story-based learning
- **Citation Support**: Automatic citation of lectures, books, and research papers
- **Problem Classification**: Automatically classify problems as Un-defined, Ill-defined, or Well-defined
- **Real-time WebSocket**: Low-latency conversational interface
- **REST API**: Simple HTTP endpoints for quick queries

## Architecture

```
┌─────────────────────────────────────────────────┐
│         PWS Assistant Architecture              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Student Query                                  │
│       ↓                                         │
│  WebSocket/REST API                             │
│       ↓                                         │
│  PWS Assistant Service                          │
│       ↓                                         │
│  Gemini File Search (RAG)                       │
│       ↓                                         │
│  Semantic Search (900+ chunks)                  │
│       ↓                                         │
│  Response + Citations                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Setup

### 1. Prerequisites

- Node.js v20+
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Curriculum materials (lectures, PDFs, structured data)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your-gemini-api-key-here
PWS_FILE_SEARCH_STORE_NAME=fileSearchStores/pws-curriculum-store
```

### 4. Organize Curriculum Files

Create the following directory structure:

```
mia-websocket-server/
├── curriculum/
│   ├── lectures/
│   │   ├── N01_Introduction.pptx
│   │   ├── N02_UnDefined.pptx
│   │   ├── N03_IllDefined.pptx
│   │   ├── N04_Wicked Problems.pptx
│   │   ├── N05_Domains.pptx
│   │   ├── N06_Portfolio.pptx
│   │   ├── N07_Well-Defined.pptx
│   │   ├── N08_Prior Art.pptx
│   │   ├── N08b_Technical Plan.pptx
│   │   ├── N09_Term Report.pptx
│   │   ├── N10_January Term.pptx
│   │   └── I&E Lecture Notes Fall.docx
│   ├── data/
│   │   ├── PWS_INNOVATION_BOOK.txt
│   │   └── Extended Research Foun.txt
│   ├── docs/
│   │   ├── Syllabouse.pdf
│   │   └── README.md
│   └── books/
│       ├── A More Beautiful Question.pdf
│       └── [other reference books]
```

### 5. Upload Curriculum Materials

Run the upload script to index your curriculum:

```bash
npm run pws:upload
```

This will:
1. Create a File Search store (if needed)
2. Upload and index all curriculum files
3. Add metadata (module, topic, difficulty, framework, lecture number)
4. Generate embeddings for semantic search

**Expected output:**
```
🚀 Starting PWS Curriculum Upload
📤 Uploading: N01: Framework for Innovation
✅ Uploaded: N01: Framework for Innovation
...
📊 Upload Summary:
   ✅ Successful: 15
   ❌ Failed: 0
   📁 Total: 15
🎉 PWS Curriculum Upload Complete!
```

### 6. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

## API Reference

### REST Endpoints

#### Health Check
```http
GET /api/pws/health
```

**Response:**
```json
{
  "status": "healthy",
  "details": {
    "gemini": "connected",
    "fileSearchStore": "fileSearchStores/pws-curriculum-store",
    "storeDetails": { ... }
  }
}
```

#### Quick Query
```http
POST /api/pws/query
Content-Type: application/json

{
  "query": "What are Un-defined problems and which tools should I use?"
}
```

**Response:**
```json
{
  "response": "[Aronhime-style response with provocative question, framework, story, takeaway, challenge]",
  "citations": [
    {
      "source": "N02_UnDefined.pptx",
      "content": "Tools for Un-defined Problems...",
      "metadata": { ... }
    }
  ]
}
```

#### Problem Classification
```http
POST /api/pws/classify
Content-Type: application/json

{
  "problemDescription": "How can we reduce carbon emissions in urban areas?"
}
```

**Response:**
```json
{
  "problemType": "ill-defined",
  "reasoning": "This problem has a clear goal but multiple solution paths...",
  "recommendedTools": ["2x2 Matrix", "Nested Hierarchies"],
  "relevantLectures": ["N03", "N04"]
}
```

### WebSocket Events

#### Connect and Query

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Send PWS query
socket.emit('pws_query', {
  query: 'Explain the Innovator\'s Dilemma',
  sessionId: 'session-123',
  conversationHistory: [
    { role: 'user', content: 'Previous question...' },
    { role: 'model', content: 'Previous answer...' }
  ]
});

// Receive response
socket.on('pws_response', (data) => {
  console.log('Response:', data.response);
  console.log('Citations:', data.citations);
});

// Handle errors
socket.on('pws_error', (error) => {
  console.error('Error:', error.message);
});
```

#### Classify Problem

```javascript
socket.emit('pws_classify', {
  problemDescription: 'How do we create a sustainable transportation system?',
  sessionId: 'session-123'
});

socket.on('pws_classification', (data) => {
  console.log('Problem Type:', data.classification.problemType);
  console.log('Recommended Tools:', data.classification.recommendedTools);
});
```

## Teaching Style (Aronhime Method)

The PWS Assistant follows Lawrence Aronhime's distinctive teaching methodology:

### 1. Start with Provocative Questions
Every response begins with a question that refuses to be ignored:
> "Have you ever wondered why Blockbuster, with billions in revenue, couldn't see Netflix coming?"

### 2. Frame the Journey
Orient the student before diving in:
> "We're exploring why established companies fail to innovate. By the end of this, you'll understand the Innovator's Dilemma..."

### 3. Teach Frameworks, Not Facts
- Problem Classification (Un-defined, Ill-defined, Well-defined)
- Innovation Portfolio (Now, New, Next)
- Creative Destruction (Schumpeter)
- Diffusion Theory (Rogers)

### 4. Anchor in Stories
- Blockbuster/Netflix
- Kodak's digital camera failure
- Nokia's smartphone miss

### 5. Close with Action
Every response ends with:
- Synthesis: What did we discover?
- Challenge: What will you do differently?
- Next Step: What's coming next?

## Curriculum Organization

### Modules

1. **Introduction Module** (Foundational)
   - N01: Framework for Innovation
   - Creative Destruction, Defining Innovation

2. **Problem Taxonomy Module** (Foundational)
   - N02: Un-defined Problems
   - N03: Ill-defined Problems
   - N04: Wicked Problems

3. **Exploration Tools Module** (Intermediate)
   - N05: Domain-Specific Innovation
   - Tools: Trending to Absurd, Scenario Analysis, Weak Signals

4. **Execution Tools Module** (Intermediate/Advanced)
   - N07: Well-Defined Problems
   - N08: Prior Art and Research
   - N08b: Technical Planning

5. **Portfolio Module** (Advanced)
   - N06: Portfolio Approach
   - Three Box Solution (Now, New, Next)

6. **Capstone Module** (Advanced)
   - N09: Project Documentation
   - N10: Capstone Project

### Problem Types

| Problem Type | Characteristics | Tools | Lectures |
|--------------|----------------|-------|----------|
| **Un-defined** | Future-oriented, high uncertainty, exploratory | Trending to Absurd, Scenario Analysis, Weak Signals | N02 |
| **Ill-defined** | Medium-term, moderate uncertainty, analytical | 2x2 Matrix, Nested Hierarchies, Extensive Search | N03, N04 |
| **Well-defined** | Clear constraints, low uncertainty, structured | Technical Planning, Prior Art, Structured Methods | N07, N08 |

### Key Frameworks

- **Creative Destruction** (Schumpeter) - N01
- **Innovator's Dilemma** (Christensen) - N02, N06
- **Diffusion Theory** (Rogers) - Extended Research
- **Three Box Solution** (Govindarajan) - N06
- **Problem Theory** (Rittel & Webber) - N04
- **Running Lean** (Maurya) - N08b

## Example Queries

### 1. Understanding Problem Types
```
Query: "What's the difference between Un-defined and Ill-defined problems?"

Response: [Provocative question] → [Framework explanation] →
[Blockbuster/Netflix story] → [Critical takeaway] →
[Challenge to classify their own problem]

Citations:
- N02_UnDefined.pptx (Weak Signals, Future-Back Thinking)
- N03_IllDefined.pptx (Nested Hierarchies, 2x2 Matrix)
- PWS_INNOVATION_BOOK.txt (Problem Typology Model)
```

### 2. Learning a Framework
```
Query: "Explain the Innovator's Dilemma"

Response: [Question about why successful companies fail] →
[Christensen's framework] → [Kodak digital camera story] →
[Principle: optimize for today vs. explore for tomorrow] →
[Challenge: identify dilemma in their project]

Citations:
- "The Innovator's Dilemma" (Christensen)
- N02_UnDefined.pptx (Exploration vs. Exploitation)
- Extended Research Foundation (Disruptive Innovation Theory)
```

### 3. Tool Selection
```
Query: "I need to explore future possibilities for my project. What tools should I use?"

Response: [Question about dealing with uncertainty] →
[Un-defined problem classification] → [Trending to Absurd example] →
[Three recommended tools with when to use each] →
[Challenge: apply one tool this week]

Citations:
- N02_UnDefined.pptx (Tools for Future-Oriented Thinking)
- "Trending to the absurd - agent steps.pdf"
- PWS_INNOVATION_BOOK.txt (Tool Selection Matrix)
```

## Troubleshooting

### Issue: "GEMINI_API_KEY not found"
**Solution:** Ensure `.env` file exists and contains `GEMINI_API_KEY=your-key`

### Issue: "File Search store not configured"
**Solution:** Run `npm run pws:upload` to create and configure the store

### Issue: "File not found" during upload
**Solution:** Ensure curriculum files are in the correct directory structure:
```
curriculum/
├── lectures/
├── data/
├── docs/
└── books/
```

### Issue: No citations in responses
**Solution:**
1. Verify files uploaded successfully: `GET /api/pws/health`
2. Check File Search store contains documents
3. Ensure query matches curriculum content

### Issue: Low-quality responses
**Solution:**
1. Upload more curriculum materials
2. Add metadata (module, topic, framework) to files
3. Increase chunk overlap in `pws-filesearch.service.ts`:
   ```typescript
   chunking_config: {
     white_space_config: {
       max_tokens_per_chunk: 500,  // Increase if needed
       max_overlap_tokens: 100      // Increase for more context
     }
   }
   ```

## Development

### Adding New Curriculum Files

Edit `src/scripts/upload-pws-curriculum.ts`:

```typescript
const CURRICULUM_MATERIALS: CurriculumFile[] = [
  // Add new file
  {
    filePath: 'curriculum/new-material/file.pdf',
    displayName: 'New Material Title',
    module: 'Introduction Module',
    topic: 'your-topic',
    difficulty: 'intermediate',
    framework: 'Framework Name',
    lectureNumber: 'N11'  // If applicable
  },
  // ... existing files
];
```

Run upload:
```bash
npm run pws:upload
```

### Customizing the Teaching Style

Edit `src/prompts/pws-system-prompt.ts` to adjust:
- Response format
- Language patterns
- Framework emphasis
- Story selection
- Question types

### Adjusting Search Parameters

Edit `src/services/pws-assistant.service.ts`:

```typescript
const config: GenerateContentConfig = {
  systemInstruction: getPWSSystemPrompt(),
  tools: [ ... ],
  temperature: 0.7,        // Adjust creativity (0.0-1.0)
  topP: 0.95,             // Adjust diversity
  maxOutputTokens: 2048   // Adjust response length
};
```

## Performance Optimization

### Chunking Strategy
- **Default**: 500 tokens/chunk, 50 token overlap
- **For dense content**: Reduce to 300 tokens/chunk
- **For narrative content**: Increase to 800 tokens/chunk

### Metadata Filtering
Use metadata to narrow search scope:

```typescript
socket.emit('pws_query', {
  query: 'Explain Un-defined problems',
  metadata: {
    module: 'Problem Taxonomy Module',
    difficulty: 'foundational',
    lectureNumber: 'N02'
  }
});
```

### Caching
File Search includes automatic 15-minute caching for repeated queries.

## Future Enhancements

- [ ] Multi-turn conversation memory
- [ ] Student progress tracking
- [ ] Adaptive difficulty based on student level
- [ ] Image/diagram generation for frameworks
- [ ] Assignment generation and grading
- [ ] Socratic questioning mode
- [ ] Case study recommendation engine

## Support

For issues or questions:
1. Check [Gemini File Search Docs](https://ai.google.dev/gemini-api/docs/file-search)
2. Review server logs: `tail -f logs/combined.log`
3. Test health endpoint: `GET /api/pws/health`

## License

MIT
