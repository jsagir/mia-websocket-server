import OpenAI from 'openai';
import { logger } from '../utils/logger';

/**
 * Embedding Service using OpenAI text-embedding-3-small
 *
 * Replaces Hugging Face embeddings (which had permission issues)
 * Cost: $0.02 per 1M tokens (very cheap!)
 * Dimensions: 1536 (compatible with Pinecone)
 */
export class EmbeddingService {
  private openai: OpenAI;
  private model = 'text-embedding-3-small';
  private dimensions = 1024; // Match Pinecone index dimension

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey });
    logger.info('✅ Embedding Service initialized (OpenAI text-embedding-3-small @ 1024 dims)');
  }

  /**
   * Generate embedding vector for text
   * @param text - Text to embed
   * @returns 1536-dimensional vector
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions
      });

      const embedding = response.data[0].embedding;
      logger.debug(`🔢 Generated embedding for text (${text.length} chars → ${embedding.length} dimensions)`);

      return embedding;

    } catch (error) {
      logger.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Batch embed multiple texts (more efficient)
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors
   */
  async batchEmbed(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions
      });

      const embeddings = response.data.map(item => item.embedding);
      logger.info(`🔢 Generated ${embeddings.length} embeddings in batch`);

      return embeddings;

    } catch (error) {
      logger.error('❌ Batch embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      model: this.model,
      dimensions: this.dimensions,
      cost_per_1m_tokens: 0.02
    };
  }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService();
  }
  return embeddingServiceInstance;
}
