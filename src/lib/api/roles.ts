import { buildQuery, request } from './client';
import type { PaginatedResponse, PaginationQuery, PermissionDto, RoleDto } from './types';

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

export async function getRoles(query?: PaginationQuery): Promise<PaginatedResponse<RoleDto>> {
  return request<PaginatedResponse<RoleDto>>(`/roles${buildQuery(query as Record<string, string | number>)}`);
}

export async function getRole(id: string): Promise<RoleDto> {
  return request<RoleDto>(`/roles/${id}`);
}

export async function createRole(data: CreateRoleInput): Promise<RoleDto> {
  return request<RoleDto>('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(id: string, data: UpdateRoleInput): Promise<RoleDto> {
  return request<RoleDto>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function setRolePermissions(id: string, permissionCodes: string[]): Promise<RoleDto> {
  return request<RoleDto>(`/roles/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionCodes }),
  });
}

export async function getPermissions(): Promise<PermissionDto[]> {
  return request<PermissionDto[]>('/permissions');
}
