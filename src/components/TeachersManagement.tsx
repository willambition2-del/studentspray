/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Calendar, Star, Sparkles, TrendingUp, ArrowLeft, ArrowRight, 
  UserCheck, ShieldCheck, ClipboardList, Plus, CheckCircle, Search, Filter, 
  Trash2, Printer, AlertCircle, FileText, Percent, MessageSquare, ArrowUpRight, 
  HelpCircle, ChevronLeft, ChevronRight, Check, BookOpen, Clock, RefreshCw, X, ShieldAlert,
  Briefcase, Target, Activity, FileCheck, Sliders, ChevronDown, Zap, AlertTriangle,
  ThumbsUp, GraduationCap, PhoneCall, Send, Eye, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UrgentStudentFollowUp {
  id: string;
  name: string;
  circleName: string;
  issue: string;
  requiredAction: string;
}

export interface CircleDetailedEnhanced {
  id: string;
  name: string;
  level: 'مبتدئ' | 'متوسط' | 'متقدم' | 'خاتمين';
  studentCount: number;
  attendanceRate: number;
  memorizationRate: number;
  masteryRate: number;
  examsRate: number;
  strugglingCount: number;
  topCount: number;
  trend: 'up' | 'stable' | 'down';
}

export interface TeacherTask {
  id: string;
  title: string;
  assigner: string;
  priority: 'عالية جداً' | 'عالية' | 'متوسطة' | 'عادية';
  deadline: string;
  status: 'مكلفة' | 'قيد التنفيذ' | 'مكتملة' | 'متأخرة' | 'ملغاة';
}

export interface TeacherActivity {
  id: string;
  title: string;
  role: 'مدير النشاط' | 'مشارك تنظيم' | 'صاحب مبادرة';
  participatingStudents: number;
  date: string;
  successRate: number;
  status: 'مكتمل' | 'جاري';
}

export interface TeacherBadge {
  id: string;
  title: string;
  category: string;
  dateAwarded: string;
  icon: string;
  description: string;
}

export interface StructuredNote {
  id: string;
  type: 'إيجابية / تميز' | 'توجيه تربوي' | 'تنبيه إداري' | 'متابعة جودة';
  date: string;
  author: string;
  importance: 'عالية جداً' | 'عالية' | 'متوسطة' | 'عادية';
  details: string;
  requiredAction: string;
  status: 'مفتوحة' | 'قيد المتابعة' | 'مغلقة ومكتملة';
  closingDate?: string;
}

export interface AdminEventLog {
  id: string;
  date: string;
  type: 'تكليف جديد' | 'نقل حلقة' | 'ترقية' | 'تنبيه إداري' | 'تكريم وسام' | 'قرار إداري' | 'إجازة رسمية' | 'إنهاء مهمة';
  event: string;
  details: string;
  operator: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  specialty: 'حلقات وقرآن كريم' | 'تجويد وقراءات' | 'علوم شرعية وتربوية' | 'إداري ومنسق';
  jobTitle: string;
  assignedCircles: string[];
  hireDate: string;
  graduatedStudentsCount: number;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  rating: number; // 1-5 rating
  attendanceRate: number; // e.g. 96 (%)
  planComplianceRate: number; // e.g. 91 (%)
  studentProgressRate: number; // Average student retention / progress rate (%)
  averageStudentExamScore: number; // e.g. 92.5 (out of 100)
  totalPoints: number; // System-calculated rank points
  qualification: 'بكالوريوس شريعة' | 'بكالوريوس علوم حاسب / تقنية' | 'دبلوم قراءات قرآنية' | 'إجازة قرآنية بسند متصل' | 'ماجستير أصول دين' | 'ثانوي + خبرة ميدانية' | 'دكتوراه فقه مقارن';
  salary?: number;
  rank: number;
  rankTrend: 'up' | 'down' | 'stable';
  supervisorName: string;
  
  // Executive Summary
  executiveSummary: {
    overallScore: number;
    strengths: string[];
    needsFollowUp: string[];
    latestAchievement: string;
    suggestedAction: string;
  };

  // Educational Performance Breakdown
  educationalPerformance: {
    avgMemorization: number;
    avgRevision: number;
    avgMastery: number;
    avgExams: number;
    studentProgressRate: number;
    strugglingStudentsCount: number;
    topStudentsCount: number;
    stoppedStudentsCount: number;
    urgentFollowUpStudents: UrgentStudentFollowUp[];
  };

  // Enhanced Circles
  circlesDetailedEnhanced: CircleDetailedEnhanced[];

  // Discipline & Compliance
  disciplineAndCompliance: {
    meetingAttendanceRate: number;
    tardinessCount: number;
    absenceCount: number;
    excusesCount: number;
    attendanceLoggingRate: number;
    gradesLoggingRate: number;
    planComplianceRate: number;
    reportsComplianceRate: number;
    lastTardiness: { date: string; minutes: number; reason: string } | null;
  };

  // Tasks & Assignments
  tasks: TeacherTask[];

  // Activities & Initiatives
  activities: TeacherActivity[];

  // Parent Communication Indicators
  parentCommunication: {
    totalRequests: number;
    closedRequests: number;
    openRequests: number;
    avgResponseTimeHours: number;
    escalatedCases: number;
  };

  // Professional Development
  professionalDevelopment: {
    completedCourses: Array<{ title: string; date: string; hours: number; provider: string }>;
    requiredCourses: Array<{ title: string; targetDate: string; reason: string }>;
    lastCourse: { title: string; date: string };
    lastEvaluationDate: string;
    nextEvaluationDate: string;
    strengths: string[];
    improvementAreas: string[];
    supervisorRecommendations: string;
  };

  // Badges & Honors
  badges: TeacherBadge[];

  // Structured Notes Log
  structuredNotes: StructuredNote[];

  // Administrative Events History
  adminEvents: AdminEventLog[];

  // Legacy fields retained for backward compatibility
  circlesDetailed: Array<{ id: string; name: string; level: 'مبتدئ' | 'متوسط' | 'متقدم' | 'خاتمين'; studentCount: number; performanceIdx: number }>;
  notes: Array<{ id: string; text: string; date: string; author: 'المدير العام' | 'المشرف العام' | 'مشرف الحلقات'; type: 'positive' | 'negative' | 'admin' }>;
  jobHistory: Array<{ id: string; date: string; event: string; details: string; operator: string }>;
}

export interface EvaluationWeights {
  educational: number;       // e.g. 30
  discipline: number;        // e.g. 20
  studentProgress: number;   // e.g. 20
  adminCompliance: number;   // e.g. 10
  activities: number;        // e.g. 10
  supervisorRating: number;  // e.g. 10
}

// Helper to calculate exact service duration from hire date
export function calculateServiceDuration(hireDateStr: string): string {
  if (!hireDateStr) return 'غير محدد';
  const hire = new Date(hireDateStr);
  const now = new Date('2026-08-12');
  const diffDays = Math.max(0, Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24)));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years === 0) return `${months || 1} أشهر`;
  if (months === 0) return `${years} سنة`;
  return `${years} سنة و ${months} أشهر`;
}

// Helper to calculate comprehensive evaluation score / 100 based on weighted axes
export function calculateComprehensiveScore(teacher: Teacher, weights: EvaluationWeights): number {
  const eduScore = teacher.educationalPerformance?.avgExams || teacher.averageStudentExamScore || 85;
  const discScore = teacher.disciplineAndCompliance?.meetingAttendanceRate || teacher.attendanceRate || 90;
  const progScore = teacher.educationalPerformance?.studentProgressRate || teacher.studentProgressRate || 85;
  const adminScore = teacher.disciplineAndCompliance?.reportsComplianceRate || teacher.planComplianceRate || 85;
  const actScore = teacher.activities?.length ? Math.min(100, teacher.activities.reduce((a, b) => a + b.successRate, 0) / teacher.activities.length) : 80;
  const supScore = Math.round((teacher.rating / 5) * 100);

  const total = 
    (eduScore * (weights.educational / 100)) +
    (discScore * (weights.discipline / 100)) +
    (progScore * (weights.studentProgress / 100)) +
    (adminScore * (weights.adminCompliance / 100)) +
    (actScore * (weights.activities / 100)) +
    (supScore * (weights.supervisorRating / 100));

  return Math.round(total * 10) / 10;
}

interface TeachersManagementProps {
  currentUser?: any;
}

