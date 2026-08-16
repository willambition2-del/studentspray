import { buildQuery, request } from './client';
import type { PaginatedResponse } from './types';

export type EducationalPlanType = 'HIFZ' | 'MURAJAAH' | 'CUSTOM';
export type EducationalPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type PlanItemType = 'MEMORIZATION' | 'REVISION' | 'RECITATION' | 'OTHER';
export type PlanItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type TargetType = 'VERSES' | 'PAGES' | 'JUZ';

export interface EducationalPlanItem {
  id: string;
  planId: string;
  type: PlanItemType;
  targetType: TargetType;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  pageFrom?: number;
  pageTo?: number;
  juzNumber?: number;
  targetDate?: string;
  order: number;
  status: PlanItemStatus;
  notes?: string;
}

export interface EducationalPlan {
  id: string;
  forumId: string;
  branchId?: string;
  halaqaId?: string;
  studentId?: string;
  termId?: string;
  name: string;
  type: EducationalPlanType;
  status: EducationalPlanStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  halaqa?: { id: string; name: string; code: string };
  student?: {
    id: string;
    studentNumber?: string;
    user?: { displayName: string; username: string };
  };
  term?: { id: string; name: string };
  items?: EducationalPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EducationalPlanQuery {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  halaqaId?: string;
  studentId?: string;
  termId?: string;
  status?: EducationalPlanStatus;
  type?: EducationalPlanType;
}

export interface CreateEducationalPlanPayload {
  name: string;
  type?: EducationalPlanType;
  branchId?: string;
  halaqaId?: string;
  studentId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: EducationalPlanStatus;
}

export interface CreatePlanItemPayload {
  type?: PlanItemType;
  targetType?: TargetType;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  pageFrom?: number;
  pageTo?: number;
  juzNumber?: number;
  targetDate?: string;
  order?: number;
  notes?: string;
}

export async function getEducationalPlans(
  query: EducationalPlanQuery = {},
): Promise<PaginatedResponse<EducationalPlan>> {
  return request<PaginatedResponse<EducationalPlan>>(
    `/educational-plans${buildQuery(query as Record<string, string | number>)}`,
  );
}

export async function getEducationalPlan(id: string): Promise<EducationalPlan> {
  return request<EducationalPlan>(`/educational-plans/${id}`);
}

export async function createEducationalPlan(
  payload: CreateEducationalPlanPayload,
): Promise<EducationalPlan> {
  return request<EducationalPlan>('/educational-plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEducationalPlan(
  id: string,
  payload: Partial<CreateEducationalPlanPayload>,
): Promise<EducationalPlan> {
  return request<EducationalPlan>(`/educational-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function activateEducationalPlan(id: string): Promise<EducationalPlan> {
  return request<EducationalPlan>(`/educational-plans/${id}/activate`, {
    method: 'POST',
  });
}

export async function archiveEducationalPlan(id: string): Promise<EducationalPlan> {
  return request<EducationalPlan>(`/educational-plans/${id}/archive`, {
    method: 'POST',
  });
}

export async function addPlanItem(
  planId: string,
  payload: CreatePlanItemPayload,
): Promise<EducationalPlanItem> {
  return request<EducationalPlanItem>(`/educational-plans/${planId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePlanItem(
  itemId: string,
  payload: Partial<CreatePlanItemPayload & { status: PlanItemStatus }>,
): Promise<EducationalPlanItem> {
  return request<EducationalPlanItem>(`/educational-plans/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePlanItem(itemId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/educational-plans/items/${itemId}`, {
    method: 'DELETE',
  });
}
