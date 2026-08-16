import { request } from './client';
import { StudentDashboardData } from './student-portal';

export interface ChildSummary {
  id: string;
  name: string;
  studentNumber?: string;
  relationship: string;
  isPrimary: boolean;
  halaqaId?: string;
  halaqaName: string;
  teacherName: string;
  teacherPhone?: string;
  attendanceRate: number;
  lastExamScore?: number | null;
  lastExamTitle?: string | null;
  latestRating?: string | null;
}

export async function getParentChildren(): Promise<ChildSummary[]> {
  return request<ChildSummary[]>('/parent/me/children');
}

export async function getChildDashboard(studentId: string): Promise<StudentDashboardData> {
  return request<StudentDashboardData>(`/parent/me/children/${studentId}/dashboard`);
}

export async function getChildPlan(studentId: string): Promise<any[]> {
  return request<any[]>(`/parent/me/children/${studentId}/plan`);
}

export async function getChildAttendance(studentId: string): Promise<{ summary: any; history: any[] }> {
  return request<{ summary: any; history: any[] }>(`/parent/me/children/${studentId}/attendance`);
}

export async function getChildMemorization(studentId: string): Promise<any[]> {
  return request<any[]>(`/parent/me/children/${studentId}/memorization`);
}

export async function getChildRevision(studentId: string): Promise<any[]> {
  return request<any[]>(`/parent/me/children/${studentId}/revision`);
}

export async function getChildExams(studentId: string): Promise<{ upcomingExams: any[]; results: any[] }> {
  return request<{ upcomingExams: any[]; results: any[] }>(`/parent/me/children/${studentId}/exams`);
}

export async function getChildEvaluations(studentId: string): Promise<any[]> {
  return request<any[]>(`/parent/me/children/${studentId}/evaluations`);
}

export async function getChildProgress(studentId: string): Promise<any> {
  return request<any>(`/parent/me/children/${studentId}/progress`);
}
