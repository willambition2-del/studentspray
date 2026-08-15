/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Filter, Search, RotateCcw, Save, Download, Upload, 
  Play, Users, BookOpen, UserCheck, Activity, ChevronLeft, X, Check, SaveAll,
  Info, AlertTriangle, AlertCircle, TrendingUp, HelpCircle, History, Clock, ArrowLeftRight, Trash2,
  Bell, Send, User, ChevronDown, CheckCircle2, Eye, Sparkles, Building, Sliders, MessageSquare, Edit3, Plus,
  FileCheck, Lightbulb, MessageCircle, Zap, Calendar, CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getStoredStudentTasks, 
  saveStudentTask, 
  deleteStudentTask, 
  getStoredStudentPrivateAlerts, 
  replyToPrivateAlert, 
  getStoredStudentProposals, 
  replyToStudentProposal, 
  getStoredStudentSessionRequests,
  updateStudentSessionRequestStatus,
  deleteStudentSessionRequest,
  getStoredCircleCriteria, 
  saveCircleCriteria,
  StudentTaskOrProblem,
  StudentPrivateAlert,
  StudentProposal,
  StudentPrivateSessionRequest
} from '../lib/circleAlertsStorage';

// Directory of Personnel (Admin staff & Teachers)
export interface PersonItem {
  id: string;
  name: string;
  role: string;
  category: 'admin' | 'teacher';
  circleName?: string;
  phone?: string;
}

export const STAFF_DIRECTORY: PersonItem[] = [
  // Admin & Supervisors
  { id: 'p1', name: 'أ.د. عبدالله بن سليمان', role: 'المشرف العام على الملتقى', category: 'admin', phone: '0501112233' },
  { id: 'p2', name: 'أ. أحمد سالم العتيبي', role: 'المشرف التعليمي الرئيسي', category: 'admin', phone: '0502223344' },
  { id: 'p3', name: 'أ. طارق بن فهد', role: 'مدير شؤون الطلاب والمتابعة', category: 'admin', phone: '0503334455' },
  { id: 'p4', name: 'أ. صالح بن عبدالعزيز', role: 'مدير فرع الشمال', category: 'admin', phone: '0504445566' },
  { id: 'p5', name: 'أ. خالد بن عمر', role: 'مسؤول الاختبارات والتقييم', category: 'admin', phone: '0505556677' },
  { id: 'p6', name: 'أ. فهد الدوسري', role: 'المحاسب المالي والشؤون الإدارية', category: 'admin', phone: '0506667788' },
  // Teachers
  { id: 'p7', name: 'الشيخ/ يونس الدوسري', role: 'معلم حلقة عاصم', category: 'teacher', circleName: 'حلقة عاصم بن أبي النجود', phone: '0507778899' },
  { id: 'p8', name: 'الشيخ/ سالم بن عبدالعزيز التركي', role: 'معلم حلقة حفص', category: 'teacher', circleName: 'حلقة حفص بن سليمان', phone: '0508889900' },
  { id: 'p9', name: 'الشيخ/ محمد بن صالح العمري', role: 'معلم حلقة ابن كثير', category: 'teacher', circleName: 'حلقة ابن كثير', phone: '0509990011' },
  { id: 'p10', name: 'الشيخ/ علي بن مجد الماجد', role: 'معلم حلقة القراءات', category: 'teacher', circleName: 'حلقة القراءات العشر', phone: '0500001122' },
  { id: 'p11', name: 'الشيخ/ عبدالرحمن بن ناصر', role: 'معلم حلقة أبي عمرو', category: 'teacher', circleName: 'حلقة أبي عمرو البصري', phone: '0501113355' },
];

export interface DispatchedNotification {
  id: string;
  recipientName: string;
  recipientRole: string;
  alertTitle: string;
  alertId: string;
  sentAt: string;
  message: string;
  status: 'delivered' | 'read';
}

export interface TrackingAlert {
  id: string;
  title: string;
  type: 'attendance' | 'plan_delay' | 'review_lag' | 'circle_perf' | 'reports' | 'rating' | 'activity';
  severity: 'critical' | 'medium' | 'normal';
  entityName: string; // Name of student/circle/teacher
  circleName?: string;
  details: string;
  status: 'active' | 'assigned' | 'under_tracking' | 'resolved';
  notes?: string;
  assignedTo?: string; // Assigned supervisor/teacher
  assignedPersonId?: string;
  assignType?: 'supervisor' | 'teacher' | 'general';
  createdAt: string;
}

const INITIAL_TRACKING_ALERTS: TrackingAlert[] = [
  {
    id: 'tr-1',
    title: 'تجاوز حد الغياب المتتالي المسموح به',
    type: 'attendance',
    severity: 'critical',
    entityName: 'الطالب: أسامة بن خالد الريس',
    circleName: 'حلقة عاصم بن أبي النجود',
    details: 'تجاوز الطالب الحد الأقصى للغياب المتتالي بدون عذر مقبول، غياب 5 أيام متتالية في حلقة عاصم بفرع الشمال.',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tr-2',
    title: 'تأخر مستمر عن الخطة الدراسية المقررة',
    type: 'plan_delay',
    severity: 'critical',
    entityName: 'الطالب: أحمد محمد العبيد',
    circleName: 'حلقة عاصم بن أبي النجود',
    details: 'الطالب متأخر بمقدار 14 صفحة عن خطة حفظ جزء تبارك المقرة له في الفصل الحالي.',
    status: 'under_tracking',
    notes: 'تم التواصل مع ولي الأمر للاستفسار ويظهر كسل من الطالب.',
    assignedTo: 'الشيخ/ يونس الدوسري (معلم حلقة عاصم)',
    assignedPersonId: 'p7',
    assignType: 'teacher',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tr-3',
    title: 'تأخر في معدل المراجعة اليومية الفعالة',
    type: 'review_lag',
    severity: 'medium',
    entityName: 'الطالب: فيصل بن صالح السويد',
    circleName: 'حلقة حفص بن سليمان',
    details: 'تجاوز 12 يوماً منذ آخر عملية مراجعة مسجلة وموثقة داخل النظام لحفظه السابق.',
    status: 'active',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tr-4',
    title: 'حلقة منخفضة الأداء والالتزام الكلي',
    type: 'circle_perf',
    severity: 'medium',
    entityName: 'حلقة الإمام النافع (فرع الغرب)',
    circleName: 'حلقة الإمام النافع',
    details: 'نسبة الالتزام بخطط التسميع هبطت لتسجل 62%، وهو المنسوب الأقل في الفرع خلال أسبوعين.',
    status: 'assigned',
    assignedTo: 'أ.د. عبدالله بن سليمان (المشرف العام)',
    assignedPersonId: 'p1',
    assignType: 'supervisor',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tr-5',
    title: 'عدم رفع التقارير الدورية الإشرافية',
    type: 'reports',
    severity: 'critical',
    entityName: 'المدرس: سالم بن عبدالعزيز التركي',
    circleName: 'حلقة حفص بن سليمان',
    details: 'تخلف المعلم عن رفع 3 تقارير أسبوعية متتالية لنسب حضور ومستويات طلاب حلقة حفص.',
    status: 'active',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tr-6',
    title: 'انخفاض في التقييم الإداري والميداني للمدرس',
    type: 'rating',
    severity: 'normal',
    entityName: 'المدرس: محمد بن صالح العمري',
    circleName: 'حلقة ابن كثير',
    details: 'انخفض تقييم المعلم الإداري والميداني من قبل مشرف الفرع إلى 3.1 من أصل 5 خلال الزيارة الأخيرة.',
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 86450 * 1000).toISOString(),
  },
  {
    id: 'tr-7',
    title: 'أنشطة تنتظر الاعتماد الإداري بشكل متأخر',
    type: 'activity',
    severity: 'normal',
    entityName: 'رحلة فرع الشرق الترفيهية',
    details: 'نشاط ترفيهي تم تقديمه منذ 10 أيام وبانتظار الموافقة النهائية لاعتماد الميزانية وتفويج المشرفين.',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 86450 * 1000).toISOString(),
  }
];

// Configurable criteria schema for deficiency threshold
interface AlertCriteria {
  // Students
  studentAbsenceConsecutiveLimit: number;
  studentAbsenceTotalLimit: number;
  studentMinComplianceRate: number;
  studentMaxPlanDelayPages: number;
  studentMinProgressScore: number;
  studentMinReviewIntervalDays: number;
  // Circles
  circleMinAttendancePercent: number;
  circleMinPlanCompliancePercent: number;
  circleMinAvgTestScore: number;
  // Teachers
  teacherMinRatingLimit: number;
  teacherMaxDelayedReports: number;
  teacherMinAttendancePercent: number;
  // Activities
  activityMaxApprovalDelayDays: number;
  activityMinParticipationPercent: number;
}

const DEFAULT_CRITERIA: AlertCriteria = {
  studentAbsenceConsecutiveLimit: 3,
  studentAbsenceTotalLimit: 7,
  studentMinComplianceRate: 80,
  studentMaxPlanDelayPages: 10,
  studentMinProgressScore: 75,
  studentMinReviewIntervalDays: 7,
  circleMinAttendancePercent: 85,
  circleMinPlanCompliancePercent: 80,
  circleMinAvgTestScore: 80,
  teacherMinRatingLimit: 3.8,
  teacherMaxDelayedReports: 2,
  teacherMinAttendancePercent: 90,
  activityMaxApprovalDelayDays: 5,
  activityMinParticipationPercent: 60,
};

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  criteria: AlertCriteria;
}

const PRESET_TEMPLATES: TemplatePreset[] = [
  {
    id: 'tpl-default',
    name: 'المعايير الاعتيادية (الوضع الافتراضي)',
    description: 'المعايير المعتمدة لعامة فصول السنة، تراعي توازناً تاماً بين الضغط والتحفيز.',
    criteria: DEFAULT_CRITERIA
  },
  {
    id: 'tpl-ramadan',
    name: 'المقاييس الرمضانية (الخطة المكثفة)',
    description: 'معايير حاسمة وصارمة للغياب وتأخر الخطط لضمان إنجاز الحفظ في الفترات القصيرة.',
    criteria: {
      ...DEFAULT_CRITERIA,
      studentAbsenceConsecutiveLimit: 2,
      studentMinComplianceRate: 90,
      studentMaxPlanDelayPages: 5,
      studentMinReviewIntervalDays: 4,
      circleMinPlanCompliancePercent: 90,
      teacherMaxDelayedReports: 1,
    }
  },
  {
    id: 'tpl-summer',
    name: 'المقاييس الصيفية المرنة',
    description: 'تناسب مواسم الأنشطة الترويحية، مع تقليص حدود غرامات الغياب والتأخر الدراسي.',
    criteria: {
      ...DEFAULT_CRITERIA,
      studentAbsenceConsecutiveLimit: 5,
      studentAbsenceTotalLimit: 12,
      studentMinComplianceRate: 70,
      studentMaxPlanDelayPages: 18,
      studentMinReviewIntervalDays: 14,
      circleMinAttendancePercent: 75,
      teacherMaxDelayedReports: 4,
    }
  }
];

interface TrackingAlertsHubProps {
  currentUser?: any;
}

