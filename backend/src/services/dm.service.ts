import { prisma } from '../config/database.js';

export interface DirectMessageResponse {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: Date;
}

/**
 * Get direct messages with pagination
 */
export async function getMessages(
  limit: number = 50,
  before?: string
): Promise<DirectMessageResponse[]> {
  const messages = await prisma.directMessage.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    ...(before && {
      cursor: { id: before },
      skip: 1,
    }),
    include: {
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderUsername: msg.sender.username,
    createdAt: msg.createdAt,
  })).reverse(); // Return in chronological order
}

/**
 * Save a direct message
 */
export async function saveMessage(
  senderId: string,
  content: string
): Promise<DirectMessageResponse> {
  const message = await prisma.directMessage.create({
    data: {
      senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderUsername: message.sender.username,
    createdAt: message.createdAt,
  };
}
