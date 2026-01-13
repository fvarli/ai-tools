export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}

export interface DMMessagesResponse {
  messages: DirectMessage[];
  hasMore: boolean;
}
