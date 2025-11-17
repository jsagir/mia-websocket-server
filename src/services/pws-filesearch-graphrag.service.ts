import { Client } from '@google/genai';
import { logger } from '../utils/logger';
import * as fs from 'fs';

/**
 * PWS File Search Service with GraphRAG Architecture
 *
 * Implements GraphRAG concepts using multiple specialized File Search stores
 * and rich metadata to simulate graph relationships without a graph database.
 */

export interface CustomMetadata {
  key: string;
  string_value?: string;
  numeric_value?: number;
}

export interface StoreConfig {
  name: string;
  displayName: string;
  description: string;
  chunkingConfig: {
    maxTokensPerChunk: number;
    maxOverlapTokens: number;
  };
}

export class PWSFileSearchGraphRAGService {
  private client: Client;
  private stores: Map<string, string> = new Map(); // storeName -> storeId

  // Store configurations for different content types
  private readonly STORE_CONFIGS: Record<string, StoreConfig> = {
    lectures: {
      name: 'pws-lectures',
      displayName: 'PWS Core Lectures',
      description: 'Core lecture materials (N01-N10)',
      chunkingConfig: {
        maxTokensPerChunk: 800,
        maxOverlapTokens: 200
      }
    },
    frameworks: {
      name: 'pws-frameworks',
      displayName: 'PWS Innovation Frameworks',
      description: 'Innovation frameworks and theories',
      chunkingConfig: {
        maxTokensPerChunk: 600,
        maxOverlapTokens: 150
      }
    },
    problemTypes: {
      name: 'pws-problem-types',
      displayName: 'PWS Problem Types',
      description: 'Un-defined, Ill-defined, Well-defined problem guides',
      chunkingConfig: {
        maxTokensPerChunk: 700,
        maxOverlapTokens: 175
      }
    },
    tools: {
      name: 'pws-tools',
      displayName: 'PWS Tools & Techniques',
      description: 'Practical innovation tools and methodologies',
      chunkingConfig: {
        maxTokensPerChunk: 700,
        maxOverlapTokens: 175
      }
    },
    syllabus: {
      name: 'pws-syllabus',
      displayName: 'PWS Course Structure',
      description: 'Week-by-week syllabus and course organization',
      chunkingConfig: {
        maxTokensPerChunk: 600,
        maxOverlapTokens: 100
      }
    },
    examples: {
      name: 'pws-examples',
      displayName: 'PWS Case Studies & Examples',
      description: 'Real-world applications and case studies',
      chunkingConfig: {
        maxTokensPerChunk: 1000,
        maxOverlapTokens: 200
      }
    },
    references: {
      name: 'pws-references',
      displayName: 'PWS Reference Books',
      description: 'Academic literature and reference materials',
      chunkingConfig: {
        maxTokensPerChunk: 1000,
        maxOverlapTokens: 250
      }
    }
  };

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new Client({ apiKey });
    logger.info('✅ PWS File Search GraphRAG Service initialized');
  }

  /**
   * Initialize all File Search stores
   */
  async initializeStores(): Promise<void> {
    logger.info('🚀 Initializing GraphRAG File Search stores...');

    for (const [storeName, config] of Object.entries(this.STORE_CONFIGS)) {
      try {
        // Check if store already exists in env
        const envStoreKey = `PWS_STORE_${storeName.toUpperCase()}`;
        const existingStoreId = process.env[envStoreKey];

        if (existingStoreId) {
          logger.info(`📦 Using existing store: ${storeName} (${existingStoreId})`);
          this.stores.set(storeName, existingStoreId);
        } else {
          // Create new store
          const store = await this.client.fileSearchStores.create({
            config: { display_name: config.displayName }
          });

          this.stores.set(storeName, store.name);
          logger.info(`✅ Created store: ${storeName} (${store.name})`);
          logger.info(`📝 Add to .env: ${envStoreKey}=${store.name}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to initialize store ${storeName}:`, error);
        throw error;
      }
    }

    logger.info(`✅ All ${this.stores.size} stores initialized`);
  }

  /**
   * Upload document with rich metadata to specified store
   */
  async uploadDocument(
    storeName: string,
    filePath: string,
    metadata: CustomMetadata[],
    displayName?: string
  ): Promise<string> {
    try {
      const storeId = this.stores.get(storeName);
      if (!storeId) {
        throw new Error(`Store ${storeName} not initialized`);
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const config = this.STORE_CONFIGS[storeName];
      logger.info(`📤 Uploading to ${storeName}: ${filePath}`);

      const operation = await this.client.fileSearchStores.upload_to_file_search_store({
        file: filePath,
        file_search_store_name: storeId,
        config: {
          display_name: displayName || filePath.split('/').pop(),
          custom_metadata: metadata,
          chunking_config: {
            white_space_config: {
              max_tokens_per_chunk: config.chunkingConfig.maxTokensPerChunk,
              max_overlap_tokens: config.chunkingConfig.maxOverlapTokens
            }
          }
        }
      });

      // Wait for completion
      let currentOp = operation;
      while (!currentOp.done) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentOp = await this.client.operations.get({ name: currentOp.name });
      }

      logger.info(`✅ Uploaded: ${displayName || filePath}`);
      return operation.name;
    } catch (error) {
      logger.error(`❌ Upload failed: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Federated search across multiple stores
   */
  async federatedSearch(
    storeNames: string[],
    query: string,
    metadataFilter?: string
  ): Promise<any> {
    try {
      const storeIds = storeNames
        .map(name => this.stores.get(name))
        .filter(id => id !== undefined);

      if (storeIds.length === 0) {
        throw new Error('No valid stores found for search');
      }

      logger.info(`🔍 Federated search across: ${storeNames.join(', ')}`);

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: storeIds as string[],
                metadataFilter
              }
            }
          ]
        }
      });

      return response;
    } catch (error) {
      logger.error('❌ Federated search failed:', error);
      throw error;
    }
  }

  /**
   * Search single store with metadata filter
   */
  async searchStore(
    storeName: string,
    query: string,
    metadataFilter?: string
  ): Promise<any> {
    const storeId = this.stores.get(storeName);
    if (!storeId) {
      throw new Error(`Store ${storeName} not found`);
    }

    logger.info(`🔍 Searching ${storeName} for: "${query.substring(0, 50)}..."`);

    return await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeId],
              metadataFilter
            }
          }
        ]
      }
    });
  }

  /**
   * Multi-hop retrieval (simulating graph traversal)
   */
  async multiHopRetrieval(query: string, hops: number = 2): Promise<any[]> {
    const context: any[] = [];

    // Hop 1: Initial search in lectures
    logger.info(`🔗 Hop 1: Searching lectures...`);
    const hop1 = await this.searchStore('lectures', query);
    context.push({ hop: 1, store: 'lectures', result: hop1 });

    // Extract metadata for next hops
    const groundingMetadata = hop1.candidates?.[0]?.groundingMetadata;
    if (!groundingMetadata || hops < 2) {
      return context;
    }

    // Hop 2: Follow framework relationships
    logger.info(`🔗 Hop 2: Searching frameworks...`);
    const hop2 = await this.searchStore('frameworks', query);
    context.push({ hop: 2, store: 'frameworks', result: hop2 });

    // Hop 3: Get examples if requested
    if (hops >= 3) {
      logger.info(`🔗 Hop 3: Searching examples...`);
      const hop3 = await this.searchStore('examples', query);
      context.push({ hop: 3, store: 'examples', result: hop3 });
    }

    return context;
  }

  /**
   * Hierarchical retrieval (general to specific)
   */
  async hierarchicalRetrieval(query: string, specificityLevel: number = 2): Promise<any[]> {
    const context: any[] = [];

    // Level 1: Module overview (syllabus)
    logger.info(`📊 Level 1: Getting module context...`);
    const level1 = await this.searchStore('syllabus', query);
    context.push({ level: 'module', result: level1 });

    // Level 2: Specific lecture
    if (specificityLevel >= 2) {
      logger.info(`📊 Level 2: Getting lecture content...`);
      const level2 = await this.searchStore('lectures', query);
      context.push({ level: 'lecture', result: level2 });
    }

    // Level 3: Framework details
    if (specificityLevel >= 3) {
      logger.info(`📊 Level 3: Getting framework details...`);
      const level3 = await this.searchStore('frameworks', query);
      context.push({ level: 'framework', result: level3 });
    }

    // Level 4: Examples
    if (specificityLevel >= 4) {
      logger.info(`📊 Level 4: Getting examples...`);
      const level4 = await this.searchStore('examples', query);
      context.push({ level: 'example', result: level4 });
    }

    return context;
  }

  /**
   * Get all store names
   */
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Get store ID by name
   */
  getStoreId(storeName: string): string | undefined {
    return this.stores.get(storeName);
  }

  /**
   * Get Gemini client
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get health status for all stores
   */
  async getHealthStatus(): Promise<any> {
    const storeStatuses: Record<string, any> = {};

    for (const [name, id] of this.stores.entries()) {
      try {
        const store = await this.client.fileSearchStores.get({ name: id });
        storeStatuses[name] = {
          status: 'healthy',
          storeId: id,
          displayName: store.displayName
        };
      } catch (error) {
        storeStatuses[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return {
      status: Object.values(storeStatuses).every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
      stores: storeStatuses,
      totalStores: this.stores.size
    };
  }
}

// Singleton instance
let pwsFileSearchGraphRAGService: PWSFileSearchGraphRAGService | null = null;

export function getPWSFileSearchGraphRAGService(): PWSFileSearchGraphRAGService {
  if (!pwsFileSearchGraphRAGService) {
    pwsFileSearchGraphRAGService = new PWSFileSearchGraphRAGService();
  }
  return pwsFileSearchGraphRAGService;
}
