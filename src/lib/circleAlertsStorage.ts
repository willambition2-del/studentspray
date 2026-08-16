/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudentTaskOrProblem {
  id: string;
  studentId: string;
  studentName: string;
  circleName: string;
  teacherName: string;
  title: string;
  type: 'task' | 'problem_resolution' | 'plan_fix' | 'urgent_review';
  description: string;
  requiredAction: string;
  priority: 'urgent' | 'medium' | 'normal';
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: string;
  studentResponse?: string;
  resolvedAt?: string;
}

export interface StudentPrivateAlert {
  id: string;
  studentId: string;
  studentName: string;
  circleName: string;
  teacherName: string;
  title: string;
  category: 'absence_excuse' | 'memorization_struggle' | 'health_issue' | 'other';
  details: string;
  urgency: 'high' | 'medium' | 'low';
  status: 'sent' | 'reviewed_by_teacher' | 'resolved';
  createdAt: string;
  teacherReply?: string;
}

export interface StudentProposal {
  id: string;
  studentId: string;
  studentName: string;
  circleName: string;
  teacherName: string;
  title: string;
  category: 'circle_activity' | 'revision_group' | 'competition_idea' | 'schedule_suggestion';
  proposalText: string;
  status: 'under_review' | 'accepted' | 'implemented' | 'closed';
  createdAt: string;
  teacherFeedback?: string;
}

