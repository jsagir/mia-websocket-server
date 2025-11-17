# PWS Curriculum Upload Guide

## 📋 Step-by-Step Instructions for Uploading & Indexing Curriculum Files

---

## Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Curriculum Files**: Organized in the proper directory structure
3. **Node.js v20+**: Installed and working
4. **Environment Configured**: `.env` file with your API key

---

## Step 1: Set Up Your Environment

### 1.1 Copy Environment Template

```bash
cp .env.example .env
```

### 1.2 Add Your Gemini API Key

Edit `.env` and add your key:

```env
GEMINI_API_KEY=AIzaSy...your-actual-key-here...
```

---

## Step 2: Organize Your Curriculum Files

Create the following directory structure in your project:

```
mia-websocket-server/
└── curriculum/
    ├── lectures/           # Core lecture materials (N01-N10)
    ├── frameworks/         # Framework documents
    ├── problem_types/      # Problem type guides
    ├── tools/              # Tool documentation
    ├── examples/           # Case studies
    ├── docs/               # Syllabus and course documents
    └── books/              # Reference books
```

### 2.1 Create the Directory Structure

```bash
mkdir -p curriculum/{lectures,frameworks,problem_types,tools,examples,docs,books}
```

### 2.2 Place Your Files

**Lectures (N01-N10):**
```bash
curriculum/lectures/
├── N01_Introduction.pptx
├── N02_UnDefined.pptx
├── N03_IllDefined.pptx
├── N04_Wicked Problems.pptx
├── N05_Domains.pptx
├── N06_Portfolio.pptx
├── N07_Well-Defined.pptx
├── N08_Prior Art.pptx
├── N08b_Technical Plan.pptx
├── N09_Term Report.pptx
├── N10_January Term.pptx
└── I&E Lecture Notes Fall.docx
```

**Structured Data:**
```bash
curriculum/docs/
├── PWS_INNOVATION_BOOK.txt
├── Extended Research Foun.txt
└── Syllabouse.pdf
```

**Reference Books:**
```bash
curriculum/books/
├── A More Beautiful Question.pdf
└── [other books]
```

---

## Step 3: Prepare Framework & Tool Documents

If you don't have separate framework/tool files yet, you'll need to create them by extracting content from your existing materials:

### 3.1 Create Framework Files

Extract framework content and create individual files:

```bash
# Example: Create Creative Destruction framework file
cat > curriculum/frameworks/creative_destruction.txt << 'EOF'
# Creative Destruction (Joseph Schumpeter, 1942)

## Overview
Creative destruction is the process of industrial mutation that continuously
revolutionizes the economic structure from within, destroying the old one and
creating a new one.

## Key Concepts
- Capitalism is inherently dynamic
- Innovation drives economic change
- Old industries must be destroyed for new ones to emerge

## Application
Applies to un-defined and ill-defined problems where future market
disruption is anticipated.

[Add more content from Extended Research Foun.txt or lecture materials]
EOF
```

### 3.2 Create Tool Files

```bash
# Example: Trending to Absurd tool
cat > curriculum/tools/trending_to_absurd.txt << 'EOF'
# Trending to the Absurd

## Purpose
A tool for exploring un-defined problems by pushing current trends to
extreme logical conclusions.

## When to Use
- Exploring future possibilities (11-30 years)
- High uncertainty scenarios
- Need to identify weak signals

## Steps
1. Identify current trend
2. Extrapolate to extreme
3. Work backward to identify critical decision points

[Add content from lecture N02 or methodology documents]
EOF
```

### 3.3 Create Problem Type Guides

```bash
# Un-defined problems guide
cat > curriculum/problem_types/un-defined.txt << 'EOF'
# Un-defined Problems

## Characteristics
- Time Horizon: 11-30 years
- Uncertainty: High
- Key Question: "What could the future look like?"

## Tools
- Trending to the Absurd
- Scenario Analysis
- Nested Hierarchies
- Weak Signals Detection

## Examples
- Future of energy
- Evolution of medical care
- Next generation education systems

## Covered in Lectures
- N02: Tools for Un-defined Problems
- Related: N01, N04, N05

[Add more content]
EOF
```

---

## Step 4: Run the Upload Script

### 4.1 GraphRAG Upload (Recommended)

This uploads files to 7 specialized stores with rich metadata:

```bash
npm run pws:upload:graphrag
```

