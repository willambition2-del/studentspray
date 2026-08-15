/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Target, Award, ClipboardList, Shield, Play, Activity, 
  Settings, Users, CheckCircle, RefreshCw, Plus, Calendar, AlertTriangle, 
  TrendingUp, History, Download, Printer, Copy, AlertCircle, Share2, Star,
  Eye, Archive, RotateCcw, ChevronRight, HelpCircle, Check, X, FileText, 
  TrendingDown, Layers, Map, MessageSquare, ArrowLeftRight, CheckSquare, Edit3, XCircle,
  Bell, Send, CheckCircle2, Clock, UserCheck, CornerDownLeft, FileCheck, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STAFF_DIRECTORY, PersonItem } from './TrackingAlertsHub';

// === INTERNAL TYPES ===
export interface CorporatePlan {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'strategic';
  duration: string;
  startDate: string;
  endDate: string;
  owner: string;
  description: string;
  vision: string;
  mission: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'completed' | 'archived' | 'stalled';
}

export interface StrategicGoal {
  id: string;
  parentId: string | null; // hierarchy
  name: string;
  description: string;
  owner: string;
  indicators: string[];
  weight: number; // percentage
  progress: number; // 0-100
  status: 'not_started' | 'active' | 'stalled' | 'completed' | 'archived';
}

export interface CompletionReport {
  submittedAt: string;
  submittedBy: string;
  submitterRole?: string;
  summaryNotes: string;      // تقرير الإنجاز
  durationTaken: string;     // المدة المستغرقة
  methodology: string;       // الكيفية والإنتاجية
  outputs?: string;          // المخرجات والروابط
}

export interface ManagementReview {
  reviewedAt: string;
  reviewedBy: string;
  feedbackNotes: string;     // تعقيب وملاحظات الإدارة
  status: 'approved' | 'rejected' | 'revision_requested';
}

export interface StaffNotificationItem {
  id: string;
  personId: string; // ID from STAFF_DIRECTORY or 'all' or 'management'
  personName: string;
  title: string;
  message: string;
  createdAt: string;
  relatedItemId?: string;
  relatedItemType?: 'initiative' | 'task';
  isRead: boolean;
  type: 'assignment' | 'report_submitted' | 'management_feedback' | 'decision';
}

export interface Initiative {
  id: string;
  planId: string;
  goalId: string;
  goalName?: string;         // الهدف الاستراتيجي المرتبط (قابلة للتعديل)
  name: string;
  type: 'initiative' | 'project' | 'program' | 'activity';
  description: string;
  owner: string;             // الشخص المسؤول عن التنفيذ (من الدليل)
  ownerPersonId?: string;    // ID in STAFF_DIRECTORY
  assignedRole?: string;     // المسمى الوظيفي
  nextRole?: string;         // أين ينتقل الدور بعد ذلك
  startDate: string;         // تاريخ بداية المبادرة
  endDate: string;           // تاريخ نهاية المبادرة
  progress: number;
  status: 'draft' | 'pending' | 'active' | 'review_pending' | 'completed' | 'stalled' | 'cancelled' | 'closed';
  expectedImpact: string;
  actualImpact?: string;
  impactRatio?: number;      // 0-100
  isRecurring?: boolean;
  budget?: string;
  closedAt?: string;
  workingDays?: number;
  closeReason?: string;
  completionReport?: CompletionReport;
  managementReview?: ManagementReview;
}

export interface ExecutiveTask {
  id: string;
  initiativeId: string;
  parentId: string | null;   // sub-tasks
  name: string;
  owner: string;             // من أوكل المهمة (الإدارة)
  assignee?: string;         // الموكل إليه المباشر (من الكادر)
  assigneePersonId?: string; // ID in STAFF_DIRECTORY
  assigneeRole?: string;     // دور المستلم
  currentRoleHolder?: string;
  handoverTo?: string;
  startDate: string;
  dueDate: string;
  progress: number;
  status: 'new' | 'active' | 'review_pending' | 'delayed' | 'completed' | 'cancelled' | 'closed';
  closedAt?: string;
  workingDays?: number;
  closeNotes?: string;
  completionReport?: CompletionReport;
  managementReview?: ManagementReview;
}

export interface FollowUpRecord {
  id: string;
  planId: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  date: string;
  achieved: string;
  notAchieved: string;
  bottleneckReason: string;
  correctiveActions: string;
  submitter: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  agenda: string;
  decisions: string[];
  recommendations: string[];
  relatedType: 'plan' | 'goal' | 'project' | 'initiative';
  relatedId: string;
}

export interface AdminDecision {
  id: string;
  planId: string;
  type: 'approve' | 'edit' | 'cancel' | 'extend' | 'reschedule' | 'close';
  date: string;
  owner: string; // صادر من (الجهة/الشخص)
  assignedTo?: string; // الموجه إليه لتنفيذ القرار
  currentRoleHolder?: string; // المسؤول المباشر عن متابعة التنفيذ الآن
  targetDepartment?: string; // الفرع أو الحلقة أو الإدارة المعنية
  reason: string;
  status?: 'active' | 'completed' | 'closed';
  closedAt?: string;
  workingDays?: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: string;
  successFactors: string;
  bottlenecks: string;
  lessons: string;
  recommendations: string;
}

// === INITIAL MOCK DATA ===
const initialPlans: CorporatePlan[] = [
  {
    id: 'plan-1',
    name: 'الخطة الاستراتيجية الخمسية للملتقى (٢٠٢٥ - ٢٠٣٠)',
    type: 'strategic',
    duration: '٥ سنوات',
    startDate: '2025-01-01',
    endDate: '2030-12-31',
    owner: 'د. خالد المزروعي (المدير العام)',
    description: 'تحقيق الريادة العالمية في تأهيل حفظة كتاب الله تعالى وتطوير الكفاءات المهنية للمعلمين.',
    vision: 'ملتقى ريادي عالمي يبني جيلاً قرآنياً متميزاً.',
    mission: 'تقديم برامج تعليمية قرآنية ذات جودة عالية مستندة لأحدث الأساليب التقنية والمعايير التربوية.',
    status: 'active'
  },
  {
    id: 'plan-2',
    name: 'الخطة التشغيلية السنوية لعام ٢٠٢٦',
    type: 'annual',
    duration: 'سنة كاملة',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    owner: 'الشيخ عبدالرحمن الصاوي',
    description: 'تعزيز الحضور الطلابي وتوسيع أعداد الحلقات النموذجية لتشمل الفئات الأكثر احتياجاً.',
    vision: 'حلقات متماسكة ونسب تسرب لا تتجاوز ٥٪.',
    mission: 'تطبيق التقييم الذكي وحوافز الأوسمة الذهبية للطلاب والمدرسين.',
    status: 'active'
  },
  {
    id: 'plan-3',
    name: 'الخطة الربعية للربع الثالث لعام ٢٠٢٦',
    type: 'quarterly',
    duration: '٣ أشهر',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    owner: 'أحمد سالم (مشرف البرامج)',
    description: 'تنشيط الأنشطة الصيفية وتكريم الحلقات النموذجية.',
    vision: 'مشاركة ٩٠٪ من طلاب الملتقى.',
    mission: 'إنجاز المبادرة الرمضانية والصيفية بنجاح واقتدار.',
    status: 'pending'
  }
];

const initialGoals: StrategicGoal[] = [
  {
    id: 'goal-1',
    parentId: null,
    name: 'الرفع من جودة الحفظ والاتقان لطلاب الملتقى',
    description: 'تقليل نسب الأخطاء في الاختبارات السنوية وزيادة عدد المجازين بالسند المتصل.',
    owner: 'أ.د. يوسف الشاوي',
    indicators: ['نسبة النجاح بالاختبارات السنوية > ٩٥٪', 'عدد الحاصلين على السند'],
    weight: 40,
    progress: 75,
    status: 'active'
  },
  {
    id: 'goal-1-1',
    parentId: 'goal-1',
    name: 'تدريب المدرسين على آليات التقييم الموحدة',
    description: 'تطبيق معايير محرك الأوزان الجديد والتقييم المستمر دون ثغرات.',
    owner: 'الشيخ عبدالرحمن الصاوي',
    indicators: ['نسبة حضور المدرسين للدورات التنشيطية'],
    weight: 20,
    progress: 90,
    status: 'active'
  },
  {
    id: 'goal-1-2',
    parentId: 'goal-1',
    name: 'تفعيل التنبيهات والإنذارات المبكرة للتعثر الحركي',
    description: 'الاستفادة من مؤشرات انحراف الأيام لمعالجة الحالات فوراً قبل الفوات.',
    owner: 'مركز الدعم التعليمي',
    indicators: ['سرعة الاستجابة للإنذار الحرجة < ٤٨ ساعة'],
    weight: 20,
    progress: 60,
    status: 'active'
  },
  {
    id: 'goal-2',
    parentId: null,
    name: 'التوسع الجغرافي والنوعي لبرامج الملتقى',
    description: 'إنشاء فروع جديدة وحلقات مسائية نموذجية للموظفين والجامعيين.',
    owner: 'أ. ياسر الحربي',
    indicators: ['عدد الفروع النشطة الجديدة', 'عدد الحلقات النموذجية المستحدثة'],
    weight: 30,
    progress: 45,
    status: 'active'
  },
  {
    id: 'goal-3',
    parentId: null,
    name: 'الحوكمة وضمان الملاءة المالية للملتقى',
    description: 'بناء شراكات مستدامة واستثمار ريعي يغطي المكافآت التقديرية للمعلمين بانتظام.',
    owner: 'أحمد البارقي (المدير المالي)',
    indicators: ['نسبة الاكتفاء الذاتي المالي من الأوقاف'],
    weight: 30,
    progress: 80,
    status: 'completed'
  }
];

