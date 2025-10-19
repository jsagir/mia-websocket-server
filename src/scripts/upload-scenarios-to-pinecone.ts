import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddingService } from '../services/embedding.service';
import { SCENARIO_BANK, Scenario } from '../services/dialogue.service';
import { logger } from '../utils/logger';

/**
 * Upload Scenarios to Pinecone
 *
 * This script:
 * 1. Loads all 24 scenarios from SCENARIO_BANK
 * 2. Generates embeddings using OpenAI text-embedding-3-small
 * 3. Uploads to Pinecone in the 'mia-scenarios' namespace
 *
 * Run: npx ts-node src/scripts/upload-scenarios-to-pinecone.ts
 */

async function uploadScenarios() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📤 UPLOADING SCENARIOS TO PINECONE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Initialize services
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    console.error('❌ Error: PINECONE_API_KEY and PINECONE_INDEX_NAME must be set');
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey });
  const index = pc.index(indexName);
  const embedder = getEmbeddingService();

  console.log(`📊 Configuration:`);
  console.log(`   Index: ${indexName}`);
  console.log(`   Namespace: mia-scenarios`);
  console.log(`   Total scenarios: ${SCENARIO_BANK.length}`);
  console.log(`   Embedding model: text-embedding-3-small (1536 dimensions)\n`);

  // Upload each scenario
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < SCENARIO_BANK.length; i++) {
    const scenario = SCENARIO_BANK[i];

    try {
      console.log(`\n[${i + 1}/${SCENARIO_BANK.length}] Processing: ${scenario.id} - ${scenario.title}`);

      // Create rich text representation for embedding
      const searchableText = createSearchableText(scenario);

      // Create full text representation for retrieval
      const fullText = createFullText(scenario);

      // Generate embedding
      console.log('   ⏳ Generating embedding...');
      const embedding = await embedder.embed(searchableText);

      // Upsert to Pinecone
      console.log('   ⏳ Uploading to Pinecone...');
      await index.namespace('mia-scenarios').upsert([{
        id: scenario.id,
        values: embedding,
        metadata: {
          lesson: scenario.lesson,
          number: scenario.number,
          title: scenario.title,
          context: scenario.context,
          dilemma: scenario.dilemma,
          questions: scenario.questions.join(' | '),
          learningObjective: scenario.learningObjective,
          ageRange: `${scenario.ageRange[0]}-${scenario.ageRange[1]}`,
          fullText: fullText
        }
      }]);

      console.log(`   ✅ Successfully uploaded!`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Error uploading ${scenario.id}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 UPLOAD SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Success Rate: ${((successCount / SCENARIO_BANK.length) * 100).toFixed(1)}%`);

  if (successCount > 0) {
    // Test retrieval
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🧪 TESTING RETRIEVAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const testQueries = [
      'pharmacy label reading',
      'friend offering pills',
      'emergency help 911'
    ];

    for (const query of testQueries) {
      console.log(`\nTest query: "${query}"`);
      const embedding = await embedder.embed(query);
      const results = await index.namespace('mia-scenarios').query({
        vector: embedding,
        topK: 3,
        includeMetadata: true
      });

      if (results.matches && results.matches.length > 0) {
        console.log('   Results:');
        results.matches.forEach((match: any, i: number) => {
          console.log(`   ${i + 1}. [${match.id}] ${match.metadata.title} (score: ${match.score.toFixed(3)})`);
        });
      } else {
        console.log('   ⚠️ No results found');
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ UPLOAD COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

/**
 * Create searchable text for embedding generation
 * (Focuses on keywords and semantic meaning)
 */
function createSearchableText(scenario: Scenario): string {
  return `
${scenario.title}
Lesson ${scenario.lesson}
${scenario.context}
${scenario.dilemma}
${scenario.questions.join(' ')}
${scenario.learningObjective}
  `.trim();
}

/**
 * Create full text for prompt injection
 * (Rich, formatted text for Mia to reference)
 */
function createFullText(scenario: Scenario): string {
  return `
Title: ${scenario.title}
Category: Lesson ${scenario.lesson} - ${getLessonName(scenario.lesson)}

Context: ${scenario.context}

The Dilemma: ${scenario.dilemma}

Questions I Had:
${scenario.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

What I Learned: ${scenario.learningObjective}

(For ages ${scenario.ageRange[0]}-${scenario.ageRange[1]})
  `.trim();
}

/**
 * Get lesson name from number
 */
function getLessonName(lessonNumber: number): string {
  const lessonNames = {
    1: 'Wellness',
    2: 'Medication Safety',
    3: 'Decision Making',
    4: 'Label Reading',
    5: 'Danger Recognition',
    6: 'Help & Response'
  };
  return lessonNames[lessonNumber as keyof typeof lessonNames] || 'Unknown';
}

// Run the script
uploadScenarios()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
