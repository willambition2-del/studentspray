import { buildQuery, request } from './client';

export interface EvaluationCriterionDto {
  id?: string;
  name: string;
  description?: string;
  type?: 'SCALE_5' | 'SCALE_10' | 'PERCENTAGE' | 'NUMERIC' | 'YES_NO';
  maxScore?: number;
  weight?: number;
  isRequired?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface EvaluationAxisDto {
  id?: string;
  name: string;
  description?: string;
  weight: number;
  order?: number;
  isActive?: boolean;
  criteria: EvaluationCriterionDto[];
}

export interface EvaluationTemplateDto {
  id: string;
  forumId: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  axes: EvaluationAxisDto[];
  _count?: { evaluations: number };
}

export const evaluationTemplatesApi = {
  list: async (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    return request<{ items: EvaluationTemplateDto[]; meta: { total: number; page: number; limit: number } }>(
      `/evaluation-templates${buildQuery(params)}`
    );
  },

  getActive: async () => {
    return request<EvaluationTemplateDto>('/evaluation-templates/active');
  },

  getById: async (id: string) => {
    return request<EvaluationTemplateDto>(`/evaluation-templates/${id}`);
  },

  create: async (data: {
    name: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    axes: EvaluationAxisDto[];
  }) => {
    return request<EvaluationTemplateDto>('/evaluation-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
      isActive?: boolean;
      axes?: EvaluationAxisDto[];
    }
  ) => {
    return request<EvaluationTemplateDto>(`/evaluation-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  activate: async (id: string) => {
    return request<EvaluationTemplateDto>(`/evaluation-templates/${id}/activate`, {
      method: 'POST',
    });
  },

  delete: async (id: string) => {
    return request(`/evaluation-templates/${id}`, {
      method: 'DELETE',
    });
  },
};
