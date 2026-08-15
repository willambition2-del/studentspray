/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, Users, Sliders, TrendingUp, Award, Calendar, AlertTriangle, 
  Settings, CheckCircle, FileText, BarChart3, Clock, Flame, ShieldAlert, Plus, 
  HelpCircle, ChevronLeft, ChevronRight, Activity, ArrowRightLeft, ThumbsUp, Play, Target, Trophy,
  Eye, Search, User, GraduationCap, Phone, ShieldCheck, Lock, Filter, Printer, ExternalLink,
  Star, Sparkles, LayoutGrid, Table, MessageSquare, Check, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces mapping the 18 sections
export interface EvaluationCriterion {
  id: string; // 'hifz' | 'attendance' | 'fidelity' | 'exams' | 'pedagogy'
  name: string;
  weight: number; // %
  measureWay: string;
  source: string;
}

export interface CircleStudent {
  id: string;
  permanentId: string;
  circleCode: string;
  orderInCircle: number;
  organizationalId: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  circle: string;
  teacher: string;
  monthlyEvaluation: number; // % score e.g. 96
  attendanceRate: number; // % attendance e.g. 98
  hifzProgress: string;
  performanceClass: 'distinguished' | 'normal' | 'delayed';
  progressCount: string;
  parentName: string;
  parentPhone: string;
  phone: string;
  notes?: string[];
}

export interface CircleActivity {
  id: string;
  title: string;
  type: 'educational' | 'competition' | 'special_revision' | 'recreational';
  participantsCount: number;
  impactScore: 'high' | 'medium' | 'low';
  date: string;
}

export interface CircleBadge {
  id: string;
  name: string; // حقة متميزة etc.
  type: 'exemplary' | 'fast_progress' | 'high_commitment' | 'best_improvement' | 'model';
  dateAwarded: string;
  note: string;
}

export interface CircleNote {
  id: string;
  author: string; // المشرف etc.
  category: 'supervisor' | 'manager' | 'educational' | 'operational';
  text: string;
  date: string;
}

export interface CircleChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  targetDate: string;
  status: 'active' | 'completed';
  createdBy: string;
  date: string;
}

export interface Halaqa {
  id: string;
  name: string;
  teacher: string;
  branch: string;
  level: 'brau_em' | 'shabab' | 'kebar';
  status: 'active' | 'paused' | 'closed' | 'under_review';
  lifecycleStage: 'init' | 'running' | 'growing' | 'stable' | 'review' | 'restructuring';
  
  // Closure & Archival Metadata (Director General Only)
  closureReason?: string;
  closedAt?: string;
  closedBy?: string;
  
  // Dynamic metrics pulled from subsystems
  studentCount: number;
  averageAge: number;
  
  // Hard metrics (for calculations in criteria engine)
  rawHifzScore: number; // 0-100
  rawAttendanceScore: number; // 0-100
  rawFidelityScore: number; // 0-100
  rawExamsScore: number; // 0-100
  rawPedagogyScore: number; // 0-100

  // Operational Sustainability Layer
  retentionRate: number; // %
  monthlyDropCount: number;
  transferRate: number; // %
  temporalStabilityScore: number; // %

  // Monthly Activities Log
  activities: CircleActivity[];

  // Badges & Collective achievements
  badges: CircleBadge[];

  // Circle Challenges & Rewards
  challenges?: CircleChallenge[];

  // Notes
  notes: CircleNote[];

  // Best student identifiers (sub-records)
  bestHifzStudent: string;
  mostCommittedStudent: string;
  mostImprovedStudent: string;
  highestAttendanceStudent: string;

  // Student lists
  allStudents: CircleStudent[];
}

interface HalaqatManagementProps {
  onNavigate?: (tabId: string) => void;
  currentUser?: any;
}

