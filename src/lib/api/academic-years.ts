import { buildQuery, request } from './client';
import type { PaginatedResponse } from './types';

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  order: number;
  isActive: boolean;
}

export interface AcademicYear {
  id: string;
  forumId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  terms?: Term[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateAcademicYearPayload {
  name: string;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface CreateTermPayload {
  name: string;
  startsAt: string;
  endsAt: string;
  order?: number;
  isActive?: boolean;
}

export async function getAcademicYears(
  query: AcademicYearQuery = {},
): Promise<PaginatedResponse<AcademicYear>> {
  return request<PaginatedResponse<AcademicYear>>(
    `/academic-years${buildQuery(query as Record<string, string | number | boolean>)}`,
  );
}

export async function getAcademicYear(id: string): Promise<AcademicYear> {
  return request<AcademicYear>(`/academic-years/${id}`);
}

export async function createAcademicYear(
  payload: CreateAcademicYearPayload,
): Promise<AcademicYear> {
  return request<AcademicYear>('/academic-years', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAcademicYear(
  id: string,
  payload: Partial<CreateAcademicYearPayload>,
): Promise<AcademicYear> {
  return request<AcademicYear>(`/academic-years/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function activateAcademicYear(id: string): Promise<AcademicYear> {
  return request<AcademicYear>(`/academic-years/${id}/activate`, {
    method: 'POST',
  });
}

export async function addTermToAcademicYear(
  academicYearId: string,
  payload: CreateTermPayload,
): Promise<Term> {
  return request<Term>(`/academic-years/${academicYearId}/terms`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTerm(
  termId: string,
  payload: Partial<CreateTermPayload>,
): Promise<Term> {
  return request<Term>(`/academic-years/terms/${termId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
