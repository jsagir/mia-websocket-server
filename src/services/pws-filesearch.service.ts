import { Client } from '@google/genai';
import { logger } from '../utils/logger';
import * as fs from 'fs';

/**
 * PWS File Search Service
 * Manages Gemini File Search store for PWS curriculum materials
 */
export class PWSFileSearchService {
  private client: Client;
  private fileSearchStoreName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new Client({ apiKey });
    this.fileSearchStoreName = process.env.PWS_FILE_SEARCH_STORE_NAME || '';

    logger.info('✅ PWS File Search Service initialized');
  }

  /**
   * Create a new File Search store for PWS curriculum
   */
  async createFileSearchStore(displayName: string = 'PWS Curriculum Store'): Promise<string> {
    try {
      logger.info(`Creating File Search store: ${displayName}`);

      const fileSearchStore = await this.client.fileSearchStores.create({
        config: { display_name: displayName }
      });

      logger.info(`✅ File Search store created: ${fileSearchStore.name}`);
      return fileSearchStore.name;
    } catch (error) {
      logger.error('❌ Failed to create File Search store:', error);
      throw error;
    }
  }

  /**
   * Upload a file directly to File Search store
   */
  async uploadToFileSearchStore(
    filePath: string,
    metadata: {
      displayName?: string;
      module?: string;
      topic?: string;
      difficulty?: 'foundational' | 'intermediate' | 'advanced';
      framework?: string;
      lectureNumber?: string;
    }
  ): Promise<string> {
    try {
      logger.info(`Uploading file to File Search store: ${filePath}`);

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Ensure we have a store name
      if (!this.fileSearchStoreName) {
        throw new Error('PWS_FILE_SEARCH_STORE_NAME not configured');
      }

      // Build custom metadata
      const customMetadata: any[] = [];
      if (metadata.module) {
        customMetadata.push({ key: 'module', string_value: metadata.module });
      }
      if (metadata.topic) {
        customMetadata.push({ key: 'topic', string_value: metadata.topic });
      }
      if (metadata.difficulty) {
        customMetadata.push({ key: 'difficulty', string_value: metadata.difficulty });
      }
      if (metadata.framework) {
        customMetadata.push({ key: 'framework', string_value: metadata.framework });
      }
      if (metadata.lectureNumber) {
        customMetadata.push({ key: 'lecture', string_value: metadata.lectureNumber });
      }

      // Upload and import file
      const operation = await this.client.fileSearchStores.upload_to_file_search_store({
        file: filePath,
        file_search_store_name: this.fileSearchStoreName,
        config: {
          display_name: metadata.displayName || filePath.split('/').pop(),
          custom_metadata: customMetadata,
          chunking_config: {
            white_space_config: {
              max_tokens_per_chunk: 500,
              max_overlap_tokens: 50
            }
          }
        }
      });

      // Wait for operation to complete
      let currentOp = operation;
      while (!currentOp.done) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentOp = await this.client.operations.get({ name: currentOp.name });
      }

      logger.info(`✅ File uploaded and indexed: ${filePath}`);
      return operation.name;
    } catch (error) {
      logger.error(`❌ Failed to upload file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * List all File Search stores
   */
  async listFileSearchStores(): Promise<any[]> {
    try {
      const stores = [];
      for await (const store of this.client.fileSearchStores.list()) {
        stores.push(store);
      }
      return stores;
    } catch (error) {
      logger.error('❌ Failed to list File Search stores:', error);
      throw error;
    }
  }

  /**
   * Get a specific File Search store
   */
  async getFileSearchStore(name: string): Promise<any> {
    try {
      return await this.client.fileSearchStores.get({ name });
    } catch (error) {
      logger.error(`❌ Failed to get File Search store ${name}:`, error);
      throw error;
    }
  }

  /**
   * Delete a File Search store
   */
  async deleteFileSearchStore(name: string): Promise<void> {
    try {
      await this.client.fileSearchStores.delete({ name, config: { force: true } });
      logger.info(`✅ File Search store deleted: ${name}`);
    } catch (error) {
      logger.error(`❌ Failed to delete File Search store ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get the configured File Search store name
   */
  getFileSearchStoreName(): string {
    return this.fileSearchStoreName;
  }

  /**
   * Set the File Search store name (useful for testing or switching stores)
   */
  setFileSearchStoreName(name: string): void {
    this.fileSearchStoreName = name;
    logger.info(`File Search store name set to: ${name}`);
  }

  /**
   * Get the Gemini client (for use by other services)
   */
  getClient(): Client {
    return this.client;
  }
}

// Singleton instance
let pwsFileSearchService: PWSFileSearchService | null = null;

export function getPWSFileSearchService(): PWSFileSearchService {
  if (!pwsFileSearchService) {
    pwsFileSearchService = new PWSFileSearchService();
  }
  return pwsFileSearchService;
}
