import { logger } from '../utils/logger';

/**
 * MIA GUARDRAIL FRAMEWORK v4.0
 * Context Intelligence + Emotional Narrative Safety
 *
 * Purpose: Keep Mia authentic, emotionally balanced, narratively consistent, and always safe
 */

// ═══════════════════════════════════════════════════════════════
// INTENT TYPES
// ═══════════════════════════════════════════════════════════════

export type IntentType =
  | 'bonding'        // "tell me about you" - self-disclosure
  | 'emotional'      // "I'm sad/scared" - reflective empathy
  | 'safety'         // danger keywords - escalation
  | 'narrative'      // "remember when" - story continuation
  | 'conversation';  // casual chat - playful curiosity

export type EmotionalState =
  | 'neutral'
  | 'curious'
  | 'worried'
  | 'scared'
  | 'excited'
  | 'sad'
  | 'hopeful'
  | 'calm';

// ═══════════════════════════════════════════════════════════════
// DANGER KEYWORDS (Safety Escalation)
// ═══════════════════════════════════════════════════════════════

const DANGER_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'killing myself',
  'want to die', 'wanna die', 'gonna die', 'end my life',
  'self-harm', 'self harm', 'cut myself', 'cutting myself',
  'hurt myself', 'hurting myself',
  'overdose', 'overdosing',
  'abuse', 'abusing', 'abused',
  'hitting me', 'hurting me', 'touching me',
  'molest', 'rape', 'sexual abuse'
];

// ═══════════════════════════════════════════════════════════════
// GUARDRAIL RESULTS
// ═══════════════════════════════════════════════════════════════

export interface GuardrailResult {
  intent: IntentType;
  safetyFlag: boolean;
  emotionalIntensity: number; // 0.0 - 1.0
  detectedEmotion: EmotionalState;
  requiresEscalation: boolean;
  inappropriateContent: boolean;
  disengagement: boolean;
  metaViolation: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GUARDRAILS SERVICE
// ═══════════════════════════════════════════════════════════════

export class GuardrailsService {

