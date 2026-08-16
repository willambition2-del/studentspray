/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Sliders, Play, Award, ClipboardList, ShieldAlert, ArrowLeftRight, 
  Settings, Users, CheckCircle, RefreshCw, Plus, Calendar, AlertTriangle, 
  TrendingUp, History, Download, Printer, Copy, AlertCircle, Share2, Star,
  Eye, Archive, RotateCcw, ChevronRight, HelpCircle, Check, X, FileText, Activity,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// === INTERNAL TYPES ===
export interface PlanTemplate {
  id: string;
  name: string;
  type: 'hifz' | 'murajaah';
  duration: string; // duration value (e.g., "3_months")
  durationLabel: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  rating: number; // 1-5
  isArchived: boolean;
  targetRange: { from: string; to: string };
  studyDaysPerWeek: number;
  vacationDays: string[];
  expectedPace: 'slow' | 'normal' | 'fast';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudentPlanInstance {
  id: string;
  studentId: string;
  studentName: string;
  studentAge: number;
  circleId: string;
  circleName: string;
  templateId: string;
  templateName: string;
  type: 'hifz' | 'murajaah';
  status: 'active' | 'completed' | 'stalled' | 'critical' | 'needs_reschedule' | 'near_complete';
  startDate: string;
  endDate: string;
  currentVersion: number;
  versions: {
    version: number;
    date: string;
    modifier: string;
    reason: string;
    differences: string;
    details: any;
  }[];
  approvalStatus: 'approved' | 'pending' | 'revision_requested' | 'rejected';
  approvalPath: 'teacher_supervisor' | 'teacher_supervisor_branch' | 'teacher_supervisor_gm';
  approvalLogs: {
    date: string;
    role: string;
    action: string;
    officer: string;
    notes: string;
  }[];
  executionMode: 'daily' | 'weekly' | 'monthly';
  targets: {
    dailyAmount: string;
    weeklyAmount: string;
    monthlyAmount: string;
    targetProgressRate: number; // percentage
  };
  milestones: {
    id: string;
    title: string;
    target: string;
    progress: number;
    status: 'pending' | 'active' | 'completed' | 'stalled';
  }[];
  deviation: {
    temporalDays: number; // positive = ahead, negative = behind
    quantitativePages: number;
    relativePercentage: number;
    trend: 'improving' | 'stable' | 'declining';
    forecastedCompletion: string;
    successProbability: number; // 0-100
  };
  evaluation: {
    points: number;
    percentage: number;
    level: 'excellent' | 'good' | 'average' | 'poor';
  };
}

// === INITIAL STATE MOCK DATA ===
const initialTemplates: PlanTemplate[] = [
  {
    id: 'tpl-1',
    name: 'حفظ جزء عم وتبارك المكثف',
    type: 'hifz',
    duration: '3_months',
    durationLabel: '3 أشهر',
    createdBy: 'الشيخ عبدالرحمن الصاوي',
    createdAt: '2026-01-10',
    usageCount: 42,
    rating: 4.8,
    isArchived: false,
    targetRange: { from: 'النبأ', to: 'الناس' },
    studyDaysPerWeek: 5,
    vacationDays: ['جمعة', 'سبت'],
    expectedPace: 'normal',
    difficulty: 'medium'
  },
  {
    id: 'tpl-2',
    name: 'تثبيت ومراجعة البقرة وآل عمران',
    type: 'murajaah',
    duration: '2_months',
    durationLabel: 'شهرين',
    createdBy: 'المشرف التعليمي أحمد سالم',
    createdAt: '2026-02-15',
    usageCount: 28,
    rating: 4.9,
    isArchived: false,
    targetRange: { from: 'البقرة', to: 'آل عمران' },
    studyDaysPerWeek: 6,
    vacationDays: ['جمعة'],
    expectedPace: 'fast',
    difficulty: 'hard'
  },
  {
    id: 'tpl-3',
    name: 'تأسيس الحفظ للصغار - قصار السور',
    type: 'hifz',
    duration: '6_months',
    durationLabel: '6 أشهر',
    createdBy: 'أ. ياسر الحربي',
    createdAt: '2026-03-01',
    usageCount: 15,
    rating: 4.5,
    isArchived: false,
    targetRange: { from: 'الضحى', to: 'الناس' },
    studyDaysPerWeek: 4,
    vacationDays: ['خميس', 'جمعة', 'سبت'],
    expectedPace: 'slow',
    difficulty: 'easy'
  },
  {
    id: 'tpl-4',
    name: 'مراجعة الأجزاء الخمسة الأولى لطلاب النخبة',
    type: 'murajaah',
    duration: '1_month',
    durationLabel: 'شهر واحد',
    createdBy: 'إدارة شؤون الحلقات',
    createdAt: '2025-11-20',
    usageCount: 65,
    rating: 4.7,
    isArchived: true, // Archived to show restoration capability
    targetRange: { from: 'البقرة', to: 'النساء' },
    studyDaysPerWeek: 5,
    vacationDays: ['جمعة', 'سبت'],
    expectedPace: 'fast',
    difficulty: 'hard'
  }
];

const initialStudentPlans: StudentPlanInstance[] = [
  {
    id: 'plan-inst-1',
    studentId: 'st-101',
    studentName: 'عبدالرحمن الغامدي',
    studentAge: 14,
    circleId: 'circle-1',
    circleName: 'حلقة الإمام عاصم',
    templateId: 'tpl-1',
    templateName: 'حفظ جزء عم وتبارك المكثف',
    type: 'hifz',
    status: 'critical', // late/behind
    startDate: '2026-05-01',
    endDate: '2026-08-01',
    currentVersion: 2,
    versions: [
      {
        version: 1,
        date: '2026-05-01',
        modifier: 'أ. عبدالرحمن الصاوي',
        reason: 'الإنشاء الأساسي للخطة',
        differences: 'الخطة الابتدائية المعيارية',
        details: {}
      },
      {
        version: 2,
        date: '2026-06-10',
        modifier: 'أ. عبدالرحمن الصاوي',
        reason: 'تعديل بسبب الغياب المرضي',
        differences: 'تقليل المقدار اليومي من صفحتين إلى صفحة ونصف مع تمديد الفترة أسبوعين إضافيين',
        details: {}
      }
    ],
    approvalStatus: 'approved',
    approvalPath: 'teacher_supervisor_branch',
    approvalLogs: [
      {
        date: '2026-05-02',
        role: 'المدرس',
        action: 'طلب اعتماد الخطة المعدلة',
        officer: 'الشيخ عبدالرحمن الصاوي',
        notes: 'الطالب حريص ومتحمس وجرى مراعاة ظروفه.'
      },
      {
        date: '2026-05-03',
        role: 'المشرف التعليمي',
        action: 'اعتماد وموافقة',
        officer: 'أحمد سالم (المشرف)',
        notes: 'تمت المراجعة والاعتماد تماشياً مع مستوى ذكائه اللغوي.'
      }
    ],
    executionMode: 'daily',
    targets: {
      dailyAmount: '1.5 صفحة',
      weeklyAmount: '7.5 صفحة',
      monthlyAmount: '30 صفحة',
      targetProgressRate: 45
    },
    milestones: [
      { id: 'm-1', title: 'إتمام حفظ جزء عم', target: 'سورة النبأ إلى الناس', progress: 100, status: 'completed' },
      { id: 'm-2', title: 'إتمام حفظ النصف الأول من جزء تبارك', target: 'سورة المدثر إلى الملك', progress: 40, status: 'active' },
      { id: 'm-3', title: 'إتمام حفظ جزء تبارك كاملاً والتثبيت النهائي', target: 'كامل الجزءين', progress: 0, status: 'pending' }
    ],
    deviation: {
      temporalDays: -8, // 8 days behind
      quantitativePages: -12, // 12 pages behind
      relativePercentage: -18.5,
      trend: 'declining',
      forecastedCompletion: '2026-08-15',
      successProbability: 40
    },
    evaluation: {
      points: 72,
      percentage: 72,
      level: 'average'
    }
  },
  {
    id: 'plan-inst-2',
    studentId: 'st-102',
    studentName: 'يوسف العتيبي',
    studentAge: 16,
    circleId: 'circle-1',
    circleName: 'حلقة الإمام عاصم',
    templateId: 'tpl-2',
    templateName: 'تثبيت ومراجعة البقرة وآل عمران',
    type: 'murajaah',
    status: 'active', // on track
    startDate: '2026-05-15',
    endDate: '2026-07-15',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        date: '2026-05-15',
        modifier: 'أ. عبدالرحمن الصاوي',
        reason: 'الخطة الابتدائية المعتمدة للثبيت المنهجي',
        differences: 'أول إصدار تفاعلي',
        details: {}
      }
    ],
    approvalStatus: 'approved',
    approvalPath: 'teacher_supervisor',
    approvalLogs: [
      {
        date: '2026-05-15',
        role: 'المدرس',
        action: 'تجهيز وإقرار',
        officer: 'الشيخ عبدالرحمن الصاوي',
        notes: 'الخطة تهدف لتهيئة الطالب لمسابقة الفرع الكبرى.'
      }
    ],
    executionMode: 'weekly',
    targets: {
      dailyAmount: '5 صفحات',
      weeklyAmount: '30 صفحة',
      monthlyAmount: '120 صفحة',
      targetProgressRate: 65
    },
    milestones: [
      { id: 'm2-1', title: 'مراجعة وتثبيت سورة البقرة بالكامل', target: 'سورة البقرة مراجعة', progress: 95, status: 'active' },
      { id: 'm2-2', title: 'مراجعة وتثبيت سورة آل عمران', target: 'سورة آل عمران مراجعة', progress: 10, status: 'pending' }
    ],
    deviation: {
      temporalDays: 3, // 3 days ahead!
      quantitativePages: 15,
      relativePercentage: 12,
      trend: 'improving',
      forecastedCompletion: '2026-07-12',
      successProbability: 95
    },
    evaluation: {
      points: 96,
      percentage: 96,
      level: 'excellent'
    }
  },
  {
    id: 'plan-inst-3',
    studentId: 'st-103',
    studentName: 'معاذ الحارثي',
    studentAge: 11,
    circleId: 'circle-2',
    circleName: 'حلقة الإمام البخاري',
    templateId: 'tpl-3',
    templateName: 'تأسيس الحفظ للصغار - قصار السور',
    type: 'hifz',
    status: 'stalled', // stalled / needs action
    startDate: '2026-04-01',
    endDate: '2026-10-01',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        date: '2026-04-01',
        modifier: 'أ. ياسر الحربي',
        reason: 'تأسيس الخطة الأساسية للمبتدئين',
        differences: 'أول إصدار',
        details: {}
      }
    ],
    approvalStatus: 'pending', // Pending approval!
    approvalPath: 'teacher_supervisor_gm',
    approvalLogs: [
      {
        date: '2026-04-01',
        role: 'المدرس',
        action: 'رفع بطلب الاعتماد الاستثنائي من المدير العام',
        officer: 'أ. ياسر الحربي',
        notes: 'الطالب عمره صغير ويحتاج خطة مخصصة جداً.'
      }
    ],
    executionMode: 'daily',
    targets: {
      dailyAmount: '0.5 صفحة',
      weeklyAmount: '2 صفحة',
      monthlyAmount: '8 صفحات',
      targetProgressRate: 35
    },
    milestones: [
      { id: 'm3-1', title: 'حفظ جزء عم من الناس للضحى', target: 'الناس للضحى', progress: 55, status: 'active' },
      { id: 'm3-2', title: 'حفظ جزء عم من الليل للنبأ', target: 'الليل للنبأ', progress: 0, status: 'pending' }
    ],
    deviation: {
      temporalDays: -12,
      quantitativePages: -6,
      relativePercentage: -22,
      trend: 'stable',
      forecastedCompletion: '2026-10-28',
      successProbability: 55
    },
    evaluation: {
      points: 64,
      percentage: 64,
      level: 'average'
    }
  },
  {
    id: 'plan-inst-4',
    studentId: 'st-104',
    studentName: 'عمر الفاروق',
    studentAge: 15,
    circleId: 'circle-2',
    circleName: 'حلقة الإمام البخاري',
    templateId: 'tpl-1',
    templateName: 'حفظ جزء عم وتبارك المكثف',
    type: 'hifz',
    status: 'needs_reschedule', // needs reschedule due to absence
    startDate: '2026-05-10',
    endDate: '2026-08-10',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        date: '2026-05-10',
        modifier: 'أ. ياسر الحربي',
        reason: 'تخصيص الخطة الفردية',
        differences: 'الإصدار الأول',
        details: {}
      }
    ],
    approvalStatus: 'approved',
    approvalPath: 'teacher_supervisor',
    approvalLogs: [
      {
        date: '2026-05-10',
        role: 'المدرس',
        action: 'طلب إقرار الخطة',
        officer: 'أ. ياسر الحربي',
        notes: 'معتمد.'
      }
    ],
    executionMode: 'daily',
    targets: {
      dailyAmount: '2 صفحة',
      weeklyAmount: '10 صفحات',
      monthlyAmount: '40 صفحة',
      targetProgressRate: 15
    },
    milestones: [
      { id: 'm4-1', title: 'حفظ جزء عم', target: 'النبأ إلى الناس', progress: 30, status: 'active' }
    ],
    deviation: {
      temporalDays: -18,
      quantitativePages: -36,
      relativePercentage: -45,
      trend: 'declining',
      forecastedCompletion: '2026-09-25',
      successProbability: 25
    },
    evaluation: {
      points: 48,
      percentage: 48,
      level: 'poor'
    }
  }
];

