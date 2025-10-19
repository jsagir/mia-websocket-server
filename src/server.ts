import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateSocket, AuthenticatedSocket } from './middleware/auth';
import { sessionService } from './services/session.service';
import { miaService } from './services/mia.service';
import { dialogueManager } from './services/dialogue.service';
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
      }

      // Detect and update mode
      const currentAge = session.age || detectedAge;
      const mode = miaService.detectMode(message, currentAge);
      sessionService.updateMode(session.sessionId, mode);

      // 🎭 DIALOGUE MANAGER: Process message for scenario-driven conversation
      const dialogueAction = dialogueManager.processMessage(
        session.sessionId,
        message,
        currentAge
      );

      logger.info(`🎭 Dialogue Action: ${dialogueAction.action}, Context:`, dialogueAction.context);

      // Emit dialogue state to client for debugging
      socket.emit('dialogue_state', {
        sessionId: session.sessionId,
        action: dialogueAction.action,
        context: dialogueAction.context,
        progress: dialogueManager.getProgress(session.sessionId)
      });

      // Get conversation history
      const history = sessionService.getHistory(session.sessionId);

      // Send message to Mia with dialogue-driven prompt addition
      const stream = await miaService.sendMessage({
        userId,
        sessionId: session.sessionId,
        message,
        conversationHistory: history,
        dialogueContext: dialogueAction.promptAddition, // ⭐ Guide GPT-4o's response
      });

      let fullResponse = '';

      stream
        .on('textCreated', () => {
          logger.info(`📝 Mia is responding...`);
        })
        .on('textDelta', (textDelta) => {
          const content = textDelta.value || '';
          if (content) {
            fullResponse += content;
            socket.emit('message_chunk', {
              sessionId: session.sessionId,
              chunk: content,
            });
          }
        })
        .on('textDone', async () => {
          logger.info(`✅ Response complete (${fullResponse.length} chars)`);

          await sessionService.addMessage(
            session.sessionId,
            'assistant',
            fullResponse
          );

          socket.emit('message_complete', {
            sessionId: session.sessionId,
            message: fullResponse,
          });

          logger.info(`Completed message streaming for session ${session.sessionId}`);
        })
        .on('error', (error) => {
          logger.error('❌ Stream error:', error);
          socket.emit('error', {
            sessionId: session.sessionId,
            message: 'Stream error occurred',
            error: error.message,
          });
        });
    } catch (error) {
      logger.error(`Error processing message: ${error}`);
      socket.emit('error', {
        message: 'Failed to process message',
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
