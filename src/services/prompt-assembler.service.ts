import {
  MIA_CORE_IDENTITY_V4,
  REFLECTION_BUFFER_TEMPLATE_V4,
  SCENARIO_MEMORY_HEADER_V4
} from '../prompts/mia-core-identity-v4';
import { DialogueState } from './dialogue.service';
import { RetrievedScenario } from './scenario-retrieval.service';
import { ContextState } from './context.service';
import { logger } from '../utils/logger';

/**
 * Prompt Assembler Service
 *
 * Combines three layers into a complete system prompt:
 * 1. Always-in-context identity (who Mia is) - ~2K tokens
 * 2. Reflection buffer (emotional state) - ~200 tokens
 * 3. Retrieved scenarios (her experiences) - ~2-8K tokens
 *
 * Total: ~4-10K tokens per request
 */
export class PromptAssemblerService {

  /**
   * Assemble complete system prompt for Mia (v4.0)
   *
   * @param state - Current dialogue state (includes reflection buffer)
   * @param contextState - Context from context service (v4.0)
   * @param retrievedScenarios - Scenarios retrieved from Pinecone
   * @param dialogueInstruction - Optional specific instruction from dialogue manager
   * @param relationshipStage - Current relationship stage (v4.0)
   * @returns Complete system prompt string
   */
  assembleSystemPrompt(
    state: DialogueState,
    contextState: ContextState,
    retrievedScenarios: RetrievedScenario[],
    dialogueInstruction?: string,
    relationshipStage?: string
  ): string {

    const parts: string[] = [];

    // ═══════════════════════════════════════════════════════════════
    // PART 1: Dialogue Instruction Override (if provided)
    // ═══════════════════════════════════════════════════════════════
    if (dialogueInstruction) {
      parts.push(`
🔴 CRITICAL: DIALOGUE INSTRUCTION 🔴

[DIALOGUE INSTRUCTION: ${dialogueInstruction}]

FOLLOW THIS INSTRUCTION EXACTLY. This is the Dialogue Manager guiding the conversation flow.
Your job is to deliver the line naturally as Mia would say it.
DIALOGUE INSTRUCTIONS OVERRIDE ALL OTHER RULES.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 2: Always-In-Context Core Identity v4.0 (~2K tokens)
    // ═══════════════════════════════════════════════════════════════
    parts.push(MIA_CORE_IDENTITY_V4);

    // ═══════════════════════════════════════════════════════════════
    // PART 3: Reflection Buffer v4.0 (Emotional State + Context) (~300 tokens)
    // ═══════════════════════════════════════════════════════════════
    const reflection = this.buildReflectionBufferV4(state, contextState, relationshipStage || 'cautious');
    parts.push(reflection);

    // ═══════════════════════════════════════════════════════════════
    // PART 4: Retrieved Scenarios (Mia's Experiences) (~2-8K tokens)
    // ═══════════════════════════════════════════════════════════════
    if (retrievedScenarios.length > 0) {
      const scenarioMemory = this.buildScenarioMemoryV4(retrievedScenarios);
      parts.push(scenarioMemory);
    } else {
      logger.debug('📋 No scenarios retrieved - using core identity only');
    }

    // ═══════════════════════════════════════════════════════════════
    // Combine all parts
    // ═══════════════════════════════════════════════════════════════
    const fullPrompt = parts.join('\n\n');

    // Log prompt stats
    const estimatedTokens = Math.ceil(fullPrompt.length / 4); // rough estimate
    logger.info(`📝 System prompt assembled (v4.0):`);
    logger.info(`   - Core Identity v4.0: ✓`);
    logger.info(`   - Reflection Buffer v4.0: ✓ (${contextState.lastEmotion}, ${(contextState.lastIntensity * 100).toFixed(0)}%, safety=${contextState.safetyFlag})`);
    logger.info(`   - Trust Level: ${contextState.trustLevel}/5 (${relationshipStage})`);
    logger.info(`   - Retrieved Scenarios: ${retrievedScenarios.length}`);
    logger.info(`   - Dialogue Instruction: ${dialogueInstruction ? '✓' : '—'}`);
    logger.info(`   - Estimated tokens: ~${estimatedTokens}`);

    return fullPrompt;
  }

  /**
   * Build reflection buffer v4.0 with enhanced context
   */
  private buildReflectionBufferV4(
    state: DialogueState,
    contextState: ContextState,
    relationshipStage: string
  ): string {
    const buffer = REFLECTION_BUFFER_TEMPLATE_V4
      .replace('{emotional_state}', contextState.lastEmotion)
      .replace('{emotional_intensity}', (contextState.lastIntensity * 100).toFixed(0))
      .replace('{current_topic}', contextState.lastTopic || 'Getting to know each other')
      .replace('{safety_flag}', contextState.safetyFlag ? 'TRUE' : 'FALSE')
      .replace('{context_expiry}', contextState.contextExpiry.toString())
      .replace('{trust_level}', contextState.trustLevel.toString())
      .replace('{relationship_stage}', relationshipStage)
      .replace('{anchor_used}', contextState.anchorUsed || 'None');

    return buffer;
  }

  /**
   * Build scenario memory v4.0 from retrieved scenarios
   */
  private buildScenarioMemoryV4(scenarios: RetrievedScenario[]): string {
    const scenarioTexts = scenarios.map((s, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMORY ${i + 1}: ${s.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${s.context}

The dilemma: ${s.dilemma}

Questions I had:
${s.questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

What I learned: ${s.learningObjective}
    `.trim()).join('\n\n');

    return SCENARIO_MEMORY_HEADER_V4 + '\n' + scenarioTexts;
  }

  /**
   * Estimate token count for a prompt
   * (Rough estimate: 1 token ≈ 4 characters)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
let assemblerServiceInstance: PromptAssemblerService | null = null;

export function getPromptAssemblerService(): PromptAssemblerService {
  if (!assemblerServiceInstance) {
    assemblerServiceInstance = new PromptAssemblerService();
  }
  return assemblerServiceInstance;
}
