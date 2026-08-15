import { buildQuery, request } from './client';
import type { BranchDto, PaginatedResponse, PaginationQuery } from './types';

export interface BranchQuery extends PaginationQuery {
  status?: 'active' | 'archived' | 'all';
}

export interface CreateBranchInput {
  name: string;
  code: string;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
}

export async function getBranches(query?: BranchQuery): Promise<PaginatedResponse<BranchDto>> {
  return request<PaginatedResponse<BranchDto>>(`/branches${buildQuery(query as Record<string, string | number>)}`);
}

export async function getBranch(id: string): Promise<BranchDto> {
  return request<BranchDto>(`/branches/${id}`);
}

export async function createBranch(data: CreateBranchInput): Promise<BranchDto> {
  return request<BranchDto>('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBranch(id: string, data: UpdateBranchInput): Promise<BranchDto> {
  return request<BranchDto>(`/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function archiveBranch(id: string): Promise<BranchDto> {
  return request<BranchDto>(`/branches/${id}/archive`, {
    method: 'POST',
  });
}

export async function restoreBranch(id: string): Promise<BranchDto> {
  return request<BranchDto>(`/branches/${id}/restore`, {
    method: 'POST',
  });
}
