import { buildQuery, request } from './client';
import type { PaginatedResponse } from './types';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type SessionStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED';

export interface AttendanceRecordItem {
  id?: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { displayName: string; username: string };
  };
}

export interface AttendanceSession {
  id: string;
  forumId: string;
  halaqaId: string;
  sessionDate: string;
  startedAt?: string;
  endedAt?: string;
  status: SessionStatus;
  notes?: string;
  records: AttendanceRecordItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceQuery {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
}

export interface CreateAttendanceSessionPayload {
  sessionDate: string;
  status?: SessionStatus;
  notes?: string;
  records?: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
  clientMutationId?: string;
}

export interface AttendanceSummary {
  halaqaId: string;
  totalSessions: number;
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export async function createOrUpdateAttendanceSession(
  halaqaId: string,
  payload: CreateAttendanceSessionPayload,
): Promise<AttendanceSession> {
  return request<AttendanceSession>(
    `/halaqas/${halaqaId}/attendance/sessions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateAttendanceSessionRecords(
  sessionId: string,
  records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
): Promise<AttendanceSession> {
  return request<AttendanceSession>(
    `/attendance/sessions/${sessionId}/records`,
    {
      method: 'PUT',
      body: JSON.stringify({ records }),
    },
  );
}

export async function getHalaqaAttendanceHistory(
  halaqaId: string,
  query: AttendanceQuery = {},
): Promise<PaginatedResponse<AttendanceSession>> {
  return request<PaginatedResponse<AttendanceSession>>(
    `/halaqas/${halaqaId}/attendance${buildQuery(query as Record<string, string | number>)}`,
  );
}

export async function getStudentAttendanceHistory(
  studentId: string,
  query: AttendanceQuery = {},
): Promise<PaginatedResponse<any>> {
  return request<PaginatedResponse<any>>(
    `/students/${studentId}/attendance${buildQuery(query as Record<string, string | number>)}`,
  );
}

export async function getHalaqaAttendanceSummary(
  halaqaId: string,
): Promise<AttendanceSummary> {
  return request<AttendanceSummary>(`/halaqas/${halaqaId}/attendance/summary`);
}
