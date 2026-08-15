import { buildQuery, request } from './client';
import type { HalaqaDto, PaginatedResponse, PaginationQuery } from './types';

export interface HalaqaQuery extends PaginationQuery {
  branchId?: string;
  teacherId?: string;
  supervisorId?: string;
  status?: 'active' | 'archived';
}

export interface CreateHalaqaInput {
  branchId: string;
  name: string;
  code: string;
  description?: string;
}

export interface UpdateHalaqaInput {
  branchId?: string;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export async function getHalaqas(query?: HalaqaQuery): Promise<PaginatedResponse<HalaqaDto>> {
  return request<PaginatedResponse<HalaqaDto>>(`/halaqas${buildQuery(query as Record<string, string | number>)}`);
}

export async function getHalaqa(id: string): Promise<HalaqaDto> {
  return request<HalaqaDto>(`/halaqas/${id}`);
}

export async function createHalaqa(data: CreateHalaqaInput): Promise<HalaqaDto> {
  return request<HalaqaDto>('/halaqas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHalaqa(id: string, data: UpdateHalaqaInput): Promise<HalaqaDto> {
  return request<HalaqaDto>(`/halaqas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function archiveHalaqa(id: string): Promise<HalaqaDto> {
  return request<HalaqaDto>(`/halaqas/${id}/archive`, {
    method: 'POST',
  });
}

export async function restoreHalaqa(id: string): Promise<HalaqaDto> {
  return request<HalaqaDto>(`/halaqas/${id}/restore`, {
    method: 'POST',
  });
}

// Student Memberships
export async function getHalaqaStudents(halaqaId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/students`);
}

export async function addStudentToHalaqa(halaqaId: string, studentId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/students/${studentId}`, {
    method: 'POST',
  });
}

export async function removeStudentFromHalaqa(halaqaId: string, studentId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/students/${studentId}/remove`, {
    method: 'POST',
  });
}

// Teacher Assignments
export async function getHalaqaTeachers(halaqaId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/teachers`);
}

export async function assignTeacherToHalaqa(halaqaId: string, teacherId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/teachers/${teacherId}`, {
    method: 'POST',
  });
}

export async function endTeacherAssignment(halaqaId: string, teacherId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/teachers/${teacherId}/end`, {
    method: 'POST',
  });
}

// Supervisor Assignments
export async function getHalaqaSupervisors(halaqaId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/supervisors`);
}

export async function assignSupervisorToHalaqa(halaqaId: string, supervisorId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/supervisors/${supervisorId}`, {
    method: 'POST',
  });
}

export async function endSupervisorAssignment(halaqaId: string, supervisorId: string): Promise<unknown> {
  return request<unknown>(`/halaqas/${halaqaId}/supervisors/${supervisorId}/end`, {
    method: 'POST',
  });
}