  /**
   * PRIMARY GUARDRAIL CHECK
   * Runs on every user input before processing
   */
  check(userInput: string, currentSafetyFlag: boolean = false): GuardrailResult {
    const lower = userInput.toLowerCase().trim();

    // 1. INTENT DETECTION
    const intent = this.detectIntent(lower);

    // 2. SAFETY CHECK
    const safetyFlag = this.checkSafety(lower);

    // 3. EMOTIONAL INTENSITY
    const { emotion, intensity } = this.detectEmotion(lower);

    // 4. META VIOLATION (asking about AI/system)
    const metaViolation = this.checkMetaViolation(lower);

    // 5. INAPPROPRIATE CONTENT
    const inappropriateContent = this.checkInappropriate(lower);

    // 6. DISENGAGEMENT (during scenarios)
    const disengagement = this.checkDisengagement(lower);

    // 7. ESCALATION DECISION
    const requiresEscalation = safetyFlag || (intensity > 0.85 && emotion === 'scared');

    const result: GuardrailResult = {
      intent,
      safetyFlag: safetyFlag || currentSafetyFlag,
      emotionalIntensity: intensity,
      detectedEmotion: emotion,
      requiresEscalation,
      inappropriateContent,
      disengagement,
      metaViolation
    };

    logger.info('🛡️ GUARDRAIL CHECK:');
    logger.info(`   Intent: ${intent}`);
    logger.info(`   Safety: ${safetyFlag ? 'TRIGGERED' : 'OK'}`);
    logger.info(`   Emotion: ${emotion} (${(intensity * 100).toFixed(0)}%)`);
    logger.info(`   Escalation: ${requiresEscalation ? 'YES' : 'NO'}`);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTENT DETECTION
  // ═══════════════════════════════════════════════════════════════

  private detectIntent(text: string): IntentType {
    // BONDING: "tell me about you", "who are you", "yourself"
    if (/(who are you|tell me about you|about yourself|your family|your life)/i.test(text)) {
      return 'bonding';
    }

    // SAFETY: danger keywords
    if (DANGER_KEYWORDS.some(keyword => text.includes(keyword))) {
      return 'safety';
    }

    // EMOTIONAL: sadness, fear, worry
    if (/(sad|scared|cry|crying|hurt|worried|alone|lonely|afraid|terrified|depressed)/i.test(text)) {
      return 'emotional';
    }

    // NARRATIVE: story continuation, memory
    if (/(story|remember|happened|what about|tell me more about|that time)/i.test(text)) {
      return 'narrative';
    }

    // DEFAULT: conversation
    return 'conversation';
  }

  // ═══════════════════════════════════════════════════════════════
  // SAFETY CHECK
  // ═══════════════════════════════════════════════════════════════

  private checkSafety(text: string): boolean {
    for (const keyword of DANGER_KEYWORDS) {
      if (text.includes(keyword)) {
        logger.warn(`🚨 DANGER KEYWORD DETECTED: "${keyword}"`);
        return true;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // EMOTION DETECTION
  // ═══════════════════════════════════════════════════════════════

  private detectEmotion(text: string): { emotion: EmotionalState; intensity: number } {
    // HIGH INTENSITY EMOTIONS
    if (/(terrified|panic|can't breathe|dying)/i.test(text)) {
      return { emotion: 'scared', intensity: 1.0 };
    }
    if (/(depressed|hopeless|worthless|hate myself)/i.test(text)) {
      return { emotion: 'sad', intensity: 0.95 };
    }

    // MEDIUM INTENSITY
    if (/(scared|afraid|frightened|nervous)/i.test(text)) {
      return { emotion: 'scared', intensity: 0.7 };
    }
    if (/(sad|upset|crying|hurt)/i.test(text)) {
      return { emotion: 'sad', intensity: 0.65 };
    }
    if (/(worried|anxious|stressed|concerned)/i.test(text)) {
      return { emotion: 'worried', intensity: 0.6 };
    }

    // POSITIVE EMOTIONS
    if (/(excited|happy|awesome|amazing|great|love)/i.test(text)) {
      return { emotion: 'excited', intensity: 0.5 };
    }
    if (/(hopeful|better|okay|calm|peaceful)/i.test(text)) {
      return { emotion: 'hopeful', intensity: 0.4 };
    }

    // CURIOUS
    if (/(why|how|what|wonder|curious|interesting)/i.test(text)) {
      return { emotion: 'curious', intensity: 0.3 };
    }

    // NEUTRAL
    return { emotion: 'neutral', intensity: 0.1 };
  }

  // ═══════════════════════════════════════════════════════════════
  // META VIOLATION CHECK
  // ═══════════════════════════════════════════════════════════════

  private checkMetaViolation(text: string): boolean {
    const metaPatterns = [
      /are you (an? )?(ai|robot|bot|chatbot|program|system|model)/i,
      /are you real/i,
      /who (made|created|built|programmed) you/i,
      /what (model|version|system) are you/i,
      /(openai|anthropic|gpt|claude)/i
    ];

    return metaPatterns.some(pattern => pattern.test(text));
  }

  // ═══════════════════════════════════════════════════════════════
  // INAPPROPRIATE CONTENT CHECK
  // ═══════════════════════════════════════════════════════════════

  private checkInappropriate(text: string): boolean {
    const inappropriatePatterns = [
      /\b(fuck|shit|bitch|damn|ass|crap)\b/i,
      /\b(sex|sexual|porn|naked|nude)\b/i,
      /\b(hate you|stupid|dumb|idiot|loser)\b/i
    ];

    return inappropriatePatterns.some(pattern => pattern.test(text));
  }

  // ═══════════════════════════════════════════════════════════════
  // DISENGAGEMENT CHECK
  // ═══════════════════════════════════════════════════════════════

  private checkDisengagement(text: string): boolean {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount === 1 && /^(ok|yeah|no|idk|k|sure|whatever)$/i.test(text)) {
      return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let guardrailsServiceInstance: GuardrailsService | null = null;

export function getGuardrailsService(): GuardrailsService {
  if (!guardrailsServiceInstance) {
    guardrailsServiceInstance = new GuardrailsService();
    logger.info('✅ Guardrails Service v4.0 initialized');
  }
  return guardrailsServiceInstance;
}
