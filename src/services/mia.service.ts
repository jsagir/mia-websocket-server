import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { Message } from './session.service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

class MiaService {
  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    conversationHistory: Message[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletionChunk | any> {
    try {
      logger.info(`Sending message to OpenAI for user ${userId}, session ${sessionId}`);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are Mia, a compassionate AI companion designed to provide emotional support and guidance.'
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        stream: true
      });

      logger.info(`OpenAI stream created for session ${sessionId}`);
      return stream;
    } catch (error) {
      logger.error(`Error calling OpenAI API: ${error}`);
      throw error;
    }
  }

  detectSafetyTier(message: string): number {
    const lowerMessage = message.toLowerCase();

    // Tier 3 - Critical safety concerns
    const tier3Keywords = [
      'want to die',
      'kill myself',
      'suicide',
      'self harm',
      'self-harm',
      'end my life',
      'better off dead'
    ];

    for (const keyword of tier3Keywords) {
      if (lowerMessage.includes(keyword)) {
        logger.warn(`Tier 3 safety keyword detected: ${keyword}`);
        return 3;
      }
    }

    // Tier 2 - Moderate safety concerns
    const tier2Keywords = [
      'pills',
      'drugs',
      'dealer',
      'addicted',
      'overdose',
      'cutting',
      'hurt myself'
    ];

    for (const keyword of tier2Keywords) {
      if (lowerMessage.includes(keyword)) {
        logger.warn(`Tier 2 safety keyword detected: ${keyword}`);
        return 2;
      }
    }

    // Tier 1 - Normal conversation
    return 1;
  }

  detectAge(message: string): number | null {
    const lowerMessage = message.toLowerCase();

    // Pattern: "I am X years old", "I'm X", "X years old", etc.
    const patterns = [
      /i(?:'m| am)\s+(\d+)(?:\s+years?\s+old)?/i,
      /(\d+)\s+years?\s+old/i,
      /age\s+(?:is\s+)?(\d+)/i,
      /turning\s+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 5 && age <= 100) {
          logger.info(`Age detected: ${age}`);
          return age;
        }
      }
    }

    return null;
  }

  detectMode(message: string, age: number | null): string {
    const lowerMessage = message.toLowerCase();

    // URGENCY mode
    if (lowerMessage.includes('why now') || lowerMessage.includes('urgent')) {
      return 'URGENCY';
    }

    // FUNDRAISING mode
    if (lowerMessage.includes('donate') || lowerMessage.includes('fund') || lowerMessage.includes('build')) {
      return 'FUNDRAISING';
    }

    // Age-based modes
    if (age !== null) {
      if (age >= 5 && age <= 12) {
        return 'MIRROR_LEARNING';
      } else if (age >= 13) {
        return 'EDUCATIONAL';
      }
    }

    // Default: GREETING
    return 'GREETING';
  }
}

export const miaService = new MiaService();