export default function TrackingAlertsHub({ currentUser }: TrackingAlertsHubProps) {
  const isTeacherUser = currentUser?.type === 'teacher';
  const isSupervisor = currentUser?.type === 'supervisor' || currentUser?.roleName?.includes('مشرف') || currentUser?.roleName?.includes('وجه');

  // Determine teacher profile for logged in user or selected ID
  const teacherPerson = isTeacherUser ? (
    STAFF_DIRECTORY.find(p => p.category === 'teacher' && (
      (currentUser?.name && p.name.includes(currentUser.name.split(' ')?.[1] || '')) ||
      (currentUser?.name && currentUser.name.includes(p.name.replace('الشيخ/ ', '').trim()))
    )) || STAFF_DIRECTORY.find(p => p.id === 'p7') || STAFF_DIRECTORY[6]
  ) : null;

  // Mode selection: 'full_center' (المكتب الرئيسي) or 'teacher_mini' (مركز المعلم المصغر للحلقة)
  const [viewMode, setViewMode] = useState<'full_center' | 'teacher_mini'>(
    isTeacherUser ? 'teacher_mini' : 'full_center'
  );
  
  // Selected teacher in mini mode
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teacherPerson ? teacherPerson.id : 'p7'
  );

  // Core states
  const [alerts, setAlerts] = useState<TrackingAlert[]>(INITIAL_TRACKING_ALERTS);
  const [criteria, setCriteria] = useState<AlertCriteria>(() => (getStoredCircleCriteria() as any) || DEFAULT_CRITERIA);
  const [presets, setPresets] = useState<TemplatePreset[]>(PRESET_TEMPLATES);

  const updateCriteria = (newCrit: AlertCriteria) => {
    setCriteria(newCrit);
    saveCircleCriteria(newCrit as any);
  };
  
  // Dispatched Notifications log
  const [dispatchedNotifications, setDispatchedNotifications] = useState<DispatchedNotification[]>([
    {
      id: 'notif-1',
      recipientName: 'الشيخ/ يونس الدوسري',
      recipientRole: 'معلم حلقة عاصم',
      alertTitle: 'تأخر مستمر عن الخطة الدراسية المقررة',
      alertId: 'tr-2',
      sentAt: new Date(Date.now() - 10 * 3600 * 1000).toLocaleString('ar-SA'),
      message: 'نحيطكم علماً بأنه تم تكليفكم بمتابعة الطالب أحمد العبيد وتزويده بخطة مراجعة مكثفة.',
      status: 'delivered'
    },
    {
      id: 'notif-2',
      recipientName: 'أ.د. عبدالله بن سليمان',
      recipientRole: 'المشرف العام',
      alertTitle: 'حلقة منخفضة الأداء والالتزام الكلي',
      alertId: 'tr-4',
      sentAt: new Date(Date.now() - 36 * 3600 * 1000).toLocaleString('ar-SA'),
      message: 'تم تحويل ملف حلقة الإمام النافع لسعادتكم لمتابعة تحسن نسب الحضور.',
      status: 'delivered'
    }
  ]);

  // Filtering & searching
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'medium' | 'normal'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Simulation states
  const [simulatorOutput, setSimulatorOutput] = useState<{
    predictedAlertsCount: number;
    affectedCircles: number;
    dangerLevel: 'low' | 'medium' | 'high';
    isSimulating: boolean;
    hasRun: boolean;
  }>({
    predictedAlertsCount: 7,
    affectedCircles: 3,
    dangerLevel: 'medium',
    isSimulating: false,
    hasRun: false
  });
  
  // Selected alert for assignment/handling
  const [selectedAlert, setSelectedAlert] = useState<TrackingAlert | null>(null);
  const [customActionNote, setCustomActionNote] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  
  // Teacher mini-action state
  const [miniTeacherNote, setMiniTeacherNote] = useState<string>('');
  const [miniSelectedAlertId, setMiniSelectedAlertId] = useState<string>('');

  // Teacher View Sub-tabs & Predictive Radar State
  const [teacherSubTab, setTeacherSubTab] = useState<'all' | 'predictive' | 'quick_action' | 'tasks' | 'requests'>('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [predictiveFilterRisk, setPredictiveFilterRisk] = useState<'all' | 'high' | 'medium'>('all');

  const [teacherPredictiveAlerts, setTeacherPredictiveAlerts] = useState([
    {
      id: 'pred-1',
      studentName: 'سلمان بن فهد الدوسري',
      studentGrade: 'الصف الثالث المتوسط',
      circleName: 'حلقة ابن كثير',
      riskCategory: 'exam_failure',
      riskTitle: '🔴 مؤشر خطر التعثر في الاختبار الشريطي القادم',
      probability: 82,
      riskLevel: 'high' as 'high' | 'medium',
      earlySignalNote: 'توقف تسميع المراجعة الكبرى لأربعة أيام متتالية مع انخفاض ملحوظ في الدرجة التقييمية للحفظ السابق.',
      suggestedAction: 'تخصيص 5 أوجه مراجعة يومياً وتنشيط جدول المراجعة الكبرى بحلقة ابن كثير.',
      targetTaskTitle: 'البدء بالمراجعة الكبرى',
      status: 'active' as 'active' | 'task_created' | 'resolved'
    },
    {
      id: 'pred-2',
      studentName: 'معاذ بن خالد بن عبدالله النفيسي',
      studentGrade: 'الصف الثاني المتوسط',
      circleName: 'حلقة ابن كثير',
      riskCategory: 'plan_lag',
      riskTitle: '🔴 مؤشر اتساع فجوة الخطة المنهجية (جزء تبارك)',
      probability: 78,
      riskLevel: 'high' as 'high' | 'medium',
      earlySignalNote: 'تراكم تأخر بـ 4 صفحات عن مقرر جزء تبارك لهذا الأسبوع قبل الدخول في سورة القلم.',
      suggestedAction: 'تدارك التأخر بحفظ صفحتين إضافيتين وتسجيل تلاوة صوتية للمعلم عبر التطبيق.',
      targetTaskTitle: 'تدارك تأخر خطة جزء تبارك والتثبيت اليومي',
      status: 'active' as 'active' | 'task_created' | 'resolved'
    },
    {
      id: 'pred-3',
      studentName: 'أسامة بن خالد الريس',
      studentGrade: 'الصف الثاني المتوسط',
      circleName: 'حلقة ابن كثير',
      riskCategory: 'recitation_quality',
      riskTitle: '🟡 مؤشر تراجع جودة الترتيل والتردد اللفظي',
      probability: 65,
      riskLevel: 'medium' as 'high' | 'medium',
      earlySignalNote: 'رصد 3 حالات تردد حركي وتلعثم في أحكام القلقلة ومخارج النون الساكنة بسورة النساء.',
      suggestedAction: 'ربطه بالزميل القرآني (معاذ النفيسي) لمراجعة أول 50 آية وتطبيق التجويد.',
      targetTaskTitle: 'معالجة بطء التسميع وتعديل مخارج الحروف',
      status: 'active' as 'active' | 'task_created' | 'resolved'
    },
    {
      id: 'pred-4',
      studentName: 'أحمد محمد العبيد',
      studentGrade: 'الصف الأول الثانوي',
      circleName: 'حلقة ابن كثير',
      riskCategory: 'absence_drop',
      riskTitle: '🟡 مؤشر توقع انقطاع وشيك وتراجع الانضباط',
      probability: 58,
      riskLevel: 'medium' as 'high' | 'medium',
      earlySignalNote: 'تكرار التأخر الصباحي عن الموعد بـ 15 دقيقة مرتين متتاليتين طوال الأسبوع.',
      suggestedAction: 'اتصال استباقي وقائي بولي الأمر لتفادي الغياب المتصل قبل حدوثه.',
      targetTaskTitle: 'توثيق التواصل الاستباقي مع ولي الأمر',
      status: 'active' as 'active' | 'task_created' | 'resolved'
    }
  ]);

  const handleConvertPredictiveToTask = (predId: string) => {
    const item = teacherPredictiveAlerts.find(p => p.id === predId);
    if (!item) return;

    const existing = teacherTasks.find(t => t.studentName === item.studentName && t.title === item.targetTaskTitle);
    if (!existing) {
      const newTask: StudentTaskOrProblem = {
        id: `st-task-pred-${Date.now()}`,
        studentId: 'STU-1447-092',
        studentName: item.studentName,
        circleName: currentTeacherObj.circleName || 'حلقة ابن كثير',
        teacherName: currentTeacherObj.name,
        title: item.targetTaskTitle,
        type: 'urgent_review',
        description: item.earlySignalNote,
        requiredAction: item.suggestedAction,
        priority: item.riskLevel === 'high' ? 'urgent' : 'medium',
        status: 'pending',
        assignedAt: new Date().toLocaleString('ar-SA')
      };
      const updated = saveStudentTask(newTask);
      setTeacherTasks(updated);
    }

    setTeacherPredictiveAlerts(prev => prev.map(p => p.id === predId ? { ...p, status: 'task_created' } : p));
    showToast(`🚀 تم تحويل مؤشر التنبؤ المبكر للطالب (${item.studentName}) إلى تكليف وقائي مباشر!`);
  };

  // Circle tasks & Student interaction state
  const [teacherTasks, setTeacherTasks] = useState<StudentTaskOrProblem[]>([]);
  const [studentPrivateAlerts, setStudentPrivateAlerts] = useState<StudentPrivateAlert[]>([]);
  const [studentProposals, setStudentProposals] = useState<StudentProposal[]>([]);
  const [studentSessionRequests, setStudentSessionRequests] = useState<StudentPrivateSessionRequest[]>([]);
  
  // Modals for teacher
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    title: '',
    description: '',
    requiredAction: '',
    priority: 'medium' as 'urgent' | 'medium' | 'low'
  });

  const [activeAlertToReply, setActiveAlertToReply] = useState<StudentPrivateAlert | null>(null);
  const [activeProposalToReply, setActiveProposalToReply] = useState<StudentProposal | null>(null);
  const [activeSessionToSchedule, setActiveSessionToSchedule] = useState<StudentPrivateSessionRequest | null>(null);
  const [sessionScheduleDate, setSessionScheduleDate] = useState('');
  const [sessionTeacherNote, setSessionTeacherNote] = useState('');
  const [replyText, setReplyText] = useState('');

  const reloadTeacherStudentComm = () => {
    setTeacherTasks(getStoredStudentTasks());
    setStudentPrivateAlerts(getStoredStudentPrivateAlerts());
    setStudentProposals(getStoredStudentProposals());
    setStudentSessionRequests(getStoredStudentSessionRequests());
  };

  useEffect(() => {
    reloadTeacherStudentComm();
    const handleUpdate = () => {
      reloadTeacherStudentComm();
    };
    window.addEventListener('alhudacenter_student_comm_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('alhudacenter_student_comm_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Operational Logs state
  const [opLogs, setOpLogs] = useState<Array<{
    id: string;
    alertTitle: string;
    actionType: string;
    details: string;
    timestamp: string;
  }>>([
    {
      id: 'log-initial-1',
      alertTitle: 'تأخر مستمر عن الخطة الدراسية المقررة',
      actionType: 'إسناد وتكليف مع إشعار',
      details: 'تم تعيين القضية للمعلم يونس الدوسري وإرسال إشعار آلي له عبر النظام.',
      timestamp: new Date(Date.now() - 10 * 3600 * 1000).toLocaleString('ar-SA'),
    },
    {
      id: 'log-initial-2',
      alertTitle: 'تأخر في معدل المراجعة اليومية الفعالة',
      actionType: 'تدوين ملاحظة ومتابعة',
      details: 'تم إجراء مكالمة هاتفية مع والد الطالب وأفاد بمرضه المؤقت.',
      timestamp: new Date(Date.now() - 15 * 3600 * 1000).toLocaleString('ar-SA'),
    }
  ]);

  // Toast notifications feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Run Auto Deficiency Scan based on configurable metrics
  const runDeficiencyScanAndNotify = () => {
    // Generate new automated deficiency alert based on threshold evaluation
    const nowStr = new Date().toISOString();
    const newDeficiencyAlerts: TrackingAlert[] = [
      {
        id: `auto-def-${Date.now()}-1`,
        title: `تجاوز حد الغياب الفردي (${criteria.studentAbsenceConsecutiveLimit} أيام)`,
        type: 'attendance',
        severity: 'critical',
        entityName: 'الطالب: عبدالملك بن فهد العتيبي',
        circleName: 'حلقة عاصم بن أبي النجود',
        details: `رصد تقصير: الطالب غائب لمدة ${criteria.studentAbsenceConsecutiveLimit + 1} أيام متتالية متجاوزاً المعيار المسموح (${criteria.studentAbsenceConsecutiveLimit} أيام).`,
        status: 'active',
        createdAt: nowStr,
      },
      {
        id: `auto-def-${Date.now()}-2`,
        title: `تجاوز حد تأخر الخطة (${criteria.studentMaxPlanDelayPages} صفحة)`,
        type: 'plan_delay',
        severity: 'medium',
        entityName: 'الطالب: معاذ بن عبدالعزيز',
        circleName: 'حلقة حفص بن سليمان',
        details: `رصد تقصير: الطالب متأخر بمقدار ${criteria.studentMaxPlanDelayPages + 3} صفحات عن الخطة الدراسية.`,
        status: 'active',
        createdAt: nowStr,
      }
    ];

    setAlerts(prev => [...newDeficiencyAlerts, ...prev]);

    // Send automated notification to school head supervisor
    const autoNotif: DispatchedNotification = {
      id: `notif-auto-${Date.now()}`,
      recipientName: 'أ. طارق بن فهد',
      recipientRole: 'مدير شؤون الطلاب والمتابعة',
      alertTitle: 'تقرير الفحص الآلي لحالات التقصير والرصد',
      alertId: newDeficiencyAlerts[0].id,
      sentAt: new Date().toLocaleString('ar-SA'),
      message: `تم إجراء فحص آلي بناءً على المعايير المعدلة، وتبيّن وجود ${newDeficiencyAlerts.length} حالة تقصير جديدة تتطلب التوجيه.`,
      status: 'delivered'
    };

    setDispatchedNotifications(prev => [autoNotif, ...prev]);

    showToast(`⚡ تم فحص التقصير الآلي بنجاح! تم رصد حالة تقصير وإرسال إشعار فوري لمدير شؤون الطلاب.`);
  };

  // Run the criteria simulation based on current sliders
  const runSimulator = () => {
    setSimulatorOutput(prev => ({ ...prev, isSimulating: true }));
    
    setTimeout(() => {
      let predicted = 7;
      let circles = 3;
      let level: 'low' | 'medium' | 'high' = 'medium';
      
      if (criteria.studentAbsenceConsecutiveLimit <= 2) {
        predicted += 6;
        circles += 1;
      } else if (criteria.studentAbsenceConsecutiveLimit >= 5) {
        predicted -= 3;
        circles -= 1;
      }
      
      if (criteria.studentMaxPlanDelayPages <= 6) {
        predicted += 8;
        circles += 2;
      } else if (criteria.studentMaxPlanDelayPages >= 15) {
        predicted -= 2;
      }
      
      if (criteria.teacherMinRatingLimit >= 4.2) {
        predicted += 4;
      } else if (criteria.teacherMinRatingLimit <= 3.2) {
        predicted -= 1;
      }

      predicted = Math.max(1, predicted);
      circles = Math.max(1, Math.min(circles, 8));
      
      if (predicted > 12) level = 'high';
      else if (predicted < 5) level = 'low';
      
      setSimulatorOutput({
        predictedAlertsCount: predicted,
        affectedCircles: circles,
        dangerLevel: level,
        isSimulating: false,
        hasRun: true
      });
      
      showToast('✓ تمت عملية المحاكاة الحية بنجاح وتحديث تقديرات المخاطر.');
    }, 1000);
  };

  // Handle template selection change
  const applyTemplatePreset = (presetId: string) => {
    const selected = presets.find(p => p.id === presetId);
    if (selected) {
      setCriteria({ ...selected.criteria });
      showToast(`✓ تم تطبيق القالب: (${selected.name}) على كافة مستشعرات المركز.`);
    }
  };

  const handleFactoryReset = () => {
    setCriteria({ ...DEFAULT_CRITERIA });
    showToast('✓ تم بنجاح تصفير معايير الرصد واستعادة ملف معايير المصنع الفنية.');
  };

  // Template Editing CRUD State & Handlers
  const [editingPreset, setEditingPreset] = useState<TemplatePreset | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);

  const handleOpenEditPresetModal = (preset: TemplatePreset) => {
    setEditingPreset(JSON.parse(JSON.stringify(preset)));
    setIsPresetModalOpen(true);
  };

  const handleOpenAddPresetModal = () => {
    setEditingPreset({
      id: `tpl-custom-${Date.now()}`,
      name: 'قالب معايير جديد',
      description: 'توصيف معايير الرصد الخاصة بهذا القالب.',
      criteria: { ...criteria }
    });
    setIsPresetModalOpen(true);
  };

  const handleSavePresetModal = () => {
    if (!editingPreset) return;
    if (!editingPreset.name.trim()) {
      alert('يرجى كتابة اسم القالب أولاً.');
      return;
    }

    setPresets(prev => {
      const exists = prev.some(p => p.id === editingPreset.id);
      if (exists) {
        return prev.map(p => p.id === editingPreset.id ? editingPreset : p);
      } else {
        return [...prev, editingPreset];
      }
    });

    showToast(`✓ تم حفظ وتحديث القالب (${editingPreset.name}) بنجاح.`);
    setIsPresetModalOpen(false);
    setEditingPreset(null);
  };

  const handleDeletePreset = (presetId: string) => {
    const target = presets.find(p => p.id === presetId);
    if (!target) return;
    if (confirm(`هل أنت تأكد من حذف القالب: "${target.name}"؟`)) {
      setPresets(prev => prev.filter(p => p.id !== presetId));
      showToast(`✓ تم حذف القالب بنجاح.`);
    }
  };

  const handleSaveTemplate = () => {
    const customName = prompt('يرجى تحديد اسم للقالب المخصص:');
    if (!customName) return;
    
    const newPreset: TemplatePreset = {
      id: `tpl-user-${Date.now()}`,
      name: customName,
      description: 'قالب معيّن محلياً بواسطة المشرف العام.',
      criteria: { ...criteria }
    };
    
    setPresets([...presets, newPreset]);
    showToast(`✓ تم تسجيل وحفظ القالب الجديد (${customName}) لسرعة الاستيراد متى شئت.`);
  };

  const handleExportTemplate = () => {
    const jsonStr = JSON.stringify(criteria, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast('✓ تم توليد ملف تشفير المعايير ونسخه لحافظة جهازك بنجاح.');
  };

  const handleImportTemplate = () => {
    const pasted = prompt('قم بلصق محتوى تشفير المعايير المصدر سابقاً لتطبيقه:');
    if (!pasted) return;
    try {
      const parsed = JSON.parse(pasted);
      if (typeof parsed.studentAbsenceConsecutiveLimit === 'number') {
        setCriteria({ ...DEFAULT_CRITERIA, ...parsed });
        showToast('✓ تم فك التشفير واستيراد قالب المعايير وتطبيقه فورا على قنوات الفحص.');
      } else {
        alert('القالب المستورد غير متوافق أو بنيته تالفة.');
      }
    } catch (e) {
      alert('فشل معالجة النص كملف تكويني. يرجى التأكد من نسخه بالكامل.');
    }
  };

  // Handle assigning alert to selected person from STAFF_DIRECTORY
  const handleAssignToPersonAndNotify = (status: 'assigned' | 'under_tracking' | 'resolved') => {
    if (!selectedAlert) return;

    const person = STAFF_DIRECTORY.find(p => p.id === selectedPersonId);
    const personName = person ? person.name : 'مسؤول إداري';
    const personRole = person ? person.role : 'متابعة ميدانية';

    const updatedAlerts = alerts.map(a => {
      if (a.id === selectedAlert.id) {
        const up: TrackingAlert = { ...a, status };
        if (status === 'assigned' && person) {
          up.assignedTo = `${person.name} (${person.role})`;
          up.assignedPersonId = person.id;
          up.assignType = person.category === 'teacher' ? 'teacher' : 'supervisor';
        }
        if (customActionNote) {
          up.notes = customActionNote;
        }
        return up;
      }
      return a;
    });

    setAlerts(updatedAlerts);

    // Create & dispatch notification to the selected person
    if (status === 'assigned' && person) {
      const newNotif: DispatchedNotification = {
        id: `notif-${Date.now()}`,
        recipientName: person.name,
        recipientRole: person.role,
        alertTitle: selectedAlert.title,
        alertId: selectedAlert.id,
        sentAt: new Date().toLocaleString('ar-SA'),
        message: `تم تكليفكم بمتابعة القضية: (${selectedAlert.title}) - ${selectedAlert.entityName}. الملاحظات: ${customActionNote || 'يرجى المتابعة العاجلة.'}`,
        status: 'delivered'
      };
      setDispatchedNotifications(prev => [newNotif, ...prev]);
    }

    // Log action
    let actionLabel = 'معالجة وتصويب';
    if (status === 'assigned') actionLabel = 'إسناد وتكليف مع إشعار';
    if (status === 'under_tracking') actionLabel = 'الوضع قيد المراقبة النشطة';
    
    const actionDesc = `${status === 'assigned' ? `تم تكليف (${personName}) وتوجيه إشعار فوري له عبر النظام` : status === 'under_tracking' ? 'إدراجه بموجة المراقبة اللصيقة' : 'حل المشكلة وإغلاق الملف'} • الملاحظات: ${customActionNote || 'لا توجد'}`;

    const newLog = {
      id: `op-log-${Date.now()}`,
      alertTitle: selectedAlert.title,
      actionType: actionLabel,
      details: actionDesc,
      timestamp: new Date().toLocaleString('ar-SA')
    };

    setOpLogs([newLog, ...opLogs]);

    if (status === 'assigned' && person) {
      showToast(`🔔 تم إرسال إشعار فوري وتكليف (${person.name}) بالمهمة بنجاح!`);
    } else {
      showToast(`✓ تمت العملية بنجاح وتحديث حالة التنبيه (${selectedAlert.title}).`);
    }

    setSelectedAlert(null);
    setCustomActionNote('');
    setSelectedPersonId('');
  };

  // Quick action from teacher in Mini Mode
  const handleTeacherMiniAction = (actionType: 'parent_call' | 'resolve' | 'escalate') => {
    if (!miniSelectedAlertId) return;

    const alertItem = alerts.find(a => a.id === miniSelectedAlertId);
    if (!alertItem) return;

    const currentTeacher = STAFF_DIRECTORY.find(p => p.id === selectedTeacherId) || STAFF_DIRECTORY[6];

    if (actionType === 'resolve') {
      setAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'resolved', notes: `تم الإنجاز بحلقة المعلم: ${miniTeacherNote}` } : a));
      showToast(`✓ تم إغلاق التنبيه وتوثيق الإنجاز في حلقة ${currentTeacher.circleName}`);
    } else if (actionType === 'parent_call') {
      setAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'under_tracking', notes: `تواصل المعلم مع ولي الأمر: ${miniTeacherNote}` } : a));
      showToast(`📞 تم تسجيل التواصل مع ولي الأمر ووضع الطالب تحت المتابعة بالحلقة.`);
    } else if (actionType === 'escalate') {
      setAlerts(prev => prev.map(a => a.id === miniSelectedAlertId ? { ...a, status: 'assigned', assignedTo: 'أ. طارق بن فهد (مدير شؤون الطلاب)', notes: `تصعيد من المعلم للمشرف: ${miniTeacherNote}` } : a));
      
      // Dispatch notification to supervisor
      const escNotif: DispatchedNotification = {
        id: `notif-esc-${Date.now()}`,
        recipientName: 'أ. طارق بن فهد',
        recipientRole: 'مدير شؤون الطلاب والمتابعة',
        alertTitle: `طلب دعم من المعلم: ${currentTeacher.name}`,
        alertId: miniSelectedAlertId,
        sentAt: new Date().toLocaleString('ar-SA'),
        message: `رفع المعلم ${currentTeacher.name} طلب دعم وتدخل بخصوص: ${alertItem.entityName}. التفاصيل: ${miniTeacherNote || 'يحتاج تواصل إداري مع ولي الأمر.'}`,
        status: 'delivered'
      };
      setDispatchedNotifications(prev => [escNotif, ...prev]);

      showToast(`🚀 تم تصعيد الحالة وإرسال إشعار فوري لمدير شؤون الطلاب.`);
    }

    setMiniTeacherNote('');
    setMiniSelectedAlertId('');
  };

  // Filter alerts for display
  const currentTeacherObj = isTeacherUser
    ? (teacherPerson || STAFF_DIRECTORY[6])
    : (STAFF_DIRECTORY.find(p => p.id === selectedTeacherId) || STAFF_DIRECTORY[6]);

  const filteredAlerts = alerts.filter(alert => {
    // In teacher mini mode or if logged in as a teacher, strictly restrict to the teacher's circle and students
    if (viewMode === 'teacher_mini' || isTeacherUser) {
      const matchCircle = currentTeacherObj.circleName && alert.circleName === currentTeacherObj.circleName;
      const matchAssigned = alert.assignedPersonId === currentTeacherObj.id;
      const matchEntity = alert.entityName.includes(currentTeacherObj.name) || (currentTeacherObj.circleName && alert.details.includes(currentTeacherObj.circleName));
      if (!matchCircle && !matchAssigned && !matchEntity) return false;
    }

    const matchesSeverity = activeTab === 'all' ? true : alert.severity === activeTab;
    const matchesStatus = statusFilter === 'all' ? true : alert.status === statusFilter;
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.details.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const numOpen = alerts.filter(a => a.status === 'active').length;
  const numClosed = alerts.filter(a => a.status === 'resolved').length;
  const numTracking = alerts.filter(a => a.status === 'under_tracking' || a.status === 'assigned').length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="tracking-alerts-hub-root">
      
      {/* Toast notification component */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-5 bg-slate-900 text-white p-3.5 px-5 rounded-2xl text-xs font-bold shadow-2xl z-50 flex items-center gap-2.5 border border-slate-700 font-mono"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODE HEADER TOGGLE & INTRO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-1 px-3 rounded-full text-[10px] font-bold">مركز المتابعة والاستكشاف الوقائي</span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 p-1 px-2.5 rounded-full text-[10px] font-bold">ربط الكادر الإداري والمدرسين</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">مركز التنبيهات والقرارات الميدانية</h2>
          <p className="text-slate-500 text-xs font-medium">رصد حالات التقصير، تكليف المسؤولين والمدرسين بالأسماء، وإدارة التنبيهات والمقاييس بمرونة كاملة.</p>
        </div>

        {/* VIEW MODE SWITCHER BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('full_center')}
            className={`flex items-center gap-2 p-2 px-3.5 rounded-xl shrink-0 z-10 font-bold text-xs cursor-pointer transition-all ${
              viewMode === 'full_center'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>اللوحة العامة للإدارة والمشرفين</span>
          </button>

          <button
            onClick={() => setViewMode('teacher_mini')}
            className={`flex items-center gap-2 p-2 px-3.5 rounded-xl shrink-0 z-10 font-bold text-xs cursor-pointer transition-all ${
              viewMode === 'teacher_mini'
                ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-400/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>مركز المتابعة والتنبؤ الوقائي للمعلم (لوحة حلقة المعلم)</span>
          </button>
        </div>
      </div>

      {/* IF IN TEACHER MINI MODE: TEACHER SELECTOR BAR, PREDICTIVE RADAR & QUICK ACTIONS */}
      {(viewMode === 'teacher_mini' || isTeacherUser) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white p-5 lg:p-6 rounded-2xl space-y-5 shadow-2xl border border-indigo-800/80"
        >
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  لوحة المعلم الخاصة بالحلقة
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  رصد مباشر وتنبؤ وقائي
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  تحديث فوري للمقاييس
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2 pt-1">
                <span>الشيخ/ محمد بن صالح العمري</span>
                <span className="text-indigo-400 text-sm font-normal">• {currentTeacherObj.circleName}</span>
              </h3>
            </div>

            {/* Quick Metrics Bar & Teacher Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs">
                <div className="text-center px-1">
                  <span className="text-[10px] text-slate-400 block font-bold">استقرار الحلقة</span>
                  <span className="text-emerald-400 font-extrabold text-sm">88%</span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="text-center px-1">
                  <span className="text-[10px] text-slate-400 block font-bold">إنذارات التنبؤ</span>
                  <span className="text-amber-400 font-extrabold text-sm">{teacherPredictiveAlerts.filter(p => p.status === 'active').length}</span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="text-center px-1">
                  <span className="text-[10px] text-slate-400 block font-bold">المهام الكلية</span>
                  <span className="text-indigo-300 font-extrabold text-sm">{teacherTasks.length}</span>
                </div>
              </div>

              {!isTeacherUser && (
                <div className="flex items-center gap-2 bg-indigo-900/60 p-1.5 px-3 rounded-xl border border-indigo-700/60 text-xs">
                  <span className="text-indigo-200 font-bold text-[11px]">معلم حلقة:</span>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="bg-indigo-950 border border-indigo-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {STAFF_DIRECTORY.filter(p => p.category === 'teacher').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.circleName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-indigo-800/60 pb-3">
            <button
              onClick={() => setTeacherSubTab('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                teacherSubTab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🌟 العرض الشامل اللحظي</span>
            </button>

            <button
              onClick={() => setTeacherSubTab('predictive')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                teacherSubTab === 'predictive'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>🔮 رادار التنبؤ والتدهور المبكر</span>
              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {teacherPredictiveAlerts.filter(p => p.status === 'active').length}
              </span>
            </button>

            <button
              onClick={() => setTeacherSubTab('quick_action')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                teacherSubTab === 'quick_action'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ المتابعة والتصعيد السريع</span>
            </button>

            <button
              onClick={() => setTeacherSubTab('tasks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                teacherSubTab === 'tasks'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>📋 مهام وتكليفات الطلاب ({teacherTasks.length})</span>
            </button>

            <button
              onClick={() => setTeacherSubTab('requests')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                teacherSubTab === 'requests'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>📬 الوارد من الطلاب ({studentSessionRequests.length + studentPrivateAlerts.length + studentProposals.length})</span>
              {studentSessionRequests.filter(s => s.status === 'pending').length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {studentSessionRequests.filter(s => s.status === 'pending').length} جلسة جديدة
                </span>
              )}
            </button>
          </div>

          {/* TAB 1 & ALL: PREDICTIVE WARNING RADAR */}
          {(teacherSubTab === 'all' || teacherSubTab === 'predictive') && (
            <div className="bg-indigo-950/70 p-4 rounded-xl border border-indigo-700/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    رادار التنبؤ المبكر ومؤشرات التدهور قبل الوقوع ({currentTeacherObj.circleName})
                  </h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    خوارزميات التنبؤ المستمر ترصد وتستكشف انخفاض الأداء أو توقف التسميع وتطرح توجيهات وقائية استباقية.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-indigo-900/80 p-1 rounded-lg border border-indigo-700/50 text-[10px]">
                  <span className="text-slate-300 px-1 font-bold">تصفية الخطورة:</span>
                  <button
                    onClick={() => setPredictiveFilterRisk('all')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      predictiveFilterRisk === 'all' ? 'bg-amber-400 text-slate-950' : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setPredictiveFilterRisk('high')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      predictiveFilterRisk === 'high' ? 'bg-rose-500 text-white' : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    🔴 عالية 70%+
                  </button>
                  <button
                    onClick={() => setPredictiveFilterRisk('medium')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      predictiveFilterRisk === 'medium' ? 'bg-amber-500 text-slate-950' : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    🟡 متوسطة
                  </button>
                </div>
              </div>

              {/* Predictive Warning Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {teacherPredictiveAlerts
                  .filter(p => predictiveFilterRisk === 'all' || p.riskLevel === predictiveFilterRisk)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        item.status === 'task_created'
                          ? 'bg-emerald-950/30 border-emerald-600/50 text-slate-200'
                          : item.riskLevel === 'high'
                          ? 'bg-rose-950/40 border-rose-700/60 text-slate-100 hover:border-rose-500'
                          : 'bg-amber-950/30 border-amber-700/60 text-slate-100 hover:border-amber-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-amber-300 text-sm">{item.studentName}</span>
                          <span className="text-[10px] text-indigo-200 block font-medium">{item.studentGrade}</span>
                        </div>

                        <div className="text-left shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] block ${
                              item.riskLevel === 'high' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                            }`}
                          >
                            احتمالية التعثر: {item.probability}%
                          </span>
                          <span className="text-[9px] text-indigo-300 block mt-0.5 font-bold">
                            {item.status === 'task_created' ? '✓ تم تحويله لتكليف وقائي' : 'مستشعر آلي'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-black/30 rounded-lg space-y-1">
                        <p className="font-bold text-white text-xs">{item.riskTitle}</p>
                        <p className="text-[10.5px] text-slate-300 leading-relaxed">
                          <strong>سبب التنبؤ:</strong> {item.earlySignalNote}
                        </p>
                      </div>

                      <div className="p-2 bg-indigo-900/60 rounded-lg text-[10.5px] text-emerald-200 border border-indigo-700/50">
                        <strong>التوجيه الوقائي الموصى به:</strong> {item.suggestedAction}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-white/10">
                        {item.status !== 'task_created' ? (
                          <button
                            onClick={() => handleConvertPredictiveToTask(item.id)}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5 text-slate-900" />
                            <span>🚀 تحويل لتكليف وقائي فوراً</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-600/60 px-2 py-0.5 rounded">
                            ✓ التكليف الوقائي نشط بملف الطالب
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setMiniSelectedAlertId(alerts[0]?.id || '');
                            setMiniTeacherNote(`تواصل وقائي استباقي مع ولي أمر الطالب ${item.studentName} لتفادي ${item.riskTitle}`);
                            setTeacherSubTab('quick_action');
                            showToast(`📞 تم تجهيز نموذج التواصل الوقائي بولي أمر ${item.studentName}`);
                          }}
                          className="bg-indigo-800 hover:bg-indigo-700 text-indigo-100 font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          📞 اتصال وقائي
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 2 & ALL: QUICK ACTIONS FORM */}
          {(teacherSubTab === 'all' || teacherSubTab === 'quick_action') && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                مركز المتابعة والتصعيد السريع للمعلم (تسجيل إجراء مباشر)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                <div className="md:col-span-5">
                  <label className="block text-[10px] text-slate-300 mb-1 font-bold">اختر الطالب أو التنبيه الخاص بحلقتك للمعالجة:</label>
                  <select
                    value={miniSelectedAlertId}
                    onChange={(e) => setMiniSelectedAlertId(e.target.value)}
                    className="w-full p-2 bg-indigo-950 border border-indigo-700 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- اختر التنبيه أو الطالب المعني --</option>
                    {filteredAlerts.map(a => (
                      <option key={a.id} value={a.id}>
                        [{a.entityName}] - {a.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-7">
                  <label className="block text-[10px] text-slate-300 mb-1 font-bold">ملاحظة المعلم والتأطير الميداني:</label>
                  <input
                    type="text"
                    value={miniTeacherNote}
                    onChange={(e) => setMiniTeacherNote(e.target.value)}
                    placeholder="مثال: تم الاتصال بوالد الطالب وتعهد بالمواظبة أو تسميع الاستثنائي غداً..."
                    className="w-full p-2 bg-indigo-950 border border-indigo-700 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Quick Template Chips for Notes */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-indigo-300 font-bold">عبارات سريعة للتدوين:</span>
                <button
                  type="button"
                  onClick={() => setMiniTeacherNote('تم الاتصال بوالد الطالب وتعهد بالالتزام والتثبيت الحثيث ابتداءً من الغد.')}
                  className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[9.5px] px-2 py-0.5 rounded border border-indigo-700/50 cursor-pointer"
                >
                  "اتصال بولي الأمر"
                </button>
                <button
                  type="button"
                  onClick={() => setMiniTeacherNote('تم معالجة التردد في الأحكام وحفظ المقرر بحلقة المعلم بنجاح.')}
                  className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[9.5px] px-2 py-0.5 rounded border border-indigo-700/50 cursor-pointer"
                >
                  "تسميع وتسوية بالكامل"
                </button>
                <button
                  type="button"
                  onClick={() => setMiniTeacherNote('يحتاج الطالب إلى جلسة إرشاد ومتابعة مكثفة من قبل إدارة شؤون الطلاب.')}
                  className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[9.5px] px-2 py-0.5 rounded border border-indigo-700/50 cursor-pointer"
                >
                  "تصعيد شؤون الطلاب"
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleTeacherMiniAction('parent_call')}
                  disabled={!miniSelectedAlertId}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  📞 توثيق التواصل مع ولي الأمر
                </button>
                <button
                  onClick={() => handleTeacherMiniAction('resolve')}
                  disabled={!miniSelectedAlertId}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  ✓ تسميع وتسوية التنبيه بالحلقة
                </button>
                <button
                  onClick={() => handleTeacherMiniAction('escalate')}
                  disabled={!miniSelectedAlertId}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  🚀 تصعيد للمشرف والإدارة
                </button>
              </div>
            </div>
          )}

          {/* TAB 3 & ALL: ASSIGNED TASKS & PROBLEMS */}
          {(teacherSubTab === 'all' || teacherSubTab === 'tasks') && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    متابعة وتكليف طلاب حلقة ({currentTeacherObj.circleName}) بمهام وتنبيهات خاصة
                  </h4>
                  <p className="text-[10px] text-indigo-200 mt-0.5">
                    تكليف مباشر لطلاب الحلقة بمهام أو معالجة مع إمكانية الرد على استفسارات ومقترحات الطلاب.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Task Filter */}
                  <div className="flex items-center gap-1 bg-indigo-950 p-1 rounded-lg border border-indigo-700/50 text-[10px]">
                    <button
                      onClick={() => setTaskFilterStatus('all')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        taskFilterStatus === 'all' ? 'bg-amber-400 text-slate-950' : 'text-indigo-200'
                      }`}
                    >
                      الكل ({teacherTasks.length})
                    </button>
                    <button
                      onClick={() => setTaskFilterStatus('pending')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        taskFilterStatus === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-indigo-200'
                      }`}
                    >
                      🔴 معلقة ({teacherTasks.filter(t => t.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setTaskFilterStatus('in_progress')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        taskFilterStatus === 'in_progress' ? 'bg-indigo-500 text-white' : 'text-indigo-200'
                      }`}
                    >
                      ⏳ تنفيذ ({teacherTasks.filter(t => t.status === 'in_progress').length})
                    </button>
                    <button
                      onClick={() => setTaskFilterStatus('completed')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        taskFilterStatus === 'completed' ? 'bg-emerald-500 text-white' : 'text-indigo-200'
                      }`}
                    >
                      ✓ مكتملة ({teacherTasks.filter(t => t.status === 'completed').length})
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAssignTaskModal(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تكليف طالب بمهمة</span>
                  </button>
                </div>
              </div>

              {/* Tasks Grid */}
              <div className="space-y-2">
                {teacherTasks.length === 0 ? (
                  <p className="text-[11px] text-indigo-300 p-4 text-center bg-indigo-950/40 rounded-xl">
                    لا توجد مهام مكلف بها طلاب الحلقة حالياً.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teacherTasks
                      .filter(t => taskFilterStatus === 'all' || t.status === taskFilterStatus)
                      .map((tk) => (
                        <div
                          key={tk.id}
                          className="p-3 bg-indigo-900/80 rounded-xl border border-indigo-700/80 space-y-2 text-slate-100 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-amber-300 text-xs">{tk.studentName}</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                                    tk.status === 'completed'
                                      ? 'bg-emerald-500 text-white'
                                      : tk.status === 'in_progress'
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-amber-500 text-slate-950'
                                  }`}
                                >
                                  {tk.status === 'completed'
                                    ? '✓ مكتملة'
                                    : tk.status === 'in_progress'
                                    ? '⏳ قيد التنفيذ'
                                    : '🔴 معلقة'}
                                </span>
                                <button
                                  onClick={() => {
                                    const updated = deleteStudentTask(tk.id);
                                    setTeacherTasks(updated);
                                    showToast('✓ تم إزالة المهمة بنجاح.');
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-0.5"
                                  title="حذف المهمة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-white">{tk.title}</p>
                            <p className="text-[10.5px] text-indigo-200 leading-tight">
                              <strong>المطلوب:</strong> {tk.requiredAction}
                            </p>

                            {tk.description && (
                              <p className="text-[10px] text-slate-300 leading-tight bg-black/20 p-1.5 rounded">
                                {tk.description}
                              </p>
                            )}

                            {tk.studentResponse && (
                              <div className="p-1.5 bg-emerald-950/90 rounded border border-emerald-700/60 text-[10px] text-emerald-200">
                                <strong>رد الطالب:</strong> {tk.studentResponse}
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] text-indigo-300 font-bold pt-1 border-t border-indigo-800/60 flex items-center justify-between">
                            <span>تاريخ التكليف: {tk.assignedAt}</span>
                            <span className="text-amber-300 font-bold">
                              الأهمية: {tk.priority === 'urgent' ? '⚡ عاجلة' : 'عادية'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4 & ALL: PRIVATE ALERTS, SESSIONS & PROPOSALS FEED */}
          {(teacherSubTab === 'all' || teacherSubTab === 'requests') && (
            <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-700/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/80 pb-2.5">
                <div>
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    مركز التواصل المباشر، الجلسات الخاصة، والمقترحات المرفوعة من الطلاب ({currentTeacherObj.circleName})
                  </span>
                  <p className="text-[10px] text-indigo-300 mt-0.5">
                    تصلك هنا كافة طلبات التسميع الفردي، الأعذار، والصعوبات التي يرفعها الطالب مع إمكانية الرد الفوري واعتماد المواعيد.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-indigo-200">
                  <span className="bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    وارد مباشر من تطبيق الطالب ✓
                  </span>
                </div>
              </div>

              {/* 3-Column Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                
                {/* 1. Private Session Requests */}
                <div className="bg-indigo-900/50 p-3.5 rounded-xl border border-indigo-800/80 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>🤝 طلبات الجلسات الخاصة والتسميع الفردي ({studentSessionRequests.length})</span>
                      </span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">مواعيد خاصة</span>
                    </span>

                    {studentSessionRequests.length === 0 ? (
                      <p className="text-[10px] text-indigo-300 p-4 text-center">لا توجد طلبات جلسات خاصة جديدة.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {studentSessionRequests.map((sess) => {
                          const typeMap: Record<string, string> = {
                            struggle_remedy: 'معالجة تعثر وصعوبة',
                            major_revision: 'سبر ومراجعة كبرى',
                            tajweed_drill: 'تدريب مخارج وتجويد',
                            counseling: 'استشارة وتوجيه تربوي',
                            general: 'جلسة خاصة'
                          };

                          return (
                            <div key={sess.id} className="p-3 bg-indigo-950/90 rounded-xl border border-indigo-700/80 space-y-2">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-amber-300 text-xs">{sess.studentName}</span>
                                <span
                                  className={`px-2 py-0.5 rounded font-extrabold text-[8.5px] ${
                                    sess.status === 'scheduled' || sess.status === 'accepted'
                                      ? 'bg-emerald-500 text-white'
                                      : sess.status === 'completed'
                                      ? 'bg-slate-700 text-slate-200'
                                      : 'bg-rose-500 text-white animate-pulse'
                                  }`}
                                >
                                  {sess.status === 'scheduled' || sess.status === 'accepted'
                                    ? '🟢 موعد معتمد'
                                    : sess.status === 'completed'
                                    ? '✓ مكتملة'
                                    : '🔴 بانتظار الجدولة'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9.5px] font-bold text-emerald-400 block bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  {typeMap[sess.sessionType] || sess.sessionType}
                                </span>
                                <p className="text-xs text-slate-100 font-bold leading-snug">{sess.topic}</p>
                                <p className="text-[10.5px] text-indigo-200 leading-relaxed bg-indigo-900/40 p-2 rounded-lg border border-indigo-800/40">
                                  {sess.struggleDetails}
                                </p>
                              </div>

                              <div className="text-[9.5px] text-indigo-300 space-y-0.5 pt-1 border-t border-indigo-800/50">
                                {sess.targetSurahs && (
                                  <p>📖 <strong>السور المعنية:</strong> {sess.targetSurahs}</p>
                                )}
                                {sess.preferredTime && (
                                  <p>🕒 <strong>الوقت المفضل للطالب:</strong> {sess.preferredTime}</p>
                                )}
                              </div>

                              {sess.scheduledDate && (
                                <div className="p-2 bg-emerald-950/90 rounded-lg border border-emerald-600/60 text-[10px] text-emerald-200 space-y-0.5">
                                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span>الموعد المعتمد: {sess.scheduledDate}</span>
                                  </div>
                                  {sess.teacherNote && (
                                    <p className="text-emerald-100 text-[9.5px]"><strong>توجيه الشيخ:</strong> {sess.teacherNote}</p>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  onClick={() => {
                                    setActiveSessionToSchedule(sess);
                                    setSessionScheduleDate(sess.scheduledDate || 'الأحد القادم بعد صلاة المغرب (15 دقيقة)');
                                    setSessionTeacherNote(sess.teacherNote || 'تمت الموافقة وتخصيص الجلسة، يرجى الاستعداد والتحضير وسنبدأ فوراً إن شاء الله.');
                                  }}
                                  className="flex-1 text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer text-center"
                                >
                                  {sess.status === 'scheduled' ? 'تعديل موعد الجلسة' : '📅 قبول وجدولة الجلسة'}
                                </button>

                                {sess.status !== 'completed' ? (
                                  <button
                                    onClick={() => {
                                      const updated = updateStudentSessionRequestStatus(sess.id, 'completed');
                                      setStudentSessionRequests(updated);
                                      showToast(`✓ تم تسجيل إنجاز الجلسة الخاصة للطالب ${sess.studentName}.`);
                                    }}
                                    className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                                    title="تعليم كمكتملة"
                                  >
                                    ✓ إتمام
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Excuses & Difficulties */}
                <div className="bg-indigo-900/50 p-3.5 rounded-xl border border-indigo-800/80 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold text-indigo-200 flex items-center justify-between">
                      <span>🚨 تنبيهات الأعذار والصعوبات ({studentPrivateAlerts.length})</span>
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded">خاص بالمعلم</span>
                    </span>

                    {studentPrivateAlerts.length === 0 ? (
                      <p className="text-[10px] text-indigo-300 p-4 text-center">لا توجد تنبيهات خاصة جديدة.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {studentPrivateAlerts.map((pa) => (
                          <div key={pa.id} className="p-3 bg-indigo-950/90 rounded-xl border border-indigo-700/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-amber-300 text-xs">{pa.studentName}</span>
                              <span
                                className={`px-2 py-0.5 rounded font-extrabold text-[8.5px] ${
                                  pa.status === 'reviewed_by_teacher'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-amber-400 text-slate-950 animate-pulse'
                                }`}
                              >
                                {pa.status === 'reviewed_by_teacher' ? '✓ تم الرد' : '🔴 بانتظار الرد'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-100 font-bold">{pa.title}</p>
                            <p className="text-[10.5px] text-indigo-200 leading-relaxed bg-indigo-900/40 p-2 rounded-lg border border-indigo-800/40">
                              {pa.details}
                            </p>

                            {pa.teacherReply ? (
                              <div className="p-2 bg-emerald-950/80 rounded-lg border border-emerald-700/60 text-[10px] text-emerald-200 font-medium">
                                <strong>رد الشيخ:</strong> {pa.teacherReply}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveAlertToReply(pa);
                                  setReplyText('');
                                }}
                                className="w-full text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer mt-1 text-center"
                              >
                                إضافة رد وتوجيه للمعلم
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Proposals */}
                <div className="bg-indigo-900/50 p-3.5 rounded-xl border border-indigo-800/80 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold text-amber-200 flex items-center justify-between">
                      <span>💡 المقترحات التطويرية ({studentProposals.length})</span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded">مبادرات الطلاب</span>
                    </span>

                    {studentProposals.length === 0 ? (
                      <p className="text-[10px] text-indigo-300 p-4 text-center">لا توجد مقترحات مرفوعة حالياً.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {studentProposals.map((pr) => (
                          <div key={pr.id} className="p-3 bg-indigo-950/90 rounded-xl border border-indigo-700/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-amber-300 text-xs">{pr.studentName}</span>
                              <span className="text-[8.5px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                                {pr.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-100 font-bold">{pr.title}</p>
                            <p className="text-[10.5px] text-indigo-200 leading-relaxed bg-indigo-900/40 p-2 rounded-lg border border-indigo-800/40">
                              {pr.proposalText}
                            </p>

                            {pr.teacherFeedback ? (
                              <div className="p-2 bg-amber-950/80 rounded-lg border border-amber-700/60 text-[10px] text-amber-200 font-medium">
                                <strong>انطباع الشيخ:</strong> {pr.teacherFeedback}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveProposalToReply(pr);
                                  setReplyText('');
                                }}
                                className="w-full text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer mt-1 text-center"
                              >
                                دراسة المقترح وإبداء الرأي
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ADMINISTRATIVE CENTER PANELS (HIDDEN IN TEACHER MODE) */}
      {!(viewMode === 'teacher_mini' || isTeacherUser) && (
        <>
          {/* KPI METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
          <span className="text-slate-500 text-[10px] font-bold">تنبيهات طارئة بانتظار الإجراء</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-red-600 font-mono">{numOpen}</span>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 p-0.5 px-2 rounded-full">معلق</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
          <span className="text-slate-500 text-[10px] font-bold">تنبيهات قيد التكليف والمتابعة</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-indigo-600 font-mono">{numTracking}</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 p-0.5 px-2 rounded-full">جار الحل</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
          <span className="text-slate-500 text-[10px] font-bold">تنبيهات محلولة ومغلقة</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-600 font-mono">{numClosed}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 p-0.5 px-2 rounded-full">مكتملة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
          <span className="text-slate-500 text-[10px] font-bold">الإشعارات الصادرة للجهات المخولة</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-600 font-mono">{dispatchedNotifications.length}</span>
            <Bell className="h-4 w-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
          <span className="text-slate-500 text-[10px] font-bold">الكادر المتاح للتكليف</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-800 font-mono">{STAFF_DIRECTORY.length}</span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN - 8 COLS: Alerts Listing & Action Logs & Notifications */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SEARCH & FILTER CONTROLLER */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  لوحة التنبيهات المستكشفة النشطة
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">يتم رصد الحالات بشكل آني بناء على المستشعرات والمقاييس أدناه.</p>
              </div>

              {/* Severity Quick Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start select-none text-[11px] font-bold">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  الجميع ({filteredAlerts.length})
                </button>
                <button 
                  onClick={() => setActiveTab('critical')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'critical' ? 'bg-red-600 text-white font-semibold' : 'text-slate-600 hover:text-red-700'}`}
                >
                  الخطرة
                </button>
                <button 
                  onClick={() => setActiveTab('medium')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'medium' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:text-indigo-700'}`}
                >
                  المتوسطة
                </button>
                <button 
                  onClick={() => setActiveTab('normal')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'normal' ? 'bg-white text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  العادية
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب، المعلم، الحلقة أو تفاصيل العذر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-5 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="md:col-span-4 select-none">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white font-medium"
                >
                  <option value="all">كل حالات التنبيه</option>
                  <option value="active">معلق وبانتظار الإجراء</option>
                  <option value="assigned">مسند ومحول للجهة المخولة</option>
                  <option value="under_tracking">تحت المراقبة التربوية</option>
                  <option value="resolved">محلول وتم إغلاقه بنجاح</option>
                </select>
              </div>
            </div>

            {/* ALERTS CARDS LISTING */}
            <div className="space-y-3 pt-2">
              {filteredAlerts.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-xs mt-3 font-medium">لا توجد تنبيهات تطابق خيارات البحث والفلترة المحددة.</p>
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    layoutId={`alert-card-${alert.id}`}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 hover:shadow-md relative overflow-hidden group ${
                      alert.status === 'resolved' ? 'bg-emerald-50/30 border-emerald-200 opacity-75' : 
                      alert.severity === 'critical' ? 'bg-red-50/20 border-red-200 hover:border-red-300' :
                      alert.severity === 'medium' ? 'bg-indigo-50/20 border-indigo-200 hover:border-indigo-300' :
                      'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Side highlight line */}
                    <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${
                      alert.status === 'resolved' ? 'bg-emerald-600' :
                      alert.severity === 'critical' ? 'bg-red-600' :
                      alert.severity === 'medium' ? 'bg-indigo-600' : 'bg-slate-400'
                    }`} />

                    <div className={`p-2.5 rounded-xl border shrink-0 ${
                      alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                      alert.severity === 'medium' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{alert.title}</p>
                          <span className={`p-0.5 px-2 rounded-full text-[9px] font-bold shrink-0 ${
                            alert.severity === 'critical' ? 'bg-red-500 text-white' :
                            alert.severity === 'medium' ? 'bg-indigo-500 text-white' :
                            'bg-slate-400 text-white'
                          }`}>
                            {alert.severity === 'critical' ? 'حرجة طارئة' :
                             alert.severity === 'medium' ? 'متوسطة' : 'عادية'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          رصد: {new Date(alert.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 inline text-emerald-600" />
                          <span>الجهة المتأثرة: <b>{alert.entityName}</b></span>
                        </p>
                        <p className="text-slate-600 text-xs leading-relaxed font-medium">{alert.details}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 flex-wrap gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`p-0.5 px-2 rounded font-bold border ${
                            alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            alert.status === 'under_tracking' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            alert.status === 'assigned' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                            'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {alert.status === 'resolved' ? '✓ تم حل السجل' :
                             alert.status === 'under_tracking' ? '⚠️ تحت المراقبة التربوية' :
                             alert.status === 'assigned' ? '✉ تم تحويل المعالجة' :
                             '● معلق وبانتظار الإجراء'}
                          </span>

                          {alert.assignedTo && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold max-w-xs truncate">
                              تم التكليف لـ: {alert.assignedTo}
                            </span>
                          )}
                        </div>

                        {!isSupervisor ? (
                          <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5 shrink-0">
                            عرض خيارات المعالجة الإدارية والتكليف
                            <ChevronLeft className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold group-hover:underline flex items-center gap-0.5 shrink-0">
                            عرض تفاصيل التنبيه
                            <ChevronLeft className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* DISPATCHED NOTIFICATIONS LOG PANEL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-amber-500" />
                سجل الإشعارات المباشرة الصادرة للجهات المخولة بالمهمة
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                {dispatchedNotifications.length} إشعار مرسل
              </span>
            </div>

            <div className="space-y-2.5">
              {dispatchedNotifications.map(n => (
                <div key={n.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      إلى: <b>{n.recipientName}</b> ({n.recipientRole})
                    </span>
                    <span className="text-slate-400 font-mono">{n.sentAt}</span>
                  </div>
                  <p className="font-bold text-slate-800 mt-1">{n.alertTitle}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OPERATIONAL RESOLUTION HISTORY LOGGER */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-slate-500" />
              سجل الإجراءات الإدارية والوقائية المتخذة (مركز المتابعة)
            </h3>
            <p className="text-[10px] text-slate-400">توثيق حي لكافة قرارات وسجلات الإرجاع، الإحاطة، والتوجيه للحفظ تحت المتابعة.</p>

            <div className="divide-y divide-slate-100 space-y-3 font-semibold text-xs">
              {opLogs.map((log) => (
                <div key={log.id} className="pt-3 block text-right font-medium text-slate-700">
                  <div className="flex items-center justify-between gap-4 font-bold text-[10px] mb-1">
                    <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">⚙️ {log.actionType}</span>
                    <span className="font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs mb-1">القضية المتأثرة: <b className="text-slate-700">{log.alertTitle}</b></p>
                  <p className="text-slate-600 font-medium leading-normal text-xs">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* LEFT COLUMN - 4 COLS: Adjustable Deficiency Criteria & Person Assignment Settings & Simulator */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CRITERIA & DEFICIENCY ENGINE WITH AUTO NOTIFY BUTTON */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  مقاييس ومعايير التقصير القابلة للتعديل
                </h3>
                <p className="text-[10px] text-slate-400">ضبط حدود التنبيه الآلي وتوليد الإشعارات للجهات المخولة.</p>
              </div>
              <HelpCircle className="h-4 w-4 text-slate-400" title="المعايير المحددة تطلق تنبيهات وإشعارات تلقائية" />
            </div>

            {/* Criteria Sliders */}
            <div className="space-y-4 text-xs font-semibold">
              
              {/* Students criteria */}
              <div className="space-y-3">
                <span className="text-emerald-900 font-bold text-[11px] block border-r-2 border-emerald-600 pr-2">مقاييس تقصير الطلاب</span>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-600 text-[10px] font-bold">
                    <span>الغياب المتتالي المفضي للتنبيه:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{criteria.studentAbsenceConsecutiveLimit} أيام</span>
                  </div>
                  <input 
                    type="range" min="1" max="10"
                    value={criteria.studentAbsenceConsecutiveLimit}
                    onChange={(e) => setCriteria({ ...criteria, studentAbsenceConsecutiveLimit: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-600 text-[10px] font-bold">
                    <span>أقصى تأخر مسموح لصفحات الخطة:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{criteria.studentMaxPlanDelayPages} صفحة</span>
                  </div>
                  <input 
                    type="range" min="2" max="30"
                    value={criteria.studentMaxPlanDelayPages}
                    onChange={(e) => setCriteria({ ...criteria, studentMaxPlanDelayPages: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-600 text-[10px] font-bold">
                    <span>أيام التخلف القصوى عن المراجعة:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{criteria.studentMinReviewIntervalDays} أيام</span>
                  </div>
                  <input 
                    type="range" min="2" max="25"
                    value={criteria.studentMinReviewIntervalDays}
                    onChange={(e) => setCriteria({ ...criteria, studentMinReviewIntervalDays: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {/* Circles & Teachers criteria */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-indigo-900 font-bold text-[11px] block border-r-2 border-indigo-600 pr-2">مقاييس كفاءة الحلقات والمعلمين</span>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-600 text-[10px] font-bold">
                    <span>حد هبوط نسبة حضور الحلقة:</span>
                    <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">{criteria.circleMinAttendancePercent}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="98"
                    value={criteria.circleMinAttendancePercent}
                    onChange={(e) => setCriteria({ ...criteria, circleMinAttendancePercent: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-1 flex justify-between items-center gap-4 pt-1">
                  <span className="text-slate-600 text-[10px] font-bold">حد تدني تقييم المعلم الميداني:</span>
                  <select
                    value={criteria.teacherMinRatingLimit}
                    onChange={(e) => setCriteria({ ...criteria, teacherMinRatingLimit: Number(e.target.value) })}
                    className="border border-slate-200 rounded px-2 py-0.5 font-mono text-[10px] bg-white font-bold text-amber-700"
                  >
                    <option value="4.5">★ 4.5</option>
                    <option value="4.0">★ 4.0</option>
                    <option value="3.8">★ 3.8</option>
                    <option value="3.5">★ 3.5</option>
                  </select>
                </div>
              </div>

              {/* AUTO DEFICIENCY SCAN & NOTIFY TRIGGER */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={runDeficiencyScanAndNotify}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>تفعيل فحص التقصير الآلي وإرسال تنبيه</span>
                </button>
              </div>

            </div>
          </div>

          {/* TEMPLATES PRESETS PANEL */}
          {!isSupervisor && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <SaveAll className="h-4.5 w-4.5 text-slate-500" />
                  قوالب معايير الرصد السريعة
                </h3>
                <button
                  type="button"
                  onClick={handleOpenAddPresetModal}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  <span>إضافة قالب</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs font-semibold">
                {presets.map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-colors text-right flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                  >
                    <div 
                      onClick={() => applyTemplatePreset(t.id)}
                      className="space-y-0.5 cursor-pointer flex-1"
                      title="انقر لتطبيق هذا القالب فوراً"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-800 text-xs">{t.name}</p>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">تطبيق</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-normal">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center pt-1 sm:pt-0 border-t sm:border-0 border-slate-100 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenEditPresetModal(t); }}
                        className="p-1.5 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg border border-slate-200 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="تعديل هذا القالب"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeletePreset(t.id); }}
                        className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 transition-colors text-[10px] font-bold cursor-pointer"
                        title="حذف القالب"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>حفظ التكوين الحالي كقالب</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    title="استعادة الافتراضي"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CRITERIA CRITICAL SIMULATOR */}
          <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-emerald-300 font-display flex items-center gap-1.5">
                  <Play className="h-4 w-4" />
                  محاكي المقاييس والتقديرات المتوقعة
                </h3>
                <p className="text-[10px] text-emerald-100/80 font-medium">تنبؤ لحظي لعدد التنبيهات الناتجة عند اعتماد قيم المقاييس المحددة.</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-bold">
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-200">التنبيهات المرتقبة:</span>
                  <span className="font-mono text-xl text-white block">
                    {simulatorOutput.isSimulating ? 'جاري الفحص...' : `${simulatorOutput.predictedAlertsCount} تنبيهاً`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-[10px] text-slate-300">أثر الحلقات المتضررة:</span>
                  <span className="text-slate-100 font-mono text-xs">
                    {simulatorOutput.isSimulating ? 'فرز...' : `${simulatorOutput.affectedCircles} حلقات`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-[10px] text-slate-300">مستوى مخاطر الضغط الإداري:</span>
                  <span className={`p-0.5 px-2 rounded font-bold text-[10px] font-mono ${
                    simulatorOutput.dangerLevel === 'high' ? 'bg-red-500 text-white' :
                    simulatorOutput.dangerLevel === 'medium' ? 'bg-amber-500 text-slate-950' :
                    'bg-emerald-500 text-white'
                  }`}>
                    {simulatorOutput.isSimulating ? 'تحليل...' : 
                     simulatorOutput.dangerLevel === 'high' ? 'أعباء مفرطة' :
                     simulatorOutput.dangerLevel === 'medium' ? 'أعباء معتدلة' :
                     'وضع مستقر'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={runSimulator}
                disabled={simulatorOutput.isSimulating}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {simulatorOutput.isSimulating ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>توليد وتعداد البيانات...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 shrink-0 text-emerald-100" />
                    <span>تشغيل المحاكاة التجريبية</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
        </>
      )}

      {/* ACTION & ASSIGNMENT MODAL WITH PERSON DIRECTORY & NOTIFICATION DISPATCH */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right text-xs"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                  <div>
                    <span className="bg-red-500/20 text-red-300 border border-red-500/30 rounded px-2 py-0.5 text-[9px] font-bold">
                      {!isSupervisor ? 'بوابة معالجة وتكليف القضية' : 'تفاصيل التنبيه (للعرض فقط)'}
                    </span>
                    <h3 className="font-bold text-sm text-white mt-0.5">
                      {!isSupervisor ? 'تعديل معالجة التنبيه وتكليف شخص بالاسم' : 'عرض سجل وتفاصيل التنبيه النشط'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 font-semibold text-slate-700">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">عنوان التشخيص والخلل:</span>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{selectedAlert.title}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">الجهة المتأثرة بالقضية:</span>
                  <p className="text-xs font-bold text-emerald-800">{selectedAlert.entityName}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-700 font-medium font-mono text-[11px]">
                  {selectedAlert.details}
                </div>

                {selectedAlert.notes && (
                  <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl">
                    <p className="font-bold text-[10px] mb-0.5">الملاحظات التوجيهية المقيدة سابقاً:</p>
                    <p className="font-medium font-mono leading-relaxed text-[11px]">{selectedAlert.notes}</p>
                  </div>
                )}

                {!isSupervisor ? (
                  <>
                    {/* Person Directory Assignment Selector */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <User className="h-4 w-4 text-emerald-600" />
                        اختيار الشخص المكلف من الكادر الإداري أو المدرسين
                      </h4>

                      <div>
                        <label className="block text-slate-500 font-bold text-[10px] mb-1">حدد الاسم والوظيفة لتوجيه الإشعار الفوري له:</label>
                        <select
                          value={selectedPersonId}
                          onChange={(e) => setSelectedPersonId(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-bold text-xs"
                        >
                          <option value="">-- اختر من القائمة المتاحة --</option>
                          <optgroup label="📋 الكادر الإداري والإشرافي">
                            {STAFF_DIRECTORY.filter(p => p.category === 'admin').map(person => (
                              <option key={person.id} value={person.id}>
                                {person.name} — ({person.role})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="📖 كادر المدرسين والمعلمين">
                            {STAFF_DIRECTORY.filter(p => p.category === 'teacher').map(person => (
                              <option key={person.id} value={person.id}>
                                {person.name} — ({person.role}) [{person.circleName}]
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold text-[10px]">تدوين توجيه أو ملاحظة علاجية تفصيلية:</span>
                        <textarea
                          rows={2}
                          placeholder="اكتب التوجيهات الإشرافية للتواصل مع ولي الأمر أو معالجة الخلل بالحلقة..."
                          value={customActionNote}
                          onChange={(e) => setCustomActionNote(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white leading-relaxed resize-none font-medium text-xs"
                        />
                      </div>
                    </div>

                    {/* Operation Trigger Buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold pt-3.5 border-t border-slate-100" id="handling-actions-panel">
                      
                      <button
                        type="button"
                        onClick={() => handleAssignToPersonAndNotify('assigned')}
                        disabled={!selectedPersonId}
                        className="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 shadow-xs"
                      >
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          إسناد وإرسال إشعار
                        </span>
                        <span className="text-[9px] text-indigo-100 font-normal">تنبيه آلي للشخص</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssignToPersonAndNotify('under_tracking')}
                        className="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center gap-1 bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-950"
                      >
                        <span>وضع تحت المتابعة</span>
                        <span className="text-[9px] text-amber-800 font-normal">مراقبة لصيقة بالحلقة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssignToPersonAndNotify('resolved')}
                        className="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs md:col-span-2"
                      >
                        <span>تم حل العثرة وإغلاق التنبيه</span>
                        <span className="text-[9px] text-emerald-100 font-normal">تسوية القضية وأرشفتها</span>
                      </button>

                    </div>
                  </>
                ) : (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between">
                      <span className="font-bold text-[11px]">حالة التنبيه الحالية:</span>
                      <span className="font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {selectedAlert.status === 'resolved' ? '✓ تم حل السجل' :
                         selectedAlert.status === 'under_tracking' ? '⚠️ تحت المراقبة التربوية' :
                         selectedAlert.status === 'assigned' ? `✉ مكلف لـ: ${selectedAlert.assignedTo || 'غير محدد'}` :
                         '● معلق وبانتظار الإجراء'}
                      </span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAlert(null)}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PRESET TEMPLATE MODAL */}
      <AnimatePresence>
        {isPresetModalOpen && editingPreset && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full text-right shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 px-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">تعديل قالب معايير الرصد السريعة</h3>
                    <p className="text-[10px] text-indigo-200">تعديل المسميات والحدود الرقمية لمعايير هذا القالب المخصص</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsPresetModalOpen(false); setEditingPreset(null); }}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto font-semibold text-xs text-slate-700">
                {/* Name & Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">اسم القالب:</label>
                  <input
                    type="text"
                    value={editingPreset.name}
                    onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white font-bold text-xs"
                    placeholder="مثال: معايير الموسم الرمضاني المكثف..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">وصف القالب والتوجيهات:</label>
                  <textarea
                    rows={2}
                    value={editingPreset.description}
                    onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white font-medium text-xs leading-relaxed resize-none"
                    placeholder="اكتب وصفاً موجزاً لظروف وتطبيقات هذا القالب..."
                  />
                </div>

                {/* Criteria Customization Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-emerald-900 font-bold text-[11px] block border-r-2 border-emerald-600 pr-2">معايير وتنبيهات الطلاب</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>حد الغياب المتتالي المفضي للتنبيه:</span>
                        <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">{editingPreset.criteria.studentAbsenceConsecutiveLimit} أيام</span>
                      </div>
                      <input 
                        type="range" min="1" max="10"
                        value={editingPreset.criteria.studentAbsenceConsecutiveLimit}
                        onChange={(e) => setEditingPreset({
                          ...editingPreset,
                          criteria: { ...editingPreset.criteria, studentAbsenceConsecutiveLimit: Number(e.target.value) }
                        })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>أقصى تأخر مسموح لصفحات الخطة:</span>
                        <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">{editingPreset.criteria.studentMaxPlanDelayPages} صفحة</span>
                      </div>
                      <input 
                        type="range" min="2" max="30"
                        value={editingPreset.criteria.studentMaxPlanDelayPages}
                        onChange={(e) => setEditingPreset({
                          ...editingPreset,
                          criteria: { ...editingPreset.criteria, studentMaxPlanDelayPages: Number(e.target.value) }
                        })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>أيام التخلف القصوى عن المراجعة:</span>
                        <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">{editingPreset.criteria.studentMinReviewIntervalDays} أيام</span>
                      </div>
                      <input 
                        type="range" min="2" max="25"
                        value={editingPreset.criteria.studentMinReviewIntervalDays}
                        onChange={(e) => setEditingPreset({
                          ...editingPreset,
                          criteria: { ...editingPreset.criteria, studentMinReviewIntervalDays: Number(e.target.value) }
                        })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>حد هبوط نسبة حضور الحلقة:</span>
                        <span className="font-mono text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded font-bold">{editingPreset.criteria.circleMinAttendancePercent}%</span>
                      </div>
                      <input 
                        type="range" min="50" max="98"
                        value={editingPreset.criteria.circleMinAttendancePercent}
                        onChange={(e) => setEditingPreset({
                          ...editingPreset,
                          criteria: { ...editingPreset.criteria, circleMinAttendancePercent: Number(e.target.value) }
                        })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700">حد تدني تقييم المعلم الميداني:</span>
                    <select
                      value={editingPreset.criteria.teacherMinRatingLimit}
                      onChange={(e) => setEditingPreset({
                        ...editingPreset,
                        criteria: { ...editingPreset.criteria, teacherMinRatingLimit: Number(e.target.value) }
                      })}
                      className="border border-slate-200 rounded px-2 py-1 font-mono text-xs bg-white font-bold text-amber-700"
                    >
                      <option value="4.5">★ 4.5</option>
                      <option value="4.0">★ 4.0</option>
                      <option value="3.8">★ 3.8</option>
                      <option value="3.5">★ 3.5</option>
                      <option value="3.0">★ 3.0</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsPresetModalOpen(false); setEditingPreset(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePresetModal}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ القالب والتغييرات</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN TASK TO STUDENT MODAL */}
      <AnimatePresence>
        {showAssignTaskModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-white">تكليف طالب بمهمة أو معالجة تعثر بالحلقة</h3>
                    <p className="text-[10px] text-slate-300">يظهر التكليف مباشرة بملف الطالب بصفحة لوحة الطالب</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssignTaskModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTaskForm.title.trim() || !newTaskForm.requiredAction.trim()) return;

                  const createdTask: StudentTaskOrProblem = {
                    id: `task-${Date.now()}`,
                    studentId: 'ST-000004',
                    studentName: newTaskForm.studentName,
                    circleName: currentTeacherObj.circleName || 'حلقة ابن كثير',
                    teacherName: currentTeacherObj.name,
                    title: newTaskForm.title,
                    type: 'task',
                    description: newTaskForm.description,
                    requiredAction: newTaskForm.requiredAction,
                    priority: newTaskForm.priority,
                    status: 'pending',
                    assignedAt: new Date().toLocaleString('ar-SA')
                  };

                  const updatedTasks = saveStudentTask(createdTask);
                  setTeacherTasks(updatedTasks);
                  setShowAssignTaskModal(false);
                  setNewTaskForm({
                    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
                    title: '',
                    description: '',
                    requiredAction: '',
                    priority: 'medium'
                  });
                  showToast(`✓ تم تكليف الطالب ${createdTask.studentName} بنجاح!`);
                }}
                className="p-5 space-y-3 font-semibold text-slate-700"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">حدد الطالب المراد تكليفه:</label>
                  <select
                    value={newTaskForm.studentName}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, studentName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-bold text-xs"
                  >
                    <option value="معاذ بن خالد بن عبدالله النفيسي">معاذ بن خالد بن عبدالله النفيسي (حلقة ابن كثير)</option>
                    <option value="أسامة بن صالح العتيبي">أسامة بن صالح العتيبي (حلقة ابن كثير)</option>
                    <option value="سلمان بن فهد الدوسري">سلمان بن فهد الدوسري (حلقة ابن كثير)</option>
                    <option value="عبدالرحمن بن محمد البقمي">عبدالرحمن بن محمد البقمي (حلقة ابن كثير)</option>
                    <option value="يوسف بن إبراهيم الحارثي">يوسف بن إبراهيم الحارثي (حلقة ابن كثير)</option>
                    <option value="علي بن حسين القحطاني">علي بن حسين القحطاني (حلقة ابن كثير)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان المهمة أو التشخيص:</label>
                  <input
                    type="text"
                    required
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                    placeholder="مثال: تدارك تأخر خطة جزء تبارك - معالجة التجويد"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">وصف الخلل / الملاحظة التربوية:</label>
                  <textarea
                    rows={2}
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                    placeholder="مثال: لوحظ تراجع ملحوظ في ضبط مخارج الحرف وتأخر صفحتين عن المقرر..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">المطلوب المحدد والتوجيه المباشر للطالب:</label>
                  <textarea
                    required
                    rows={2}
                    value={newTaskForm.requiredAction}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, requiredAction: e.target.value })}
                    placeholder="مثال: إنجاز تسميع صفحتين إضافيتين وتسميع الاستثنائي غداً بعد الصلاة..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">درجة الأهمية:</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold text-xs bg-white"
                  >
                    <option value="urgent">⚡ عاجلة جداً (تدارك خطة)</option>
                    <option value="medium">توجيه اعتيادي بالحلقة</option>
                    <option value="low">ملاحظة تشجيعية</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAssignTaskModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال التكليف للطالب</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPLY TO PRIVATE ALERT MODAL */}
      <AnimatePresence>
        {activeAlertToReply && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 space-y-4 text-right text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">الرد والتوجيه على تنبيه الطالب: {activeAlertToReply.studentName}</h3>
                <button onClick={() => setActiveAlertToReply(null)} className="text-slate-400 cursor-pointer">✕</button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">التنبيه المرفوع:</span>
                <p className="font-bold text-slate-800">{activeAlertToReply.title}</p>
                <p className="text-[11px] text-slate-600">{activeAlertToReply.details}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">رد المعلم والتوجيه المباشر:</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب رد الشيخ والتوجيه المناسب للطالب..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setActiveAlertToReply(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">إلغاء</button>
                <button 
                  onClick={() => {
                    const updated = replyToPrivateAlert(activeAlertToReply.id, replyText || 'تم الاطلاع والموافقة بارك الله فيك.');
                    setStudentPrivateAlerts(updated);
                    setActiveAlertToReply(null);
                    showToast('✓ تم إرسال ردك إلى لوحة الطالب بنجاح.');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>اعتماد وإرسال الرد</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPLY TO PROPOSAL MODAL */}
      <AnimatePresence>
        {activeProposalToReply && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 space-y-4 text-right text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">دراسة مقترح الطالب: {activeProposalToReply.studentName}</h3>
                <button onClick={() => setActiveProposalToReply(null)} className="text-slate-400 cursor-pointer">✕</button>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-800 font-bold">المقترح البناء:</span>
                <p className="font-bold text-slate-800">{activeProposalToReply.title}</p>
                <p className="text-[11px] text-slate-700">{activeProposalToReply.proposalText}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظة وانطباع الشيخ على المقترح:</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب تشجيعك وشكرك للطالب أو آلية البدء بتطبيق المقترح..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-medium text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setActiveProposalToReply(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">إلغاء</button>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const updated = replyToStudentProposal(activeProposalToReply.id, replyText || 'مقترح ممتاز وسنبدأ بتطبيقه بالحلقة إن شاء الله.', 'accepted');
                      setStudentProposals(updated);
                      setActiveProposalToReply(null);
                      showToast('🎉 تم قبول المقترح وإخطار الطالب!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <span>✓ قبول وتطبيق المقترح</span>
                  </button>

                  <button 
                    onClick={() => {
                      const updated = replyToStudentProposal(activeProposalToReply.id, replyText || 'تمت دراسة المقترح وبانتظار الفرصة المناسبة.', 'closed');
                      setStudentProposals(updated);
                      setActiveProposalToReply(null);
                      showToast('✓ تم تدوين دراسة المقترح وإخطار الطالب.');
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold rounded-xl cursor-pointer"
                  >
                    تدوين كمدروس
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Modal: Schedule Student Private Session */}
        {activeSessionToSchedule && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 shadow-2xl text-right text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>اعتماد وجدولة جلسة خاصة للطالب: {activeSessionToSchedule.studentName}</span>
                </h3>
                <button onClick={() => setActiveSessionToSchedule(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>

              {/* Request Details Recap */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 text-xs">{activeSessionToSchedule.topic}</span>
                  <span className="text-[9.5px] bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded font-bold">
                    {activeSessionToSchedule.sessionType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  {activeSessionToSchedule.struggleDetails}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-indigo-800 pt-1 border-t border-indigo-100">
                  {activeSessionToSchedule.targetSurahs && (
                    <span>📖 <strong>السور المعنية:</strong> {activeSessionToSchedule.targetSurahs}</span>
                  )}
                  {activeSessionToSchedule.preferredTime && (
                    <span>🕒 <strong>الوقت المفضل للطالب:</strong> {activeSessionToSchedule.preferredTime}</span>
                  )}
                </div>
              </div>

              {/* Scheduled Appointment Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  الموعد والتوقيت المعتمد للجلسة (تاريخ ووقت محدد):
                </label>
                <input
                  type="text"
                  value={sessionScheduleDate}
                  onChange={(e) => setSessionScheduleDate(e.target.value)}
                  placeholder="مثال: الأحد القادم 14 رمضان بعد صلاة المغرب مباشرة (15 دقيقة)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-bold text-xs"
                />
              </div>

              {/* Teacher Guidance / Preparation Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  توجيه الشيخ للطالب للتحضير قبل الجلسة:
                </label>
                <textarea
                  rows={3}
                  value={sessionTeacherNote}
                  onChange={(e) => setSessionTeacherNote(e.target.value)}
                  placeholder="اكتب التوجيه للطالب (مثل: مراجعة الآيات 5 مرات وتحديد الآيات المتشابهة بدقة قبل الجلسة...)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setActiveSessionToSchedule(null)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (!sessionScheduleDate.trim()) {
                        showToast('يرجى تحديد موعد الجلسة المعتمد');
                        return;
                      }
                      const updated = updateStudentSessionRequestStatus(
                        activeSessionToSchedule.id, 
                        'scheduled',
                        sessionScheduleDate,
                        sessionTeacherNote || 'تم اعتماد الموعد، يرجى الالتزام بالحضور في الوقت المحدد.'
                      );
                      setStudentSessionRequests(updated);
                      setActiveSessionToSchedule(null);
                      showToast(`✓ تم اعتماد وجدولة الجلسة وإرسال الإشعار للطالب ${activeSessionToSchedule.studentName}!`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>✓ اعتماد الموعد وإرسال للطالب</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