const mockProgressHistory = [
  { id: 'log-1', studentId: 'st-101', studentName: 'عبدالرحمن الغامدي', date: '2026-06-24', type: 'hifz', amount: 'صفحة ونصف (من سورة النجم إلى القمر)', executor: 'المدرس: عبدالرحمن الصاوي', notes: 'التجويد ممتاز جداً' },
  { id: 'log-2', studentId: 'st-102', studentName: 'يوسف العتيبي', date: '2026-06-25', type: 'murajaah', amount: '5 صفحات (تثبيت كامل الربع الثاني من البقرة)', executor: 'المدرس: عبدالرحمن الصاوي', notes: 'حضور مبكر وتركيز مثالي' },
  { id: 'log-3', studentId: 'st-101', studentName: 'عبدالرحمن الغامدي', date: '2026-06-23', type: 'hifz', amount: 'صفحة واحدة (سورة الطور)', executor: 'المدرس: عبدالرحمن الصاوي', notes: 'كان يشعر ببعض الإرهاق' },
  { id: 'log-4', studentId: 'st-103', studentName: 'معاذ الحارثي', date: '2026-06-22', type: 'hifz', amount: 'نصف صفحة (سورة الشمس والأعلى)', executor: 'المدرس: ياسر الحربي', notes: 'تجاوب رائع وتفاعل عائلي ملحوظ' }
];

import { getEducationalPlans, createEducationalPlan, getAcademicYears } from '../lib/api';

