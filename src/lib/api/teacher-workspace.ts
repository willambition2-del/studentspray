import { request } from './client';
import type { EducationalPlan } from './educational-plans';
import type { MemorizationRecord, RevisionRecord } from './recitation';

export interface TeacherHalaqaTodayWorkspace {
  halaqa: {
    id: string;
    name: string;
    code: string;
    branch?: { id: string; name: string };
  };
  todayDate: string;
  session?: {
    id: string;
    status: string;
    notes?: string;
  } | null;
  activePlan?: {
    id: string;
    name: string;
    type: string;
    items: any[];
  } | null;
  students: Array<{
    studentId: string;
    studentNumber?: string;
    displayName: string;
    username: string;
    phone?: string;
    todayAttendanceStatus?: string | null;
    todayMemorization?: MemorizationRecord | null;
    todayRevision?: RevisionRecord | null;
  }>;
}

export async function getTeacherMyHalaqas(): Promise<any[]> {
  return request<any[]>('/teacher/me/halaqas');
}

export async function getTeacherTodayWorkspace(
  halaqaId: string,
): Promise<TeacherHalaqaTodayWorkspace> {
  return request<TeacherHalaqaTodayWorkspace>(
    `/teacher/me/halaqas/${halaqaId}/today`,
  );
}
