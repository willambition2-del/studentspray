import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, ParentProfileDto } from './types';

export interface ParentQuery extends PaginationQuery {
  branchId?: string;
  status?: 'active' | 'archived';
}

export interface CreateParentInput {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  temporaryPassword?: string;
  occupation?: string;
}

export interface UpdateParentInput {
  displayName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  occupation?: string;
}

export interface LinkStudentInput {
  relationship: 'FATHER' | 'MOTHER' | 'BROTHER' | 'UNCLE' | 'GUARDIAN' | 'OTHER';
  isPrimary?: boolean;
  canReceiveNotifications?: boolean;
}

export async function getParents(query?: ParentQuery): Promise<PaginatedResponse<ParentProfileDto>> {
  return request<PaginatedResponse<ParentProfileDto>>(`/parents${buildQuery(query as Record<string, string | number>)}`);
}

export async function getParent(id: string): Promise<ParentProfileDto> {
  return request<ParentProfileDto>(`/parents/${id}`);
}

export async function createParent(data: CreateParentInput): Promise<ParentProfileDto> {
  return request<ParentProfileDto>('/parents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateParent(id: string, data: UpdateParentInput): Promise<ParentProfileDto> {
  return request<ParentProfileDto>(`/parents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getParentStudents(id: string): Promise<unknown> {
  return request<unknown>(`/parents/${id}/students`);
}

export async function linkStudentToParent(
  parentId: string,
  studentId: string,
  data: LinkStudentInput
): Promise<unknown> {
  return request<unknown>(`/parents/${parentId}/students/${studentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGuardianLink(
  parentId: string,
  studentId: string,
  data: Partial<LinkStudentInput>
): Promise<unknown> {
  return request<unknown>(`/parents/${parentId}/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function unlinkStudentFromParent(parentId: string, studentId: string): Promise<unknown> {
  return request<unknown>(`/parents/${parentId}/students/${studentId}`, {
    method: 'DELETE',
  });
}
