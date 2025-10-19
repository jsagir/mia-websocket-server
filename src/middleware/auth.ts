import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const authenticateSocket = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    // Anonymous user fallback
    const anonymousId = `anon_${Date.now()}`;
    socket.userId = anonymousId;
    logger.info(`Anonymous user connected: ${anonymousId}`);
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.userId = decoded.userId;
    logger.info(`Authenticated user connected: ${socket.userId}`);
    next();
  } catch (error) {
    // If token is invalid, fall back to anonymous
    const anonymousId = `anon_${Date.now()}`;
    socket.userId = anonymousId;
    logger.warn(`Invalid token, using anonymous ID: ${anonymousId}`);
    next();
  }
};
