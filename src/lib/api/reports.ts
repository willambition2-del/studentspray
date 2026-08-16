import { buildQuery, request } from './client';

export interface DashboardSummaryResponse {
  totalStudents: number;
  totalTeachers: number;
  totalSupervisors: number;
  totalHalaqas: number;
  attendanceRate: number;
  activePlansCount: number;
  openRequestsCount: number;
  openAlertsCount: number;
  overdueTasksCount: number;
  fieldVisitsCount: number;
  openRecommendationsCount: number;
  activitiesCount: number;
  competitionsCount: number;
}

export interface StudentReportResponse {
  student: {
    id: string;
    studentNumber?: string;
    name: string;
    email?: string;
    phone?: string;
    branchName?: string;
    halaqaName?: string;
    teacherName?: string;
  };
  attendance: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  memorization: {
    completedRecords: number;
    recentRecords: Array<{
      id: string;
      surahNumber: number;
      fromAyah: number;
      toAyah: number;
      evaluationScore: number;
      date: string;
    }>;
  };
  revision: {
    completedRecords: number;
    recentRecords: Array<{
      id: string;
      surahNumber?: number;
      fromAyah?: number;
      toAyah?: number;
      evaluationScore: number;
      date: string;
    }>;
  };
  plan: {
    id: string;
    name: string;
    type: string;
  } | null;
  exams: Array<{
    id: string;
    examTitle: string;
    score: number;
    maxScore: number;
    passed: boolean;
  }>;
  evaluations: Array<{
    id: string;
    score: number;
    evaluationDate: string;
    notes?: string | null;
  }>;
  activities: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
  }>;
  awards: Array<{
    id: string;
    title: string;
    category: string;
    grantedAt: string;
  }>;
}

export interface HalaqaReportResponse {
  halaqa: {
    id: string;
    name: string;
    branchName?: string;
    teacherName?: string;
    supervisorName?: string;
    studentCount: number;
  };
  stats: {
    attendanceRate: number;
    totalMemorizationRecords: number;
    totalRevisionRecords: number;
    totalExamResults: number;
  };
  students: Array<{
    id: string;
    studentNumber?: string;
    name: string;
  }>;
}

export interface AttendanceReportResponse {
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  records: Array<{
    id: string;
    date: string;
    studentName: string;
    halaqaName?: string;
    branchName?: string;
    status: string;
  }>;
}

export interface AdministrativeReportResponse {
  requests: Array<{ status: string; count: number }>;
  activeDecisionsCount: number;
  openTasksCount: number;
  overdueTasksCount: number;
  openAlertsCount: number;
}

export interface ReportFilterParams {
  [key: string]: string | number | boolean | undefined;
  branchId?: string;
  halaqaId?: string;
  studentId?: string;
  teacherId?: string;
  supervisorId?: string;
  academicYearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return request<DashboardSummaryResponse>('/reports/dashboard-summary');
}

export async function getStudentReport(studentId: string): Promise<StudentReportResponse> {
  return request<StudentReportResponse>(`/reports/students/${studentId}`);
}

export async function getHalaqaReport(
  halaqaId: string,
  params?: ReportFilterParams,
): Promise<HalaqaReportResponse> {
  const query = buildQuery(params || {});
  return request<HalaqaReportResponse>(`/reports/halaqas/${halaqaId}${query}`);
}

export async function getAttendanceReport(
  params?: ReportFilterParams,
): Promise<AttendanceReportResponse> {
  const query = buildQuery(params || {});
  return request<AttendanceReportResponse>(`/reports/attendance${query}`);
}

export async function getExamReport(examId: string): Promise<any> {
  return request<any>(`/reports/exams/${examId}`);
}

export async function getTeacherReport(teacherId: string): Promise<any> {
  return request<any>(`/reports/teachers/${teacherId}`);
}

export async function getSupervisorReport(supervisorId: string): Promise<any> {
  return request<any>(`/reports/supervisors/${supervisorId}`);
}

export async function getAdministrativeReport(
  params?: ReportFilterParams,
): Promise<AdministrativeReportResponse> {
  const query = buildQuery(params || {});
  return request<AdministrativeReportResponse>(`/reports/administrative${query}`);
}

export async function downloadStudentReportPdf(studentId: string, studentName: string): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const response = await fetch(`/api/v1/reports/students/${studentId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to download student PDF report');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-الطالب-${studentName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadHalaqaReportPdf(halaqaId: string, halaqaName: string): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const response = await fetch(`/api/v1/reports/halaqas/${halaqaId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to download halaqa PDF report');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-الحلقة-${halaqaName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadAttendanceCsv(params?: ReportFilterParams): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const query = buildQuery(params || {});
  const response = await fetch(`/api/v1/reports/attendance/export${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to download attendance CSV');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'تقرير-الحضور-والغياب.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadStudentsCsv(params?: ReportFilterParams): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const query = buildQuery(params || {});
  const response = await fetch(`/api/v1/reports/students/export${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to download students CSV');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'قائمة-الطلاب.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
