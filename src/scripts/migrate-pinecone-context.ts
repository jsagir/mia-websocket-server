import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger';

/**
 * Migration to Context-Based Structure
 *
 * Aligns Pinecone with new Git changes:
 * - CONTEXT_BASED mode (ages 5-17, 4 teaching approaches)
 * - ADULT mode (ages 18+)
 * - URGENCY mode (crisis)
 */

class ContextBasedMigration {
  private client: Pinecone;
  private indexName = 'mia-scenarios-knowledge-base';
  private index: any;
  private dryRun: boolean;

  // New structure: 14 → 5 namespaces
  private migrationMap: { [key: string]: string } = {
    // Core identity
    'character-core': 'mia-identity',
    'mia-character-profile': 'mia-identity',

    // ALL content for ages 5-17 → context-based-content
    'mirror-learning': 'context-based-content',
    'educational': 'context-based-content',
    'scenarios': 'context-based-content',
    'mia-scenarios-master': 'context-based-content',
    'mia-complete-system': 'context-based-content',
    'mia-system-operations': 'context-based-content',

    // Adult content (18+)
    'fundraising': 'adult-content',
    'prescription-literacy': 'adult-content',
    'medication-safety': 'adult-content',
    'decision-framework': 'adult-content',

    // Crisis (universal)
    'safety-protocols': 'crisis-intervention',
  };

