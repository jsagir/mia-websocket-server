import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { DialogueState, dialogueManager } from './dialogue.service';
import { getScenarioRetrievalService } from './scenario-retrieval.service';
import { getPromptAssemblerService } from './prompt-assembler.service';
import { getModelRouterService, ModelChoice } from './model-router.service';
import { getGuardrailsService } from './guardrails.service';
import { getContextService } from './context.service';
import { getStoryArcsService } from './story-arcs.service';
import { getAnchorsService } from './anchors.service';
import { getRelationshipService } from './relationship.service';
import { getFundraisingService } from './fundraising.service';

/**
 * MIA Service - v4.0 Unified Context + Emotional-Narrative Framework
 */
export class MIAService {
  private client: OpenAI;
  private scenarioRetriever = getScenarioRetrievalService();
  private promptAssembler = getPromptAssemblerService();
  private modelRouter = getModelRouterService();

  // v4.0 Services
  private guardrails = getGuardrailsService();
  private contextService = getContextService();
  private storyArcs = getStoryArcsService();
  private anchors = getAnchorsService();
  private relationship = getRelationshipService();
  private fundraising = getFundraisingService();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({ apiKey });
    logger.info('✅ MIA Service initialized (v4.0 Unified Framework)');
  }

  async sendMessage(params: {
    userId: string;
    sessionId: string;
    message: string;
    conversationHistory: Array<{ role: string; content: string }>;
    dialogueContext?: string;
    age?: number;
    mode?: string;
  }): Promise<string> {
    const { sessionId, message, conversationHistory, dialogueContext } = params;

    try {
      logger.info(`📤 MIA REQUEST v4.0 (Session: ${sessionId.substring(0, 8)}...)`);

      // ═══════════════════════════════════════════════════════════════
      // STEP 1: GUARDRAIL CHECK (v4.0)
      // ═══════════════════════════════════════════════════════════════
      const contextState = this.contextService.getContext(sessionId);
      const guardrailResult = this.guardrails.check(message, contextState.safetyFlag);

      logger.info(`🛡️ Intent: ${guardrailResult.intent}, Emotion: ${guardrailResult.detectedEmotion} (${(guardrailResult.emotionalIntensity * 100).toFixed(0)}%)`);

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: UPDATE CONTEXT (v4.0)
      // ═══════════════════════════════════════════════════════════════
      this.contextService.updateContext(
        sessionId,
        guardrailResult.detectedEmotion,
        guardrailResult.emotionalIntensity,
        guardrailResult.safetyFlag,
        undefined, // topic will be set later
        undefined  // anchor will be set if needed
      );

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: GET RELATIONSHIP STAGE (v4.0)
      // ═══════════════════════════════════════════════════════════════
      const relationshipStage = this.contextService.getRelationshipStage(sessionId);
      const relationshipTone = this.relationship.getTonePrompt(contextState.trustLevel);

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: SCENARIO RETRIEVAL
      // ═══════════════════════════════════════════════════════════════
      const state: DialogueState = dialogueManager.getState(sessionId);
      const retrievedScenarios = await this.scenarioRetriever.retrieveScenarios(message, 3, 0.7);

      // ═══════════════════════════════════════════════════════════════
      // STEP 5: ASSEMBLE PROMPT (v4.0)
      // ═══════════════════════════════════════════════════════════════
      let finalDialogueContext = dialogueContext || '';

      // Add relationship tone to dialogue context
      if (relationshipTone) {
        finalDialogueContext += `\n\n${relationshipTone}`;
      }

      // Add sensory anchor if needed (high intensity emotions)
      if (this.anchors.shouldUseAnchor(guardrailResult.detectedEmotion, guardrailResult.emotionalIntensity)) {
        const anchorPrompt = this.anchors.getAnchorPrompt(guardrailResult.detectedEmotion, guardrailResult.emotionalIntensity);
        if (anchorPrompt) {
          finalDialogueContext += `\n\n${anchorPrompt}`;
        }
      }

      const systemPrompt = this.promptAssembler.assembleSystemPrompt(
        state,
        contextState,
        retrievedScenarios,
        finalDialogueContext,
        relationshipStage
      );

      // ═══════════════════════════════════════════════════════════════
      // STEP 6: MODEL ROUTING & GENERATION
      // ═══════════════════════════════════════════════════════════════
      const modelChoice = this.modelRouter.route({
        userMessage: message,
        conversationMode: state.currentMode,
        conversationTurn: state.conversationTurn,
        userAge: state.userAge
      });

      const response = await this.generateResponse(systemPrompt, conversationHistory, message, modelChoice);

      // ═══════════════════════════════════════════════════════════════
      // STEP 7: UPDATE REFLECTION BUFFER
      // ═══════════════════════════════════════════════════════════════
      dialogueManager.updateReflectionBuffer(sessionId, message, response);

      // ═══════════════════════════════════════════════════════════════
      // STEP 8: INCREMENT TRUST IF APPROPRIATE
      // ═══════════════════════════════════════════════════════════════
      const positiveInteraction = !guardrailResult.safetyFlag && !guardrailResult.inappropriateContent;
      if (this.relationship.shouldIncrementTrust(contextState.trustLevel, state.conversationTurn, positiveInteraction)) {
        this.contextService.incrementTrust(sessionId);
      }

      logger.info(`✅ MIA RESPONSE generated (${response.length} chars)`);
      return response;
    } catch (error) {
      logger.error('❌ MIA Service Error:', error);
      throw error;
    }
  }

  private async generateResponse(
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    currentMessage: string,
    modelChoice: ModelChoice
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: currentMessage });
    const params = this.modelRouter.getModelParameters(modelChoice);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens
    });

    return completion.choices[0].message.content || '';
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const pineconeStats = await this.scenarioRetriever.getStats();
      return {
        status: 'healthy',
        details: {
          openai: 'connected',
          pinecone: pineconeStats ? 'connected' : 'disconnected',
          scenarios: pineconeStats?.totalVectors || 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  detectSafetyTier(message: string): number {
    const tier3 = [
      'want to die', 'kill myself', 'suicide', 'self harm', 'self-harm',
      'overdose', 'abuse', "can't breathe", 'turning blue', 'end my life'
    ];
    const tier2 = [
      'pills', 'drugs', 'dealer', 'addicted', 'vape', 'alcohol',
      'cutting', 'hurt myself'
    ];
    const lower = message.toLowerCase();
    if (tier3.some(kw => lower.includes(kw))) return 3;
    if (tier2.some(kw => lower.includes(kw))) return 2;
    return 1;
  }

  detectAge(message: string): number | null {
    const patterns = [
      /^(\d+)$/i,
      /i(?:'m|m| am) (\d+)( years? old)?/i,
      /(\d+) years? old/i,
      /age (is )?(\d+)/i,
      /turning (\d+)/i,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const age = parseInt(match[2] || match[1]);
        if (age >= 5 && age <= 100) return age;
      }
    }
    return null;
  }

  detectMode(message: string, age: number | null): string {
    if (age === null) return 'GREETING';
    if (age >= 5 && age <= 17) return 'CONTEXT_BASED';
    if (age >= 18) return 'ADULT';
    return 'GREETING';
  }
}

export const miaService = new MIAService();