export interface StudentPrivateSessionRequest {
  id: string;
  studentId: string;
  studentName: string;
  circleName: string;
  teacherName: string;
  topic: string;
  sessionType: 'struggle_remedy' | 'major_revision' | 'tajweed_drill' | 'counseling' | 'general';
  struggleDetails: string;
  targetSurahs: string;
  preferredTime: string;
  urgency: 'high' | 'medium' | 'normal';
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'declined';
  scheduledDate?: string;
  teacherNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface TeacherCircleCriteria {
  circleName: string;
  studentAbsenceConsecutiveLimit: number;
  studentMaxPlanDelayPages: number;
  studentMinReviewIntervalDays: number;
  circleMinAttendancePercent: number;
}

const STORAGE_KEYS = {
  TASKS: 'alhudacenter_circle_student_tasks',
  ALERTS: 'alhudacenter_student_private_alerts',
  PROPOSALS: 'alhudacenter_student_proposals',
  SESSIONS: 'alhudacenter_student_session_requests',
  CRITERIA: 'alhudacenter_teacher_circle_criteria',
};

// INITIAL MOCK DATA
const INITIAL_TASKS: StudentTaskOrProblem[] = [
  {
    id: 'st-task-0',
    studentId: 'STU-1447-092',
    studentName: 'سلمان بن فهد الدوسري',
    circleName: 'حلقة ابن كثير',
    teacherName: 'الشيخ/ محمد بن صالح العمري',
    title: 'البدء بالمراجعة الكبرى',
    type: 'urgent_review',
    description: 'تنشيط جدول المراجعة الكبرى للأجزاء الخمسة الأولى لضمان الجاهزية للاختبار الشريطي.',
    requiredAction: '5 أوجه يوميا',
    priority: 'urgent',
    status: 'pending',
    assignedAt: new Date(Date.now() - 2 * 3600 * 1000).toLocaleString('ar-SA'),
  },
  {
    id: 'st-task-1',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة ابن كثير',
    teacherName: 'الشيخ/ محمد بن صالح العمري',
    title: 'تدارك تأخر خطة جزء تبارك والتثبيت اليومي',
    type: 'plan_fix',
    description: 'يوجد تأخر بمقدار 4 صفحات عن الخطة المقررة لهذا الأسبوع. يرجى تدارك الصفحات وتسميعها في بداية الحلقة.',
    requiredAction: 'حفظ صفحتين إضافيتين وتسجيل تلاوة صوتية للمعلم عبر التطبيق.',
    priority: 'urgent',
    status: 'pending',
    assignedAt: new Date(Date.now() - 5 * 3600 * 1000).toLocaleString('ar-SA'),
  },
  {
    id: 'st-task-2',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة ابن كثير',
    teacherName: 'الشيخ/ محمد بن صالح العمري',
    title: 'تكليف برئاسة مجموعة المراجعة الثنائية (الزميل القرآني)',
    type: 'task',
    description: 'مطلوب الإشراف على جلسة مراجعة سورة آل عمران مع الطالب أسامة الريس قبل بداية التسميع الرئيسي.',
    requiredAction: 'مراجعة أول 50 آية من سورة آل عمران وتوثيق الأخطاء التجويدية.',
    priority: 'medium',
    status: 'in_progress',
    assignedAt: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString('ar-SA'),
    studentResponse: 'جاري التنسيق مع الزميل أسامة لبدء الجلسة اليوم بعد صلاة العصر.',
  },
  {
    id: 'st-task-3',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة ابن كثير',
    teacherName: 'الشيخ/ محمد بن صالح العمري',
    title: 'معالجة التعثر في أحكام مد الصلة الكبرى',
    type: 'problem_resolution',
    description: 'تم رصد تردد أثناء اختبار التجويد العملي في مد الصلة الكبرى بسورة آل عمران.',
    requiredAction: 'استماع للشيخ الحصري والتطبيق الميداني مع المعلم.',
    priority: 'normal',
    status: 'completed',
    assignedAt: new Date(Date.now() - 48 * 3600 * 1000).toLocaleString('ar-SA'),
    studentResponse: 'تم الاستماع والتطبيق أمام فضيلة المعلم وتم الاجتياز بنجاح.',
    resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toLocaleString('ar-SA'),
  },
  {
    id: 'st-task-4',
    studentId: 'STU-1447-095',
    studentName: 'أسامة بن خالد الريس',
    circleName: 'حلقة ابن كثير',
    teacherName: 'الشيخ/ محمد بن صالح العمري',
    title: 'معالجة بطء التسميع وتعديل مخارج الحروف',
    type: 'problem_resolution',
    description: 'تم ملاحظة تردد خفيف في القلقلة الصغرى بسورة النساء.',
    requiredAction: 'تسميع وجهين مع المعلم مع التركيز على أحكام النون الساكنة.',
    priority: 'medium',
    status: 'pending',
    assignedAt: new Date(Date.now() - 1 * 3600 * 1000).toLocaleString('ar-SA'),
  }
];

const INITIAL_PRIVATE_ALERTS: StudentPrivateAlert[] = [
  {
    id: 'st-alert-1',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: 'الشيخ عمر بن عبدالعزيز التركي',
    title: 'استئذان لظرف صحي طارئ غداً الخميس',
    category: 'absence_excuse',
    details: 'أرجو من فضيلتكم قبول عذري عن حضور الحلقة يوم غد لظرف صحي طارئ وموعد بالمستشفى، وسأقوم بتسميع المقرر مضاعفاً يوم الأحد.',
    urgency: 'high',
    status: 'reviewed_by_teacher',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toLocaleString('ar-SA'),
    teacherReply: 'لا بأس عليك طهور إن شاء الله، تم تسجيل العذر وبانتظار تسميعك يوم الأحد.',
  }
];

const INITIAL_PROPOSALS: StudentProposal[] = [
  {
    id: 'st-prop-1',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: 'الشيخ عمر بن عبدالعزيز التركي',
    title: 'مقترح تنظيم مقرأة المراجعة السريعة قبل الاختبارات',
    category: 'revision_group',
    proposalText: 'أقترح تخصيص 20 دقيقة قبل أذان المغرب يوم الأربعاء لعقد حلقات مراجعة ثنائية بين الطلاب المتقدمين والمستجدين لتثبيت الأجزاء.',
    status: 'accepted',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toLocaleString('ar-SA'),
    teacherFeedback: 'مقترح راشد ومتميز جداً، سنبدأ بتطبيقه ابتداءً من الأسبوع القادم إن شاء الله.',
  }
];

const INITIAL_SESSION_REQUESTS: StudentPrivateSessionRequest[] = [
  {
    id: 'st-sess-1',
    studentId: 'STU-1447-089',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: 'الشيخ عمر بن عبدالعزيز التركي',
    topic: 'طلب جلسة فردية لمعالجة تشابهات سورة النساء وضبط التجويد',
    sessionType: 'struggle_remedy',
    struggleDetails: 'أجد صعوبة في ضبط المتشابهات في الربع الثالث والرابع من سورة النساء، والخلط بين أواخر الآيات، وأرغب في جلسة تسميع فردية مع فضيلتكم لتثبيت الوجهين الصعبين وضبط مخارج الحروف.',
    targetSurahs: 'سورة النساء (الآيات 70-110)',
    preferredTime: 'بعد صلاة المغرب مباشرة أو قبل بداية الحلقة بـ 20 دقيقة',
    urgency: 'high',
    status: 'scheduled',
    scheduledDate: 'الأحد القادم بعد صلاة المغرب (15 دقيقة)',
    teacherNote: 'تمت الموافقة وتخصيص الجلسة، يرجى مراجعة المتشابهات في المصحف وتحديد الآيات الصعبة وسنبدأ فوراً إن شاء الله.',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toLocaleString('ar-SA')
  },
  {
    id: 'st-sess-2',
    studentId: 'STU-1447-092',
    studentName: 'سلمان بن فهد الدوسري',
    circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: 'الشيخ عمر بن عبدالعزيز التركي',
    topic: 'سبر ومراجعة كبرى للأجزاء الخمسة الأولى قبل اختبار الإجازة',
    sessionType: 'major_revision',
    struggleDetails: 'أحتاج إلى سبر مكثف ومراجعة كبرى للأجزاء الخمسة الأولى تحضيراً لدخول اختبار الإجازة القرآنية ومعالجة التعثر في بعض المواضع.',
    targetSurahs: 'البقرة وآل عمران (الأجزاء 1-5)',
    preferredTime: 'جلسة بعد العصر مباشرة',
    urgency: 'medium',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toLocaleString('ar-SA')
  }
];

const DEFAULT_CIRCLE_CRITERIA: TeacherCircleCriteria = {
  circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
  studentAbsenceConsecutiveLimit: 3,
  studentMaxPlanDelayPages: 10,
  studentMinReviewIntervalDays: 7,
  circleMinAttendancePercent: 85,
};

// Global broadcast dispatcher for multi-component reactivity
export function notifyStudentCommUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('alhudacenter_student_comm_updated'));
  }
}