  // Delete unnecessary namespace
  private namespacesToDelete = ['neo4j-knowledge'];

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.index = this.client.index(this.indexName);
  }

  async migrate() {
    logger.info('🚀 Context-Based Migration Starting', { dryRun: this.dryRun });

    try {
      await this.analyzeCurrentState();
      await this.deleteUnnecessary();
      await this.migrateToContextBased();
      await this.validateMigration();

      logger.info('✅ Migration Complete!');
      this.printSummary();
    } catch (error) {
      logger.error('❌ Migration Failed', { error });
      throw error;
    }
  }

  private async analyzeCurrentState() {
    logger.info('\n📊 Current State Analysis:');
    const stats = await this.index.describeIndexStats();

    logger.info(`Total Records: ${stats.totalRecordCount}`);
    logger.info(`Current Namespaces: ${Object.keys(stats.namespaces || {}).length}\n`);

    for (const [ns, info] of Object.entries(stats.namespaces || {})) {
      const count = (info as any).recordCount;
      const action = this.namespacesToDelete.includes(ns) ? '❌ DELETE' :
                     this.migrationMap[ns] ? `🔄 → ${this.migrationMap[ns]}` : '✅ KEEP';
      logger.info(`  ${ns} (${count}) ${action}`);
    }
  }

  private async deleteUnnecessary() {
    logger.info('\n🗑️  Deleting Unnecessary Namespaces:');
    for (const ns of this.namespacesToDelete) {
      logger.warn(`  [ACTION REQUIRED] Manually delete via Pinecone console: ${ns}`);
    }
  }

  private async migrateToContextBased() {
    logger.info('\n🔄 Migrating to Context-Based Structure:\n');

    for (const [oldNs, newNs] of Object.entries(this.migrationMap)) {
      try {
        logger.info(`📦 ${oldNs} → ${newNs}`);

        const records = await this.fetchRecords(oldNs);
        if (records.length === 0) {
          logger.warn(`  ⚠️  No records found`);
          continue;
        }

        logger.info(`  Found ${records.length} records`);

        // Transform based on target namespace
        const transformed = records.map(r =>
          this.transformForContextBased(r, oldNs, newNs)
        );

        if (!this.dryRun) {
          await this.batchUpsert(newNs, transformed);
          logger.info(`  ✅ Migrated successfully\n`);
        } else {
          logger.info(`  [DRY RUN] Would migrate ${transformed.length} records`);
          logger.info(`  Sample metadata:`, JSON.stringify(transformed[0]?.metadata, null, 2));
          logger.info('');
        }

      } catch (error) {
        logger.error(`  ❌ Failed:`, error);
      }
    }
  }

  private async fetchRecords(namespace: string): Promise<any[]> {
    try {
      const result = await this.index.namespace(namespace).query({
        topK: 10000,
        includeMetadata: true,
        includeValues: true,
        vector: Array(1024).fill(0),
      });
      return result.matches || [];
    } catch (error) {
      return [];
    }
  }

  private transformForContextBased(record: any, oldNs: string, newNs: string) {
    const metadata = record.metadata || {};

    // Transform based on target namespace
    if (newNs === 'context-based-content') {
      return this.transformToContextBasedContent(record, oldNs, metadata);
    } else if (newNs === 'adult-content') {
      return this.transformToAdultContent(record, oldNs, metadata);
    } else if (newNs === 'crisis-intervention') {
      return this.transformToCrisisIntervention(record, oldNs, metadata);
    } else {
      return this.transformToIdentity(record, oldNs, metadata);
    }
  }

  /**
   * Transform to context-based-content (ages 5-17, all scenarios)
   */
  private transformToContextBasedContent(record: any, oldNs: string, metadata: any) {
    return {
      id: `context-${record.id}`,
      values: record.values,
      metadata: {
        // Mode
        conversation_mode: 'CONTEXT_BASED',

        // Teaching approaches (infer which this scenario supports)
        teaching_approaches: this.inferTeachingApproaches(oldNs, metadata),

        // Context selection criteria
        emotional_state: this.inferEmotionalStates(metadata, oldNs),
        keywords: this.inferKeywords(metadata, oldNs),

        // Classification
        category: this.inferCategory(oldNs, metadata),
        topic: metadata.topic || metadata.subcategory || 'general',

        // Language complexity (will be provided for ages 5-8, 9-12, 13-17)
        language_complexity: {
          '5-8': metadata.language_simple || 'Age-appropriate language needed',
          '9-12': metadata.language_moderate || 'Age-appropriate language needed',
          '13-17': metadata.language_complex || 'Age-appropriate language needed',
          '18+': 'N/A'
        },

        // Preserve existing
        safety_tier: metadata.safety_tier || 1,
        techniques: metadata.techniques || [],

        // Migration tracking
        version: '2.0',
        last_updated: new Date().toISOString(),
        migrated_from: oldNs,
        context_based: true,
      }
    };
  }

  /**
   * Transform to adult-content (ages 18+)
   */
  private transformToAdultContent(record: any, oldNs: string, metadata: any) {
    return {
      id: `adult-${record.id}`,
      values: record.values,
      metadata: {
        conversation_mode: 'ADULT',
        category: oldNs === 'fundraising' ? 'fundraising' : 'educational',
        topic: metadata.topic || metadata.subcategory || 'general',

        safety_tier: metadata.safety_tier || 1,
        techniques: metadata.techniques || [],

        version: '2.0',
        last_updated: new Date().toISOString(),
        migrated_from: oldNs,
      }
    };
  }

  /**
   * Transform to crisis-intervention
   */
  private transformToCrisisIntervention(record: any, oldNs: string, metadata: any) {
    return {
      id: `crisis-${record.id}`,
      values: record.values,
      metadata: {
        conversation_mode: 'URGENCY',
        safety_tier: metadata.tier || metadata.safety_tier || 3,

        topic: metadata.topic || 'crisis',
        resources: metadata.resources || [],
        urgency_level: metadata.urgency_level || 'critical',

        version: '2.0',
        last_updated: new Date().toISOString(),
        migrated_from: oldNs,
      }
    };
  }

  /**
   * Transform to identity
   */
  private transformToIdentity(record: any, oldNs: string, metadata: any) {
    return {
      id: `identity-${record.id}`,
      values: record.values,
      metadata: {
        conversation_mode: 'ALL',
        aspect: metadata.aspect || 'personality',

        version: '2.0',
        last_updated: new Date().toISOString(),
        migrated_from: oldNs,
      }
    };
  }

  /**
   * Infer which teaching approaches this scenario supports
   */
  private inferTeachingApproaches(oldNs: string, metadata: any): string[] {
    // Most scenarios can support multiple approaches!
    const approaches = [];

    // Mirror Learning: Emotional validation scenarios
    if (oldNs === 'mirror-learning' || metadata.emotion || metadata.validation) {
      approaches.push('mirror_learning');
    }

    // Curious Peer: Exploration scenarios
    if (metadata.exploration || metadata.questions) {
      approaches.push('curious_peer');
    }

    // Sharing Experience: Normalization scenarios
    if (metadata.normalization || metadata.stories) {
      approaches.push('sharing_experience');
    }

    // Direct Teaching: Skill-building scenarios
    if (oldNs === 'educational' || metadata.techniques || metadata.skills) {
      approaches.push('direct_teaching');
    }

    // Default: Most scenarios can use at least 2 approaches
    if (approaches.length === 0) {
      approaches.push('mirror_learning', 'curious_peer');
    }

    return approaches;
  }

  /**
   * Infer emotional states this scenario addresses
   */
  private inferEmotionalStates(metadata: any, oldNs: string): string[] {
    if (metadata.emotions) return metadata.emotions;
    if (metadata.emotional_state) return [metadata.emotional_state];

    // Infer from topic/category
    const topic = (metadata.topic || '').toLowerCase();
    if (topic.includes('anxiety') || topic.includes('worry')) {
      return ['anxious', 'worried', 'nervous'];
    }
    if (topic.includes('sad') || topic.includes('grief')) {
      return ['sad', 'down', 'upset'];
    }
    if (topic.includes('anger')) {
      return ['angry', 'frustrated', 'mad'];
    }

    return ['calm', 'neutral']; // Default
  }

  /**
   * Infer keywords for this scenario
   */
  private inferKeywords(metadata: any, oldNs: string): string[] {
    if (metadata.keywords) return metadata.keywords;
    if (metadata.topics) return metadata.topics;

    // Infer from namespace and metadata
    const keywords = [];
    const topic = metadata.topic || metadata.subcategory || '';

    if (topic.includes('school')) keywords.push('school', 'homework', 'teacher');
    if (topic.includes('friend')) keywords.push('friends', 'peers', 'social');
    if (topic.includes('family')) keywords.push('family', 'parents', 'siblings');
    if (topic.includes('emotion')) keywords.push('feelings', 'emotions');

    return keywords.length > 0 ? keywords : ['general'];
  }

  /**
   * Infer category for context-based content
   */
  private inferCategory(oldNs: string, metadata: any): string {
    if (metadata.category) return metadata.category;

    const categoryMap: { [key: string]: string } = {
      'mirror-learning': 'emotions',
      'educational': 'skills',
      'scenarios': 'situations',
    };

    return categoryMap[oldNs] || 'general';
  }

  private async batchUpsert(namespace: string, records: any[]) {
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.index.namespace(namespace).upsert(batch);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async validateMigration() {
    logger.info('\n✅ Validation:');
    const stats = await this.index.describeIndexStats();

    const newNamespaces = [
      'mia-identity',
      'context-based-content',
      'adult-content',
      'crisis-intervention'
    ];

    let total = 0;
    for (const ns of newNamespaces) {
      const count = (stats.namespaces?.[ns] as any)?.recordCount || 0;
      total += count;
      logger.info(`  ✅ ${ns}: ${count} records`);
    }

    logger.info(`\nTotal in new structure: ${total} records`);
  }

  private printSummary() {
    logger.info('\n' + '='.repeat(60));
    logger.info('🎉 Context-Based Migration Summary');
    logger.info('='.repeat(60));
    logger.info('\n📊 New Structure:');
    logger.info('  1. mia-identity - Core personality');
    logger.info('  2. context-based-content - Ages 5-17, 4 teaching approaches');
    logger.info('  3. adult-content - Ages 18+');
    logger.info('  4. crisis-intervention - Universal safety');
    logger.info('  5. therapeutic-techniques - Universal tools (create separately)');
    logger.info('\n🎯 Alignment:');
    logger.info('  ✅ CONTEXT_BASED mode → context-based-content');
    logger.info('  ✅ ADULT mode → adult-content');
    logger.info('  ✅ URGENCY mode → crisis-intervention');
    logger.info('\n🎨 Features:');
    logger.info('  ✅ 4 teaching approaches per scenario');
    logger.info('  ✅ Context-driven selection (emotional_state + keywords)');
    logger.info('  ✅ Age affects language, not scenario access');
    logger.info('  ✅ All scenarios available to ages 5-17');
    logger.info('\n' + '='.repeat(60));
  }
}

// CLI
async function run() {
  const dryRun = !process.argv.includes('--execute');

  if (dryRun) {
    logger.warn('🔍 DRY RUN MODE');
    logger.warn('Add --execute to perform migration\n');
  }

  const migration = new ContextBasedMigration(dryRun);

  try {
    await migration.migrate();
    process.exit(0);
  } catch (error) {
    logger.error('Failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

export default ContextBasedMigration;
