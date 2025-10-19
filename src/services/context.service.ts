import { logger } from '../utils/logger';
import { EmotionalState } from './guardrails.service';

/**
 * CONTEXT INTELLIGENCE SERVICE
 * Memory Decay + Trust Tracking + Safety State Management
 *
 * Purpose: Manage emotional context that decays over time
 * - Exit safety mode after 1-2 turns
 * - Track trust level for relationship evolution
 * - Maintain emotional coherence without lingering
 */

// ═══════════════════════════════════════════════════════════════
// CONTEXT STATE
// ═══════════════════════════════════════════════════════════════

export interface ContextState {
  sessionId: string;
  lastTopic: string;
  safetyFlag: boolean;
  contextExpiry: number;  // Turns until emotion resets
  lastEmotion: EmotionalState;
  trustLevel: number;  // 1-5 scale
  anchorUsed: string | null;  // Last sensory anchor
  sessionCount: number;  // Number of conversations
  turnsSinceSafety: number;  // Turns since last safety trigger
  lastIntensity: number;  // 0.0-1.0
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT SERVICE
// ═══════════════════════════════════════════════════════════════

export class ContextService {
  private contexts: Map<string, ContextState> = new Map();

  /**
   * Get or create context for session
   */
  getContext(sessionId: string): ContextState {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        sessionId,
        lastTopic: 'Getting to know each other',
        safetyFlag: false,
        contextExpiry: 0,
        lastEmotion: 'neutral',
        trustLevel: 1,  // Start cautious
        anchorUsed: null,
        sessionCount: 1,
        turnsSinceSafety: 0,
        lastIntensity: 0.0
      });
      logger.info(`🧩 New context created for session ${sessionId.substring(0, 8)}...`);
    }
    return this.contexts.get(sessionId)!;
  }

  /**
   * Update context after each turn
   */
  updateContext(
    sessionId: string,
    newEmotion: EmotionalState,
    intensity: number,
    safetyTriggered: boolean,
    topic?: string,
    anchor?: string
  ): void {
    const context = this.getContext(sessionId);

    // Update topic if provided
    if (topic) {
      context.lastTopic = topic;
    }

    // Update emotion and intensity
    context.lastEmotion = newEmotion;
    context.lastIntensity = intensity;

    // Handle safety flag
    if (safetyTriggered) {
      context.safetyFlag = true;
      context.contextExpiry = 2;  // Will decay after 2 turns
      context.turnsSinceSafety = 0;
      logger.warn(`🚨 Safety flag SET for session ${sessionId.substring(0, 8)}... (expiry: 2 turns)`);
    } else if (context.safetyFlag) {
      // Decay safety context
      context.turnsSinceSafety++;
      context.contextExpiry = Math.max(0, context.contextExpiry - 1);

      if (context.contextExpiry === 0) {
        // EXIT SAFETY MODE
        context.safetyFlag = false;
        context.lastEmotion = 'calm';
        context.anchorUsed = null;
        logger.info(`✅ Safety mode EXITED for session ${sessionId.substring(0, 8)}... (returned to calm state)`);
      } else {
        logger.info(`⏳ Safety expiry countdown: ${context.contextExpiry} turns remaining`);
      }
    }

    // Update anchor if provided
    if (anchor) {
      context.anchorUsed = anchor;
    }

    // Emotional decay for non-safety emotions
    if (!context.safetyFlag && intensity < 0.5 && context.lastEmotion !== 'neutral') {
      context.contextExpiry = Math.max(0, context.contextExpiry - 1);
      if (context.contextExpiry === 0) {
        context.lastEmotion = 'neutral';
        context.anchorUsed = null;
        logger.info(`🔄 Emotional state reset to neutral for session ${sessionId.substring(0, 8)}...`);
      }
    }

    logger.info(`🧩 Context updated: emotion=${newEmotion}, intensity=${(intensity * 100).toFixed(0)}%, safety=${context.safetyFlag}, expiry=${context.contextExpiry}`);
  }

  /**
   * Increment trust level (called after successful interactions)
   */
  incrementTrust(sessionId: string): void {
    const context = this.getContext(sessionId);
    if (context.trustLevel < 5) {
      context.trustLevel++;
      logger.info(`❤️ Trust level increased to ${context.trustLevel} for session ${sessionId.substring(0, 8)}...`);
    }
  }

  /**
   * Increment session count (new conversation)
   */
  incrementSession(sessionId: string): void {
    const context = this.getContext(sessionId);
    context.sessionCount++;
    logger.info(`📊 Session count: ${context.sessionCount} for ${sessionId.substring(0, 8)}...`);
  }

  /**
   * Check if currently in safety mode
   */
  isInSafetyMode(sessionId: string): boolean {
    return this.getContext(sessionId).safetyFlag;
  }

  /**
   * Get trust-based relationship stage
   */
  getRelationshipStage(sessionId: string): 'cautious' | 'warming' | 'friendly' | 'close' | 'deep' {
    const trustLevel = this.getContext(sessionId).trustLevel;
    if (trustLevel === 1) return 'cautious';
    if (trustLevel === 2) return 'warming';
    if (trustLevel === 3) return 'friendly';
    if (trustLevel === 4) return 'close';
    return 'deep';
  }

  /**
   * Force exit safety mode (admin override)
   */
  forceExitSafetyMode(sessionId: string): void {
    const context = this.getContext(sessionId);
    context.safetyFlag = false;
    context.contextExpiry = 0;
    context.lastEmotion = 'calm';
    context.anchorUsed = null;
    logger.info(`🔓 Safety mode FORCE EXITED for session ${sessionId.substring(0, 8)}...`);
  }

  /**
   * Get context summary for logging/debugging
   */
  getSummary(sessionId: string): string {
    const context = this.getContext(sessionId);
    return `Session ${sessionId.substring(0, 8)}: emotion=${context.lastEmotion}, safety=${context.safetyFlag}, trust=${context.trustLevel}, topic="${context.lastTopic}"`;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let contextServiceInstance: ContextService | null = null;

export function getContextService(): ContextService {
  if (!contextServiceInstance) {
    contextServiceInstance = new ContextService();
    logger.info('✅ Context Service initialized (Memory Decay + Trust Tracking)');
  }
  return contextServiceInstance;
}
