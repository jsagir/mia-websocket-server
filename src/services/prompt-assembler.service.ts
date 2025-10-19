import {
  MIA_CORE_IDENTITY,
  REFLECTION_BUFFER_TEMPLATE,
  SCENARIO_MEMORY_HEADER
} from '../prompts/mia-core-identity';
import { DialogueState } from './dialogue.service';
import { RetrievedScenario } from './scenario-retrieval.service';
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
   * Assemble complete system prompt for Mia
   *
   * @param state - Current dialogue state (includes reflection buffer)
   * @param retrievedScenarios - Scenarios retrieved from Pinecone
   * @param dialogueInstruction - Optional specific instruction from dialogue manager
   * @returns Complete system prompt string
   */
  assembleSystemPrompt(
    state: DialogueState,
    retrievedScenarios: RetrievedScenario[],
    dialogueInstruction?: string
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
    // PART 2: Always-In-Context Core Identity (~2K tokens)
    // ═══════════════════════════════════════════════════════════════
    parts.push(MIA_CORE_IDENTITY);

    // ═══════════════════════════════════════════════════════════════
    // PART 3: Reflection Buffer (Emotional State) (~200 tokens)
    // ═══════════════════════════════════════════════════════════════
    const reflection = this.buildReflectionBuffer(state);
    parts.push(reflection);

    // ═══════════════════════════════════════════════════════════════
    // PART 4: Retrieved Scenarios (Mia's Experiences) (~2-8K tokens)
    // ═══════════════════════════════════════════════════════════════
    if (retrievedScenarios.length > 0) {
      const scenarioMemory = this.buildScenarioMemory(retrievedScenarios);
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
    logger.info(`📝 System prompt assembled:`);
    logger.info(`   - Core Identity: ✓`);
    logger.info(`   - Reflection Buffer: ✓ (${state.reflectionBuffer.emotionalState}, turn ${state.conversationTurn})`);
    logger.info(`   - Retrieved Scenarios: ${retrievedScenarios.length}`);
    logger.info(`   - Dialogue Instruction: ${dialogueInstruction ? '✓' : '—'}`);
    logger.info(`   - Estimated tokens: ~${estimatedTokens}`);

    return fullPrompt;
  }

  /**
   * Build reflection buffer with current emotional state
   */
  private buildReflectionBuffer(state: DialogueState): string {
    const buffer = REFLECTION_BUFFER_TEMPLATE
      .replace('{emotional_state}', state.reflectionBuffer.emotionalState)
      .replace('{current_topic}', state.reflectionBuffer.currentTopic || 'Getting to know each other')
      .replace('{last_lesson}', state.reflectionBuffer.lastLessonApplied || 'None yet')
      .replace('{turn_number}', state.conversationTurn.toString());

    return buffer;
  }

  /**
   * Build scenario memory from retrieved scenarios
   */
  private buildScenarioMemory(scenarios: RetrievedScenario[]): string {
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

    return SCENARIO_MEMORY_HEADER + '\n' + scenarioTexts;
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
