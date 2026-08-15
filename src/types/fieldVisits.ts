/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisitType = 'periodic' | 'followup' | 'therapeutic' | 'surprise' | 'comprehensive';
export type VisitStatus = 'draft' | 'pending_approval' | 'approved';
export type EvaluationLevel = 'excellent' | 'very_good' | 'good' | 'needs_improvement' | 'needs_intervention';
export type NoteVisibility = 'shared_with_teacher' | 'admin_only' | 'confidential';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecommendationStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type EvidenceConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceAttachment {
  id: string;
  title: string;
  type: 'image' | 'file' | 'document' | 'system_link' | 'note';
  url?: string;
  systemRef?: string; // Reference inside system e.g. "Exam #104", "Attendance Log 2026-08-01"
  uploadedBy: string;
  uploadedAt: string;
}

export interface VisitNote {
  id: string;
  text: string;
  visibility: NoteVisibility;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface EvaluationAxis {
  id: string;
  name: string; // e.g. "الجانب التعليمي"
  description: string;
  weight: number; // Percentage e.g. 20 (sum of all axes = 100)
  score: number; // Score out of 100 or 10
  notes: string;
  strengths: string[];
  improvements: string[];
  evidences: EvidenceAttachment[];
}

export interface Recommendation {
  id: string;
  title: string;
  domain: string; // e.g. "الجانب التعليمي", "إدارة السجلات", "التحفيز"
  assignedToRole: 'teacher' | 'supervisor' | 'management';
  assignedToName: string;
  startDate: string;
  dueDate: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  notes?: string;
  completionProofUrl?: string;
  completionProofNote?: string;
  completedAt?: string;
}

export interface ImprovementPlan {
  id: string;
  title: string;
  targetCompletionRate: number;
  currentCompletionRate: number;
  recommendations: Recommendation[];
  lastUpdated: string;
}

export interface TeacherResponse {
  id: string;
  teacherId: string;
  teacherName: string;
  notes: string;
  attachmentName?: string;
  attachmentUrl?: string;
  actionTaken?: string;
  submittedAt: string;
}

export interface EvaluationAppeal {
  id: string;
  teacherId: string;
  teacherName: string;
  axisOrItem: string; // البند المعترض عليه
  reason: string; // سبب الاعتراض
  explanation: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  responseNotes?: string;
  respondedBy?: string;
  submittedAt: string;
}

export interface ReportAccessRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  visitId: string;
  visitDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedType?: 'full_unredacted' | 'teacher_summary';
  decisionNotes?: string;
  decidedBy?: string;
  requestedAt: string;
}

export interface VisitAuditTrail {
  id: string;
  authorName: string;
  authorRole: string;
  action: string; // e.g. "إنشاء الزيارة", "اعتماد التقرير", "طلب تعديل"
  reason?: string;
  details?: string;
  timestamp: string;
}

export interface FieldVisitRecord {
  id: string;
  visitNumber: string; // e.g. VIS-1447-012
  circleId: string;
  circleName: string;
  teacherId: string;
  teacherName: string;
  supervisorId: string;
  supervisorName: string;
  visitDate: string;
  startTime: string; // e.g. "16:30"
  endTime: string; // e.g. "18:00"
  visitType: VisitType;
  reason: string;
  initialNotes?: string;
  
  // Axes Evaluation
  axes: EvaluationAxis[];
  totalScore: number; // 0 to 100
  level: EvaluationLevel;

  // System Indicators Provenance (At the time of visit)
  systemDataSnapshot: {
    attendanceRate: number; // المصدر: سجل الحضور
    hifzRate: number; // المصدر: سجلات الحفظ
    revisionRate: number; // المصدر: سجلات المراجعة
    examAvgScore: number; // المصدر: نظام الاختبارات والدرجات
    laggingStudentsCount: number; // المصدر: قائمة الطلاب المتعثرين
    distinguishedStudentsCount: number; // المصدر: قائمة الطلاب المتميزين
    totalStudents: number;
    activitiesCount: number;
    badgesCount: number;
    previousVisitScore?: number;
    previousVisitDate?: string;
    previousRecommendationsCount?: number;
    previousRecommendationsImplementedRate?: number;
  };

