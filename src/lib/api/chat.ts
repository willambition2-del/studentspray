import { buildQuery, request } from './client';

export interface ChatConversation {
  id: string;
  type: 'HALAQA' | 'STAFF' | 'PARENT_STUDENT_CHANNEL';
  title: string;
  halaqaId?: string;
  studentId?: string;
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  lastReadAt?: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  isMe: boolean;
  clientMessageId?: string;
  type: 'TEXT' | 'SYSTEM';
  text: string;
  createdAt: string;
}

export interface PaginatedChatMessages {
  items: ChatMessageItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getChatConversations(): Promise<ChatConversation[]> {
  return request<ChatConversation[]>('/chat/conversations');
}

export async function getChatMessages(conversationId: string, params?: { page?: number; limit?: number }): Promise<PaginatedChatMessages> {
  return request<PaginatedChatMessages>(`/chat/conversations/${conversationId}/messages${buildQuery(params as any)}`);
}

export async function sendChatMessage(conversationId: string, text: string, clientMessageId?: string): Promise<ChatMessageItem> {
  return request<ChatMessageItem>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, clientMessageId }),
  });
}

export async function markChatAsRead(conversationId: string, messageId?: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  });
}

export async function getChatUnreadCount(): Promise<{ unreadCount: number }> {
  return request<{ unreadCount: number }>('/chat/unread-count');
}
