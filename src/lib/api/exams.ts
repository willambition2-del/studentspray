import { buildQuery, request } from './client';

export interface ExamCriterion {
  id?: string;
  name: string;
  description?: string;
  maxScore: number;
  order?: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  curriculum?: string;
  examType: 'MONTHLY' | 'MIDTERM' | 'FINAL' | 'CONTINUOUS' | 'MEMORIZATION' | 'RECITATION' | 'REVISION';
  scheduledDate?: string;
  maxScore: number;
  passScore: number;
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'COMPLETED' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  publishedAt?: string;
  branchId?: string;
  branch?: { id: string; name: string; code: string };
  halaqaId?: string;
  halaqa?: { id: string; name: string; code: string };
  academicYearId?: string;
  termId?: string;
  criteria?: ExamCriterion[];
  resultsCount?: number;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  halaqaName?: string;
  score: number;
  percentage: number;
  status: 'ENTERED' | 'PASSED' | 'FAILED' | 'ABSENT' | 'NOT_TESTED' | 'POSTPONED' | 'EXEMPT';
  isPassed: boolean;
  notes?: string;
  criterionScores?: Record<string, number>;
  isPublished: boolean;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
}

export async function getExams(params?: {
  branchId?: string;
  halaqaId?: string;
  academicYearId?: string;
  termId?: string;
  examType?: string;
  status?: string;
  isPublished?: boolean;
  search?: string;
}): Promise<Exam[]> {
  return request<Exam[]>(`/exams${buildQuery(params as any)}`);
}

export async function getExam(id: string): Promise<Exam> {
  return request<Exam>(`/exams/${id}`);
}

export async function createExam(data: {
  title: string;
  description?: string;
  curriculum?: string;
  examType?: string;
  scheduledDate?: string;
  maxScore?: number;
  passScore?: number;
  status?: string;
  branchId?: string;
  halaqaId?: string;
  academicYearId?: string;
  termId?: string;
  criteria?: ExamCriterion[];
}): Promise<Exam> {
  return request<Exam>('/exams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
  return request<Exam>(`/exams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteExam(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/exams/${id}`, {
    method: 'DELETE',
  });
}

export async function publishExam(id: string, isPublished: boolean): Promise<{ id: string; isPublished: boolean; status: string }> {
  return request<{ id: string; isPublished: boolean; status: string }>(`/exams/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export async function getExamResults(examId: string): Promise<ExamResult[]> {
  return request<ExamResult[]>(`/exams/${examId}/results`);
}

export async function bulkGradeExam(examId: string, results: Array<{
  studentId: string;
  score: number;
  status?: string;
  notes?: string;
  criterionScores?: Record<string, number>;
}>): Promise<{ success: boolean; count: number; examId: string }> {
  return request<{ success: boolean; count: number; examId: string }>(`/exams/${examId}/results`, {
    method: 'PUT',
    body: JSON.stringify({ results }),
  });
}

export async function updateExamResult(
  examId: string,
  resultId: string,
  data: {
    score: number;
    status?: string;
    notes?: string;
    correctionReason?: string;
    criterionScores?: Record<string, number>;
  }
): Promise<ExamResult> {
  return request<ExamResult>(`/exams/${examId}/results/${resultId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
