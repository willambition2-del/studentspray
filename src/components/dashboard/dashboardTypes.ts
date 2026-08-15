/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  circleId: string;
  circleName: string;
  branch: string;
  status: 'committed' | 'exceeding' | 'lagging';
  attendanceRate: number;
  absenceDays: number;
  delayDays: number;
  memorizedPages: number;
  monthlyAveragePages: number;
  revisionRate: number;
  testScore: number;
  group: 'current' | 'new' | 'graduated';
  grade?: string; // الصف الدراسي
  planComplianceRate?: number; // نسبة إنجاز الخطة الشهرية
  monthlyPlan?: string; // الخطة الشهرية
}

export interface Circle {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  studentsCount: number;
  activeStudentsCount: number;
  attendanceRate: number;
  planComplianceRate: number;
  memorizationPages: number; // أوجه الحفظ الجديدة
  revisionRate: number;
  avgTestScore: number;
  supervisorRating: number; // تقييم الموجه الفني (%)
  overallScore: number; // التقييم الإجمالي للحلقة (%)
  activitiesCount?: number;
  status: 'excellent' | 'good' | 'lagging' | string;
  priorityLabel: string; // لفظ التقييم والشكل مثل "ممتاز جداً"، "ممتاز مرتفع"، "جيد جداً"، "يحتاج رعاية عاجلة"
}

export interface Teacher {
  id: string;
  name: string;
  rating: number;
  studentAvgScore: number;
  planCompliance: number;
  attendanceRate: number;
  supervisorRating: number;
  status: 'outstanding' | 'stable' | 'needs_support';
}

export interface Graduate {
  id: string;
  name: string;
  year: string;
  isQuranMemorizer: boolean;
  worksInQuranicEdu: boolean;
  participatedInAlumniActivities: boolean;
}

export interface AdminAlert {
  id: string;
  title: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  date: string;
}

export interface MonthlyTrend {
  month: string;
  attendanceRate: number;
  planCompliance: number;
  memorizedPages: number;
  avgTestScore: number;
  graduatesCount: number;
}
