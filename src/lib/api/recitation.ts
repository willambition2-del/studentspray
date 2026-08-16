import { buildQuery, request } from './client';
import type { PaginatedResponse } from './types';

export type RecitationRating =
  | 'EXCELLENT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'ACCEPTABLE'
  | 'NEEDS_REVIEW';

export interface MemorizationRecord {
  id: string;
  studentId: string;
  halaqaId: string;
  planItemId?: string;
  date: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  pageFrom?: number;
  pageTo?: number;
  evaluationScore: number;
  rating?: RecitationRating;
  mistakesCount: number;
  teacherNotes?: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { displayName: string; username: string };
  };
  halaqa?: { id: string; name: string; code: string };
  createdAt: string;
}

export interface RevisionRecord {
  id: string;
  studentId: string;
  halaqaId: string;
  planItemId?: string;
  date: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  pageFrom?: number;
  pageTo?: number;
  juzNumber?: number;
  evaluationScore: number;
  rating?: RecitationRating;
  mistakesCount: number;
  teacherNotes?: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { displayName: string; username: string };
  };
  halaqa?: { id: string; name: string; code: string };
  createdAt: string;
}

export interface RecitationQuery {
  page?: number;
  limit?: number;
  studentId?: string;
  halaqaId?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: RecitationRating;
}

export interface CreateMemorizationPayload {
  studentId: string;
  halaqaId: string;
  planItemId?: string;
  date: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  pageFrom?: number;
  pageTo?: number;
  evaluationScore?: number;
  rating?: RecitationRating;
  mistakesCount?: number;
  teacherNotes?: string;
  clientMutationId?: string;
}

export interface CreateRevisionPayload {
  studentId: string;
  halaqaId: string;
  planItemId?: string;
  date: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  pageFrom?: number;
  pageTo?: number;
  juzNumber?: number;
  evaluationScore?: number;
  rating?: RecitationRating;
  mistakesCount?: number;
  teacherNotes?: string;
  clientMutationId?: string;
}

export async function createMemorizationRecord(
  payload: CreateMemorizationPayload,
): Promise<MemorizationRecord> {
  return request<MemorizationRecord>('/memorization', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMemorizationHistory(
  query: RecitationQuery = {},
): Promise<PaginatedResponse<MemorizationRecord>> {
  return request<PaginatedResponse<MemorizationRecord>>(
    `/memorization${buildQuery(query as Record<string, string | number>)}`,
  );
}

export async function createRevisionRecord(
  payload: CreateRevisionPayload,
): Promise<RevisionRecord> {
  return request<RevisionRecord>('/revision', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRevisionHistory(
  query: RecitationQuery = {},
): Promise<PaginatedResponse<RevisionRecord>> {
  return request<PaginatedResponse<RevisionRecord>>(
    `/revision${buildQuery(query as Record<string, string | number>)}`,
  );
}
