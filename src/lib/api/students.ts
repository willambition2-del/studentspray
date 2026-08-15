import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, StudentProfileDto } from './types';

export interface StudentQuery extends PaginationQuery {
  branchId?: string;
  halaqaId?: string;
  status?: 'active' | 'archived';
}

export interface CreateStudentInput {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  temporaryPassword?: string;
  studentNumber?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
}

export interface UpdateStudentInput {
  displayName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  studentNumber?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
}

export async function getStudents(query?: StudentQuery): Promise<PaginatedResponse<StudentProfileDto>> {
  return request<PaginatedResponse<StudentProfileDto>>(`/students${buildQuery(query as Record<string, string | number>)}`);
}

export async function getStudent(id: string): Promise<StudentProfileDto> {
  return request<StudentProfileDto>(`/students/${id}`);
}

export async function createStudent(data: CreateStudentInput): Promise<StudentProfileDto> {
  return request<StudentProfileDto>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudent(id: string, data: UpdateStudentInput): Promise<StudentProfileDto> {
  return request<StudentProfileDto>(`/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function archiveStudent(id: string): Promise<unknown> {
  return request<unknown>(`/students/${id}/archive`, {
    method: 'POST',
  });
}

export async function restoreStudent(id: string): Promise<unknown> {
  return request<unknown>(`/students/${id}/restore`, {
    method: 'POST',
  });
}

export async function transferStudentHalaqa(id: string, halaqaId: string): Promise<unknown> {
  return request<unknown>(`/students/${id}/transfer-halaqa`, {
    method: 'POST',
    body: JSON.stringify({ halaqaId }),
  });
}