**What this does:**
1. Creates/connects to 7 File Search stores:
   - `pws-lectures` - Core lectures (N01-N10)
   - `pws-frameworks` - Innovation frameworks
   - `pws-problem-types` - Problem classification guides
   - `pws-tools` - Practical methodologies
   - `pws-syllabus` - Course structure
   - `pws-examples` - Case studies
   - `pws-references` - Academic books

2. Uploads files with metadata:
   - Document type (lecture, framework, tool, etc.)
   - Relationships (related lectures, frameworks, tools)
   - Difficulty level
   - Week number
   - Module classification

3. Indexes content for semantic search

4. Generates embeddings

**Expected Output:**
```
🚀 Starting PWS GraphRAG Curriculum Upload
📦 Using existing store: lectures (fileSearchStores/pws-lectures-abc123)
📦 Using existing store: frameworks (fileSearchStores/pws-frameworks-def456)
...
📚 Preparing lecture uploads...
📤 Uploading to lectures: curriculum/lectures/N01_Introduction.pptx
✅ Uploaded: N01: Framework for Innovation
📤 Uploading to lectures: curriculum/lectures/N02_UnDefined.pptx
✅ Uploaded: N02: Tools for Un-defined Problems
...
📊 Upload Summary:
   ✅ Successful: 45
   ❌ Failed: 0
   📁 Total: 45
🎉 PWS GraphRAG Upload Complete!
📈 Store Health:
   lectures: healthy
   frameworks: healthy
   problemTypes: healthy
   tools: healthy
   syllabus: healthy
   examples: healthy
   references: healthy
```

### 4.2 Simple Upload (Alternative)

For a single-store approach:

```bash
npm run pws:upload
```

---

## Step 5: Verify Upload Success

### 5.1 Check Health Endpoint

```bash
curl http://localhost:3001/api/pws/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "stores": {
    "lectures": {
      "status": "healthy",
      "storeId": "fileSearchStores/pws-lectures-...",
      "displayName": "PWS Core Lectures"
    },
    "frameworks": { ... },
    "problemTypes": { ... },
    "tools": { ... },
    "syllabus": { ... },
    "examples": { ... },
    "references": { ... }
  },
  "totalStores": 7
}
```

### 5.2 Test a Query

```bash
curl -X POST http://localhost:3001/api/pws/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are Un-defined problems?"
  }'
```

**Expected Response:**
```json
{
  "response": "[Provocative question about Un-defined problems]...[Framework explanation]...[Citations]",
  "citations": [
    {
      "source": "N02_UnDefined.pptx",
      "content": "...",
      "metadata": {
        "lecture_id": "N02",
        "problem_types": "un-defined",
        "tools_introduced": "trending_to_absurd,scenario_analysis"
      }
    }
  ]
}
```

---

## Step 6: Add Store IDs to Environment (Optional but Recommended)

After first upload, the script will output store IDs. Add them to `.env` for faster subsequent runs:

```env
GEMINI_API_KEY=your-key

# PWS File Search Stores (auto-generated)
PWS_STORE_LECTURES=fileSearchStores/pws-lectures-abc123
PWS_STORE_FRAMEWORKS=fileSearchStores/pws-frameworks-def456
PWS_STORE_PROBLEMTYPES=fileSearchStores/pws-problem-types-ghi789
PWS_STORE_TOOLS=fileSearchStores/pws-tools-jkl012
PWS_STORE_SYLLABUS=fileSearchStores/pws-syllabus-mno345
PWS_STORE_EXAMPLES=fileSearchStores/pws-examples-pqr678
PWS_STORE_REFERENCES=fileSearchStores/pws-references-stu901
```

---

## Troubleshooting

### Issue: "File not found"

**Problem:** Script can't find your curriculum files

**Solution:**
```bash
# Check your files exist
ls -la curriculum/lectures/
ls -la curriculum/docs/
ls -la curriculum/books/

# Verify file paths in upload script match your file names
grep "filePath:" src/scripts/upload-pws-graphrag.ts
```

### Issue: "GEMINI_API_KEY not found"

**Problem:** API key not configured

**Solution:**
```bash
# Check .env file exists
cat .env | grep GEMINI_API_KEY

# If missing, add it
echo "GEMINI_API_KEY=your-key-here" >> .env
```

### Issue: Upload fails with 401 Unauthorized

**Problem:** Invalid API key

**Solution:**
1. Get a new API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update `.env` with the new key
3. Retry upload

### Issue: Some files fail to upload

**Problem:** File format not supported or file corrupted

