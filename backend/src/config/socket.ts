import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyAccessToken } from '../services/token.service.js';
import { prisma } from './database.js';
import * as dmService from '../services/dm.service.js';
import { logger } from '../utils/logger.js';
import { config } from './index.js';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      userId: string;
      username: string;
      role: string;
    };
  };
}

let io: Server | null = null;

export function setupSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Try to get token from auth object first, then from cookies
      let token = socket.handshake.auth.token;

      if (!token) {
        // Parse cookies from handshake headers
        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          const cookies = cookie.parse(cookieHeader);
          token = cookies.accessToken;
        }
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);

      // Get user with role from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, username, role } = socket.data.user;
    logger.info(`Socket connected: ${username} (${role})`);

    // Only DM_USER role can join the DM room
    if (role === 'DM_USER') {
      socket.join('dm-room');
      logger.info(`${username} joined dm-room`);

      // Send initial online status
      socket.to('dm-room').emit('dm:user-online', { userId, username });
    }

    // Handle DM message sending
    socket.on('dm:send', async (content: string) => {
      if (role !== 'DM_USER') {
        socket.emit('dm:error', { message: 'Not authorized to send DM' });
        return;
      }

      try {
        const message = await dmService.saveMessage(userId, content);
        io?.to('dm-room').emit('dm:message', message);
      } catch (error) {
        logger.error('Error saving DM:', error);
        socket.emit('dm:error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('dm:typing', () => {
      if (role === 'DM_USER') {
        socket.to('dm-room').emit('dm:user-typing', { userId, username });
      }
    });

    socket.on('dm:stop-typing', () => {
      if (role === 'DM_USER') {
        socket.to('dm-room').emit('dm:user-stop-typing', { userId, username });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${username}`);
      if (role === 'DM_USER') {
        socket.to('dm-room').emit('dm:user-offline', { userId, username });
      }
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
