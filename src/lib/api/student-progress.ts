import { request } from './client';
import type { EducationalPlan } from './educational-plans';
import type { MemorizationRecord, RevisionRecord } from './recitation';

export interface StudentProgressMetrics {
  attendanceRate: number;
  totalAttendanceDays: number;
  totalMemorizationSessions: number;
  avgMemorizationScore: number;
  totalRevisionSessions: number;
  avgRevisionScore: number;
}

export interface StudentProgress {
  student: {
    id: string;
    studentNumber?: string;
    displayName: string;
    username: string;
    activeHalaqa?: {
      id: string;
      name: string;
      branchName?: string;
    } | null;
  };
  activePlan?: {
    id: string;
    name: string;
    type: string;
    progressPercentage: number;
    totalItems: number;
    items: any[];
  } | null;
  metrics: StudentProgressMetrics;
  recentMemorization: MemorizationRecord[];
  recentRevision: RevisionRecord[];
}

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  return request<StudentProgress>(`/students/${studentId}/progress`);
}
