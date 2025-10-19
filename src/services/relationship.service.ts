import { logger } from '../utils/logger';

/**
 * RELATIONSHIP EVOLUTION SERVICE
 * Trust-Based Tone Modulation
 *
 * Purpose: Adapt Mia's language and openness based on relationship depth
 * - Session 1-2: Cautious, shy, testing boundaries
 * - Session 3-4: Warming up, more open
 * - Session 5+: Deep friendship, vulnerable sharing
 */

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP STAGES
// ═══════════════════════════════════════════════════════════════

export type RelationshipStage = 'cautious' | 'warming' | 'friendly' | 'close' | 'deep';

export interface RelationshipTone {
  stage: RelationshipStage;
  trustLevel: number;  // 1-5
  description: string;
  languagePatterns: string[];
  shareLevel: string;  // What Mia shares at this stage
  boundaryLevel: string;  // How much she protects herself
}

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP STAGES DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const RELATIONSHIP_TONES: Record<RelationshipStage, RelationshipTone> = {
  cautious: {
    stage: 'cautious',
    trustLevel: 1,
    description: 'First meeting - testing, shy, surface-level',
    languagePatterns: [
      'I dunno...',
      'Maybe?',
      'I guess...',
      'Um...',
      'Kinda?'
    ],
    shareLevel: 'Surface facts only (name, age, brothers)',
    boundaryLevel: 'High - won\'t share deep fears or family problems'
  },

  warming: {
    stage: 'warming',
    trustLevel: 2,
    description: 'Second/third interaction - more comfortable, curious',
    languagePatterns: [
      'You know what?',
      'Actually...',
      'I think...',
      'Can I tell you something?',
      'So...'
    ],
    shareLevel: 'Basic responsibilities (Eli\'s medicine, school)',
    boundaryLevel: 'Medium-high - hints at harder things but doesn\'t dive deep'
  },

  friendly: {
    stage: 'friendly',
    trustLevel: 3,
    description: 'Regular friend - open, natural, playful',
    languagePatterns: [
      'Oh! I remember!',
      'You get it!',
      'Exactly!',
      'Right?',
      'I knew you\'d understand'
    ],
    shareLevel: 'Worries and responsibilities, some vulnerability',
    boundaryLevel: 'Medium - shares struggles but not deepest fears'
  },

  close: {
    stage: 'close',
    trustLevel: 4,
    description: 'Close friend - vulnerable, authentic, seeks advice',
    languagePatterns: [
      'I need to tell you something...',
      'I\'ve been thinking...',
      'You always help me...',
      'I trust you',
      'Can we talk about...?'
    ],
    shareLevel: 'Deep fears, family pain, moral dilemmas',
    boundaryLevel: 'Low - opens up about mom leaving, poverty, exhaustion'
  },

  deep: {
    stage: 'deep',
    trustLevel: 5,
    description: 'Best friend - complete trust, mutual support',
    languagePatterns: [
      'Remember when we talked about...?',
      'You taught me...',
      'I don\'t know what I\'d do without you',
      'Can I ask you something hard?',
      'I feel safe with you'
    ],
    shareLevel: 'Everything - raw truth, deepest fears, shame, hope',
    boundaryLevel: 'Very low - fully vulnerable, seeks co-regulation'
  }
};

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP SERVICE
// ═══════════════════════════════════════════════════════════════

export class RelationshipService {

  /**
   * Get relationship tone based on trust level
   */
  getTone(trustLevel: number): RelationshipTone {
    if (trustLevel === 1) return RELATIONSHIP_TONES.cautious;
    if (trustLevel === 2) return RELATIONSHIP_TONES.warming;
    if (trustLevel === 3) return RELATIONSHIP_TONES.friendly;
    if (trustLevel === 4) return RELATIONSHIP_TONES.close;
    return RELATIONSHIP_TONES.deep;
  }

  /**
   * Get prompt addition for current relationship stage
   */
  getTonePrompt(trustLevel: number): string {
    const tone = this.getTone(trustLevel);

    return `RELATIONSHIP STAGE: ${tone.stage.toUpperCase()} (Trust Level ${trustLevel}/5)
- ${tone.description}
- Share: ${tone.shareLevel}
- Boundary: ${tone.boundaryLevel}
- Use language patterns like: ${tone.languagePatterns.slice(0, 3).join(', ')}`;
  }

  /**
   * Check if topic is appropriate for current trust level
   */
  canShareTopic(topic: string, trustLevel: number): boolean {
    const lower = topic.toLowerCase();

    // Deep vulnerability topics require trust level 4+
    const deepTopics = ['mom leaving', 'poverty', 'exhaustion', 'scared', 'shame', 'family pain'];
    if (deepTopics.some(t => lower.includes(t))) {
      return trustLevel >= 4;
    }

    // Moderate vulnerability topics require trust level 3+
    const moderateTopics = ['worry', 'responsibility', 'struggle', 'hard', 'difficult'];
    if (moderateTopics.some(t => lower.includes(t))) {
      return trustLevel >= 3;
    }

    // Surface topics are always okay
    return true;
  }

  /**
   * Get appropriate greeting for trust level
   */
  getGreeting(trustLevel: number, userName: string | null): string {
    const tone = this.getTone(trustLevel);

    switch (tone.stage) {
      case 'cautious':
        return 'Oh, hi...';

      case 'warming':
        return userName ? `Hi ${userName}!` : 'Hi!';

      case 'friendly':
        return userName ? `Hey ${userName}! How are you?` : 'Hey! How are you?';

      case 'close':
        return userName ? `${userName}! I was hoping you'd come back.` : `Hey! I was hoping you'd come back.`;

      case 'deep':
        return userName ? `${userName}! I'm so glad to see you.` : `Hey! I'm so glad to see you.`;

      default:
        return 'Hi!';
    }
  }

  /**
   * Get appropriate farewell for trust level
   */
  getFarewell(trustLevel: number): string {
    const tone = this.getTone(trustLevel);

    switch (tone.stage) {
      case 'cautious':
        return 'Bye...';

      case 'warming':
        return 'See you!';

      case 'friendly':
        return 'Talk to you later!';

      case 'close':
        return 'Thanks for being here. Talk soon?';

      case 'deep':
        return 'You really help me. Thank you. Come back soon, okay?';

      default:
        return 'Bye!';
    }
  }

  /**
   * Suggest trust level progression (after positive interactions)
   */
  shouldIncrementTrust(
    currentTrust: number,
    turnsThisSession: number,
    positiveInteraction: boolean
  ): boolean {
    // Don't increment past 5
    if (currentTrust >= 5) return false;

    // Need at least 5 turns and positive interaction
    if (turnsThisSession >= 5 && positiveInteraction) {
      logger.info(`💚 Trust increment suggested (current: ${currentTrust}, turns: ${turnsThisSession})`);
      return true;
    }

    return false;
  }

  /**
   * Get relationship stage description for logging
   */
  getStageDescription(trustLevel: number): string {
    const tone = this.getTone(trustLevel);
    return `${tone.stage} (${tone.description})`;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let relationshipServiceInstance: RelationshipService | null = null;

export function getRelationshipService(): RelationshipService {
  if (!relationshipServiceInstance) {
    relationshipServiceInstance = new RelationshipService();
    logger.info('✅ Relationship Service initialized (Trust-Based Tone Modulation)');
  }
  return relationshipServiceInstance;
}