export default function EducationalPlanning() {
  // === STATE MANAGEMENT ===
  const [activeSubTab, setActiveSubTab] = useState<'health' | 'library' | 'generator' | 'execution' | 'comparisons' | 'print_portal'>('health');
  
  // Data lists
  const [templates, setTemplates] = useState<PlanTemplate[]>(initialTemplates);
  const [studentPlans, setStudentPlans] = useState<StudentPlanInstance[]>(initialStudentPlans);
  const [progressLogs, setProgressLogs] = useState<typeof mockProgressHistory>(mockProgressHistory);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadBackendPlans() {
      try {
        setIsLoading(true);
        const [plansRes, yearsRes] = await Promise.all([
          getEducationalPlans({ limit: 50 }),
          getAcademicYears({ limit: 20 }),
        ]);

        const rawPlans = plansRes.items || [];
        if (rawPlans.length > 0) {
          const mappedPlans: StudentPlanInstance[] = rawPlans.map((p, idx) => ({
            id: p.id,
            studentId: p.studentId || `ST-${String(idx + 1).padStart(6, '0')}`,
            studentName: p.student?.user?.displayName || p.name,
            studentAge: 14,
            circleId: p.halaqaId || 'circle-1',
            circleName: p.halaqa?.name || 'حلقة الإتقان',
            templateId: 'tpl-1',
            templateName: p.name,
            type: p.type === 'HIFZ' ? 'hifz' : 'murajaah',
            status: p.status === 'ACTIVE' ? 'active' : p.status === 'COMPLETED' ? 'completed' : 'stalled',
            startDate: p.startDate || '2026-08-01',
            endDate: p.endDate || '2026-11-01',
            currentVersion: 1,
            versions: [],
            approvalStatus: 'approved',
            approvalPath: 'teacher_supervisor',
            approvalLogs: [],
            executionMode: 'daily',
            targets: {
              dailyAmount: 'صفحة واحدة',
              weeklyAmount: '5 صفحات',
              monthlyAmount: '20 صفحة',
              targetProgressRate: 85,
            },
            milestones: (p.items || []).map((it, mi) => ({
              id: it.id,
              title: `المرحلة ${mi + 1}`,
              target: `سورة رقم ${it.surahNumber || 1}`,
              progress: it.status === 'COMPLETED' ? 100 : 0,
              status: it.status === 'COMPLETED' ? 'completed' : 'active',
            })),
            deviation: {
              temporalDays: 2,
              quantitativePages: 1,
              relativePercentage: 5,
              trend: 'improving',
              forecastedCompletion: '2026-11-15',
              successProbability: 95,
            },
            evaluation: {
              points: 92,
              percentage: 92,
              level: 'excellent',
            },
          }));
          setStudentPlans(mappedPlans);
          if (mappedPlans[0]) {
            setSelectedPlanId(mappedPlans[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load plans from backend API', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBackendPlans();
  }, []);
  
  // Custom states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Library operations
  const [editingTemplate, setEditingTemplate] = useState<PlanTemplate | null>(null);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  
  // Generator states & forms
  const [generatorType, setGeneratorType] = useState<'hifz' | 'murajaah'>('hifz');
  const [genTargetFrom, setGenTargetFrom] = useState('النبأ');
  const [genTargetTo, setGenTargetTo] = useState('الناس');
  const [genRevisionAmount, setGenRevisionAmount] = useState('ربع حزب يومياً');
  const [genRevisionRange, setGenRevisionRange] = useState('الخمسة أجزاء الأخيرة');
  const [genDuration, setGenDuration] = useState('3_months');
  const [genStudyDays, setGenStudyDays] = useState(5);
  const [genVacations, setGenVacations] = useState<string[]>(['جمعة', 'سبت']);
  const [genPace, setGenPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [genStudentLevel, setGenStudentLevel] = useState('متوسط');
  const [genStudentAge, setGenStudentAge] = useState(13);
  const [genAttendanceRate, setGenAttendanceRate] = useState(90);
  const [genCommitmentRate, setGenCommitmentRate] = useState(85);
  const [genPastGrade, setGenPastGrade] = useState('ممتاز (92%)');
  
  // Generated draft plan
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [customApprovalPath, setCustomApprovalPath] = useState<'teacher_supervisor' | 'teacher_supervisor_branch' | 'teacher_supervisor_gm'>('teacher_supervisor');
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Execution selection & logging
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialStudentPlans[0].id);
  const [executionLogType, setExecutionLogType] = useState<'hifz' | 'murajaah'>('hifz');
  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');
  const [logNotes, setLogNotes] = useState('');
  
  // Rescheduling state
  const [isReschedulingOpen, setIsReschedulingOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('absence');
  const [rescheduleOption, setRescheduleOption] = useState<'redistribute' | 'extend' | 'modify_target' | 'rebuild'>('redistribute');
  const [simulatedPlan, setSimulatedPlan] = useState<any>(null);

  // Compare plans selection
  const [comparePlanA, setComparePlanA] = useState(initialStudentPlans[0].id);
  const [comparePlanB, setComparePlanB] = useState(initialStudentPlans[1].id);

  // Active Alert settings
  const [alertThresholds, setAlertThresholds] = useState({
    deviationDays: -5,
    attendanceRate: 80,
    successProbLimit: 50
  });

  const activePlan = useMemo(() => {
    return studentPlans.find(p => p.id === selectedPlanId) || studentPlans[0];
  }, [studentPlans, selectedPlanId]);

  // === CALCULATORS & SMART ALGORITHMS ===
  
  // Section 3: Recommendation Engine
  const handleRecommendPlan = () => {
    // Basic AI analysis heuristic
    let recommendedDuration = '3_months';
    let recommendedAmount = 'صفحة ونصف يومياً';
    let recommendedDiff: 'easy' | 'medium' | 'hard' = 'medium';
    let description = '';

    if (genAttendanceRate > 92 && genCommitmentRate > 90) {
      recommendedDuration = '2_months';
      recommendedAmount = 'صفحتان يومياً';
      recommendedDiff = 'hard';
      description = 'نظراً لنسبة الالتزام الاستثنائية وحضور الطالب الممتاز، يُنصح بالخطة السريعة المكثفة لاختصار المدة مع الحفاظ على التثبيت التلقائي.';
    } else if (genAttendanceRate < 80 || genStudentAge < 10) {
      recommendedDuration = '6_months';
      recommendedAmount = 'نصف صفحة يومياً';
      recommendedDiff = 'easy';
      description = 'بناءً على تشتت الحضور أو صغر سن الطالب، نوصي بخطة ممتدة ذات تكرار مريح وضغط مخفف لتلافي الإحباط والتسرب.';
    } else {
      recommendedDuration = '3_months';
      recommendedAmount = 'صفحة يومياً';
      recommendedDiff = 'medium';
      description = 'مستوى الطالب متوسط ومستقر. الخطة الاعتيادية بمدة 3 أشهر تضمن توازناً مثالياً ومعدل انحراف ضئيل.';
    }

    setGeneratedDraft({
      recommendedDuration,
      recommendedAmount,
      recommendedDiff,
      description,
      // Section 4: Plan Realism Analysis
      realism: genAttendanceRate > 85 ? 'واقعية وآمنة' : genAttendanceRate >= 75 ? 'تحتاج مراجعة دقيقة' : 'عالية الخطورة ومقلقة',
      realismColor: genAttendanceRate > 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : genAttendanceRate >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200',
      successProb: Math.round((genAttendanceRate * 0.6) + (genCommitmentRate * 0.4)),
      riskLevel: genAttendanceRate > 85 ? 'منخفض' : genAttendanceRate >= 75 ? 'متوسط' : 'مرتفع جداً',
      riskReasons: [
        genAttendanceRate < 85 ? '• انخفاض نسبة الحضور تسبب فجوات في التكرار اليومي.' : null,
        genCommitmentRate < 80 ? '• نسبة الالتزام السابقة تشير إلى احتمال تعثر تكرار مراجعة الأوجه.' : null,
        genStudentAge < 12 && recommendedDiff === 'hard' ? '• صعوبة الخطة قد لا تتلاءم مع فئته العمرية دون إشراف مكثف من ولي الأمر.' : null
      ].filter(Boolean)
    });
  };

  // Section 2: Smart Plan Generator Outputs Calculation
  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedDraft) {
      handleRecommendPlan();
    }
    
    // Simulate generation output
    const isHifz = generatorType === 'hifz';
    const dailyAmt = isHifz 
      ? (genPace === 'fast' ? '3 صفحات' : genPace === 'normal' ? '1.5 صفحة' : '0.5 صفحة')
      : (genPace === 'fast' ? '10 صفحات' : genPace === 'normal' ? '5 صفحات' : '2 صفحة');
    
    const weeklyAmt = isHifz
      ? (genPace === 'fast' ? '15 صفحة' : genPace === 'normal' ? '7.5 صفحة' : '2.5 صفحة')
      : (genPace === 'fast' ? '50 صفحة' : genPace === 'normal' ? '25 صفحة' : '10 صفحات');

    const monthlyAmt = isHifz
      ? (genPace === 'fast' ? '60 صفحة' : genPace === 'normal' ? '30 صفحة' : '10 صفحات')
      : (genPace === 'fast' ? '200 صفحة' : genPace === 'normal' ? '100 صفحة' : '40 صفحة');

    const calculatedDraft = {
      ...generatedDraft,
      isGenerated: true,
      name: `خطة ذكية مخصصة: ${isHifz ? 'حفظ' : 'مراجعة'} - ${isHifz ? genTargetFrom + ' إلى ' + genTargetTo : genRevisionRange}`,
      type: generatorType,
      dailyAmt,
      weeklyAmt,
      monthlyAmt,
      targetProgressRate: 100,
      stages: [
        { label: 'المرحلة الأولى: الانطلاق والتهيئة', amount: '20% من المستهدف الإجمالي' },
        { label: 'المرحلة الثانية: التكثيف والوسطى', amount: '50% من المستهدف الإجمالي' },
        { label: 'المرحلة الثالثة: الختم والتثبيت الذهبي', amount: '30% من المستهدف المتبقي' }
      ]
    };
    
    setGeneratedDraft(calculatedDraft);
  };

  // Section 5: Plan Approval Implementation
  const handleSaveDraftToActive = () => {
    if (!generatedDraft) return;

    const newInstance: StudentPlanInstance = {
      id: `plan-inst-${Date.now()}`,
      studentId: 'st-dynamic',
      studentName: 'أنس عبدالله الراشد',
      studentAge: genStudentAge,
      circleId: 'circle-1',
      circleName: 'حلقة الإمام عاصم',
      templateId: 'tpl-custom',
      templateName: generatedDraft.name,
      type: generatorType,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-09-25',
      currentVersion: 1,
      versions: [
        {
          version: 1,
          date: new Date().toISOString().split('T')[0],
          modifier: 'المدرس عبر المولد الذكي',
          reason: 'توليد ذكي ومحاكاة الواقعية',
          differences: 'الخلق الأولي بناء على مؤشرات الذكاء والالتزام',
          details: {}
        }
      ],
      approvalStatus: 'pending', // Pending initially
      approvalPath: customApprovalPath,
      approvalLogs: [
        {
          date: new Date().toISOString().split('T')[0],
          role: 'المدرس',
          action: 'إنشاء وطلب اعتماد الخطة الذكية',
          officer: 'المدرس الحالي',
          notes: approvalNotes || 'تم توليدها تلقائياً وتحليل الواقعية.'
        }
      ],
      executionMode: 'daily',
      targets: {
        dailyAmount: generatedDraft.dailyAmt,
        weeklyAmount: generatedDraft.weeklyAmt,
        monthlyAmount: generatedDraft.monthlyAmt,
        targetProgressRate: 100
      },
      milestones: [
        { id: 'dm-1', title: 'مرحلة الانطلاق الأسبوعية', target: 'حفظ الربع الأول', progress: 0, status: 'pending' },
        { id: 'dm-2', title: 'مرحلة التقييم المرحلي', target: 'اختبار نصف المدة', progress: 0, status: 'pending' }
      ],
      deviation: {
        temporalDays: 0,
        quantitativePages: 0,
        relativePercentage: 0,
        trend: 'stable',
        forecastedCompletion: '2026-09-25',
        successProbability: generatedDraft.successProb || 85
      },
      evaluation: {
        points: 100,
        percentage: 100,
        level: 'excellent'
      }
    };

    setStudentPlans([newInstance, ...studentPlans]);
    setActiveSubTab('health');
    alert('✅ تم حفظ الخطة الذكية بنجاح وهي قيد الاعتماد الإداري والمالي حالياً.');
    setGeneratedDraft(null);
  };

  // Section 10: Plan Rescheduling Simulation
  const handleSimulateReschedule = () => {
    let newDuration = activePlan.endDate;
    let newDaily = activePlan.targets.dailyAmount;
    let simulatedProb = activePlan.deviation.successProbability;
    let impact = '';

    const currentDailyNum = parseFloat(activePlan.targets.dailyAmount) || 1;

    if (rescheduleOption === 'redistribute') {
      newDaily = `${(currentDailyNum * 1.35).toFixed(1)} صفحة`;
      simulatedProb = Math.max(10, activePlan.deviation.successProbability - 15);
      impact = '⚠️ تم زيادة الضغط اليومي لتعويض التقصير؛ تنخفض احتمالية النجاح لصعوبة المنهج الجديد.';
    } else if (rescheduleOption === 'extend') {
      const extDate = new Date(activePlan.endDate);
      extDate.setDate(extDate.getDate() + 20); // Add 20 days
      newDuration = extDate.toISOString().split('T')[0];
      simulatedProb = Math.min(95, activePlan.deviation.successProbability + 35);
      impact = '✓ تمديد المدة يخفف العبء اليومي؛ تزداد احتمالية نجاح الخطة واستمرارية الطالب.';
    } else if (rescheduleOption === 'modify_target') {
      newDaily = `${(currentDailyNum * 0.75).toFixed(1)} صفحة`;
      simulatedProb = Math.min(90, activePlan.deviation.successProbability + 20);
      impact = '✓ تقليل المستهدف الإجمالي يصحح انحراف الخطة ويجعل التقييم القادم أكثر إنصافاً.';
    } else {
      newDaily = '1.0 صفحة';
      newDuration = 'خطة جديدة بالكامل';
      simulatedProb = 85;
      impact = '✓ تصفير الأداء السابق وبدء صفحة جديدة تماماً يزيل الإحباط النفسي عن الطالب.';
    }

    setSimulatedPlan({
      newDuration,
      newDaily,
      simulatedProb,
      impact
    });
  };

  const handleApplyReschedule = () => {
    if (!simulatedPlan) return;

    // Update the version and reschedule details
    const updated = studentPlans.map(p => {
      if (p.id === activePlan.id) {
        const nextVer = p.currentVersion + 1;
        return {
          ...p,
          currentVersion: nextVer,
          status: 'active' as const, // restore health
          endDate: rescheduleOption === 'extend' ? simulatedPlan.newDuration : p.endDate,
          targets: {
            ...p.targets,
            dailyAmount: simulatedPlan.newDaily
          },
          versions: [
            ...p.versions,
            {
              version: nextVer,
              date: new Date().toISOString().split('T')[0],
              modifier: 'المشرف العام (إعادة جدولة معتمدة)',
              reason: `إعادة جدولة بسبب: ${rescheduleReason === 'absence' ? 'الغياب' : rescheduleReason === 'weak_progress' ? 'ضعف الإنجاز' : 'إجازة/ظرف طارئ'}`,
              differences: `تعديل النمط إلى ${rescheduleOption}. المستهدف اليومي الجديد: ${simulatedPlan.newDaily}`,
              details: {}
            }
          ],
          deviation: {
            ...p.deviation,
            temporalDays: 0, // reset deviation on reschedule
            quantitativePages: 0,
            relativePercentage: 0,
            trend: 'stable' as const,
            successProbability: simulatedPlan.simulatedProb
          }
        };
      }
      return p;
    });

    setStudentPlans(updated);
    setIsReschedulingOpen(false);
    setSimulatedPlan(null);
    alert('✅ تم تطبيق إعادة الجدولة رسمياً وإنشاء الإصدار الجديد بنجاح في سجل النسخ للخطط.');
  };

  // Section 8: Log Actual Performance
  const handleAddProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFrom || !logTo) {
      alert('الرجاء إدخال تفاصيل النطاق بالكامل.');
      return;
    }

    const newLog = {
      id: `log-${Date.now()}`,
      studentId: activePlan.studentId,
      studentName: activePlan.studentName,
      date: new Date().toISOString().split('T')[0],
      type: activePlan.type,
      amount: `من سورة/صفحة ${logFrom} إلى سورة/صفحة ${logTo}`,
      executor: 'مدرس الحلقة الحالي',
      notes: logNotes || 'تم التسجيل والمتابعة'
    };

    setProgressLogs([newLog, ...progressLogs]);
    
    // Simulate updating deviation on the student plan
    const updated = studentPlans.map(p => {
      if (p.id === activePlan.id) {
        // Boost progress and reduce deviation
        const currentPages = p.deviation.quantitativePages;
        const currentDays = p.deviation.temporalDays;
        return {
          ...p,
          deviation: {
            ...p.deviation,
            quantitativePages: Math.min(10, currentPages + 2),
            temporalDays: Math.min(10, currentDays + 1),
            relativePercentage: Math.min(100, p.deviation.relativePercentage + 4),
            trend: 'improving' as const
          }
        };
      }
      return p;
    });

    setStudentPlans(updated);
    setLogFrom('');
    setLogTo('');
    setLogNotes('');
    alert('✅ تم قيد الإنجاز بنجاح وتحديث واقعية الانحراف التلقائي للطالب.');
  };

  // Archive / Restore Templates
  const handleArchiveTemplate = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, isArchived: true } : t));
  };

  const handleRestoreTemplate = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, isArchived: false } : t));
  };

  const handleDuplicateTemplate = (tpl: PlanTemplate) => {
    const duplicated: PlanTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (نسخة مكررة)`,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTemplates([...templates, duplicated]);
    alert('✅ تم تكرار الخطة بنجاح في مكتبة الخطط المتاحة.');
  };

  // Approval updates
  const handleApprovalDecision = (planId: string, decision: 'approved' | 'rejected' | 'revision_requested', notes: string) => {
    setStudentPlans(studentPlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          approvalStatus: decision,
          approvalLogs: [
            ...p.approvalLogs,
            {
              date: new Date().toISOString().split('T')[0],
              role: 'المشرف',
              action: decision === 'approved' ? 'اعتماد كلي' : decision === 'rejected' ? 'رفض الخطة' : 'طلب تعديلات وجدولة مخصصة',
              officer: 'الأستاذ أحمد البارقي',
              notes: notes || 'تم اتخاذ القرار بعد مراجعة المولد والأهداف المرحلية.'
            }
          ]
        };
      }
      return p;
    }));
    alert('✅ تم تسجيل قرار الاعتماد بنجاح وتحديث حالة الملف للطالب.');
  };

  // Filtered lists for health center
  const filteredPlans = studentPlans.filter(p => {
    const matchesSearch = p.studentName.includes(searchQuery) || p.templateName.includes(searchQuery);
    const matchesCircle = selectedCircle === 'all' || p.circleId === selectedCircle;
    
    if (selectedStatus === 'all') return matchesSearch && matchesCircle;
    if (selectedStatus === 'late') return matchesSearch && matchesCircle && p.deviation.temporalDays < 0;
    if (selectedStatus === 'stalled') return matchesSearch && matchesCircle && p.status === 'stalled';
    if (selectedStatus === 'critical') return matchesSearch && matchesCircle && p.status === 'critical';
    if (selectedStatus === 'needs_reschedule') return matchesSearch && matchesCircle && p.status === 'needs_reschedule';
    if (selectedStatus === 'near_complete') return matchesSearch && matchesCircle && p.status === 'near_complete';
    
    return matchesSearch && matchesCircle;
  });

  // Calculate circle evaluation average
  const circleStats = useMemo(() => {
    const result: any = {};
    studentPlans.forEach(p => {
      if (!result[p.circleId]) {
        result[p.circleId] = {
          name: p.circleName,
          totalPoints: 0,
          count: 0,
          complianceSum: 0
        };
      }
      result[p.circleId].totalPoints += p.evaluation.points;
      result[p.circleId].complianceSum += (p.deviation.successProbability);
      result[p.circleId].count += 1;
    });

    return Object.keys(result).map(key => {
      const item = result[key];
      const avgPoints = Math.round(item.totalPoints / item.count);
      const avgCompliance = Math.round(item.complianceSum / item.count);
      return {
        id: key,
        name: item.name,
        avgPoints,
        avgCompliance,
        ratingClass: avgPoints >= 90 ? 'ممتاز (أ)' : avgPoints >= 80 ? 'جيد جداً (ب)' : 'مقبول (ج)'
      };
    });
  }, [studentPlans]);

  // Comparison plans data helper
  const planAObj = studentPlans.find(p => p.id === comparePlanA) || studentPlans[0];
  const planBObj = studentPlans.find(p => p.id === comparePlanB) || studentPlans[1];

  return (
    <div className="space-y-6 dir-rtl text-right" id="edu-planning-main-root" dir="rtl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-l from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold font-sans">منشئ الخطط التعليمية وإدارة التنفيذ</h1>
          </div>
          <p className="text-xs text-indigo-200">
            النظام المركزي الشامل لبناء، اعتماد، محاكاة وإعادة جدولة خطط الحفظ والمراجعة لطلاب الملتقى القرآني.
          </p>
        </div>
        
        {/* Quick Config / Settings Widget */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Settings className="w-4 h-4" />
            <span className="font-semibold">عتبات الإنذار الآلي:</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span>انحراف أيام:</span>
            <input 
              type="number" 
              className="w-10 bg-slate-800 text-white border border-slate-700 rounded px-1 text-center font-mono"
              value={alertThresholds.deviationDays} 
              onChange={e => setAlertThresholds({ ...alertThresholds, deviationDays: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span>نسبة حضور حدية:</span>
            <input 
              type="number" 
              className="w-12 bg-slate-800 text-white border border-slate-700 rounded px-1 text-center font-mono"
              value={alertThresholds.attendanceRate} 
              onChange={e => setAlertThresholds({ ...alertThresholds, attendanceRate: parseInt(e.target.value) || 0 })}
            />
            <span>%</span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('health')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'health' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          مركز صحة الخطط والتقييم
        </button>
        <button
          onClick={() => setActiveSubTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'library' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          مكتبة الخطط والأرشيف
        </button>
        <button
          onClick={() => setActiveSubTab('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'generator' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          المولد ومقياس الواقعية الذكي
        </button>
        <button
          onClick={() => setActiveSubTab('execution')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'execution' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4" />
          تسجيل التنفيذ ومتابعة الانحراف
        </button>
        <button
          onClick={() => setActiveSubTab('comparisons')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'comparisons' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          مقارنة الخطط ومؤشر الجودة
        </button>
        <button
          onClick={() => setActiveSubTab('print_portal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'print_portal' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          بوابة ولي الأمر والطباعة الاحترافية
        </button>
      </div>

      {/* TAB CONTENT 1: HEALTH CENTER */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          
          {/* Smart Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">إجمالي الخطط الفعالة</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{studentPlans.length}</h3>
                <span className="text-[10px] text-emerald-600">✓ ربط شامل بالمستويات</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">الخطط المتعثرة / الحرجة</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">
                  {studentPlans.filter(p => p.status === 'critical' || p.status === 'stalled').length}
                </h3>
                <span className="text-[10px] text-rose-500 font-medium">بحاجة تدخل وإعادة جدولة</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">متوسط الالتزام بالخطة</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">82.5%</h3>
                <span className="text-[10px] text-emerald-500 font-medium">مستقر إجمالاً</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">الطلبات المعلقة للاعتماد</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">
                  {studentPlans.filter(p => p.approvalStatus === 'pending').length}
                </h3>
                <span className="text-[10px] text-amber-500">مدرس ← مشرف ← إدارة</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Core Health Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Health Center filter and interactive lists */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">مركز صحة ومتابعة سلامة الخطط</h3>
                    <p className="text-[11px] text-slate-400">فرز وتصفية الخطط التعليمية لتلافي الهدر الزمني والكمي</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setSelectedStatus('all')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${selectedStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => setSelectedStatus('late')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${selectedStatus === 'late' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}
                    >
                      متأخر زمنياً ({studentPlans.filter(p => p.deviation.temporalDays < 0).length})
                    </button>
                    <button 
                      onClick={() => setSelectedStatus('critical')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${selectedStatus === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'}`}
                    >
                      حرج/متعثر ({studentPlans.filter(p => p.status === 'critical').length})
                    </button>
                    <button 
                      onClick={() => setSelectedStatus('needs_reschedule')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${selectedStatus === 'needs_reschedule' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'}`}
                    >
                      يحتاج جدولة
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="ابحث باسم الطالب أو الخطة..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                    value={selectedCircle}
                    onChange={e => setSelectedCircle(e.target.value)}
                  >
                    <option value="all">كل الحلقات</option>
                    <option value="circle-1">حلقة الإمام عاصم</option>
                    <option value="circle-2">حلقة الإمام البخاري</option>
                  </select>
                </div>

                {/* Table of plans health */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                        <th className="p-3">الطالب والحلقة</th>
                        <th className="p-3">نوع الخطة</th>
                        <th className="p-3">الانحراف الكمي والزمني</th>
                        <th className="p-3">اتجاه الأداء والنجاح</th>
                        <th className="p-3">الاعتماد</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPlans.map(plan => (
                        <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{plan.studentName}</p>
                            <span className="text-[10px] text-slate-400">{plan.circleName}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${plan.type === 'hifz' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                              {plan.type === 'hifz' ? 'خطة حفظ' : 'خطة مراجعة'}
                            </span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px] mt-1">{plan.templateName}</p>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className={`inline-block font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                plan.deviation.temporalDays >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {plan.deviation.temporalDays >= 0 ? `+${plan.deviation.temporalDays} أيام` : `${plan.deviation.temporalDays} أيام`}
                              </span>
                              <p className="text-[10px] text-slate-400">
                                {plan.deviation.quantitativePages >= 0 ? `متقدم ${plan.deviation.quantitativePages} وجه` : `متأخر ${Math.abs(plan.deviation.quantitativePages)} وجه`}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className={`font-bold font-mono ${plan.deviation.successProbability > 75 ? 'text-emerald-600' : plan.deviation.successProbability >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                {plan.deviation.successProbability}%
                              </span>
                              <span className="text-[9px] text-slate-400">(احتمال الختم)</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {plan.deviation.trend === 'improving' ? (
                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">✓ يتحسن</span>
                              ) : plan.deviation.trend === 'stable' ? (
                                <span className="text-[9px] text-slate-500 bg-slate-100 px-1 rounded">● ثابت</span>
                              ) : (
                                <span className="text-[9px] text-rose-600 bg-rose-50 px-1 rounded">⚠️ يتراجع</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              plan.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              plan.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {plan.approvalStatus === 'approved' ? 'معتمدة' :
                               plan.approvalStatus === 'pending' ? 'قيد الاعتماد' : 'تعديل مطلوب'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedPlanId(plan.id);
                                  setActiveSubTab('execution');
                                }}
                                title="عرض ومتابعة التنفيذ"
                                className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedPlanId(plan.id);
                                  setIsReschedulingOpen(true);
                                }}
                                title="إعادة جدولة فورية"
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automated Evaluation Section */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">التقييم الآلي لمستوى الطلاب</h3>
                    <p className="text-[11px] text-slate-400">احتساب ذكي للنقاط الكلية ومستوى الأداء بناء على معايير الانحراف</p>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">تحديث مستمر</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentPlans.map(sp => (
                    <div key={sp.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-xs text-slate-800">{sp.studentName}</p>
                        <p className="text-[10px] text-slate-400">{sp.templateName}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[9px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                            النقاط: {sp.evaluation.points} نقطة
                          </span>
                          <span className="text-[9px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            الالتزام: {sp.evaluation.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${
                          sp.evaluation.level === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
                          sp.evaluation.level === 'good' ? 'bg-blue-100 text-blue-800' :
                          sp.evaluation.level === 'average' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sp.evaluation.level === 'excellent' ? 'امتياز 🌟' :
                           sp.evaluation.level === 'good' ? 'جيد جداً' :
                           sp.evaluation.level === 'average' ? 'متوسط المقدار' : 'متعثر'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side column: Circle overall rankings & Smart alerts triggers */}
            <div className="space-y-6">
              
              {/* Circle Performance Cards */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-2">تقييم جودة الحلقات التعليمية</h3>
                <p className="text-[11px] text-slate-400 mb-4">متوسط الأداء الجماعي وتصنيف جودة الخطط المنجزة</p>

                <div className="space-y-3">
                  {circleStats.map(circ => (
                    <div key={circ.id} className="p-3 bg-indigo-50/30 rounded-lg border border-indigo-100/40">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-800">{circ.name}</span>
                        <span className="text-[10px] font-bold text-indigo-700">{circ.ratingClass}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>متوسط الالتزام:</span>
                          <span className="font-mono">{circ.avgCompliance}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${circ.avgCompliance}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Custom Alert center Integration */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">التنبيهات الذكية للخطط</h3>
                  <span className="p-1 bg-red-100 text-red-700 rounded-full text-[9px] font-bold">نشط</span>
                </div>

                <div className="space-y-2">
                  {studentPlans.some(p => p.deviation.temporalDays < alertThresholds.deviationDays) && (
                    <div className="p-2.5 rounded bg-rose-50 border-r-4 border-rose-500 text-[11px] text-rose-800 flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">تجاوز الحد الأقصى للانحراف الزمني</p>
                        <p className="text-[10px] text-rose-600/95 mt-0.5">عدد من الطلاب تأخروا بأكثر من {Math.abs(alertThresholds.deviationDays)} أيام عن المسار المخطط له.</p>
                      </div>
                    </div>
                  )}

                  {studentPlans.some(p => p.deviation.successProbability < alertThresholds.successProbLimit) && (
                    <div className="p-2.5 rounded bg-amber-50 border-r-4 border-amber-500 text-[11px] text-amber-800 flex gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">مخاطر عالية لعدم إكمال الخطط</p>
                        <p className="text-[10px] text-amber-600/95 mt-0.5">طالب أو أكثر يملك احتمال إنجاز نهائي أقل من {alertThresholds.successProbLimit}%.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded bg-emerald-50 border-r-4 border-emerald-500 text-[11px] text-emerald-800 flex gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">جاهزية التنسيق لولي الأمر</p>
                      <p className="text-[10px] text-emerald-600/95 mt-0.5">جميع الخطط المعتمدة تمت مزامنتها فوراً مع لوحة الآباء بنجاح.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LIBRARY & ARCHIVES */}
      {activeSubTab === 'library' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">مكتبة الخطط التعليمية المنهجية</h3>
                <p className="text-xs text-slate-400">قائمة الخطط الجاهزة للاستخدام من قبل المدرسين للطلاب</p>
              </div>
              <button 
                onClick={() => setIsNewTemplateModalOpen(true)}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                إنشاء خطة منهجية جديدة
              </button>
            </div>

            {/* Library Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.filter(t => !t.isArchived).map(tpl => (
                <div key={tpl.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${tpl.type === 'hifz' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {tpl.type === 'hifz' ? 'حفظ جديد فقط' : 'مراجعة وتثبيت'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-mono font-bold text-slate-700">{tpl.rating}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 mb-1">{tpl.name}</h4>
                    <p className="text-[10px] text-slate-400">المؤلف: {tpl.createdBy}</p>

                    <div className="grid grid-cols-2 gap-2 my-4 bg-slate-50 p-2.5 rounded text-[10px] text-slate-600 font-medium">
                      <div>
                        <span>المدة: </span>
                        <span className="text-slate-900 font-bold">{tpl.durationLabel}</span>
                      </div>
                      <div>
                        <span>الاستخدام: </span>
                        <span className="text-slate-900 font-bold">{tpl.usageCount} طالب</span>
                      </div>
                      <div>
                        <span>المدى: </span>
                        <span className="text-slate-900 font-bold">{tpl.targetRange.from} ← {tpl.targetRange.to}</span>
                      </div>
                      <div>
                        <span>السرعة: </span>
                        <span className="text-slate-900 font-bold">
                          {tpl.expectedPace === 'fast' ? 'سريعة' : tpl.expectedPace === 'normal' ? 'متوسطة' : 'متدرجة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button 
                      onClick={() => handleDuplicateTemplate(tpl)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      نسخ القالب
                    </button>
                    <button 
                      onClick={() => handleArchiveTemplate(tpl.id)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      أرشفة
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Circle Archives Specific Area */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-2">أرشيف الخطط التاريخية والمؤرشفة</h3>
              <p className="text-[11px] text-slate-400 mb-4">الخطط المستبعدة أو المنجزة تاريخياً للاسترجاع والتحسين</p>

              <div className="space-y-2">
                {templates.filter(t => t.isArchived).map(arch => (
                  <div key={arch.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{arch.name} <span className="text-[10px] text-rose-500">(مؤرشفة)</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">تاريخ الأرشفة: {arch.createdAt} • عدد مرات الاستخدام سابقاً: {arch.usageCount}</p>
                    </div>
                    <button 
                      onClick={() => handleRestoreTemplate(arch.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      استعادة للخزينة الفعالة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Template Modal Simulator */}
          {isNewTemplateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">إنشاء قالب خطة مهارية جديدة</h4>
                  <button onClick={() => setIsNewTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">اسم الخطة</label>
                    <input type="text" placeholder="مثال: خطة تثبيت الحزبين الأخيرين" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1">نوع المسار</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                        <option value="hifz">حفظ جديد فقط</option>
                        <option value="murajaah">مراجعة مخصصة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">المدة الكلية</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                        <option value="1_month">شهر</option>
                        <option value="3_months">3 أشهر</option>
                        <option value="6_months">6 أشهر</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-150 rounded text-[10px] text-rose-800">
                    ⚠️ تنويه معماري: يمنع دمج الحفظ والمراجعة بداخل نفس الخطة افتراضياً لضمان دقة احتساب نقاط الانحراف القياسية.
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button 
                    onClick={() => {
                      const newTpl: PlanTemplate = {
                        id: `tpl-${Date.now()}`,
                        name: 'خطة حفظ جزء تبارك المنهجية الجديدة',
                        type: 'hifz',
                        duration: '3_months',
                        durationLabel: '3 أشهر',
                        createdBy: 'الشيخ المدرس الحالي',
                        createdAt: new Date().toISOString().split('T')[0],
                        usageCount: 0,
                        rating: 5.0,
                        isArchived: false,
                        targetRange: { from: 'الملك', to: 'المرسلات' },
                        studyDaysPerWeek: 5,
                        vacationDays: ['جمعة'],
                        expectedPace: 'normal',
                        difficulty: 'medium'
                      };
                      setTemplates([newTpl, ...templates]);
                      setIsNewTemplateModalOpen(false);
                      alert('✅ تم تدوين وحفظ القالب الجديد بنجاح في الخزينة.');
                    }}
                    className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded text-xs hover:bg-indigo-700"
                  >
                    إقرار وحفظ
                  </button>
                  <button onClick={() => setIsNewTemplateModalOpen(false)} className="bg-slate-100 text-slate-600 font-bold px-4 py-1.5 rounded text-xs hover:bg-slate-200">إلغاء</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: SMART GENERATOR & ADVISOR & REALISM */}
      {activeSubTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Smart Inputs and Heuristics form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800">بناء وتوليد الخطط الذكي بالملتقى</h3>
            <p className="text-xs text-slate-400">يقوم المحرك تلقائياً بقراءة وتحليل بيانات الطالب ومستوى الحضور لاقتراح الخطة الأقرب للواقعية</p>

            <form onSubmit={handleGeneratePlan} className="space-y-4 text-xs text-slate-600">
              
              <div className="bg-indigo-50/50 p-3 rounded-lg space-y-2">
                <span className="font-bold text-indigo-800 block text-[11px]">تحليل بيانات الطالب المتقدم (قبل البناء)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">نسبة الحضور السابقة (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5"
                      value={genAttendanceRate}
                      onChange={e => setGenAttendanceRate(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">الالتزام بالتكرار (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5"
                      value={genCommitmentRate}
                      onChange={e => setGenCommitmentRate(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleRecommendPlan}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1.5 rounded text-[10px] mt-2"
                >
                  تشغيل محرك الاقتراح الاستشاري
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">نوع الخطة المراد توليدها</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2"
                    value={generatorType}
                    onChange={e => setGeneratorType(e.target.value as any)}
                  >
                    <option value="hifz">حفظ جديد فقط</option>
                    <option value="murajaah">مراجعة وتكرار مخصص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">مدة الخطة المستهدفة</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2"
                    value={genDuration}
                    onChange={e => setGenDuration(e.target.value)}
                  >
                    <option value="1_month">أسبوعان إلى شهر واحد</option>
                    <option value="3_months">3 أشهر (فصل دراسي)</option>
                    <option value="6_months">6 أشهر (نصف سنوي)</option>
                    <option value="custom">فترة مخصصة بالكامل</option>
                  </select>
                </div>
              </div>

              {generatorType === 'hifz' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
                  <div>
                    <label className="block text-slate-500 mb-1">حفظ جديد من سورة</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5" 
                      value={genTargetFrom}
                      onChange={e => setGenTargetFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">إلى سورة</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5" 
                      value={genTargetTo}
                      onChange={e => setGenTargetTo(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/40 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-slate-500 mb-1">مقدار المراجعة المستهدف</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5" 
                      value={genRevisionAmount}
                      onChange={e => setGenRevisionAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">نطاق المراجعة الكلي</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded p-1.5" 
                      value={genRevisionRange}
                      onChange={e => setGenRevisionRange(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">أيام الدراسة بالأسبوع</label>
                  <input 
                    type="number" 
                    max="7" 
                    min="1" 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2"
                    value={genStudyDays}
                    onChange={e => setGenStudyDays(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">سرعة الإنجاز المتوقعة</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2"
                    value={genPace}
                    onChange={e => setGenPace(e.target.value as any)}
                  >
                    <option value="slow">متدرج مريح</option>
                    <option value="normal">متوسط قياسي</option>
                    <option value="fast">سريع مكثف</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded shadow"
                >
                  توليد الخطة واحتساب المقادير اليومية
                </button>
              </div>
            </form>
          </div>

          {/* Outputs and Realism display */}
          <div className="space-y-6">
            {generatedDraft ? (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-6">
                
                {/* Simulated outputs */}
                <div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded">مخرجات الحساب التلقائي</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">{generatedDraft.name}</h3>
                  
                  <div className="grid grid-cols-3 gap-3 my-4">
                    <div className="p-3 bg-indigo-50/40 rounded border border-indigo-100 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">المقدار اليومي</span>
                      <span className="text-xs font-bold text-slate-800 font-mono mt-1 block">{generatedDraft.dailyAmt || '1.5 صفحة'}</span>
                    </div>
                    <div className="p-3 bg-indigo-50/40 rounded border border-indigo-100 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">المقدار الأسبوعي</span>
                      <span className="text-xs font-bold text-slate-800 font-mono mt-1 block">{generatedDraft.weeklyAmt || '7.5 صفحات'}</span>
                    </div>
                    <div className="p-3 bg-indigo-50/40 rounded border border-indigo-100 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">المقدار الشهري</span>
                      <span className="text-xs font-bold text-slate-800 font-mono mt-1 block">{generatedDraft.monthlyAmt || '30 صفحة'}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation Advisor Heuristic */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 block">💡 توصية محرك الاقتراح الذكي:</span>
                  <p className="text-[11px] text-slate-600">{generatedDraft.description}</p>
                </div>

                {/* Section 4: Realism / Risk Index */}
                <div className={`p-4 rounded-xl border ${generatedDraft.realismColor}`}>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      مؤشر واقعية الخطة المقترحة:
                    </span>
                    <span className="font-bold text-sm underline">{generatedDraft.realism}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] my-3">
                    <div>
                      <span>درجة المخاطرة: </span>
                      <span className="font-bold">{generatedDraft.riskLevel}</span>
                    </div>
                    <div>
                      <span>احتمال النجاح المتوقع: </span>
                      <span className="font-bold">{generatedDraft.successProb}%</span>
                    </div>
                  </div>

                  {generatedDraft.riskReasons && generatedDraft.riskReasons.length > 0 && (
                    <div className="text-[10px] text-slate-600/90 border-t border-slate-200 pt-2 space-y-1">
                      <p className="font-bold">أسباب تقييم المخاطرة والواقعية:</p>
                      {generatedDraft.riskReasons.map((reason: string, idx: number) => (
                        <p key={idx}>{reason}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 5: Customized Approval Path Selection */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">تخصيص مسار الاعتماد الإداري</h4>
                  
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <button 
                      type="button" 
                      onClick={() => setCustomApprovalPath('teacher_supervisor')}
                      className={`p-2 rounded border text-center ${customApprovalPath === 'teacher_supervisor' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      مدرس ← مشرف
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomApprovalPath('teacher_supervisor_branch')}
                      className={`p-2 rounded border text-center ${customApprovalPath === 'teacher_supervisor_branch' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      مدرس ← مشرف ← فرع
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomApprovalPath('teacher_supervisor_gm')}
                      className={`p-2 rounded border text-center ${customApprovalPath === 'teacher_supervisor_gm' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      مدرس ← مشرف ← مدير عام
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">ملاحظات ومرئيات مقدم الطلب</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs h-16 outline-none focus:border-indigo-500"
                      placeholder="اكتب أي ملاحظات لتسهيل عملية الاعتماد من قبل المشرفين..."
                      value={approvalNotes}
                      onChange={e => setApprovalNotes(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={handleSaveDraftToActive}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded text-xs shadow"
                  >
                    اعتماد وإدراج الخطة بملف الطالب مباشرة
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center text-xs text-slate-400">
                <Sliders className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <span>الرجاء ملء إعدادات البناء في النموذج الأيمن وتوليد المخرجات لعرض واقعية الخطة والتحليل الإحصائي هنا.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT 4: EXECUTION, LOGGING & RESCHEDULING */}
      {activeSubTab === 'execution' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Students List to pick from */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">اختر خطة الطالب للمتابعة</h3>
            <p className="text-[11px] text-slate-400">سجل الإنجاز والنسخ وإدارة الانحراف للطلاب النشطين</p>

            <div className="space-y-2">
              {studentPlans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-lg border text-right cursor-pointer transition-all ${
                    plan.id === selectedPlanId 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-slate-800">{plan.studentName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      plan.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      plan.status === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {plan.status === 'active' ? 'مستقر' : plan.status === 'critical' ? 'حرج' : 'متعثر'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{plan.templateName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Execution, Milestones & Logging */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
              
              {/* Header profile of active plan */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{activePlan.studentName}</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                      الإصدار {activePlan.currentVersion}v
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">الخطة: {activePlan.templateName} • نوع التنفيذ المحدد: {activePlan.executionMode === 'daily' ? 'يومي' : 'أسبوعي'}</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsReschedulingOpen(true)}
                    className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                    إعادة جدولة الخطة
                  </button>
                </div>
              </div>

              {/* Section 9: Advanced Deviation tracking details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">الانحراف الزمني والكمي</span>
                  <span className={`text-base font-mono font-bold block ${activePlan.deviation.temporalDays >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {activePlan.deviation.temporalDays >= 0 ? `متقدم بـ ${activePlan.deviation.temporalDays} أيام` : `متأخر بـ ${Math.abs(activePlan.deviation.temporalDays)} أيام`}
                  </span>
                  <span className="text-[9px] text-slate-400">انحراف صفحات: {activePlan.deviation.quantitativePages} وجه</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">التوقعات والتنبؤات المستقبلية</span>
                  <span className="text-xs font-bold text-slate-800 block">تاريخ الختم المتوقع</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 block">{activePlan.deviation.forecastedCompletion}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">نسبة الالتزام والنجاح</span>
                  <span className={`text-base font-mono font-bold block ${activePlan.deviation.successProbability > 70 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {activePlan.deviation.successProbability}%
                  </span>
                  <span className="text-[9px] text-slate-400">احتمالية إنهاء المنهج بالكامل</span>
                </div>
              </div>

              {/* Section 11: Milestones (الأهداف المرحلية) */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-3">الأهداف المرحلية للخطط الطويلة</h4>
                <div className="space-y-3">
                  {activePlan.milestones.map(mile => (
                    <div key={mile.id} className="p-3 rounded-lg border border-slate-100 bg-white shadow-xs">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">{mile.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          mile.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          mile.status === 'active' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mile.status === 'completed' ? 'منجزة كلياً' :
                           mile.status === 'active' ? 'قيد التنفيذ النشط' : 'قيد الانتظار'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>المستهدف: {mile.target}</span>
                          <span>{mile.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${mile.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Versioning History (عدم الكتابة فوق الخطط السابقة) */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-1.5 mb-3 text-slate-800">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold">سجل إصدارات الخطة للفرد وتفاصيل التغيير</h4>
                </div>
                
                <div className="space-y-3">
                  {activePlan.versions.map(ver => (
                    <div key={ver.version} className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200/50">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>الإصدار رقم {ver.version}</span>
                        <span>{ver.date} • {ver.modifier}</span>
                      </div>
                      <p className="font-bold text-slate-800 mb-1">سبب التعديل: {ver.reason}</p>
                      <p className="text-[11px] text-slate-600 font-medium">الفروقات المنهجية: {ver.differences}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7 & 8: Log Actual Performance */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800">تسجيل الإنجاز الفعلي اليومي للطالب</h4>
                
                <form onSubmit={handleAddProgressLog} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">من سورة / صفحة</label>
                    <input 
                      type="text" 
                      placeholder="مثال: البقرة آية 40" 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
                      value={logFrom}
                      onChange={e => setLogFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">إلى سورة / صفحة</label>
                    <input 
                      type="text" 
                      placeholder="مثال: البقرة آية 60" 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
                      value={logTo}
                      onChange={e => setLogTo(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1">ملاحظات التسميع والتجويد</label>
                    <input 
                      type="text" 
                      placeholder="مثال: تثبيت مخارج الحروف للياء والواو متميز" 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
                      value={logNotes}
                      onChange={e => setLogNotes(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-1.5 rounded"
                    >
                      حفظ إنجاز اليوم وتحديث المؤشرات
                    </button>
                  </div>
                </form>

                {/* Log history list */}
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] text-slate-400 block font-bold">سجل العمليات الأخير لهذا الملف:</span>
                  {progressLogs.filter(log => log.studentId === activePlan.studentId).map(log => (
                    <div key={log.id} className="p-2.5 rounded bg-slate-50 text-[11px] text-slate-600 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{log.amount}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">تاريخ الحفظ: {log.date} • المنفذ: {log.executor}</p>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold italic">{log.notes}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Rescheduling Modal Simulator */}
          {isReschedulingOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-right space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">إعادة جدولة فورية للخطة المنهجية</h4>
                  <button onClick={() => { setIsReschedulingOpen(false); setSimulatedPlan(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">سبب إعادة الجدولة</label>
                    <select 
                      value={rescheduleReason} 
                      onChange={e => setRescheduleReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                    >
                      <option value="absence">غياب متكرر للطالب</option>
                      <option value="weak_progress">ضعف الإنجاز والمستوى</option>
                      <option value="illness">مرض أو عذر مقبول</option>
                      <option value="vacation">إجازة سنوية</option>
                      <option value="transfer">نقل الطالب لحلقة أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">النمط الجديد لإعادة البناء</label>
                    <select 
                      value={rescheduleOption} 
                      onChange={e => setRescheduleOption(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-indigo-700 font-bold"
                    >
                      <option value="redistribute">إعادة توزيع المتبقي (زيادة الضغط)</option>
                      <option value="extend">تمديد المدة الكلية (إطالة الموعد)</option>
                      <option value="modify_target">تعديل الهدف (تقليل المقدار الكلي)</option>
                      <option value="rebuild">إعادة بناء كاملة للخطة</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleSimulateReschedule}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 text-xs rounded"
                >
                  تشغيل محاكاة التعديل الذكية
                </button>

                {simulatedPlan && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3 text-xs">
                    <span className="font-bold text-indigo-800 block text-[11px]">نتائج محاكاة سيناريو التعديل المقترح:</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] my-2">
                      <div className="bg-white p-2 rounded">
                        <span>المدة المقترحة</span>
                        <p className="font-bold text-slate-800 mt-1">{simulatedPlan.newDuration}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span>المقدار اليومي الجديد</span>
                        <p className="font-bold text-slate-800 mt-1">{simulatedPlan.newDaily}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span>احتمال النجاح الجديد</span>
                        <p className="font-bold text-emerald-600 font-mono mt-1">{simulatedPlan.simulatedProb}%</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{simulatedPlan.impact}</p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3">
                  <button 
                    onClick={handleApplyReschedule}
                    disabled={!simulatedPlan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded text-xs disabled:opacity-50"
                  >
                    اعتماد الجدولة وإنشاء الإصدار الجديد
                  </button>
                  <button onClick={() => { setIsReschedulingOpen(false); setSimulatedPlan(null); }} className="bg-slate-100 text-slate-600 font-bold px-4 py-2 rounded text-xs hover:bg-slate-200">إلغاء</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 5: COMPARISONS & QUALITY INDEX */}
      {activeSubTab === 'comparisons' && (
        <div className="space-y-6">
          
          {/* Section 13: Plan Quality Index (مؤشر جودة الخطط) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2">مؤشر جودة وموثوقية الخطط المعتمدة</h3>
            <p className="text-[11px] text-slate-400 mb-4">تقييم سلامة هيكلة الخطط بناء على الإكمال والاستمرارية التاريخية</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 text-center space-y-1">
                <span className="text-xl">⭐</span>
                <h4 className="text-xs font-bold text-slate-800">حفظ مكثف (جزء عم)</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">ممتازة (92%)</span>
                <p className="text-[10px] text-slate-500 pt-1">استمرارية عالية ومعدل تعثر شبه منعدم للأطفال.</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 text-center space-y-1">
                <span className="text-xl">📈</span>
                <h4 className="text-xs font-bold text-slate-800">مراجعة البقرة المنهجية</h4>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">جيدة جداً (85%)</span>
                <p className="text-[10px] text-slate-500 pt-1">معدل الإكمال الفعلي يتطابق مع المستهدف بشكل مستقر.</p>
              </div>

              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 text-center space-y-1">
                <span className="text-xl">⚠️</span>
                <h4 className="text-xs font-bold text-slate-800">تأسيس الصغار (6 أشهر)</h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">متوسطة (64%)</span>
                <p className="text-[10px] text-slate-500 pt-1">تحتاج لتكرار فترات المراجعة للتحكم في الانفصال اللغوي.</p>
              </div>

              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 text-center space-y-1">
                <span className="text-xl">❌</span>
                <h4 className="text-xs font-bold text-slate-800">الخطط المعجلة فائقة المجهود</h4>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">ضعيفة (41%)</span>
                <p className="text-[10px] text-slate-500 pt-1">مستوى انحراف كبير ومعدل تمديد متواصل مستمر.</p>
              </div>
            </div>
          </div>

          {/* Section 14: Side-by-Side Plan Comparisons */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">مقارنة الخطط ومخرجات التحليل التفاعلية</h3>
                <p className="text-[11px] text-slate-400">تحليل مقارن مباشر لقياس الكفاءة والإنتاجية بين مسارين</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الخطة الأولى للمقارنة</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs"
                  value={comparePlanA}
                  onChange={e => setComparePlanA(e.target.value)}
                >
                  {studentPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.studentName} ({p.templateName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الخطة الثانية للمقارنة</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs"
                  value={comparePlanB}
                  onChange={e => setComparePlanB(e.target.value)}
                >
                  {studentPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.studentName} ({p.templateName})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-slate-50 text-slate-600 font-bold p-3 border-b border-slate-200 text-center">
                <span>المؤشر المقارن</span>
                <span className="text-indigo-700">{planAObj?.studentName}</span>
                <span className="text-emerald-700">{planBObj?.studentName}</span>
              </div>

              <div className="divide-y divide-slate-150">
                <div className="grid grid-cols-3 p-3 text-center hover:bg-slate-50/50">
                  <span className="font-bold text-slate-600">المستهدف والنوع</span>
                  <span>{planAObj?.type === 'hifz' ? 'حفظ جديد' : 'مراجعة'}</span>
                  <span>{planBObj?.type === 'hifz' ? 'حفظ جديد' : 'مراجعة'}</span>
                </div>

                <div className="grid grid-cols-3 p-3 text-center hover:bg-slate-50/50">
                  <span className="font-bold text-slate-600">متوسط النجاح المتوقع</span>
                  <span className="font-mono font-bold text-indigo-600">{planAObj?.deviation.successProbability}%</span>
                  <span className="font-mono font-bold text-emerald-600">{planBObj?.deviation.successProbability}%</span>
                </div>

                <div className="grid grid-cols-3 p-3 text-center hover:bg-slate-50/50">
                  <span className="font-bold text-slate-600">الانحراف الزمني الفعلي</span>
                  <span className="font-mono">{planAObj?.deviation.temporalDays} أيام</span>
                  <span className="font-mono">{planBObj?.deviation.temporalDays} أيام</span>
                </div>

                <div className="grid grid-cols-3 p-3 text-center hover:bg-slate-50/50">
                  <span className="font-bold text-slate-600">المقدار اليومي المعتمد</span>
                  <span className="font-mono">{planAObj?.targets.dailyAmount}</span>
                  <span className="font-mono">{planBObj?.targets.dailyAmount}</span>
                </div>

                <div className="grid grid-cols-3 p-3 text-center hover:bg-slate-50/50">
                  <span className="font-bold text-slate-600">كفاءة الالتزام والنشاط</span>
                  <span className="font-bold">{planAObj?.evaluation.level === 'excellent' ? 'امتياز' : planAObj?.evaluation.level === 'good' ? 'جيد جداً' : 'مقبول'}</span>
                  <span className="font-bold">{planBObj?.evaluation.level === 'excellent' ? 'امتياز' : planBObj?.evaluation.level === 'good' ? 'جيد جداً' : 'مقبول'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 6: PROFESSIONAL PRINTING & PARENT VIEW PORTAL */}
      {activeSubTab === 'print_portal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section 15: Printing Formats preview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">قوالب الطباعة والتبادل المهني</h3>
                <p className="text-[11px] text-slate-400">توليد ملفات ومستندات ورقية فورية قابلة للتداول والتوقيع</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert('🖨️ تم إرسال قالب الطباعة إلى نظام التشغيل وجاري التجهيز...')}
                  className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة المستند الحالي
                </button>
              </div>
            </div>

            {/* Print Selection formats */}
            <div className="space-y-6 text-xs text-slate-700">
              
              {/* Student simple print format */}
              <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700 text-[10px] bg-indigo-100 px-2 py-0.5 rounded">النسخة الأولى: نسخة الطالب (مختصرة وبسيطة)</span>
                  <span className="text-[10px] text-slate-400">جاهزة للتثبيت على كتاب الطالب</span>
                </div>
                
                <div className="bg-white p-4 border border-slate-250 rounded shadow-sm text-center space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 font-sans">جدول الحفظ اليومي الخاص بالطالب: {activePlan.studentName}</h4>
                  <p className="text-[11px] text-slate-500">مسار خطة: {activePlan.templateName} ({activePlan.startDate} إلى {activePlan.endDate})</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-right text-[10px] border border-slate-100 p-2.5 rounded bg-slate-50">
                    <div><span>المقدار اليومي: </span><strong className="text-indigo-600">{activePlan.targets.dailyAmount}</strong></div>
                    <div><span>أيام الدراسة بالأسبوع: </span><strong>5 أيام</strong></div>
                    <div><span>منهج الأسبوع الحالي: </span><strong>من بداية جزء تبارك</strong></div>
                    <div><span>التكليف المالي بالمنزل: </span><strong>تثبيت ساعة قبل النوم</strong></div>
                  </div>
                </div>
              </div>

              {/* Parent print format */}
              <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-700 text-[10px] bg-emerald-100 px-2 py-0.5 rounded">النسخة الثانية: نسخة ولي الأمر (الخطة والمتابعة المنزلية)</span>
                  <span className="text-[10px] text-slate-400">تتضمن التنبيهات ونسب الإنجاز</span>
                </div>
                
                <div className="bg-white p-4 border border-slate-250 rounded shadow-sm space-y-3">
                  <div className="text-center border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 font-sans text-xs">إقرار ومتابعة ولي الأمر الكريم</h4>
                    <p className="text-[10px] text-slate-400 mt-1">الرجاء تدوين التسميع اليومي والتوقيع أدناه لمزامنة الملف التربوي</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-400 block">الإنجاز الفعلي</span>
                      <strong className="text-slate-800">{activePlan.evaluation.percentage}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-400 block">التقدم أو التأخر</span>
                      <strong className={activePlan.deviation.temporalDays >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                        {activePlan.deviation.temporalDays >= 0 ? `متقدم ${activePlan.deviation.temporalDays} أيام` : `متأخر ${Math.abs(activePlan.deviation.temporalDays)} أيام`}
                      </strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-400 block">المتبقي للختم</span>
                      <strong className="text-indigo-600">45 وجه</strong>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-amber-50 p-2.5 rounded border border-amber-200">
                    <strong>📌 ملاحظة هامة للمنزل:</strong> الطالب يحتاج لتشجيع مكثف هذا الأسبوع بسبب انخفاض طفيف في تكرار الغنة والمدود.
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 16: Parent View Portal Synchronizer */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-sans">بوابة ومحاكاة شاشة ولي الأمر</h3>
            </div>
            <p className="text-[11px] text-slate-400">هذه هي الشاشة والبيانات التي تظهر تلقائياً للوالد داخل حسابه المتصل بالملتقى فور إقرار الاعتمادات.</p>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold">{activePlan.studentName}</p>
                  <span className="text-[9px] text-indigo-300">مرحباً بولي الأمر الكريم</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-bold">نشط حالياً</span>
              </div>

              <div className="p-3 bg-white/5 rounded-lg text-xs space-y-2">
                <span className="text-[10px] text-indigo-300 font-bold block">📊 تفاصيل الخطة الحالية لأبنكم:</span>
                <p className="font-bold text-slate-200 text-[11px]">{activePlan.templateName}</p>
                
                <div className="flex justify-between text-[10px] pt-1">
                  <span>المستهدف الإجمالي للحفظ:</span>
                  <span className="text-emerald-400 font-bold">سورتي النبأ والناس</span>
                </div>
                
                <div className="flex justify-between text-[10px]">
                  <span>تاريخ الموعد المتوقع للختم:</span>
                  <span className="font-mono text-indigo-300">{activePlan.deviation.forecastedCompletion}</span>
                </div>
              </div>

              {/* Attendance and compliance rate for parent screen */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>نسبة الإنجاز والمطابقة الفعلية:</span>
                  <span className="font-bold text-emerald-400">{activePlan.evaluation.percentage}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${activePlan.evaluation.percentage}%` }}></div>
                </div>
              </div>

              {/* Smart notification flags for parents */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] text-slate-400 block font-bold">التنبيهات المباشرة الواردة لولي الأمر:</span>
                {activePlan.deviation.temporalDays < 0 ? (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-900/50 text-[10px] text-rose-300">
                    ⚠️ الطالب متأخر بـ {Math.abs(activePlan.deviation.temporalDays)} أيام عن الجدول المحدد له في الخطة. يرجى الدعم المنزلي.
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/50 text-[10px] text-emerald-300">
                    ✓ تقدم ممتاز! الطالب يسير بانتظام تام وتخطى الأهداف المرحلية بنجاح كبير.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
