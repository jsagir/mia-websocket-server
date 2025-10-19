import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger';

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  text?: string;
  teachingApproaches?: string[];
  languageHint?: string;
}

export interface ConversationContext {
  conversationMode: 'CONTEXT_BASED' | 'ADULT' | 'URGENCY';
  age: number;
  emotionalState?: string;
  keywords?: string[];
  safetyTier: number;
}

/**
 * Context-Based Pinecone Service
 *
 * Aligned with Git changes:
 * - CONTEXT_BASED mode (ages 5-17): 4 teaching approaches
 * - ADULT mode (ages 18+): Educational/fundraising
 * - URGENCY mode: Crisis intervention
 */
export class PineconeContextService {
  private client: Pinecone | null = null;
  private indexName = 'mia-scenarios-knowledge-base';
  private index: any = null;
  private isInitialized: boolean = false;

  // New namespace structure (5 namespaces)
  private namespaces = {
    IDENTITY: 'mia-identity',
    CONTEXT_BASED: 'context-based-content',  // Ages 5-17, 4 approaches
    ADULT: 'adult-content',                   // Ages 18+
    CRISIS: 'crisis-intervention',            // Universal safety
    TECHNIQUES: 'therapeutic-techniques',     // Universal tools
  };

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      logger.warn('⚠️ PINECONE_API_KEY not set - context-based search disabled');
      this.isInitialized = false;
      return;
    }

    try {
      this.client = new Pinecone({ apiKey });
      this.index = this.client.index(this.indexName);
      this.isInitialized = true;

      logger.info('🔍 Context-Based Pinecone Service initialized');
      logger.info(`   Index: ${this.indexName}`);
      logger.info(`   Namespaces: 5 (aligned with CONTEXT_BASED/ADULT/URGENCY modes)`);
    } catch (error) {
      logger.error('🔍 Failed to initialize Pinecone:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Main search entry point
   * Routes to correct namespace based on conversation mode
   */
  async searchRelevantContext(
    query: string,
    context: ConversationContext,
    topK: number = 5
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      logger.warn('🔍 Pinecone not initialized - context-based search disabled');
      return [];
    }

    try {
      // Route based on mode from your Git changes
      switch (context.conversationMode) {
        case 'CONTEXT_BASED':
          return await this.searchContextBased(query, context, topK);

        case 'ADULT':
          return await this.searchAdult(query, context, topK);

        case 'URGENCY':
          return await this.searchCrisis(query, context, topK);

        default:
          return await this.searchContextBased(query, context, topK);
      }
    } catch (error) {
      logger.error('🔍 Search error', { error });
      return [];
    }
  }

  /**
   * CONTEXT_BASED mode search (ages 5-17)
   * Uses 4 teaching approaches: mirror_learning, curious_peer, sharing_experience, direct_teaching
   */
  private async searchContextBased(
    query: string,
    context: ConversationContext,
    topK: number
  ): Promise<SearchResult[]> {

    const filter: any = {
      conversation_mode: 'CONTEXT_BASED',
    };

    // Filter by emotional state if detected
    if (context.emotionalState) {
      filter.emotional_state = { $in: [context.emotionalState] };
    }

    // Safety tier filter
    if (context.safetyTier >= 2) {
      filter.safety_tier = { $lte: context.safetyTier };
    }

    logger.info('🔍 Context-based search', {
      query: query.substring(0, 50),
      age: context.age,
      emotionalState: context.emotionalState,
      keywords: context.keywords,
    });

    const results = await this.index.namespace(this.namespaces.CONTEXT_BASED).query({
      data: query,
      topK,
      includeMetadata: true,
      filter,
    });

    return this.formatResults(results.matches, context.age);
  }

  /**
   * ADULT mode search (ages 18+)
   * Educational and fundraising content
   */
  private async searchAdult(
    query: string,
    context: ConversationContext,
    topK: number
  ): Promise<SearchResult[]> {

    logger.info('🔍 Adult mode search', {
      query: query.substring(0, 50),
      age: context.age,
    });

    const results = await this.index.namespace(this.namespaces.ADULT).query({
      data: query,
      topK,
      includeMetadata: true,
      filter: { conversation_mode: 'ADULT' },
    });

    return this.formatResults(results.matches, context.age);
  }

  /**
   * URGENCY mode search (crisis intervention)
   * Universal safety protocols for all ages
   */
  private async searchCrisis(
    query: string,
    context: ConversationContext,
    topK: number
  ): Promise<SearchResult[]> {

    logger.info('🔍 Crisis intervention search', {
      query: query.substring(0, 50),
      safetyTier: context.safetyTier,
    });

    const results = await this.index.namespace(this.namespaces.CRISIS).query({
      data: query,
      topK,
      includeMetadata: true,
      filter: {
        conversation_mode: 'URGENCY',
        safety_tier: { $gte: context.safetyTier }
      },
    });

    return this.formatResults(results.matches, context.age);
  }

  /**
   * Cascading search across multiple namespaces
   * Includes identity + mode-specific content
   */
  async cascadingSearch(
    query: string,
    context: ConversationContext,
    topK: number = 5
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const namespaces = this.selectNamespacesForCascading(context);

      logger.info('🔍 Cascading search', {
        query: query.substring(0, 50),
        namespaces,
        mode: context.conversationMode,
      });

      // Search all namespaces in parallel
      const searchPromises = namespaces.map(ns => {
        const filter = this.buildFilterForNamespace(ns, context);
        return this.index.namespace(ns).query({
          data: query,
          topK: Math.ceil(topK / namespaces.length) + 2,
          includeMetadata: true,
          filter,
        });
      });

      const results = await Promise.all(searchPromises);

      // Combine and rank by relevance
      const allMatches = results
        .flatMap(result => result.matches)
        .map(match => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata || {},
          text: match.metadata?.searchable_content || '',
          teachingApproaches: match.metadata?.teaching_approaches || [],
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return this.formatResults(allMatches, context.age);
    } catch (error) {
      logger.error('🔍 Cascading search error', { error });
      return [];
    }
  }

  /**
   * Select namespaces for cascading based on mode
   */
  private selectNamespacesForCascading(context: ConversationContext): string[] {
    const namespaces = [this.namespaces.IDENTITY]; // Always include

    switch (context.conversationMode) {
      case 'CONTEXT_BASED':
        namespaces.push(
          this.namespaces.CONTEXT_BASED,
          this.namespaces.TECHNIQUES
        );
        break;

      case 'ADULT':
        namespaces.push(
          this.namespaces.ADULT,
          this.namespaces.TECHNIQUES
        );
        break;

      case 'URGENCY':
        namespaces.push(
          this.namespaces.CRISIS,
          this.namespaces.TECHNIQUES
        );
        break;
    }

    return namespaces;
  }

  /**
   * Build filter for specific namespace
   */
  private buildFilterForNamespace(namespace: string, context: ConversationContext): any {
    const filter: any = {};

    if (namespace === this.namespaces.CONTEXT_BASED) {
      if (context.emotionalState) {
        filter.emotional_state = { $in: [context.emotionalState] };
      }
    }

    if (context.safetyTier >= 2) {
      filter.safety_tier = { $lte: context.safetyTier };
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Format results with age-appropriate language hints
   */
  private formatResults(matches: any[], age: number): SearchResult[] {
    const languageKey = this.getLanguageKey(age);

    return matches.map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata || {},
      text: match.metadata?.searchable_content || match.text || '',
      teachingApproaches: match.metadata?.teaching_approaches || [],
      languageHint: match.metadata?.language_complexity?.[languageKey],
    }));
  }

  /**
   * Get language complexity key based on age
   * Age affects HOW we speak, not WHAT scenarios are available
   */
  private getLanguageKey(age: number): string {
    if (age <= 8) return '5-8';
    if (age <= 12) return '9-12';
    if (age <= 17) return '13-17';
    return '18+';
  }

  /**
   * Get Mia's core identity (always loaded)
   */
  async getCharacterContext(): Promise<string> {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const results = await this.index.namespace(this.namespaces.IDENTITY).query({
        data: 'Mia personality values approach teaching style',
        topK: 5,
        includeMetadata: true,
      });

      return results.matches
        .map((match: any) => match.metadata?.searchable_content || '')
        .filter(Boolean)
        .join('\n\n');
    } catch (error) {
      logger.error('🔍 Error fetching character context', { error });
      return '';
    }
  }

  /**
   * Detect emotional state from user message
   * Used for context-based scenario selection
   */
  detectEmotionalState(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Anxious/worried states
    if (/(anxious|worried|nervous|scared|afraid|panic)/i.test(lowerMessage)) {
      return 'anxious';
    }

    // Sad/upset states
    if (/(sad|depressed|down|upset|hurt|crying)/i.test(lowerMessage)) {
      return 'sad';
    }

    // Angry/frustrated states
    if (/(angry|mad|frustrated|annoyed|hate)/i.test(lowerMessage)) {
      return 'angry';
    }

    // Confused states
    if (/(confused|don't understand|lost|unclear)/i.test(lowerMessage)) {
      return 'confused';
    }

    // Excited/happy states
    if (/(excited|happy|great|awesome|wonderful)/i.test(lowerMessage)) {
      return 'excited';
    }

    return 'calm'; // Default
  }

  /**
   * Extract keywords from user message
   * Used for context-based scenario selection
   */
  extractKeywords(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const keywords: string[] = [];

    // School-related
    if (/(school|homework|test|teacher|class|grade)/i.test(lowerMessage)) {
      keywords.push('school');
    }

    // Friends/social
    if (/(friend|peer|classmate|social|alone|lonely)/i.test(lowerMessage)) {
      keywords.push('friends');
    }

    // Family
    if (/(family|parent|mom|dad|sibling|brother|sister|home)/i.test(lowerMessage)) {
      keywords.push('family');
    }

    // Emotions/feelings
    if (/(feel|feeling|emotion|mood)/i.test(lowerMessage)) {
      keywords.push('emotions');
    }

    // Future/identity
    if (/(future|grow up|career|college|identity|who am i)/i.test(lowerMessage)) {
      keywords.push('identity');
    }

    return keywords.length > 0 ? keywords : ['general'];
  }

  /**
   * Store interaction with context
   */
  async storeInteraction(
    sessionId: string,
    userMessage: string,
    miaResponse: string,
    context: ConversationContext,
    selectedApproach?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const namespace = 'user-interactions';

      const record = {
        id: `${sessionId}-${Date.now()}`,
        searchable_content: `User: ${userMessage}\nMia: ${miaResponse}`,
        metadata: {
          session_id: sessionId,
          conversation_mode: context.conversationMode,
          age: context.age,
          emotional_state: context.emotionalState,
          keywords: context.keywords,
          safety_tier: context.safetyTier,
          teaching_approach_used: selectedApproach,
          timestamp: new Date().toISOString(),
        }
      };

      await this.index.namespace(namespace).upsert([record]);
      logger.info('🔍 Stored interaction', { sessionId, mode: context.conversationMode });
    } catch (error) {
      logger.error('🔍 Error storing interaction', { error });
    }
  }

  /**
   * Health check - test Pinecone connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const stats = await this.index.describeIndexStats();
      logger.info(`🔍 Pinecone health check: ${stats.totalRecordCount || 0} vectors in index`);
      return true;
    } catch (error) {
      logger.error('🔍 Pinecone health check failed:', error);
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

export const pineconeContextService = new PineconeContextService();
