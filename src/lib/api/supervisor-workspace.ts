import { buildQuery, request } from './client';
import { EvaluationTemplateDto } from './evaluation-templates';
import {
  EvaluationReportDto,
  FieldVisitDto,
  RecommendationDto,
  RecommendationFollowUpDto,
} from './field-visits';

export interface SupervisorDashboardDto {
  metrics: {
    totalHalaqas: number;
    totalTeachers: number;
    totalVisitsCompleted: number;
    totalVisitsPlanned: number;
    totalVisitsInProgress: number;
    averageEvaluationScore: number;
    openRecommendationsCount: number;
    overdueRecommendationsCount: number;
  };
  recentVisits: FieldVisitDto[];
  upcomingVisits: FieldVisitDto[];
  urgentRecommendations: RecommendationDto[];
}

export interface SupervisorHalaqaDto {
  id: string;
  name: string;
  code: string;
  branchName: string;
  branchId: string;
  studentsCount: number;
  visitsCount: number;
  teachers: Array<{ id: string; name: string; phone?: string }>;
}

export interface SupervisorTeacherDto {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  phone?: string;
  email?: string;
  specialization?: string;
  employeeNumber?: string;
  halaqas: Array<{ id: string; name: string; code: string }>;
  lastVisit?: {
    id: string;
    date: string;
    score: number | null;
    level: string | null;
  } | null;
  openRecommendationsCount: number;
}

export interface VisitWorkspaceDto {
  visit: FieldVisitDto;
  liveSnapshot: {
    totalActiveStudents: number;
    recentAttendanceRate: number;
    recentMemorizationsCount: number;
  };
  previousVisit?: {
    id: string;
    date: string;
    percentage: number | null;
    level: string | null;
  } | null;
  openRecommendations: RecommendationDto[];
  activeTemplate: EvaluationTemplateDto;
}

export const supervisorWorkspaceApi = {
  getDashboard: async () => {
    return request<SupervisorDashboardDto>('/supervisor/me/dashboard');
  },

  getHalaqas: async () => {
    return request<SupervisorHalaqaDto[]>('/supervisor/me/halaqas');
  },

  getTeachers: async () => {
    return request<SupervisorTeacherDto[]>('/supervisor/me/teachers');
  },

  getTeacherDetail: async (teacherId: string) => {
    return request<{
      teacher: SupervisorTeacherDto;
      visitsHistory: FieldVisitDto[];
      recommendations: RecommendationDto[];
    }>(`/supervisor/me/teachers/${teacherId}`);
  },

  getVisits: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    visitType?: string;
    halaqaId?: string;
    teacherId?: string;
  }) => {
    return request<{ items: FieldVisitDto[]; meta: { total: number; page: number; limit: number } }>(
      `/supervisor/me/visits${buildQuery(params)}`
    );
  },

  getVisitDetail: async (id: string) => {
    return request<FieldVisitDto>(`/supervisor/me/visits/${id}`);
  },

  getVisitWorkspace: async (id: string) => {
    return request<VisitWorkspaceDto>(`/supervisor/me/visits/${id}/workspace`);
  },

  createVisit: async (data: {
    halaqaId: string;
    teacherId: string;
    visitType?: string;
    scheduledDate?: string;
    reason?: string;
    summary?: string;
    generalNotes?: string;
    clientMutationId?: string;
  }) => {
    return request<FieldVisitDto>('/supervisor/me/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateVisitStatus: async (
    id: string,
    data: {
      status: string;
      startedAt?: string;
      completedAt?: string;
      summary?: string;
      generalNotes?: string;
    }
  ) => {
    return request<FieldVisitDto>(`/supervisor/me/visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getVisitEvaluation: async (id: string) => {
    return request<EvaluationReportDto>(`/supervisor/me/visits/${id}/evaluation`);
  },

  saveVisitEvaluation: async (
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
    return request<EvaluationReportDto>(`/supervisor/me/visits/${visitId}/evaluation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  submitVisitEvaluation: async (
    visitId: string,
    data: {
      templateId?: string;
      strengths?: string;
      improvementAreas?: string;
      summary?: string;
      criteria: Array<{ criterionId: string; score: number; notApplicable?: boolean; notes?: string }>;
      clientMutationId?: string;
    }
  ) => {
    return request<EvaluationReportDto>(`/supervisor/me/visits/${visitId}/evaluation/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRecommendations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    teacherId?: string;
    halaqaId?: string;
    isOverdue?: boolean;
  }) => {
    return request<{ items: RecommendationDto[]; meta: { total: number; page: number; limit: number } }>(
      `/supervisor/me/recommendations${buildQuery(params)}`
    );
  },

  createRecommendation: async (
    visitId: string,
    data: {
      halaqaId: string;
      teacherId: string;
      title: string;
      description: string;
      domain?: string;
      priority?: string;
      dueDate?: string;
      clientMutationId?: string;
    }
  ) => {
    return request<RecommendationDto>(`/supervisor/me/visits/${visitId}/recommendations`, {
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
    return request<RecommendationDto>(`/supervisor/me/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addRecommendationFollowUp: async (
    id: string,
    data: {
      status: string;
      notes: string;
      clientMutationId?: string;
    }
  ) => {
    return request<RecommendationFollowUpDto>(`/supervisor/me/recommendations/${id}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
