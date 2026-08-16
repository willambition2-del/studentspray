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

// Initial Mock Periods
export const DEFAULT_PERIODS: EvaluationPeriod[] = [
  {
    id: 'p-1447-1',
    name: 'الفصل الأول 1447هـ - الفترة الأولى (محرم / صفر)',
    curriculum: 'منهج الحفظ والمراجعة المكثف',
    examType: 'شهري',
    startDate: '1447/01/01',
    endDate: '1447/02/30',
    targetCategory: 'جميع طلاب الحلقات النموذجية والناشئة',
    targetCircles: ['c1', 'c2', 'c3'],
    maxScore: 100,
    passScore: 60,
    responsible: 'الشيخ عبدالرحمن بن محمد السعيد',
    description: 'تقييم شامل لحفظ ومراجعة وتجويد الأجزاء الأولى من القرآن الكريم للفصل الدراسي الأول.',
    status: 'in_progress',
    requiredFiles: [
      { id: 'rf-1', name: 'نموذج الأسئلة الموحد', status: 'completed' },
      { id: 'rf-2', name: 'كشف حضور وغياب الطلاب', status: 'completed' },
      { id: 'rf-3', name: 'نموذج معايير التصحيح والتجويد', status: 'completed' },
      { id: 'rf-4', name: 'التقرير التجميعي للنتائج', status: 'missing' }
    ],
    managementNotes: 'يرجى التركيز على متابعة الطلاب المتعثرين في مخارج الحروف وأحكام النون الساكنة.',
    createdAt: '1447/01/01'
  },
  {
    id: 'p-1447-2',
    name: 'الفصل الأول 1447هـ - الفترة الثانية (ربيع الأول / ربيع الثاني)',
    curriculum: 'منهج الإتقان والتثبيت التراكمي',
    examType: 'فصلي',
    startDate: '1447/03/01',
    endDate: '1447/04/30',
    targetCategory: 'طلاب حلقة الطليعة والفرقان',
    targetCircles: ['c1', 'c3'],
    maxScore: 100,
    passScore: 65,
    responsible: 'الأستاذ خالد بن عبدالله النفيسي',
    description: 'اختبار نصف الفصل الدراسي لتثبيت الأجزاء وتجويد التلاوة.',
    status: 'open',
    requiredFiles: [
      { id: 'rf-21', name: 'نموذج الأسئلة الموحد', status: 'completed' },
      { id: 'rf-22', name: 'كشف حضور وغياب الطلاب', status: 'not_uploaded' }
    ],
    managementNotes: 'يتم اعتماد نموذج الأسئلة المحدث من الموجه الفني.',
    createdAt: '1447/03/01'
  }
];

