import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddingService } from './embedding.service';
import { logger } from '../utils/logger';

/**
 * Retrieved Scenario from Pinecone
 */
export interface RetrievedScenario {
  id: string;
  lesson: number;
  title: string;
  context: string;
  dilemma: string;
  questions: string[];
  learningObjective: string;
  ageRange: string;
  fullText: string;
  relevanceScore: number;
}

/**
 * Scenario Retrieval Service
 *
 * Queries Pinecone using semantic search to find relevant scenarios
 * based on user's message context.
 *
 * Architecture:
 * 1. Embed user message using OpenAI
 * 2. Query Pinecone for top-K most similar scenarios
 * 3. Return formatted scenario text for prompt injection
 */
export class ScenarioRetrievalService {
  private pinecone: Pinecone;
  private index: any;
  private namespace = 'mia-scenarios';
  private embedder = getEmbeddingService();

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !indexName) {
      throw new Error('PINECONE_API_KEY and PINECONE_INDEX_NAME are required');
    }

    this.pinecone = new Pinecone({ apiKey });
    this.index = this.pinecone.index(indexName);

    logger.info(`✅ Scenario Retrieval Service initialized (index: ${indexName}, namespace: ${this.namespace})`);
  }

  /**
   * Retrieve most relevant scenarios based on user message
   *
   * @param userMessage - The user's message to find relevant scenarios for
   * @param topK - Number of scenarios to retrieve (default: 3)
   * @param minScore - Minimum relevance score (0-1, default: 0.7)
   * @returns Array of retrieved scenarios
   */
  async retrieveScenarios(
    userMessage: string,
    topK: number = 3,
    minScore: number = 0.7
  ): Promise<RetrievedScenario[]> {
    try {
      logger.info(`🔍 Retrieving scenarios for: "${userMessage.substring(0, 60)}..."`);

      // 1. Generate embedding for user message
      const embedding = await this.embedder.embed(userMessage);

      // 2. Query Pinecone
      const queryResponse = await this.index.namespace(this.namespace).query({
        vector: embedding,
        topK,
        includeMetadata: true
      });

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        logger.warn('⚠️ No scenarios found in Pinecone');
        return [];
      }

      // 3. Filter by minimum score and format results
      const scenarios: RetrievedScenario[] = queryResponse.matches
        .filter((match: any) => match.score >= minScore)
        .map((match: any) => ({
          id: match.id,
          lesson: match.metadata.lesson,
          title: match.metadata.title,
          context: match.metadata.context,
          dilemma: match.metadata.dilemma,
          questions: match.metadata.questions ? match.metadata.questions.split(' | ') : [],
          learningObjective: match.metadata.learningObjective,
          ageRange: match.metadata.ageRange,
          fullText: match.metadata.fullText,
          relevanceScore: match.score
        }));

      // 4. Log results
      logger.info(`✅ Retrieved ${scenarios.length} scenarios (score >= ${minScore}):`);
      scenarios.forEach((s, i) => {
        logger.info(`  ${i + 1}. [${s.id}] ${s.title} (score: ${s.relevanceScore.toFixed(3)})`);
      });

      return scenarios;

    } catch (error) {
      logger.error('❌ Pinecone retrieval error:', error);
      return [];
    }
  }

  /**
   * Format retrieved scenarios for prompt injection
   *
   * Converts scenario objects into formatted text that can be
   * added to the system prompt as "Scenario Memory"
   *
   * @param scenarios - Array of retrieved scenarios
   * @returns Formatted string for prompt
   */
  formatScenariosForPrompt(scenarios: RetrievedScenario[]): string {
    if (scenarios.length === 0) {
      return '';
    }

    return scenarios.map((s, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMORY ${i + 1}: ${s.title} (Lesson ${s.lesson})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context: ${s.context}

The Dilemma: ${s.dilemma}

Key Questions:
${s.questions.map((q, idx) => `  ${idx + 1}. ${q}`).join('\n')}

What I Learned: ${s.learningObjective}

(Relevance: ${(s.relevanceScore * 100).toFixed(1)}%)
    `.trim()).join('\n\n');
  }

  /**
   * Get retrieval statistics
   */
  async getStats(): Promise<any> {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        namespace: this.namespace,
        totalVectors: stats.namespaces?.[this.namespace]?.vectorCount || 0,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness
      };
    } catch (error) {
      logger.error('❌ Failed to get Pinecone stats:', error);
      return null;
    }
  }
}

// Singleton instance
let retrievalServiceInstance: ScenarioRetrievalService | null = null;

export function getScenarioRetrievalService(): ScenarioRetrievalService {
  if (!retrievalServiceInstance) {
    retrievalServiceInstance = new ScenarioRetrievalService();
  }
  return retrievalServiceInstance;
}
