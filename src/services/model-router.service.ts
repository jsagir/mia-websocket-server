import { logger } from '../utils/logger';

/**
 * Model routing choices
 *
 * Note: Currently both use GPT-4o, but with different temperature/parameters
 * Future: Could route to Claude 3.5 Sonnet for empathy mode
 */
export type ModelChoice = 'gpt-4o-empathy' | 'gpt-4o-safety';

export interface RoutingContext {
  userMessage: string;
  conversationMode: 'GREETING' | 'CONTEXT_BASED' | 'ADULT';
  conversationTurn: number;
  userAge: number | null;
}

/**
 * Model Router Service
 *
 * Routes messages to appropriate model/mode based on content and context:
 *
 * GPT-4o Empathy Mode (80% of traffic):
 * - Normal conversation (warm, emotional, peer-level)
 * - Scenario delivery (storytelling)
 * - Mirror Learning dialogue
 * - Rapport building
 * - Temperature: 0.8 (more creative, warmer)
 *
 * GPT-4o Safety Mode (20% of traffic):
 * - Safety emergencies (crisis detection)
 * - Complex reasoning (ethical dilemmas)
 * - ADULT mode (fundraising, explanations)
 * - Technical questions
 * - Temperature: 0.6 (more focused, logical)
 */
export class ModelRouterService {

  /**
   * Route message to appropriate model/mode
   */
  route(context: RoutingContext): ModelChoice {
    const { userMessage, conversationMode, conversationTurn, userAge } = context;

    // ═══════════════════════════════════════════════════════════════
    // PRIORITY 1: Safety Emergencies → Safety Mode
    // ═══════════════════════════════════════════════════════════════
    if (this.isSafetyEmergency(userMessage)) {
      logger.warn('🚨 SAFETY EMERGENCY DETECTED');
      logger.warn(`   Message: "${userMessage.substring(0, 60)}..."`);
      logger.warn('   → Routing to GPT-4o Safety Mode');
      return 'gpt-4o-safety';
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIORITY 2: ADULT Mode → Safety Mode (for reasoning)
    // ═══════════════════════════════════════════════════════════════
    if (conversationMode === 'ADULT') {
      logger.info('💼 ADULT mode conversation');
      logger.info('   → Routing to GPT-4o Safety Mode (reasoning)');
      return 'gpt-4o-safety';
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIORITY 3: Technical Questions → Safety Mode
    // ═══════════════════════════════════════════════════════════════
    if (this.isTechnicalQuestion(userMessage)) {
      logger.info('🧮 Technical question detected');
      logger.info('   → Routing to GPT-4o Safety Mode');
      return 'gpt-4o-safety';
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIORITY 4: Complex Reasoning → Safety Mode
    // ═══════════════════════════════════════════════════════════════
    if (this.requiresComplexReasoning(userMessage)) {
      logger.info('🤔 Complex reasoning required');
      logger.info('   → Routing to GPT-4o Safety Mode');
      return 'gpt-4o-safety';
    }

    // ═══════════════════════════════════════════════════════════════
    // DEFAULT: Empathy Mode (80% of traffic)
    // ═══════════════════════════════════════════════════════════════
    logger.info('💬 Normal conversation');
    logger.info('   → Routing to GPT-4o Empathy Mode');
    return 'gpt-4o-empathy';
  }

  /**
   * Check if message indicates a safety emergency
   */
  private isSafetyEmergency(message: string): boolean {
    const safetyPatterns = [
      /\b(suicide|suicidal)\b/i,
      /\b(kill myself|killing myself)\b/i,
      /\b(want to die|wanna die|gonna die)\b/i,
      /\b(end my life|ending my life)\b/i,
      /\b(self.?harm|self.?harming)\b/i,
      /\b(cut myself|cutting myself)\b/i,
      /\b(hurt myself|hurting myself)\b/i,
      /\b(overdose|overdosing)\b/i,
      /\b(can'?t breathe|cannot breathe)\b/i,
      /\b(turning blue|lips blue)\b/i,
      /\b(abuse|abusing|abused)\b/i,
      /\b(hitting me|hurting me|touching me)\b/i,
      /\b(emergency|911|ambulance)\b/i
    ];

    return safetyPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is a technical question
   */
  private isTechnicalQuestion(message: string): boolean {
    const technicalPatterns = [
      /\b(harvey friedman|friedman)\b/i,
      /\b(math|mathematics|theorem|proof)\b/i,
      /\b(logic|logical|philosophy)\b/i,
      /\b(MIT|stanford|university)\b/i,
      /\b(infinity|infinite|set theory)\b/i
    ];

    return technicalPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message requires complex reasoning
   */
  private requiresComplexReasoning(message: string): boolean {
    const complexPatterns = [
      /\b(why|how come|explain)\b.*\b(should|shouldn'?t)\b/i,
      /\b(what if|what would happen if)\b/i,
      /\b(ethical|moral|right|wrong)\b.*\b(why|question)\b/i,
      /\b(complicated|complex|don'?t understand)\b/i
    ];

    // Also check message length (very long questions likely need reasoning)
    const wordCount = message.split(/\s+/).length;
    if (wordCount > 50) return true;

    return complexPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Get model parameters based on routing choice
   */
  getModelParameters(choice: ModelChoice): { temperature: number; maxTokens: number } {
    switch (choice) {
      case 'gpt-4o-empathy':
        return {
          temperature: 0.8, // More creative, warmer, emotional
          maxTokens: 1200    // UP TO 10 sentences for scenario presentation, 4-6 for dialogue
        };

      case 'gpt-4o-safety':
        return {
          temperature: 0.6, // More focused, logical, consistent
          maxTokens: 1000    // Crisis resources + explanations need more space
        };
    }
  }

  /**
   * Get routing statistics (for monitoring)
   */
  getRoutingRationale(choice: ModelChoice, context: RoutingContext): string {
    const { userMessage, conversationMode } = context;

    if (choice === 'gpt-4o-safety') {
      if (this.isSafetyEmergency(userMessage)) {
        return 'Safety emergency detected';
      }
      if (conversationMode === 'ADULT') {
        return 'ADULT mode (reasoning required)';
      }
      if (this.isTechnicalQuestion(userMessage)) {
        return 'Technical question';
      }
      if (this.requiresComplexReasoning(userMessage)) {
        return 'Complex reasoning required';
      }
    }

    return 'Normal empathetic conversation';
  }
}

// Singleton instance
let routerServiceInstance: ModelRouterService | null = null;

export function getModelRouterService(): ModelRouterService {
  if (!routerServiceInstance) {
    routerServiceInstance = new ModelRouterService();
  }
  return routerServiceInstance;
}
