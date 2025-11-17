import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateSocket, AuthenticatedSocket } from './middleware/auth';
import { sessionService } from './services/session.service';
import { miaService } from './services/mia.service';
import { dialogueManager } from './services/dialogue.service';
import { getPWSAssistantService } from './services/pws-assistant.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Initialize Express app
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Token generation endpoint
app.post('/api/auth/token', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const token = sessionService.generateToken(userId);
  res.json({ token, userId });
});

// ========================================
// PWS (Problems Worth Solving) Endpoints
// ========================================

// PWS health check
app.get('/api/pws/health', async (req, res) => {
  try {
    const pwsAssistant = getPWSAssistantService();
    const health = await pwsAssistant.getHealthStatus();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PWS quick query (simple question/answer)
app.post('/api/pws/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const pwsAssistant = getPWSAssistantService();
    const result = await pwsAssistant.generateResponse({ query });

    res.json({
      response: result.response,
      citations: result.citations
    });
  } catch (error) {
    logger.error('PWS query error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process query'
    });
  }
});

// PWS problem classification
app.post('/api/pws/classify', async (req, res) => {
  try {
    const { problemDescription } = req.body;

    if (!problemDescription) {
      return res.status(400).json({ error: 'problemDescription is required' });
    }

    const pwsAssistant = getPWSAssistantService();
    const classification = await pwsAssistant.classifyProblem(problemDescription);

    res.json(classification);
  } catch (error) {
    logger.error('PWS classification error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to classify problem'
    });
  }
});

// Apply authentication middleware to Socket.io
io.use(authenticateSocket);

// WebSocket connection handler
io.on('connection', (socket: AuthenticatedSocket) => {
  const userId = socket.userId || 'unknown';
  logger.info(`Client connected: ${socket.id}, userId: ${userId}`);

  // Handle session creation or restoration
  socket.on('join_session', ({ sessionId }) => {
    const session = sessionService.getOrCreate(userId, sessionId);
    socket.join(session.sessionId);

    socket.emit('session_created', {
      sessionId: session.sessionId,
      userId: session.userId,
      age: session.age,
      mode: session.mode,
      safetyTier: session.safetyTier,
      conversationHistory: session.conversationHistory
    });

    logger.info(`User ${userId} joined session: ${session.sessionId}`);
  });

  // Handle incoming messages
  socket.on('message', async ({ sessionId, message }) => {
    try {
      logger.info(`Received message from ${userId} in session ${sessionId}`);

      // Get or create session
      const session = sessionService.getOrCreate(userId, sessionId);

      // Add user message to history
      sessionService.addMessage(session.sessionId, 'user', message);

      // Detect safety tier
      const safetyTier = miaService.detectSafetyTier(message);
      if (safetyTier > 1) {
        sessionService.updateSafetyTier(session.sessionId, safetyTier);
        socket.emit('safety_alert', { tier: safetyTier, sessionId: session.sessionId });
      }

      // Detect age
      const detectedAge = miaService.detectAge(message);
      if (detectedAge !== null) {
        sessionService.updateAge(session.sessionId, detectedAge);
        socket.emit('age_detected', { age: detectedAge });
      }

      // Detect and update mode
      const currentAge = session.age || detectedAge;
      const mode = miaService.detectMode(message, currentAge);
      sessionService.updateMode(session.sessionId, mode);

      // Get conversation history BEFORE dialogue processing (needed for Pinecone)
      const history = sessionService.getHistory(session.sessionId);

      // 🎭 DIALOGUE MANAGER: Process message for scenario-driven conversation (async with Pinecone)
      const dialogueAction = await dialogueManager.processMessage(
        session.sessionId,
        message,
        currentAge,
        history // ⭐ Pass history for Pinecone semantic search
      );

      logger.info(`🎭 Dialogue Action: ${dialogueAction.action}, Context:`, dialogueAction.context);

      // Emit dialogue state to client for debugging
      socket.emit('dialogue_state', {
        sessionId: session.sessionId,
        action: dialogueAction.action,
        context: dialogueAction.context,
        progress: dialogueManager.getProgress(session.sessionId)
      });

      // Send message to Mia with dialogue-driven prompt addition
      logger.info(`📝 Mia is responding...`);

      const fullResponse = await miaService.sendMessage({
        userId,
        sessionId: session.sessionId,
        message,
        conversationHistory: history,
        dialogueContext: dialogueAction.promptAddition,
        age: currentAge || undefined,
        mode: mode || undefined,
      });

      logger.info(`✅ Response complete (${fullResponse.length} chars)`);

      await sessionService.addMessage(session.sessionId, 'assistant', fullResponse);

      socket.emit('message_complete', {
        sessionId: session.sessionId,
        message: fullResponse,
      });

    } catch (error) {
      logger.error(`Error processing message: ${error}`);
      socket.emit('error', {
        message: 'Failed to process message',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ========================================
  // PWS (Problems Worth Solving) Handlers
  // ========================================

  // Handle PWS queries
  socket.on('pws_query', async ({ query, sessionId, conversationHistory }) => {
    try {
      logger.info(`PWS Query from ${userId}: "${query.substring(0, 100)}..."`);

      const pwsAssistant = getPWSAssistantService();

      // Generate response with RAG
      const result = await pwsAssistant.generateResponse({
        query,
        conversationHistory: conversationHistory || []
      });

      // Emit complete response
      socket.emit('pws_response', {
        sessionId,
        response: result.response,
        citations: result.citations,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ PWS Response sent (${result.response.length} chars)`);
    } catch (error) {
      logger.error('PWS query error:', error);
      socket.emit('pws_error', {
        message: 'Failed to process PWS query',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle PWS problem classification
  socket.on('pws_classify', async ({ problemDescription, sessionId }) => {
    try {
      logger.info(`PWS Classify from ${userId}`);

      const pwsAssistant = getPWSAssistantService();
      const classification = await pwsAssistant.classifyProblem(problemDescription);

      socket.emit('pws_classification', {
        sessionId,
        classification,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ PWS Classification sent`);
    } catch (error) {
      logger.error('PWS classification error:', error);
      socket.emit('pws_error', {
        message: 'Failed to classify problem',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}, userId: ${userId}`);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Mia WebSocket server running on port ${PORT}`);
  logger.info(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