export default function TeachersManagement({ currentUser }: TeachersManagementProps) {
  const isTeacherUser = currentUser?.type === 'teacher';
  const isAdmin = currentUser ? (currentUser?.type === 'admin' || currentUser?.roleName === 'المدير العام') : true;
  const isSupervisor = currentUser?.type === 'supervisor' || currentUser?.roleName?.includes('مشرف') || currentUser?.roleName?.includes('وجه');

  // State for customizable evaluation weights (Section 12 requirement)
  const [evaluationWeights, setEvaluationWeights] = useState<EvaluationWeights>({
    educational: 30,
    discipline: 20,
    studentProgress: 20,
    adminCompliance: 10,
    activities: 10,
    supervisorRating: 10
  });

  const [showWeightSettingsModal, setShowWeightSettingsModal] = useState<boolean>(false);

  // --- MOCK INITIAL TEACHERS DATABASE ---
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: 'TCH-001',
      name: 'فضيلة الشيخ عبد الرحمن بن صالح السعيد',
      phone: '0554123456',
      specialty: 'حلقات وقرآن كريم',
      jobTitle: 'كبير معلمي الحفظ والسند المتصل',
      assignedCircles: ['حلقة حفظ الطليعة', 'حلقة المهاجرين العليا'],
      hireDate: '2021-09-01',
      graduatedStudentsCount: 14,
      status: 'active',
      rating: 4.9,
      attendanceRate: 98,
      planComplianceRate: 95,
      studentProgressRate: 94,
      averageStudentExamScore: 96.2,
      totalPoints: 945,
      qualification: 'بكالوريوس شريعة',
      salary: 7500,
      rank: 1,
      rankTrend: 'up',
      supervisorName: 'الشيخ إبراهيم المنصور',

      executiveSummary: {
        overallScore: 96.4,
        strengths: [
          'إنتاجية استثنائية في تخريج الطلاب الخاتمين (14 خاتم برواية حفص)',
          'انضباط قياسي بالحضور والاجتماعات (98%) بدقة مواعيد لا تتخلف',
          'التزام كامل برفع الدرجات والتقارير الأسبوعية دون أي تأخير'
        ],
        needsFollowUp: [
          'تنسيق أوقات إضافية لمراجعة أجزاء الاختبار الخارجي للطلاب المتعثرين'
        ],
        latestAchievement: 'نيل وسام معلم الموسم الذهبي وإتمام ختم 3 طلاب بروايات متصلة',
        suggestedAction: 'ترقية المعلم إلى مشرف تربوي مساند وصرف مكافأة تميز المخرجات'
      },

      educationalPerformance: {
        avgMemorization: 95.0,
        avgRevision: 92.5,
        avgMastery: 97.0,
        avgExams: 96.2,
        studentProgressRate: 94.0,
        strugglingStudentsCount: 1,
        topStudentsCount: 18,
        stoppedStudentsCount: 0,
        urgentFollowUpStudents: [
          { id: 'st-1', name: 'سلمان الفهد', circleName: 'حلقة حفظ الطليعة', issue: 'تأخر متراكم في ورود المراجعة الكبرى (3 أجزاء)', requiredAction: 'تكثيف جلسات التسميع الفردي بالتثبيت المسائي' }
        ]
      },

      circlesDetailedEnhanced: [
        { id: 'c1', name: 'حلقة حفظ الطليعة', level: 'خاتمين', studentCount: 12, attendanceRate: 98, memorizationRate: 96, masteryRate: 98, examsRate: 97.5, strugglingCount: 0, topCount: 10, trend: 'up' },
        { id: 'c2', name: 'حلقة المهاجرين العليا', level: 'متقدم', studentCount: 15, attendanceRate: 95, memorizationRate: 93, masteryRate: 95, examsRate: 94.0, strugglingCount: 1, topCount: 8, trend: 'up' }
      ],

      disciplineAndCompliance: {
        meetingAttendanceRate: 100,
        tardinessCount: 1,
        absenceCount: 0,
        excusesCount: 1,
        attendanceLoggingRate: 99,
        gradesLoggingRate: 98,
        planComplianceRate: 95,
        reportsComplianceRate: 97,
        lastTardiness: { date: '2026-06-02', minutes: 2, reason: 'ازدحام مروري طارئ وتم تعويض الوقت ذاتياً' }
      },

      tasks: [
        { id: 'tsk-1', title: 'إعداد اختبارات المنتصف لحلقة الطليعة', assigner: 'المشرف العام', priority: 'عالية', deadline: '2026-06-28', status: 'مكتملة' },
        { id: 'tsk-2', title: 'رفع كشوفات الخاتمين المرشحين للإجازة', assigner: 'المدير العام', priority: 'عالية جداً', deadline: '2026-07-05', status: 'قيد التنفيذ' }
      ],

      activities: [
        { id: 'act-1', title: 'مسابقة الماهر بالقرآن الرمضانية', role: 'مدير النشاط', participatingStudents: 45, date: '2026-04-10', successRate: 98, status: 'مكتمل' },
        { id: 'act-2', title: 'مبادرة المقرأة المسائية للعموم', role: 'صاحب مبادرة', participatingStudents: 30, date: '2026-05-15', successRate: 95, status: 'جاري' }
      ],

      parentCommunication: {
        totalRequests: 24,
        closedRequests: 23,
        openRequests: 1,
        avgResponseTimeHours: 1.5,
        escalatedCases: 0
      },

      professionalDevelopment: {
        completedCourses: [
          { title: 'دورة المهارات المتقدمة في إجازات الإسناد', date: '2025-11-10', hours: 20, provider: 'معهد الإتقان القرآني' },
          { title: 'القيادة التربوية لمعلمي الحلقات', date: '2026-02-15', hours: 15, provider: 'أكاديمية المعلم' }
        ],
        requiredCourses: [
          { title: 'التطبيقات الذكية في إدارة الحلقات الرقمية', targetDate: '2026-09-01', reason: 'ترقية المهارات التقنية' }
        ],
        lastCourse: { title: 'القيادة التربوية لمعلمي الحلقات', date: '2026-02-15' },
        lastEvaluationDate: '2026-05-30',
        nextEvaluationDate: '2026-11-30',
        strengths: ['ضبط مخارج الحروف وقراءات الأئمة العشرة', 'أسلوب تربوي تحفيزي جاذب للطلاب'],
        improvementAreas: ['التوسع في استخدام التقييم التقني المباشر عبر التطبيق'],
        supervisorRecommendations: 'يوصى بإسناد الإشراف الميداني على حلقات المستوى المتقدم'
      },

      badges: [
        { id: 'bdg-1', title: 'وسام المعلم القدوة', category: 'تميز تعليمي', dateAwarded: '2025-12-01', icon: 'Award', description: 'يمنح للمعلم الأعلى تقييماً وانضباطاً لموسمين متتاليين' },
        { id: 'bdg-2', title: 'شارة تخريج الخاتمين', category: 'خاتمين', dateAwarded: '2026-05-12', icon: 'GraduationCap', description: 'لتخريج أكثر من 10 طلاب خاتمين للمصحف الشريف' },
        { id: 'bdg-3', title: 'وسام الانضباط القياسي', category: 'انضباط قياسي', dateAwarded: '2026-03-15', icon: 'ShieldCheck', description: 'نسبة حضور 98%+ دون أي غياب بغير عذر' }
      ],

      structuredNotes: [
        { id: 'sn-1', type: 'إيجابية / تميز', date: '2026-05-12', author: 'المشرف العام', importance: 'عالية جداً', details: 'تكريم خاص لعلو إنتاج الحفظة وإتمام 3 طلاب لختم المصحف هذا الموسم.', requiredAction: 'صرف مكافأة التميز المعنية', status: 'مغلقة ومكتملة', closingDate: '2026-05-15' },
        { id: 'sn-2', type: 'توجيه تربوي', date: '2026-06-02', author: 'مشرف الحلقات', importance: 'عادية', details: 'تأخر دقيقتين في طابور التثبيت المسائي وتم تعويضها ذاتياً.', requiredAction: 'متابعة الالتزام بالحافلة', status: 'مغلقة ومكتملة', closingDate: '2026-06-02' }
      ],

      adminEvents: [
        { id: 'ae-1', date: '2021-09-01', type: 'تكليف جديد', event: 'تعيين رسمي بالملتقى', details: 'التعيين بمرتب أساسي لحلقات كبار السن وحلقات السند المتصل.', operator: 'المدير العام' },
        { id: 'ae-2', date: '2023-10-15', type: 'ترقية', event: 'ترقية وتكليف إضافي', details: 'إسناد ريادة حلقة حفظ الطليعة للخاتمين للتميز المطرد.', operator: 'المشرف العام' },
        { id: 'ae-3', date: '2026-05-12', type: 'تكريم وسام', event: 'منح وسام المعلم القدوة', details: 'تكريم رسمي بحضور الإدارة العامة.', operator: 'المدير العام' }
      ],

      circlesDetailed: [
        { id: 'c1', name: 'حلقة حفظ الطليعة', level: 'خاتمين', studentCount: 12, performanceIdx: 98 },
        { id: 'c2', name: 'حلقة المهاجرين العليا', level: 'متقدم', studentCount: 15, performanceIdx: 93 }
      ],
      notes: [
        { id: 'n1', text: 'تكريم خاص من المشرف العام لعلو إنتاج الحفظة وإتمام 3 طلاب لختم المصحف هذا الموسم.', date: '2026-05-12', author: 'المشرف العام', type: 'positive' }
      ],
      jobHistory: [
        { id: 'h1', date: '2021-09-01', event: 'تعيين رسمي بالملتقى', details: 'التعيين بمرتب أساسي لحلقات كبار السن وحلقات السند المتصل.', operator: 'المدير العام' }
      ]
    },
    {
      id: 'TCH-002',
      name: 'أستاذ حازم عمر الحركي',
      phone: '0501234567',
      specialty: 'تجويد وقراءات',
      jobTitle: 'معلم مادة التجويد العملي والنظري',
      assignedCircles: ['حلقة حفص للإتقان', 'شعبة الشاطبية النظرية'],
      hireDate: '2022-10-10',
      graduatedStudentsCount: 8,
      status: 'active',
      rating: 4.6,
      attendanceRate: 94,
      planComplianceRate: 92,
      studentProgressRate: 88,
      averageStudentExamScore: 89.5,
      totalPoints: 865,
      qualification: 'إجازة قرآنية بسند متصل',
      salary: 5800,
      rank: 2,
      rankTrend: 'stable',
      supervisorName: 'الشيخ عبد الله الدوسري',

      executiveSummary: {
        overallScore: 91.2,
        strengths: [
          'مستوى متميز جداً في تدريس المخارج والصفات ومتون التجويد',
          'التزام مرتفع بجدول الشروحات والاختبارات التحريرية (92%)'
        ],
        needsFollowUp: [
          'متابعة رفع نسبة حضور الطلاب في شعبة الشاطبية النظرية'
        ],
        latestAchievement: 'إتمام الدورة المتقدمة في شرح المنظومة الجزرية لشعبتين',
        suggestedAction: 'ترشيح المعلم لإلقاء ورشة عمل لمعلمي التجويد الجدد'
      },

      educationalPerformance: {
        avgMemorization: 88.0,
        avgRevision: 86.5,
        avgMastery: 95.0,
        avgExams: 89.5,
        studentProgressRate: 88.0,
        strugglingStudentsCount: 2,
        topStudentsCount: 12,
        stoppedStudentsCount: 0,
        urgentFollowUpStudents: [
          { id: 'st-2', name: 'عمر الماجد', circleName: 'حلقة حفص للإتقان', issue: 'تأخر في حزمة المراجعة الصغرى (5 أجزاء)', requiredAction: 'متابعة جدول التسميع الفردي' }
        ]
      },

      circlesDetailedEnhanced: [
        { id: 'c3', name: 'حلقة حفص للإتقان', level: 'متقدم', studentCount: 18, attendanceRate: 94, memorizationRate: 89, masteryRate: 94, examsRate: 91.0, strugglingCount: 1, topCount: 7, trend: 'stable' },
        { id: 'c4', name: 'شعبة الشاطبية النظرية', level: 'متوسط', studentCount: 22, attendanceRate: 91, memorizationRate: 86, masteryRate: 92, examsRate: 88.0, strugglingCount: 1, topCount: 5, trend: 'stable' }
      ],

      disciplineAndCompliance: {
        meetingAttendanceRate: 95,
        tardinessCount: 2,
        absenceCount: 1,
        excusesCount: 1,
        attendanceLoggingRate: 96,
        gradesLoggingRate: 94,
        planComplianceRate: 92,
        reportsComplianceRate: 91,
        lastTardiness: { date: '2026-05-10', minutes: 5, reason: 'تأخر الحافلة' }
      },

      tasks: [
        { id: 'tsk-3', title: 'مراجعة المذكرة النظرية للتجويد', assigner: 'المشرف العام', priority: 'متوسطة', deadline: '2026-07-01', status: 'قيد التنفيذ' }
      ],

      activities: [
        { id: 'act-3', title: 'ملتقى ضبط الأداء الصوتي للمحاريب', role: 'مشارك تنظيم', participatingStudents: 25, date: '2026-03-20', successRate: 92, status: 'مكتمل' }
      ],

      parentCommunication: {
        totalRequests: 18,
        closedRequests: 17,
        openRequests: 1,
        avgResponseTimeHours: 2.0,
        escalatedCases: 0
      },

      professionalDevelopment: {
        completedCourses: [
          { title: 'دورة استراتيجيات تدريس التجويد للناطقين بغير العربية', date: '2025-08-15', hours: 12, provider: 'مركز اقرأ' }
        ],
        requiredCourses: [
          { title: 'تقنيات الصوتيات وإلقاء القرآن', targetDate: '2026-10-01', reason: 'تطوير الأداء الميداني' }
        ],
        lastCourse: { title: 'استراتيجيات تدريس التجويد', date: '2025-08-15' },
        lastEvaluationDate: '2026-05-20',
        nextEvaluationDate: '2026-11-20',
        strengths: ['إتقان مخارج الحروف الشفوية والحلقية', 'وضوح الشرح العملي'],
        improvementAreas: ['التنوع في الأنشطة الصفية'],
        supervisorRecommendations: 'الاستمرار في قيادة دورات الإتقان'
      },

      badges: [
        { id: 'bdg-4', title: 'شارة تميز التجويد', category: 'تميز تعليمي', dateAwarded: '2026-01-10', icon: 'Award', description: 'لنسبة نجاح طلابه العالية باختبارات التجويد' }
      ],

      structuredNotes: [
        { id: 'sn-3', type: 'توجيه تربوي', date: '2026-04-20', author: 'مشرف الحلقات', importance: 'متوسطة', details: 'مستوى متميز جداً في شرح متون التجويد والالتزام بجدول المخارج.', requiredAction: 'استمرار النهج', status: 'مغلقة ومكتملة', closingDate: '2026-04-20' }
      ],

      adminEvents: [
        { id: 'ae-4', date: '2022-10-10', type: 'تكليف جديد', event: 'تعيين معلم جديد', details: 'مباشرة العمل كمدرس التجويد العملي.', operator: 'المدير العام' }
      ],

      circlesDetailed: [
        { id: 'c3', name: 'حلقة حفص للإتقان', level: 'متقدم', studentCount: 18, performanceIdx: 90 },
        { id: 'c4', name: 'شعبة الشاطبية النظرية', level: 'متوسط', studentCount: 22, performanceIdx: 87 }
      ],
      notes: [],
      jobHistory: []
    },
    {
      id: 'TCH-003',
      name: 'الشيخ محمد معوض النخيلي',
      phone: '0547654321',
      specialty: 'حلقات وقرآن كريم',
      jobTitle: 'معلم حلقات البراعم والأشبال',
      assignedCircles: ['حلقة الأشبال الصغار (أ)'],
      hireDate: '2020-01-15',
      graduatedStudentsCount: 3,
      status: 'active',
      rating: 4.2,
      attendanceRate: 89,
      planComplianceRate: 85,
      studentProgressRate: 80,
      averageStudentExamScore: 82.0,
      totalPoints: 720,
      qualification: 'ماجستير أصول دين',
      salary: 6200,
      rank: 4,
      rankTrend: 'down',
      supervisorName: 'الشيخ إبراهيم المنصور',

      executiveSummary: {
        overallScore: 83.5,
        strengths: [
          'خبرة علمية واسعة في التأصيل الشرعي وأصول الدين',
          'التزام جيد بمواعيد الحضور اليومية مع البراعم'
        ],
        needsFollowUp: [
          'تأخر رفع التقارير الأسبوعية بانتظام (يحتاج متابعة عاجلة)',
          'تفعيل الوسائل التفاعلية الجاذبة لصغار الحفظة لتفادي التراجع'
        ],
        latestAchievement: 'تنظيم برنامج حفظ جزء عم للبراعم الصغار',
        suggestedAction: 'عقد اجتماع توجيهي مع المشرف لتقديم خطة دعم تسليم التقارير'
      },

      educationalPerformance: {
        avgMemorization: 81.0,
        avgRevision: 79.0,
        avgMastery: 83.0,
        avgExams: 82.0,
        studentProgressRate: 80.0,
        strugglingStudentsCount: 4,
        topStudentsCount: 5,
        stoppedStudentsCount: 1,
        urgentFollowUpStudents: [
          { id: 'st-3', name: 'يوسف العمري', circleName: 'حلقة الأشبال الصغار (أ)', issue: 'تأخر في تحضير ورد الحفظ الجديد بـ 4 أيام', requiredAction: 'التواصل مع ولي الأمر والتنسيق مع المشرف' }
        ]
      },

      circlesDetailedEnhanced: [
        { id: 'c5', name: 'حلقة الأشبال الصغار (أ)', level: 'مبتدئ', studentCount: 25, attendanceRate: 89, memorizationRate: 80, masteryRate: 82, examsRate: 82.0, strugglingCount: 4, topCount: 5, trend: 'down' }
      ],

      disciplineAndCompliance: {
        meetingAttendanceRate: 88,
        tardinessCount: 4,
        absenceCount: 2,
        excusesCount: 2,
        attendanceLoggingRate: 85,
        gradesLoggingRate: 82,
        planComplianceRate: 85,
        reportsComplianceRate: 80,
        lastTardiness: { date: '2026-06-15', minutes: 10, reason: 'ظروف شخصية' }
      },

      tasks: [
        { id: 'tsk-4', title: 'تحديث تقارير متابعة الأشبال', assigner: 'المدير العام', priority: 'عالية جداً', deadline: '2026-06-25', status: 'متأخرة' }
      ],

      activities: [
        { id: 'act-4', title: 'نشاط اليوم الترفيهي للأشبال', role: 'مشارك تنظيم', participatingStudents: 25, date: '2026-05-01', successRate: 85, status: 'مكتمل' }
      ],

      parentCommunication: {
        totalRequests: 30,
        closedRequests: 25,
        openRequests: 5,
        avgResponseTimeHours: 6.0,
        escalatedCases: 1
      },

      professionalDevelopment: {
        completedCourses: [
          { title: 'الأساليب الحديثة في إدارة حلقات الأطفال', date: '2024-10-05', hours: 10, provider: 'مركز التنمية التربوية' }
        ],
        requiredCourses: [
          { title: 'إدارة الوقت والالتزام بالتسليمات الإدارية', targetDate: '2026-08-01', reason: 'معالجة تأخر التقارير' }
        ],
        lastCourse: { title: 'الأساليب الحديثة في إدارة حلقات الأطفال', date: '2024-10-05' },
        lastEvaluationDate: '2026-05-18',
        nextEvaluationDate: '2026-11-18',
        strengths: ['الحلم مع الأطفال والصبر عليهم'],
        improvementAreas: ['الالتزام بالرفع الإلكتروني للدرجات والتقارير في مواعيدها'],
        supervisorRecommendations: 'متابعة أسبوعية من المشرف لحين استقرار نسبة الرفع'
      },

      badges: [],

      structuredNotes: [
        { id: 'sn-4', type: 'توجيه تربوي', date: '2026-05-01', author: 'المشرف العام', importance: 'عالية', details: 'يحتاج لخطوات تفاعلية أكثر ومحفزات لأشبال التلقين.', requiredAction: 'تطبيق بطاقات تحفيزية', status: 'قيد المتابعة' },
        { id: 'sn-5', type: 'تنبيه إداري', date: '2026-05-18', author: 'المدير العام', importance: 'عالية جداً', details: 'تنبيه إداري بخصوص تأخر رفع التقارير لفترة تزيد عن 3 أيام متتالية.', requiredAction: 'الالتزام فوراً بجدول الرفع', status: 'مغلقة ومكتملة', closingDate: '2026-05-25' }
      ],

      adminEvents: [
        { id: 'ae-5', date: '2020-01-15', type: 'تكليف جديد', event: 'التعيين الأولي', details: 'التأسيس والبدء لصفوف صغار الحفظة.', operator: 'المدير العام' }
      ],

      circlesDetailed: [
        { id: 'c5', name: 'حلقة الأشبال الصغار (أ)', level: 'مبتدئ', studentCount: 25, performanceIdx: 81 }
      ],
      notes: [],
      jobHistory: []
    },
    {
      id: 'TCH-004',
      name: 'الشيخ يونس بن ناصر الدوسري',
      phone: '0567890123',
      specialty: 'علوم شرعية وتربوية',
      jobTitle: 'مشرف المادة الشرعية والتوجيه السلوكي',
      assignedCircles: ['شعبة الفقه والعقيدة الميسرة'],
      hireDate: '2023-01-01',
      graduatedStudentsCount: 5,
      status: 'active',
      rating: 4.8,
      attendanceRate: 96,
      planComplianceRate: 98,
      studentProgressRate: 91,
      averageStudentExamScore: 94.0,
      totalPoints: 910,
      qualification: 'بكالوريوس شريعة',
      salary: 6500,
      rank: 3,
      rankTrend: 'up',
      supervisorName: 'الشيخ إبراهيم المنصور',

      executiveSummary: {
        overallScore: 94.8,
        strengths: [
          'التزام مبهر بالتحضير المسبق وتسليم مذكرات الشرح اللوحي والتقارير',
          'نسبة رضا عالية جداً من الطلاب وأولياء الأمور عن البرامج التوجيهية'
        ],
        needsFollowUp: [
          'استمرار تفعيل الأنشطة المصاحبة بالدورة الصيفية'
        ],
        latestAchievement: 'نيل شارة التميز الإداري والالتزام بالخطة المعتمدة',
        suggestedAction: 'تكليف المعلم بملف التوجيه السلوكي العام للملتقى'
      },

      educationalPerformance: {
        avgMemorization: 92.0,
        avgRevision: 90.0,
        avgMastery: 95.0,
        avgExams: 94.0,
        studentProgressRate: 91.0,
        strugglingStudentsCount: 0,
        topStudentsCount: 15,
        stoppedStudentsCount: 0,
        urgentFollowUpStudents: []
      },

      circlesDetailedEnhanced: [
        { id: 'c6', name: 'شعبة الفقه والعقيدة الميسرة', level: 'متوسط', studentCount: 30, attendanceRate: 96, memorizationRate: 91, masteryRate: 95, examsRate: 94.0, strugglingCount: 0, topCount: 15, trend: 'up' }
      ],

      disciplineAndCompliance: {
        meetingAttendanceRate: 98,
        tardinessCount: 0,
        absenceCount: 0,
        excusesCount: 0,
        attendanceLoggingRate: 100,
        gradesLoggingRate: 99,
        planComplianceRate: 98,
        reportsComplianceRate: 99,
        lastTardiness: null
      },

      tasks: [
        { id: 'tsk-5', title: 'إعداد برنامج الأخلاق والآداب الرمضاني', assigner: 'المدير العام', priority: 'عالية', deadline: '2026-06-30', status: 'مكتملة' }
      ],

      activities: [
        { id: 'act-5', title: 'مبادرة القيم والآداب القرآنية', role: 'صاحب مبادرة', participatingStudents: 60, date: '2026-05-10', successRate: 96, status: 'مكتمل' }
      ],

      parentCommunication: {
        totalRequests: 15,
        closedRequests: 15,
        openRequests: 0,
        avgResponseTimeHours: 1.0,
        escalatedCases: 0
      },

      professionalDevelopment: {
        completedCourses: [
          { title: 'التوجيه التربوي والذكاء العاطفي مع المتعلمين', date: '2025-09-20', hours: 16, provider: 'مركز التوجيه والتدريب' }
        ],
        requiredCourses: [],
        lastCourse: { title: 'التوجيه التربوي والذكاء العاطفي', date: '2025-09-20' },
        lastEvaluationDate: '2026-06-10',
        nextEvaluationDate: '2026-12-10',
        strengths: ['سعة الصدر والتمكن الشرعي والتربوي'],
        improvementAreas: ['التوسع في التأليف والتجميع النافع لمتون السلوك'],
        supervisorRecommendations: 'مرشح متميز لمنصب مدير الشؤون التربوية'
      },

      badges: [
        { id: 'bdg-5', title: 'وسام التميز الإداري', category: 'انضباط قياسي', dateAwarded: '2026-06-10', icon: 'ShieldCheck', description: 'التزام 100% برفع التقارير والدرجات دون أي تأخير' }
      ],

      structuredNotes: [
        { id: 'sn-6', type: 'إيجابية / تميز', date: '2026-06-10', author: 'المدير العام', importance: 'عالية', details: 'التزام مبهر بتسليم كشوفات الحضور ومذكرات الشرح اللوحي والتحضير المسبق.', requiredAction: 'منح وسام التميز', status: 'مغلقة ومكتملة', closingDate: '2026-06-10' }
      ],

      adminEvents: [
        { id: 'ae-6', date: '2023-01-01', type: 'تكليف جديد', event: 'تعاقد مع الكوادر العلمية', details: 'مباشرة العمل لتدريب المعلمين وتثقيف الطلاب.', operator: 'المدير العام' }
      ],

      circlesDetailed: [
        { id: 'c6', name: 'شعبة الفقه والعقيدة الميسرة', level: 'متوسط', studentCount: 30, performanceIdx: 95 }
      ],
      notes: [],
      jobHistory: []
    },
    {
      id: 'TCH-005',
      name: 'أستاذ فهد بن محمد الشمري',
      phone: '0539876543',
      specialty: 'إداري ومنسق',
      jobTitle: 'منسق الشؤون التنظيمية والخدمات المساندة',
      assignedCircles: ['اللجنة التنظيمية والدعم الفني'],
      hireDate: '2024-03-01',
      graduatedStudentsCount: 0,
      status: 'on_leave',
      rating: 4.1,
      attendanceRate: 85,
      planComplianceRate: 80,
      studentProgressRate: 75,
      averageStudentExamScore: 80.5,
      totalPoints: 640,
      qualification: 'ثانوي + خبرة ميدانية',
      salary: 4200,
      rank: 5,
      rankTrend: 'stable',
      supervisorName: 'أ. فهد العصيمي',

      executiveSummary: {
        overallScore: 80.2,
        strengths: [
          'خبرة ميدانية ممتازة في المتابعة اللوجستية والنقل والتنظيم',
          'سرعة الاستجابة في حالات الدعم الفني الطارئ'
        ],
        needsFollowUp: [
          'المعلم حالياً في إجازة رسمية حتى تاريخ 2026-07-01 (مكلف بديل)',
          'تحديث سجلات العهد والمعدات فور العودة من الإجازة'
        ],
        latestAchievement: 'تنسيق حافلات النقل والسكن للملتقى الصيفي',
        suggestedAction: 'متابعة تسليم المهام للمنسق البديل خلال فترة الإجازة'
      },

      educationalPerformance: {
        avgMemorization: 78.0,
        avgRevision: 75.0,
        avgMastery: 80.0,
        avgExams: 80.5,
        studentProgressRate: 75.0,
        strugglingStudentsCount: 0,
        topStudentsCount: 0,
        stoppedStudentsCount: 0,
        urgentFollowUpStudents: []
      },

      circlesDetailedEnhanced: [
        { id: 'c7', name: 'شؤون السكن والتسجيل', level: 'متوسط', studentCount: 0, attendanceRate: 85, memorizationRate: 75, masteryRate: 80, examsRate: 80.5, strugglingCount: 0, topCount: 0, trend: 'stable' }
      ],

      disciplineAndCompliance: {
        meetingAttendanceRate: 85,
        tardinessCount: 3,
        absenceCount: 0,
        excusesCount: 3,
        attendanceLoggingRate: 85,
        gradesLoggingRate: 80,
        planComplianceRate: 80,
        reportsComplianceRate: 82,
        lastTardiness: { date: '2026-06-01', minutes: 15, reason: 'متابعة حافلة النقل' }
      },

      tasks: [
        { id: 'tsk-6', title: 'تسليم عهدة المفاتيح والأجهزة للمشرف الرديف', assigner: 'المدير العام', priority: 'عالية جداً', deadline: '2026-06-12', status: 'مكتملة' }
      ],

      activities: [
        { id: 'act-6', title: 'تنظيم حفل افتتاح الموسم القرآني', role: 'مشارك تنظيم', participatingStudents: 100, date: '2026-03-01', successRate: 90, status: 'مكتمل' }
      ],

      parentCommunication: {
        totalRequests: 10,
        closedRequests: 9,
        openRequests: 1,
        avgResponseTimeHours: 4.0,
        escalatedCases: 0
      },

      professionalDevelopment: {
        completedCourses: [
          { title: 'إدارة الفعاليات والتنظيم الميداني', date: '2024-05-10', hours: 12, provider: 'معهد الإدارة' }
        ],
        requiredCourses: [
          { title: 'إدارة العهد والمخزون الرقمي', targetDate: '2026-09-15', reason: 'تنظيم المستودع' }
        ],
        lastCourse: { title: 'إدارة الفعاليات والتنظيم الميداني', date: '2024-05-10' },
        lastEvaluationDate: '2026-06-12',
        nextEvaluationDate: '2026-12-12',
        strengths: ['النشاط الميداني والتفاعل السريع'],
        improvementAreas: ['التوثيق الورقي والإلكتروني للعهد'],
        supervisorRecommendations: 'إعادة توزيع المهام عقب عودته الميمونة من الإجازة'
      },

      badges: [],

      structuredNotes: [
        { id: 'sn-7', type: 'تنبيه إداري', date: '2026-06-12', author: 'المدير العام', importance: 'عادية', details: 'بدء فترة إجازة عائلية طارئة لمدة أسبوعين مع تكليف تسيير عهدة المفاتيح.', requiredAction: 'متابعة التكليف البديل', status: 'مغلقة ومكتملة', closingDate: '2026-06-12' }
      ],

      adminEvents: [
        { id: 'ae-7', date: '2024-03-01', type: 'تكليف جديد', event: 'مباشرة إدارية بالملتقى', details: 'تأمين الاتصالات وإصدار الشهادات والتعاقد مع الحافلات.', operator: 'المدير العام' },
        { id: 'ae-8', date: '2026-06-12', type: 'إجازة رسمية', event: 'بدء إجازة رسمية طارئة', details: 'الموافقة على إجازة أسبوعين مع تكليف المنسق البديل.', operator: 'المدير العام' }
      ],

      circlesDetailed: [
        { id: 'c7', name: 'شؤون السكن والتسجيل', level: 'متوسط', studentCount: 0, performanceIdx: 80 }
      ],
      notes: [],
      jobHistory: []
    }
  ]);

  // --- STATE FOR ROLE/PERMISSION FILTERING (SECTION 6) ---
  const [currentUserRole, setCurrentUserRole] = useState<'director' | 'supervisor' | 'circle_lead'>(
    isSupervisor ? 'supervisor' : 'director'
  );
  const [showSalary, setShowSalary] = useState<boolean>(
    isSupervisor ? false : !isTeacherUser
  );

  // Identify teacher matching currentUser name if logged in as teacher
  const loggedInTeacher = isTeacherUser ? (
    teachers.find(t => 
      (currentUser?.name && t.name.includes(currentUser.name.split(' ')?.[1] || '')) ||
      (currentUser?.name && currentUser.name.includes(t.name.replace('فضيلة الشيخ ', '').replace('الأستاذ ', '').trim()))
    ) || teachers.find(t => t.id === 'TCH-004') || teachers[0]
  ) : null;

  // --- CORE UI VIEW CONTROLS ---
  const [activeTab, setActiveTab] = useState<'list' | 'evaluations' | 'leaderboard'>('list');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'summary' | 'educational' | 'discipline' | 'development' | 'notes'>('summary');

  // Modal forms states
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'عادية' | 'متوسطة' | 'عالية' | 'عالية جداً'>('عالية');
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>('');

  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [newActTitle, setNewActTitle] = useState<string>('');
  const [newActRole, setNewActRole] = useState<string>('مدير النشاط');
  const [newActStudents, setNewActStudents] = useState<number>(20);

  const [showStructuredNoteModal, setShowStructuredNoteModal] = useState<boolean>(false);
  const [snType, setSnType] = useState<StructuredNote['type']>('إيجابية / تميز');
  const [snImportance, setSnImportance] = useState<StructuredNote['importance']>('عالية');
  const [snDetails, setSnDetails] = useState<string>('');
  const [snAction, setSnAction] = useState<string>('');

  // Handlers for dynamic updates
  const handleToggleTaskStatus = (teacherId: string, taskId: string) => {
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        const updatedTasks = t.tasks.map(tsk => {
          if (tsk.id === taskId) {
            const nextStatus: TeacherTask['status'] = tsk.status === 'مكتملة' ? 'قيد التنفيذ' : 'مكتملة';
            return { ...tsk, status: nextStatus };
          }
          return tsk;
        });
        return { ...t, tasks: updatedTasks };
      }
      return t;
    }));
    triggerToast('✓ تم تحديث حالة المهمة بنجاح.');
  };

  const handleAddNewTask = (teacherId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTaskObj: TeacherTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle,
      assigner: currentUserRole === 'director' ? 'المدير العام' : 'المشرف العام',
      priority: newTaskPriority,
      deadline: newTaskDeadline || '2026-07-15',
      status: 'قيد التنفيذ'
    };
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return { ...t, tasks: [newTaskObj, ...(t.tasks || [])] };
      }
      return t;
    }));
    setNewTaskTitle('');
    setShowTaskModal(false);
    triggerToast('✓ تم إضافة المهمة وتكليف المعلم بنجاح.');
  };

  const handleAddNewActivity = (teacherId: string) => {
    if (!newActTitle.trim()) return;
    const newActObj: TeacherActivity = {
      id: `act-${Date.now()}`,
      title: newActTitle,
      role: newActRole,
      participatingStudents: Number(newActStudents) || 15,
      date: new Date().toISOString().split('T')[0],
      successRate: 95,
      status: 'جاري'
    };
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return { ...t, activities: [newActObj, ...(t.activities || [])] };
      }
      return t;
    }));
    setNewActTitle('');
    setShowActivityModal(false);
    triggerToast('✓ تم إضافة النشاط والمبادرة الإثرائية للمعلم.');
  };

  const handleAddStructuredNoteFull = (teacherId: string) => {
    if (!snDetails.trim()) return;
    const newNoteObj: StructuredNote = {
      id: `sn-${Date.now()}`,
      type: snType,
      date: new Date().toISOString().split('T')[0],
      author: currentUserRole === 'director' ? 'المدير العام' : 'المشرف العام',
      importance: snImportance,
      details: snDetails,
      requiredAction: snAction || 'استمرار المتابعة الميدانية',
      status: 'قيد المتابعة'
    };
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return { ...t, structuredNotes: [newNoteObj, ...(t.structuredNotes || [])] };
      }
      return t;
    }));
    setSnDetails('');
    setSnAction('');
    setShowStructuredNoteModal(false);
    triggerToast('✓ تم توثيق الملاحظة المهيكلة وإضافتها للسجل المعتمد.');
  };

  // --- TEACHER MINI CENTER STATE ---
  const [miniTeacherId, setMiniTeacherId] = useState<string>(
    loggedInTeacher ? loggedInTeacher.id : 'TCH-001'
  );
  const [miniSelectedAlertId, setMiniSelectedAlertId] = useState<string>('');
  const [miniActionNote, setMiniActionNote] = useState<string>('');
  const [miniSuccessToast, setMiniSuccessToast] = useState<string | null>(null);

  // Mock Circle Alerts for Teachers Mini Center
  const [circleAlerts, setCircleAlerts] = useState<Array<{
    id: string;
    teacherId: string;
    studentName: string;
    circleName: string;
    type: 'absence' | 'plan_delay' | 'review_delay' | 'behaviour';
    title: string;
    details: string;
    status: 'open' | 'parent_contacted' | 'resolved' | 'escalated';
    date: string;
  }>>([
    {
      id: 'ca-1',
      teacherId: 'TCH-001',
      studentName: 'أحمد العبيد',
      circleName: 'حلقة حفظ الطليعة',
      type: 'plan_delay',
      title: 'تأخر متراكم عن الخطة الدراسية (7 صفحات)',
      details: 'الطالب يتخلف عن الجدول المقرر لمراجعة سورة البقرة منذ بداية الأسبوع.',
      status: 'open',
      date: '2026-06-21'
    },
    {
      id: 'ca-2',
      teacherId: 'TCH-001',
      studentName: 'سلمان بن فهد العتيبي',
      circleName: 'حلقة حفظ الطليعة',
      type: 'absence',
      title: 'غياب متتالي بغير عذر (3 أيام)',
      details: 'انقطاع تام عن حضور طابور التثبيت المسائي بالحلقة.',
      status: 'open',
      date: '2026-06-22'
    },
    {
      id: 'ca-3',
      teacherId: 'TCH-002',
      studentName: 'عمر بن خالد الماجد',
      circleName: 'حلقة حفص للإتقان',
      type: 'review_delay',
      title: 'تأخر في حزمة المراجعة الصغرى',
      details: 'تجاوز مهلة التسميع لـ 5 أجزاء تراكمية.',
      status: 'open',
      date: '2026-06-20'
    },
    {
      id: 'ca-4',
      teacherId: 'TCH-003',
      studentName: 'يوسف عبدالكريم العمري',
      circleName: 'حلقة الإمام عاصم',
      type: 'plan_delay',
      title: 'تأخر في تحضير ورد الحفظ الجديد',
      details: 'يحتاج الطالب متابعة مكثفة في أحكام التجويد والورد اليومي.',
      status: 'open',
      date: '2026-06-22'
    }
  ]);

  const handleTeacherMiniAction = (actionType: 'parent_call' | 'resolve' | 'escalate') => {
    if (!miniSelectedAlertId) return;
    const targetAlert = circleAlerts.find(a => a.id === miniSelectedAlertId);
    if (!targetAlert) return;

    if (actionType === 'resolve') {
      setCircleAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'resolved' } : a));
      setMiniSuccessToast(`✓ تم بنجاح إغلاق التنبيه وتوثيق الإنجاز في ${targetAlert.circleName} (${targetAlert.studentName}).`);
    } else if (actionType === 'parent_call') {
      setCircleAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'parent_contacted' } : a));
      setMiniSuccessToast(`✓ تم توثيق التواصل مع ولي أمر الطالب ${targetAlert.studentName}.`);
    } else if (actionType === 'escalate') {
      setCircleAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'escalated' } : a));
      setMiniSuccessToast(`🚀 تم رفع طلب دعم وتصعيد قضية ${targetAlert.studentName} لإدارة الشؤون التعليمية.`);
    }

    if (miniActionNote.trim()) {
      setTeachers(prev => prev.map(t => {
        if (t.id === miniTeacherId) {
          return {
            ...t,
            notes: [
              {
                id: `n-${Date.now()}`,
                text: `[إجراء معلم الحلقة - ${targetAlert.studentName}]: ${miniActionNote}`,
                date: new Date().toISOString().split('T')[0],
                author: 'مشرف الحلقات',
                type: 'admin'
              },
              ...t.notes
            ]
          };
        }
        return t;
      }));
    }

    setMiniActionNote('');
    setTimeout(() => setMiniSuccessToast(null), 4000);
  };
  
  // Create / Edit new teacher panel state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    phone: '',
    specialty: 'حلقات وقرآن كريم' as Teacher['specialty'],
    qualification: 'بكالوريوس شريعة' as Teacher['qualification'],
    salary: 4500,
    hireDate: new Date().toISOString().split('T')[0],
    assignedCircles: '',
    status: 'active' as Teacher['status']
  });

  // Notes Form State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<'positive' | 'negative' | 'admin'>('positive');

  // Search and Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  // Compare Teachers Module States (Section 3)
  const [compareTch1, setCompareTch1] = useState<string>('TCH-001');
  const [compareTch2, setCompareTch2] = useState<string>('TCH-002');

  // Audit Logs (Section 6)
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    timestamp: string;
    actor: string;
    actionType: string;
    details: string;
  }>>([
    { id: 'log-1', timestamp: '2026-06-22T08:15:00Z', actor: 'المدير العام', actionType: 'تقييم أداء', details: 'تحديث علامة التزام الخطة للشيخ عبد الرحمن السعيد لتصبح 95%' },
    { id: 'log-2', timestamp: '2026-06-22T09:30:00Z', actor: 'المشرف العام', actionType: 'إضافة ملاحظة', details: 'إضافة تنويه إيجابي للشيخ يونس الدوسري لالتزامه باللوحة والمذكرات' }
  ]);

  // Toast Control
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Safe Audit logger
  const logAction = (action: string, details: string) => {
    const actorName = currentUserRole === 'director' ? 'المدير العام' : currentUserRole === 'supervisor' ? 'المشرف العام' : 'مشرف الحلقة';
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actionType: action,
      details
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Auto recalculate ranks when any teacher score updates
  const updateTeacherScoreRankHistory = (updatedTeachers: Teacher[]) => {
    // Basic calculation for points: rating*100 + plan*5 + attendance*3 + student*2
    const withPoints = updatedTeachers.map(tch => {
      const calculatedPoints = Math.round(
        (tch.rating * 110) + 
        (tch.planComplianceRate * 3) + 
        (tch.attendanceRate * 2.5) + 
        (tch.averageStudentExamScore * 1.5)
      );
      return { ...tch, totalPoints: calculatedPoints };
    });

    // Sort descending by points
    const sorted = [...withPoints].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Map their new ranks
    const final = withPoints.map(tch => {
      const sortedIdx = sorted.findIndex(s => s.id === tch.id);
      const newRank = sortedIdx + 1;
      let trend: Teacher['rankTrend'] = 'stable';
      if (tch.rank > newRank) trend = 'up';
      else if (tch.rank < newRank) trend = 'down';
      else trend = 'stable';

      return {
        ...tch,
        rank: newRank,
        rankTrend: trend
      };
    });

    setTeachers(final);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name || !newTeacherForm.phone) {
      triggerToast('يرجى ملء اسم المعلم ورقم هاتفه من فضلك.');
      return;
    }

    const circlesArr = newTeacherForm.assignedCircles 
      ? newTeacherForm.assignedCircles.split('،').map(c => c.trim()) 
      : ['حلقة عامة جديدة'];

    const newT: Teacher = {
      id: `TCH-${String(teachers.length + 1).padStart(3, '0')}`,
      name: newTeacherForm.name,
      jobTitle: 'معلم حلقات وقرآن كريم',
      phone: newTeacherForm.phone,
      specialty: newTeacherForm.specialty,
      assignedCircles: circlesArr,
      hireDate: newTeacherForm.hireDate,
      status: newTeacherForm.status,
      rating: 4.5,
      attendanceRate: 90,
      planComplianceRate: 85,
      studentProgressRate: 80,
      averageStudentExamScore: 85,
      totalPoints: 750,
      qualification: newTeacherForm.qualification,
      salary: showSalary ? newTeacherForm.salary : 4000,
      rank: teachers.length + 1,
      rankTrend: 'stable',
      graduatedStudentsCount: 0,
      supervisorName: 'الشيخ إبراهيم المنصور',
      circlesDetailed: circlesArr.map((c, idx) => ({
        id: `c-new-${idx}`,
        name: c,
        level: 'متوسط',
        studentCount: 15,
        performanceIdx: 85
      })),
      executiveSummary: {
        overallScore: 85,
        strengths: ['انضباط ممتاز بالجدول اليومي', 'علاقة إيجابية مع الطلاب'],
        needsFollowUp: ['متابعة رصد الدرجات أسبوعياً'],
        latestAchievement: 'الانضمام لكادر المجمع بنجاح',
        suggestedAction: 'تحديد حلقة الحفظ وتسكين الطلاب'
      },
      educationalPerformance: {
        avgMemorization: 85,
        avgRevision: 85,
        avgMastery: 85,
        avgExams: 85,
        studentProgressRate: 80,
        topStudentsCount: 3,
        strugglingStudentsCount: 1,
        stoppedStudentsCount: 0,
        urgentFollowUpStudents: []
      },
      circlesDetailedEnhanced: circlesArr.map((c, idx) => ({
        id: `c-enh-new-${idx}`,
        name: c,
        level: 'متوسط',
        studentCount: 15,
        attendanceRate: 95,
        memorizationRate: 90,
        masteryRate: 92,
        examsRate: 88,
        topStudentsCount: 3,
        strugglingStudentsCount: 1,
        trend: 'up'
      })),
      disciplineAndCompliance: {
        meetingAttendanceRate: 90,
        tardinessCount: 0,
        absenceCount: 0,
        excusesCount: 0,
        attendanceLoggingRate: 95,
        gradesLoggingRate: 90,
        planComplianceRate: 85,
        reportsComplianceRate: 90,
        lastTardiness: null
      },
      tasks: [],
      activities: [],
      parentCommunication: {
        totalRequests: 2,
        closedRequests: 2,
        openRequests: 0,
        avgResponseTimeHours: 4,
        escalatedCases: 0
      },
      professionalDevelopment: {
        completedCourses: [],
        requiredCourses: [],
        lastCourse: { title: 'ورشة التميز الميداني', date: newTeacherForm.hireDate },
        lastEvaluationDate: newTeacherForm.hireDate,
        nextEvaluationDate: '2026-12-31',
        strengths: ['حرص واجتهاد في التأسيس'],
        improvementAreas: ['مهارات المتابعة الفردية للطلاب'],
        supervisorRecommendations: 'الالتحاق ببرنامج التأهيل التربوي للحلقات'
      },
      badges: [],
      structuredNotes: [],
      adminEvents: [],
      notes: [],
      jobHistory: [
        {
          id: `h-init-${Date.now()}`,
          date: newTeacherForm.hireDate,
          event: 'التعيين والمباشرة',
          details: `تم تأسيس الملف الوظيفي والتعيين بتخصص ${newTeacherForm.specialty}`,
          operator: currentUserRole === 'director' ? 'المدير العام' : 'المشرف العام'
        }
      ]
    };

    const updated = [newT, ...teachers];
    updateTeacherScoreRankHistory(updated);
    setShowAddForm(false);
    triggerToast(`✓ تم إضافة وتعيين المعلم أ. ${newTeacherForm.name} ودمجه في لوحة التقييم.`);
    logAction('إضافة كادر', `تعيين المعلم الجديد ${newTeacherForm.name} برقم وظيفي ${newT.id}`);
    
    // Reset form
    setNewTeacherForm({
      name: '',
      phone: '',
      specialty: 'حلقات وقرآن كريم',
      qualification: 'بكالوريوس شريعة',
      salary: 4500,
      hireDate: new Date().toISOString().split('T')[0],
      assignedCircles: '',
      status: 'active'
    });
  };

  const handleUpdateStatus = (id: string, newStatus: Teacher['status']) => {
    const updated = teachers.map(t => {
      if (t.id === id) {
        const histItem = {
          id: `h-status-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          event: 'تعديل الحالة الوظيفية',
          details: `تعديل حالة المدرس من ${t.status} إلى ${newStatus}`,
          operator: currentUserRole === 'director' ? 'المدير العام' : 'المشرف العام'
        };
        return {
          ...t,
          status: newStatus,
          jobHistory: [histItem, ...t.jobHistory]
        };
      }
      return t;
    });
    setTeachers(updated);
    triggerToast('✓ تم تعديل الحالة الوظيفية للكادر وتدوير ملف التغييرات.');
    logAction('تحديث الحالة الوظيفية', `تعديل حالة المعلم ${id} إلى ${newStatus}`);
  };

  const handleAddNote = (e: React.FormEvent, teacherId: string) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const authorLabel = currentUserRole === 'director' ? 'المدير العام' : currentUserRole === 'supervisor' ? 'المشرف العام' : 'مشرف الحلقات';

    const updated = teachers.map(t => {
      if (t.id === teacherId) {
        const newN = {
          id: `note-${Date.now()}`,
          text: newNoteText,
          date: new Date().toISOString().split('T')[0],
          author: authorLabel as any,
          type: newNoteType
        };
        return {
          ...t,
          notes: [newN, ...t.notes]
        };
      }
      return t;
    });

    setTeachers(updated);
    setNewNoteText('');
    triggerToast('✓ تم تقييد وحفظ الملاحظة الإدارية بملف السلوك الوظيفي بنجاح.');
    logAction('إضافة ملاحظة سلوكية', `إضافة ملاحظة من النوع ${newNoteType} للمعلم ${teacherId}`);
  };

  const handleDeleteNote = (teacherId: string, noteId: string) => {
    if (currentUserRole !== 'director' && currentUserRole !== 'supervisor') {
      triggerToast('⚠️ عذراً، لا تمتلك الصلاحيات الإدارية الكافية لحذف هذه الملاحظة.');
      return;
    }

    const doubleCheck = window.confirm('هل أنت متأكد من رغبتك في حذف هذه الملاحظة الوظيفية الموثقة؟');
    if (!doubleCheck) return;

    const updated = teachers.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          notes: t.notes.filter(n => n.id !== noteId)
        };
      }
      return t;
    });

    setTeachers(updated);
    triggerToast('✓ تم حذف الملاحظة بنجاح وتحديث جودة الملف.');
    logAction('حذف ملاحظة إدارية', `إلغاء ملاحظة من ملف المعلم ${teacherId}`);
  };

  // Edit fields from profile direct
  const handleUpdateQualification = (id: string, qual: Teacher['qualification']) => {
    const updated = teachers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          qualification: qual
        };
      }
      return t;
    });
    setTeachers(updated);
    triggerToast('✓ تم رصد وتحديث المؤهل والحالة العلمية للمعلم للترقية الإدارية.');
    logAction('تحديث المؤهل العلمي', `تعديل المؤهل العلمي للمعلم ${id} إلى ${qual}`);
  };

  const handleUpdateRatingAndKPI = (id: string, field: 'rating' | 'attendanceRate' | 'planComplianceRate' | 'averageStudentExamScore', value: number) => {
    if (currentUserRole !== 'director' && currentUserRole !== 'supervisor') {
      triggerToast('⚠️ عذراً، وظيفة تحكم الأداء حصرية للمدير أو المشرف العام.');
      return;
    }

    const updated = teachers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          [field]: value
        };
      }
      return t;
    });
    updateTeacherScoreRankHistory(updated);
    triggerToast('✓ تم إعادة احتساب المؤشر التربوي التجميعي وتدوير الرتبة التنافسية.');
    logAction('تعديل مؤشر أداة', `تعديل قيمة حقل ${field} للمعلم ${id} لتصبح ${value}`);
  };

  // PRINT GENERATOR (PORTFOLIO REPORT)
  const handlePrintTeacherPortfolio = (teacher: Teacher) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>الملف المهني للمدرس - ${teacher.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              direction: rtl;
              text-align: right;
              padding: 40px;
              color: #1e293b;
            }
            .header {
              border-bottom: 3px double #059669;
              padding-bottom: 20px;
              margin-bottom: 30px;
              text-align: center;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #065f46;
            }
            .subtitle {
              font-size: 14px;
              color: #475569;
              margin-top: 5px;
            }
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .card-title {
              font-size: 16px;
              font-weight: bold;
              color: #0f172a;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: right;
              font-size: 12px;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-pos { background-color: #d1fae5; color: #065f46; }
            .badge-neg { background-color: #fee2e2; color: #991b1b; }
            .badge-adm { background-color: #e0f2fe; color: #0369a1; }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="title">الملف المهني الشامل للمدرس الكرار</div>
            <div class="subtitle">ملتـقى هـدى القـرآني النموذجي - إدارة شؤون المعلمين والمشرفين</div>
            <p style="font-size: 11px; color:#64748b">تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">1. البيانات الوظيفية والشخصية</div>
              <p><strong>اسم المدرس:</strong> ${teacher.name}</p>
              <p><strong>رقم الجوال:</strong> ${teacher.phone}</p>
              <p><strong>تاريخ التعيين:</strong> ${teacher.hireDate}</p>
              <p><strong>المؤهل الأكاديمي:</strong> ${teacher.qualification}</p>
              <p><strong>التخصص الدستوري:</strong> ${teacher.specialty}</p>
              <p><strong>مستوى الرتبة والترتيب الفخم للمجمع:</strong> المرتبة ${teacher.rank} (برصيد ${teacher.totalPoints} نقطة)</p>
            </div>

            <div class="card">
              <div class="card-title">2. مؤشرات الأداء والقياس (KPIs)</div>
              <p><strong>نسبة الحضور والانضباط:</strong> ${teacher.attendanceRate}%</p>
              <p><strong>معدل الالتزام بالخطة التعليمية:</strong> ${teacher.planComplianceRate}%</p>
              <p><strong>متوسط علامات اختبارات الطلاب:</strong> ${teacher.averageStudentExamScore}%</p>
              <p><strong>التقييم الإجمالي العام للمشرفين:</strong> ${teacher.rating} / 5 نجوم</p>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <div class="card-title">3. الحلقات القرآنية المسندة إليه حالياً</div>
            <table>
              <thead>
                <tr>
                  <th>اسم الحلقة القرآني</th>
                  <th>المستوى المستهدف</th>
                  <th>تعداد الحفظة النشطين</th>
                  <th>مؤشر إنجاز الحلقة</th>
                </tr>
              </thead>
              <tbody>
                ${teacher.circlesDetailed.map(c => `
                  <tr>
                    <td>${c.name}</td>
                    <td>${c.level}</td>
                    <td>${c.studentCount} طلاب</td>
                    <td>${c.performanceIdx}% ممتاز</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">4. سجل الملاحظات السلوكية والتربوية المعتمدة</div>
            <table>
              <thead>
                <tr>
                  <th>الملاحظة والتدوين</th>
                  <th>التاريخ</th>
                  <th>الرتبة المدونة</th>
                  <th>تصنيف الأثر</th>
                </tr>
              </thead>
              <tbody>
                ${teacher.notes.length === 0 ? '<tr><td colspan="4" style="text-align:center">لا يوجد ملاحظات مدونة بملف المدرس لحد الآن.</td></tr>' : 
                  teacher.notes.map(n => `
                    <tr>
                      <td>${n.text}</td>
                      <td>${n.date}</td>
                      <td>${n.author}</td>
                      <td><span class="badge ${n.type === 'positive' ? 'badge-pos' : n.type === 'negative' ? 'badge-neg' : 'badge-adm'}">${n.type === 'positive' ? 'تنويه مميز' : n.type === 'negative' ? 'ملحوظة تركيز' : 'إجراء إداري'}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="footer">
            وثيقة رقمية معتمدة وصادرة عن منصة نظام تشغيل الملتقى الهدائي. يمنع نسخها لجهات خارجية دون إخلاء الطرف وإثبات الهوية الموثقة.
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- FILTERS CALCULATIONS ---
  const filteredTeachers = teachers.filter(t => {
    if (isTeacherUser && loggedInTeacher) {
      if (t.id !== loggedInTeacher.id) return false;
    }
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.phone.includes(searchQuery) ||
                          t.assignedCircles.some(c => c.includes(searchQuery));
    const matchesSpecialty = specialtyFilter === 'all' || t.specialty === specialtyFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMinRating = t.rating >= minRatingFilter;
    return matchesSearch && matchesSpecialty && matchesStatus && matchesMinRating;
  });

  const getPerformanceBadge = (evalScore: number) => {
    if (evalScore >= 4.5) {
      return (
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
          <span>🟢 ممتاز جداً</span>
        </span>
      );
    } else if (evalScore >= 4.0) {
      return (
        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0" />
          <span>🟡 جيد جداً</span>
        </span>
      );
    } else {
      return (
        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
          <span>🔴 يحتاج تحسين</span>
        </span>
      );
    }
  };

  const getStatusLabelAndColor = (status: Teacher['status']) => {
    switch (status) {
      case 'active':
        return { label: 'على رأس العمل', color: 'bg-emerald-100 text-emerald-950 border-emerald-200' };
      case 'on_leave':
        return { label: 'في إجازة رسمية', color: 'bg-amber-100 text-amber-950 border-amber-200' };
      case 'suspended':
        return { label: 'موقوف مؤقتاً', color: 'bg-rose-100 text-rose-950 border-rose-200' };
      case 'terminated':
        return { label: 'منتهي الخدمة', color: 'bg-slate-100 text-slate-850 border-slate-200' };
    }
  };

  // Smart Index Medians for metrics view
  const avgAttendance = Math.round(teachers.reduce((acc, t) => acc + t.attendanceRate, 0) / teachers.length);
  const avgCompliance = Math.round(teachers.reduce((acc, t) => acc + t.planComplianceRate, 0) / teachers.length);
  const avgStudentPerformance = Math.round(teachers.reduce((acc, t) => acc + t.averageStudentExamScore, 0) / teachers.length);
  const avgGlobalRating = (teachers.reduce((acc, t) => acc + t.rating, 0) / teachers.length).toFixed(2);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="teachers-staff-portal">
      
      {/* Toast Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-5 left-5 bg-slate-900 border border-slate-700 text-white p-4.5 rounded-xl text-xs font-bold shadow-2xl z-50 flex items-center gap-2"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR AND BRANDING PORTFOLIO */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-1 px-3.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Award className="h-3 w-3 inline text-emerald-600" />
              الاعتماد الأكاديمي التربوي الكلي
            </span>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-150 p-1 px-2.5 rounded-full text-[10px] font-bold">
              تحديث الموسم المزدحم 2026
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">مستودع الكادر التعليمي وتقييم الأداء الميداني</h2>
          <p className="text-slate-450 text-xs font-medium">سجلات شاملة لكبار المقرئين، قياس مستويات أثر المعلمين، لوحة المقارنة المعيارية والنزاهة التعليمية للملتقى.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10 text-xs font-bold">
          {isAdmin && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button 
                onClick={() => { setCurrentUserRole('director'); setShowSalary(true); }}
                className={`p-1.5 px-3 rounded-lg ${currentUserRole === 'director' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                مدير عام (كامل الصلاحيات)
              </button>
              <button 
                onClick={() => { setCurrentUserRole('supervisor'); setShowSalary(false); }}
                className={`p-1.5 px-3 rounded-lg ${currentUserRole === 'supervisor' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                مشرف عام (حجب المرتب)
              </button>
            </div>
          )}
          {isAdmin && (
            <button 
              type="button"
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-xs hover:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>تعيين مدرس جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE STATS & INTERACTIVE SMART INDICATORS (SECTION 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="smart-teachers-indicators">
        
        {/* Index 1 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400">مؤشر جودة العطاء والتدريس (Teaching Quality)</p>
            <h3 className="text-2xl font-black text-emerald-800 font-display">{avgGlobalRating} / 5.0</h3>
            <div className="flex items-center justify-between text-[10px] text-slate-450 mt-2">
              <span>متوسط تقييم الحلقات</span>
              <span className="text-emerald-700 font-bold">مستقر ممتاز</span>
            </div>
          </div>
          <div className="absolute top-2 left-2 p-1.5 bg-emerald-50 rounded-lg">
            <Star className="h-4 w-4 text-emerald-600 fill-emerald-500" />
          </div>
        </div>

        {/* Index 2 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400">معدل الانضباط والالتزام بالخطة (Plan Adherence)</p>
            <h3 className="text-2xl font-black text-indigo-950 font-display">{avgCompliance}%</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgCompliance}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>نسبة المطابقة للخطط</span>
              <span>المعيار المؤسسي {avgCompliance}%</span>
            </div>
          </div>
          <div className="absolute top-2 left-2 p-1.5 bg-indigo-50 rounded-lg">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </div>
        </div>

        {/* Index 3 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400">مؤشر الانضباط والحضور (Attendance index)</p>
            <h3 className="text-2xl font-black text-sky-800 font-display">{avgAttendance}%</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-sky-505 h-full rounded-full" style={{ width: `${avgAttendance}%`, backgroundColor: '#0284c7' }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>تأخر أو غياب طفيف</span>
              <span className="text-sky-750 font-semibold">تغطية ذكية</span>
            </div>
          </div>
          <div className="absolute top-2 left-2 p-1.5 bg-sky-50 rounded-lg">
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
        </div>

        {/* Index 4 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400">مؤشر أثر المعلم على تقدم الحفاظ (Student Impact)</p>
            <h3 className="text-2xl font-black text-amber-800 font-display">{avgStudentPerformance}%</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: `${avgStudentPerformance}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>متوسط درجات الاختبار النهائي</span>
              <span className="text-amber-850 font-bold">بناء متين</span>
            </div>
          </div>
          <div className="absolute top-2 left-2 p-1.5 bg-amber-50 rounded-lg">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
        </div>

        {/* Index 5 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-450">مؤشر الاستقرار والاستدامة الوظيفية</p>
            <h3 className="text-2xl font-black text-slate-800 font-display">95.4%</h3>
            <div className="flex items-center text-[9px] text-emerald-800 font-bold gap-1 mt-1">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>معدل تسرب 0% هذا الفصل</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">متوسط خدمة المعلمين 2.4 سنة</div>
          </div>
          <div className="absolute top-2 left-2 p-1.5 bg-slate-100 rounded-lg">
            <UserCheck className="h-4 w-4 text-slate-700" />
          </div>
        </div>

      </div>

      {/* TABS SELECTOR PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isTeacherUser && (
            <button
              onClick={() => { setActiveTab('list'); setSelectedTeacherId(null); }}
              className={`p-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' && !selectedTeacherId ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-650 hover:bg-slate-50'}`}
            >
              <Users className="h-4 w-4 inline ml-1.5 text-current" />
              <span>قائمة شؤون المعلمين والكادر</span>
            </button>
          )}

          {!isTeacherUser && (
            <>
              <button
                onClick={() => { setActiveTab('evaluations'); setSelectedTeacherId(null); }}
                className={`p-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'evaluations' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-650 hover:bg-slate-50'}`}
              >
                <ClipboardList className="h-4 w-4 inline ml-1.5 text-current" />
                <span>مقارنات أداء الكوادر</span>
              </button>

              <button
                onClick={() => { setActiveTab('leaderboard'); setSelectedTeacherId(null); }}
                className={`p-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-650 hover:bg-slate-50'}`}
              >
                <Award className="h-4 w-4 inline ml-1.5 text-current" />
                <span>لوحة الترتيب والتفاضل</span>
              </button>
            </>
          )}
        </div>

        {selectedTeacherId && (
          <button
            onClick={() => setSelectedTeacherId(null)}
            className="text-xs bg-amber-50 text-amber-900 border border-amber-200 p-1.5 px-3 rounded-lg font-bold flex items-center gap-1"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>العودة لإنهاء تصفح الملف والرجوع للقائمة</span>
          </button>
        )}
      </div>

      {/* DYNAMIC FORMS: ADD TEACHER MODAL (SECTION 1 / SECTION 3) */}
      <AnimatePresence>
        {showAddForm && isAdmin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-slate-800 font-display">تأسيس وتعيين كادر تعليمي جديد</span>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs sm:text-sm">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الاسم الكامل (ثنائي أو ثلاثي أو رباعي):</label>
                  <input 
                    type="text" 
                    required 
                    value={newTeacherForm.name}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                    placeholder="مثال: د. ماجد بن واصل الدجاني"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-600 text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">رقم الهاتف النشط:</label>
                    <input 
                      type="tel" 
                      required
                      value={newTeacherForm.phone}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-600 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">تاريخ المباشرة المعتمد:</label>
                    <input 
                      type="date" 
                      value={newTeacherForm.hireDate}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, hireDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-600 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">التخصص الرئيسي:</label>
                    <select
                      value={newTeacherForm.specialty}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, specialty: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none bg-white text-xs font-semibold"
                    >
                      <option value="حلقات وقرآن كريم">حلقات وقرآن كريم</option>
                      <option value="تجويد وقراءات">تجويد وقراءات</option>
                      <option value="علوم شرعية وتربوية">علوم شرعية وتربوية</option>
                      <option value="إداري ومنسق">إداري ومنسق</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">المؤهل الأكاديمي والحالة العلمية:</label>
                    <select
                      value={newTeacherForm.qualification}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, qualification: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none bg-white text-xs font-semibold"
                    >
                      <option value="بكالوريوس شريعة">بكالوريوس شريعة (العلوم الكبرى)</option>
                      <option value="بكالوريوس علوم حاسب / تقنية">بكالوريوس تقنية / IT</option>
                      <option value="دبلوم قراءات قرآنية">دبلوم قراءات قرآنية</option>
                      <option value="إجازة قرآنية بسند متصل">إجازة قرآنية بسند متصل غيبي</option>
                      <option value="ماجستير أصول دين">ماجستير أصول دين</option>
                      <option value="دكتوراه فقه مقارن">دكتوراه فقه مقارن</option>
                      <option value="ثانوي + خبرة ميدانية">ثانوي + خبرة ميدانية</option>
                    </select>
                  </div>
                </div>

                {showSalary && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 font-display">المرتب الشهري المقترح (ريال سعودي):</label>
                    <input 
                      type="number" 
                      value={newTeacherForm.salary}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, salary: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono text-xs text-slate-800"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الحلقات المقترح إسنادها إليه (تفصل بـ "،"):</label>
                  <input 
                    type="text" 
                    value={newTeacherForm.assignedCircles}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, assignedCircles: e.target.value })}
                    placeholder="مثال: حلقة النخبة المسائية، حلقة السند"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    إلغاء التكليف
                  </button>
                  <button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-3xs"
                  >
                    تثبيت وتعيين الآن
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER VIEW 1: CENTRAL TEACHERS list TABLE & DETAILS (SECTION 1 & SECTION 2) */}
      {activeTab === 'list' && !selectedTeacherId && (
        <div className="space-y-4 animate-fade-in" id="tch-management-list-pane">
          
          {/* SEARCH, SORT AND SYSTEM CONTROLS RANGE */}
          <div className="bg-white rounded-2xl border border-slate-150 p-4.5 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/3 relative">
              <input 
                type="text"
                placeholder="ابحث باسم المعلم، تفصيل التخصص المدرس، الهواتف أو الحلقة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 bg-white"
              />
              <Search className="h-4 w-4 text-slate-400 absolute top-2.5 right-3.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-semibold select-none">
              <span className="text-slate-400 text-[10px] font-bold">تصفية سريعة:</span>
              
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="border border-slate-200 rounded-xl p-1.5 px-3 bg-white text-[11px]"
              >
                <option value="all">كل التخصصات والمقرئين</option>
                <option value="حلقات وقرآن كريم">حلقات وقرآن كريم</option>
                <option value="تجويد وقراءات">تجويد وقراءات</option>
                <option value="علوم شرعية وتربوية">علوم شرعية وتربوية</option>
                <option value="إداري ومنسق">إداري ومنسق</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl p-1.5 px-3 bg-white text-[11px]"
              >
                <option value="all">كل الحالات الوظيفية</option>
                <option value="active">على رأس العمل</option>
                <option value="on_leave">في إجازة رسمية</option>
                <option value="suspended">موقوف مؤقتاً</option>
                <option value="terminated">منتهي الخدمة</option>
              </select>

              <select
                value={minRatingFilter.toString()}
                onChange={(e) => setMinRatingFilter(Number(e.target.value))}
                className="border border-slate-200 rounded-xl p-1.5 px-3 bg-white text-[11px]"
              >
                <option value="0">أي تقييم للمدرسين</option>
                <option value="4.5">الممتازون (+4.5 نجمة)</option>
                <option value="4.0">فوق الجيد جداً (+4.0 نجوم)</option>
              </select>

              {(searchQuery || specialtyFilter !== 'all' || statusFilter !== 'all' || minRatingFilter > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSpecialtyFilter('all');
                    setStatusFilter('all');
                    setMinRatingFilter(0);
                    triggerToast('✓ تم تصفير فلاتر تتبع الحلقات والمعلمين.');
                  }}
                  className="bg-rose-50 text-rose-800 border border-rose-150 p-1 px-3.5 rounded-xl font-bold hover:bg-rose-100"
                >
                  تصفير الفرز
                </button>
              )}
            </div>
          </div>

          {/* TABLE DISPLAY - HIGHLY DESIGNED GRAPHIC (SECTION 1) */}
          <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                    <th className="p-4 w-12 text-center">الرتبة</th>
                    <th className="p-4">اسم المدرس والمعلم الفاضل</th>
                    <th className="p-4">التخصص الأكاديمي</th>
                    <th className="p-4">الحلقات والشعب المسندة</th>
                    <th className="p-4">المؤهل / الحالة العلمية</th>
                    <th className="p-4 text-center">الانضباط والغياب</th>
                    <th className="p-4 text-center">أثر الاختبارات</th>
                    <th className="p-4 text-center">التقييم وسلوك السيرة</th>
                    <th className="p-4 text-center">الحالة الوظيفية</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredTeachers.map((teacher) => {
                    const statusData = getStatusLabelAndColor(teacher.status);
                    return (
                      <tr 
                        key={teacher.id} 
                        className="hover:bg-slate-50/80 transition-all font-medium"
                      >
                        {/* Rank Position block */}
                        <td className="p-4 text-center font-bold font-mono">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-sm text-slate-705">#{teacher.rank}</span>
                            {teacher.rankTrend === 'up' && <span className="text-emerald-600 text-[10px]">↑</span>}
                            {teacher.rankTrend === 'down' && <span className="text-rose-600 text-[10px]">↓</span>}
                            {teacher.rankTrend === 'stable' && <span className="text-slate-400 text-[10px]">→</span>}
                          </div>
                        </td>

                        {/* Name and Phone details */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <button
                              onClick={() => setSelectedTeacherId(teacher.id)}
                              className="font-bold text-slate-800 hover:text-emerald-700 text-xs sm:text-sm block transition-all"
                            >
                               أ. {teacher.name}
                            </button>
                            <span className="text-[10px] text-slate-450 font-mono">جوال: {teacher.phone} | وظيفي: {teacher.id}</span>
                          </div>
                        </td>

                        {/* Specialty badge */}
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold">
                            {teacher.specialty}
                          </span>
                        </td>

                        {/* Assigned circles names */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.assignedCircles.map((circle, index) => (
                              <span 
                                key={index} 
                                className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              >
                                {circle}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Academic Qualification */}
                        <td className="p-4 font-semibold text-slate-700">
                          {teacher.qualification}
                        </td>

                        {/* Attendance Index */}
                        <td className="p-4 text-center">
                          <div className="space-y-1">
                            <span className="font-bold font-mono text-xs">{teacher.attendanceRate}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1 mx-auto overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${teacher.attendanceRate >= 93 ? 'bg-emerald-600' : 'bg-amber-500'}`} 
                                style={{ width: `${teacher.attendanceRate}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Student exam average impact */}
                        <td className="p-4 text-center font-bold font-mono text-emerald-800">
                          {teacher.averageStudentExamScore}% 
                        </td>

                        {/* Rating with overall stars and compliance text */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="font-bold text-xs">{teacher.rating}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">الخطة: {teacher.planComplianceRate}%</span>
                          </div>
                        </td>

                        {/* Status badges */}
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </td>

                        {/* Quick action triggers */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedTeacherId(teacher.id)}
                              className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-150 hover:bg-emerald-100 p-1 px-2.5 rounded-lg font-bold flex items-center gap-0.5"
                            >
                              <span>الملف الشخصي</span>
                            </button>
                            <button
                              onClick={() => handlePrintTeacherPortfolio(teacher)}
                              className="text-slate-550 border hover:bg-slate-50 border-slate-205 p-1 rounded"
                              title="طباعة تقرير البصمة الوظيفية"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-400">
                        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-xs">لا يوجد كوادر تنطبق عليها شروط التصفية والبحث حالياً.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 px-4 border-t border-slate-150 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>إجمالي الموقوفين في القائمة المفرزة: {filteredTeachers.length} كوادر إبداعية وتربوية</span>
              <span>الملتـقى الكلي النموذجي للقرآن الكريم</span>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: DEDICATED TEACHER PROFILE VIEW (الملف الشخصي الشامل والمنظومة المتكاملة - SECTION 2) */}
      {selectedTeacherId && (
        (() => {
          const teacher = teachers.find(t => t.id === selectedTeacherId);
          if (!teacher) return <p className="p-8 text-center text-slate-500">المعلم غير موجود أو تم إلغاء أرشفته.</p>;
          const sLabel = getStatusLabelAndColor(teacher.status);
          const serviceDuration = calculateServiceDuration(teacher.hireDate);
          const compScore = calculateComprehensiveScore(teacher, evaluationWeights);

          return (
            <div className="space-y-6 animate-fade-in" id="tch-detail-profile-workbench">
              
              {/* Profile Header Bar & Navigation Sub-Tabs */}
              <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTeacherId(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>← العودة للقائمة الكلية</span>
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 font-display">
                      أ. {teacher.name}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {teacher.jobTitle || 'معلم حلقات وقرآن كريم'} | المعرف: {teacher.id} | خدمة: {serviceDuration}
                    </p>
                  </div>
                </div>

                {/* Sub Tabs Selector */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold bg-slate-50 p-1.5 rounded-xl border border-slate-150">
                  <button
                    onClick={() => setProfileActiveTab('summary')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${profileActiveTab === 'summary' ? 'bg-emerald-800 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    الملخص التنفيذي
                  </button>
                  <button
                    onClick={() => setProfileActiveTab('educational')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${profileActiveTab === 'educational' ? 'bg-emerald-800 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    الأداء التعليمي والحلقات
                  </button>
                  <button
                    onClick={() => setProfileActiveTab('discipline')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${profileActiveTab === 'discipline' ? 'bg-emerald-800 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    الانضباط والمهام والأنشطة
                  </button>
                  <button
                    onClick={() => setProfileActiveTab('development')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${profileActiveTab === 'development' ? 'bg-emerald-800 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    التطوير المهني والأوسمة
                  </button>
                  <button
                    onClick={() => setProfileActiveTab('notes')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${profileActiveTab === 'notes' ? 'bg-emerald-800 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    الملاحظات والقرارات
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* RIGHT SIDEBAR PANEL: GENERAL IDENTITY & KPIS - 4 COLS */}
                <div className="lg:col-span-4 space-y-5">
                  
                  {/* Personal Identity Card */}
                  <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs text-center space-y-4">
                    <div className="h-20 w-20 bg-emerald-800 text-amber-200 rounded-full border border-amber-100 flex items-center justify-center font-display font-black text-2xl shadow-md mx-auto">
                      {teacher.name.split(' ').slice(1, 3).map(n => n[0]).join('') || 'مع'}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base font-display">أ. {teacher.name}</h3>
                      <p className="text-[11px] text-emerald-800 font-bold">{teacher.jobTitle || teacher.specialty}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border my-1 ${sLabel.color}`}>
                        {sLabel.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-right text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px]">مدة الخدمة:</span>
                        <p className="font-bold text-slate-700">{serviceDuration}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px]">تاريخ المباشرة:</span>
                        <p className="font-bold text-slate-700">{teacher.hireDate}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px]">الجوال الوظيفي:</span>
                        <p className="font-bold font-mono text-slate-700">{teacher.phone}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px]">المشرف المباشر:</span>
                        <p className="font-bold text-slate-700">{teacher.supervisorName || 'الشيخ إبراهيم المنصور'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 text-right space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">المؤهل الأكاديمي:</label>
                        <select
                          value={teacher.qualification}
                          onChange={(e) => handleUpdateQualification(teacher.id, e.target.value as any)}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="بكالوريوس شريعة">بكالوريوس شريعة</option>
                          <option value="بكالوريوس علوم حاسب / تقنية">بكالوريوس تقنية / IT</option>
                          <option value="دبلوم قراءات قرآنية">دبلوم قراءات قرآنية</option>
                          <option value="إجازة قرآنية بسند متصل">إجازة قرآنية بسند متصل</option>
                          <option value="ماجستير أصول دين">ماجستير أصول دين</option>
                          <option value="دكتوراه فقه مقارن">دكتوراه فقه مقارن</option>
                          <option value="ثانوي + خبرة ميدانية">ثانوي + خبرة ميدانية</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">تحديث الحالة الوظيفية:</label>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <button 
                            onClick={() => handleUpdateStatus(teacher.id, 'active')}
                            className={`text-[9px] font-bold p-1 px-2.5 rounded border ${teacher.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                          >
                            رأس العمل
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(teacher.id, 'on_leave')}
                            className={`text-[9px] font-bold p-1 px-2.5 rounded border ${teacher.status === 'on_leave' ? 'bg-amber-50 text-amber-800 border-amber-250' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                          >
                            مكلَّف بإجازة
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(teacher.id, 'suspended')}
                            className={`text-[9px] font-bold p-1 px-2.5 rounded border ${teacher.status === 'suspended' ? 'bg-rose-50 text-rose-800 border-rose-250' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                          >
                            توقيف
                          </button>
                        </div>
                      </div>
                    </div>

                    {showSalary && teacher.salary && (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-right">
                        <span className="text-[10px] text-slate-450 font-bold block">الراتب الأساسي الأكاديمي:</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-display font-black text-sm text-slate-800">{teacher.salary} ريال سعودي</span>
                          <span className="text-[9px] bg-sky-50 text-sky-800 p-0.5 px-2 rounded-sm font-bold">بوليصة التأسيس</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 space-y-2">
                      <button
                        onClick={() => handlePrintTeacherPortfolio(teacher)}
                        className="w-full bg-slate-850 hover:bg-slate-900 border border-slate-700 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <Printer className="h-4 w-4" />
                        <span>تصدير وطباعة التقرير المهني المعمد</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Adjuster Module */}
                  {(currentUserRole === 'director' || currentUserRole === 'supervisor') && (
                    <div className="bg-white rounded-2xl border border-slate-150 p-4.5 space-y-3 shadow-3xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                          <span>تعديل مؤشرات القياس (KPIs)</span>
                        </div>
                        <button
                          onClick={() => setShowWeightSettingsModal(true)}
                          className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                        >
                          أوزان التقييم المرنة ⚙️
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-450">تغير التعديلات تلقائياً وزن النضج الكلي والترتيب التنافسي.</p>

                      <div className="space-y-2.5 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>نسبة الحضور الميداني:</span>
                            <span className="font-mono text-emerald-850">{teacher.attendanceRate}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="50" max="100" 
                            value={teacher.attendanceRate}
                            onChange={(e) => handleUpdateRatingAndKPI(teacher.id, 'attendanceRate', Number(e.target.value))}
                            className="w-full accent-emerald-705"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>الالتزام بالخطة التعليمية:</span>
                            <span className="font-mono text-indigo-850">{teacher.planComplianceRate}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="50" max="100" 
                            value={teacher.planComplianceRate}
                            onChange={(e) => handleUpdateRatingAndKPI(teacher.id, 'planComplianceRate', Number(e.target.value))}
                            className="w-full accent-indigo-705"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>متوسط علامات الطلاب:</span>
                            <span className="font-mono text-sky-850">{teacher.averageStudentExamScore}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="50" max="100" 
                            value={teacher.averageStudentExamScore}
                            onChange={(e) => handleUpdateRatingAndKPI(teacher.id, 'averageStudentExamScore', Number(e.target.value))}
                            className="w-full accent-sky-705"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>تقييم الموجه الميداني:</span>
                            <span className="font-mono text-amber-850">{teacher.rating} / 5</span>
                          </div>
                          <select
                            value={teacher.rating.toString()}
                            onChange={(e) => handleUpdateRatingAndKPI(teacher.id, 'rating', Number(e.target.value))}
                            className="w-full border border-slate-200 bg-white rounded-lg p-1.5 font-bold"
                          >
                            <option value="5.0">5.0 (ممتاز استثنائي)</option>
                            <option value="4.8">4.8 (ممتاز ممتد)</option>
                            <option value="4.5">4.5 (ممتاز)</option>
                            <option value="4.2">4.2 (جيد جداً عالٍ)</option>
                            <option value="3.8">3.8 (جيد جداً)</option>
                            <option value="3.0">3.0 (يحتاج تحسين فوري)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* LEFT MAIN DETAILS COLUMN - 8 COLS */}
                <div className="lg:col-span-8 space-y-5">
                  
                  {/* SUB-TAB 1: EXECUTIVE SUMMARY */}
                  {profileActiveTab === 'summary' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Overall Comprehensive Score Hero Card */}
                      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                          <div className="space-y-1.5">
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-bold inline-block">
                              الدرجة الموزونة الشاملة لتقييم الأداء
                            </span>
                            <h3 className="text-xl font-bold font-display">درجة التقييم التراكمي الموزون</h3>
                            <p className="text-emerald-200 text-xs">
                              محسوبة تلقائياً بناءً على محاور التقييم المعتمدة برتبة المرتبة #{teacher.rank}
                            </p>
                          </div>

                          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 min-w-[130px]">
                            <span className="text-3xl sm:text-4xl font-black font-display text-amber-300">{compScore}</span>
                            <span className="text-xs text-white/80 block font-bold">من 100</span>
                          </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-white/15 text-center text-[10px]">
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">الأداء التعليمي</span>
                            <span className="font-bold text-white">{teacher.educationalPerformance?.avgExams || teacher.averageStudentExamScore}%</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">الانضباط</span>
                            <span className="font-bold text-white">{teacher.disciplineAndCompliance?.meetingAttendanceRate || teacher.attendanceRate}%</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">تقدم الطلاب</span>
                            <span className="font-bold text-white">{teacher.educationalPerformance?.studentProgressRate || teacher.studentProgressRate}%</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">الالتزام بالتقارير</span>
                            <span className="font-bold text-white">{teacher.disciplineAndCompliance?.reportsComplianceRate || teacher.planComplianceRate}%</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">الأنشطة</span>
                            <span className="font-bold text-white">95%</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg">
                            <span className="text-white/70 block">تقييم المشرف</span>
                            <span className="font-bold text-white">{(teacher.rating / 5 * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary Card */}
                      {teacher.executiveSummary && (
                        <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                            <span>بطاقة الملخص التنفيذي وقرار الأثر الميداني</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="bg-emerald-50/70 border border-emerald-150 p-4 rounded-xl space-y-2">
                              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span>أبرز نقاط القوة والتميز:</span>
                              </h4>
                              <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-medium">
                                {teacher.executiveSummary.strengths.map((str, idx) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Needs Follow-Up */}
                            <div className="bg-amber-50/70 border border-amber-150 p-4 rounded-xl space-y-2">
                              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <span>مجالات تحتاج متابعة وتحسين:</span>
                              </h4>
                              <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-medium">
                                {teacher.executiveSummary.needsFollowUp.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Latest Achievement */}
                            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold block">أحدث إنجاز موثق:</span>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>{teacher.executiveSummary.latestAchievement}</span>
                              </p>
                            </div>

                            {/* Suggested Action */}
                            <div className="bg-indigo-50/70 border border-indigo-150 p-3.5 rounded-xl space-y-1">
                              <span className="text-[10px] text-indigo-500 font-bold block">الإجراء الإداري / التربوي المقترح:</span>
                              <p className="text-xs font-bold text-indigo-950">
                                {teacher.executiveSummary.suggestedAction}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comparative Index */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
                            <Star className="h-5 w-5 text-emerald-600" />
                            <span>المقارنات المعيارية والموقع التنافسي</span>
                          </h3>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 text-[10px] px-3 py-1 rounded-md font-bold">
                            الرتبة #{teacher.rank} | {teacher.totalPoints} نقطة
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                            <span className="text-slate-400 text-[10px] font-bold block">مقارنة الحضور مع متوسط النظام:</span>
                            <div className="flex items-end gap-1">
                              <span className="font-display font-black text-lg text-emerald-850">+{Math.round(teacher.attendanceRate - avgAttendance)}%</span>
                              <span className="text-[10px] text-slate-450">أعلى من المتوسط</span>
                            </div>
                            <p className="text-[9px] text-slate-400">متوسط الحضور العام: {avgAttendance}%</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                            <span className="text-slate-400 text-[10px] font-bold block">مؤشر جودة التدريس:</span>
                            <div className="flex items-center gap-2">
                              {getPerformanceBadge(teacher.rating)}
                            </div>
                            <p className="text-[9px] text-slate-400">تقييم الموجه الميداني: {teacher.rating} من 5</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                            <span className="text-slate-400 text-[10px] font-bold block">مسار تطور الأداء:</span>
                            <div className="flex items-center gap-1.5">
                              {teacher.rankTrend === 'up' && (
                                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>تحسن مستمر صاعد</span>
                                </span>
                              )}
                              {teacher.rankTrend === 'stable' && (
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                  استقرار متوازن
                                </span>
                              )}
                              {teacher.rankTrend === 'down' && (
                                <span className="bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                  تراجع يحتاج معالجة
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400">تحديث تلقائي بناءً على نتائج الاختبارات</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 2: EDUCATIONAL PERFORMANCE & CIRCLES */}
                  {profileActiveTab === 'educational' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Real Data Metrics */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                          <BookOpen className="h-5 w-5 text-indigo-600" />
                          <span>الأداء التعليمي والمخرجات (مستخرجة من درجات طلاب النظام)</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">متوسط اختبارات الطلاب</span>
                            <span className="text-xl font-black font-display text-emerald-800">{teacher.educationalPerformance?.avgExams || teacher.averageStudentExamScore}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">معدل حفظ القرآن الكريم</span>
                            <span className="text-xl font-black font-display text-indigo-800">{teacher.educationalPerformance?.avgMemorization || 92}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">معدل الضبط والمراجعة</span>
                            <span className="text-xl font-black font-display text-sky-800">{teacher.educationalPerformance?.avgRevision || 90}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">معدل إتقان أحكام التجويد</span>
                            <span className="text-xl font-black font-display text-amber-800">{teacher.educationalPerformance?.avgMastery || 95}%</span>
                          </div>
                        </div>

                        {/* Student Distributions */}
                        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                          <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl">
                            <span className="text-emerald-800 text-[10px] font-bold block">الطلاب المتميزون (Top)</span>
                            <span className="text-lg font-bold text-emerald-900">{teacher.educationalPerformance?.topStudentsCount || 15} طالب</span>
                          </div>
                          <div className="bg-amber-50 border border-amber-150 p-3 rounded-xl">
                            <span className="text-amber-800 text-[10px] font-bold block">الطلاب المتعثرون</span>
                            <span className="text-lg font-bold text-amber-900">{teacher.educationalPerformance?.strugglingStudentsCount || 1} طالب</span>
                          </div>
                          <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl">
                            <span className="text-slate-600 text-[10px] font-bold block">المنقطعون</span>
                            <span className="text-lg font-bold text-slate-800">{teacher.educationalPerformance?.stoppedStudentsCount || 0} طالب</span>
                          </div>
                        </div>
                      </div>

                      {/* Urgent Follow-Up Students */}
                      {teacher.educationalPerformance?.urgentFollowUpStudents && teacher.educationalPerformance.urgentFollowUpStudents.length > 0 && (
                        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
                            <h3 className="font-bold text-rose-900 text-sm font-display flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-rose-600 animate-pulse" />
                              <span>الطلاب المتعثرون ذوو المتابعة العاجلة بالحلقة</span>
                            </h3>
                            <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {teacher.educationalPerformance.urgentFollowUpStudents.length} حالات معلقة
                            </span>
                          </div>

                          <div className="space-y-3">
                            {teacher.educationalPerformance.urgentFollowUpStudents.map((st) => (
                              <div key={st.id} className="bg-white border border-rose-150 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-800">{st.name}</span>
                                    <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold">{st.circleName}</span>
                                  </div>
                                  <p className="text-xs text-rose-700 font-medium">سبب التعثر: {st.issue}</p>
                                  <p className="text-[11px] text-slate-500">الإجراء المطلوب: {st.requiredAction}</p>
                                </div>

                                <button
                                  onClick={() => triggerToast(`✓ تم تسجيل معالجة التعثر وتكثيف جلسات التسميع للطالب ${st.name}.`)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer shrink-0 transition-all"
                                >
                                  تمت المتابعة وتحديث الورد
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Circles View */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Users className="h-5 w-5 text-indigo-600" />
                          <span>تفاصيل الحلقات والشعب المسندة المعززة</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(teacher.circlesDetailedEnhanced || teacher.circlesDetailed).map((circle: any, idx) => (
                            <div key={idx} className="bg-slate-50/80 border border-slate-150 hover:border-emerald-300 p-4 rounded-xl space-y-3 transition-all">
                              <div className="flex items-center justify-between">
                                <span className="bg-indigo-50 text-indigo-800 border border-indigo-150 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  {circle.level}
                                </span>
                                <span className="text-emerald-700 font-bold text-xs font-mono">
                                  {circle.examsRate || circle.performanceIdx}% نسبة النجاح
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{circle.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">عدد الطلاب بالحلقة: {circle.studentCount} طلاب</p>
                              </div>

                              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                                <div className="bg-white p-1.5 rounded border">
                                  <span className="text-slate-400 block">الحضور</span>
                                  <span className="font-bold text-slate-800">{circle.attendanceRate || 95}%</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border">
                                  <span className="text-slate-400 block">الحفظ</span>
                                  <span className="font-bold text-slate-800">{circle.memorizationRate || 90}%</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border">
                                  <span className="text-slate-400 block">الإتقان</span>
                                  <span className="font-bold text-slate-800">{circle.masteryRate || 94}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 3: DISCIPLINE, COMPLIANCE, TASKS & ACTIVITIES */}
                  {profileActiveTab === 'discipline' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Discipline Grid */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Clock className="h-5 w-5 text-sky-600" />
                          <span>مؤشرات الانضباط والالتزام الإداري (Discipline & Compliance)</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">حضور الاجتماعات</span>
                            <span className="text-xl font-black font-display text-emerald-800">{teacher.disciplineAndCompliance?.meetingAttendanceRate || teacher.attendanceRate}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">رصد الحضور اليومي</span>
                            <span className="text-xl font-black font-display text-indigo-800">{teacher.disciplineAndCompliance?.attendanceLoggingRate || 98}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">رصد الدرجات أسبوعياً</span>
                            <span className="text-xl font-black font-display text-sky-800">{teacher.disciplineAndCompliance?.gradesLoggingRate || 96}%</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">رفع التقارير الميدانية</span>
                            <span className="text-xl font-black font-display text-amber-800">{teacher.disciplineAndCompliance?.reportsComplianceRate || teacher.planComplianceRate}%</span>
                          </div>
                        </div>

                        {/* Absences & Tardiness Counts */}
                        <div className="grid grid-cols-4 gap-3 pt-2 text-center text-xs">
                          <div className="bg-slate-100 p-2.5 rounded-xl border">
                            <span className="text-slate-500 text-[10px] font-bold block">مرات التأخر</span>
                            <span className="font-bold text-slate-800 text-sm">{teacher.disciplineAndCompliance?.tardinessCount || 0} مرات</span>
                          </div>
                          <div className="bg-slate-100 p-2.5 rounded-xl border">
                            <span className="text-slate-500 text-[10px] font-bold block">أيام الغياب</span>
                            <span className="font-bold text-slate-800 text-sm">{teacher.disciplineAndCompliance?.absenceCount || 0} أيام</span>
                          </div>
                          <div className="bg-slate-100 p-2.5 rounded-xl border">
                            <span className="text-slate-500 text-[10px] font-bold block">الأعذار الرسمية</span>
                            <span className="font-bold text-slate-800 text-sm">{teacher.disciplineAndCompliance?.excusesCount || 0} أعذار</span>
                          </div>
                          <div className="bg-slate-100 p-2.5 rounded-xl border">
                            <span className="text-slate-500 text-[10px] font-bold block">تطبيق الخطة</span>
                            <span className="font-bold text-slate-800 text-sm">{teacher.disciplineAndCompliance?.planComplianceRate || teacher.planComplianceRate}%</span>
                          </div>
                        </div>

                        {teacher.disciplineAndCompliance?.lastTardiness && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-center justify-between mt-2">
                            <span>آخر تأخر مسجل: {teacher.disciplineAndCompliance.lastTardiness.date} ({teacher.disciplineAndCompliance.lastTardiness.minutes} دقائق)</span>
                            <span className="text-[11px] font-bold">السبب: {teacher.disciplineAndCompliance.lastTardiness.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Parent Communication Indicators */}
                      {teacher.parentCommunication && (
                        <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                            <MessageSquare className="h-5 w-5 text-emerald-600" />
                            <span>مؤشرات التواصل مع أولياء الأمور (Parent Communication)</span>
                          </h3>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                            <div className="bg-slate-50 border p-3 rounded-xl">
                              <span className="text-[10px] text-slate-400 block font-bold">إجمالي طلبات التواصل</span>
                              <span className="font-bold text-slate-800 text-sm">{teacher.parentCommunication.totalRequests} طلب</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl">
                              <span className="text-[10px] text-emerald-700 block font-bold">الطلبات المغلقة</span>
                              <span className="font-bold text-emerald-900 text-sm">{teacher.parentCommunication.closedRequests} طلب</span>
                            </div>
                            <div className="bg-amber-50 border border-amber-150 p-3 rounded-xl">
                              <span className="text-[10px] text-amber-700 block font-bold">الطلبات المفتوحة</span>
                              <span className="font-bold text-amber-900 text-sm">{teacher.parentCommunication.openRequests} طلب</span>
                            </div>
                            <div className="bg-sky-50 border border-sky-150 p-3 rounded-xl">
                              <span className="text-[10px] text-sky-700 block font-bold">متوسط الاستجابة</span>
                              <span className="font-bold text-sky-900 text-sm">{teacher.parentCommunication.avgResponseTimeHours} ساعة</span>
                            </div>
                            <div className="bg-slate-100 border p-3 rounded-xl">
                              <span className="text-[10px] text-slate-500 block font-bold">القضايا المصعدة</span>
                              <span className="font-bold text-slate-800 text-sm">{teacher.parentCommunication.escalatedCases} حالة</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tasks & Assignments */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-indigo-600" />
                            <span>المهام والتكاليف الإدارية والتربوية</span>
                          </h3>
                          <button
                            onClick={() => setShowTaskModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>إسناد مهمة جديدة</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {teacher.tasks?.map((tsk) => (
                            <div key={tsk.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{tsk.title}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tsk.priority === 'عالية جداً' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {tsk.priority}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block">المكلف: {tsk.assigner} | الموعد النهائي: {tsk.deadline}</span>
                              </div>

                              <button
                                onClick={() => handleToggleTaskStatus(teacher.id, tsk.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${tsk.status === 'مكتملة' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                              >
                                {tsk.status === 'مكتملة' ? '✓ مكتملة' : 'قيد التنفيذ'}
                              </button>
                            </div>
                          ))}

                          {(!teacher.tasks || teacher.tasks.length === 0) && (
                            <p className="text-center text-xs text-slate-400 p-4">لا يوجد مهام حالية مسندة للمعلم.</p>
                          )}
                        </div>
                      </div>

                      {/* Activities & Initiatives */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            <span>المبادرات والأنشطة الإثرائية والمشاركات</span>
                          </h3>
                          <button
                            onClick={() => setShowActivityModal(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>تسجيل مبادرة جديدة</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacher.activities?.map((act) => (
                            <div key={act.id} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{act.title}</span>
                                <span className="bg-emerald-50 text-emerald-800 border px-2 py-0.5 rounded text-[10px] font-bold">
                                  نجاح {act.successRate}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">الدور: {act.role} | المشاركون: {act.participatingStudents} طالب</p>
                              <span className="text-[10px] text-slate-400 block">التاريخ: {act.date} | الحالة: {act.status}</span>
                            </div>
                          ))}

                          {(!teacher.activities || teacher.activities.length === 0) && (
                            <p className="text-center text-xs text-slate-400 p-4 col-span-2">لا يوجد مبادرات مسجلة حالياً.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 4: PROFESSIONAL DEVELOPMENT & BADGES */}
                  {profileActiveTab === 'development' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Professional Development */}
                      {teacher.professionalDevelopment && (
                        <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                            <span>التطوير المهني وسجل الدورات التدريبية</span>
                          </h3>

                          {/* Completed courses */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700">الدورات التدريبية المكتملة:</h4>
                            <div className="space-y-2">
                              {teacher.professionalDevelopment.completedCourses.map((crs, idx) => (
                                <div key={idx} className="bg-emerald-50/60 border border-emerald-150 p-3 rounded-xl flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{crs.title}</span>
                                    <span className="text-[10px] text-slate-500">الجهة: {crs.provider} | التاريخ: {crs.date}</span>
                                  </div>
                                  <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                    {crs.hours} ساعة تدريبية
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Evaluation dates */}
                          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                            <div className="bg-slate-50 border p-3 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 block font-bold">تاريخ آخر تقييم دوري</span>
                              <span className="font-bold text-slate-800">{teacher.professionalDevelopment.lastEvaluationDate}</span>
                            </div>
                            <div className="bg-slate-50 border p-3 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 block font-bold">موعد التقييم القادم</span>
                              <span className="font-bold text-indigo-700">{teacher.professionalDevelopment.nextEvaluationDate}</span>
                            </div>
                          </div>

                          {/* Supervisor recommendations */}
                          <div className="bg-indigo-50/70 border border-indigo-150 p-4 rounded-xl space-y-1 text-xs">
                            <span className="font-bold text-indigo-900 block">توصيات المشرف التربوي لتطوير المعلم:</span>
                            <p className="text-slate-700 leading-relaxed font-medium">
                              {teacher.professionalDevelopment.supervisorRecommendations}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badges & Honors */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Award className="h-5 w-5 text-amber-500" />
                          <span>سجل الأوسمة والدروع والتكريمات المعتمدة</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacher.badges?.map((bdg) => (
                            <div key={bdg.id} className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs">
                              <div className="p-2.5 bg-amber-400/20 text-amber-700 rounded-xl shrink-0">
                                <Award className="h-6 w-6" />
                              </div>
                              <div className="space-y-1 text-right">
                                <span className="font-bold text-slate-800 text-sm block">{bdg.title}</span>
                                <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-bold inline-block">{bdg.category}</span>
                                <p className="text-slate-600 text-[11px] leading-relaxed">{bdg.description}</p>
                                <span className="text-[10px] text-slate-400 block">تاريخ التكريم: {bdg.dateAwarded}</span>
                              </div>
                            </div>
                          ))}

                          {(!teacher.badges || teacher.badges.length === 0) && (
                            <p className="text-center text-xs text-slate-400 p-4 col-span-2">لا يوجد أوسمة مسجلة حالياً للمعلم.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 5: NOTES & HISTORY */}
                  {profileActiveTab === 'notes' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Structured Notes */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-sky-600" />
                            <span>سجل الملاحظات الميدانية والتقارير المهيكلة</span>
                          </h3>
                          <button
                            onClick={() => setShowStructuredNoteModal(true)}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>إضافة ملاحظة إدارية</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(teacher.structuredNotes || teacher.notes).map((sn: any) => (
                            <div key={sn.id} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${sn.type === 'إيجابية / تميز' || sn.type === 'positive' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                                    {sn.type}
                                  </span>
                                  <span className="font-bold text-slate-700">{sn.author}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{sn.date}</span>
                              </div>
                              <p className="text-slate-800 leading-relaxed font-medium">{sn.details || sn.text}</p>
                              {sn.requiredAction && (
                                <p className="text-[11px] text-indigo-800 font-bold">الإجراء الموصى به: {sn.requiredAction}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Events Timeline */}
                      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Calendar className="h-5 w-5 text-amber-600" />
                          <span>سجل القرارات والأحداث الوظيفية التاريخية (Admin Events History)</span>
                        </h3>

                        <div className="relative border-r-2 border-slate-200 pr-5 space-y-4 mr-2">
                          {(teacher.adminEvents || teacher.jobHistory).map((evt: any) => (
                            <div key={evt.id} className="relative z-10 space-y-1 text-right">
                              <div className="absolute top-1.5 -right-[27px] w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full" />
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{evt.event || evt.title}</span>
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-mono p-0.5 px-2 rounded-sm">{evt.date}</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{evt.details}</p>
                              <span className="text-[10px] text-slate-400 font-medium block">بقرار من: {evt.operator}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* RENDER VIEW 3: COMPLEX PERFORMANCES COMPARATIVE BOARD (التقييمات والمقارنات - SECTION 3) */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6 animate-fade-in" id="teachers-comparison-module">
          
          {/* Comparative Select Panel */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base font-display">منصة المقارنة الأكاديمية والتمثيل المعياري</h3>
            </div>
            <p className="text-slate-450 text-xs">اختر معلمين من قاعدة بيانات صرح الملتقى لإجراء تمثيل بياني بيولوجي مقارن لحجم الانضباط والالتزام بجدول الخطط المقررة.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-650">المعلم الأول (المرجع الرئيسي):</label>
                <select
                  value={compareTch1}
                  onChange={(e) => setCompareTch1(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl p-2.5 font-bold text-xs"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>أ. {t.name} (المرتبة {t.rank})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-650">المعلم الثاني (المرجع الرديف):</label>
                <select
                  value={compareTch2}
                  onChange={(e) => setCompareTch2(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl p-2.5 font-bold text-xs"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>أ. {t.name} (المرتبة {t.rank})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DYNAMIC GRAPHS COMPARISON DISPLAY (SECTION 3) */}
          {(() => {
            const t1 = teachers.find(t => t.id === compareTch1);
            const t2 = teachers.find(t => t.id === compareTch2);

            if (!t1 || !t2) return null;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="comparison-analysis-panels">
                
                {/* 1. Comparison Metrics Bar visualizer */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-5 shadow-xs">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-display flex items-center justify-between border-b border-slate-100 pb-3">
                    <span>مقارنة مؤشرات جودة الأداء الأساسية المبرقشة</span>
                    <span className="text-[10px] text-slate-400">علاقة توازنية بالمقاييس</span>
                  </h4>

                  <div className="space-y-4">
                    {/* Attendance Comparison */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">الانضباط ونسبة الحضور:</span>
                        <div className="flex gap-4 font-mono font-black">
                          <span className="text-emerald-700">{t1.name.split(' ')[1]}: {t1.attendanceRate}%</span>
                          <span className="text-indigo-650">{t2.name.split(' ')[1]}: {t2.attendanceRate}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex flex-col gap-0.5 p-0.5">
                        <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${t1.attendanceRate}%` }} />
                        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${t2.attendanceRate}%` }} />
                      </div>
                    </div>

                    {/* Plan Compliance Comparison */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">الالتزام بالمنهج والخطط:</span>
                        <div className="flex gap-4 font-mono font-black">
                          <span className="text-emerald-700">{t1.name.split(' ')[1]}: {t1.planComplianceRate}%</span>
                          <span className="text-indigo-650">{t2.name.split(' ')[1]}: {t2.planComplianceRate}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex flex-col gap-0.5 p-0.5">
                        <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${t1.planComplianceRate}%` }} />
                        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${t2.planComplianceRate}%` }} />
                      </div>
                    </div>

                    {/* Students Grades Comparison */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">أثر المدرس (متوسط درجات الطلاب):</span>
                        <div className="flex gap-4 font-mono font-black">
                          <span className="text-emerald-700">{t1.name.split(' ')[1]}: {t1.averageStudentExamScore}%</span>
                          <span className="text-indigo-650">{t2.name.split(' ')[1]}: {t2.averageStudentExamScore}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex flex-col gap-0.5 p-0.5">
                        <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${t1.averageStudentExamScore}%` }} />
                        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${t2.averageStudentExamScore}%` }} />
                      </div>
                    </div>

                    {/* Overall Rating Comparison */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">تقييم الموجهين العام (نجمة/نجمة):</span>
                        <div className="flex gap-4 font-mono font-black">
                          <span className="text-emerald-700">{t1.name.split(' ')[1]}: {t1.rating} ★</span>
                          <span className="text-indigo-650">{t2.name.split(' ')[1]}: {t2.rating} ★</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex flex-col gap-0.5 p-0.5">
                        <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${t1.rating * 20}%` }} />
                        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${t2.rating * 20}%` }} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Side-By-Side Qualitative analysis */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-display border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>التحليل المعياري الكيفي والفوارق البنيوية</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-805 px-2 py-0.5 rounded font-mono">تقرير آلي</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    
                    {/* Teacher 1 description */}
                    <div className="bg-emerald-50/40 p-4 border border-emerald-150 rounded-xl space-y-2">
                      <span className="font-bold text-emerald-950 font-display">أ. {t1.name.split(' ').slice(1,3).join(' ')}</span>
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        مؤشره التراكمي يبلغ <strong>{t1.totalPoints} نقطة</strong> وهو يحتل الموقع <strong>#{t1.rank}</strong>. 
                        أقوى أثر في ملفه هو <u>انخفاض معدل تسرب الطلاب</u> حيث تبلغ متوسطات طلاب الحلقات {t1.averageStudentExamScore}%.
                      </p>
                      <div className="pt-2 text-[10px] text-slate-450 font-medium">المؤهل: {t1.qualification}</div>
                    </div>

                    {/* Teacher 2 description */}
                    <div className="bg-indigo-50/40 p-4 border border-indigo-150 rounded-xl space-y-2">
                      <span className="font-bold text-indigo-950 font-display">أ. {t2.name.split(' ').slice(1,3).join(' ')}</span>
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        مؤشره الحالي يبلغ <strong>{t2.totalPoints} نقطة</strong> وبترتيب <strong>#{t2.rank}</strong>. 
                        يسجل التزاماً بالخطة قدره {t2.planComplianceRate}% وهو من الوجوه النشطة في تداول تقارير المتابعة وإسناد الجوانب التجويدية.
                      </p>
                      <div className="pt-2 text-[10px] text-slate-450 font-medium">المؤهل: {t2.qualification}</div>
                    </div>

                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] leading-relaxed text-slate-505 font-medium">
                    🔍 <strong>التوصية الإدارية التلقائية:</strong> 
                    {t1.totalPoints > t2.totalPoints ? (
                      <span> نوصي بتكليف أ. {t1.name.split(' ')[1]} ريادة التثبيت المركزي الموحد ونفل الكفايات للأستاذ {t2.name.split(' ')[1]} للاستقرار البيئي.</span>
                    ) : (
                      <span> نوصي بالاستفادة من تميز أ. {t2.name.split(' ')[1]} في موازنة الخطط لترقية أجهزة حلقة المعلم {t1.name.split(' ')[1]}.</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* RENDER VIEW 4: GENERAL RANK VIEW / LEADERBOARD (لوحة الترتيب والتفاضل - SECTION 5) */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 animate-fade-in" id="teachers-leaderboard-workbench">
          
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="space-y-1 text-right">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base font-display flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-300" />
                  <span>لوحة الشرف وتصنيف الركب للمعلمين الكرام</span>
                </h3>
                <p className="text-slate-450 text-xs">ترتيب تنازلي دقيق محسوب خوارزمياً وفقاً لمجموع نقاط الأداء والمخرجات الميدانية للحفظة.</p>
              </div>

              {/* Filtering within Leaderboard */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400">تصفية سريعة باللوحة:</span>
                <button
                  onClick={() => {
                    const sorted = [...teachers].sort((a,b) => b.totalPoints - a.totalPoints);
                    setTeachers(sorted);
                    triggerToast('✓ تم فرز الترتيب: أفضل المدرسين أداءً ونقاطاً.');
                  }}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-150 hover:bg-emerald-100 p-1.5 px-3 rounded-lg"
                >
                  أفضل المعلمين نقاطاً
                </button>
                <button
                  onClick={() => {
                    const sorted = [...teachers].sort((a,b) => a.totalPoints - b.totalPoints);
                    setTeachers(sorted);
                    triggerToast('✓ تم فرز الترتيب السلبي: الكوادر الأقل تقييماً للرصد.');
                  }}
                  className="bg-rose-50 text-rose-800 border border-rose-150 hover:bg-rose-150/10 p-1.5 px-3 rounded-lg"
                >
                  الكوادر الأقل أداءً
                </button>
              </div>
            </div>

            {/* Visual Leaderboard cards representing ranks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3" id="podium-section">
              
              {/* RANK 2 */}
              {teachers.find(t => t.rank === 2) && (
                (() => {
                  const t2 = teachers.find(t => t.rank === 2)!;
                  return (
                    <div className="bg-white border-2 border-slate-205 rounded-2xl p-6.5 text-center space-y-3 shadow-3xs relative overflow-hidden flex flex-col justify-between pt-10">
                      <div className="absolute top-0 right-0 left-0 h-2 bg-slate-300" />
                      <div className="w-12 h-12 bg-slate-105 border border-slate-300 text-slate-700 font-bold rounded-full flex items-center justify-center text-sm shadow-xs mx-auto">
                        #2
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold font-mono">المرتبة الثانية</span>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-display truncate">أ. {t2.name.split(' ').slice(1,3).join(' ')}</h4>
                        <p className="text-[10px] text-slate-450 font-bold font-mono">{t2.totalPoints} نقطة معتمدة</p>
                      </div>
                      <div className="border-t border-slate-100 pt-3 text-right grid grid-cols-3 gap-1 text-[10px]">
                        <div className="text-center">
                          <span className="text-slate-400 block text-[8px]">حضور</span>
                          <span className="font-bold font-mono text-slate-650">{t2.attendanceRate}%</span>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <span className="text-slate-400 block text-[8px]">المنهج</span>
                          <span className="font-bold font-mono text-slate-655">{t2.planComplianceRate}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block text-[8px]">الطلاب</span>
                          <span className="font-bold font-mono text-slate-650">{t2.averageStudentExamScore}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* RANK 1 - MAIN GOLD PODIUM UNIT */}
              {teachers.find(t => t.rank === 1) && (
                (() => {
                  const t1 = teachers.find(t => t.rank === 1)!;
                  return (
                    <div className="bg-white border-2 border-amber-400 rounded-3xl p-7 text-center space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between pt-12 transform scale-102">
                      <div className="absolute top-0 right-0 left-0 h-3.5 bg-amber-400" />
                      <div className="w-16 h-16 bg-amber-50 border border-amber-250 text-amber-900 font-black rounded-full flex items-center justify-center text-lg shadow-sm mx-auto">
                        🏆 #1
                      </div>
                      <div className="space-y-1 pb-1">
                        <span className="text-[10px] bg-amber-500 text-amber-950 px-3 py-1 rounded-full font-black font-display tracking-tight">صدارة قائمة المدرسين</span>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base font-display pt-2">أ. {t1.name.split(' ').slice(1,4).join(' ')}</h4>
                        <p className="text-xs text-amber-805 font-bold font-mono">{t1.totalPoints} نقطة ماسية</p>
                      </div>
                      <div className="border-t border-amber-100 pt-4 text-right grid grid-cols-3 gap-1 text-[11px]">
                        <div className="text-center">
                          <span className="text-slate-400 block text-[9px]">حضور</span>
                          <span className="font-black font-mono text-emerald-800">{t1.attendanceRate}%</span>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <span className="text-slate-400 block text-[9px]">المنهج</span>
                          <span className="font-black font-mono text-indigo-800">{t1.planComplianceRate}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block text-[9px]">الطلاب</span>
                          <span className="font-black font-mono text-amber-800">{t1.averageStudentExamScore}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* RANK 3 */}
              {teachers.find(t => t.rank === 3) && (
                (() => {
                  const t3 = teachers.find(t => t.rank === 3)!;
                  return (
                    <div className="bg-white border-2 border-amber-600/35 rounded-2xl p-6.5 text-center space-y-3 shadow-3xs relative overflow-hidden flex flex-col justify-between pt-10">
                      <div className="absolute top-0 right-0 left-0 h-2 bg-amber-600" />
                      <div className="w-12 h-12 bg-amber-50 text-amber-805 font-bold rounded-full flex items-center justify-center text-sm shadow-xs mx-auto">
                        #3
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-bold font-mono">المرتبة الثالثة</span>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-display truncate">أ. {t3.name.split(' ').slice(1,3).join(' ')}</h4>
                        <p className="text-[10px] text-slate-450 font-bold font-mono">{t3.totalPoints} نقطة معتمدة</p>
                      </div>
                      <div className="border-t border-slate-100 pt-3 text-right grid grid-cols-3 gap-1 text-[10px]">
                        <div className="text-center">
                          <span className="text-slate-400 block text-[8px]">حضور</span>
                          <span className="font-bold font-mono text-slate-650">{t3.attendanceRate}%</span>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <span className="text-slate-400 block text-[8px]">المنهج</span>
                          <span className="font-bold font-mono text-slate-655">{t3.planComplianceRate}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block text-[8px]">الطلاب</span>
                          <span className="font-bold font-mono text-slate-650">{t3.averageStudentExamScore}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

            </div>

            {/* Full leaderboard listing in simple clean row style */}
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden mt-6">
              <div className="p-4 bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-450">
                قائمة تصنيف المدرسين الكاملة بالدرجات ونسب التأخر
              </div>
              <div className="divide-y divide-slate-150">
                {teachers.map((teacher, index) => (
                  <div key={teacher.id} className="p-4 flex items-center justify-between text-xs sm:text-sm font-medium hover:bg-slate-50/70 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-400 text-sm">#{index + 1}</span>
                      <div className="space-y-0.5 text-right">
                        <span className="font-bold text-slate-850 block">أ. {teacher.name}</span>
                        <span className="text-[10px] text-slate-450">{teacher.specialty} | {teacher.qualification}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="text-slate-400 text-[10px] block font-bold leading-none">مجموع النقاط</span>
                        <span className="font-mono font-black text-emerald-800 text-sm">{teacher.totalPoints}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-slate-400 text-[10px] block font-bold leading-none">معدل الانضباط</span>
                        <span className="font-mono text-slate-650">{teacher.attendanceRate}%</span>
                      </div>

                      <div className="text-center">
                        <span className="text-slate-400 text-[10px] block font-bold leading-none">تقييم الموجه</span>
                        <span className="font-mono font-bold text-amber-502">{teacher.rating} ★</span>
                      </div>

                      <button
                        onClick={() => { setSelectedTeacherId(teacher.id); setActiveTab('list'); }}
                        className="bg-slate-100 hover:bg-slate-205 text-slate-700 text-[10px] font-bold p-1 px-3.5 rounded"
                      >
                        تفاصيل السجل المهني
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