const initialInitiatives: Initiative[] = [
  {
    id: 'init-1',
    planId: 'plan-2',
    goalId: 'goal-1',
    name: 'برنامج الأوسمة الذهبية والتقدير المستمر لطلاب الملتقى',
    type: 'initiative',
    description: 'ربط الحفظ والمواظبة بنظام حوافز معنوي وعيني يدعم تميز الطلاب النفسي.',
    owner: 'الشيخ عبدالرحمن الصاوي',
    startDate: '2026-01-01',
    endDate: '2026-10-31',
    progress: 85,
    status: 'active',
    expectedImpact: 'رفع نسبة الحضور والمراجعة بمعدل ٢٠٪ وتصفير التسرب التلقائي.',
    actualImpact: 'تم تقليص الغياب بنسبة ٢٥٪ وارتفع الحفظ بمعدل صفحة ونصف أسبوعياً للطلاب الفعالين.',
    impactRatio: 90,
    isRecurring: true
  },
  {
    id: 'init-2',
    planId: 'plan-2',
    goalId: 'goal-2',
    name: 'المشروع النموذجي لحلقات النخبة بالمنطقة الغربية',
    type: 'project',
    description: 'إقامة ٥ حلقات لطلاب الموهبة اللغوية المتميزين للحفظ المكثف في سنة واحدة.',
    owner: 'أ. ياسر الحربي',
    startDate: '2026-02-15',
    endDate: '2026-12-15',
    progress: 40,
    status: 'active',
    expectedImpact: 'تخريج ٤٠ حافظاً متقناً لـ ١٥ جزءاً على الأقل بنهاية العام.',
    actualImpact: 'تم تجميع الحلقات، والتقدم يسير وفق الخطة بـ ١٢ حافظاً متقناً للمرحلة الأولى.',
    impactRatio: 65,
    isRecurring: false
  },
  {
    id: 'init-3',
    planId: 'plan-2',
    goalId: 'goal-1-2',
    name: 'البرنامج الرمضاني السنوي للتدبر والختم السريع',
    type: 'program',
    description: 'حلقات مكثفة خلال شهر رمضان المبارك للتثبيت الفردي والجماعي بالتجويد.',
    owner: 'أ. أحمد سالم',
    startDate: '2026-03-01',
    endDate: '2026-04-05',
    progress: 100,
    status: 'completed',
    expectedImpact: 'مشاركة ٢٠٠ طالب في الاعتكاف القرآني والختم الكامل للمتسابقين.',
    actualImpact: 'شارك ٢٤٥ طالباً وتم إنجاز ١١٠ ختمة كاملة مسجلة ومرخصة معتمدة.',
    impactRatio: 100,
    isRecurring: true
  },
  {
    id: 'init-4',
    planId: 'plan-2',
    goalId: 'goal-1-2',
    name: 'مبادرة تمديد ساعات الدعم التعليمي المتأخرة',
    type: 'initiative',
    description: 'خدمة الدعم الهاتفي والالكتروني للطلاب المتعثرين الذين يملكون انحراف أيام مرتفع.',
    owner: 'أ. غانم الغامدي',
    startDate: '2026-04-10',
    endDate: '2026-09-30',
    progress: 30,
    status: 'stalled',
    expectedImpact: 'إنقاذ ٧٠٪ من الخطط ذات التقييم المنخفض (المتعثرة).',
    actualImpact: 'ضعف التزام الكادر التطوعي أدى إلى تراجع تغطية الحالات بنسبة ٤٠٪ عن المستهدف.',
    impactRatio: 35,
    isRecurring: false
  }
];

const initialTasks: ExecutiveTask[] = [
  { id: 'task-1', initiativeId: 'init-1', parentId: null, name: 'تصميم قوالب الأوسمة الفضية والذهبية والماسية وتكديس بنك الأوسمة', owner: 'أ. سامي اليافعي', startDate: '2026-01-05', dueDate: '2026-02-15', progress: 100, status: 'completed' },
  { id: 'task-2', initiativeId: 'init-1', parentId: null, name: 'توزيع النشرات الترويجية والحوافز المالية لأوائل الحلقات النموذجية', owner: 'أ. أحمد سالم', startDate: '2026-02-16', dueDate: '2026-10-15', progress: 80, status: 'active' },
  { id: 'task-3', initiativeId: 'init-1', parentId: 'task-2', name: 'التنسيق مع إدارة المالية لصرف مكافآت المدرسين الداعمين للمشروع', owner: 'أحمد البارقي', startDate: '2026-05-01', dueDate: '2026-08-30', progress: 90, status: 'active' },
  { id: 'task-4', initiativeId: 'init-2', parentId: null, name: 'تأمين المقرات اللوجستية وتأجير الحافلات لطلاب حلقات النخبة', owner: 'مساعد العلاقات العامة', startDate: '2026-02-20', dueDate: '2026-04-01', progress: 100, status: 'completed' },
  { id: 'task-5', initiativeId: 'init-2', parentId: null, name: 'اختبارات فرز الذكاء اللغوي والقدرة التخزينية للطلاب المتقدمين', owner: 'أ.د. يوسف الشاوي', startDate: '2026-04-05', dueDate: '2026-06-30', progress: 30, status: 'active' },
  { id: 'task-6', initiativeId: 'init-4', parentId: null, name: 'عقد الورشة التعريفية الأولى للمعلمين لشرح آلية رصد التعثر وحساب الواقعية', owner: 'أ. غانم الغامدي', startDate: '2026-04-12', dueDate: '2026-05-15', progress: 10, status: 'delayed' }
];

const initialFollowUps: FollowUpRecord[] = [
  {
    id: 'f-1',
    planId: 'plan-2',
    period: 'monthly',
    date: '2026-05-31',
    achieved: 'إنجاز المبادرة الرمضانية بالكامل واعتماد ٢٤٥ طالباً ناجحاً، وتفعيل بنك الأوسمة الذكي.',
    notAchieved: 'تأخر الورش التعريفية لآليات قياس الانحراف وأسباب التعثر للمدرسين الجدد.',
    bottleneckReason: 'ضعف الالتزام بالكادر ونقص المدرسين في بعض الفروع الريفية والنائية.',
    correctiveActions: 'ترحيل التدريب لبرنامج الكتروني مسجل ذاتي وتطبيق حوافز مالية للمجيبين.',
    submitter: 'الشيخ عبدالرحمن الصاوي'
  }
];

const initialMeetings: Meeting[] = [
  {
    id: 'meet-1',
    title: 'جلسة التقييم النصفي السنوي لأداء خطط الملتقى',
    date: '2026-06-15',
    attendees: ['د. خالد المزروعي', 'أ.د. يوسف الشاوي', 'الشيخ عبدالرحمن الصاوي', 'أحمد البارقي'],
    agenda: 'مناقشة المشاريع المتعثرة، مراجعة عتبات إنذار الأيام، إقرار حوافز المبادرات المتكررة.',
    decisions: ['تفعيل صلاحية التعديل الكلي للمشرفين عند التعثر المثبت', 'صرف ميزانية تكميلية لمبادرة الأوسمة'],
    recommendations: ['البدء بإنشاء أرشيف المعرفة وسجل الدروس المستفادة لكل مشروع ينتهي.'],
    relatedType: 'plan',
    relatedId: 'plan-2'
  }
];

const initialDecisions: AdminDecision[] = [
  { id: 'dec-1', planId: 'plan-2', type: 'approve', date: '2026-01-01', owner: 'د. خالد المزروعي', reason: 'الاعتماد الرسمي والنهائي للموازنة التشغيلية وبدء التنفيذ.' },
  { id: 'dec-2', planId: 'plan-3', type: 'reschedule', date: '2026-06-10', owner: 'أحمد سالم', reason: 'تعديل تواريخ المبادرة الصيفية لتفادي أوقات السفر والإجازات الرسمية.' }
];

const initialKnowledge: KnowledgeItem[] = [
  {
    id: 'k-1',
    title: 'الدروس المستفادة من البرنامج الرمضاني للختم السريع لعام ٢٠٢٥',
    type: 'برنامج موسمي',
    successFactors: 'استخدام التنافس الجماعي والربط الفوري بتطبيق إلكتروني لرصد الختمة أولاً بأول.',
    bottlenecks: 'ازدحام الأوقات في العشر الأواخر مما استدعى ضغط المواعيد وإرهاق المشرفين المجهدين.',
    lessons: 'ضرورة توزيع الكوادر على نوبتين وتفريغ معلمي الإجازة للرصد النهائي فقط.',
    recommendations: 'صناعة قالب مسبق للشهادات واعتماد التوقيع الإلكتروني للمدير العام لتلافي البطء التنفيذي.'
  }
];

const initialCriteria = [
  { id: 'crit-1', name: 'معدل الحفظ والإنتاجية', desc: 'متوسط الأجزاء المحفوظة مقارنة بالمستهدف الزمني المعتمد', maxScore: 40, weight: 40, target: 'الحلقة' },
  { id: 'crit-2', name: 'نسبة الالتزام والحضور', desc: 'الانضباط اليومي للطلبة وعدم مراكمة انحرافات زمنية سالبة', maxScore: 30, weight: 30, target: 'المدرس' },
  { id: 'crit-3', name: 'تحقيق الأثر وقياس العائد', desc: 'تطور نتائج الاختبارات والتميز السلوكي والمشاركات الخارجية', maxScore: 30, weight: 30, target: 'الخطة' }
];

