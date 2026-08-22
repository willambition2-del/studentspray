import { Student } from '../types';

export interface RequiredFile {
  id: string;
  name: string;
  status: 'completed' | 'missing' | 'not_uploaded';
  url?: string;
}

export interface EvaluationPeriod {
  id: string;
  name: string;
  curriculum: string;
  examType: string; // 'شهري' | 'فصلي' | 'نهائي' | 'تقييم مستمر'
  startDate: string;
  endDate: string;
  targetCategory: string;
  targetCircles: string[]; // Circle IDs
  maxScore: number;
  passScore: number;
  responsible: string;
  description: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'under_review' | 'approved' | 'closed' | 'archived';
  requiredFiles: RequiredFile[];
  managementNotes?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface GradeCriterion {
  id: string;
  name: string;
  maxScore: number;
}

export interface ExamFileAttachment {
  name: string;
  url?: string;
  size?: string;
  type?: string;
  uploadDate?: string;
  contentPreview?: string;
}

export interface Exam {
  id: string;
  periodId: string;
  title: string;
  curriculum: string;
  periodName: string;
  examType: string;
  maxTotalScore: number;
  passScore: number;
  date: string;
  circleIds: string[]; // Array of circle IDs
  circleName?: string;
  criteria: GradeCriterion[];
  responsibleName: string;
  notes?: string;
  status: 'draft' | 'open' | 'in_progress' | 'approved' | 'closed' | 'archived';
  requiredFiles?: RequiredFile[];
  examFileAttachment?: ExamFileAttachment;
}

export type StudentExamStatus = 
  | 'passed'       // ناجح
  | 'failed'       // راسب
  | 'unentered'    // لم تدخل الدرجة
  | 'not_tested'   // لم يختبر
  | 'absent'       // غائب
  | 'postponed'    // مؤجل
  | 'exempt';      // مستثنى

export interface StudentGradeRecord {
  studentId: string;
  studentName: string;
  nationalId?: string;
  circleId: string;
  scores: Record<string, number>; // criterionId -> score
  totalScore: number;
  percentage: number;
  passScore: number;
  maxScore: number;
  status: StudentExamStatus;
  notes?: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface GradeAuditEntry {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  periodId?: string;
  periodName?: string;
  curriculumName?: string;
  previousScore: number | string;
  newScore: number | string;
  modifiedBy: string;
  timestamp: string;
  reason?: string;
}

export const DEFAULT_PERIODS: EvaluationPeriod[] = [];
export const DEFAULT_EXAMS: Exam[] = [];
export const DEFAULT_MASTER_STUDENTS: Student[] = [];
export const DEFAULT_GRADES_MAP: Record<string, Record<string, StudentGradeRecord>> = {};

let inMemoryPeriods: EvaluationPeriod[] = [];
let inMemoryExams: Exam[] = [];
let inMemoryAllGrades: Record<string, Record<string, StudentGradeRecord>> = {};
let inMemoryGradeAuditLogs: GradeAuditEntry[] = [];

// STORAGE UTILITIES
export function getStoredPeriods(): EvaluationPeriod[] {
  return inMemoryPeriods;
}

export function saveStoredPeriods(periods: EvaluationPeriod[]): void {
  inMemoryPeriods = periods;
}

export function getStoredExams(): Exam[] {
  return inMemoryExams;
}

export function saveStoredExams(exams: Exam[]): void {
  inMemoryExams = exams;
}

export function getStoredAllGrades(): Record<string, Record<string, StudentGradeRecord>> {
  return inMemoryAllGrades;
}

export function saveStoredAllGrades(allGrades: Record<string, Record<string, StudentGradeRecord>>): void {
  inMemoryAllGrades = allGrades;
}

export function getStoredAuditLogs(): GradeAuditEntry[] {
  return inMemoryGradeAuditLogs;
}

export function saveStoredAuditLogs(logs: GradeAuditEntry[]): void {
  inMemoryGradeAuditLogs = logs;
}

export function syncGradesToStudents(
  exam: Exam,
  studentRecords: StudentGradeRecord[],
  updatedByUser: string,
  existingStudents: Student[]
): Student[] {
  const currentStudents = existingStudents && existingStudents.length > 0 ? existingStudents : DEFAULT_MASTER_STUDENTS;
  
  const updatedStudents = currentStudents.map(st => {
    const record = studentRecords.find(r => r.studentId === st.id);
    if (!record || record.status === 'unentered') return st;

    // Calculate status label in Arabic
    let statusLabel = 'ناجح';
    if (record.status === 'failed') statusLabel = 'راسب';
    else if (record.status === 'absent') statusLabel = 'غائب';
    else if (record.status === 'not_tested') statusLabel = 'لم يختبر';
    else if (record.status === 'postponed') statusLabel = 'مؤجل';
    else if (record.status === 'exempt') statusLabel = 'مستثنى';

    // Update student's test summary
    const newTimelineItem = {
      date: new Date().toLocaleDateString('ar-SA'),
      title: `نتيجة اختبار: ${exam.title}`,
      desc: `الدرجة: ${record.totalScore} / ${exam.maxTotalScore} (${record.percentage}%) - الحالة: ${statusLabel}`,
      author: updatedByUser
    };

    // Risk indicator adjustment
    let newIndicator = st.academicIndicator;
    const newRiskFlags = [...(st.riskFlags || [])];

    if (record.status === 'failed' || (record.percentage < exam.passScore && record.status === 'passed')) {
      newIndicator = 'red';
      if (!newRiskFlags.includes('تعثر في اختبارات المنهج')) {
        newRiskFlags.push('تعثر في اختبارات المنهج');
      }
    } else if (record.status === 'absent') {
      if (!newRiskFlags.includes('غائب عن الاختبار')) {
        newRiskFlags.push('غائب عن الاختبار');
      }
      if (newIndicator !== 'red') newIndicator = 'yellow';
    } else if (record.percentage >= 85) {
      newIndicator = 'green';
    }

    return {
      ...st,
      lastExamScore: record.totalScore,
      lastExamName: `${exam.title} (${statusLabel})`,
      academicIndicator: newIndicator,
      riskFlags: Array.from(new Set(newRiskFlags)),
      timeline: [newTimelineItem, ...(st.timeline || [])]
    };
  });

  return updatedStudents;
}
