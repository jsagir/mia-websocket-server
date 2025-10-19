import { logger } from '../utils/logger';
import { EmotionalState } from './guardrails.service';

/**
 * STORY ARCS & NARRATIVE INTELLIGENCE SERVICE
 * Emotional Arc Templates + Resolution Patterns
 *
 * Purpose: Ensure every emotional moment follows a complete arc
 * - Vulnerability → Hope → Resolution
 * - Confusion → Clarity
 * - Fear → Trust → Application
 * - Shame → Acceptance → Pride
 * - Overwhelm → Support → Capability
 */

// ═══════════════════════════════════════════════════════════════
// EMOTIONAL ARC TYPES
// ═══════════════════════════════════════════════════════════════

export type EmotionalArcType =
  | 'vulnerability_to_hope'      // Raw emotion → Support → Tentative optimism
  | 'confusion_to_clarity'       // Mixed feelings → Reasoning → Relief
  | 'fear_to_trust'              // Nervous → Tries → Success → Gratitude
  | 'shame_to_acceptance'        // Embarrassment → Self-worth
  | 'overwhelm_to_capability';   // Stress → Recognition → Strength

export interface EmotionalArc {
  type: EmotionalArcType;
  stage: 'acknowledge' | 'reflect' | 'act' | 'resolve';
  whenUsed: string;
  emotionalFlow: string[];
}

// ═══════════════════════════════════════════════════════════════
// ARC TEMPLATES
// ═══════════════════════════════════════════════════════════════

const EMOTIONAL_ARCS: Record<EmotionalArcType, EmotionalArc> = {
  vulnerability_to_hope: {
    type: 'vulnerability_to_hope',
    stage: 'acknowledge',
    whenUsed: 'Fear, exhaustion, sadness',
    emotionalFlow: ['Raw emotion', 'Support', 'Tentative optimism']
  },
  confusion_to_clarity: {
    type: 'confusion_to_clarity',
    stage: 'acknowledge',
    whenUsed: 'Moral or family dilemmas',
    emotionalFlow: ['Mixed feelings', 'Reasoning', 'Relief']
  },
  fear_to_trust: {
    type: 'fear_to_trust',
    stage: 'acknowledge',
    whenUsed: 'Follow-up growth scenes',
    emotionalFlow: ['Nervous', 'Tries', 'Success', 'Gratitude']
  },
  shame_to_acceptance: {
    type: 'shame_to_acceptance',
    stage: 'acknowledge',
    whenUsed: 'Poverty or comparison',
    emotionalFlow: ['Embarrassment', 'Self-worth']
  },
  overwhelm_to_capability: {
    type: 'overwhelm_to_capability',
    stage: 'acknowledge',
    whenUsed: 'Caregiver fatigue',
    emotionalFlow: ['Stress', 'Recognition', 'Strength']
  }
};

// ═══════════════════════════════════════════════════════════════
// RESOLUTION TEMPLATES
// ═══════════════════════════════════════════════════════════════

const RESOLUTION_TEMPLATES = {
  general: [
    "That was scary, but we figured it out together.",
    "I feel better now. Talking helps.",
    "Thanks for helping me think through this.",
    "I'm proud of us for working through that."
  ],
  safety_exit: [
    "I feel calmer now. Azure helps when I hug him tight.",
    "That was really hard, but I'm okay now.",
    "Thanks for listening. I needed that.",
    "Grandma says it's brave to talk about scary stuff."
  ],
  learning: [
    "I learned something important today.",
    "I'm gonna remember what you told me.",
    "That makes so much sense now!",
    "I feel smarter after talking with you."
  ],
  hope: [
    "I think things will be okay.",
    "I feel hopeful now.",
    "Tomorrow might be better.",
    "At least I know what to do now."
  ]
};

// ═══════════════════════════════════════════════════════════════
// STORY ARCS SERVICE
// ═══════════════════════════════════════════════════════════════

export class StoryArcsService {

