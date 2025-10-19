import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Session {
  sessionId: string;
  userId: string;
  conversationHistory: Message[];
  age: number | null;
  mode: string;
  safetyTier: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

class SessionService {
  private sessions: Map<string, Session> = new Map();

  generateToken(userId: string): string {
    const token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    logger.info(`Generated token for user: ${userId}`);
    return token;
  }

  getOrCreate(userId: string, sessionId?: string): Session {
    const actualSessionId = sessionId || `session_${userId}_${Date.now()}`;

    if (this.sessions.has(actualSessionId)) {
      const session = this.sessions.get(actualSessionId)!;
      logger.info(`Retrieved existing session: ${actualSessionId}`);
      return session;
    }

    const newSession: Session = {
      sessionId: actualSessionId,
      userId,
      conversationHistory: [],
      age: null,
      mode: 'GREETING',
      safetyTier: 1,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(actualSessionId, newSession);
    logger.info(`Created new session: ${actualSessionId} for user: ${userId}`);
    return newSession;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Attempted to add message to non-existent session: ${sessionId}`);
      return;
    }

    session.conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });
    session.updatedAt = Date.now();
    logger.debug(`Added ${role} message to session: ${sessionId}`);
  }

  getHistory(sessionId: string): Message[] {
    const session = this.sessions.get(sessionId);
    return session ? session.conversationHistory : [];
  }

  updateAge(sessionId: string, age: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.age = age;
      session.updatedAt = Date.now();
      logger.info(`Updated age for session ${sessionId}: ${age}`);
    }
  }

  updateMode(sessionId: string, mode: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.mode = mode;
      session.updatedAt = Date.now();
      logger.info(`Updated mode for session ${sessionId}: ${mode}`);
    }
  }

  updateStatus(sessionId: string, status: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.updatedAt = Date.now();
      logger.info(`Updated status for session ${sessionId}: ${status}`);
    }
  }

  updateSafetyTier(sessionId: string, tier: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.safetyTier = tier;
      session.updatedAt = Date.now();
      logger.warn(`Updated safety tier for session ${sessionId}: ${tier}`);
    }
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
}

export const sessionService = new SessionService();