// Initial Mock Exams
export const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    periodId: 'p-1447-1',
    title: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    curriculum: 'منهج الحفظ والمراجعة المكثف',
    periodName: 'الفصل الأول 1447هـ - الفترة الأولى',
    examType: 'شهري',
    maxTotalScore: 100,
    passScore: 60,
    date: '1447/01/15',
    circleIds: ['c1', 'c2', 'c3'],
    circleName: 'حلقة الطليعة والفرق المتقدمة',
    criteria: [
      { id: 'crit-1', name: 'الحفظ والتسميع', maxScore: 40 },
      { id: 'crit-2', name: 'حسن التلاوة والترتيل', maxScore: 20 },
      { id: 'crit-3', name: 'أحكام التجويد والنطق', maxScore: 20 },
      { id: 'crit-4', name: 'الانضباط والحضور', maxScore: 10 },
      { id: 'crit-5', name: 'السلوك والتميز التربوي', maxScore: 10 }
    ],
    responsibleName: 'الشيخ عبدالرحمن بن محمد السعيد',
    notes: 'تم إعداد الأسئلة وفق معايير التقييم المعتمدة من المجمع.',
    status: 'in_progress',
    requiredFiles: [
      { id: 'rf-101', name: 'ورقة ورابط الأسئلة', status: 'completed' },
      { id: 'rf-102', name: 'كشف رصد الدرجات المباشر', status: 'completed' },
      { id: 'rf-103', name: 'نموذج الإجابة والتصحيح', status: 'completed' }
    ],
    examFileAttachment: {
      name: 'اختبار_شهر_محرم_المجمع_سورة_البقرة_والنساء.pdf',
      size: '2.4 MB',
      type: 'PDF',
      uploadDate: '1447/01/10',
      contentPreview: 'نماذج أسئلة اختبار الحفظ والمراجعة المجمع (سورة البقرة والنساء)\n------------------------------------------------------------------\nالسؤال الأول: اتلُ من قوله تعالى: (وَإِذِ ابْتَلَىٰ إِبْرَاهِيمَ رَبُّهُ بِكَلِمَاتٍ فَأَتَمَّهُنَّ...) إلى قوله تعالى: (...فَإِنَّ اللَّهَ سَمِيعٌ عَلِيمٌ). [20 درجة]\nالسؤال الثاني: اتلُ من قوله تعالى: (يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ...) [20 درجة]\nالسؤال الثالث: أجب عن معايير التجويد وترتيل سورة النساء وتطبيق أحكام الميم والنون الساكنة. [40 درجة]\nالسؤال الرابع: درجة الانضباط والسلوك والتميز التربوي [20 درجة]'
    }
  },
  {
    id: 'exam-2',
    periodId: 'p-1447-1',
    title: 'اختبار شهر صفر - الأجزاء الثلاثة الأولى',
    curriculum: 'منهج الإتقان والتثبيت',
    periodName: 'الفصل الأول 1447هـ - الفترة الأولى',
    examType: 'شهري',
    maxTotalScore: 100,
    passScore: 60,
    date: '1447/02/20',
    circleIds: ['c1', 'c2'],
    circleName: 'حلقة الطليعة وحلقة الفردوس',
    criteria: [
      { id: 'crit-1', name: 'الحفظ والتسميع', maxScore: 40 },
      { id: 'crit-2', name: 'حسن التلاوة والترتيل', maxScore: 20 },
      { id: 'crit-3', name: 'أحكام التجويد والنطق', maxScore: 20 },
      { id: 'crit-4', name: 'الانضباط والحضور', maxScore: 10 },
      { id: 'crit-5', name: 'السلوك والتميز التربوي', maxScore: 10 }
    ],
    responsibleName: 'الأستاذ خالد بن عبدالله النفيسي',
    notes: 'اختبار تقويمي شهر صفر.',
    status: 'open'
  }
];

