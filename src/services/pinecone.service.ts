import { Pinecone } from '@pinecone-database/pinecone';
import { HfInference } from '@huggingface/inference';
import { logger } from '../utils/logger';
import { Scenario } from './dialogue.service';

export class PineconeScenarioMatcher {
  private pinecone: Pinecone | null = null;
  private hf: HfInference | null = null;
  private indexName: string;
  private namespace: string;
  private embeddingModel: string = 'intfloat/multilingual-e5-large'; // 1024 dimensions
  private isInitialized: boolean = false;

  constructor() {
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const hfToken = process.env.HF_TOKEN;

    this.indexName = process.env.PINECONE_INDEX_NAME || 'mia-scenarios-knowledge-base';
    this.namespace = process.env.PINECONE_NAMESPACE || '';

    if (!pineconeApiKey) {
      logger.warn('⚠️ PINECONE_API_KEY not set - semantic search disabled');
      this.isInitialized = false;
      return;
    }

    if (!hfToken) {
      logger.warn('⚠️ HF_TOKEN not set - semantic search disabled');
      this.isInitialized = false;
      return;
    }

    this.pinecone = new Pinecone({
      apiKey: pineconeApiKey,
    });

    this.hf = new HfInference(hfToken);

    logger.info(`🔍 Pinecone initialized: Index="${this.indexName}", Namespace="${this.namespace || 'default'}"`);
    logger.info(`🤗 Hugging Face initialized: Model="${this.embeddingModel}" (1024 dimensions)`);
    this.isInitialized = true;
  }

  /**
   * Find the most relevant scenario based on conversation context
   */
  async findBestScenario(
    conversationHistory: Array<{ role: string; content: string }>,
    completedScenarios: string[],
    userAge: number | null,
    currentIntent: string
  ): Promise<Scenario | null> {
    if (!this.isInitialized) {
      logger.warn('🔍 Pinecone not initialized - falling back to random selection');
      return null;
    }

    try {
      // 1. Build context from conversation history (last 5 turns)
      const recentHistory = conversationHistory.slice(-5);
      const contextParts = [
        userAge ? `User age: ${userAge}` : '',
        `Current topic: ${currentIntent}`,
        ...recentHistory.map(msg => `${msg.role}: ${msg.content}`)
      ].filter(Boolean);

      const contextString = contextParts.join('\n');

      logger.info(`🔍 Pinecone search context:\n${contextString}`);

      // 2. Embed the context using OpenAI
      const embedding = await this.embedText(contextString);

      // 3. Query Pinecone for most similar scenarios
      if (!this.pinecone) {
        logger.error('❌ Pinecone client not initialized');
        return null;
      }

      const index = this.pinecone.index(this.indexName);
      const queryResponse = await index.namespace(this.namespace).query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      });

      logger.info(`🔍 Pinecone returned ${queryResponse.matches?.length || 0} matches`);

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        logger.warn('🔍 No Pinecone matches found');
        return null;
      }

      // 4. Filter out completed scenarios and find best match
      const availableMatches = queryResponse.matches.filter(match => {
        const scenarioId = match.id;
        const isCompleted = completedScenarios.includes(scenarioId);
        if (isCompleted) {
          logger.info(`🔍 Filtered out completed scenario: ${scenarioId}`);
        }
        return !isCompleted;
      });

      if (availableMatches.length === 0) {
        logger.warn('🔍 All matching scenarios already completed');
        return null;
      }

      const bestMatch = availableMatches[0];
      const similarity = bestMatch.score || 0;

      logger.info(`🔍 Best match: ${bestMatch.id} (similarity: ${(similarity * 100).toFixed(1)}%)`);

      // 5. Parse scenario from metadata
      if (!bestMatch.metadata) {
        logger.warn('🔍 Best match has no metadata');
        return null;
      }

      const scenario = this.parseScenarioFromMetadata(bestMatch.id, bestMatch.metadata);

      if (scenario) {
        logger.info(`✅ Pinecone selected scenario: ${scenario.id} - "${scenario.title}"`);
      }

      return scenario;
    } catch (error) {
      logger.error('❌ Pinecone search error:', error);
      return null;
    }
  }

  /**
   * Embed text using Hugging Face multilingual-e5-large model
   */
  private async embedText(text: string): Promise<number[]> {
    if (!this.hf) {
      throw new Error('Hugging Face client not initialized');
    }

    try {
      // Use feature extraction endpoint for embeddings
      const response = await this.hf.featureExtraction({
        model: this.embeddingModel,
        inputs: text,
      });

      // Response is already an array of numbers (embedding vector)
      if (Array.isArray(response) && typeof response[0] === 'number') {
        logger.info(`🤗 Generated embedding: ${response.length} dimensions`);
        return response as number[];
      }

      // Handle nested array format
      if (Array.isArray(response) && Array.isArray(response[0])) {
        logger.info(`🤗 Generated embedding: ${(response[0] as number[]).length} dimensions`);
        return response[0] as number[];
      }

      throw new Error('Unexpected embedding response format');
    } catch (error) {
      logger.error('❌ Hugging Face embedding error:', error);
      throw error;
    }
  }

  /**
   * Parse scenario from Pinecone metadata
   */
  private parseScenarioFromMetadata(id: string, metadata: any): Scenario | null {
    try {
      const scenario: Scenario = {
        id: id,
        lesson: metadata.lesson || 0,
        number: metadata.number || 0,
        title: metadata.title || '',
        context: metadata.context || '',
        dilemma: metadata.dilemma || '',
        questions: Array.isArray(metadata.questions)
          ? metadata.questions
          : (metadata.questions || '').split('|||'), // Handle string or array
        learningObjective: metadata.learningObjective || '',
        ageRange: metadata.ageRange || [5, 12],
      };

      return scenario;
    } catch (error) {
      logger.error('❌ Error parsing scenario metadata:', error);
      return null;
    }
  }

  /**
   * Health check - test Pinecone connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized || !this.pinecone) return false;

    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();

      logger.info(`🔍 Pinecone health check: ${stats.totalRecordCount || 0} vectors in index`);
      return true;
    } catch (error) {
      logger.error('❌ Pinecone health check failed:', error);
      return false;
    }
  }

  /**
   * Check if Pinecone is enabled and working
   */
  isEnabled(): boolean {
    return this.isInitialized;
  }
}

export const pineconeScenarioMatcher = new PineconeScenarioMatcher();
