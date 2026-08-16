import { buildQuery, request } from './client';

export interface ShelfPublisherRule {
  id: string;
  sectionId: string;
  roleId?: string;
  role?: { id: string; name: string; displayName: string };
  userId?: string;
  user?: { id: string; displayName?: string; username: string };
  canCreate: boolean;
  canPublish: boolean;
}

export interface ShelfSection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  visibility: 'ALL_USERS' | 'STAFF_ONLY' | 'TEACHERS_ONLY' | 'STUDENTS_ONLY' | 'PARENTS_ONLY';
  _count?: { items: number };
  publisherRules?: ShelfPublisherRule[];
  createdAt: string;
}

export interface ShelfItem {
  id: string;
  sectionId: string;
  section?: { id: string; name: string; slug: string };
  title: string;
  content: string;
  type: 'ANNOUNCEMENT' | 'ARTICLE' | 'BOOK' | 'CURRICULUM' | 'RESOURCE' | 'ACTIVITY_RESULT' | 'EXAM_ANNOUNCEMENT' | 'GENERAL';
  attachmentName?: string;
  attachmentUrl?: string;
  fileType?: string;
  fileSize?: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt?: string;
  targetAudience: 'ALL_USERS' | 'STAFF_ONLY' | 'TEACHERS_ONLY' | 'STUDENTS_ONLY' | 'PARENTS_ONLY';
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  downloadCount: number;
  createdAt: string;
}

export async function getShelfSections(): Promise<ShelfSection[]> {
  return request('/shelf/sections');
}

export async function createShelfSection(data: Partial<ShelfSection>): Promise<ShelfSection> {
  return request('/shelf/sections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateShelfSection(id: string, data: Partial<ShelfSection>): Promise<ShelfSection> {
  return request(`/shelf/sections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function setShelfPublisherRule(data: {
  sectionId: string;
  roleId?: string;
  userId?: string;
  canCreate?: boolean;
  canPublish?: boolean;
}): Promise<ShelfPublisherRule> {
  return request('/shelf/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeShelfPublisherRule(ruleId: string): Promise<{ success: boolean }> {
  return request(`/shelf/permissions/${ruleId}`, {
    method: 'DELETE',
  });
}

export async function getShelfItems(params?: {
  sectionId?: string;
  type?: string;
  isPinned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ShelfItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/shelf/items${query}`);
}

export async function getShelfItem(id: string): Promise<ShelfItem> {
  return request(`/shelf/items/${id}`);
}

export async function createShelfItem(data: Partial<ShelfItem>): Promise<ShelfItem> {
  return request('/shelf/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateShelfItem(id: string, data: Partial<ShelfItem>): Promise<ShelfItem> {
  return request(`/shelf/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteShelfItem(id: string): Promise<{ success: boolean }> {
  return request(`/shelf/items/${id}`, {
    method: 'DELETE',
  });
}
