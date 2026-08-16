import { buildQuery, request } from './client';

export interface FieldVisitDto {
  id: string;
  forumId: string;
  branchId: string;
  supervisorId: string;
  halaqaId: string;
  teacherId: string;
  visitNumber: string;
  visitType: 'ROUTINE' | 'FOLLOW_UP' | 'DIAGNOSTIC' | 'EMERGENCY' | 'COMPREHENSIVE';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  reason?: string;
  summary?: string;
  generalNotes?: string;
  supervisor: {
    id: string;
    user: { id: string; displayName?: string; username: string; phone?: string };
  };
  teacher: {
    id: string;
    user: { id: string; displayName?: string; username: string; phone?: string };
  };
  halaqa: {
    id: string;
    name: string;
    code: string;
    branch?: { id: string; name: string };
  };
  evaluation?: {
    id: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
    totalScore: number;
    percentage: number;
    level?: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'NEEDS_INTERVENTION';
    submittedAt?: string;
  };
  recommendations?: RecommendationDto[];
  _count?: { recommendations: number };
  createdAt: string;
  updatedAt: string;
}

export interface CriterionEvaluationDto {
  id?: string;
  criterionId: string;
  score: number;
  notApplicable?: boolean;
  notes?: string;
  axisNameSnapshot?: string;
  criterionNameSnapshot?: string;
  maxScoreSnapshot?: number;
}

export interface EvaluationReportDto {
  id: string;
  visitId: string;
  templateId: string;
  templateVersion: number;
  templateNameSnapshot: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  level?: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'NEEDS_INTERVENTION';
  strengths?: string;
  improvementAreas?: string;
  summary?: string;
  submittedAt?: string;
  criteriaEvaluations: CriterionEvaluationDto[];
}

export interface RecommendationFollowUpDto {
  id: string;
  recommendationId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  createdAt: string;
}

export interface RecommendationDto {
  id: string;
  forumId: string;
  branchId: string;
  visitId?: string;
  halaqaId: string;
  teacherId: string;
  supervisorId: string;
  title: string;
  description: string;
  domain?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  isOverdue?: boolean;
  teacher: { user: { displayName?: string; username: string } };
  supervisor: { user: { displayName?: string; username: string } };
  halaqa: { name: string; code: string };
  followUps?: RecommendationFollowUpDto[];
  createdAt: string;
  updatedAt: string;
}

export const fieldVisitsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    visitType?: string;
    halaqaId?: string;
    teacherId?: string;
    supervisorId?: string;
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return request<{ items: FieldVisitDto[]; meta: { total: number; page: number; limit: number } }>(
      `/field-visits${buildQuery(params)}`
    );
  },

  getById: async (id: string) => {
    return request<FieldVisitDto>(`/field-visits/${id}`);
  },

  create: async (data: {
    halaqaId: string;
    teacherId: string;
    visitType?: string;
    scheduledDate?: string;
    reason?: string;
    summary?: string;
    generalNotes?: string;
    clientMutationId?: string;
  }) => {
    return request<FieldVisitDto>('/field-visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    id: string,
    data: {
      status: string;
      startedAt?: string;
      completedAt?: string;
      summary?: string;
      generalNotes?: string;
    }
  ) => {
    return request<FieldVisitDto>(`/field-visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  saveEvaluation: async (
    visitId: string,
    data: {
      templateId?: string;
      status?: 'DRAFT' | 'SUBMITTED';
      strengths?: string;
      improvementAreas?: string;
      summary?: string;
      criteria: Array<{ criterionId: string; score: number; notApplicable?: boolean; notes?: string }>;
      clientMutationId?: string;
    }
  ) => {
    return request<EvaluationReportDto>(`/field-visits/${visitId}/evaluation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  listRecommendations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    teacherId?: string;
    halaqaId?: string;
    isOverdue?: boolean;
  }) => {
    return request<{ items: RecommendationDto[]; meta: { total: number; page: number; limit: number } }>(
      `/field-visits/recommendations${buildQuery(params)}`
    );
  },

  createRecommendation: async (data: {
    halaqaId: string;
    teacherId: string;
    visitId?: string;
    title: string;
    description: string;
    domain?: string;
    priority?: string;
    dueDate?: string;
    clientMutationId?: string;
  }) => {
    return request<RecommendationDto>('/field-visits/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRecommendation: async (
    id: string,
    data: {
      status?: string;
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
    }
  ) => {
    return request<RecommendationDto>(`/field-visits/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addFollowUp: async (
    recommendationId: string,
    data: {
      status: string;
      notes: string;
      clientMutationId?: string;
    }
  ) => {
    return request<RecommendationFollowUpDto>(
      `/field-visits/recommendations/${recommendationId}/follow-ups`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};