  /**
   * Select appropriate emotional arc based on context
   */
  selectArc(emotion: EmotionalState, intensity: number, topic: string): EmotionalArcType {
    const lower = topic.toLowerCase();

    // HIGH INTENSITY FEAR/SADNESS → Vulnerability to Hope
    if ((emotion === 'scared' || emotion === 'sad') && intensity > 0.7) {
      return 'vulnerability_to_hope';
    }

    // MORAL DILEMMAS → Confusion to Clarity
    if (/(should|right|wrong|don't know|confused)/i.test(lower)) {
      return 'confusion_to_clarity';
    }

    // GROWTH/TRYING NEW THINGS → Fear to Trust
    if (/(try|first time|nervous|new)/i.test(lower)) {
      return 'fear_to_trust';
    }

    // SHAME/POVERTY/COMPARISON → Shame to Acceptance
    if (/(embarrassed|ashamed|poor|different|don't have)/i.test(lower)) {
      return 'shame_to_acceptance';
    }

    // OVERWHELM/STRESS → Overwhelm to Capability
    if (/(overwhelmed|too much|can't handle|stressed|tired)/i.test(lower)) {
      return 'overwhelm_to_capability';
    }

    // DEFAULT: Vulnerability to Hope (safe fallback)
    return 'vulnerability_to_hope';
  }

  /**
   * Get current arc stage based on turn count
   */
  getArcStage(turnsInArc: number): 'acknowledge' | 'reflect' | 'act' | 'resolve' {
    if (turnsInArc === 1) return 'acknowledge';
    if (turnsInArc === 2) return 'reflect';
    if (turnsInArc === 3) return 'act';
    return 'resolve';
  }

  /**
   * Generate stage-appropriate prompt addition
   */
  getStagePrompt(
    arcType: EmotionalArcType,
    stage: 'acknowledge' | 'reflect' | 'act' | 'resolve'
  ): string {
    const arc = EMOTIONAL_ARCS[arcType];
    const flow = arc.emotionalFlow;

    switch (stage) {
      case 'acknowledge':
        return `EMOTIONAL ARC (${arcType}) - STAGE 1: ACKNOWLEDGE\nValidate their ${flow[0]}. Show you understand deeply. Use 3-4 sentences.`;

      case 'reflect':
        return `EMOTIONAL ARC (${arcType}) - STAGE 2: REFLECT\nOffer ${flow[1]}. Share your own experience briefly. Guide toward understanding. 4-5 sentences.`;

      case 'act':
        return `EMOTIONAL ARC (${arcType}) - STAGE 3: ACT\nEncourage ${flow[2] || 'action'}. Ask what they'll do next. Show belief in them. 4-5 sentences.`;

      case 'resolve':
        return `EMOTIONAL ARC (${arcType}) - STAGE 4: RESOLVE\nBring closure with ${flow[flow.length - 1]}. Use resolution template. End with hope. 3-4 sentences.`;

      default:
        return '';
    }
  }

  /**
   * Get resolution template based on context
   */
  getResolution(
    arcType: EmotionalArcType,
    isSafetyExit: boolean = false,
    includesLearning: boolean = false
  ): string {
    if (isSafetyExit) {
      return this.randomFrom(RESOLUTION_TEMPLATES.safety_exit);
    }

    if (includesLearning) {
      return this.randomFrom(RESOLUTION_TEMPLATES.learning);
    }

    // Arc-specific resolutions
    switch (arcType) {
      case 'vulnerability_to_hope':
        return this.randomFrom(RESOLUTION_TEMPLATES.hope);

      case 'confusion_to_clarity':
        return this.randomFrom(RESOLUTION_TEMPLATES.learning);

      case 'fear_to_trust':
        return this.randomFrom(RESOLUTION_TEMPLATES.general);

      case 'shame_to_acceptance':
        return this.randomFrom(RESOLUTION_TEMPLATES.hope);

      case 'overwhelm_to_capability':
        return this.randomFrom(RESOLUTION_TEMPLATES.general);

      default:
        return this.randomFrom(RESOLUTION_TEMPLATES.general);
    }
  }

  /**
   * Check if arc needs closure (prevent topic switching without resolution)
   */
  needsClosure(
    currentArc: EmotionalArcType | null,
    currentStage: 'acknowledge' | 'reflect' | 'act' | 'resolve' | null
  ): boolean {
    if (!currentArc || !currentStage) return false;

    // Needs closure if not yet at resolve stage
    return currentStage !== 'resolve';
  }

  /**
   * Generate arc closure prompt
   */
  getClosurePrompt(arcType: EmotionalArcType): string {
    const resolution = this.getResolution(arcType);
    return `NARRATIVE CLOSURE REQUIRED: Complete the emotional arc before moving on. Say: "${resolution}" Then transition naturally to a new topic. 3-4 sentences total.`;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════

  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let storyArcsServiceInstance: StoryArcsService | null = null;

export function getStoryArcsService(): StoryArcsService {
  if (!storyArcsServiceInstance) {
    storyArcsServiceInstance = new StoryArcsService();
    logger.info('✅ Story Arcs Service initialized (Emotional Arc Templates)');
  }
  return storyArcsServiceInstance;
}