  // Discrepancy calculation between Field Score and System Data Score
  discrepancyAlert?: {
    hasDiscrepancy: boolean;
    differencePercentage: number;
    message: string;
  };

  // Evidence Confidence Index
  evidenceConfidence: EvidenceConfidenceLevel;
  confidenceScorePercentage: number;

  // Categorized Notes
  notes: VisitNote[];

  // Strengths & Improvements Global
  globalStrengths: string[];
  globalImprovements: string[];

  // Recommendations & Improvement Plan
  recommendations: Recommendation[];
  improvementPlan: ImprovementPlan;

  // Status & Workflow
  status: VisitStatus;

  // Teacher Interactions
  teacherResponse?: TeacherResponse;
  appeals: EvaluationAppeal[];
  reportAccessRequests: ReportAccessRequest[];

  // Historical Audit
  auditTrail: VisitAuditTrail[];

  // Previous visit follow-up
  previousVisitFollowup?: {
    previousVisitId: string;
    werePreviousRecommendationsResolved: 'fully' | 'partially' | 'not_resolved';
    notes: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface EvaluationLevelSetting {
  level: EvaluationLevel;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
  badgeBg: string;
  badgeColor?: string;
}

export const DEFAULT_EVALUATION_LEVELS: EvaluationLevelSetting[] = [
  { level: 'excellent', label: 'ممتاز', minScore: 90, maxScore: 100, color: 'text-emerald-700', badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { level: 'very_good', label: 'جيد جداً', minScore: 80, maxScore: 89.9, color: 'text-blue-700', badgeBg: 'bg-blue-100 border-blue-300 text-blue-900' },
  { level: 'good', label: 'جيد', minScore: 70, maxScore: 79.9, color: 'text-amber-700', badgeBg: 'bg-amber-100 border-amber-300 text-amber-900' },
  { level: 'needs_improvement', label: 'يحتاج تحسين', minScore: 60, maxScore: 69.9, color: 'text-orange-700', badgeBg: 'bg-orange-100 border-orange-300 text-orange-900' },
  { level: 'needs_intervention', label: 'يحتاج تدخل', minScore: 0, maxScore: 59.9, color: 'text-rose-700', badgeBg: 'bg-rose-100 border-rose-300 text-rose-900' }
];

export const DEFAULT_EVALUATION_AXES_CONFIG = [
  { id: 'educational', name: 'الجانب التعليمي', description: 'جودة التلاوة، مخارج الحروف، التجويد النظري والتطبيقي، وطريقة تصحيح الأخطاء.', defaultWeight: 25 },
  { id: 'tarbawi', name: 'الجانب التربوي', description: 'التحفيز، توجيه السلوك، التفاعل الإيجابي، وبناء قيم الوقار والالتزام.', defaultWeight: 20 },
  { id: 'outcomes', name: 'أداء الطلاب ونتائجهم', description: 'نسب الحفظ والمراجعة، درجات الاختبارات، ونسبة إنجاز الخطة المقررة.', defaultWeight: 20 },
  { id: 'admin_org', name: 'الإدارة والتنظيم', description: 'انتظام السجلات اليومية، رصد الحضور والغياب، والالتزام بجدول الحلقة.', defaultWeight: 15 },
  { id: 'environment', name: 'البيئة والتنظيم', description: 'ترتيب الجلسة، هدوء الحلقة، وتأمين الوسائل المساعدة والكتب.', defaultWeight: 10 },
  { id: 'initiative', name: 'المبادرة والتطوير', description: 'ابتكار أنشطة محفزة، المتابعة مع أولياء الأمور، ورعاية الموهوبين والمتعثرين.', defaultWeight: 10 }
];