// Initial Master Students Seed mapped to circles
export const DEFAULT_MASTER_STUDENTS: Student[] = [
  {
    id: 'ST-000001',
    name: 'عبدالرحمن بن ياسر المزروعي',
    circle: 'حلقة الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    status: 'active',
    joinDate: '15/09/1444',
    age: 16,
    parentName: 'ياسر بن ناصر المزروعي',
    parentPhone: '0554321980',
    relationship: 'أب',
    school: 'ثانوية الفتح بالرياض',
    nationalId: '1098765432',
    academicIndicator: 'green',
    riskFlags: [],
    hifzRate: 98,
    muraajaaRate: 95,
    commitmentScore: 96,
    lastExamScore: 92,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 99,
    trend: 'up',
    timeline: [
      { date: '15/09/1444', title: 'التسجيل والقبول', desc: 'تم قبول الطالب واجتيازه لاختبار مستوى الحفظ الابتدائي بنجاح.', author: 'إدارة شؤون الحفاظ' }
    ],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000002',
    name: 'معاذ بن خالد بن عبدالله النفيسي',
    circle: 'حلقة الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    status: 'active',
    joinDate: '20/11/1444',
    age: 15,
    parentName: 'خالد بن عبدالله النفيسي',
    parentPhone: '0567123490',
    relationship: 'أب',
    school: 'متوسطة الإمام شاطبي',
    nationalId: '1122334455',
    academicIndicator: 'green',
    riskFlags: [],
    hifzRate: 92,
    muraajaaRate: 88,
    commitmentScore: 90,
    lastExamScore: 88,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 95,
    trend: 'up',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000003',
    name: 'عمر بن خالد الدوسري',
    circle: 'حلقة الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    status: 'active',
    joinDate: '10/01/1445',
    age: 16,
    parentName: 'خالد بن فهد الدوسري',
    parentPhone: '0501122334',
    relationship: 'أب',
    school: 'ثانوية الملك عبدالعزيز',
    nationalId: '1088776655',
    academicIndicator: 'green',
    riskFlags: [],
    hifzRate: 85,
    muraajaaRate: 82,
    commitmentScore: 88,
    lastExamScore: 78,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 91,
    trend: 'stable',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000004',
    name: 'سعد بن فهد القحطاني',
    circle: 'حلقة الفردوس (متقدمين)',
    teacher: 'أ. حازم عمر الحركي',
    status: 'active',
    joinDate: '01/02/1445',
    age: 14,
    parentName: 'فهد بن سعد القحطاني',
    parentPhone: '0543322110',
    relationship: 'أب',
    school: 'متوسطة ابن تيمية',
    nationalId: '1055443322',
    academicIndicator: 'yellow',
    riskFlags: ['تأخر الحفظ اليومي'],
    hifzRate: 72,
    muraajaaRate: 68,
    commitmentScore: 75,
    lastExamScore: 54,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 85,
    trend: 'down',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000005',
    name: 'إبراهيم بن صالح العويّد',
    circle: 'حلقة الفرقان (ناشئة)',
    teacher: 'أ. محمد بن فهد الدوسري',
    status: 'active',
    joinDate: '15/03/1445',
    age: 12,
    parentName: 'صالح بن سليمان العويّد',
    parentPhone: '0533445566',
    relationship: 'أب',
    school: 'ابتدائية النموذجية',
    nationalId: '1022334411',
    academicIndicator: 'green',
    riskFlags: [],
    hifzRate: 94,
    muraajaaRate: 90,
    commitmentScore: 92,
    lastExamScore: 95,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 98,
    trend: 'up',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000006',
    name: 'خالد بن أحمد الغامدي',
    circle: 'حلقة الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    status: 'active',
    joinDate: '01/04/1445',
    age: 15,
    parentName: 'أحمد بن سعيد الغامدي',
    parentPhone: '0599887766',
    relationship: 'أب',
    school: 'متوسطة الأندلس',
    nationalId: '1077665544',
    academicIndicator: 'red',
    riskFlags: ['تعثر في اختبارات الشهر', 'تكرار الغياب'],
    hifzRate: 60,
    muraajaaRate: 55,
    commitmentScore: 62,
    lastExamScore: 52,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 78,
    trend: 'down',
    timeline: [],
    goals: [],
    interventions: [
      { id: 'int-1', type: 'support_plan', title: 'خطة إسناد فردي وتكثيف المراجعة', reason: 'تدني نسبة النجاح في الاختبارات الشهيرة', authority: 'الموجه التربوي', date: '1447/01/20', status: 'active' }
    ],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000007',
    name: 'محمد بن علي الشهري',
    circle: 'حلقة الفردوس (متقدمين)',
    teacher: 'أ. حازم عمر الحركي',
    status: 'active',
    joinDate: '10/05/1445',
    age: 14,
    parentName: 'علي بن ظافر الشهري',
    parentPhone: '0511223344',
    relationship: 'أب',
    school: 'متوسطة النهضة',
    nationalId: '1033221100',
    academicIndicator: 'green',
    riskFlags: [],
    hifzRate: 88,
    muraajaaRate: 86,
    commitmentScore: 89,
    lastExamScore: 84,
    lastExamName: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    attendanceRate: 94,
    trend: 'stable',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  },
  {
    id: 'ST-000008',
    name: 'عبدالله بن حسن الثقفي',
    circle: 'حلقة الفرقان (ناشئة)',
    teacher: 'أ. محمد بن فهد الدوسري',
    status: 'active',
    joinDate: '20/06/1445',
    age: 11,
    parentName: 'حسن بن عبدالله الثقفي',
    parentPhone: '0588776655',
    relationship: 'أب',
    school: 'ابتدائية حطين',
    nationalId: '1044556677',
    academicIndicator: 'yellow',
    riskFlags: ['غاب عن اختبار محرم'],
    hifzRate: 80,
    muraajaaRate: 78,
    commitmentScore: 82,
    lastExamScore: 0,
    lastExamName: 'لم يختبر - شهر محرم',
    attendanceRate: 88,
    trend: 'stable',
    timeline: [],
    goals: [],
    interventions: [],
    decisions: [],
    notes: [],
    communicationLog: [],
    achievements: []
  }
];

