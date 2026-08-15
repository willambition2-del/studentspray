import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, TeacherProfileDto } from './types';

export interface TeacherQuery extends PaginationQuery {
  branchId?: string;
  status?: 'active' | 'archived';
}

export interface CreateTeacherInput {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  temporaryPassword?: string;
  employeeNumber?: string;
  specialization?: string;
}

export interface UpdateTeacherInput {
  displayName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  employeeNumber?: string;
  specialization?: string;
}

export async function getTeachers(query?: TeacherQuery): Promise<PaginatedResponse<TeacherProfileDto>> {
  return request<PaginatedResponse<TeacherProfileDto>>(`/teachers${buildQuery(query as Record<string, string | number>)}`);
}

export async function getTeacher(id: string): Promise<TeacherProfileDto> {
  return request<TeacherProfileDto>(`/teachers/${id}`);
}

export async function createTeacher(data: CreateTeacherInput): Promise<TeacherProfileDto> {
  return request<TeacherProfileDto>('/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTeacher(id: string, data: UpdateTeacherInput): Promise<TeacherProfileDto> {
  return request<TeacherProfileDto>(`/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