export default function StrategicPlanning() {
  // === STATE MANAGEMENT ===
  const [activeSubTab, setActiveSubTab] = useState<'initiatives' | 'monitoring' | 'governance'>('initiatives');
  
  const [plans, setPlans] = useState<CorporatePlan[]>(initialPlans);
  const [goals, setGoals] = useState<StrategicGoal[]>(initialGoals);
  const [initiatives, setInitiatives] = useState<Initiative[]>(initialInitiatives);
  const [tasks, setTasks] = useState<ExecutiveTask[]>(initialTasks);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>(initialFollowUps);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [decisions, setDecisions] = useState<AdminDecision[]>(initialDecisions);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(initialKnowledge);
  const [criteria, setCriteria] = useState<typeof initialCriteria>(initialCriteria);

  // Forms and Modals states
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<CorporatePlan>>({
    name: '', type: 'annual', duration: 'سنة واحدة', startDate: '', endDate: '', owner: '', description: '', vision: '', mission: ''
  });

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<StrategicGoal>>({
    parentId: null, name: '', description: '', owner: '', weight: 10, progress: 0, status: 'not_started'
  });

  // Initial Staff Notifications
  const [staffNotifications, setStaffNotifications] = useState<StaffNotificationItem[]>([
    {
      id: 'snotif-1',
      personId: 'p7',
      personName: 'الشيخ/ يونس الدوسري',
      title: 'تكليف بمبادرة جديدة',
      message: 'تم إسناد مبادرة (برنامج الأوسمة الذهبية والتقدير المستمر لطلاب الملتقى) للفترة من 2026-01-01 إلى 2026-10-31.',
      createdAt: '2026-08-01 09:30 ص',
      relatedItemId: 'init-1',
      relatedItemType: 'initiative',
      isRead: false,
      type: 'assignment'
    },
    {
      id: 'snotif-2',
      personId: 'p8',
      personName: 'الشيخ/ سالم بن عبدالعزيز التركي',
      title: 'تكليف بمهمة تشغيلية',
      message: 'تم إسناد مهمة (توزيع الحوافز والنشرات التشجيعية لحلقة حفص).',
      createdAt: '2026-08-05 11:15 ص',
      relatedItemId: 'task-2',
      relatedItemType: 'task',
      isRead: false,
      type: 'assignment'
    },
    {
      id: 'snotif-3',
      personId: 'p2',
      personName: 'أ. أحمد سالم العتيبي',
      title: 'تنبيه متابعة إدارية',
      message: 'يرجى متابعة وإغلاق تقارير الأثر الخاصة بالمبادرات الرمضانية.',
      createdAt: '2026-08-08 02:00 م',
      isRead: true,
      type: 'decision'
    }
  ]);

  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all'); // Filter notifications & tasks by staff ID

  // Task & Initiative Completion Report Modal (Used by Assigned Person)
  const [reportingItemModal, setReportingItemModal] = useState<{
    item: Initiative | ExecutiveTask;
    itemType: 'initiative' | 'task';
  } | null>(null);

  const [completionForm, setCompletionForm] = useState({
    summaryNotes: '',
    durationTaken: '١٤ يوماً',
    methodology: '',
    outputs: ''
  });

  // Management Feedback form
  const [mgmtFeedbackNotes, setMgmtFeedbackNotes] = useState<{ [itemId: string]: string }>({});

  const [isNewInitiativeOpen, setIsNewInitiativeOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState<{
    planId: string;
    goalId: string;
    customGoalName: string;
    name: string;
    type: 'initiative' | 'project' | 'program' | 'activity';
    description: string;
    owner: string;
    ownerPersonId: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: 'draft' | 'pending' | 'active' | 'review_pending' | 'completed' | 'stalled' | 'cancelled' | 'closed';
    expectedImpact: string;
  }>({
    planId: 'plan-2',
    goalId: 'goal-1',
    customGoalName: 'الرفع من جودة الحفظ والاتقان لطلاب الملتقى',
    name: '',
    type: 'initiative',
    description: '',
    owner: 'الشيخ/ يونس الدوسري',
    ownerPersonId: 'p7',
    startDate: '2026-08-15',
    endDate: '2026-11-30',
    progress: 0,
    status: 'active',
    expectedImpact: ''
  });

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<ExecutiveTask>>({
    initiativeId: 'init-1', parentId: null, name: '', owner: '', startDate: '', dueDate: '', progress: 0, status: 'new'
  });

  // Flexible editing states
  const [editingGoal, setEditingGoal] = useState<StrategicGoal | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [editingTask, setEditingTask] = useState<ExecutiveTask | null>(null);
  const [closingModal, setClosingModal] = useState<{
    item: Initiative | ExecutiveTask | AdminDecision;
    itemType: 'initiative' | 'task' | 'decision';
  } | null>(null);

  const [closeForm, setCloseForm] = useState({
    closedNotes: '',
    durationDays: 14,
    finalRatio: 100
  });

  // Simulator State
  const [simStudentChange, setSimStudentChange] = useState(20); // % increase
  const [simCirclesChange, setSimCirclesChange] = useState(15); // % increase
  const [simTeacherShortage, setSimTeacherShortage] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Periodic FollowUp Form State
  const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUpRecord>>({
    planId: 'plan-2', period: 'monthly', achieved: '', notAchieved: '', bottleneckReason: '', correctiveActions: '', submitter: ''
  });

  // Meeting Form State
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    title: '', date: '', agenda: '', attendees: [], decisions: [], recommendations: [], relatedType: 'plan', relatedId: 'plan-2'
  });

  // Decision Form State
  const [newDecision, setNewDecision] = useState<Partial<AdminDecision>>({
    planId: 'plan-2', type: 'approve', reason: '', owner: 'د. خالد المزروعي'
  });

  // Knowledge Form State
  const [newKnowledge, setNewKnowledge] = useState<Partial<KnowledgeItem>>({
    title: '', type: 'مشروع سنوي', successFactors: '', bottlenecks: '', lessons: '', recommendations: ''
  });

  // Filter selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-2');

  // Compare Plans
  const [comparePlanA, setComparePlanA] = useState('plan-1');
  const [comparePlanB, setComparePlanB] = useState('plan-2');

  // Permissions Settings State
  const [customPermissions, setCustomPermissions] = useState({
    gm: { view: true, edit: true, comment: true, approve: true, close: true },
    supervisor: { view: true, edit: false, comment: true, approve: false, close: false },
    teacher: { view: true, edit: false, comment: false, approve: false, close: false }
  });

  // === CALCULATORS ===
  const dashboardStats = useMemo(() => {
    const activeInits = initiatives.filter(i => i.status === 'active' || i.status === 'pending');
    const stalledInits = initiatives.filter(i => i.status === 'stalled');
    const completedInits = initiatives.filter(i => i.status === 'completed');

    // Calculated weights
    const totalGoalWeights = goals.reduce((acc, g) => acc + g.weight, 0);
    const averageGoalProgress = Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / (goals.length || 1));
    const averageInitiativeProgress = Math.round(initiatives.reduce((acc, i) => acc + i.progress, 0) / (initiatives.length || 1));

    return {
      activeInits: activeInits.length,
      stalledInits: stalledInits.length,
      completedInits: completedInits.length,
      averageGoalProgress,
      averageInitiativeProgress,
      totalGoalWeights
    };
  }, [goals, initiatives]);

  // Scenario Simulator Algorithm
  const runSimulation = () => {
    const impactFactor = (simStudentChange * 0.4) + (simCirclesChange * 0.6);
    const riskScore = simTeacherShortage ? 80 : Math.round(simStudentChange * 0.8);
    const successProb = Math.max(15, 95 - (simTeacherShortage ? 40 : 0) - Math.round(simStudentChange * 0.3));

    let resourcesNeeded = '';
    let expectedImpact = '';
    
    if (simStudentChange > 25) {
      resourcesNeeded = 'يتطلب إضافة ٤ فصول جديدة، وتعيين مشرف تربوي إضافي لتغطية جودة الرصد الفوري.';
      expectedImpact = 'توسع نوعي ممتاز ولكن بضغط تشغيلي حرج قد يزيد من انحراف الأيام بنسبة ١٥٪.';
    } else {
      resourcesNeeded = 'الموارد الحالية كافية شريطة ثبات مستويات التزام الكوادر.';
      expectedImpact = 'تقدم طبيعي متوافق تماماً مع بنود الخطة السنوية دون تعثر ملحوظ.';
    }

    setSimulationResult({
      successProb,
      riskScore,
      resourcesNeeded,
      expectedImpact,
      isSimulated: true
    });
  };

  // Add Handlers
  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CorporatePlan = {
      id: `plan-${Date.now()}`,
      name: newPlan.name || 'خطة جديدة غير مسماة',
      type: newPlan.type || 'annual',
      duration: newPlan.duration || 'سنة واحدة',
      startDate: newPlan.startDate || '2026-01-01',
      endDate: newPlan.endDate || '2026-12-31',
      owner: newPlan.owner || 'المدير العام',
      description: newPlan.description || '',
      vision: newPlan.vision || '',
      mission: newPlan.mission || '',
      status: 'draft'
    };
    setPlans([...plans, created]);
    setIsNewPlanOpen(false);
    setNewPlan({ name: '', type: 'annual', duration: 'سنة واحدة', startDate: '', endDate: '', owner: '', description: '', vision: '', mission: '' });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StrategicGoal = {
      id: `goal-${Date.now()}`,
      parentId: newGoal.parentId || null,
      name: newGoal.name || 'هدف مؤسسي جديد',
      description: newGoal.description || '',
      owner: newGoal.owner || 'مشرف القسم',
      indicators: [newGoal.indicators?.[0] || 'مؤشر أداء عام'],
      weight: Number(newGoal.weight) || 10,
      progress: 0,
      status: 'not_started'
    };
    setGoals([...goals, created]);
    setIsNewGoalOpen(false);
    setNewGoal({ parentId: null, name: '', description: '', owner: '', weight: 10, progress: 0, status: 'not_started' });
  };

  const handleAddInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedGoal = goals.find(g => g.id === newInitiative.goalId);
    const goalTitle = newInitiative.customGoalName || selectedGoal?.name || 'الرفع من جودة الحفظ والاتقان لطلاب الملتقى';

    const created: Initiative = {
      id: `init-${Date.now()}`,
      planId: newInitiative.planId || 'plan-2',
      goalId: newInitiative.goalId || 'goal-1',
      goalName: goalTitle,
      name: newInitiative.name || 'مبادرة تشغيلية جديدة',
      type: newInitiative.type || 'initiative',
      description: newInitiative.description || `مبادرة مرتبطة بالهدف الاستراتيجي: (${goalTitle})`,
      owner: newInitiative.owner || 'الشيخ/ يونس الدوسري',
      ownerPersonId: newInitiative.ownerPersonId || 'p7',
      startDate: newInitiative.startDate || '2026-08-15',
      endDate: newInitiative.endDate || '2026-11-30',
      progress: 0,
      status: 'active',
      expectedImpact: newInitiative.expectedImpact || 'الرفع من جودة الحفظ ونسب الإتقان والتصفيات.'
    };

    setInitiatives(prev => [created, ...prev]);

    // Dispatch Notification to the assigned person's notification center
    const newNotif: StaffNotificationItem = {
      id: `snotif-${Date.now()}`,
      personId: created.ownerPersonId || 'p7',
      personName: created.owner,
      title: 'تكليف بمبادرة أو مشروع جديد',
      message: `تم تكليفك رسمياً بمبادرة/مشروع: (${created.name}) للفترة من ${created.startDate} إلى ${created.endDate} المرتبطة بهدف (${created.goalName}).`,
      createdAt: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      relatedItemId: created.id,
      relatedItemType: 'initiative',
      isRead: false,
      type: 'assignment'
    };

    setStaffNotifications(prev => [newNotif, ...prev]);
    setIsNewInitiativeOpen(false);

    // Reset form
    setNewInitiative({
      planId: 'plan-2',
      goalId: 'goal-1',
      customGoalName: 'الرفع من جودة الحفظ والاتقان لطلاب الملتقى',
      name: '',
      type: 'initiative',
      description: '',
      owner: 'الشيخ/ يونس الدوسري',
      ownerPersonId: 'p7',
      startDate: '2026-08-15',
      endDate: '2026-11-30',
      progress: 0,
      status: 'active',
      expectedImpact: ''
    });

    alert(`✅ تم حفظ المبادرة وإرسال إشعار فوري لمركز إشعارات المسؤول (${created.owner}).`);
  };

  const handleSubmitCompletionReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingItemModal) return;

    const { item, itemType } = reportingItemModal;
    const nowStr = new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const report: CompletionReport = {
      submittedAt: nowStr,
      submittedBy: itemType === 'initiative' ? (item as Initiative).owner : ((item as ExecutiveTask).assignee || item.owner),
      summaryNotes: completionForm.summaryNotes || 'تم إنجاز كافة المتطلبات المحددة بنجاح.',
      durationTaken: completionForm.durationTaken || '١٤ يوماً',
      methodology: completionForm.methodology || 'تم التنفيذ بالأسلوب التشغيلي المباشر مع رصد المؤشرات.',
      outputs: completionForm.outputs || 'تقرير إنجاز مرفق'
    };

    if (itemType === 'initiative') {
      setInitiatives(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'review_pending',
        progress: 100,
        completionReport: report
      } : i));
    } else {
      setTasks(prev => prev.map(t => t.id === item.id ? {
        ...t,
        status: 'review_pending',
        progress: 100,
        completionReport: report
      } : t));
    }

    // Dispatch notification to Management
    const mgmtNotif: StaffNotificationItem = {
      id: `snotif-${Date.now()}`,
      personId: 'management',
      personName: 'الإدارة العامة والمشرف العام',
      title: 'تسليم تقرير إنجاز جديد للمراجعة',
      message: `قام المسؤول (${report.submittedBy}) برفع تقرير إنجاز (${item.name}) وتنتظر تعقيب ومراجعة الإدارة للإغلاق النهائي.`,
      createdAt: nowStr,
      relatedItemId: item.id,
      relatedItemType: itemType,
      isRead: false,
      type: 'report_submitted'
    };

    setStaffNotifications(prev => [mgmtNotif, ...prev]);
    setReportingItemModal(null);
    setCompletionForm({ summaryNotes: '', durationTaken: '١٤ يوماً', methodology: '', outputs: '' });

    alert('✅ تم رفع تقرير الإنجاز بنجاح، وتحولت المبادرة/المهمة للإدارة بانتظار التعقيب والإغلاق.');
  };

  const handleManagementApproveClose = (itemId: string, itemType: 'initiative' | 'task') => {
    const feedback = mgmtFeedbackNotes[itemId] || 'تمت المراجعة والاعتماد النهائي من قبل الإدارة العامة.';
    const today = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toLocaleDateString('ar-SA');

    if (itemType === 'initiative') {
      const targetInit = initiatives.find(i => i.id === itemId);
      setInitiatives(prev => prev.map(i => i.id === itemId ? {
        ...i,
        status: 'closed',
        closedAt: today,
        closeReason: feedback,
        managementReview: {
          reviewedAt: nowStr,
          reviewedBy: 'د. خالد المزروعي (المدير العام)',
          feedbackNotes: feedback,
          status: 'approved'
        }
      } : i));

      if (targetInit) {
        setStaffNotifications(prev => [{
          id: `snotif-${Date.now()}`,
          personId: targetInit.ownerPersonId || 'p7',
          personName: targetInit.owner,
          title: 'اعتماد وإغلاق المبادرة رسمياً',
          message: `اعتمدت الإدارة تقرير إنجازك للمبادرة (${targetInit.name}) وتم إغلاقها بنجاح مع التعقيب الإداري: ${feedback}`,
          createdAt: nowStr,
          relatedItemId: itemId,
          relatedItemType: 'initiative',
          isRead: false,
          type: 'management_feedback'
        }, ...prev]);
      }
    } else {
      const targetTask = tasks.find(t => t.id === itemId);
      setTasks(prev => prev.map(t => t.id === itemId ? {
        ...t,
        status: 'closed',
        closedAt: today,
        closeNotes: feedback,
        managementReview: {
          reviewedAt: nowStr,
          reviewedBy: 'الإدارة التعليمية',
          feedbackNotes: feedback,
          status: 'approved'
        }
      } : t));

      if (targetTask) {
        setStaffNotifications(prev => [{
          id: `snotif-${Date.now()}`,
          personId: targetTask.assigneePersonId || 'p7',
          personName: targetTask.assignee || targetTask.owner,
          title: 'اعتماد وإغلاق المهمة رسمياً',
          message: `اعتمدت الإدارة تقرير إنجازك للمهمة (${targetTask.name}) وتم إغلاقها مع تعقيب الإدارة: ${feedback}`,
          createdAt: nowStr,
          relatedItemId: itemId,
          relatedItemType: 'task',
          isRead: false,
          type: 'management_feedback'
        }, ...prev]);
      }
    }

    alert('✅ تم تعقيب الإدارة واعتمد الإغلاق النهائي بنجاح.');
  };

  const handleManagementRequestRevision = (itemId: string, itemType: 'initiative' | 'task') => {
    const feedback = mgmtFeedbackNotes[itemId] || 'يرجى مراجعة بعض البنود وتضمين إحصائيات دقيقة.';
    const nowStr = new Date().toLocaleDateString('ar-SA');

    if (itemType === 'initiative') {
      const targetInit = initiatives.find(i => i.id === itemId);
      setInitiatives(prev => prev.map(i => i.id === itemId ? {
        ...i,
        status: 'active',
        managementReview: {
          reviewedAt: nowStr,
          reviewedBy: 'الإدارة العامة',
          feedbackNotes: feedback,
          status: 'revision_requested'
        }
      } : i));

      if (targetInit) {
        setStaffNotifications(prev => [{
          id: `snotif-${Date.now()}`,
          personId: targetInit.ownerPersonId || 'p7',
          personName: targetInit.owner,
          title: 'طلب استكمال وتعديل على تقرير الإنجاز',
          message: `طلبت الإدارة تعديلات على تقرير إنجاز المبادرة (${targetInit.name}): "${feedback}"`,
          createdAt: nowStr,
          relatedItemId: itemId,
          relatedItemType: 'initiative',
          isRead: false,
          type: 'management_feedback'
        }, ...prev]);
      }
    } else {
      const targetTask = tasks.find(t => t.id === itemId);
      setTasks(prev => prev.map(t => t.id === itemId ? {
        ...t,
        status: 'active',
        managementReview: {
          reviewedAt: nowStr,
          reviewedBy: 'الإدارة العامة',
          feedbackNotes: feedback,
          status: 'revision_requested'
        }
      } : t));

      if (targetTask) {
        setStaffNotifications(prev => [{
          id: `snotif-${Date.now()}`,
          personId: targetTask.assigneePersonId || 'p7',
          personName: targetTask.assignee || targetTask.owner,
          title: 'طلب استكمال وتعديل على المهمة',
          message: `طلبت الإدارة استكمال بعض النقاط في المهمة (${targetTask.name}): "${feedback}"`,
          createdAt: nowStr,
          relatedItemId: itemId,
          relatedItemType: 'task',
          isRead: false,
          type: 'management_feedback'
        }, ...prev]);
      }
    }

    alert('🔄 تم إرجاع المبادرة/المهمة للمسؤول مع تعقيب الإدارة واستكمال التعديلات.');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ExecutiveTask = {
      id: `task-${Date.now()}`,
      initiativeId: newTask.initiativeId || 'init-1',
      parentId: newTask.parentId || null,
      name: newTask.name || 'مهمة جديدة',
      owner: newTask.owner || 'العضو المنفذ',
      startDate: newTask.startDate || '2026-06-01',
      dueDate: newTask.dueDate || '2026-07-01',
      progress: 0,
      status: 'new'
    };
    setTasks([...tasks, created]);
    setIsNewTaskOpen(false);
    setNewTask({ initiativeId: 'init-1', parentId: null, name: '', owner: '', startDate: '', dueDate: '', progress: 0, status: 'new' });
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const created: FollowUpRecord = {
      id: `f-${Date.now()}`,
      planId: newFollowUp.planId || 'plan-2',
      period: newFollowUp.period || 'monthly',
      date: new Date().toISOString().split('T')[0],
      achieved: newFollowUp.achieved || '',
      notAchieved: newFollowUp.notAchieved || '',
      bottleneckReason: newFollowUp.bottleneckReason || '',
      correctiveActions: newFollowUp.correctiveActions || '',
      submitter: newFollowUp.submitter || 'مدرس الحلقة'
    };
    setFollowUps([created, ...followUps]);
    setNewFollowUp({ planId: 'plan-2', period: 'monthly', achieved: '', notAchieved: '', bottleneckReason: '', correctiveActions: '', submitter: '' });
    alert('✅ تم قيد التقرير المتابعي الدوري وإشعار الإدارة العامة.');
  };

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Meeting = {
      id: `meet-${Date.now()}`,
      title: newMeeting.title || 'اجتماع تنسيقي',
      date: newMeeting.date || new Date().toISOString().split('T')[0],
      attendees: typeof newMeeting.attendees === 'string' ? (newMeeting.attendees as string).split('،') : [],
      agenda: newMeeting.agenda || '',
      decisions: typeof newMeeting.decisions === 'string' ? (newMeeting.decisions as string).split('\n') : [],
      recommendations: typeof newMeeting.recommendations === 'string' ? (newMeeting.recommendations as string).split('\n') : [],
      relatedType: newMeeting.relatedType || 'plan',
      relatedId: newMeeting.relatedId || 'plan-2'
    };
    setMeetings([created, ...meetings]);
    setNewMeeting({ title: '', date: '', agenda: '', attendees: [], decisions: [], recommendations: [], relatedType: 'plan', relatedId: 'plan-2' });
    alert('✅ تم حفظ تفاصيل الاجتماع وربطه بالخطة بنجاح.');
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AdminDecision = {
      id: `dec-${Date.now()}`,
      planId: newDecision.planId || 'plan-2',
      type: newDecision.type || 'approve',
      date: new Date().toISOString().split('T')[0],
      owner: newDecision.owner || 'المدير العام',
      reason: newDecision.reason || ''
    };
    setDecisions([created, ...decisions]);
    setNewDecision({ planId: 'plan-2', type: 'approve', reason: '', owner: 'د. خالد المزروعي' });
    alert('✅ تم توثيق القرار الإداري في السجل العام بنجاح.');
  };

  // Edit and Closure Handlers
  const handleSaveGoalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    setGoals(prev => prev.map(g => g.id === editingGoal.id ? editingGoal : g));
    setEditingGoal(null);
    alert('✅ تم تحديث الهدف الاستراتيجي في شجرة الأهداف بنجاح.');
  };

  const handleSaveInitiativeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInitiative) return;
    setInitiatives(prev => prev.map(i => i.id === editingInitiative.id ? editingInitiative : i));
    setEditingInitiative(null);
    alert('✅ تم تعديل بيانات وتوكيل المبادرة بنجاح.');
  };

  const handleSaveTaskEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
    alert('✅ تم تحديث بيانات المهمة والتكاليف بنجاح.');
  };

  const handleQuickProgress = (id: string, type: 'initiative' | 'task', delta: number) => {
    if (type === 'initiative') {
      setInitiatives(prev => prev.map(i => {
        if (i.id !== id) return i;
        const newP = Math.min(100, Math.max(0, i.progress + delta));
        return { ...i, progress: newP, status: newP === 100 ? 'completed' : i.status };
      }));
    } else {
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const newP = Math.min(100, Math.max(0, t.progress + delta));
        return { ...t, progress: newP, status: newP === 100 ? 'completed' : t.status };
      }));
    }
  };

  const handleConfirmCloseItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingModal) return;
    const today = new Date().toISOString().split('T')[0];

    if (closingModal.itemType === 'initiative') {
      setInitiatives(prev => prev.map(i => i.id === closingModal.item.id ? {
        ...i,
        status: 'closed',
        progress: 100,
        closedAt: today,
        workingDays: Number(closeForm.durationDays) || 14,
        closeReason: closeForm.closedNotes || 'تم إغلاق المبادرة بعد استكمال كافة بنودها بنجاح.',
        impactRatio: Number(closeForm.finalRatio) || 100
      } : i));
    } else if (closingModal.itemType === 'task') {
      setTasks(prev => prev.map(t => t.id === closingModal.item.id ? {
        ...t,
        status: 'closed',
        progress: 100,
        closedAt: today,
        workingDays: Number(closeForm.durationDays) || 7,
        closeNotes: closeForm.closedNotes || 'تم إنجاز وإغلاق المهمة بنجاح.'
      } : t));
    } else if (closingModal.itemType === 'decision') {
      setDecisions(prev => prev.map(d => d.id === closingModal.item.id ? {
        ...d,
        status: 'closed',
        closedAt: today,
        workingDays: Number(closeForm.durationDays) || 5
      } : d));
    }

    setClosingModal(null);
    setCloseForm({ closedNotes: '', durationDays: 14, finalRatio: 100 });
    alert('✅ تم إغلاق العمل وأرشفة بيانات مدة الإنجاز والأثر بنجاح!');
  };

  const handleAddKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    const created: KnowledgeItem = {
      id: `k-${Date.now()}`,
      title: newKnowledge.title || '',
      type: newKnowledge.type || 'مشروع سنوي',
      successFactors: newKnowledge.successFactors || '',
      bottlenecks: newKnowledge.bottlenecks || '',
      lessons: newKnowledge.lessons || '',
      recommendations: newKnowledge.recommendations || ''
    };
    setKnowledge([created, ...knowledge]);
    setNewKnowledge({ title: '', type: 'مشروع سنوي', successFactors: '', bottlenecks: '', lessons: '', recommendations: '' });
    alert('✅ تم إضافة الدرس المستفاد لأرشيف المعرفة المؤسسية بنجاح.');
  };

  // Clone Initiative Handler
  const handleCloneInitiative = (init: Initiative) => {
    const duplicated: Initiative = {
      ...init,
      id: `init-${Date.now()}`,
      name: `${init.name} (نسخة موسمية مكررة)`,
      progress: 0,
      status: 'draft',
      startDate: '2027-01-01',
      endDate: '2027-10-31',
      actualImpact: undefined,
      impactRatio: undefined
    };
    setInitiatives([...initiatives, duplicated]);
    alert('✅ تم استنساخ المبادرة بنجاح وترحيلها لجدول العام الجديد.');
  };

  return (
    <div className="space-y-6 dir-rtl text-right" id="strategic-planning-root" dir="rtl">
      
      {/* HEADER WITH PROMINENT STRATEGIC TITLE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-l from-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <Target className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold font-sans">التخطيط المؤسسي وإدارة المبادرات والمشاريع</h1>
          </div>
          <p className="text-xs text-emerald-200">
            النظام القيادي الموحد للمدير العام والإدارة التنفيذية لربط الأهداف الاستراتيجية بالمبادرات والمهام وتتبع الأثر الفعلي والتعثرات.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button 
            onClick={() => setIsNewPlanOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة خطة مؤسسية
          </button>
        </div>
      </div>

      {/* QUICK VIEW SELECTOR & MAIN EXECUTIVE KPI BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">متوسط إنجاز الأهداف الاستراتيجية</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{dashboardStats.averageGoalProgress}%</h3>
            <span className="text-[10px] text-emerald-600">✓ يتوافق مع موازنة عام ٢٠٢٦</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">نسبة تنفيذ المبادرات والمشاريع</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{dashboardStats.averageInitiativeProgress}%</h3>
            <span className="text-[10px] text-slate-500">إجمالي {initiatives.length} مبادرات نشطة</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">مشاريع متعثرة وبحاجة تدخل</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{dashboardStats.stalledInits}</h3>
            <span className="text-[10px] text-rose-500 font-medium">بسبب ضعف الكادر والتنفيذ</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">المبادرات المكتملة والمؤرشفة</p>
            <h3 className="text-2xl font-bold text-teal-600 mt-1">{dashboardStats.completedInits}</h3>
            <span className="text-[10px] text-teal-500">تم تسجيل الأثر ودروس النجاح</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow">
          <Map className="w-4 h-4" />
          المبادرات وخريطة التنفيذ وإدارة المهام
        </div>
      </div>

      {/* CONTENT WORKSPACES */}
      <div className="bg-slate-50/50 p-1 rounded-xl">
        
        {/* TAB 3: INITIATIVES, EXECUTION MAP & EXEC EXECUTIVE TASKS */}
        {activeSubTab === 'initiatives' && (
          <div className="space-y-6">
            
            {/* STAFF NOTIFICATION & DELEGATION CENTER BAR (مركز الإشعارات وتوكيل المهام) */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">مركز الإشعارات المتبادلة وتوكيل المهام الميدانية</h3>
                      <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">
                        {staffNotifications.filter(n => !n.isRead).length} إشعار جديد
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يستقبل المعلم والاداري التكليفات فنائياً، ويرفع تقرير الإنجاز للإدارة للمراجعة والتعقيب والإغلاق.
                    </p>
                  </div>
                </div>

                {/* Staff Selector Filter */}
                <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
                  <span className="text-slate-300 font-bold shrink-0">عرض مركز العضو:</span>
                  <select 
                    value={selectedStaffFilter}
                    onChange={e => setSelectedStaffFilter(e.target.value)}
                    className="bg-slate-900 text-white p-1.5 rounded-lg border border-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">كل الكادر القيادي والميداني</option>
                    {STAFF_DIRECTORY.map((s: PersonItem) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.role} ({s.circleName || s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                {staffNotifications
                  .filter(n => selectedStaffFilter === 'all' || n.personId === selectedStaffFilter || n.personId === 'management')
                  .map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                        notif.type === 'assignment' 
                          ? 'bg-slate-800/90 border-indigo-500/40 text-slate-200' 
                          : notif.type === 'report_submitted'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          {notif.type === 'assignment' && <Send className="w-3 h-3 text-indigo-400" />}
                          {notif.type === 'report_submitted' && <Clock className="w-3 h-3 text-amber-400" />}
                          {notif.type === 'management_feedback' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {notif.title}
                        </span>
                        <span className="text-[9.5px] opacity-75 font-mono">{notif.createdAt}</span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed opacity-90">{notif.message}</p>
                      <div className="text-[9.5px] opacity-75 pt-1 border-t border-white/10 flex justify-between">
                        <span>المعني: {notif.personName}</span>
                        <span className="font-semibold">{notif.relatedItemType === 'initiative' ? 'مبادرة' : 'مهمة'}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Split layout: Initiatives List, Map, Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Initiatives & Seasonal Management (Section 5 & 15) */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      لوحة المبادرات وخريطة التنفيذ وإدارة المهام
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">تحديد المسؤولين المباشرين، وتوكيل المهام، وتتبع الإنجاز الدوري وإغلاق المبادرات المنتهية.</p>
                  </div>
                  <button 
                    onClick={() => setIsNewInitiativeOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مبادرة جديدة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {initiatives
                    .filter(i => i.status !== 'closed')
                    .filter(i => selectedStaffFilter === 'all' || i.ownerPersonId === selectedStaffFilter || i.owner.includes(selectedStaffFilter))
                    .map(init => (
                    <div key={init.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:shadow-md transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded">
                          {init.type === 'project' ? 'مشروع فرعي' : init.type === 'program' ? 'برنامج موسمي' : 'مبادرة نوعية'}
                        </span>
                        <div className="flex items-center gap-1">
                          {init.status === 'review_pending' ? (
                            <span className="text-[9.5px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded shadow-xs animate-pulse">
                              ⏳ قيد تعقيب الإدارة
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              init.status === 'completed' ? 'bg-teal-100 text-teal-800' : init.status === 'stalled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {init.status === 'completed' ? 'مكتمل' : init.status === 'stalled' ? 'متعثر' : 'جاري التنفيذ'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{init.name}</h4>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1 line-clamp-2">{init.description}</p>
                      </div>

                      {/* Goal & Dates Badge */}
                      <div className="p-2 bg-slate-100 rounded-lg text-[10px] text-slate-700 space-y-1">
                        {init.customGoalName && (
                          <div className="font-bold text-slate-900 truncate">
                            🎯 Goal: {init.customGoalName}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-slate-600 font-mono text-[9.5px]">
                          <span>🗓 البداية: {init.startDate || 'غير محدد'}</span>
                          <span>الموعد: {init.endDate || 'غير محدد'}</span>
                        </div>
                      </div>

                      {/* Delegation & Responsibility Pipeline */}
                      <div className="p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 text-[10px] space-y-1">
                        <div className="flex justify-between text-indigo-900 font-bold">
                          <span>المسؤول الموكل: {init.owner}</span>
                          <span className="text-slate-500">{init.assignedRole || 'مدير مبادرة'}</span>
                        </div>
                      </div>

                      {/* Staff Completion Report Display (if submitted) */}
                      {init.completionReport && (
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] space-y-1 text-amber-950">
                          <div className="font-bold text-amber-900 flex justify-between">
                            <span>📋 تقرير الإنجاز المرفوع:</span>
                            <span className="font-mono text-[9px]">{init.completionReport.submittedAt}</span>
                          </div>
                          <p className="text-[10px] leading-relaxed">{init.completionReport.summaryNotes}</p>
                          <div className="text-[9.5px] text-amber-800">
                            المدة: <span className="font-bold">{init.completionReport.durationTaken}</span> | الكيفية: <span className="font-bold">{init.completionReport.methodology}</span>
                          </div>
                        </div>
                      )}

                      {/* Management Feedback Box (for admin review) */}
                      {init.status === 'review_pending' && (
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2 text-[10px]">
                          <span className="font-bold text-emerald-900 block">💬 تعقيب الإدارة والاعتماد النهائي:</span>
                          <input 
                            type="text"
                            placeholder="اكتب ملاحظات وتعقيب الإدارة المالي/الإداري هنا..."
                            value={mgmtFeedbackNotes[init.id] || ''}
                            onChange={e => setMgmtFeedbackNotes({...mgmtFeedbackNotes, [init.id]: e.target.value})}
                            className="w-full p-1.5 border border-emerald-300 rounded text-right bg-white text-slate-800"
                          />
                          <div className="flex items-center gap-1.5 justify-end">
                            <button 
                              onClick={() => handleManagementRequestRevision(init.id, 'initiative')}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                            >
                              طلب استكمال
                            </button>
                            <button 
                              onClick={() => handleManagementApproveClose(init.id, 'initiative')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              اعتماد وإغلاق
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Expected impact & Budget */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800">الأثر: </span>
                          {init.expectedImpact}
                        </div>
                        {init.budget && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 mr-1">
                            {init.budget}
                          </span>
                        )}
                      </div>

                      {/* Progress bar & Quick updates */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
                          <span className="text-slate-500 font-bold">نسبة الإنجاز الدوري:</span>
                          <span className="font-bold text-slate-800">{init.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${init.progress}%` }} />
                        </div>

                        {/* Quick progress increment buttons */}
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-[9px] text-slate-400 font-medium ml-auto">قياس سريع:</span>
                          <button 
                            onClick={() => handleQuickProgress(init.id, 'initiative', 10)}
                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded border border-emerald-200"
                          >
                            +10%
                          </button>
                          <button 
                            onClick={() => handleQuickProgress(init.id, 'initiative', 25)}
                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded border border-emerald-200"
                          >
                            +25%
                          </button>
                          <button 
                            onClick={() => handleQuickProgress(init.id, 'initiative', 100)}
                            className="px-1.5 py-0.5 bg-teal-600 hover:bg-teal-500 text-white text-[9px] font-bold rounded"
                          >
                            100%
                          </button>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/60 gap-1 flex-wrap">
                        <button 
                          onClick={() => {
                            setReportingItemModal({ item: init, itemType: 'initiative' });
                            setCompletionForm({ summaryNotes: '', durationTaken: '', methodology: '', outputs: '' });
                          }}
                          className="flex items-center gap-1 text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-2.5 py-1 rounded-md shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          رفع تقرير الإنجاز
                        </button>

                        <div className="flex items-center gap-1 mr-auto">
                          <button 
                            onClick={() => setEditingInitiative(init)}
                            className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 px-2 py-1 rounded-md"
                          >
                            <Edit3 className="w-3 h-3" />
                            تعديل
                          </button>

                          <button 
                            onClick={() => {
                              setClosingModal({ item: init, itemType: 'initiative' });
                              setCloseForm({ closedNotes: '', durationDays: 14, finalRatio: 100 });
                            }}
                            className="flex items-center gap-1 text-slate-700 hover:text-rose-700 font-bold bg-slate-200 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            إغلاق
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Manager & Delegation Flow */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      المهام التنفيذية وتوكل المسندين
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsNewTaskOpen(true)}
                    className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold transition-colors"
                  >
                    + مهمة جديدة
                  </button>
                </div>

                <div className="space-y-3">
                  {tasks
                    .filter(t => t.status !== 'closed')
                    .filter(t => selectedStaffFilter === 'all' || t.assigneePersonId === selectedStaffFilter || t.assignee?.includes(selectedStaffFilter))
                    .map(t => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-800 leading-snug">{t.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          t.status === 'review_pending' ? 'bg-amber-500 text-white animate-pulse' : t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status === 'review_pending' ? '⏳ قيد مراجعة الإدارة' : `${t.progress}% إنجاز`}
                        </span>
                      </div>

                      {/* Delegation Path */}
                      <div className="p-2 bg-white rounded border border-slate-200 text-[10px] space-y-1">
                        <div className="text-slate-600">
                          المكلف من: <span className="font-bold text-slate-800">{t.owner}</span>
                        </div>
                        <div className="text-indigo-700">
                          الموكل إليه: <span className="font-bold">{t.assignee || 'معلم الحلقة'}</span>
                        </div>
                      </div>

                      {/* Completion Report Display for Tasks */}
                      {t.completionReport && (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[9.5px] space-y-1 text-amber-950">
                          <span className="font-bold text-amber-900 block">📋 تقرير إنجاز المهمة المرفوع:</span>
                          <p>{t.completionReport.summaryNotes}</p>
                          <div>المدة: {t.completionReport.durationTaken}</div>
                        </div>
                      )}

                      {/* Management Feedback Box for Task */}
                      {t.status === 'review_pending' && (
                        <div className="p-2 bg-emerald-50 rounded border border-emerald-300 space-y-1.5 text-[9.5px]">
                          <span className="font-bold text-emerald-900 block">تعقيب الإدارة وتدقيق الإنجاز:</span>
                          <input 
                            type="text"
                            placeholder="تعقيب الإدارة..."
                            value={mgmtFeedbackNotes[t.id] || ''}
                            onChange={e => setMgmtFeedbackNotes({...mgmtFeedbackNotes, [t.id]: e.target.value})}
                            className="w-full p-1 border border-emerald-300 rounded text-right bg-white text-slate-800"
                          />
                          <div className="flex gap-1 justify-end">
                            <button 
                              onClick={() => handleManagementRequestRevision(t.id, 'task')}
                              className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded"
                            >
                              إعادة للتعديل
                            </button>
                            <button 
                              onClick={() => handleManagementApproveClose(t.id, 'task')}
                              className="px-2 py-0.5 bg-emerald-700 text-white font-bold rounded"
                            >
                              اعتتماد وإغلاق
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${t.progress}%` }} />
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center justify-between text-[10px] pt-1 gap-1 flex-wrap">
                        <button 
                          onClick={() => {
                            setReportingItemModal({ item: t, itemType: 'task' });
                            setCompletionForm({ summaryNotes: '', durationTaken: '', methodology: '', outputs: '' });
                          }}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[9.5px] flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5" />
                          رفع إنجاز
                        </button>

                        <div className="flex gap-1 mr-auto">
                          <button 
                            onClick={() => setEditingTask(t)}
                            className="text-indigo-600 font-bold px-1.5 py-0.5 rounded hover:bg-indigo-50"
                          >
                            تعديل
                          </button>
                          <button 
                            onClick={() => {
                              setClosingModal({ item: t, itemType: 'task' });
                              setCloseForm({ closedNotes: '', durationDays: 7, finalRatio: 100 });
                            }}
                            className="text-slate-500 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Closed / Completed Items Section with Duration and Outcome Metrics */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Archive className="w-4 h-4 text-emerald-600" />
                  سجل المبادرات والمهام المغلقة والمنتهية (الأرشيف ومؤشرات الأثر)
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  {initiatives.filter(i => i.status === 'closed').length + tasks.filter(t => t.status === 'closed').length} عمل مغلق
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initiatives.filter(i => i.status === 'closed').map(closedInit => (
                  <div key={closedInit.id} className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded">مبادرة مغلقة</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">تاريخ الإغلاق: {closedInit.closedAt || 'اليوم'}</span>
                    </div>
                    <h4 className="font-bold text-slate-800">{closedInit.name}</h4>
                    <p className="text-[10px] text-slate-600">{closedInit.closeReason}</p>
                    <div className="p-2 bg-white rounded border border-emerald-100 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">مدة التنفيذ الفعلية:</span>
                      <span className="font-bold text-emerald-800">{closedInit.workingDays || 14} يوماً</span>
                    </div>
                  </div>
                ))}

                {tasks.filter(t => t.status === 'closed').map(closedTask => (
                  <div key={closedTask.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded">مهمة مغلقة</span>
                      <span className="text-[10px] text-slate-500 font-mono">تاريخ الإغلاق: {closedTask.closedAt || 'اليوم'}</span>
                    </div>
                    <h4 className="font-bold text-slate-800">{closedTask.name}</h4>
                    <p className="text-[10px] text-slate-600">{closedTask.closeNotes}</p>
                    <div className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">مدة العمل عليها:</span>
                      <span className="font-bold text-slate-800">{closedTask.workingDays || 7} أيام</span>
                    </div>
                  </div>
                ))}

                {initiatives.filter(i => i.status === 'closed').length === 0 && tasks.filter(t => t.status === 'closed').length === 0 && (
                  <div className="col-span-full p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    لا توجد مبادرات أو مهام مغلقة حالياً. يمكن إغلاق أي مبادرة أو مهمة بسهولة عبر النقر على زر "إغلاق المبادرة/المهمة".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* MODAL 1: ADD CORPORATE PLAN */}
      <AnimatePresence>
        {isNewPlanOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">إضافة خطة مؤسسية جديدة</h3>
                <button onClick={() => setIsNewPlanOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPlan} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">اسم الخطة</label>
                  <input 
                    type="text" required
                    value={newPlan.name}
                    onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="مثال: الخطة التشغيلية لعام ٢٠٢٧"
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">نوع الخطة</label>
                    <select 
                      value={newPlan.type}
                      onChange={e => setNewPlan({...newPlan, type: e.target.value as any})}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    >
                      <option value="monthly">خطة شهرية</option>
                      <option value="quarterly">خطة ربع سنوية</option>
                      <option value="semi-annual">خطة نصف سنوية</option>
                      <option value="annual">خطة سنوية</option>
                      <option value="strategic">خطة استراتيجية متعددة السنوات</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">الفترة الزمنية</label>
                    <input 
                      type="text"
                      value={newPlan.duration}
                      onChange={e => setNewPlan({...newPlan, duration: e.target.value})}
                      placeholder="مثال: سنة واحدة"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">تاريخ البداية</label>
                    <input 
                      type="date"
                      value={newPlan.startDate}
                      onChange={e => setNewPlan({...newPlan, startDate: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">تاريخ النهاية</label>
                    <input 
                      type="date"
                      value={newPlan.endDate}
                      onChange={e => setNewPlan({...newPlan, endDate: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">المسؤول عن الخطة</label>
                  <input 
                    type="text"
                    value={newPlan.owner}
                    onChange={e => setNewPlan({...newPlan, owner: e.target.value})}
                    placeholder="الشيخ عبدالرحمن الصاوي..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">وصف الخطة والأثر المستهدف</label>
                  <textarea 
                    rows={2}
                    value={newPlan.description}
                    onChange={e => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="وصف تفصيلي..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                >
                  حفظ الخطة وبدء الصياغة
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD GOAL */}
      <AnimatePresence>
        {isNewGoalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">إضافة هدف لشجرة الأهداف</h3>
                <button onClick={() => setIsNewGoalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">الهدف الأعلى (التبعية الهرمية)</label>
                  <select 
                    value={newGoal.parentId || ''}
                    onChange={e => setNewGoal({...newGoal, parentId: e.target.value || null})}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">هدف رئيسي مستوي أول (جذر الشجرة)</option>
                    {goals.filter(g => g.parentId === null).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">اسم الهدف</label>
                  <input 
                    type="text" required
                    value={newGoal.name}
                    onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                    placeholder="مثال: تعزيز الملاءة المالية للأوقاف"
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">الوصف</label>
                  <textarea 
                    rows={2}
                    value={newGoal.description}
                    onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">المسؤول</label>
                    <input 
                      type="text"
                      value={newGoal.owner}
                      onChange={e => setNewGoal({...newGoal, owner: e.target.value})}
                      placeholder="أحمد البارقي"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">الوزن النسبي (%)</label>
                    <input 
                      type="number" min="1" max="100"
                      value={newGoal.weight}
                      onChange={e => setNewGoal({...newGoal, weight: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                >
                  تثبيت الهدف بالشجرة
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADD INITIATIVE */}
      <AnimatePresence>
        {isNewInitiativeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right overflow-y-auto max-h-[90vh]"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">إضافة مبادرة أو مشروع تشغيلي جديد</h3>
                    <p className="text-[10px] text-slate-500">ربط الهدف الاستراتيجي، تحديد النطاق الزمني وتكليف المسؤول وإرسال إشعار فوري.</p>
                  </div>
                </div>
                <button onClick={() => setIsNewInitiativeOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInitiative} className="space-y-3.5 text-xs">
                
                {/* Strategic Goal Selector & Editable Custom Text */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block text-slate-700 font-bold text-[11px] flex items-center justify-between">
                    <span>🎯 الهدف الاستراتيجي المرتبط (قابل للتعديل والتحرير):</span>
                    <span className="text-[9.5px] text-indigo-600 font-normal">اختر من القائمة أو حرر النص مباشرة</span>
                  </label>
                  <select 
                    value={newInitiative.goalId}
                    onChange={e => {
                      const selected = goals.find(g => g.id === e.target.value);
                      setNewInitiative({
                        ...newInitiative, 
                        goalId: e.target.value,
                        customGoalName: selected ? selected.name : newInitiative.customGoalName
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                  >
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (الوزن النسبي: {g.weight}%)</option>
                    ))}
                  </select>
                  
                  <input 
                    type="text"
                    value={newInitiative.customGoalName}
                    onChange={e => setNewInitiative({...newInitiative, customGoalName: e.target.value})}
                    placeholder="أو اكتب/عدل نص الهدف الاستراتيجي المخصص هنا..."
                    className="w-full p-2 border border-indigo-200 rounded-lg bg-indigo-50/40 text-indigo-950 font-medium text-right focus:bg-white transition-colors"
                  />
                </div>

                {/* Name & Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">اسم المبادرة / المشروع</label>
                    <input 
                      type="text" required
                      value={newInitiative.name}
                      onChange={e => setNewInitiative({...newInitiative, name: e.target.value})}
                      placeholder="مثال: مشروع تكثيف الإتقان في العشر الأواخر"
                      className="w-full p-2 border border-slate-300 rounded-lg text-right font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">نوع الكيان</label>
                    <select 
                      value={newInitiative.type}
                      onChange={e => setNewInitiative({...newInitiative, type: e.target.value as any})}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="initiative">مبادرة نوعية</option>
                      <option value="project">مشروع تشغيلي</option>
                      <option value="program">برنامج تطويري</option>
                      <option value="activity">نشاط صفي</option>
                    </select>
                  </div>
                </div>

                {/* Date Range Selection (تحديد فترة زمنية للمبادرة) */}
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-2">
                  <label className="block text-amber-900 font-bold text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    تحديد الفترة الزمنية للمبادرة (تاريخ البداية والنهاية والمحيط الزمني):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-amber-800 mb-0.5">تاريخ بدء المبادرة</span>
                      <input 
                        type="date" required
                        value={newInitiative.startDate}
                        onChange={e => setNewInitiative({...newInitiative, startDate: e.target.value})}
                        className="w-full p-2 border border-amber-300 rounded-lg bg-white text-slate-800 font-mono text-xs text-right"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-amber-800 mb-0.5">تاريخ نهاية المبادرة (الموعد المعتمد)</span>
                      <input 
                        type="date" required
                        value={newInitiative.endDate}
                        onChange={e => setNewInitiative({...newInitiative, endDate: e.target.value})}
                        className="w-full p-2 border border-amber-300 rounded-lg bg-white text-slate-800 font-mono text-xs text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Responsible Staff Selector from STAFF_DIRECTORY (إظهار المعلمين والإداريين) */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2">
                  <label className="block text-indigo-950 font-bold text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      المسؤول عن التنفيذ (الكادر الميداني والإداري المتواجد):
                    </span>
                    <span className="text-[9.5px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                      يصل إشعار فوري لمركزه
                    </span>
                  </label>
                  
                  <select 
                    value={newInitiative.ownerPersonId}
                    onChange={e => {
                      const selectedPerson = STAFF_DIRECTORY.find((p: PersonItem) => p.id === e.target.value);
                      if (selectedPerson) {
                        setNewInitiative({
                          ...newInitiative,
                          ownerPersonId: selectedPerson.id,
                          owner: `${selectedPerson.name} (${selectedPerson.role})`
                        });
                      }
                    }}
                    className="w-full p-2.5 border border-indigo-300 rounded-lg bg-white text-slate-800 font-semibold text-xs"
                  >
                    {STAFF_DIRECTORY.map((person: PersonItem) => (
                      <option key={person.id} value={person.id}>
                        {person.name} — {person.role} [{person.circleName || person.role}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Impact */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الأثر المستهدف قياسه ومؤشرات العائد</label>
                  <textarea 
                    rows={2}
                    value={newInitiative.expectedImpact}
                    onChange={e => setNewInitiative({...newInitiative, expectedImpact: e.target.value})}
                    placeholder="مثال: الرفع من جودة الحفظ بنسبة ٢٥٪ وتقليل انحراف الخطة بمعدل ٥ أيام..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-right text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsNewInitiativeOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-all text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    حفظ المبادرة وإرسال الإشعار
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: EDIT INITIATIVE & DELEGATE */}
      <AnimatePresence>
        {editingInitiative && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">تعديل المبادرة وتوكيل المهام</h3>
                <button onClick={() => setEditingInitiative(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInitiativeEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">اسم المبادرة</label>
                  <input 
                    type="text" required
                    value={editingInitiative.name}
                    onChange={e => setEditingInitiative({...editingInitiative, name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">المسؤول الأول</label>
                    <input 
                      type="text" required
                      value={editingInitiative.owner}
                      onChange={e => setEditingInitiative({...editingInitiative, owner: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">المسمى / الدور</label>
                    <input 
                      type="text"
                      value={editingInitiative.assignedRole || ''}
                      onChange={e => setEditingInitiative({...editingInitiative, assignedRole: e.target.value})}
                      placeholder="مثال: مشرف الفرع / مدير البرنامج"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">المحطة/الجهة التالية عند الانتهاء</label>
                    <input 
                      type="text"
                      value={editingInitiative.nextRole || ''}
                      onChange={e => setEditingInitiative({...editingInitiative, nextRole: e.target.value})}
                      placeholder="مثال: معلم الحلقة / الإدارة المالي"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">الميزانية المعتمدة</label>
                    <input 
                      type="text"
                      value={editingInitiative.budget || ''}
                      onChange={e => setEditingInitiative({...editingInitiative, budget: e.target.value})}
                      placeholder="مثال: ٥,٠٠٠ ر.س"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">وصف المبادرة والأهداف التفصيلية</label>
                  <textarea 
                    rows={2}
                    value={editingInitiative.description}
                    onChange={e => setEditingInitiative({...editingInitiative, description: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">الأثر الفعلي المرصود</label>
                  <textarea 
                    rows={2}
                    value={editingInitiative.expectedImpact}
                    onChange={e => setEditingInitiative({...editingInitiative, expectedImpact: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الإنجاز الحالي (%)</label>
                    <input 
                      type="number" min="0" max="100"
                      value={editingInitiative.progress}
                      onChange={e => setEditingInitiative({...editingInitiative, progress: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">حالة المبادرة</label>
                    <select 
                      value={editingInitiative.status}
                      onChange={e => setEditingInitiative({...editingInitiative, status: e.target.value as any})}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    >
                      <option value="active">جاري التنفيذ</option>
                      <option value="stalled">متعثرة وتحتاج دعم</option>
                      <option value="completed">مكتملة</option>
                      <option value="closed">مغلقة نهائياً</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                >
                  حفظ التعديلات وتحديد المسار
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: EDIT TASK & DELEGATE */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">تعديل وتوكيل المهمة التنفيذية</h3>
                <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTaskEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">اسم المهمة</label>
                  <input 
                    type="text" required
                    value={editingTask.name}
                    onChange={e => setEditingTask({...editingTask, name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">من أوكل المهمة (المفوض)</label>
                    <input 
                      type="text" required
                      value={editingTask.owner}
                      onChange={e => setEditingTask({...editingTask, owner: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">الشخص الموكل إليه (المستلم المباشر)</label>
                    <input 
                      type="text" required
                      value={editingTask.assignee || ''}
                      onChange={e => setEditingTask({...editingTask, assignee: e.target.value})}
                      placeholder="اسم المعلم / الموظف..."
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">دور المستلم (المسمى الوظيفي)</label>
                    <input 
                      type="text"
                      value={editingTask.assigneeRole || ''}
                      onChange={e => setEditingTask({...editingTask, assigneeRole: e.target.value})}
                      placeholder="معلم حلقة / مشرف تربوي"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">المحطة القادمة (بعد الإنجاز)</label>
                    <input 
                      type="text"
                      value={editingTask.handoverTo || ''}
                      onChange={e => setEditingTask({...editingTask, handoverTo: e.target.value})}
                      placeholder="إدارة الاختبارات / المالية"
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الإنجاز (%)</label>
                    <input 
                      type="number" min="0" max="100"
                      value={editingTask.progress}
                      onChange={e => setEditingTask({...editingTask, progress: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">تاريخ الاستحقاق النهائي</label>
                    <input 
                      type="date"
                      value={editingTask.dueDate}
                      onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                >
                  حفظ توكيل المهمة وإشعاره
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: CLOSE ITEM WORKFLOW */}
      <AnimatePresence>
        {closingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">إغلاق وتوثيق العمل المنتهي</h3>
                <button onClick={() => setClosingModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmCloseItem} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block mb-0.5">العمل المراد إغلاقه:</span>
                  <span className="font-bold text-slate-800 text-xs block">{closingModal.item.name}</span>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">ملاحظات ونتائج الإغلاق النهائي</label>
                  <textarea 
                    rows={3} required
                    value={closeForm.closedNotes}
                    onChange={e => setCloseForm({...closeForm, closedNotes: e.target.value})}
                    placeholder="اكتب خلاصة الأثر والنتائج المحققة خلال فترة العمل..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">مدة التنفيذ الفعلية (بالأيام)</label>
                    <input 
                      type="number" min="1" required
                      value={closeForm.durationDays}
                      onChange={e => setCloseForm({...closeForm, durationDays: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الأثر المحقق (%)</label>
                    <input 
                      type="number" min="0" max="100" required
                      value={closeForm.finalRatio}
                      onChange={e => setCloseForm({...closeForm, finalRatio: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                >
                  تأكيد الإغلاق والأرشفة في الأثر
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: EDIT STRATEGIC GOAL */}
      <AnimatePresence>
        {editingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">تعديل الهدف والاستهدافات</h3>
                <button onClick={() => setEditingGoal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGoalEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">عنوان الهدف</label>
                  <input 
                    type="text" required
                    value={editingGoal.name}
                    onChange={e => setEditingGoal({...editingGoal, name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">وصف الهدف ومعيار التحقق</label>
                  <textarea 
                    rows={2}
                    value={editingGoal.description}
                    onChange={e => setEditingGoal({...editingGoal, description: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">المسؤول الرئيسي</label>
                    <input 
                      type="text"
                      value={editingGoal.owner}
                      onChange={e => setEditingGoal({...editingGoal, owner: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">الوزن النسبي (%)</label>
                    <input 
                      type="number" min="1" max="100"
                      value={editingGoal.weight}
                      onChange={e => setEditingGoal({...editingGoal, weight: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الإنجاز المحققة (%)</label>
                    <input 
                      type="number" min="0" max="100"
                      value={editingGoal.progress}
                      onChange={e => setEditingGoal({...editingGoal, progress: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold text-indigo-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">حالة الهدف</label>
                    <select 
                      value={editingGoal.status}
                      onChange={e => setEditingGoal({...editingGoal, status: e.target.value as any})}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    >
                      <option value="not_started">لم يبدأ بعد</option>
                      <option value="active">جاري العمل عليه</option>
                      <option value="stalled">متعثر</option>
                      <option value="completed">مكتمل</option>
                      <option value="archived">مؤرشف</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                >
                  حفظ وتحديث الهدف بالشجرة
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 8: SUBMIT COMPLETION REPORT (المسؤول رفع تقرير الإنجاز للإدارة) */}
      <AnimatePresence>
        {reportingItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">رفع تقرير إنجاز المهمة / المبادرة للإدارة</h3>
                    <p className="text-[10px] text-slate-500">
                      اسم العمل: <span className="font-bold text-indigo-700">{reportingItemModal.item.name}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setReportingItemModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitCompletionReport} className="space-y-3.5 text-xs">
                
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  💡 عند رفع التقرير تتحول المبادرة/المهمة إلى حالة <span className="font-bold">"قيد تعقيب ومراجعة الإدارة"</span>، ويصل إشعار فوري للجهة الإدارية العامة للتدقيق والاعتراف بالإنجاز أو التعقيب.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المدة المستغرق تنفيذها بالفعل</label>
                  <input 
                    type="text" required
                    value={completionForm.durationTaken}
                    onChange={e => setCompletionForm({...completionForm, durationTaken: e.target.value})}
                    placeholder="مثال: ١٤ يوماً (من ١٥ إلى ٢٩ رمضان)"
                    className="w-full p-2 border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الكيفية والأسلوب المتبع للوصول للهدف (كيف تم التنفيذ)</label>
                  <textarea 
                    rows={2} required
                    value={completionForm.methodology}
                    onChange={e => setCompletionForm({...completionForm, methodology: e.target.value})}
                    placeholder="شرح مختصر للآلية والخطوات العملية التي تم اتخاذها..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ملخص الإنجاز والمخرجات الرئيسية المحققة</label>
                  <textarea 
                    rows={3} required
                    value={completionForm.summaryNotes}
                    onChange={e => setCompletionForm({...completionForm, summaryNotes: e.target.value})}
                    placeholder="اكتب خلاصة النتائج، الأرقام المحققة، أسماء المشاركين أو المستفيدين..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">مؤشرات الأثر والروابط المرفقة (اختياري)</label>
                  <input 
                    type="text"
                    value={completionForm.outputs}
                    onChange={e => setCompletionForm({...completionForm, outputs: e.target.value})}
                    placeholder="رابط التقرير النهائي، كشوف الحضور، ملف الوثائق..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setReportingItemModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md transition-all text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    إرسال التقرير للإدارة العامة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