export default function HalaqatManagement({ onNavigate, currentUser }: HalaqatManagementProps = {}) {
  const isTeacher = currentUser?.type === 'teacher';
  const isAdmin = currentUser?.type === 'admin' || currentUser?.roleName === 'المدير العام';
  const isExecutiveDirector = currentUser?.type === 'branch_manager' || currentUser?.roleName === 'المدير التنفيذي';
  const isSupervisor = currentUser?.type === 'supervisor' || currentUser?.roleName?.includes('مشرف') || currentUser?.roleName?.includes('وجه');
  const isManagerOrSupervisor = isAdmin || isExecutiveDirector || isSupervisor;

  const isGeneralDirector = currentUser?.type === 'admin' || currentUser?.roleName === 'المدير العام' || currentUser?.role === 'المدير العام' || isAdmin;
  const isExecDirector = currentUser?.type === 'branch_manager' || currentUser?.roleName === 'المدير التنفيذي' || currentUser?.role === 'المدير التنفيذي' || isExecutiveDirector;
  const canInspectStudents = isGeneralDirector || isExecDirector || !currentUser;

  // General & Executive Director Student Review States
  const [showCircleStudentsModal, setShowCircleStudentsModal] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<CircleStudent | null>(null);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState<boolean>(false);

  // Primary Leadership Data Hub Window Controls (سجل طلاب الحلقة - بيانات القيادة)
  const [leadershipViewMode, setLeadershipViewMode] = useState<'grid' | 'table'>('grid');
  const [leadershipSearchTerm, setLeadershipSearchTerm] = useState<string>('');
  const [leadershipGradeFilter, setLeadershipGradeFilter] = useState<string>('all');

  // State for closing & locking circle file (Director General)
  const [statusFilter, setStatusFilter] = useState<'active_only' | 'all' | 'closed_only'>('active_only');
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [circleToClose, setCircleToClose] = useState<Halaqa | null>(null);
  const [closureReason, setClosureReason] = useState<string>('إلغاء الحلقة وإعادة توزيع الطلاب على الحلقات النشطة');

  // 1. DYNAMIC CRITERIA ENGINE STATE with weights representing 100% total (Section 3)
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
    { id: 'hifz', name: 'متوسط حفظ الطلاب اليومي والإنتاجية', weight: 30, measureWay: 'تسميع الصفحات الفعلية وبنسب المخرجات', source: 'نظام كشوف المدرسين' },
    { id: 'attendance', name: 'نسبة الحضور وسبر المواظبة', weight: 20, measureWay: 'مسح الباركود وبطاقة الحضور المباشر', source: 'بوابة الحضور والانصراف' },
    { id: 'fidelity', name: 'الالتزام والوفاء بالخطة المنهجية الحالية', weight: 20, measureWay: 'معدل تقدم الحلقات في جدولة مصلحة السنين', source: 'وحدة الخطط التزام' },
    { id: 'exams', name: 'متوسط علامات ونتائج الاختبارات التراكمية', weight: 20, measureWay: 'درجات لجان الإجازة والاختبار الفردي', source: 'مركز القياس والتقويم' },
    { id: 'pedagogy', name: 'جودة السلوك والتربية والبرامج الإضافية', weight: 10, measureWay: 'معدل الأنشطة الإضافية وحماس الحلقات', source: 'تقارير المشرف الميداني' }
  ]);

  // Initial Circles database representing complex Halaqat
  const [halaqat, setHalaqat] = useState<Halaqa[]>([
    {
      id: 'HAL-001',
      name: 'حلقة الإمام الشاطبي النموذجية',
      teacher: 'الشيخ عبد الرحمن السعيد',
      branch: 'الفرع الغربي الرئيسي',
      level: 'kebar',
      status: 'active',
      lifecycleStage: 'growing',
      studentCount: 16,
      averageAge: 16,
      rawHifzScore: 95,
      rawAttendanceScore: 98,
      rawFidelityScore: 92,
      rawExamsScore: 94,
      rawPedagogyScore: 90,
      retentionRate: 98,
      monthlyDropCount: 0,
      transferRate: 2,
      temporalStabilityScore: 96,
      activities: [
        { id: 'act-1', title: 'مسابقة الختم السريع المكثفة (جزء عم)', type: 'competition', participantsCount: 15, impactScore: 'high', date: '01/06/2026' },
        { id: 'act-2', title: 'جلسة سبر للمتشابهات في سورتي التوبة ويونس', type: 'special_revision', participantsCount: 12, impactScore: 'high', date: '15/06/2026' }
      ],
      badges: [
        { id: 'b-1', name: 'حلقة نموذجية متكاملة', type: 'model', dateAwarded: '10/05/2026', note: 'المستوى الأرقى بالحضور والانضباط الميداني' },
        { id: 'b-2', name: 'أعلى نسبة التزام تراكمية', type: 'high_commitment', dateAwarded: '08/06/2026', note: 'التزام تام بمسارات الخطة الكلية' }
      ],
      challenges: [
        {
          id: 'ch-1',
          title: 'تحدي إتقان المتشابهات والتسميع بتقدير ممتاز',
          description: 'تحدي إداري موجه من المدير إلى الشيخ عبدالرحمن السعيد وطلاب الحلقة لتسميع سورتي البقرة وآل عمران بتقدير لا يقل عن 98%.',
          reward: 'مكافأة مالية قدرها 1,000 ريال للمعلم + أوسمة تميز استحقاقية ورحلة ترفيهية ختامية للطلاب.',
          targetDate: '30/06/2026',
          status: 'active',
          createdBy: 'المدير التنفيذي (الأستاذ خالد النفيسي)',
          date: '05/06/2026'
        }
      ],
      notes: [
        { id: 'n-1', author: 'أستاذ حازم (مشرف الحلقات)', category: 'supervisor', text: 'أداء طلاب هذه الحلقة منقطع النظير، الحفظ متين والمدرس يتبع مساق المتشابهات بدقة تامة.', date: '18/06/2026' }
      ],
      bestHifzStudent: 'عبدالرحمن بن ياسر المزروعي',
      mostCommittedStudent: 'رائد بن صالح الميمان',
      mostImprovedStudent: 'فيصل السديري',
      highestAttendanceStudent: 'خالد الوهيبي',
      allStudents: [
        {
          id: 'STD-0001',
          permanentId: 'STD-0001',
          circleCode: 'C-01',
          orderInCircle: 1,
          organizationalId: 'C-01-S01',
          name: 'عبدالرحمن بن ياسر المزروعي',
          age: 16,
          grade: 'الصف الأول الثانوي',
          school: 'مدرسة الملك فهد الثانوية',
          circle: 'حلقة الإمام الشاطبي النموذجية',
          teacher: 'الشيخ عبد الرحمن السعيد',
          monthlyEvaluation: 96,
          attendanceRate: 98,
          hifzProgress: 'ملاحظة تميز (15 جزء متقن)',
          performanceClass: 'distinguished',
          progressCount: 'متقدم (+12%)',
          parentName: 'ياسر المزروعي',
          parentPhone: '0501122334',
          phone: '0551122334'
        },
        {
          id: 'STD-0002',
          permanentId: 'STD-0002',
          circleCode: 'C-01',
          orderInCircle: 2,
          organizationalId: 'C-01-S02',
          name: 'رائد بن صالح الميمان',
          age: 15,
          grade: 'الصف الثالث المتوسط',
          school: 'مدرسة النموذجية المتوسطة',
          circle: 'حلقة الإمام الشاطبي النموذجية',
          teacher: 'الشيخ عبد الرحمن السعيد',
          monthlyEvaluation: 92,
          attendanceRate: 95,
          hifzProgress: 'مستمر وفق الخطة (10 أجزاء)',
          performanceClass: 'distinguished',
          progressCount: 'الخطة (+5%)',
          parentName: 'صالح الميمان',
          parentPhone: '0502233445',
          phone: '0552233445'
        },
        {
          id: 'STD-0003',
          permanentId: 'STD-0003',
          circleCode: 'C-01',
          orderInCircle: 3,
          organizationalId: 'C-01-S03',
          name: 'فيصل السديري',
          age: 16,
          grade: 'الصف الأول الثانوي',
          school: 'مدرسة الرياض الثانوية',
          circle: 'حلقة الإمام الشاطبي النموذجية',
          teacher: 'الشيخ عبد الرحمن السعيد',
          monthlyEvaluation: 88,
          attendanceRate: 90,
          hifzProgress: 'مطابق لخطة الفصل (7 أجزاء)',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'سلمان السديري',
          parentPhone: '0503344556',
          phone: '0553344556'
        },
        {
          id: 'STD-0004',
          permanentId: 'STD-0004',
          circleCode: 'C-01',
          orderInCircle: 4,
          organizationalId: 'C-01-S04',
          name: 'خالد الوهيبي',
          age: 17,
          grade: 'الصف الثاني الثانوي',
          school: 'مدرسة الأندلس الثانوية',
          circle: 'حلقة الإمام الشاطبي النموذجية',
          teacher: 'الشيخ عبد الرحمن السعيد',
          monthlyEvaluation: 85,
          attendanceRate: 94,
          hifzProgress: 'حفظ مستمر (12 جزء)',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'عبدالله الوهيبي',
          parentPhone: '0504455667',
          phone: '0554455667'
        },
        {
          id: 'STD-0005',
          permanentId: 'STD-0005',
          circleCode: 'C-01',
          orderInCircle: 5,
          organizationalId: 'C-01-S05',
          name: 'حاتم بن ماجد السديري',
          age: 16,
          grade: 'الصف الأول الثانوي',
          school: 'مدرسة الفراء الثانوية',
          circle: 'حلقة الإمام الشاطبي النموذجية',
          teacher: 'الشيخ عبد الرحمن السعيد',
          monthlyEvaluation: 98,
          attendanceRate: 100,
          hifzProgress: 'خاتم متفوق للمصحف الشريف',
          performanceClass: 'distinguished',
          progressCount: 'خاتم متفوق',
          parentName: 'ماجد السديري',
          parentPhone: '0505566778',
          phone: '0555667788'
        }
      ]
    },
    {
      id: 'HAL-002',
      name: 'حلقة التاج والوقار الأساسية',
      teacher: 'أ. حازم عمر الحركي',
      branch: 'فرع الحمراء الشرقي',
      level: 'shabab',
      status: 'active',
      lifecycleStage: 'stable',
      studentCount: 12,
      averageAge: 14,
      rawHifzScore: 82,
      rawAttendanceScore: 88,
      rawFidelityScore: 80,
      rawExamsScore: 84,
      rawPedagogyScore: 75,
      retentionRate: 91,
      monthlyDropCount: 1,
      transferRate: 5,
      temporalStabilityScore: 85,
      activities: [
        { id: 'act-3', title: 'دورة إتقان قراءة الفاتحة والمخارج التأسيسية', type: 'educational', participantsCount: 10, impactScore: 'medium', date: '10/06/2026' }
      ],
      badges: [
        { id: 'b-3', name: 'أسرع حلقة تطوراً شهرياً', type: 'best_improvement', dateAwarded: '12/06/2026', note: 'قفزة في مؤشر المراجعة المنهجية' }
      ],
      notes: [
        { id: 'n-2', author: 'أ. خالد الميمان (المدير الإداري)', category: 'manager', text: 'زيارة تفتيشية مستقرة للحلقة، الترديد الصوتي جيد وتستحق الدعم المادي.', date: '12/06/2026' }
      ],
      bestHifzStudent: 'باسل بن عبدالكريم الوهيبي',
      mostCommittedStudent: 'سعد العازمي',
      mostImprovedStudent: 'مازن اليحيى',
      highestAttendanceStudent: 'عبد العزيز الشمراني',
      allStudents: [
        {
          id: 'STD-0006',
          permanentId: 'STD-0006',
          circleCode: 'C-02',
          orderInCircle: 1,
          organizationalId: 'C-02-S01',
          name: 'باسل بن عبدالكريم الوهيبي',
          age: 14,
          grade: 'الصف الثاني المتوسط',
          school: 'مدرسة اليرموك المتوسطة',
          circle: 'حلقة التاج والوقار الأساسية',
          teacher: 'أ. حازم عمر الحركي',
          monthlyEvaluation: 84,
          attendanceRate: 90,
          hifzProgress: 'مراجعة الجزء الخامس',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'عبدالكريم الوهيبي',
          parentPhone: '0506677889',
          phone: '0556677889'
        },
        {
          id: 'STD-0007',
          permanentId: 'STD-0007',
          circleCode: 'C-02',
          orderInCircle: 2,
          organizationalId: 'C-02-S02',
          name: 'سعد العازمي',
          age: 14,
          grade: 'الصف الثاني المتوسط',
          school: 'مدرسة اليرموك المتوسطة',
          circle: 'حلقة التاج والوقار الأساسية',
          teacher: 'أ. حازم عمر الحركي',
          monthlyEvaluation: 80,
          attendanceRate: 86,
          hifzProgress: 'تسميع سورة البقرة',
          performanceClass: 'normal',
          progressCount: 'الخطة (-2%)',
          parentName: 'فهد العازمي',
          parentPhone: '0507788990',
          phone: '0557788990'
        },
        {
          id: 'STD-0008',
          permanentId: 'STD-0008',
          circleCode: 'C-02',
          orderInCircle: 3,
          organizationalId: 'C-02-S03',
          name: 'مازن اليحيى',
          age: 13,
          grade: 'الصف الأول المتوسط',
          school: 'مدرسة الشفاء المتوسطة',
          circle: 'حلقة التاج والوقار الأساسية',
          teacher: 'أ. حازم عمر الحركي',
          monthlyEvaluation: 82,
          attendanceRate: 88,
          hifzProgress: 'حفظ الجزء الثالث',
          performanceClass: 'normal',
          progressCount: 'الخطة (+1%)',
          parentName: 'صالح اليحيى',
          parentPhone: '0508899001',
          phone: '0558899001'
        },
        {
          id: 'STD-0009',
          permanentId: 'STD-0009',
          circleCode: 'C-02',
          orderInCircle: 4,
          organizationalId: 'C-02-S04',
          name: 'عبد العزيز الشمراني',
          age: 15,
          grade: 'الصف الثالث المتوسط',
          school: 'مدرسة الشفاء المتوسطة',
          circle: 'حلقة التاج والوقار الأساسية',
          teacher: 'أ. حازم عمر الحركي',
          monthlyEvaluation: 93,
          attendanceRate: 97,
          hifzProgress: 'متقدم في الحفظ اليومي (8 أجزاء)',
          performanceClass: 'distinguished',
          progressCount: 'متقدم (+8%)',
          parentName: 'محمد الشمراني',
          parentPhone: '0509900112',
          phone: '0559900112'
        }
      ]
    },
    {
      id: 'HAL-003',
      name: 'حلقة فصول الفجر لتعليم الأشبال',
      teacher: 'أ. محمد معوض النخيلي',
      branch: 'الفرع الغربي الرئيسي',
      level: 'brau_em',
      status: 'under_review',
      lifecycleStage: 'review',
      studentCount: 8,
      averageAge: 10,
      rawHifzScore: 52,
      rawAttendanceScore: 68,
      rawFidelityScore: 60,
      rawExamsScore: 55,
      rawPedagogyScore: 65,
      retentionRate: 75,
      monthlyDropCount: 2,
      transferRate: 15,
      temporalStabilityScore: 62,
      activities: [],
      badges: [],
      notes: [
        { id: 'n-3', author: 'الشيخ الشنقيطي (المشرف العام)', category: 'educational', text: 'تراجع ملحوظ في سبر الترديد التلقائي لغياب الطلاب المتكرر. المعلم بحاجة لدورات إضافية لجذب الفئات الصغيرة.', date: '19/06/2026' }
      ],
      bestHifzStudent: 'سليمان الفهيد',
      mostCommittedStudent: 'عبد الله السديري',
      mostImprovedStudent: 'فيصل بن منصور الشمري',
      highestAttendanceStudent: 'إبراهيم المعيقلي',
      allStudents: [
        {
          id: 'STD-0010',
          permanentId: 'STD-0010',
          circleCode: 'C-03',
          orderInCircle: 1,
          organizationalId: 'C-03-S01',
          name: 'سليمان الفهيد',
          age: 10,
          grade: 'الصف الخامس الابتدائي',
          school: 'مدرسة ابن تيمية الابتدائية',
          circle: 'حلقة فصول الفجر لتعليم الأشبال',
          teacher: 'أ. محمد معوض النخيلي',
          monthlyEvaluation: 72,
          attendanceRate: 80,
          hifzProgress: 'حفظ جزء عم وتبارك',
          performanceClass: 'normal',
          progressCount: 'الخطة (-4%)',
          parentName: 'عبدالرحمن الفهيد',
          parentPhone: '0501112233',
          phone: '0551112233'
        },
        {
          id: 'STD-0011',
          permanentId: 'STD-0011',
          circleCode: 'C-03',
          orderInCircle: 2,
          organizationalId: 'C-03-S02',
          name: 'عبد الله السديري',
          age: 11,
          grade: 'الصف السادس الابتدائي',
          school: 'مدرسة ابن تيمية الابتدائية',
          circle: 'حلقة فصول الفجر لتعليم الأشبال',
          teacher: 'أ. محمد معوض النخيلي',
          monthlyEvaluation: 68,
          attendanceRate: 75,
          hifzProgress: 'مراجعة جزء قد سمع',
          performanceClass: 'normal',
          progressCount: 'الخطة (-8%)',
          parentName: 'سعود السديري',
          parentPhone: '0502223344',
          phone: '0552223344'
        },
        {
          id: 'STD-0012',
          permanentId: 'STD-0012',
          circleCode: 'C-03',
          orderInCircle: 3,
          organizationalId: 'C-03-S03',
          name: 'فيصل بن منصور الشمري',
          age: 10,
          grade: 'الصف الخامس الابتدائي',
          school: 'مدرسة الحرمين الابتدائية',
          circle: 'حلقة فصول الفجر لتعليم الأشبال',
          teacher: 'أ. محمد معوض النخيلي',
          monthlyEvaluation: 58,
          attendanceRate: 65,
          hifzProgress: 'بحاجة لدعم صفي وتثبيت',
          performanceClass: 'delayed',
          progressCount: 'متأخر في الخطة (-15%)',
          parentName: 'منصور الشمري',
          parentPhone: '0503334455',
          phone: '0553334455'
        },
        {
          id: 'STD-0013',
          permanentId: 'STD-0013',
          circleCode: 'C-03',
          orderInCircle: 4,
          organizationalId: 'C-03-S04',
          name: 'إبراهيم المعيقلي',
          age: 9,
          grade: 'الصف الرابع الابتدائي',
          school: 'مدرسة الحرمين الابتدائية',
          circle: 'حلقة فصول الفجر لتعليم الأشبال',
          teacher: 'أ. محمد معوض النخيلي',
          monthlyEvaluation: 55,
          attendanceRate: 60,
          hifzProgress: 'مراجعة الحزب الأول',
          performanceClass: 'delayed',
          progressCount: 'متأخر في الحفظ (-18%)',
          parentName: 'عادل المعيقلي',
          parentPhone: '0504445566',
          phone: '0554445566'
        }
      ]
    },
    {
      id: 'HAL-004',
      name: 'حلقة الإمام نافع المسائية (سابقة ومقفلة)',
      teacher: 'أ. خالد النفيسي',
      branch: 'فرع الشفاء الجنوبي',
      level: 'shabab',
      status: 'closed',
      lifecycleStage: 'review',
      studentCount: 0,
      averageAge: 15,
      rawHifzScore: 60,
      rawAttendanceScore: 70,
      rawFidelityScore: 65,
      rawExamsScore: 68,
      rawPedagogyScore: 60,
      retentionRate: 60,
      monthlyDropCount: 0,
      transferRate: 100,
      temporalStabilityScore: 50,
      closureReason: 'تم إلغاء الحلقة ونقل جميع طلابها لحلقة التاج والوقار لتخفيف تكاليف التشغيل',
      closedAt: '15/05/2026',
      closedBy: 'المدير العام',
      activities: [],
      badges: [],
      notes: [
        { id: 'n-close-init', author: 'المدير العام (عبدالرحمن السعيد)', category: 'manager', text: '🔒 تم قفل ملف هذه الحلقة وإلغاؤها رسمياً بناءً على توصية لجنة الترشيد وإعادة هيكلة الفروع.', date: '15/05/2026' }
      ],
      bestHifzStudent: '-',
      mostCommittedStudent: '-',
      mostImprovedStudent: '-',
      highestAttendanceStudent: '-',
      allStudents: []
    }
  ]);

  // System parameters
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>('HAL-001');
  const [showAddHalaqaModal, setShowAddHalaqaModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // New templates Forms state
  const [newHalaqaForm, setNewHalaqaForm] = useState({
    name: '', teacher: 'الشيخ عبد الرحمن السعيد', branch: 'الفرع الغربي الرئيسي',
    level: 'shabab' as Halaqa['level'], status: 'active' as Halaqa['status'],
    lifecycleStage: 'init' as Halaqa['lifecycleStage'], averageAge: 14, studentCount: 10
  });

  const [newNoteForm, setNewNoteForm] = useState({
    category: 'supervisor' as CircleNote['category'], 
    author: 'أستاذ حازم (مشرف الحلقات)',
    text: ''
  });

  const [newActivityForm, setNewActivityForm] = useState({
    title: '', type: 'educational' as CircleActivity['type'], participantsCount: 12, impactScore: 'high' as CircleActivity['impactScore']
  });

  const [newBadgeForm, setNewBadgeForm] = useState({
    name: '', type: 'exemplary' as CircleBadge['type'], note: ''
  });

  const [newChallengeForm, setNewChallengeForm] = useState({
    title: '', description: '', reward: '', targetDate: 'خلال أسبوعين'
  });

  // Dynamic weights editing inputs
  const [isEditingWeights, setIsEditingWeights] = useState(false);
  const [tempWeights, setTempWeights] = useState<Record<string, number>>({
    hifz: 30, attendance: 20, fidelity: 20, exams: 20, pedagogy: 10
  });

  // Calculate dynamic average score of each Halaqa based on current weight system (Section 3)
  const calculateScore = (h: Halaqa) => {
    let score = 0;
    criteria.forEach(c => {
      const weightFraction = c.weight / 100;
      if (c.id === 'hifz') score += h.rawHifzScore * weightFraction;
      if (c.id === 'attendance') score += h.rawAttendanceScore * weightFraction;
      if (c.id === 'fidelity') score += h.rawFidelityScore * weightFraction;
      if (c.id === 'exams') score += h.rawExamsScore * weightFraction;
      if (c.id === 'pedagogy') score += h.rawPedagogyScore * weightFraction;
    });
    return Math.round(score);
  };

  // Sum weights verify
  const weightsSum = criteria.reduce((sum, c) => sum + c.weight, 0);

  // SECTION 18: INSTITUTION AVERAGES (المرجيع العام للمؤسسة)
  const systemAverages = {
    hifz: 76,
    attendance: 84,
    fidelity: 77,
    exams: 78,
    pedagogy: 76,
    overall: 78
  };

  // SECTION 16: IMPROVEMENT DECISION ACTION SYSTEM
  const [decisionLog, setDecisionLog] = useState<Array<{ id: string; circleName: string; action: string; reason: string; date: string; status: string }>>([
    { id: 'ACT-001', circleName: 'حلقة الإمام الشاطبي النموذجية', action: 'صرف مكافأة إضافية للمعلم', reason: 'تحقيق علامة تقويم شامل أعلى من 90%', date: '10/06/2026', status: 'completed' },
    { id: 'ACT-002', circleName: 'حلقة فصول الفجر لتعليم الأشبال', action: 'عقد برنامج مراجعة طوارئ وتعديل الخطة', reason: 'انخفاض متوسط الحفظ الشهري للمرحلة تحت 60%', date: '21/06/2026', status: 'pending' }
  ]);

  // Current active click circle overview
  const activeCircle = halaqat.find(h => h.id === selectedCircleId) || halaqat[0];

  // Actions trigger: Change Weights
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = (tempWeights.hifz || 0) + (tempWeights.attendance || 0) + (tempWeights.fidelity || 0) + (tempWeights.exams || 0) + (tempWeights.pedagogy || 0);
    if (sum !== 100) {
      alert(`⚠️ لا يمكن حفظ الإعدادات حالياً! مجموع الأوزان هو ${sum}% ويجب أن يكون مساوياً لـ 100% تماماً.`);
      return;
    }

    setCriteria(prev => prev.map(c => ({
      ...c,
      weight: tempWeights[c.id] || c.weight
    })));
    setIsEditingWeights(false);
    alert('✓ تم تحديث محرك احتساب المعايير وحوسبة نتائج الحلقات المقارنة على الفور!');
  };

  const handleCreateHalaqa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalaqaForm.name.trim()) return;

    const newId = `HAL-${String(halaqat.length + 1).padStart(3, '0')}`;
    const newH: Halaqa = {
      id: newId,
      name: newHalaqaForm.name,
      teacher: newHalaqaForm.teacher,
      branch: newHalaqaForm.branch,
      level: newHalaqaForm.level,
      status: newHalaqaForm.status,
      lifecycleStage: newHalaqaForm.lifecycleStage,
      studentCount: Number(newHalaqaForm.studentCount),
      averageAge: Number(newHalaqaForm.averageAge),
      rawHifzScore: 75,
      rawAttendanceScore: 80,
      rawFidelityScore: 78,
      rawExamsScore: 74,
      rawPedagogyScore: 70,
      retentionRate: 88,
      monthlyDropCount: 0,
      transferRate: 0,
      temporalStabilityScore: 80,
      activities: [],
      badges: [],
      notes: [],
      bestHifzStudent: 'سعد فهد',
      mostCommittedStudent: 'خالد اليوسف',
      mostImprovedStudent: 'فيصل العاطر',
      highestAttendanceStudent: 'محمد الشمري',
      allStudents: [
        {
          id: 'STD-NEW-01',
          permanentId: 'STD-0014',
          circleCode: 'C-04',
          orderInCircle: 1,
          organizationalId: 'C-04-S01',
          name: 'سعد فهد',
          age: 14,
          grade: 'الصف الثاني المتوسط',
          school: 'مدرسة ابن كثير المتوسطة',
          circle: newHalaqaForm.name,
          teacher: newHalaqaForm.teacher,
          monthlyEvaluation: 88,
          attendanceRate: 92,
          hifzProgress: 'حفظ مستمر بالخطة',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'فهد العتيبي',
          parentPhone: '0501234567',
          phone: '0551234567'
        },
        {
          id: 'STD-NEW-02',
          permanentId: 'STD-0015',
          circleCode: 'C-04',
          orderInCircle: 2,
          organizationalId: 'C-04-S02',
          name: 'خالد اليوسف',
          age: 15,
          grade: 'الصف الثالث المتوسط',
          school: 'مدرسة ابن كثير المتوسطة',
          circle: newHalaqaForm.name,
          teacher: newHalaqaForm.teacher,
          monthlyEvaluation: 85,
          attendanceRate: 90,
          hifzProgress: 'مراجعة الجزء الرابع',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'يوسف الدوسري',
          parentPhone: '0502345678',
          phone: '0552345678'
        },
        {
          id: 'STD-NEW-03',
          permanentId: 'STD-0016',
          circleCode: 'C-04',
          orderInCircle: 3,
          organizationalId: 'C-04-S03',
          name: 'فيصل العاطر',
          age: 14,
          grade: 'الصف الثاني المتوسط',
          school: 'مدرسة القادسية المتوسطة',
          circle: newHalaqaForm.name,
          teacher: newHalaqaForm.teacher,
          monthlyEvaluation: 91,
          attendanceRate: 95,
          hifzProgress: 'حفظ ممتاز وسريع',
          performanceClass: 'normal',
          progressCount: 'الخطة (+3%)',
          parentName: 'عاطر القحطاني',
          parentPhone: '0503456789',
          phone: '0553456789'
        },
        {
          id: 'STD-NEW-04',
          permanentId: 'STD-0017',
          circleCode: 'C-04',
          orderInCircle: 4,
          organizationalId: 'C-04-S04',
          name: 'محمد الشمري',
          age: 15,
          grade: 'الصف الثالث المتوسط',
          school: 'مدرسة القادسية المتوسطة',
          circle: newHalaqaForm.name,
          teacher: newHalaqaForm.teacher,
          monthlyEvaluation: 86,
          attendanceRate: 90,
          hifzProgress: 'ملازمة وتسميع التلاوة',
          performanceClass: 'normal',
          progressCount: 'الخطة (0%)',
          parentName: 'سلطان الشمري',
          parentPhone: '0504567890',
          phone: '0554567890'
        }
      ]
    };

    setHalaqat([...halaqat, newH]);
    setSelectedCircleId(newId);
    setShowAddHalaqaModal(false);
    setNewHalaqaForm({
      name: '', teacher: 'الشيخ عبد الرحمن السعيد', branch: 'الفرع الغربي الرئيسي',
      level: 'shabab', status: 'active', lifecycleStage: 'init', averageAge: 14, studentCount: 10
    });
  };

  const handleAddCircleNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteForm.text.trim()) return;

    const defaultAuthor = newNoteForm.category === 'supervisor' ? 'أستاذ حازم (مشرف الحلقات)' :
      newNoteForm.category === 'manager' ? 'د. خالد (المدير العام)' :
      newNoteForm.category === 'educational' ? 'الموجه التربوي' : 'المشرف التشغيلي';

    setHalaqat(prev => prev.map(h => {
      if (h.id === selectedCircleId) {
        const newN: CircleNote = {
          id: `cn-${Date.now()}`,
          author: newNoteForm.author.trim() || defaultAuthor,
          category: newNoteForm.category,
          text: newNoteForm.text.trim(),
          date: 'اليوم'
        };
        return {
          ...h,
          notes: [newN, ...h.notes]
        };
      }
      return h;
    }));

    setShowNoteModal(false);
    setNewNoteForm({ category: 'supervisor', author: 'أستاذ حازم (مشرف الحلقات)', text: '' });
  };

  const handleAddCircleActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityForm.title) return;

    setHalaqat(prev => prev.map(h => {
      if (h.id === selectedCircleId) {
        const newAct: CircleActivity = {
          id: `act-${Date.now()}`,
          title: newActivityForm.title,
          type: newActivityForm.type,
          participantsCount: Number(newActivityForm.participantsCount),
          impactScore: newActivityForm.impactScore,
          date: 'اليوم'
        };
        return {
          ...h,
          activities: [newAct, ...h.activities]
        };
      }
      return h;
    }));

    setShowActivityModal(false);
    setNewActivityForm({ title: '', type: 'educational', participantsCount: 12, impactScore: 'high' });
  };

  const handleGrantBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeForm.name) return;

    setHalaqat(prev => prev.map(h => {
      if (h.id === selectedCircleId) {
        const newB: CircleBadge = {
          id: `b-${Date.now()}`,
          name: newBadgeForm.name,
          type: newBadgeForm.type,
          dateAwarded: 'اليوم',
          note: newBadgeForm.note || 'منح تشجيعي بقرار إداري لتسريع التميز'
        };
        return {
          ...h,
          badges: [newB, ...h.badges]
        };
      }
      return h;
    }));

    setShowBadgeModal(false);
    setNewBadgeForm({ name: '', type: 'exemplary', note: '' });
  };

  const handleAddCircleChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeForm.title.trim()) return;

    const creatorTitle = currentUser?.roleName || (isAdmin ? 'المدير العام' : isExecutiveDirector ? 'المدير التنفيذي' : 'الموجه الفني التربوي');

    setHalaqat(prev => prev.map(h => {
      if (h.id === selectedCircleId) {
        const newCh: CircleChallenge = {
          id: `ch-${Date.now()}`,
          title: newChallengeForm.title.trim(),
          description: newChallengeForm.description.trim() || 'تحدٍ تحفيزي خاص بالإدارة مخصص لمعلم الحلقة والطلاب.',
          reward: newChallengeForm.reward.trim() || 'مكافأة مالية ووسام استحقاق تقديري',
          targetDate: newChallengeForm.targetDate.trim() || 'خلال هذا الشهر',
          status: 'active',
          createdBy: creatorTitle,
          date: 'اليوم'
        };
        return {
          ...h,
          challenges: [newCh, ...(h.challenges || [])]
        };
      }
      return h;
    }));

    setShowChallengeModal(false);
    setNewChallengeForm({ title: '', description: '', reward: '', targetDate: 'خلال أسبوعين' });
    alert('✓ تم إطلاق التحدي الخاص بالحلقة والمعلم بنجاح ورصد المكافأة المحددة!');
  };

  const handleToggleChallengeStatus = (circleId: string, challengeId: string) => {
    setHalaqat(prev => prev.map(h => {
      if (h.id === circleId) {
        const updated = (h.challenges || []).map(ch => {
          if (ch.id === challengeId) {
            const nextStatus = ch.status === 'completed' ? 'active' : 'completed';
            return { ...ch, status: nextStatus as any };
          }
          return ch;
        });
        return { ...h, challenges: updated };
      }
      return h;
    }));
  };

  const handleTriggerDecision = (circleId: string, actionType: string, reason: string) => {
    const freshDec = {
      id: `ACT-${Date.now()}`,
      circleName: halaqat.find(c => c.id === circleId)?.name || 'حلقة غير معينة',
      action: actionType,
      reason: reason,
      date: 'اليوم',
      status: 'pending'
    };

    setDecisionLog([freshDec, ...decisionLog]);
    alert(`✓ تم تسجيل قرار التحسين وعقد الإجراء الإداري [${actionType}] بنجاح.`);

    // Adjust status of some circles if restructuring
    if (actionType === 'إعادة هيكلة الحلقة بالترسيم') {
      setHalaqat(prev => prev.map(h => {
        if (h.id === circleId) {
          return { ...h, status: 'paused', lifecycleStage: 'restructuring' };
        }
        return h;
      }));
    }
  };

  const handleConfirmCloseHalaqa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleToClose) return;

    const todayStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const reason = closureReason.trim() || 'إلغاء الحلقة بقرار إداري من المدير العام';

    setHalaqat(prev => prev.map(h => {
      if (h.id === circleToClose.id) {
        const closureNote: CircleNote = {
          id: `cn-close-${Date.now()}`,
          author: 'المدير العام (عبدالرحمن السعيد)',
          category: 'manager',
          text: `🔒 تم إقفال وقفل ملف هذه الحلقة رسمياً وتأرشفة بياناتها. سبب الإقفال: ${reason}`,
          date: 'اليوم'
        };
        return {
          ...h,
          status: 'closed',
          closedAt: todayStr,
          closedBy: 'المدير العام',
          closureReason: reason,
          notes: [closureNote, ...h.notes]
        };
      }
      return h;
    }));

    handleTriggerDecision(
      circleToClose.id,
      'إقفال وقفل ملف الحلقة كلياً',
      `قرار المدير العام - سبب الإلغاء: ${reason}`
    );

    setShowCloseModal(false);
    setCircleToClose(null);
    setClosureReason('إلغاء الحلقة وإعادة توزيع الطلاب على الحلقات النشطة');
  };

  const handleReopenHalaqa = (circleId: string) => {
    if (!isAdmin) return;
    if (window.confirm('هل أنت تأكد بصفتك المدير العام من إعادة فتح ملف هذه الحلقة وتنشيطها؟')) {
      setHalaqat(prev => prev.map(h => {
        if (h.id === circleId) {
          return {
            ...h,
            status: 'active',
            closureReason: undefined,
            closedAt: undefined,
            closedBy: undefined
          };
        }
        return h;
      }));
      alert('✓ تم إعادة فتح وتنشيط ملف الحلقة بنجاح.');
    }
  };

  // Filtered halaqat based on statusFilter tab and role
  const filteredHalaqat = halaqat.filter(h => {
    if (isTeacher && currentUser?.name) {
      const teacherFirstName = currentUser.name.split(' ')?.[1] || currentUser.name.split(' ')?.[0] || '';
      const matchesTeacher = h.teacher.includes(currentUser.name) || 
                             (teacherFirstName && h.teacher.includes(teacherFirstName)) ||
                             (currentUser.roleName && h.name.includes(currentUser.roleName));
      if (!matchesTeacher) return false;
    }
    if (statusFilter === 'active_only') return h.status !== 'closed';
    if (statusFilter === 'closed_only') return h.status === 'closed';
    return true;
  });

  // Section 17 dynamic calculation
  const getDynamicBanner = (score: number) => {
    if (score >= 90) return { label: 'حلقة نموذجية متفوقة 👑', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/40 text-emerald-300' };
    if (score >= 80) return { label: 'حلقة مستقرة ومرنة ✅', color: 'bg-indigo-950 text-indigo-300 border-indigo-500/30' };
    if (score >= 70) return { label: 'حلقة متوسطة الأداء 📊', color: 'bg-slate-800 text-slate-300 border-slate-600' };
    if (score >= 60) return { label: 'حلقة تحتاج تدخل عاجل ⚠️', color: 'bg-amber-600/25 border-amber-600/50 text-amber-950' };
    return { label: 'حلقة عالية المخاطر والتنظير 🚨', color: 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' };
  };

  return (
    <div className="space-y-6 container mx-auto px-4 text-right font-sans" dir="rtl" id="halaqat-management-root">
      
      {/* HEADER SECTION */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isTeacher ? 'bg-emerald-950' : 'bg-indigo-950'} text-white rounded-3xl p-6 shadow-md relative overflow-hidden`}>
        <div className="space-y-1 z-10">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 p-1 px-3 rounded-full text-[11px] font-black inline-flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            {isTeacher ? 'منظومة متابعة الحلقات للمعلم' : 'منظومة كفاءة الحلقات القرآنية (Halaqat Core Platform)'}
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display">
            {isTeacher ? 'إدارة الحلقة القرآنية ومتابعة أداء الطلاب' : 'محرك التحليل والتقويم المعياري للحلقات'}
          </h2>
          <p className="text-emerald-100/90 text-xs font-semibold leading-relaxed max-w-4xl">
            {isTeacher 
              ? 'متابعة وسبر أداء الطلاب بالحلقة، خطط الحفظ والمراجعة اليومية، إدراج الأنشطة الصفية والاطلاع على التوجيهات الإشرافية.' 
              : 'إدارة الحلقات ككيانات أداء متكاملة ومستدامة. قيم أداء الشيوخ وحافظي الأجزاء، حلل الانحرافات والتعثرات التربوية لتفادي انقطاع الطلاب، واعتمد الأوسمة والقرارات التنفيذية فوراً.'}
          </p>
        </div>

        {isAdmin && (
          <div className="shrink-0 flex items-center gap-2 z-10 w-full lg:w-auto justify-end">
            <button 
              type="button"
              onClick={() => setShowAddHalaqaModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-indigo-950 rounded-xl p-3 px-6 font-black text-xs transition-all tracking-wide flex items-center gap-1.5 cursor-pointer shadow-sm w-full lg:w-auto justify-center"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>تأسيس حلقة جديدة</span>
            </button>
          </div>
        )}

        {/* Decor */}
        <div className="absolute left-10 bottom-0 top-0 opacity-10 flex items-center pointer-events-none">
          <Flame className="h-44 w-44 text-white stroke-1" />
        </div>
      </div>

      {/* BENCHMARK COMPARATIVE GRID & WEIGHTS CONTROL */}
      {!isTeacher ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: THE CRITERIA ENGINE WEIGHTS (Section 3) - takes 4 cols */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-xs sm:text-sm text-slate-850 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-950" />
                <span>أوزان ميزان التقويم الديناميكي</span>
              </h3>
              <span className="text-[10px] bg-slate-150 p-1 rounded font-bold text-slate-500">الإجمالي: {weightsSum}%</span>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              قيمة التقييم تتأثر ديناميكياً فور تعديل الأوزان النسبية لكل معيار أدناه. مجموع المعايير يجب أن يساوي 100% تماماً.
            </p>

            {!isEditingWeights ? (
              <div className="space-y-3">
                {criteria.map(c => (
                  <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div className="space-y-0.5 max-w-[200px]">
                      <span className="font-black text-slate-800 leading-normal block">{c.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold block">{c.measureWay}</span>
                    </div>
                    <span className="font-black font-mono text-xs bg-indigo-950 text-white p-1 rounded-md">{c.weight}%</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setTempWeights(criteria.reduce((a, b) => ({ ...a, [b.id]: b.weight }), {}));
                    setIsEditingWeights(true);
                  }}
                  className="w-full text-xs font-black p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl border border-indigo-200 transition-all cursor-pointer text-center"
                >
                  تعديل الأوزان النسبية (%)
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveWeights} className="space-y-4">
                <div className="space-y-3.5">
                  {criteria.map(c => (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-650">
                        <span>{c.name}:</span>
                        <span className="font-mono text-indigo-950">{tempWeights[c.id]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={tempWeights[c.id]}
                        onChange={(e) => setTempWeights({ ...tempWeights, [c.id]: Number(e.target.value) })}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-950"
                      />
                    </div>
                  ))}
                </div>

                {/* Sum warnings */}
                <div className="text-center p-2 rounded-lg text-xs font-bold">
                  {((tempWeights.hifz || 0) + (tempWeights.attendance || 0) + (tempWeights.fidelity || 0) + (tempWeights.exams || 0) + (tempWeights.pedagogy || 0)) === 100 ? (
                    <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-1.5 block rounded">✓ مجموع الأوزان متطابق (100%)</span>
                  ) : (
                    <span className="text-rose-800 bg-rose-50 border border-rose-200 p-1.5 block rounded">⚠️ المجموع هو {((tempWeights.hifz || 0) + (tempWeights.attendance || 0) + (tempWeights.fidelity || 0) + (tempWeights.exams || 0) + (tempWeights.pedagogy || 0))}% (مطلوب 100%)</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingWeights(false)}
                    className="bg-slate-100 p-2 text-xs rounded-lg font-bold grow"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-950 text-white p-2 text-xs rounded-lg font-black grow"
                  >
                    تأكيد وحوسبة
                  </button>
                </div>
              </form>
            )}

            {/* Section 18: System benchmark comparison view */}
            <div className="border-t border-slate-150 pt-3 space-y-2">
              <span className="text-[10px] font-black text-indigo-950 block uppercase">سياق متوسط المنظومات بالأكاديمية (Benchmark):</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                <div className="bg-slate-100 p-2 rounded">متوسط الحفظ: {systemAverages.hifz}%</div>
                <div className="bg-slate-100 p-2 rounded">متوسط الحضور: {systemAverages.attendance}%</div>
                <div className="bg-slate-100 p-2 rounded">الوفاء بالخطط: {systemAverages.fidelity}%</div>
                <div className="bg-slate-100 p-2 rounded font-black text-indigo-950">المعدل العام التراكمي: {systemAverages.overall}%</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DIRECT BENCHMARK CARDS & RANKING (Section 4) - takes 8 cols */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-black text-sm text-slate-850 font-display">مقارنة الحلقات المتزامنة والترتيب الهرمي (Benchmarking System)</h3>
                <p className="text-[10px] text-slate-400">
                  ترتيب ديناميكي هرمي لعموم الحلقات القرآنية العاملة. يمكن للمدير العام إقفال الملفات الملغاة لتخفيف البيانات المعروضة.
                </p>
              </div>

              {/* Status Filter Toggle Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-stretch md:self-auto justify-center">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active_only')}
                  className={`p-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    statusFilter === 'active_only' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض الحلقات القائمة والنشطة فقط لتخفيف كشوف البيانات"
                >
                  🟢 القائمة والنشطة ({halaqat.filter(h => h.status !== 'closed').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('closed_only')}
                  className={`p-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    statusFilter === 'closed_only' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="أرشيف الحلقات التي تمت إلغاؤها وقفل ملفاتها بقرار المدير العام"
                >
                  🔒 المقفلة ({halaqat.filter(h => h.status === 'closed').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`p-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 الكل ({halaqat.length})
                </button>
              </div>
            </div>

            <div className="space-y-3 my-2">
              {filteredHalaqat.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">لا توجد حلقات تندرج تحت هذا التصنيف حالياً.</p>
                </div>
              ) : (
                filteredHalaqat
                  .map(h => ({ ...h, calculatedScore: calculateScore(h) }))
                  .sort((a, b) => b.calculatedScore - a.calculatedScore)
                  .map((h, index) => {
                    const isSelected = h.id === selectedCircleId;
                    const isClosed = h.status === 'closed';
                    const banner = getDynamicBanner(h.calculatedScore);
                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedCircleId(h.id)}
                        className={`p-4 rounded-2xl border text-right transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer relative ${
                          isClosed 
                            ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/80 opacity-85'
                            : isSelected ? 'border-indigo-950 ring-2 ring-indigo-950 bg-slate-50/50' : 'border-slate-200 bg-white hover:bg-slate-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-4.5">
                          {/* Rank Indicator */}
                          <span className={`w-8 h-8 rounded-full font-black font-mono flex items-center justify-center text-xs ${
                            isClosed ? 'bg-rose-200 text-rose-900' : index === 0 ? 'bg-amber-500 text-indigo-950 shadow-sm' : index === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isClosed ? '🔒' : `#${index + 1}`}
                          </span>
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold font-mono">الترميز: {h.id}</span>
                              {isClosed && (
                                <span className="p-0.5 px-2 bg-rose-700 text-white font-black text-[9px] rounded-md">
                                  ملغاة ومقفلة
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">{h.name}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              المعلم: {h.teacher} | {isClosed ? `السبب: ${h.closureReason || 'إلغاء إداري'}` : `الفوج الطلابي: ${h.studentCount} حافظاً`}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Section 17 dynamic bracket */}
                          {!isClosed ? (
                            <span className={`text-[9px] font-black p-1 px-3 border rounded-lg ${banner.color}`}>
                              {banner.label}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black p-1 px-3 border border-rose-300 bg-rose-100 text-rose-800 rounded-lg">
                              مؤرشفة من كشوف الأداء
                            </span>
                          )}

                          <div className="space-y-0.5 text-left md:text-left pr-4">
                            <span className="text-[9px] text-slate-400 font-bold block">مجموع التقييم:</span>
                            <span className="text-lg font-mono font-black text-indigo-950">{h.calculatedScore}%</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className={`absolute top-2 left-2 ${isClosed ? 'bg-rose-800' : 'bg-indigo-950'} text-white text-[8px] font-mono px-1.5 rounded-sm`}>
                            {isClosed ? 'المفصلة بالملاحظات' : 'الحلقة النشطة'}
                          </span>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] bg-slate-50 p-2.5 rounded-xl text-slate-500 font-semibold border border-slate-150 gap-2">
              <span>
                {statusFilter === 'active_only' 
                  ? '💡 تظهر حالياً الحلقات القائمة فقط لتخفيف كثافة البيانات المعروضة على المدير العام.' 
                  : statusFilter === 'closed_only'
                  ? '🗄️ تظهر الحلقات الملغاة والمقفلة كليا بقرار المدير العام.'
                  : '📋 يتم عرض كافة الحلقات العاملة والمغلقة بالمنظومة.'}
              </span>
              <span className="font-bold text-slate-700">عدد المعروض: {filteredHalaqat.length} حلقة</span>
            </div>
          </div>

        </div>
      ) : activeCircle ? (
        <div className="bg-white border border-emerald-200 rounded-3xl p-4.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">الحلقة المختارة للمعلم:</h3>
              <p className="text-[11px] text-emerald-800 font-bold">{activeCircle.name} — <span className="text-slate-600 font-medium">كادر: {activeCircle.teacher}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">تبديل الحلقة:</span>
            <select
              value={selectedCircleId || ''}
              onChange={(e) => setSelectedCircleId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 p-2 text-xs rounded-xl font-bold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {halaqat.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.teacher})</option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {/* CORE ACTIVE HALAQA FOCUS PROFILE & 18 IMPLEMENTED SECTIONS */}
      {activeCircle && (
        <div className="bg-white border-2 border-indigo-950 rounded-3xl p-6 shadow-xl space-y-6">
          
          {/* Title Row representing Lifecycle management */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-indigo-950 text-white font-mono text-xs font-black p-0.5 px-3 rounded-lg">ملف تفصيلي ممتد</span>
                <h3 className="text-lg md:text-xl font-black text-slate-850 font-display">{activeCircle.name}</h3>
                
                {/* Section 10: Lifecycle Phase Tag */}
                <select
                  value={activeCircle.lifecycleStage}
                  onChange={(e) => {
                    const nextSt = e.target.value as any;
                    setHalaqat(prev => prev.map(h => h.id === activeCircle.id ? { ...h, lifecycleStage: nextSt } : h));
                  }}
                  className="bg-stone-100 text-stone-900 border border-stone-250 p-1 px-2.5 rounded text-[10px] font-black focus:outline-hidden"
                  title="تغيير طور دورة حياة الحلقة المعيارية"
                >
                  <option value="init">طور: التأسيس والتجهيز</option>
                  <option value="running">طور: التشغيل وتحت السبر</option>
                  <option value="growing">طور: النمو وجذب الكفاءات</option>
                  <option value="stable">طور: الاستقرار التام بالأجزاء</option>
                  <option value="review">طور: مراجعة الجودة والتقييم والتدبر</option>
                  <option value="restructuring">طور: إعادة التهيئة والهيكلة الكلية</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                مسؤولية الكادر: <span className="font-bold text-slate-600">{activeCircle.teacher}</span> | الموقع: {activeCircle.branch} | إجمالي الطلاب: {activeCircle.studentCount}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isAdmin && activeCircle.status !== 'closed' && (
                <button
                  type="button"
                  onClick={() => {
                    setCircleToClose(activeCircle);
                    setShowCloseModal(true);
                  }}
                  className="bg-rose-700 hover:bg-rose-800 text-white p-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="إقفال وقفل ملف الحلقة لتخفيف كثافة البيانات المعروضة (خاص بالمدير العام)"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>إقفال وقفل الملف (المدير العام)</span>
                </button>
              )}
              {!isTeacher && activeCircle.status !== 'closed' && (
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="bg-indigo-950 text-white hover:bg-slate-900 p-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  + تدوين تقرير مشرف
                </button>
              )}

              {activeCircle.status !== 'closed' && (
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all border border-amber-500/30"
                  title="تحدي خاص بالحلقة والمعلم مع تخصيص مكافأة معينة عند الإتمام"
                >
                  <Target className="h-4 w-4 text-amber-200" />
                  <span>🎯 + تحدي خاص بالحلقة</span>
                </button>
              )}
              {!isTeacher && activeCircle.status !== 'closed' && (
                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-indigo-950 p-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  + منح وسام استحقاق
                </button>
              )}
            </div>
          </div>

          {/* CLOSED & LOCKED FILE WARNING BANNER FOR DIRECTOR GENERAL */}
          {activeCircle.status === 'closed' && (
            <div className="bg-rose-950 text-white border-2 border-rose-500 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-rose-500/20 text-rose-300 rounded-2xl flex items-center justify-center shrink-0 border border-rose-500/40 font-mono text-xl font-black">
                  🔒
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                      حلقة ملغاة ومقفلة الملف
                    </span>
                    <h4 className="font-black text-sm text-white font-display">تم إقفال وقفل ملف هذه الحلقة رسمياً بأرشيف البيانات</h4>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    سبب الإلغاء: <span className="font-bold text-white">{activeCircle.closureReason || 'إلغاء بقرار إداري'}</span> | تاريخ الإقفال: <span className="font-mono text-white">{activeCircle.closedAt || 'مؤخراً'}</span> | الموفق المعتمد: <span className="font-bold text-white">{activeCircle.closedBy || 'المدير العام'}</span>
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleReopenHalaqa(activeCircle.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold p-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <span>🔓 إعادة فتح وتنشيط ملف الحلقة (خاص بالمدير العام)</span>
                </button>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRIMARY FOREFRONT FLAGSHIP WINDOW: LEADERSHIP DATA (سجل طلاب الحلقة - بيانات القيادة) */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-indigo-200/90 rounded-2xl p-5 shadow-sm space-y-5 relative overflow-hidden">
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-950 via-indigo-600 to-amber-500 absolute top-0 left-0 right-0" />

            {/* Window Main Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-150">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-950 to-indigo-800 text-white rounded-xl shadow-xs shrink-0">
                  <Users className="h-6 w-6 text-indigo-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-indigo-950 font-display">
                      سجل طلاب الحلقة (بيانات القيادة)
                    </h3>
                    <span className="bg-indigo-100 text-indigo-900 border border-indigo-250 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                      إجمالي مقيدي الحلقة: {activeCircle.allStudents.length} طلاب
                    </span>
                    {canInspectStudents ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        متاح للمدير
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                        صلاحيات مقيدة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    استعراض الطلاب بالبيانات الشاملة • العمر • الصف • التقييم الشهري • فتح وتدقيق الملف الفردي
                  </p>
                </div>
              </div>

              {/* Header Action Tools */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLeadershipViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      leadershipViewMode === 'grid'
                        ? 'bg-indigo-950 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>بطاقات القيادة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadershipViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      leadershipViewMode === 'table'
                        ? 'bg-indigo-950 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="h-3.5 w-3.5" />
                    <span>الجدول المنظم</span>
                  </button>
                </div>

                {/* Primary Full Director Review Trigger */}
                {canInspectStudents && (
                  <button
                    type="button"
                    onClick={() => setShowCircleStudentsModal(true)}
                    className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 hover:from-slate-900 hover:to-indigo-950 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all border border-indigo-700/50 group"
                  >
                    <Users className="h-4 w-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                    <span>استعراض الطلاب بالبيانات الشاملة</span>
                    <div className="bg-indigo-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-200 flex items-center gap-1">
                      <span>عرض</span>
                      <Eye className="h-3 w-3" />
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الرمز الإداري، أو الصف..."
                  value={leadershipSearchTerm}
                  onChange={(e) => setLeadershipSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Filter className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                <select
                  value={leadershipGradeFilter}
                  onChange={(e) => setLeadershipGradeFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">جميع المراحل والصفوف</option>
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                </select>
                {leadershipSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadershipSearchTerm('');
                      setLeadershipGradeFilter('all');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-bold px-1"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>
            </div>

            {/* Students Showcase (Grid / Table) */}
            {(() => {
              const filteredList = activeCircle.allStudents.filter(st => {
                const term = leadershipSearchTerm.trim().toLowerCase();
                const matchTerm = !term || 
                  st.name.toLowerCase().includes(term) || 
                  (st.organizationalId && st.organizationalId.toLowerCase().includes(term)) ||
                  (st.grade && st.grade.toLowerCase().includes(term));
                
                const matchGrade = leadershipGradeFilter === 'all' || 
                  (st.grade && st.grade.includes(leadershipGradeFilter));

                return matchTerm && matchGrade;
              });

              if (leadershipViewMode === 'table') {
                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black">
                        <tr>
                          <th className="p-3 text-[11px]">الرمز الإداري</th>
                          <th className="p-3 text-[11px]">اسم الطالب</th>
                          <th className="p-3 text-[11px]">العمر</th>
                          <th className="p-3 text-[11px]">الصف الدراسي</th>
                          <th className="p-3 text-[11px]">التقييم الشهري</th>
                          <th className="p-3 text-[11px]">المعلم المسؤول</th>
                          <th className="p-3 text-[11px] text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {filteredList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 font-bold">
                              لا يوجد طلاب يطابقون معايير البحث الحالية.
                            </td>
                          </tr>
                        ) : (
                          filteredList.map((st, i) => (
                            <tr key={st.id || i} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="p-3 font-mono font-black text-indigo-950">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                                  {st.organizationalId || `C-01-S0${i+1}`}
                                </span>
                              </td>
                              <td className="p-3 font-black text-slate-900 text-sm">
                                {st.name}
                              </td>
                              <td className="p-3 font-bold text-slate-600">
                                🎂 {st.age ? `${st.age} سنة` : '15 سنة'}
                              </td>
                              <td className="p-3 font-bold text-slate-700">
                                🏫 {st.grade || 'المرحلة الثانوية'}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    (st.monthlyEvaluation || 85) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                    (st.monthlyEvaluation || 85) >= 75 ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {st.monthlyEvaluation || 85}%
                                  </span>
                                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                    <div 
                                      className={`h-full ${
                                        (st.monthlyEvaluation || 85) >= 90 ? 'bg-emerald-500' :
                                        (st.monthlyEvaluation || 85) >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${st.monthlyEvaluation || 85}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-bold text-slate-600 text-[11px]">
                                🎙️ {st.teacher || activeCircle.teacher}
                              </td>
                              <td className="p-3 text-center">
                                {canInspectStudents ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedStudentProfile(st);
                                      setShowStudentProfileModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg font-black text-xs transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>فتح الملف</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">🔒 خاص بالمدير</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // Default: Grid Cards View
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <p className="text-slate-700 font-bold text-sm">لا يوجد طلاب يطابقون معايير البحث الحالية.</p>
                      <p className="text-slate-500 text-xs">جرب تغيير كلمات البحث أو إعادة ضبط تصفية الصفوف.</p>
                    </div>
                  ) : (
                    filteredList.map((st, i) => (
                      <div 
                        key={st.id || i}
                        className="bg-slate-50/70 hover:bg-white border-2 border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4.5 transition-all shadow-3xs hover:shadow-xs space-y-3.5 group relative"
                      >
                        {/* Card Top: Code & Evaluation */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-indigo-950 text-indigo-100 font-black px-2.5 py-1 rounded-lg shadow-2xs">
                              {st.organizationalId || `C-01-S0${i+1}`}
                            </span>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="طالب مقيد ونشط" />
                          </div>

                          <div className="text-left shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs ${
                              (st.monthlyEvaluation || 85) >= 90 
                                ? 'bg-emerald-500 text-white' 
                                : (st.monthlyEvaluation || 85) >= 75 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-rose-500 text-white'
                            }`}>
                              <Sparkles className="h-3 w-3" />
                              <span>التقييم: {st.monthlyEvaluation || 85}%</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Student Identity */}
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-900 text-base group-hover:text-indigo-950 transition-colors">
                            {st.name}
                          </h4>
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold flex-wrap">
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                              🎂 {st.age ? `${st.age} سنة` : '15 سنة'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                              🏫 {st.grade || 'المرحلة الثانوية'}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar & Performance details */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span>نسبة الإتقان والمواظبة العامة</span>
                            <span className="font-mono text-slate-800 font-black">{st.monthlyEvaluation || 85}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (st.monthlyEvaluation || 85) >= 90 ? 'bg-emerald-500' :
                                (st.monthlyEvaluation || 85) >= 75 ? 'bg-indigo-600' : 'bg-rose-500'
                              }`}
                              style={{ width: `${st.monthlyEvaluation || 85}%` }}
                            />
                          </div>
                        </div>

                        {/* Teacher & File Trigger Row */}
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                          <div className="text-slate-600 truncate max-w-[160px] text-[11px]">
                            <span>🎙️ {st.teacher || activeCircle.teacher}</span>
                          </div>

                          {canInspectStudents ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentProfile(st);
                                setShowStudentProfileModal(true);
                              }}
                              className="bg-indigo-950 hover:bg-slate-900 text-white font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-indigo-300" />
                              <span>فتح الملف</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">🔒 متاح للمدير</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Sub-Section Deck: Monthly Honors & Supervisor Journal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t-2 border-slate-150">
              
              {/* Star Students of the Month (سجل المتميزين هذا الشهر) - 7 cols */}
              <div className="lg:col-span-7 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/30 border border-amber-300/90 rounded-2xl p-4.5 space-y-3.5 shadow-3xs">
                <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-500 text-white rounded-lg">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-black text-amber-950 uppercase font-display">
                      سجل المتميزين هذا الشهر (لوحة الشرف الشهرية):
                    </span>
                  </div>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                    تكريم الإدارة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/90 border border-amber-200 p-3 rounded-xl space-y-1 text-right shadow-3xs">
                    <span className="text-[10px] font-black text-amber-800 block">👑 أفضل حافظ ومنتج:</span>
                    <span className="text-xs font-black text-slate-900 block truncate" title={activeCircle.bestHifzStudent}>
                      {activeCircle.bestHifzStudent}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold block">15 جزء متقن • 96%</span>
                  </div>

                  <div className="bg-white/90 border border-amber-200 p-3 rounded-xl space-y-1 text-right shadow-3xs">
                    <span className="text-[10px] font-black text-amber-800 block">🎯 الأكثر التزاماً وتكراراً:</span>
                    <span className="text-xs font-black text-slate-900 block truncate" title={activeCircle.mostCommittedStudent}>
                      {activeCircle.mostCommittedStudent}
                    </span>
                    <span className="text-[9px] text-indigo-700 font-bold block">مواظبة 98% بالخطة</span>
                  </div>

                  <div className="bg-white/90 border border-amber-200 p-3 rounded-xl space-y-1 text-right shadow-3xs">
                    <span className="text-[10px] font-black text-amber-800 block">⚡ الأسرع تطوراً بالامتحانات:</span>
                    <span className="text-xs font-black text-slate-900 block truncate" title={activeCircle.mostImprovedStudent}>
                      {activeCircle.mostImprovedStudent}
                    </span>
                    <span className="text-[9px] text-purple-700 font-bold block">قفزة نوعية بالسبر</span>
                  </div>
                </div>
              </div>

              {/* Supervisor & Director Feedback Journal (ملاحظات وشهادات المشرفين والمدير) - 5 cols */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-3xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-900" />
                    <span className="text-xs font-black text-indigo-950">
                      ملاحظات وشهادات المشرفين والمدير (Supervisor Journal)
                    </span>
                  </div>
                  {isManagerOrSupervisor && (
                    <button
                      type="button"
                      onClick={() => setShowNoteModal(true)}
                      className="text-[10px] font-black text-indigo-700 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-250 cursor-pointer"
                    >
                      + تدوين
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[140px] overflow-y-auto">
                  {activeCircle.notes.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-center">
                      <p className="text-[11px] text-slate-400 font-bold">لا توجد ملاحظات إشرافية مدونة حالياً.</p>
                    </div>
                  ) : (
                    activeCircle.notes.map(n => (
                      <div key={n.id} className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                          <span className="font-bold text-slate-700">الكاتب: {n.author}</span>
                          <span>{n.date}</span>
                        </div>
                        <p className="text-slate-800 font-semibold text-[11px] leading-relaxed">
                          "{n.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* SECONDARY OPERATIONAL DASHBOARDS (METRICS, ACTIVITIES, CHALLENGES, BADGES) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: LEFT SUB-DASHBOARDS LOGS (MONTHLY ACTIVITIES & MORE) - 8 cols */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SECTION 2: BASIC KEY INDICATORS PROFILES METERS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-3xs">
                <span className="text-[10px] font-black text-indigo-900 block pb-1 border-b border-indigo-150 uppercase tracking-widest leading-none">
                  مؤشرات الحلقة التعليمية الجوهرية (General Key Quality Indicators):
                </span>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'نسبة الحضور التراكمية', val: activeCircle.rawAttendanceScore, color: 'bg-emerald-500' },
                    { label: 'متوسط الأداء بالحفظ', val: activeCircle.rawHifzScore, color: 'bg-indigo-500' },
                    { label: 'متوسط جودة المراجعة', val: activeCircle.rawExamsScore, color: 'bg-amber-500' },
                    { label: 'الالتزام بمجداف الخطة', val: activeCircle.rawFidelityScore, color: 'bg-purple-500' },
                    { label: 'التقدم والنمو الميداني', val: activeCircle.rawPedagogyScore, color: 'bg-rose-500' }
                  ].map((ind, i) => (
                    <div key={i} className="bg-white border border-slate-150 p-3 rounded-xl space-y-2 text-right">
                      <span className="text-[9px] font-bold text-slate-450 block leading-tight">{ind.label}</span>
                      <div className="flex items-baseline gap-1 pt-0.5">
                        <span className="text-base font-black font-mono text-slate-900">{ind.val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className={`${ind.color} h-full`} style={{ width: `${ind.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 12 & 13: OPERATIONAL SUSTAINABILITY LAYER & GROWTH GRAPH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-3">
                  <span className="text-[10px] font-black text-indigo-900 block pb-1 border-b border-slate-100">طبقة الاستدامة التشغيلية (Operational Sustainability)</span>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    تقيس استقرار وتمسك الحلقة لتقدير خطر تسرب الطلاب من كشوف القرآن.
                  </p>
                  
                  <div className="space-y-2.5 text-xs text-slate-600 font-semibold">
                    <p className="flex justify-between"><span>معدل ثبات واستبقاء الطلاب (Retention):</span> <span className="text-slate-900 font-black font-mono">{activeCircle.retentionRate}%</span></p>
                    <p className="flex justify-between"><span>معدل انقطاع الطلاب هذا الشهر:</span> <span className="text-slate-900 font-black font-mono">{activeCircle.monthlyDropCount} طلاب</span></p>
                    <p className="flex justify-between"><span>استقرار الأداء التراكمي عبر الحقب:</span> <span className="text-slate-900 font-black font-mono">{activeCircle.temporalStabilityScore}%</span></p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-3">
                  <span className="text-[10px] font-black text-indigo-900 block pb-1 border-b border-slate-100">تطور أداء الحلقة عبر الزمن (Growth Timeline)</span>
                  
                  {/* Miniature Visual timeline representation */}
                  <div className="space-y-2.5 pt-1">
                    {[
                      { period: 'شوال 1447 هـ', score: 75, trendStr: 'بداية مستقرة للأشبال والصغار' },
                      { period: 'ذو القعدة 1447 هـ', score: 82, trendStr: 'ارتفاع الالتزام بفضل حوافز معوض' },
                      { period: 'شهر ذو الحجة الحالي', score: activeCircle.rawHifzScore, trendStr: 'آخر رصد لسلاسل التقديم' }
                    ].map((step, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 font-mono">{step.period}</span>
                        <div className="grow mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${step.score}%` }} />
                        </div>
                        <span className="font-mono text-slate-900">{step.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECTION 5: MONTHLY ACTIVITIES (الأنشطة الشهرية للحلقة) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-3xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-black text-xs sm:text-sm text-slate-850">الأنشطة الشهرية والبرامج المضافة لحل تفاوت المستويات</h4>
                  {!isSupervisor && (
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="p-1 px-3 bg-indigo-50 border border-indigo-250 hover:bg-indigo-100 text-indigo-950 font-black text-[9px] rounded cursor-pointer"
                    >
                      + إدراج نشاط إضافي
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeCircle.activities.length === 0 ? (
                    <p className="p-4 text-center text-slate-400 font-bold col-span-2">المعلم لم يفوض أي فعاليات ترفيهية أو مسابقات داخلية هذا الشهر.</p>
                  ) : (
                    activeCircle.activities.map(act => (
                      <div key={act.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="p-0.5 px-2 bg-indigo-950 text-white rounded-[4px] text-[8px] font-bold">
                            {act.type === 'competition' ? 'مسابقة قرآنية' : act.type === 'special_revision' ? 'سير تراكمي طارئ' : 'برنامج تربوي'}
                          </span>
                          <span className="font-mono text-[9px] text-slate-450 font-bold">{act.date}</span>
                        </div>
                        <h5 className="font-black text-slate-800 text-xs sm:text-sm">{act.title}</h5>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-bold">
                          <span>نسبة الحضور والمشاركة: {act.participantsCount} طلاب</span>
                          <span className="text-indigo-900">الأثر المقدر: امتياز وأعلا ⭐</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SPECIAL CIRCLE CHALLENGES & REWARDS SECTION */}
              {!isSupervisor && (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/30 border-2 border-amber-300 rounded-2xl p-4.5 shadow-3xs space-y-3">
                  <div className="flex justify-between items-center border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-amber-950 font-display">
                          التحديات الخاصة بالحلقة والمكافآت المرصودة (Circle Special Challenges)
                        </h4>
                        <p className="text-[10px] text-amber-800 font-bold">
                          تحديات حصرية من الإدارة للحلقة والمعلم لرفع الكفاءة مع مكافآت فورية
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChallengeModal(true)}
                      className="p-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] rounded-xl cursor-pointer shadow-2xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                      <span>إطلاق تحدٍ جديد</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(!activeCircle.challenges || activeCircle.challenges.length === 0) ? (
                      <div className="p-4 text-center bg-white/80 border border-amber-200/60 rounded-xl space-y-1">
                        <p className="text-amber-900 font-bold text-xs">لا توجد تحديات نشطة حالياً لهذه الحلقة.</p>
                        <p className="text-amber-700 text-[10px]">اضغط على زر "إطلاق تحدٍ جديد" لإنشاء تحدٍ خاص للمعلم والطلاب وتحديد المكافأة.</p>
                      </div>
                    ) : (
                      activeCircle.challenges.map(ch => (
                        <div 
                          key={ch.id} 
                          className={`p-3.5 border rounded-xl space-y-2 text-xs transition-all ${
                            ch.status === 'completed' 
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                              : 'bg-white border-amber-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] ${
                                  ch.status === 'completed'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}>
                                  {ch.status === 'completed' ? '🏆 تم إتمام التحدي' : '🎯 تحدٍ قائم'}
                                </span>
                                <h5 className="font-black text-slate-900 text-xs sm:text-sm">{ch.title}</h5>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{ch.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleChallengeStatus(activeCircle.id, ch.id)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-black cursor-pointer shrink-0 transition-all ${
                                ch.status === 'completed'
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                            >
                              {ch.status === 'completed' ? 'إعادة التنشيط' : '✓ اعتماد الإتمام وصرف المكافأة'}
                            </button>
                          </div>

                          <div className="p-2 bg-amber-100/70 border border-amber-300/80 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-[10px]">
                            <div className="flex items-center gap-1.5 text-amber-950 font-black">
                              <Trophy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>المكافأة المرصودة: <strong className="text-amber-900">{ch.reward}</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 font-bold font-mono text-[9px]">
                              <span>المنشئ: {ch.createdBy}</span>
                              <span>المهلة: {ch.targetDate}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 15 & 16: DEVIATION DIAGNOSTIC & DECISIONS PLATFORM */}
              {!isTeacher && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Section 15: Deviation system */}
                  <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-3xs space-y-3">
                    <span className="text-[10px] font-black text-amber-400 block pb-1 border-b border-indigo-900 uppercase">نظام تحليل التراجعات والانحرافات (Deviation Diagnostic)</span>
                    <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
                      يحول المؤشرات الرقمية السيئة إلى أسباب تفسيرية فورية لدعم الإدارة العليا.
                    </p>

                    <div className="space-y-2 text-[11px] font-semibold text-slate-200">
                      {activeCircle.rawHifzScore < 70 ? (
                        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300">
                          🚨 <span className="font-black">ضعف التزام الطلاب:</span> عدم الحفظ بالمنزل لتغيير اهتمامات الأسرة.
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300">
                          🟢 <span className="font-black">انضباط ممتاز:</span> المخططات الكلية متناغمة مع قوى الطلاب بالفوج.
                        </div>
                      )}

                      {activeCircle.studentCount > 15 && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200">
                          ⚠️ <span className="font-black">كثافة طلابية عالية جداً:</span> النصيب الزمني لكل طالب بالتسميع محدود (الحل: شط الحلقة).
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 16: Immediate Actions List */}
                  <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-3xs space-y-3 text-xs">
                    <span className="text-[10px] font-black text-indigo-950 block pb-1 border-b border-slate-100">أرشيف قرارات تحسين الحلقة (Improvement Decisive Action)</span>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleTriggerDecision(activeCircle.id, 'تعديل خطة الحلقة وتقليص المقدار', 'بناءً على تزايد أعداد الطلاب لتفادي الإرهاق الصفي')}
                        className="w-full text-right p-2 hover:bg-slate-50 border border-slate-200 rounded block font-black text-[10px] text-slate-700 hover:text-indigo-950"
                      >
                        ⚡ قرار: تقليص خطة المقدار لضمان ثبات الإتقان
                      </button>

                      <button
                        onClick={() => handleTriggerDecision(activeCircle.id, 'إعادة وعقد جلسة تدريبية للمعلم', 'بسبب تدني متوسط التقديرات')}
                        className="w-full text-right p-2 hover:bg-slate-50 border border-slate-200 rounded block font-black text-[10px] text-slate-700 hover:text-indigo-950"
                      >
                        ⚡ قرار: تزويد المعلم بالمقرأ الصوتي لدعم الترديد
                      </button>

                      <button
                        onClick={() => handleTriggerDecision(activeCircle.id, 'إعادة هيكلة الحلقة بالترسيم', 'انخفاض متوسط الحضور دون 65% والوفاق')}
                        className="w-full text-right p-2 hover:bg-rose-50 border border-rose-200 text-rose-800 rounded block font-black text-[10px]"
                      >
                        ⚠️ قرار طوارئ: دمج ونقل الطلاب المتسربين إجبارياً
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* COLUMN 2: RIGHT SUB-DASHBOARDS LOGS (BADGES & CIRCLE STATS) - 4 cols */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SECTION 6: BADGES SYSTEM VISUALS (الأوسمة والجائزات) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-white space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">سجل الأوسمة الممنوحة للحلقة (Badges System):</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowBadgeModal(true)}
                      className="text-[9px] font-black text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 cursor-pointer"
                    >
                      + منح وسام
                    </button>
                  )}
                </div>
                
                {activeCircle.badges.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-2 font-bold font-mono">لم تمنح الحلقة أي أوسمة رسمية من الإدارة العليا حتى الساعة.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {activeCircle.badges.map(b => (
                      <span
                        key={b.id}
                        className="bg-amber-400/10 border border-amber-400/30 text-amber-300 p-1.5 px-3 rounded-xl font-black text-[9px] block leading-tight hover:scale-103 transition-all"
                        title={b.note}
                      >
                        🏅 {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs space-y-3">
                <span className="text-xs font-black text-indigo-950 block pb-1 border-b border-slate-100">
                  ملخص حلقة {activeCircle.name}
                </span>
                
                <div className="space-y-2 text-xs font-bold text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>المعلم المسؤول:</span>
                    <span className="text-indigo-950 font-black">{activeCircle.teacher}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>المشرف المتابع:</span>
                    <span className="text-slate-900 font-black">{activeCircle.supervisor}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>الفترة والوقت:</span>
                    <span className="text-slate-900">{activeCircle.shift} • {activeCircle.timeSlot}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>المقر والمسجد:</span>
                    <span className="text-slate-900">{activeCircle.location} ({activeCircle.branch})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>المعدل الموزون العام:</span>
                    <span className="text-emerald-700 font-black text-sm">{activeCircle.overallScore}%</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: CREATE NEW HALAQA */}
      {showAddHalaqaModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-md p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-sm text-slate-800 font-display">تأسيس حلقة قرآنية ومقعد تعليمي جديد</h4>
              <button onClick={() => setShowAddHalaqaModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleCreateHalaqa} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم ومسمى الحلقة:</label>
                <input 
                  type="text" 
                  value={newHalaqaForm.name}
                  onChange={(e) => setNewHalaqaForm({ ...newHalaqaForm, name: e.target.value })}
                  placeholder="مثال: حلقة ابن الجزري للإسناد"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">اسم المعلم المندوب (الكادر):</label>
                  <select
                    value={newHalaqaForm.teacher}
                    onChange={(e) => setNewHalaqaForm({ ...newHalaqaForm, teacher: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="الشيخ عبد الرحمن السعيد">الشيخ عبد الرحمن السعيد</option>
                    <option value="أ. حازم عمر الحركي">أ. حازم عمر الحركي</option>
                    <option value="أ. محمد معوض النخيلي">أ. محمد معوض النخيلي</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">الفرع الميداني:</label>
                  <input 
                    type="text" 
                    value={newHalaqaForm.branch}
                    onChange={(e) => setNewHalaqaForm({ ...newHalaqaForm, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">مستوى وتصنيف الحلقة:</label>
                  <select
                    value={newHalaqaForm.level}
                    onChange={(e) => setNewHalaqaForm({ ...newHalaqaForm, level: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="brau_em">براعم وأشبال (أقل من 11 سنة)</option>
                    <option value="shabab">شباب وناشئة (12-15 سنة)</option>
                    <option value="kebar">كبار الحفاظ وتثبيت الإجازة</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">الفوج الطلابي البدء كحجم:</label>
                  <input 
                    type="number" 
                    value={newHalaqaForm.studentCount}
                    onChange={(e) => setNewHalaqaForm({ ...newHalaqaForm, studentCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddHalaqaModal(false)} className="bg-slate-100 p-2.5 rounded-lg">إلغاء الأمر</button>
                <button type="submit" className="bg-indigo-950 text-white p-2.5 px-5 rounded-lg font-black">تأسيس وحفظ الكيان</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: ADD NOTE (تدوين تقرير أو شهادة إشرافية) */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-2 border-indigo-200/90 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-right text-xs space-y-4"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-gradient-to-br from-indigo-950 to-indigo-800 text-white rounded-2xl shadow-xs">
                  <FileText className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-indigo-950 font-display">تدوين تقرير أو شهادة إشرافية</h4>
                  <p className="text-[11px] text-slate-500 font-bold">الحلقة: {activeCircle.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowNoteModal(false)} 
                className="text-slate-400 hover:text-slate-700 text-xl font-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCircleNote} className="space-y-4">
              {/* Category Selector Buttons (أزرار اختيار تصنيف الكاتب والمتابعة) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-black text-slate-800 block text-xs">
                    تصنيف الكاتب والمتابعة:
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    اختر التصنيف
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'supervisor', label: 'ملاحظة مشرف ميداني', icon: ShieldCheck, desc: 'إشراف ومتابعة ميدانية' },
                    { id: 'manager', label: 'شهادة / ملحوظة المدير', icon: Award, desc: 'اعتماد وتوجيه قيادي' },
                    { id: 'educational', label: 'تقويم تربوي وعلمي', icon: GraduationCap, desc: 'توجيه تربوي وفني' },
                    { id: 'operational', label: 'مستند عمل تشغيلي', icon: Layers, desc: 'إجراءات ومتابعة صفية' },
                  ].map((cat) => {
                    const isSelected = newNoteForm.category === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const defaultAuthorMap: Record<string, string> = {
                            supervisor: 'أستاذ حازم (مشرف الحلقات)',
                            manager: 'د. خالد (المدير العام)',
                            educational: 'الموجه التربوي',
                            operational: 'المشرف التشغيلي'
                          };
                          setNewNoteForm(prev => ({
                            ...prev,
                            category: cat.id as any,
                            author: prev.author ? prev.author : defaultAuthorMap[cat.id]
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-black text-xs">
                            <IconComp className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`} />
                            <span>{cat.label}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {cat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flexible Author Input & Quick Chips (مرونة كتابة وتحديد اسم الكاتب) */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="font-black text-slate-800 block text-xs">
                    اسم الكاتب / المدوّن (مرن للكتابة والتعديل):
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">يمكنك الكتابة مباشرة</span>
                </div>
                
                <input
                  type="text"
                  value={newNoteForm.author}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, author: e.target.value })}
                  placeholder="اكتب اسم وصفة الكاتب هنا... مثل: أستاذ حازم (مشرف الحلقات)"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  required
                />

                {/* Quick Suggestion Chips for Author */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-500">اقتراحات سريعة:</span>
                  {[
                    'أستاذ حازم (مشرف الحلقات)',
                    'د. خالد (المدير العام)',
                    'الشيخ عبد الرحمن السعيد (المعلم)',
                    'الموجه التربوي'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewNoteForm({ ...newNoteForm, author: preset })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-colors cursor-pointer ${
                        newNoteForm.author === preset
                          ? 'bg-indigo-100 text-indigo-950 border-indigo-300 font-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-black text-slate-800 block text-xs">
                    مضمون الملاحظة:
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">توثيق مباشر بملف الحلقة</span>
                </div>
                <textarea
                  value={newNoteForm.text}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, text: e.target.value })}
                  placeholder="اكتب التقييم والملاحظات بوضوح هنا لدعم الحفظ..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl h-24 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden leading-relaxed"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button 
                  type="button" 
                  onClick={() => setShowNoteModal(false)} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-indigo-950 to-indigo-900 hover:from-slate-900 hover:to-indigo-950 text-white px-5 py-2.5 rounded-xl font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>حفظ وربط بالملف</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: ADD ACTIVITY */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-sm p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-sm text-slate-800">تفويض وتسجيل نشاط صفي مضاف</h4>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400">×</button>
            </div>

            <form onSubmit={handleAddCircleActivity} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">عنوان الفعالية أو الجلسة:</label>
                <input 
                  type="text" 
                  value={newActivityForm.title}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, title: e.target.value })}
                  placeholder="مثال: رحلة ترفيهية تشجيعية بعد صلاة الفجر"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">نوع النشاط:</label>
                  <select
                    value={newActivityForm.type}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="educational">برنامج تدريبي/تعليمي</option>
                    <option value="competition">مسابقة وجائزة عاجلة</option>
                    <option value="special_revision">برنامج مراجعة مكثف للأفواج</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">عدد الحاضرين الفعلي:</label>
                  <input 
                    type="number" 
                    value={newActivityForm.participantsCount}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, participantsCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-3">
                <button type="button" onClick={() => setShowActivityModal(false)} className="bg-slate-100 p-2 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-indigo-950 text-white p-2 px-4 rounded-lg font-black">تسجيل وتحفيز</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: GRANT BADGE */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-sm p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-sm text-slate-855">منح وسام تميز وإشراق تشجيعي للحلقة</h4>
              <button onClick={() => setShowBadgeModal(false)} className="text-slate-400">×</button>
            </div>

            <form onSubmit={handleGrantBadge} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم ومسمى الوسام:</label>
                <input 
                  type="text" 
                  value={newBadgeForm.name}
                  onChange={(e) => setNewBadgeForm({ ...newBadgeForm, name: e.target.value })}
                  placeholder="مثال: درع التفوق بالمتشابهات القرأنية"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">تصنيف وشعار الوسام:</label>
                <select
                  value={newBadgeForm.type}
                  onChange={(e) => setNewBadgeForm({ ...newBadgeForm, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="model">🏆 حلقة نموذجية رصينة</option>
                  <option value="exemplary">⭐ حلقة متميزة بالحفظ</option>
                  <option value="fast_progress">⚡ حلقة ذات تسارع تقدمي خارق</option>
                  <option value="high_commitment">🎯 حلقة الأعلى التزاماً بالمنهج</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">موجز مسبب التكريم والمنج السري:</label>
                <textarea
                  value={newBadgeForm.note}
                  onChange={(e) => setNewBadgeForm({ ...newBadgeForm, note: e.target.value })}
                  placeholder="مثال: لتحقيق الفوز السحق في اختبارات لجان القياس لـ 15 طالباً..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowBadgeModal(false)} className="bg-slate-100 p-2 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-indigo-950 text-white p-2 px-5 rounded-lg font-black">صرف ومنح الوسام</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 5: DIRECTOR GENERAL - CLOSE & LOCK CIRCLE FILE */}
      {showCloseModal && circleToClose && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-3 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-rose-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-right text-xs space-y-4"
          >
            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 font-display">قرار المدير العام: إقفال وقفل ملف الحلقة</h4>
                  <p className="text-[10px] text-slate-500 font-bold">الحلقة: {circleToClose.name} ({circleToClose.id})</p>
                </div>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-900 space-y-1">
              <p className="font-bold text-xs">⚠️ تنبيه إداري خاص بصلاحيات المدير العام:</p>
              <p className="text-[11px] leading-relaxed">
                إقفال وقفل ملف الحلقة سيؤدي إلى نقلها تلقائياً إلى أرشيف الحلقات المغلقة وتخفيف كشوفات البيانات والمعاينات المعروضة على اللوحات الإشرافية. يمكنك إعادة فتح الملف في أي وقت لاحقاً.
              </p>
            </div>

            <form onSubmit={handleConfirmCloseHalaqa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">سبب الإلغاء/الإقفال المعتمد:</label>
                <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="إلغاء الحلقة وإعادة توزيع الطلاب على الحلقات النشطة">إلغاء الحلقة وإعادة توزيع الطلاب على الحلقات النشطة</option>
                  <option value="انقطاع المعلم وعدم توفر بديل حالياً">انقطاع المعلم وعدم توفر بديل حالياً</option>
                  <option value="دمج الحلقة كلياً مع حلقة أخرى">دمج الحلقة كلياً مع حلقة أخرى</option>
                  <option value="انتهاء خطة الدورة القرآنية المحددة">انتهاء خطة الدورة القرآنية المحددة</option>
                  <option value="تخفيف كثافة البيانات بقرار الترشيد الإداري">تخفيف كثافة البيانات بقرار الترشيد الإداري</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>صفة المعتمد والمنفذ:</span>
                  <span className="font-bold text-slate-900">المدير العام (عبدالرحمن السعيد)</span>
                </div>
                <div className="flex justify-between">
                  <span>حالة الملف بعد الإجراء:</span>
                  <span className="font-bold text-rose-700">مغلق ومقفل بصفة رسمية (مؤرشف)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCloseModal(false)} 
                  className="bg-slate-100 text-slate-700 p-2.5 px-4 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-rose-700 hover:bg-rose-800 text-white p-2.5 px-5 rounded-xl font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>تأكيد الإقفال وقفل الملف</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 6: SPECIAL CIRCLE CHALLENGE */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-3 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-amber-400 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-right text-xs space-y-4"
          >
            <div className="flex justify-between items-center border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 font-display">إطلاق تحدٍ خاص بالحلقة والمعلم</h4>
                  <p className="text-[10px] text-amber-800 font-bold">تحديد تحدٍ استثنائي ورصد مكافأة معينة فور إتمام الإنجاز</p>
                </div>
              </div>
              <button onClick={() => setShowChallengeModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleAddCircleChallenge} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">عنوان التحدي:</label>
                <input 
                  type="text" 
                  value={newChallengeForm.title}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, title: e.target.value })}
                  placeholder="مثال: تحدي سبر المتشابهات للحلقة بتقدير لا يقل عن 95%"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">تفاصيل وشروط التحدي:</label>
                <textarea
                  value={newChallengeForm.description}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, description: e.target.value })}
                  placeholder="اكتب الأهداف المطلوبة من المعلم والطلاب والمقدار المخصص بالتفصيل..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-amber-950 block">المكافأة المرصودة (مالية / معنوية):</label>
                  <input 
                    type="text" 
                    value={newChallengeForm.reward}
                    onChange={(e) => setNewChallengeForm({ ...newChallengeForm, reward: e.target.value })}
                    placeholder="مثال: مكافأة 500 ريال للمعلم + أوسمة للطلاب"
                    className="w-full p-2.5 bg-amber-50/60 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">المهلة الزمنيّة للتحدي:</label>
                  <input 
                    type="text" 
                    value={newChallengeForm.targetDate}
                    onChange={(e) => setNewChallengeForm({ ...newChallengeForm, targetDate: e.target.value })}
                    placeholder="مثال: خلال أسبوعين / حتى نهاية الشهر"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[10px] text-amber-900 space-y-1">
                <p className="font-black flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-600" />
                  <span>تحفيز الإدارة المباشر:</span>
                </p>
                <p className="leading-relaxed">
                  سيتم توثيق التحدي والمكافأة بملف الحلقة التفصيلي، وإشعار المعلم والموجه الفني فور الاعتماد.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowChallengeModal(false)} 
                  className="bg-slate-100 text-slate-700 p-2.5 px-4 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-2.5 px-5 rounded-xl font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Target className="h-4 w-4" />
                  <span>إعتماد وإطلاق التحدي فوراً</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 1. MODAL: CIRCLE STUDENTS FULL REVIEW (المدير العام والمدير التنفيذي) */}
      {showCircleStudentsModal && canInspectStudents && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-800/60 rounded-2xl border border-indigo-700/50">
                  <Users className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg">سجل طلاب {activeCircle.name} الشامل</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      خاص بالمدير العام والمدير التنفيذي
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-bold mt-0.5">
                    استعراض المخرجات الأساسية، الأعمار، الصفوف الدراسية والتقييمات الفردية لطلاب الحلقة
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowCircleStudentsModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer text-xs font-black"
              >
                ✕ إغلاق
              </button>
            </div>

            {/* Sub-Header / Search & Quick Metrics */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
                <input 
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم، الرمز، الصف، أو التقييم..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-700 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400">إجمالي الطلاب:</span>
                  <span className="font-mono font-black text-indigo-950">{activeCircle.allStudents.length}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400">متوسط التقييم:</span>
                  <span className="font-mono font-black text-emerald-700">
                    {Math.round(activeCircle.allStudents.reduce((acc, curr) => acc + (curr.monthlyEvaluation || 85), 0) / (activeCircle.allStudents.length || 1))}%
                  </span>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="p-4 overflow-y-auto grow space-y-3">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase bg-slate-100/70">
                    <th className="p-3">الرمز الموحد</th>
                    <th className="p-3">الاسم الكامل للطالب</th>
                    <th className="p-3">العمر والصف الدراسي</th>
                    <th className="p-3">الحلقة والمعلم المسؤول</th>
                    <th className="p-3 text-center">التقييم الشهري</th>
                    <th className="p-3 text-center">نسبة الحضور</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs font-semibold">
                  {activeCircle.allStudents
                    .filter(st => 
                      !studentSearchQuery || 
                      st.name.includes(studentSearchQuery) || 
                      st.organizationalId?.includes(studentSearchQuery) ||
                      st.permanentId?.includes(studentSearchQuery) ||
                      st.grade?.includes(studentSearchQuery)
                    )
                    .map((st, idx) => (
                      <tr key={st.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="p-3 font-mono">
                          <div className="flex flex-col">
                            <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 font-black px-2 py-0.5 rounded text-[10px] w-max">
                              {st.organizationalId || `C-01-S0${idx+1}`}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                              {st.permanentId || `STD-000${idx+1}`}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-black text-slate-900 text-xs sm:text-sm">{st.name}</div>
                          <span className="text-[10px] text-slate-500 font-bold">{st.hifzProgress || 'منتظم بالخطة المنهجية'}</span>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-bold">{st.grade || 'المرحلة الثانوية'}</div>
                          <div className="text-[10px] text-slate-500 font-bold">🎂 {st.age ? `${st.age} سنة` : '15 سنة'} • {st.school || 'المدرسة النموذجية'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{st.circle || activeCircle.name}</div>
                          <div className="text-[10px] text-indigo-900 font-bold">🎙️ {st.teacher || activeCircle.teacher}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                            (st.monthlyEvaluation || 85) >= 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            (st.monthlyEvaluation || 85) >= 75 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {st.monthlyEvaluation || 85}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-800">
                          {st.attendanceRate || 95}%
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedStudentProfile(st);
                              setShowStudentProfileModal(true);
                            }}
                            className="bg-indigo-950 hover:bg-slate-900 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs transition-transform hover:scale-103"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-300" />
                            <span>فتح الملف</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold shrink-0">
              <span className="text-slate-500">
                🔒 البيانات معروضة بناءً على صلاحيات المدير العام والمدير التنفيذي في النظام.
              </span>
              <button 
                onClick={() => setShowCircleStudentsModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-xl font-black cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. MODAL: DETAILED STUDENT PROFILE FILE (ملف الطالب التفصيلي) */}
      {showStudentProfileModal && selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl max-w-2xl w-full flex flex-col overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-800/50 rounded-2xl border border-indigo-700/50">
                  <User className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">{selectedStudentProfile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-800/80 text-indigo-200 px-2 py-0.5 rounded font-mono text-[10px] font-black">
                      الرمز التنظيمي: {selectedStudentProfile.organizationalId || 'C-01-S01'}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                      المعرف الدائم: {selectedStudentProfile.permanentId || 'STD-0001'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowStudentProfileModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl cursor-pointer text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold">
              {/* Basic Academic Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-indigo-950 text-xs flex items-center gap-2 border-b border-slate-200 pb-2">
                  <GraduationCap className="h-4 w-4 text-indigo-700" />
                  <span>البيانات الأساسية والدراسية</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">العمر الحالي:</span>
                    <span className="font-black">{selectedStudentProfile.age ? `${selectedStudentProfile.age} سنة` : '16 سنة'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الصف الدراسي:</span>
                    <span className="font-black">{selectedStudentProfile.grade || 'الصف الأول الثانوي'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">المدرسة المقيد بها:</span>
                    <span className="font-black">{selectedStudentProfile.school || 'مدرسة الملك فهد الثانوية'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الحلقة المقيد بها:</span>
                    <span className="font-black text-indigo-900">{selectedStudentProfile.circle || activeCircle.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">المعلم المندوب:</span>
                    <span className="font-black text-slate-900">{selectedStudentProfile.teacher || activeCircle.teacher}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">حالة الأداء المنهجي:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black ${
                      selectedStudentProfile.performanceClass === 'distinguished' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {selectedStudentProfile.progressCount || 'متقدم'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Performance Metrics Card */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-150 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-indigo-950 text-xs flex items-center gap-2 border-b border-indigo-200/60 pb-2">
                  <BarChart3 className="h-4 w-4 text-indigo-700" />
                  <span>التقييم الشهري ومؤشرات الإنجاز</span>
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">التقييم الشهري العام</span>
                    <span className="text-lg font-black text-indigo-900 font-mono">
                      {selectedStudentProfile.monthlyEvaluation || 96}%
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">نسبة الحضور والمواظبة</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {selectedStudentProfile.attendanceRate || 98}%
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">مستوى الإتقان والتثبيت</span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {selectedStudentProfile.hifzProgress || 'ممتاز (15 جزء)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Parent Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Phone className="h-4 w-4 text-slate-700" />
                  <span>بيانات الاتصال وولي الأمر</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">اسم ولي الأمر:</span>
                    <span className="font-black text-slate-900">{selectedStudentProfile.parentName || 'ياسر المزروعي'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">جوال ولي الأمر:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedStudentProfile.parentPhone || '0501122334'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">جوال الطالب:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedStudentProfile.phone || '0551122334'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => alert(`جاري طباعة تقرير الطالب ${selectedStudentProfile.name}...`)}
                className="bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة التقرير الشامل</span>
              </button>

              <button 
                onClick={() => setShowStudentProfileModal(false)}
                className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                إغلاق الملف
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