**Solution:**
1. Check the error message for specific file
2. Supported formats: `.txt`, `.pdf`, `.docx`, `.pptx`, `.md`
3. Convert unsupported formats to `.txt` or `.pdf`
4. For PowerPoint files, you may need to convert to PDF first:
   ```bash
   # Using LibreOffice (if installed)
   libreoffice --headless --convert-to pdf curriculum/lectures/*.pptx
   ```

### Issue: No citations in responses

**Problem:** Files uploaded but not indexed properly

**Solution:**
1. Wait 5-10 minutes for indexing to complete
2. Check health endpoint: `GET /api/pws/health`
3. Verify files have proper metadata
4. Try re-uploading with more detailed metadata

---

## File Format Recommendations

### Best Formats for Upload

| Content Type | Recommended Format | Alternative |
|--------------|-------------------|-------------|
| Lectures | `.pdf` or `.txt` | `.pptx` (converted to PDF) |
| Frameworks | `.txt` or `.md` | `.pdf` |
| Tools | `.txt` or `.md` | `.pdf` |
| Syllabus | `.pdf` | `.txt` |
| Books | `.pdf` | `.txt` |
| Case Studies | `.txt` or `.md` | `.pdf` |

### Converting PowerPoint to PDF

**Option 1: LibreOffice (Linux/Mac)**
```bash
libreoffice --headless --convert-to pdf curriculum/lectures/*.pptx
```

**Option 2: Microsoft PowerPoint (Windows/Mac)**
- Open file in PowerPoint
- File → Save As → PDF

**Option 3: Online Converter**
- Use [CloudConvert](https://cloudconvert.com/pptx-to-pdf)
- Upload → Convert → Download

---

## Metadata Customization

### Editing Upload Script

To add custom metadata or change file organization, edit:

```bash
vi src/scripts/upload-pws-graphrag.ts
```

**Example: Add New Lecture**

```typescript
const LECTURE_CONFIGS: Record<string, any> = {
  // ... existing lectures ...

  N11: {  // Add your new lecture
    title: 'Advanced Innovation Strategies',
    week: 12,
    module: 'advanced',
    problemTypes: 'all',
    frameworks: 'blue_ocean,disruptive_innovation',
    tools: 'strategy_canvas',
    relatedLectures: 'N10,N06',
    previousLecture: 'N10',
    difficulty: 'advanced'
  }
};
```

**Example: Add New Framework**

```typescript
const frameworks = [
  // ... existing frameworks ...

  {
    id: 'blue_ocean',
    name: 'Blue Ocean Strategy',
    author: 'W. Chan Kim',
    year: 2005,
    appliesTo: 'ill-defined',
    relatedFrameworks: 'strategic_positioning',
    lectures: 'N11',
    difficulty: 'advanced'
  }
];
```

Then run the upload script again:
```bash
npm run pws:upload:graphrag
```

---

## Re-uploading & Updating Content

### Full Re-upload

To re-upload all content (e.g., after major updates):

```bash
# Delete existing stores (caution!)
# Manual deletion via Google AI Studio or API

# Re-run upload
npm run pws:upload:graphrag
```

### Incremental Upload

To add new files without re-uploading everything:

1. Add your new files to the appropriate `curriculum/` subdirectory
2. Edit `src/scripts/upload-pws-graphrag.ts` to include the new files
3. Run the upload script
4. Only new files will be uploaded

---

## Advanced: Programmatic Upload

If you want to upload files programmatically from your own code:

```typescript
import { getPWSFileSearchGraphRAGService } from './services/pws-filesearch-graphrag.service';

const service = getPWSFileSearchGraphRAGService();

// Initialize stores
await service.initializeStores();

// Upload a document
await service.uploadDocument(
  'lectures',  // Store name
  'curriculum/lectures/N12_New_Topic.pptx',  // File path
  [  // Metadata
    { key: 'lecture_id', string_value: 'N12' },
    { key: 'week', numeric_value: 13 },
    { key: 'module', string_value: 'advanced' },
    { key: 'frameworks_mentioned', string_value: 'new_framework' }
  ],
  'N12: New Topic'  // Display name
);
```

---

## Next Steps

After successful upload:

1. **Start the server**: `npm run dev`
2. **Test queries**: Use REST API or WebSocket
3. **Build your PWA frontend**
4. **Customize system prompt** (`src/prompts/pws-system-prompt.ts`)
5. **Monitor usage** (check logs)

---

## Support

- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs/file-search
- **GraphRAG Concepts**: See `PWS_README.md`
- **Issues**: Check server logs in `logs/combined.log`

---

**Happy uploading! 🚀**
