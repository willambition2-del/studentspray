import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, SupervisorProfileDto } from './types';

export interface SupervisorQuery extends PaginationQuery {
  branchId?: string;
  status?: 'active' | 'archived';
}

export interface CreateSupervisorInput {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  temporaryPassword?: string;
  employeeNumber?: string;
}

export interface UpdateSupervisorInput {
  displayName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  employeeNumber?: string;
}

export async function getSupervisors(query?: SupervisorQuery): Promise<PaginatedResponse<SupervisorProfileDto>> {
  return request<PaginatedResponse<SupervisorProfileDto>>(`/supervisors${buildQuery(query as Record<string, string | number>)}`);
}

export async function getSupervisor(id: string): Promise<SupervisorProfileDto> {
  return request<SupervisorProfileDto>(`/supervisors/${id}`);
}

export async function createSupervisor(data: CreateSupervisorInput): Promise<SupervisorProfileDto> {
  return request<SupervisorProfileDto>('/supervisors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSupervisor(id: string, data: UpdateSupervisorInput): Promise<SupervisorProfileDto> {
  return request<SupervisorProfileDto>(`/supervisors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
