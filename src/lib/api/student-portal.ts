import { request } from './client';

export interface StudentDashboardData {
  student: {
    id: string;
    name: string;
    studentNumber?: string;
    halaqaName: string;
    teacherName: string;
    teacherPhone?: string;
  };
  plan?: {
    id: string;
    title: string;
    type: string;
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
    items: any[];
  } | null;
  attendance: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  memorization: {
    totalRecords: number;
    latest?: {
      date: string;
      surahNumber: number;
      fromAyah: number;
      toAyah: number;
      score: number;
    } | null;
  };
  revision: {
    totalRecords: number;
    latest?: {
      date: string;
      surahNumber?: number;
      fromAyah?: number;
      toAyah?: number;
      score: number;
    } | null;
  };
  upcomingExams: Array<{
    id: string;
    title: string;
    examType: string;
    scheduledDate?: string;
    maxScore: number;
  }>;
  recentResults: Array<{
    id: string;
    examTitle: string;
    examType: string;
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    status: string;
    date: string;
  }>;
  latestEvaluation?: {
    id: string;
    period?: string;
    evaluationDate: string;
    rating: string;
    overallScore?: number;
    teacherNotes?: string;
    actionLabel?: string;
  } | null;
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  return request<StudentDashboardData>('/student/me/dashboard');
}

export async function getStudentPlan(): Promise<any[]> {
  return request<any[]>('/student/me/plan');
}

export async function getStudentAttendance(): Promise<{ summary: any; history: any[] }> {
  return request<{ summary: any; history: any[] }>('/student/me/attendance');
}

export async function getStudentMemorization(): Promise<any[]> {
  return request<any[]>('/student/me/memorization');
}

export async function getStudentRevision(): Promise<any[]> {
  return request<any[]>('/student/me/revision');
}

export async function getStudentExams(): Promise<{ upcomingExams: any[]; results: any[] }> {
  return request<{ upcomingExams: any[]; results: any[] }>('/student/me/exams');
}

export async function getStudentEvaluationsList(): Promise<any[]> {
  return request<any[]>('/student/me/evaluations');
}

export async function getStudentProgressOverview(): Promise<any> {
  return request<any>('/student/me/progress');
}