// In-memory runtime state store (No localStorage business state)
let inMemoryTasks: StudentTaskOrProblem[] = [...INITIAL_TASKS];
let inMemoryAlerts: StudentPrivateAlert[] = [...INITIAL_PRIVATE_ALERTS];
let inMemoryProposals: StudentProposal[] = [...INITIAL_PROPOSALS];
let inMemorySessions: StudentPrivateSessionRequest[] = [...INITIAL_SESSION_REQUESTS];
let inMemoryCriteria: TeacherCircleCriteria = { ...DEFAULT_CIRCLE_CRITERIA };

// STORAGE HELPERS (In-memory reactive store)
export function getStoredStudentTasks(): StudentTaskOrProblem[] {
  return inMemoryTasks;
}

export function saveStudentTask(task: StudentTaskOrProblem): StudentTaskOrProblem[] {
  inMemoryTasks = [task, ...inMemoryTasks];
  notifyStudentCommUpdated();
  return inMemoryTasks;
}

export function updateStudentTaskStatus(
  taskId: string, 
  status: 'pending' | 'in_progress' | 'completed',
  response?: string
): StudentTaskOrProblem[] {
  inMemoryTasks = inMemoryTasks.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        status,
        ...(response !== undefined ? { studentResponse: response } : {}),
        ...(status === 'completed' ? { resolvedAt: new Date().toLocaleString('ar-SA') } : {})
      };
    }
    return t;
  });
  notifyStudentCommUpdated();
  return inMemoryTasks;
}

export function deleteStudentTask(taskId: string): StudentTaskOrProblem[] {
  inMemoryTasks = inMemoryTasks.filter(t => t.id !== taskId);
  notifyStudentCommUpdated();
  return inMemoryTasks;
}

export function getStoredStudentPrivateAlerts(): StudentPrivateAlert[] {
  return inMemoryAlerts;
}

export function saveStudentPrivateAlert(alert: StudentPrivateAlert): StudentPrivateAlert[] {
  inMemoryAlerts = [alert, ...inMemoryAlerts];
  notifyStudentCommUpdated();
  return inMemoryAlerts;
}

export function replyToPrivateAlert(alertId: string, reply: string): StudentPrivateAlert[] {
  inMemoryAlerts = inMemoryAlerts.map(a => a.id === alertId ? { ...a, teacherReply: reply, status: 'reviewed_by_teacher' as const } : a);
  notifyStudentCommUpdated();
  return inMemoryAlerts;
}

export function getStoredStudentProposals(): StudentProposal[] {
  return inMemoryProposals;
}

export function saveStudentProposal(proposal: StudentProposal): StudentProposal[] {
  inMemoryProposals = [proposal, ...inMemoryProposals];
  notifyStudentCommUpdated();
  return inMemoryProposals;
}

export function replyToStudentProposal(proposalId: string, feedback: string, status: 'accepted' | 'implemented' | 'closed' = 'accepted'): StudentProposal[] {
  inMemoryProposals = inMemoryProposals.map(p => p.id === proposalId ? { ...p, teacherFeedback: feedback, status } : p);
  notifyStudentCommUpdated();
  return inMemoryProposals;
}

// PRIVATE SESSION REQUESTS HELPERS
export function getStoredStudentSessionRequests(): StudentPrivateSessionRequest[] {
  return inMemorySessions;
}

export function saveStudentSessionRequest(req: StudentPrivateSessionRequest): StudentPrivateSessionRequest[] {
  inMemorySessions = [req, ...inMemorySessions];
  notifyStudentCommUpdated();
  return inMemorySessions;
}

export function updateStudentSessionRequestStatus(
  reqId: string,
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'declined',
  scheduledDate?: string,
  teacherNote?: string
): StudentPrivateSessionRequest[] {
  inMemorySessions = inMemorySessions.map(item => {
    if (item.id === reqId) {
      return {
        ...item,
        status,
        ...(scheduledDate !== undefined ? { scheduledDate } : {}),
        ...(teacherNote !== undefined ? { teacherNote } : {}),
        ...(status === 'completed' ? { resolvedAt: new Date().toLocaleString('ar-SA') } : {})
      };
    }
    return item;
  });
  notifyStudentCommUpdated();
  return inMemorySessions;
}

export function deleteStudentSessionRequest(reqId: string): StudentPrivateSessionRequest[] {
  inMemorySessions = inMemorySessions.filter(item => item.id !== reqId);
  notifyStudentCommUpdated();
  return inMemorySessions;
}

export function getStoredCircleCriteria(): TeacherCircleCriteria {
  return inMemoryCriteria;
}

export function saveCircleCriteria(criteria: TeacherCircleCriteria): TeacherCircleCriteria {
  inMemoryCriteria = criteria;
  return inMemoryCriteria;
}
