import { request } from './client';
import type { ForumDto } from './types';

export interface UpdateForumInput {
  name?: string;
  logo?: string;
}

export async function getCurrentForum(): Promise<ForumDto> {
  return request<ForumDto>('/forums/current');
}

export async function updateCurrentForum(data: UpdateForumInput): Promise<ForumDto> {
  return request<ForumDto>('/forums/current', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
