import { get } from './client';
import type { DMMessagesResponse } from '../types/dm';

/**
 * Get DM message history
 */
export async function getMessages(limit?: number, before?: string): Promise<DMMessagesResponse> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (before) params.set('before', before);

  const queryString = params.toString();
  const url = `/dm/messages${queryString ? `?${queryString}` : ''}`;

  return get<DMMessagesResponse>(url);
}
