import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, UserDto } from './types';

export interface UserQuery extends PaginationQuery {
  branchId?: string;
  status?: 'active' | 'suspended' | 'archived';
}

export enum ProfileType {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  TECHNICAL_SUPERVISOR = 'TECHNICAL_SUPERVISOR',
}

export interface CreateUserInput {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  roleId: string;
  temporaryPassword: string;
  profileType?: ProfileType;
}

export interface UpdateUserInput {
  username?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
}

export interface AssignUserRoleInput {
  roleId: string;
  branchId?: string;
}

export async function getUsers(query?: UserQuery): Promise<PaginatedResponse<UserDto>> {
  return request<PaginatedResponse<UserDto>>(`/users${buildQuery(query as Record<string, string | number>)}`);
}

export async function getUser(id: string): Promise<UserDto> {
  return request<UserDto>(`/users/${id}`);
}

export async function createUser(data: CreateUserInput): Promise<UserDto> {
  return request<UserDto>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<UserDto> {
  return request<UserDto>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function assignUserRole(id: string, data: AssignUserRoleInput): Promise<unknown> {
  return request<unknown>(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function activateUser(id: string): Promise<{ id: string; isActive: boolean }> {
  return request<{ id: string; isActive: boolean }>(`/users/${id}/activate`, {
    method: 'POST',
  });
}

export async function suspendUser(id: string): Promise<{ id: string; isActive: boolean }> {
  return request<{ id: string; isActive: boolean }>(`/users/${id}/suspend`, {
    method: 'POST',
  });
}

export async function forcePasswordChange(id: string): Promise<{ id: string; mustChangePassword: boolean }> {
  return request<{ id: string; mustChangePassword: boolean }>(`/users/${id}/force-password-change`, {
    method: 'POST',
  });
}

export async function revokeUserSessions(id: string): Promise<{ revokedSessions: number }> {
  return request<{ revokedSessions: number }>(`/users/${id}/revoke-sessions`, {
    method: 'POST',
  });
}