// Seed initial grades map: examId -> studentId -> StudentGradeRecord
export const DEFAULT_GRADES_MAP: Record<string, Record<string, StudentGradeRecord>> = {
  'exam-1': {
    'ST-000001': {
      studentId: 'ST-000001',
      studentName: 'عبدالرحمن بن ياسر المزروعي',
      nationalId: '1098765432',
      circleId: 'c1',
      scores: { 'crit-1': 38, 'crit-2': 19, 'crit-3': 18, 'crit-4': 10, 'crit-5': 10 },
      totalScore: 95,
      percentage: 95,
      passScore: 60,
      maxScore: 100,
      status: 'passed',
      notes: 'ممتاز جداً وأداء متقن',
      lastUpdated: '1447/01/16',
      updatedBy: 'الشيخ عبدالرحمن بن محمد السعيد'
    },
    'ST-000002': {
      studentId: 'ST-000002',
      studentName: 'معاذ بن خالد بن عبدالله النفيسي',
      nationalId: '1122334455',
      circleId: 'c1',
      scores: { 'crit-1': 35, 'crit-2': 18, 'crit-3': 17, 'crit-4': 9, 'crit-5': 9 },
      totalScore: 88,
      percentage: 88,
      passScore: 60,
      maxScore: 100,
      status: 'passed',
      notes: 'أداء متميز وجيد جداً',
      lastUpdated: '1447/01/16',
      updatedBy: 'الشيخ عبدالرحمن بن محمد السعيد'
    },
    'ST-000003': {
      studentId: 'ST-000003',
      studentName: 'عمر بن خالد الدوسري',
      nationalId: '1088776655',
      circleId: 'c1',
      scores: { 'crit-1': 30, 'crit-2': 16, 'crit-3': 15, 'crit-4': 9, 'crit-5': 8 },
      totalScore: 78,
      percentage: 78,
      passScore: 60,
      maxScore: 100,
      status: 'passed',
      notes: 'جيد ويحتاج تركيز أكبر على التجويد',
      lastUpdated: '1447/01/16',
      updatedBy: 'الشيخ عبدالرحمن بن محمد السعيد'
    },
    'ST-000006': {
      studentId: 'ST-000006',
      studentName: 'خالد بن أحمد الغامدي',
      nationalId: '1077665544',
      circleId: 'c1',
      scores: { 'crit-1': 20, 'crit-2': 12, 'crit-3': 11, 'crit-4': 6, 'crit-5': 5 },
      totalScore: 54,
      percentage: 54,
      passScore: 60,
      maxScore: 100,
      status: 'failed',
      notes: 'راسب - يحتاج خطة دعم مساندة وتكثيف التسميع',
      lastUpdated: '1447/01/16',
      updatedBy: 'الشيخ عبدالرحمن بن محمد السعيد'
    }
  }
};

// In-memory runtime state store (No localStorage business state)
let inMemoryPeriods: EvaluationPeriod[] = [...DEFAULT_PERIODS];
let inMemoryExams: Exam[] = [...DEFAULT_EXAMS];
let inMemoryAllGrades: Record<string, Record<string, StudentGradeRecord>> = { ...DEFAULT_GRADES_MAP };
let inMemoryGradeAuditLogs: GradeAuditEntry[] = [
  {
    id: 'aud-1',
    studentId: 'ST-000006',
    studentName: 'خالد بن أحمد الغامدي',
    examId: 'exam-1',
    examTitle: 'اختبار شهر محرم المجمع - سورة البقرة والنساء',
    periodId: 'p-1447-1',
    periodName: 'الفصل الأول 1447هـ - الفترة الأولى',
    curriculumName: 'منهج الحفظ والمراجعة المكثف',
    previousScore: 50,
    newScore: 54,
    modifiedBy: 'الشيخ عبدالرحمن بن محمد السعيد',
    timestamp: '1447/01/17 10:30 ص',
    reason: 'إعادة تصحيح بند التجويد بعد المراجعة'
  }
];

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
