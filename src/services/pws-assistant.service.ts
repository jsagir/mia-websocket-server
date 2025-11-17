import { getPWSFileSearchService } from './pws-filesearch.service';
import { getPWSSystemPrompt } from '../prompts/pws-system-prompt';
import { logger } from '../utils/logger';
import type { GenerateContentConfig } from '@google/genai/types';

/**
 * PWS Assistant Service
 * Provides RAG-enhanced responses using Gemini File Search
 * Embodies Lawrence Aronhime's teaching philosophy
 */
export class PWSAssistantService {
  private fileSearchService = getPWSFileSearchService();

  constructor() {
    logger.info('✅ PWS Assistant Service initialized');
  }

  /**
   * Generate a response to a student query using RAG
   */
  async generateResponse(params: {
    query: string;
    conversationHistory?: Array<{ role: 'user' | 'model'; content: string }>;
    metadata?: {
      problemType?: 'undefined' | 'ill-defined' | 'well-defined';
      module?: string;
      needsCitation?: boolean;
    };
  }): Promise<{
    response: string;
    citations?: Array<{
      source: string;
      content: string;
      metadata?: Record<string, any>;
    }>;
  }> {
    try {
      const { query, conversationHistory = [], metadata } = params;

      logger.info(`📚 PWS Query: "${query.substring(0, 100)}..."`);

      // Get the client and store name
      const client = this.fileSearchService.getClient();
      const storeName = this.fileSearchService.getFileSearchStoreName();

      if (!storeName) {
        throw new Error('File Search store not configured. Please set PWS_FILE_SEARCH_STORE_NAME in .env');
      }

      // Build conversation messages
      const messages: any[] = [];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          parts: [{ text: msg.content }]
        });
      });

      // Add current query
      messages.push({
        role: 'user',
        parts: [{ text: query }]
      });

      // Configure File Search tool
      const config: GenerateContentConfig = {
        systemInstruction: getPWSSystemPrompt(),
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName]
            }
          }
        ],
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048
      };

      // Add metadata filtering if provided
      if (metadata?.module || metadata?.problemType) {
        const filters: string[] = [];
        if (metadata.module) {
          filters.push(`module='${metadata.module}'`);
        }
        if (metadata.problemType) {
          filters.push(`topic='${metadata.problemType}'`);
        }
        if (filters.length > 0 && config.tools?.[0]?.fileSearch) {
          config.tools[0].fileSearch.metadataFilter = filters.join(' AND ');
        }
      }

      // Generate response
      logger.info('🤖 Generating response with File Search...');
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: messages,
        config
      });

      const responseText = response.text || '';

      // Extract citations from grounding metadata
      const citations: Array<{
        source: string;
        content: string;
        metadata?: Record<string, any>;
      }> = [];

      if (response.candidates?.[0]?.groundingMetadata) {
        const groundingMetadata = response.candidates[0].groundingMetadata;
        logger.info('📖 Citations found:', groundingMetadata);

        // Process grounding chunks if available
        if (groundingMetadata.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((chunk: any) => {
            citations.push({
              source: chunk.web?.uri || chunk.retrievedContext?.uri || 'Unknown',
              content: chunk.web?.title || chunk.retrievedContext?.title || '',
              metadata: chunk
            });
          });
        }
      }

      logger.info(`✅ PWS Response generated (${responseText.length} chars, ${citations.length} citations)`);

      return {
        response: responseText,
        citations: citations.length > 0 ? citations : undefined
      };
    } catch (error) {
      logger.error('❌ PWS Assistant Error:', error);
      throw error;
    }
  }

  /**
   * Get a quick answer without conversation history (for simple queries)
   */
  async quickAnswer(query: string): Promise<string> {
    const result = await this.generateResponse({ query });
    return result.response;
  }

  /**
   * Analyze a student's problem and classify it
   */
  async classifyProblem(problemDescription: string): Promise<{
    problemType: 'undefined' | 'ill-defined' | 'well-defined';
    reasoning: string;
    recommendedTools: string[];
    relevantLectures: string[];
  }> {
    const classificationQuery = `
Analyze this problem and classify it according to the PWS framework:

"${problemDescription}"

Provide:
1. Problem type classification (Un-defined, Ill-defined, or Well-defined)
2. Your reasoning for this classification
3. Recommended tools from the curriculum
4. Relevant lecture references (N01-N10)

Format your response as JSON.
    `.trim();

    try {
      const response = await this.quickAnswer(classificationQuery);

      // Try to parse JSON response
      // Note: This is a simplified implementation. In production, you'd want more robust parsing
      return {
        problemType: 'ill-defined', // Default fallback
        reasoning: response,
        recommendedTools: [],
        relevantLectures: []
      };
    } catch (error) {
      logger.error('❌ Problem classification failed:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const storeName = this.fileSearchService.getFileSearchStoreName();
      if (!storeName) {
        return {
          status: 'unhealthy',
          details: { error: 'File Search store not configured' }
        };
      }

      const store = await this.fileSearchService.getFileSearchStore(storeName);
      return {
        status: 'healthy',
        details: {
          gemini: 'connected',
          fileSearchStore: storeName,
          storeDetails: store
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Singleton instance
let pwsAssistantService: PWSAssistantService | null = null;

export function getPWSAssistantService(): PWSAssistantService {
  if (!pwsAssistantService) {
    pwsAssistantService = new PWSAssistantService();
  }
  return pwsAssistantService;
}
