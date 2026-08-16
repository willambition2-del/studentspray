import { buildQuery, request } from './client';

export interface StudentEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  halaqaId: string;
  halaqaName: string;
  academicYearId?: string;
  termId?: string;
  evaluationDate: string;
  period?: string;
  behaviorScore?: number;
  discipline?: number;
  participation?: number;
  overallScore?: number;
  rating: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_IMPROVEMENT';
  teacherNotes?: string;
  actionLabel?: string;
  isPublished: boolean;
  evaluatorName?: string;
  createdAt: string;
}

export async function getStudentEvaluations(params?: {
  halaqaId?: string;
  studentId?: string;
  termId?: string;
  rating?: string;
  isPublished?: boolean;
}): Promise<StudentEvaluation[]> {
  return request<StudentEvaluation[]>(`/student-evaluations${buildQuery(params as any)}`);
}

export async function getStudentEvaluation(id: string): Promise<StudentEvaluation> {
  return request<StudentEvaluation>(`/student-evaluations/${id}`);
}

export async function createStudentEvaluation(data: {
  studentId: string;
  halaqaId: string;
  academicYearId?: string;
  termId?: string;
  evaluationDate: string;
  period?: string;
  behaviorScore?: number;
  discipline?: number;
  participation?: number;
  overallScore?: number;
  rating?: string;
  teacherNotes?: string;
  actionLabel?: string;
  isPublished?: boolean;
}): Promise<StudentEvaluation> {
  return request<StudentEvaluation>('/student-evaluations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudentEvaluation(id: string, data: Partial<StudentEvaluation>): Promise<StudentEvaluation> {
  return request<StudentEvaluation>(`/student-evaluations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudentEvaluation(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/student-evaluations/${id}`, {
    method: 'DELETE',
  });
}
