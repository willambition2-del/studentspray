/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  User, Role, ApprovalRequest, VisualIdentity, SchoolYear, 
  BackupInfo, CriticalAlert, AdminDecision, AuditLog, GeneralDashboardStats, Student,
  PrintDocument, PrintTemplate, DocumentShareRule, PrintAuditRecord
} from './src/types';

// Let's create our in-memory database so it's persistent during server lifetime
const db = {
  users: [] as User[],
  roles: [] as Role[],
  approvals: [] as ApprovalRequest[],
  identity: {} as VisualIdentity,
  schoolYears: [] as SchoolYear[],
  backups: [] as BackupInfo[],
  alerts: [] as CriticalAlert[],
  decisions: [] as AdminDecision[],
  auditLogs: [] as AuditLog[],
  stats: {} as GeneralDashboardStats,
  students: [] as Student[],
  shelf: {
    posts: [] as any[],
    resources: [] as any[],
    announcements: [] as any[],
    reflections: [] as any[]
  },
  conversations: [] as any[],
  messages: {} as Record<string, any[]>,
  exams: [
    {
      id: 'exam-1',
      title: 'اختبار محرم المجمع - سورة البقرة',
      curriculum: 'منهج الحفظ والمراجعة المكثف',
      circleId: 'c1',
      circleName: 'حلقة الطليعة (خاتمين)',
      period: 'الفصل الأول 1447هـ',
      date: '1447/01/15 هـ',
      criteria: [
        { id: 'crit-1', name: 'الحفظ', maxScore: 40 },
        { id: 'crit-2', name: 'التلاوة', maxScore: 20 },
        { id: 'crit-3', name: 'التجويد', maxScore: 20 },
        { id: 'crit-4', name: 'الحضور', maxScore: 10 },
        { id: 'crit-5', name: 'السلوك', maxScore: 10 }
      ],
      maxTotalScore: 100,
      status: 'approved',
      createdById: 'u-1',
      createdByName: 'الشيخ عبدالرحمن بن محمد السعيد'
    },
    {
      id: 'exam-2',
      title: 'اختبار صفار الشهري - الأجزاء الثلاثة الأولى',
      curriculum: 'منهج الإتقان والتثبيت',
      circleId: 'c1',
      circleName: 'حلقة الطليعة (خاتمين)',
      period: 'الفصل الأول 1447هـ',
      date: '1447/02/20 هـ',
      criteria: [
        { id: 'crit-1', name: 'الحفظ', maxScore: 40 },
        { id: 'crit-2', name: 'التلاوة', maxScore: 20 },
        { id: 'crit-3', name: 'التجويد', maxScore: 20 },
        { id: 'crit-4', name: 'الحضور', maxScore: 10 },
        { id: 'crit-5', name: 'السلوك', maxScore: 10 }
      ],
      maxTotalScore: 100,
      status: 'draft',
      createdById: 'u-2',
      createdByName: 'الأستاذ خالد بن عبدالله النفيسي'
    }
  ] as any[],
  gradesRecords: [] as any[],
  ratingSettings: [
    { minPercentage: 90, maxPercentage: 100, label: 'ممتاز', color: 'emerald' },
    { minPercentage: 80, maxPercentage: 89.99, label: 'جيد جداً', color: 'blue' },
    { minPercentage: 70, maxPercentage: 79.99, label: 'جيد', color: 'amber' },
    { minPercentage: 60, maxPercentage: 69.99, label: 'مقبول', color: 'orange' },
    { minPercentage: 0, maxPercentage: 59.99, label: 'يحتاج متابعة', color: 'rose' }
  ] as any[],
  printDocuments: [] as PrintDocument[],
  printTemplates: [] as PrintTemplate[],
  printShares: [] as DocumentShareRule[],
  printAuditLogs: [] as PrintAuditRecord[]
};

// Seed initial data helper
function seedDatabase() {
  // 1. Roles
  db.roles = [
    {
      id: 'role-gm',
      name: 'المدير العام',
      description: 'يمتلك كامل الصلاحيات لإدارة النظام والتحكم بجميع الفروع والمستخدمين والإرسال والتقارير',
      permissions: [
        'view_strategic_dashboard', 'manage_students', 'manage_circles', 'manage_teachers', 'manage_supervisors', 
        'manage_plans', 'manage_activities', 'manage_graduates', 'manage_reports', 
        'manage_settings', 'manage_backups', 'manage_approvals'
      ],
      userCount: 1
    },
    {
      id: 'role-bm',
      name: 'مدير فرع',
      description: 'الإشراف على فرع محدد وحلقاته ومعلميه وطلب الاعتمادات للخطط والأنشطة',
      permissions: [
        'view_strategic_dashboard', 'manage_students', 'manage_circles', 'manage_teachers', 'manage_plans', 
        'manage_activities', 'manage_reports', 'manage_approvals'
      ],
      userCount: 1
    },
    {
      id: 'role-sup',
      name: 'مشرف حلقة',
      description: 'متابعة الخطط والمقررات الدراسية وتقييم مستويات الطلاب والحلقات والتقارير الأسبوعية',
      permissions: [
        'manage_students', 'manage_circles', 'manage_plans', 'manage_reports'
      ],
      userCount: 2
    },
    {
      id: 'role-tch',
      name: 'معلم حلقة',
      description: 'تسجيل غياب وحضور الطلاب وإدخال الحفظ اليومي والمراجعة وتنشيط الطلاب',
      permissions: [
        'manage_students', 'manage_plans'
      ],
      userCount: 4
    }
  ];

  // 2. Users
  db.users = [
    {
      id: 'u-1',
      name: 'الشيخ عبدالرحمن بن محمد السعيد',
      email: 'hgh357790@gmail.com',
      username: 'admin',
      type: 'admin',
      roleId: 'role-gm',
      status: 'active',
      branchId: null,
      createdAt: '2026-01-01T08:00:00Z'
    },
    {
      id: 'u-2',
      name: 'الأستاذ خالد بن عبدالله النفيسي',
      email: 'khalid.n@alhudacenter.org',
      username: 'khalid_n',
      type: 'branch_manager',
      roleId: 'role-bm',
      status: 'active',
      branchId: 'br-1',
      branchName: 'فرع الشمال الرياض',
      createdAt: '2026-01-10T11:30:00Z'
    },
    {
      id: 'u-3',
      name: 'الأستاذ محمد بن فهد الدوسري',
      email: 'm.fهد@alhudacenter.org',
      username: 'm_dosari',
      type: 'supervisor',
      roleId: 'role-sup',
      status: 'active',
      branchId: 'br-1',
      branchName: 'فرع الشمال الرياض',
      createdAt: '2026-01-15T09:00:00Z'
    },
    {
      id: 'u-4',
      name: 'الأستاذ عمر بن عبدالعزيز التركي',
      email: 'omar.t@alhudacenter.org',
      username: 'omar_t',
      type: 'teacher',
      roleId: 'role-tch',
      status: 'active',
      branchId: 'br-1',
      branchName: 'فرع الشمال الرياض',
      createdAt: '2026-02-01T14:20:00Z'
    },
    {
      id: 'u-5',
      name: 'الأستاذ صالح بن سليمان العويّد',
      email: 'saleh.o@gmail.com',
      username: 'saleh_o',
      type: 'parent',
      roleId: null,
      status: 'active',
      branchId: 'br-1',
      branchName: 'فرع الشمال الرياض',
      createdAt: '2026-02-05T16:45:00Z'
    },
    {
      id: 'u-6',
      name: 'الأستاذ سليمان بن داود الماجد',
      email: 's.majed@example.com',
      username: 's_majed',
      type: 'teacher',
      roleId: 'role-tch',
      status: 'inactive',
      branchId: 'br-2',
      branchName: 'فرع شرق الرياض',
      createdAt: '2026-02-10T10:10:00Z'
    }
  ];

  // 3. Approvals
  db.approvals = [
    {
      id: 'ap-1',
      decisionNumber: 'DEC-1447-088',
      title: 'اعتماد الخطة الاستثنائية لحفظ القرآن الكريم (الطالب: معاذ خالد النفيسي)',
      type: 'student_plan',
      requesterName: 'الأستاذ عمر بن عبدالعزيز التركي',
      requesterRole: 'معلم حلقة عاصم',
      department: 'قسم التعليم والحلقات (فرع الشمال)',
      urgency: 'high',
      details: 'اقتراح خطة تسريع للحفظ بمقدار 3 صفحات يومياً لمظاهر التميز والذكاء الوقاد لدى الطالب، مع مراجعة جزء كامل يومياً بدلاً من خمس صفحات.',
      status: 'pending',
      createdAt: '2026-06-21T18:30:00Z',
      targetBranch: 'فرع الشمال',
      targetCircle: 'حلقة الإمام عاصم',
      affectedEntityCount: 1,
      attachments: [{ name: 'سجل_تقييم_الطالب_معاذ.pdf', size: '1.2 MB' }],
      auditTrail: [
        { id: 'at-1', author: 'الأستاذ عمر التركي', role: 'معلم الحلقة', action: 'تقديم الطلب', notes: 'يرجى التكرم بالاعتماد للاستمرار بالمعدل السريع.', timestamp: '2026-06-21T18:30:00Z' }
      ],
      editableData: {
        customPlanDays: 90,
        targetCircleName: 'حلقة الإمام عاصم المكثفة',
        extraInstructions: 'التركيز على تثبيت سورة البقرة وآل عمران'
      }
    },
    {
      id: 'ap-2',
      decisionNumber: 'DEC-1447-012',
      title: 'طلب اعتماد خطة حلقة الإمام عاصم لموسم صيف 1447هـ',
      type: 'circle_plan',
      requesterName: 'الأستاذ محمد بن فهد الدوسري',
      requesterRole: 'مشرف الحلقات',
      department: 'إدارة الشؤون التعليمية',
      urgency: 'normal',
      details: 'جدولة دروس التجويد العملي وتلاوة المتون لـ 15 طالباً بفرع الشمال، بمستويات تتراوح بين الحفظ المكثف والمراجعة المستمرة.',
      status: 'approved',
      decisionDate: '2026-06-16T10:00:00Z',
      decisionMaker: 'المدير العام',
      notes: 'تمت الموافقة بشريطة أن يجرى الاختبار التحصيلي في الأسبوع الثامن.',
      createdAt: '2026-06-15T09:12:00Z',
      targetBranch: 'فرع الشمال',
      targetCircle: 'حلقة الإمام عاصم',
      affectedEntityCount: 15,
      auditTrail: [
        { id: 'at-2', author: 'المدير العام', role: 'إدارة العليا', action: 'اعتماد وموافقة', notes: 'تمت الموافقة بشريطة عقد الاختبار التحصيلي.', timestamp: '2026-06-16T10:00:00Z' }
      ]
    },
    {
      id: 'ap-3',
      decisionNumber: 'DEC-1447-089',
      title: 'طلب اعتماد إقامة نشاط "قرآني ربيع قلبي" الصيفي الترفيهي',
      type: 'activity',
      requesterName: 'الأستاذ خالد بن عبدالله النفيسي',
      requesterRole: 'مدير فرع الشمال',
      department: 'إدارة الأنشطة والرحلات',
      urgency: 'urgent',
      details: 'إطلاق مسابقة عائلية ومخيم قرآني ترفيهي للطلاب المتميزين في حفظ القرآن الكريم مع رحلة ترفيهية لمدة 3 أيام لمدينة أبها للترويح والتحفيز.',
      status: 'pending',
      createdAt: '2026-06-22T06:15:00Z',
      targetBranch: 'فرع الشمال',
      estimatedBudget: 18500,
      approvedBudget: 18500,
      affectedEntityCount: 45,
      attachments: [
        { name: 'خطة_مخيم_أبها_القرآني.pdf', size: '3.4 MB' },
        { name: 'دراسة_الميزانية_المقترحة.xlsx', size: '540 KB' }
      ],
      auditTrail: [
        { id: 'at-3', author: 'الأستاذ خالد النفيسي', role: 'مدير الفرع', action: 'رفع الطلب', notes: 'توفير التمويل والموافقات الأمنية للرحلة.', timestamp: '2026-06-22T06:15:00Z' }
      ],
      editableData: {
        allocatedBudget: 18500,
        eventDateRange: 'من 15 إلى 18 يوليو 2026'
      }
    },
    {
      id: 'ap-4',
      decisionNumber: 'DEC-1446-500',
      title: 'اعتماد التقرير السنوي الإحصائي لأداء الملتقيات لعام 1446هـ',
      type: 'annual_report',
      requesterName: 'الأستاذ عبدالرحمن السعيد',
      requesterRole: 'المدير العام',
      department: 'الإدارة العامة والجودة',
      urgency: 'normal',
      details: 'التقرير السنوي الشامل لمستوى الفروع الستة التابعة للملتقى القرآني بالرياض، متضمناً مؤشرات الأداء ومقارنات الحفظ والتكلفة ومعدل تسرب المعلمين والطلاب.',
      status: 'approved',
      decisionDate: '2026-06-11T09:00:00Z',
      decisionMaker: 'مجلس إدارة الجمعية',
      notes: 'تم التدقيق والاعتماد النهائي ونشر النسخة للجهة التابعة.',
      createdAt: '2026-06-10T12:00:00Z'
    },
    {
      id: 'ap-5',
      decisionNumber: 'DEC-1447-090',
      title: 'طلب نقل الطالب عبدالرحمن عمر الشمري من حلقة عاصم إلى حلقة نافع',
      type: 'student_transfer',
      requesterName: 'الأستاذ عمر بن عبدالعزيز التركي',
      requesterRole: 'معلم حلقة عاصم',
      department: 'شؤون الطلاب والتسجيل',
      urgency: 'normal',
      details: 'طلب نقل الطالب بسبب تغير موعد حضور ولي أمره وطلب إلحاقه بحلقة الفترة المسائية المتأخرة (حلقة الإمام نافع).',
      status: 'pending',
      createdAt: '2026-06-22T05:00:00Z',
      targetBranch: 'فرع الوسط',
      targetCircle: 'حلقة الإمام نافع',
      affectedEntityCount: 1,
      editableData: {
        targetCircleName: 'حلقة الإمام نافع المسائية'
      }
    },
    {
      id: 'ap-6',
      decisionNumber: 'DEC-1447-091',
      title: 'اعتماد ميزانية شراء حواسيب وشاشات تفاعلية لحلقات التجويد',
      type: 'financial_budget',
      requesterName: 'المهندس طارق العلي',
      requesterRole: 'رئيس قسم التقنية والوسائل',
      department: 'إدارة المالية والوسائل',
      urgency: 'high',
      details: 'طلب اعتماد ميزانية قدرها 24,000 ريال لتوفير 6 شاشات تفاعلية مقاس 65 بوصة وأجهزة عرض صوتية متطورة لتدريس علم التجويد والمخارج.',
      status: 'pending',
      createdAt: '2026-06-23T10:00:00Z',
      estimatedBudget: 24000,
      approvedBudget: 24000,
      targetBranch: 'المجمع المركزي',
      attachments: [{ name: 'عروض_الأسعار_الفنية.pdf', size: '2.1 MB' }],
      editableData: {
        allocatedBudget: 24000
      }
    },
    {
      id: 'ap-7',
      decisionNumber: 'DEC-1447-044',
      title: 'طلب اعتماد تغيير منهج التلقين لحلقة البراعم إلى منهج نور البيان',
      type: 'curriculum_change',
      requesterName: 'الدكتور إبراهيم المنصور',
      requesterRole: 'رئيس لجنة المناهج والتحفيز',
      department: 'اللجنة العلمية والمناهج',
      urgency: 'normal',
      details: 'دراسة تطويرية لتحديث منهج الحروف والتأسيس للبراعم الصغار لرفع جودة النطق والقراءة السليمة قبل البدء بالحفظ المباشر.',
      status: 'conditional_approved',
      decisionDate: '2026-06-20T14:30:00Z',
      decisionMaker: 'المدير العام',
      notes: 'موافقة مشروطة بتجربة المنهج على عينتين من حلقات الفرع الغربي لمدة شهرين رفقة تقرير تقييمي.',
      approvalConditions: 'تطبيق تجريبي لمدة 8 أسابيع بفرع واحد قبل التعميم الشامل.',
      createdAt: '2026-06-18T11:20:00Z'
    },
    {
      id: 'ap-8',
      decisionNumber: 'DEC-1447-051',
      title: 'طلب اعتماد تعيين الشيخ عبدالمجيد الغامدي معلماً لحلقة الإسناد',
      type: 'teacher_nomination',
      requesterName: 'الأستاذ فهد العصيمي',
      requesterRole: 'مشرف الموارد البشرية والتعيينات',
      department: 'إدارة الكوادر والموارد البشرية',
      urgency: 'high',
      details: 'ترشيح الشيخ عبدالمجيد الغامدي الحاصل على الإجازة بالقراءات العشر لتولي حلقة الإسناد والافتتاح بفرع الشرق براتب شهري معتمد.',
      status: 'approved',
      decisionDate: '2026-06-19T08:15:00Z',
      decisionMaker: 'المدير العام',
      notes: 'اعتمد التعيين ويسند له الإشراف على حلقات المقرأة الرقمية أيضاً.',
      createdAt: '2026-06-17T16:00:00Z'
    },
    {
      id: 'ap-9',
      decisionNumber: 'DEC-1447-092',
      title: 'التماس ولي أمر الطالب سلمان الفهد لاستثناء شرط السن بمسابقة الماهر',
      type: 'parent_appeal',
      requesterName: 'مجلس أولياء الأمور (الأستاذ سلمان الفهد)',
      requesterRole: 'ولي أمر طالب',
      department: 'مجلس أولياء الأمور والرعاية',
      urgency: 'normal',
      details: 'التماس استثناء الطالب سلمان الفهد للمشاركة بفرع حفظ 15 جزءاً بالمسابقة رغم صغر سنه بعام واحد عن الحد الأدنى وذلك لتفوقه الاستثنائي.',
      status: 'pending',
      createdAt: '2026-06-24T08:00:00Z',
      targetBranch: 'فرع الشمال'
    }
  ];

  // 4. Visual Identity
  db.identity = {
    centerName: 'ملتقى الهدى القرآني النموذجي',
    logo: '1', // Selected template icon
    textLogo: 'ملتقى الهدى القرآني - صرحٌ قرآنيٌّ واعد ونبوغ مبكر',
    phone: '0555666777',
    email: 'info@alhudacenter.org',
    website: 'https://alhudacenter.org',
    affiliate: 'الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض (مكْنون)'
  };

  // 5. School Years
  db.schoolYears = [
    {
      id: 'sy-1445',
      yearCode: 'العام الدراسي 1445 هـ',
      status: 'archived',
      createdAt: '2024-08-01T08:00:00Z'
    },
    {
      id: 'sy-1446',
      yearCode: 'العام الدراسي 1446 هـ',
      status: 'closed',
      createdAt: '2025-08-01T08:00:00Z'
    },
    {
      id: 'sy-1447',
      yearCode: 'العام الدراسي الحالي 1447 هـ',
      status: 'active',
      createdAt: '2026-08-01T08:00:00Z'
    }
  ];

  // 6. Backups
  db.backups = [
    {
      id: 'bk-1',
      fileName: 'ملتقى_الهدى_نسخة_احتياطية_موسم_1446_نهاية_العام.json',
      version: 'v2.4.1',
      stats: {
        students: 312,
        circles: 24,
        teachers: 18,
        supervisors: 4,
        plans: 120,
        activities: 32,
        achievements: 85,
        graduates: 42,
        reports: 56
      },
      createdAt: '2026-05-20T22:15:00Z',
      backedUpBy: 'نظام النسخ الاحتياطي التلقائي'
    },
    {
      id: 'bk-2',
      fileName: 'نسخة_تكاملية_قبل_إغلاق_العام_الدراسي_الماضي.json',
      version: 'v2.5.0',
      stats: {
        students: 325,
        circles: 26,
        teachers: 20,
        supervisors: 5,
        plans: 142,
        activities: 40,
        achievements: 98,
        graduates: 51,
        reports: 72
      },
      createdAt: '2026-06-10T14:10:00Z',
      backedUpBy: 'الشيخ عبدالرحمن السعيد (المدير العام)'
    }
  ];

  // 7. Critical Alerts
  db.alerts = [
    {
      id: 'al-1',
      title: 'انخفاض حاد في الحضور اليومي بفرع الشرق (حلقة نافع المدني)',
      type: 'low_attendance',
      severity: 'critical',
      status: 'active',
      details: 'هبطت نسبة حضور طلاب الحلقة طيلة الأسبوع الجاري لتسجل 58% فقط، يعزى ذلك لغياب جماعي وتأخر تواصل المدرس مع أولياء الأمور.',
      createdAt: '2026-06-22T04:10:00Z'
    },
    {
      id: 'al-2',
      title: 'تأخر تسليم التقييمات الشهرية للفصل الثاني لفائدة 3 حلقات بفرع الشمال',
      type: 'delayed_eval',
      severity: 'high',
      status: 'assigned',
      details: 'الحلقات (الكسائي، شعبة، قالون) لم يتم رفع نتائج تقييم حفظها لعامة الطلاب من طرف المعلمين، مما يعرقل طباعة التقارير الفصلية للأولياء.',
      assignedTo: 'الأستاذ محمد بن فهد الدوسري (مشرف الحلقات)',
      createdAt: '2026-06-21T09:30:00Z'
    },
    {
      id: 'al-3',
      title: 'توقف خطة الطالب المتميز إبراهيم السبيعي لأكثر من 15 يوماً دون إبداء مبرر',
      type: 'stopped_plans',
      severity: 'medium',
      status: 'active',
      details: 'الطالب يتخلف عن برنامج الحفظ المسرع (حفظ جزأين شهرياً)، وهو في حاجة لبحث حالته بشكل عاجل.',
      createdAt: '2026-06-20T11:15:00Z'
    },
    {
      id: 'al-4',
      title: 'فشل النسخ الاحتياطي التلقائي اليومي المبرمج لسيرفر السحاب (خطأ الاتصال)',
      type: 'backup_failed',
      severity: 'critical',
      status: 'active',
      details: 'النظام فشل في الاتصال بقاعدة البيانات السحابية أثناء تجميع ملفات الطلاب والمنجزات، يرجى الفحص الفوري للمنفذ أو تجديد الحساب.',
      createdAt: '2026-06-22T01:00:00Z'
    },
    {
      id: 'al-5',
      title: 'طلب اعتماد خطة معلق منذ 12 يوماً بمركز الاعتمادات (رحلة أبها المدرسية)',
      type: 'overdue_approvals',
      severity: 'low',
      status: 'active',
      details: 'الطلب المرسل من مدير فرع الشمال بانتظار البت الرسمي للمدير العام لتيسير الحجز الفندقي والمزارات لحاملي كتاب الله للترفيه والتحفيز.',
      createdAt: '2026-06-10T08:00:00Z'
    }
  ];

  // 8. Administrative Decisions
  db.decisions = [
    {
      id: 'dc-1',
      decisionNumber: 'ق-إ-1447-012',
      title: 'تعيين الأستاذ فهد القحطاني معلماً لحلقة الكسائي بفرع الشمال',
      type: 'hire_teacher',
      targetEntity: 'فرع الشمال - حلقة الكسائي',
      date: '2026-06-01',
      content: 'بعد الاطلاع على السيرة العطرة والمقابلة الرسمية، يتقرر تعيين الشيخ فهد القحطاني معلماً براتب مجزي لمستويات الحفظ المتقدمة وتجويد القرآن الكريم.',
      status: 'approved',
      attachments: ['عقد_فهد_القحطاني_موقع.pdf'],
      createdAt: '2026-06-01T08:30:00Z'
    },
    {
      id: 'dc-2',
      decisionNumber: 'ق-إ-1447-015',
      title: 'دمج حلقات قالون وابن كثير للمرحلة المتوسطة بفرع الغرب',
      type: 'merge_circles',
      targetEntity: 'فرع الغرب القرآني',
      date: '2026-06-15',
      content: 'نظراً لانخفاض عدد الطلاب في كلا الحلقتين واستثماراً للموارد وتكافؤ المعلمين، تدمج الحلقتان تحت إشراف فضيلة الشيخ محمد الغامدي.',
      status: 'ongoing',
      attachments: ['قرار_الدمج_وحصر_الطلاب.xlsx'],
      createdAt: '2026-06-15T11:00:00Z'
    },
    {
      id: 'dc-3',
      decisionNumber: 'ق-إ-1447-020',
      title: 'فتح حلقة جديدة للموهوبين وصغار الحفاظ في التفسير واللحون',
      type: 'open_circle',
      targetEntity: 'الإدارة العامة للملتقى',
      date: '2026-06-22',
      content: 'تأسيس نواة لحلقة نخبة الحفاظ لصغار السن دون الـ 12 عاماً، لربط الحفظ بالتدبر وقراءة المتون العلمية وعلم الرسم القرآني.',
      status: 'draft',
      attachments: [],
      createdAt: '2026-06-22T07:15:00Z'
    }
  ];

  // 9. Audit Logs
  db.auditLogs = [
    {
      id: 'log-1',
      username: 'admin',
      operationType: 'auth',
      affectedEntity: 'تسجيل الدخول للنظام',
      details: 'نجح تسجيل دخول المدير العام عبدالرحمن السعيد إلى لوحة التحكم من عنوان IP 192.168.1.50',
      timestamp: '2026-06-22T07:10:00Z'
    },
    {
      id: 'log-2',
      username: 'admin',
      operationType: 'create',
      affectedEntity: 'المستند القانوني: قرار تعيين مدرس',
      details: 'إنشاء مسودة القرار الخاص بفتح حلقة جديدة للموهوبين وصغار الحفاظ برقم ق-إ-1447-020',
      timestamp: '2026-06-22T07:15:00Z'
    },
    {
      id: 'log-3',
      username: 'admin',
      operationType: 'approve',
      affectedEntity: 'طلب اعتماد خطة حلقة عاصم',
      details: 'اعتماد الطلب ap-2 وإضافة ملاحظات توجيهية حول موعد الاختبار التحصيلي.',
      timestamp: '2026-06-20T13:40:00Z'
    },
    {
      id: 'log-4',
      username: 'khalid_n',
      operationType: 'create',
      affectedEntity: 'طلب اعتماد نشاط',
      details: 'إرسال طلب اعتماد لمسابقة ونشاط "قرآني ربيع قلبي" الصيفي بفرع الشمال لرحلة أبها.',
      timestamp: '2026-06-22T06:15:00Z'
    }
  ];

  // 10. Dashboard Stats
  db.stats = {
    totalStudents: 345,
    totalCircles: 28,
    totalTeachers: 22,
    totalSupervisors: 6,
    attendanceRate: 91.5,
    planComplianceRate: 85.2,
    graduatesCount: 54,
    activitiesCount: 12,
    achievementsCount: 114,
    criticalAlertsCount: 5,
    pendingRequestsCount: 3,
    adminDecisionsCount: 3
  };

  // 11. Print Templates
  db.printTemplates = [
    {
      id: 'tmpl-1',
      name: 'قالب شهادات التكريم الحصري',
      type: 'certificate',
      headerTitle: 'ملتقى الهدى القرآني النموذجي',
      subtitle: 'الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض (مكْنون)',
      logoPlacement: 'center',
      primaryColor: '#065f46',
      accentColor: '#fbbf24',
      includeWatermark: true,
      watermarkText: 'ملتقى الهدى القرآني',
      footerText: 'وثيقة رسمية معتمدة من إدارة ملتقى الهدى القرآني',
      signatureTitle1: 'المدير العام',
      signatureName1: 'الشيخ عبدالرحمن بن محمد السعيد',
      includeQrCode: true,
      layoutStyle: 'certificate',
      updatedAt: '1447/01/10 هـ'
    },
    {
      id: 'tmpl-2',
      name: 'قالب أوسمة ونشاط التميز',
      type: 'award',
      headerTitle: 'ملتقى الهدى القرآني - وسام شرف التميز',
      subtitle: 'تكريم الحفاظ والمتميزين في التلاوة والتجويد',
      logoPlacement: 'right',
      primaryColor: '#0f766e',
      accentColor: '#f59e0b',
      includeWatermark: true,
      watermarkText: 'وسام التميز',
      footerText: 'تم منح هذا الوسام تقديراً للجهود والاجتهاد القرآني',
      signatureTitle1: 'مشرف الحلقات',
      signatureName1: 'الأستاذ محمد بن فهد الدوسري',
      includeQrCode: true,
      layoutStyle: 'award_card',
      updatedAt: '1447/01/12 هـ'
    },
    {
      id: 'tmpl-3',
      name: 'قالب كشوف الدرجات الرسمية',
      type: 'grade',
      headerTitle: 'كشف درجات الاختبار المعتمد',
      subtitle: 'الإدارة التعليمية وشؤون الطلاب بالملتقى',
      logoPlacement: 'right',
      primaryColor: '#1e293b',
      accentColor: '#10b981',
      includeWatermark: false,
      footerText: 'سجل رسمي معتمد للاختبارات التحصيلية والتلاوة',
      signatureTitle1: 'المعلم المسجل',
      signatureName1: 'الأستاذ عمر بن عبدالعزيز التركي',
      includeQrCode: true,
      layoutStyle: 'formal_table',
      updatedAt: '1447/01/15 هـ'
    }
  ];

  // 12. Print Documents
  db.printDocuments = [
    {
      id: 'doc-1',
      serialNumber: 'DOC-1447-001',
      title: 'التقرير السنوي الشامل لأداء الملتقى القرآني لعام 1447هـ',
      docType: 'report',
      dataScope: 'system_wide',
      ownerId: 'u-1',
      ownerName: 'الشيخ عبدالرحمن بن محمد السعيد',
      entityType: 'general',
      entityName: 'الإدارة العامة للملتقى',
      description: 'يتضمن مؤشرات الأداء الكلي، نسبة انضباط الحفظ، أعداد الحفاظ، وتوزيع الميزانية التشغيلية للفروع.',
      date: '1447/01/01 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: true,
      allowShare: true,
      createdAt: '2026-08-01T08:00:00Z'
    },
    {
      id: 'doc-2',
      serialNumber: 'DOC-1447-002',
      title: 'التقرير التجميعي لنتائج وأنشطة حلقة الإمام عاصم',
      docType: 'report',
      dataScope: 'my_circle',
      ownerId: 'u-4',
      ownerName: 'الأستاذ عمر بن عبدالعزيز التركي',
      circleId: 'c1',
      circleName: 'حلقة الطليعة (خاتمين)',
      entityType: 'circle',
      entityName: 'حلقة الطليعة (خاتمين)',
      description: 'تقرير شهري يوثق مستويات إنجاز الحفظ والمراجعة ومعدل غياب الطلاب بالحلقة.',
      date: '1447/01/15 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: true,
      allowShare: true,
      createdAt: '2026-08-05T10:00:00Z'
    },
    {
      id: 'doc-3',
      serialNumber: 'DOC-1447-003',
      title: 'وسام الإتقان والتجويد المتميز - الطالب معاذ بن خالد النفيسي',
      docType: 'award',
      dataScope: 'my_students',
      ownerId: 'u-4',
      ownerName: 'الأستاذ عمر بن عبدالعزيز التركي',
      studentId: 'ST-000001',
      studentName: 'معاذ بن خالد بن عبدالله النفيسي',
      circleName: 'حلقة الطليعة (خاتمين)',
      entityType: 'award',
      entityName: 'الطالب معاذ بن خالد النفيسي',
      description: 'وسام شرفي مُمنح للطالب لحصوله على التقدير الممتاز في التلاوة والتجويد بسورة البقرة.',
      date: '1447/01/20 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
      createdAt: '2026-08-06T11:30:00Z'
    },
    {
      id: 'doc-4',
      serialNumber: 'DOC-1447-004',
      title: 'شهادة إتمام حفظ سورة البقرة وتجويدها - الطالب معاذ بن خالد النفيسي',
      docType: 'certificate',
      dataScope: 'my_students',
      ownerId: 'u-1',
      ownerName: 'الشيخ عبدالرحمن بن محمد السعيد',
      studentId: 'ST-000001',
      studentName: 'معاذ بن خالد بن عبدالله النفيسي',
      entityType: 'student',
      entityName: 'الطالب معاذ بن خالد النفيسي',
      description: 'شهادة إتقان معتمدة موثقة برقم تسلسلي وكود تحقق إلكتروني بملتقى الهدى القرآني.',
      date: '1447/01/22 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
      createdAt: '2026-08-07T09:00:00Z'
    },
    {
      id: 'doc-5',
      serialNumber: 'DOC-1447-005',
      title: 'كشف درجات اختبار محرم المجمع - سورة البقرة (حلقة عاصم)',
      docType: 'grade',
      dataScope: 'my_circle',
      ownerId: 'u-4',
      ownerName: 'الأستاذ عمر بن عبدالعزيز التركي',
      circleId: 'c1',
      circleName: 'حلقة الطليعة (خاتمين)',
      entityType: 'exam',
      entityName: 'حلقة الطليعة - اختبار محرم',
      description: 'كشف رصد الدرجات التفصيلية لمعايير الحفظ، التلاوة، التجويد، الحضور والسلوك لجميع طلاب الحلقة.',
      date: '1447/01/25 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: true,
      allowShare: true,
      contentData: {
        rows: [
          { 'اسم الطالب': 'معاذ بن خالد النفيسي', 'الحفظ (40)': 40, 'التلاوة (20)': 20, 'التجويد (20)': 19, 'النسبة': '99%', 'التقدير': 'ممتاز مرتفع' },
          { 'اسم الطالب': 'عبدالرحمن عمر الشمري', 'الحفظ (40)': 36, 'التلاوة (20)': 18, 'التجويد (20)': 17, 'النسبة': '91%', 'التقدير': 'ممتاز' }
        ]
      },
      createdAt: '2026-08-08T14:20:00Z'
    },
    {
      id: 'doc-6',
      serialNumber: 'DOC-1447-006',
      title: 'كشف الحضور والغياب الشهري - حلقة الإمام عاصم (شهر محرم 1447هـ)',
      docType: 'attendance',
      dataScope: 'my_circle',
      ownerId: 'u-4',
      ownerName: 'الأستاذ عمر بن عبدالعزيز التركي',
      circleId: 'c1',
      circleName: 'حلقة الطليعة (خاتمين)',
      entityType: 'circle',
      entityName: 'حلقة الطليعة',
      description: 'سجل الدوام والانضباط والمواظبة اليومية للطلاب خلال الشهر الحالي.',
      date: '1447/01/28 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: true,
      allowShare: true,
      createdAt: '2026-08-09T08:10:00Z'
    },
    {
      id: 'doc-7',
      serialNumber: 'DOC-1447-007',
      title: 'البطاقة التعريفية والملف الشامل للطالب معاذ بن خالد النفيسي',
      docType: 'student',
      dataScope: 'my_students',
      ownerId: 'u-1',
      ownerName: 'الإدارة العامة',
      studentId: 'ST-000001',
      studentName: 'معاذ بن خالد بن عبدالله النفيسي',
      entityType: 'student',
      entityName: 'معاذ بن خالد النفيسي',
      description: 'ملف الطالب المتكامل متضمناً الأجزاء المحفوظة، نتائج التقييمات، خطة التسريع، ومعلومات التواصل.',
      date: '1447/01/30 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
      createdAt: '2026-08-10T11:00:00Z'
    },
    {
      id: 'doc-8',
      serialNumber: 'DOC-1447-008',
      title: 'دليل الحافظ الأمين في إتقان المتون والتجويد (الرف العام)',
      docType: 'resource',
      dataScope: 'system_wide',
      ownerId: 'u-1',
      ownerName: 'الإدارة العامة',
      entityType: 'shelf_file',
      entityName: 'دليل الحافظ الأمين',
      description: 'كتاب ومذكرة المناهج المعتمدة لتحفيظ وتثبيت القرآن الكريم متضمنة القواعد الضابطة للتشابهات.',
      date: '1447/01/01 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
      createdAt: '2026-08-01T08:00:00Z'
    },
    {
      id: 'doc-9',
      serialNumber: 'DOC-1447-009',
      title: 'توجيهات الإدارة العامة لتقييم الحلقات وتفعيل تحفيز الطلاب',
      docType: 'shared',
      dataScope: 'system_wide',
      ownerId: 'u-1',
      ownerName: 'الشيخ عبدالرحمن بن محمد السعيد',
      entityType: 'decision',
      entityName: 'توجيهات الإدارة',
      description: 'تعميم إداري موجه لكافة المدرسين وأولياء الأمور لتفعيل نظام الأوسمة وصرف المكافآت التشجيعية.',
      date: '1447/02/01 هـ',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
      sharedWith: [
        {
          id: 'sh-1',
          docId: 'doc-9',
          sharedByUserId: 'u-1',
          sharedByUserName: 'الشيخ عبدالرحمن بن محمد السعيد',
          sharedByUserRole: 'المدير العام',
          targetType: 'all_teachers',
          targetName: 'جميع المدرسين والكادر',
          permissionLevel: 'full',
          sharedAt: '1447/02/01 هـ'
        }
      ],
      createdAt: '2026-08-11T07:00:00Z'
    }
  ];

  // 13. Audit logs initial seed
  db.printAuditLogs = [
    {
      id: 'prt-log-1',
      userId: 'u-1',
      userName: 'الشيخ عبدالرحمن بن محمد السعيد',
      userRole: 'المدير العام',
      docId: 'doc-1',
      docType: 'report',
      docTitle: 'التقرير السنوي الشامل لأداء الملتقى القرآني لعام 1447هـ',
      entityName: 'الإدارة العامة للملتقى',
      action: 'print',
      copiesCount: 1,
      timestamp: '2026-08-11T05:00:00Z'
    },
    {
      id: 'prt-log-2',
      userId: 'u-4',
      userName: 'الأستاذ عمر بن عبدالعزيز التركي',
      userRole: 'مدرس حلقة عاصم',
      docId: 'doc-5',
      docType: 'grade',
      docTitle: 'كشف درجات اختبار محرم المجمع - سورة البقرة (حلقة عاصم)',
      entityName: 'حلقة الطليعة',
      action: 'excel',
      copiesCount: 1,
      timestamp: '2026-08-11T05:20:00Z'
    }
  ];
}

// Seed upon initialization
seedDatabase();

// Express app initialization
const app = express();
const PORT = 3000;

app.use(express.json());

// API route handlers

// Students Endpoints
app.get('/api/students', (req, res) => {
  res.json(db.students);
});

app.post('/api/students', (req, res) => {
  const data = req.body;
  const nextNum = db.students.length + 1;
  const newStudent: Student = {
    id: data.id || `ST-${String(nextNum).padStart(6, '0')}`,
    name: data.name,
    circle: data.circle || 'حقة حفظ الطليعة (خاتمين)',
    teacher: data.teacher || 'عبد الرحمن السعيد',
    status: data.status || 'active',
    joinDate: new Date().toLocaleDateString('ar-SA'),
    age: Number(data.age) || 14,
    parentName: data.parentName || 'غير مسجل',
    parentPhone: data.parentPhone || 'غير مسجل',
    relationship: data.relationship || 'أب',
    school: data.school || 'المدرسة النموذجية',
    email: data.email || '',
    nationalId: data.nationalId || '',
    birthDate: data.birthDate || '',
    gender: data.gender || 'male',
    mentor: data.mentor || 'أ. عبد الرحمن السعيد',
    parentOccupation: data.parentOccupation || '',
    lastSurah: data.lastSurah || 'غير محدد',
    memorizedJuzCount: Number(data.memorizedJuzCount) || 3,
    tajweedLevel: data.tajweedLevel || 'intermediate',
    readingLevel: data.readingLevel || 'very_good',
    healthNotes: data.healthNotes || '',
    specialNeeds: data.specialNeeds || '',
    educationalNotes: data.educationalNotes || '',
    generalNotes: data.generalNotes || '',
    academicIndicator: data.academicIndicator || 'green',
    riskFlags: data.riskFlags || [],
    hifzRate: Number(data.hifzRate) || 85,
    muraajaaRate: Number(data.muraajaaRate) || 80,
    commitmentScore: Number(data.commitmentScore) || 80,
    lastExamScore: Number(data.lastExamScore) || 85,
    lastExamName: data.lastExamName || 'اختبار وتقييم مبدئي للمنتسب',
    attendanceRate: Number(data.attendanceRate) || 90,
    trend: data.trend || 'stable',
    timeline: data.timeline || [
      { date: 'اليوم', title: 'التسجيل والانتساب الرسمي', desc: `تم تسجيل الطالب بنجاح بالملتقى وتحديد الحلقة المستهدفة: ${data.circle || 'حقة حفظ الطليعة'}.`, author: 'شؤون الطلاب' }
    ],
    goals: data.goals || [
      { type: 'hifz', title: 'خطة التحفيظ العامة لمسارك', target: 20, actual: 0, unit: 'صفحة', status: 'pending', lastUpdated: 'اليوم' }
    ],
    interventions: data.interventions || [],
    decisions: data.decisions || [],
    notes: data.notes || [],
    communicationLog: data.communicationLog || [],
    achievements: data.achievements || []
  };

  db.students.unshift(newStudent);
  db.stats.totalStudents = db.students.filter(s => s.status !== 'archived').length;

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'create',
    affectedEntity: `الطالب: ${newStudent.name} (${newStudent.id})`,
    details: `تسجيل طالب جديد للحلقة ${newStudent.circle} تحت إشراف المعلم ${newStudent.teacher}.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.status(201).json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  db.students[index] = { ...db.students[index], ...req.body };
  res.json(db.students[index]);
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  db.students[index].status = 'archived';
  res.json({ message: 'Student archived successfully', student: db.students[index] });
});

// A. Users Endpoints
app.get('/api/users', (req, res) => {
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: `u-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    ...req.body
  } as User;
  
  db.users.push(newUser);
  
  // Update role user stats count
  if (newUser.roleId) {
    const r = db.roles.find(x => x.id === newUser.roleId);
    if (r) r.userCount = (r.userCount || 0) + 1;
  }
  
  // Log operation
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'create',
    affectedEntity: `المستخدم: ${newUser.name}`,
    details: `إضافة مستخدم جديد بالبريد ${newUser.email} وتعيينه بدور ${newUser.type}`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  
  db.stats.totalTeachers = db.users.filter(u => u.type === 'teacher').length;
  db.stats.totalSupervisors = db.users.filter(u => u.type === 'supervisor').length;

  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldUser = db.users[userIndex];
  const updatedUser = {
    ...oldUser,
    ...req.body
  } as User;

  db.users[userIndex] = updatedUser;

  // Log operation
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `المستخدم: ${updatedUser.name}`,
    details: `تعديل بيانات المستخدم السابقة والبريد الإلكتروني ومراجعة صلاحياته.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(updatedUser);
});

app.patch('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'inactive' | 'archived'
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldStatusName = user.status === 'active' ? 'نشط' : user.status === 'inactive' ? 'معطل' : 'مؤرشف';
  const newStatusName = status === 'active' ? 'نشط' : status === 'inactive' ? 'معطل' : 'مؤرشف';
  
  user.status = status;

  // Log operation
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `مستوى عضوية: ${user.name}`,
    details: `تغيير حالة المستخدم من (${oldStatusName}) إلى (${newStatusName}) بقرار من المدير العام.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(user);
});

app.post('/api/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Log operation
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `حساب النفاذ الإلكتروني: ${user.name}`,
    details: `إعادة تعيين كلمة مرور المستخدم وإعطائه صلاحية تسجيل دخول بكلمة مرور مؤقتة وتأكيد آمن.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json({ message: `تمت إعادة تعيين كلمة المرور بنجاح للمستخدم: ${user.name}`, tempPassword: 'HudaPass@1447' });
});


// B. Roles Endpoints
app.get('/api/roles', (req, res) => {
  // Recalculate user counts
  db.roles.forEach(role => {
    role.userCount = db.users.filter(u => u.roleId === role.id && u.status !== 'archived').length;
  });
  res.json(db.roles);
});

app.post('/api/roles', (req, res) => {
  const newRole = {
    id: `role-${Date.now()}`,
    userCount: 0,
    ...req.body
  } as Role;

  db.roles.push(newRole);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'create',
    affectedEntity: `دور هيكلي جديد: ${newRole.name}`,
    details: `إنشاء وتخصيص دور جديد يتضمن عدد (${newRole.permissions.length}) من صلاحيات الإدارة الفنية.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.status(201).json(newRole);
});

app.put('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  const index = db.roles.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  const updatedRole = {
    ...db.roles[index],
    ...req.body
  } as Role;

  db.roles[index] = updatedRole;

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `تعديل دور: ${updatedRole.name}`,
    details: `تحديث مصفوفة الصلاحيات الممنوحة للدور لتصبح (${updatedRole.permissions.length}) صلاحيات معتمدة.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(updatedRole);
});

app.delete('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  const index = db.roles.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  // Check if role is used
  const isUsed = db.users.some(u => u.roleId === id && u.status !== 'archived');
  if (isUsed) {
    return res.status(400).json({ error: 'لا يمكن حذف دور مستخدم من قبل بعض الموظفين النشطين حالياً.' });
  }

  const deletedRole = db.roles[index];
  db.roles.splice(index, 1);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'delete',
    affectedEntity: `دور محذوف: ${deletedRole.name}`,
    details: `حذف الدور نهائياً من سجل الصلاحيات لعدم ارتباطه بأي مستخدم نشط.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json({ message: 'تم حذف الدور بنجاح' });
});


// C. Approvals Endpoints
app.get('/api/approvals', (req, res) => {
  res.json(db.approvals);
});

app.post('/api/approvals', (req, res) => {
  const newReq: ApprovalRequest = {
    id: `ap-${Date.now()}`,
    decisionNumber: `DEC-1447-${Math.floor(100 + Math.random() * 900)}`,
    title: req.body.title || 'طلب اعتماد جديد',
    type: req.body.type || 'admin_decision',
    requesterName: req.body.requesterName || 'الجهة الرافعة المعنية',
    requesterRole: req.body.requesterRole || 'مسؤول القسم',
    department: req.body.department || 'إدارة الشؤون الإدارية',
    details: req.body.details || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    urgency: req.body.urgency || 'normal',
    targetBranch: req.body.targetBranch || 'المجمع الرئيسي',
    targetCircle: req.body.targetCircle,
    affectedEntityCount: req.body.affectedEntityCount || 1,
    estimatedBudget: req.body.estimatedBudget || 0,
    approvedBudget: req.body.estimatedBudget || 0,
    attachments: req.body.attachments || [],
    editableData: req.body.editableData || {},
    auditTrail: [
      {
        id: `at-${Date.now()}`,
        author: req.body.requesterName || 'الجهة الرافعة',
        role: req.body.requesterRole || 'المراسل الرسمي',
        action: 'تقديم الطلب',
        notes: 'تم تقديم طلب الاعتماد رسمياً بمركز الموافقات العليا.',
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.approvals.unshift(newReq);
  db.stats.pendingRequestsCount = db.approvals.filter(a => a.status === 'pending').length;

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'create',
    affectedEntity: `طلب اعتماد جديد: ${newReq.title}`,
    details: `تم إنشاء طلب جديد من قبل (${newReq.requesterName}) برقم معاملة مؤقت (${newReq.id}).`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.status(201).json(newReq);
});

app.patch('/api/approvals/:id', (req, res) => {
  const { id } = req.params;
  const request = db.approvals.find(a => a.id === id);
  if (!request) {
    return res.status(404).json({ error: 'Approval request not found' });
  }

  const {
    status,
    notes,
    decisionReason,
    approvalConditions,
    assignedCommittee,
    approvedBudget,
    editableData,
    clarificationRequests,
    auditEntry
  } = req.body;

  if (status !== undefined) request.status = status;
  if (notes !== undefined) request.notes = notes;
  if (decisionReason !== undefined) request.decisionReason = decisionReason;
  if (approvalConditions !== undefined) request.approvalConditions = approvalConditions;
  if (assignedCommittee !== undefined) request.assignedCommittee = assignedCommittee;
  if (approvedBudget !== undefined) request.approvedBudget = approvedBudget;
  if (editableData !== undefined) {
    request.editableData = { ...request.editableData, ...editableData };
  }
  if (clarificationRequests !== undefined) request.clarificationRequests = clarificationRequests;

  if (status && status !== 'pending') {
    request.decisionDate = new Date().toISOString();
    request.decisionMaker = 'المدير العام / مركز الموافقات العليا';
  }

  if (auditEntry) {
    if (!request.auditTrail) request.auditTrail = [];
    request.auditTrail.push({
      id: `at-${Date.now()}`,
      author: auditEntry.author || 'المدير العام',
      role: auditEntry.role || 'المشرف العام',
      action: auditEntry.action || 'تحديث المعاملة',
      notes: auditEntry.notes || notes || '',
      timestamp: new Date().toISOString()
    });
  }

  let actionText = '';
  switch (status) {
    case 'approved': actionText = 'اعتماد وموافقة نهائية'; break;
    case 'conditional_approved': actionText = 'اعتماد مشروط وضوابط تنفيذية'; break;
    case 'rejected': actionText = 'رفض نهائي مسبّب'; break;
    case 'revision': actionText = 'إعادة للمراجعة والتعديل'; break;
    default: actionText = 'تحديث أو مخاطبة بالمعاملة'; break;
  }

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'approve',
    affectedEntity: `طلب اعتماد: ${request.title}`,
    details: `إجراء على المعاملة (${actionText}) مع تدوين القرارات والمخاطبات الرسمية.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  // Update Pending Approvals Count in Dashboard
  db.stats.pendingRequestsCount = db.approvals.filter(a => a.status === 'pending').length;

  res.json(request);
});


// D. Visual Identity Endpoints
app.get('/api/identity', (req, res) => {
  res.json(db.identity);
});

app.put('/api/identity', (req, res) => {
  db.identity = {
    ...db.identity,
    ...req.body
  };

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `الهوية البصرية للملتقى`,
    details: `تحديث بيانات المؤسسة واسم الملتقى الرسمي وتصميم الترويسة الموحد للتقارير والفاكسات.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(db.identity);
});


// E. School Years Endpoints
app.get('/api/school-years', (req, res) => {
  res.json(db.schoolYears);
});

app.post('/api/school-years', (req, res) => {
  const { yearCode, status, copySettingsFrom, settingsToCopy } = req.body;
  
  // If making this active, deactivate other years
  if (status === 'active') {
    db.schoolYears.forEach(y => {
      if (y.status === 'active') y.status = 'closed';
    });
  }

  const newYear = {
    id: `sy-${Date.now()}`,
    yearCode,
    status,
    createdAt: new Date().toISOString(),
    copiedFromYearId: copySettingsFrom || undefined,
    settingsCopied: settingsToCopy ? {
      plans: !!settingsToCopy.plans,
      curricula: !!settingsToCopy.curricula,
      kpis: !!settingsToCopy.kpis,
      evalSettings: !!settingsToCopy.evalSettings
    } : undefined
  } as SchoolYear;

  db.schoolYears.push(newYear);

  let detailsText = `إنشاء عام دراسي جديد للقرآن الكريم وحفظه باسم ${yearCode}.`;
  if (copySettingsFrom) {
    detailsText += ` تزامناً مع استنساخ البنية التحتية والمناهج ومؤشرات التقييم من العام التوجيهي السابق.`;
  }

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'create',
    affectedEntity: `الجدولة السنوية: ${yearCode}`,
    details: detailsText,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.status(201).json(newYear);
});

app.put('/api/school-years/:id', (req, res) => {
  const { id } = req.params;
  const index = db.schoolYears.findIndex(y => y.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'School year not found' });
  }

  const { status, yearCode } = req.body;

  // Handle exclusivity of active status
  if (status === 'active') {
    db.schoolYears.forEach(y => {
      if (y.id !== id && y.status === 'active') y.status = 'closed';
    });
  }

  db.schoolYears[index] = {
    ...db.schoolYears[index],
    status: status || db.schoolYears[index].status,
    yearCode: yearCode || db.schoolYears[index].yearCode
  };

  const statusMap = { active: 'نشط', closed: 'مغلق', archived: 'مؤرشف' };

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `إدارة العام الدراسي: ${db.schoolYears[index].yearCode}`,
    details: `تحويل خطة توقيت العام الدراسي لتصبح درجته (${statusMap[db.schoolYears[index].status]}) وحظر عمليات التحريك السابقة.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(db.schoolYears[index]);
});


// F. Backup & Restore Endpoints
app.get('/api/backups', (req, res) => {
  res.json(db.backups);
});

app.post('/api/backups', (req, res) => {
  const { note } = req.body;
  
  // Simulate picking stats from the database
  const activeStudents = db.users.filter(u => u.type === 'parent' || u.type === 'teacher').length * 45; // Simulated students formula

  const newBackup = {
    id: `bk-${Date.now()}`,
    fileName: `نسخة_احتياطية_${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}_${Date.now().toString().slice(-4)}.json`,
    version: 'v2.6.2',
    stats: {
      students: activeStudents || 335,
      circles: db.stats.totalCircles,
      teachers: db.stats.totalTeachers,
      supervisors: db.stats.totalSupervisors,
      plans: 154,
      activities: db.stats.activitiesCount,
      achievements: db.stats.achievementsCount,
      graduates: db.stats.graduatesCount,
      reports: 78
    },
    createdAt: new Date().toISOString(),
    backedUpBy: note ? `المدير العام: ${note}` : 'نظام الحوسبة والنسخ الاحتياطي التلقائي'
  } as BackupInfo;

  db.backups.unshift(newBackup);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'backup',
    affectedEntity: `نسخ احتياطي كامل للنظام`,
    details: `أخذ لقطة سريعة وحفظ نسخة مشفرة متكاملة لجميع السجلات والطلاب من حيز التوزيع برمز (${newBackup.id})`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.status(201).json(newBackup);
});

app.post('/api/backups/:id/restore', (req, res) => {
  const { id } = req.params;
  const backup = db.backups.find(b => b.id === id);
  if (!backup) {
    return res.status(404).json({ error: 'Backup not found' });
  }

  // 1. Create a automatic pre-restore backup as per rules
  const preRestoreBackup = {
    id: `bk-auto-${Date.now()}`,
    fileName: `نسخة_أمان_تلقائية_قبل_الاستعادة_${Date.now().toString().slice(-4)}.json`,
    version: 'v2.6.2',
    stats: {
      students: 345,
      circles: db.stats.totalCircles,
      teachers: db.stats.totalTeachers,
      supervisors: db.stats.totalSupervisors,
      plans: 158,
      activities: db.stats.activitiesCount,
      achievements: db.stats.achievementsCount,
      graduates: db.stats.graduatesCount,
      reports: 80
    },
    createdAt: new Date().toISOString(),
    backedUpBy: 'النظام تلقائياً (حماية قبل الاستعادة)'
  } as BackupInfo;

  db.backups.unshift(preRestoreBackup);

  // 2. Perform restoration logic (seed simulation of restored state if values changed)
  // We can increment statistics or adjust counts slightly to show that the database reverted/restored!
  db.stats.totalCircles = backup.stats.circles;
  db.stats.totalTeachers = backup.stats.teachers;
  db.stats.totalSupervisors = backup.stats.supervisors;
  db.stats.graduatesCount = backup.stats.graduates;
  db.stats.activitiesCount = backup.stats.activities;
  db.stats.totalStudents = backup.stats.students;

  // 3. Log the restoration fully inside audit trails
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'restore',
    affectedEntity: `استعادة قاعدة البيانات للوراء`,
    details: `تمت مقارنة واستعادة النسخة (${backup.fileName}) التي تعود لتاريخ ${new Date(backup.createdAt).toLocaleString('ar-SA')}. تم تصنيف قاعدة البيانات وتحديث الجداول السبعة المتأثرة تلقائياً.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json({ 
    message: 'تمت عملية استعادة النظام بأمان كامل وتنشيط النسخة بنجاح.',
    restoredBackup: backup,
    autoBackupCreated: preRestoreBackup
  });
});


// G. Critical Alerts Endpoints
app.get('/api/alerts', (req, res) => {
  res.json(db.alerts);
});

app.patch('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;
  const alert = db.alerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (status !== undefined) alert.status = status;
  if (assignedTo !== undefined) alert.assignedTo = assignedTo;

  let detailsText = `تحديث حالة التنبيه ليكون (${status === 'resolved' ? 'تمت معالجته' : status === 'assigned' ? 'محوّل للفرع' : 'مؤرشف'}).`;
  if (assignedTo) {
    detailsText += ` تم إسناد المتابعة لـ (${assignedTo}).`;
  }

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `مركز الطوارئ والتنبيهات: ${alert.title}`,
    details: detailsText,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  // Recalculate critical alerts count
  db.stats.criticalAlertsCount = db.alerts.filter(a => a.status !== 'archived' && (a.severity === 'critical' || a.severity === 'high')).length;

  res.json(alert);
});


// H. Administrative Decisions Endpoints
app.get('/api/decisions', (req, res) => {
  res.json(db.decisions);
});

app.post('/api/decisions', (req, res) => {
  const { title, type, targetEntity, date, content, attachments, status } = req.body;
  
  const numSuffix = String(db.decisions.length + 10).padStart(3, '0');
  const decisionNumber = `ق-إ-1447-${numSuffix}`;

  const newDecision = {
    id: `dc-${Date.now()}`,
    decisionNumber,
    title,
    type,
    targetEntity,
    date: date || new Date().toISOString().split('T')[0],
    content,
    status: status || 'draft',
    attachments: attachments || [],
    createdAt: new Date().toISOString()
  } as AdminDecision;

  db.decisions.push(newDecision);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'decision',
    affectedEntity: `مركز القرارات: القرار رقم (${decisionNumber})`,
    details: `إصدار قرار رسمي بعنوان (${title}) موجه إلى (${targetEntity}) برتبة تنفيذية (${status === 'approved' ? 'معتمد' : 'مسودة قيد الدراسة'}).`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  // Update Stats
  db.stats.adminDecisionsCount = db.decisions.length;

  res.status(201).json(newDecision);
});

app.put('/api/decisions/:id', (req, res) => {
  const { id } = req.params;
  const index = db.decisions.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Decision not found' });
  }

  const updatedDecision = {
    ...db.decisions[index],
    ...req.body
  } as AdminDecision;

  db.decisions[index] = updatedDecision;

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    username: 'admin',
    operationType: 'update',
    affectedEntity: `تعديل القرار: ${updatedDecision.decisionNumber}`,
    details: `تحديث بيانات القرار الإداري، تعديل مسودة نصه ومتابعة التضمين والحالة التنفيذية الرقمية ومراجعتها.`,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  res.json(updatedDecision);
});


// I. Audit Logs Endpoints
app.get('/api/audit-logs', (req, res) => {
  res.json(db.auditLogs);
});


// J. General Dashboard Stats Endpoint
app.get('/api/stats', (req, res) => {
  const userType = (req.headers['x-user-type'] as string) || (req.query.userType as string);
  if (userType && userType !== 'admin' && userType !== 'branch_manager') {
    return res.status(403).json({ error: 'غير مصرح للوصول إلى بيانات المؤشرات الاستراتيجية (مركز القيادة)' });
  }

  // Recalculate dynamic values
  db.stats.totalTeachers = db.users.filter(u => u.type === 'teacher' && u.status !== 'archived').length;
  db.stats.totalSupervisors = db.users.filter(u => u.type === 'supervisor' && u.status !== 'archived').length;
  db.stats.pendingRequestsCount = db.approvals.filter(a => a.status === 'pending').length;
  db.stats.criticalAlertsCount = db.alerts.filter(a => a.status !== 'archived' && (a.severity === 'critical' || a.severity === 'high')).length;
  db.stats.adminDecisionsCount = db.decisions.filter(d => d.status !== 'archived').length;

  res.json(db.stats);
});

// K. PUBLIC SHELF (الرف العام) ENDPOINTS
app.get('/api/shelf', (req, res) => {
  res.json(db.shelf);
});

app.post('/api/shelf/posts', (req, res) => {
  const newPost = {
    id: `post-${Date.now()}`,
    date: new Date().toLocaleDateString('ar-SA'),
    ...req.body
  };
  db.shelf.posts.unshift(newPost);
  res.status(201).json(newPost);
});

app.delete('/api/shelf/posts/:id', (req, res) => {
  const { id } = req.params;
  db.shelf.posts = db.shelf.posts.filter(p => p.id !== id);
  res.json({ success: true });
});

app.post('/api/shelf/resources', (req, res) => {
  const newRes = {
    id: `res-${Date.now()}`,
    date: new Date().toLocaleDateString('ar-SA'),
    downloadCount: 0,
    ...req.body
  };
  db.shelf.resources.unshift(newRes);
  res.status(201).json(newRes);
});

app.delete('/api/shelf/resources/:id', (req, res) => {
  const { id } = req.params;
  db.shelf.resources = db.shelf.resources.filter(r => r.id !== id);
  res.json({ success: true });
});

// L. CHAT SYSTEM (المحادثات) ENDPOINTS
app.get('/api/conversations', (req, res) => {
  res.json(db.conversations);
});

app.post('/api/conversations', (req, res) => {
  const newConv = req.body;
  if (!newConv.id || !newConv.title) {
    return res.status(400).json({ error: 'Conversation id and title are required' });
  }
  
  const existingIndex = db.conversations.findIndex(c => c.id === newConv.id);
  if (existingIndex >= 0) {
    db.conversations[existingIndex] = { ...db.conversations[existingIndex], ...newConv };
  } else {
    db.conversations.unshift(newConv);
    db.messages[newConv.id] = [];
  }
  res.status(201).json(newConv);
});

app.get('/api/messages/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  res.json(db.messages[conversationId] || []);
});

app.post('/api/messages', (req, res) => {
  const { conversationId, content, senderId, senderName, senderRole } = req.body;
  if (!conversationId || !content) {
    return res.status(400).json({ error: 'conversationId and content are required' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId,
    senderId,
    senderName,
    senderRole,
    content,
    timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    ...req.body
  };

  if (!db.messages[conversationId]) {
    db.messages[conversationId] = [];
  }
  db.messages[conversationId].push(newMsg);

  // Update conversation last message preview
  const conv = db.conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMessage = `${senderName ? senderName.split(' ')[0] : 'مستخدم'}: ${content}`;
    conv.lastMessageTime = newMsg.timestamp;
  }

  res.status(201).json(newMsg);
});

app.put('/api/messages/:conversationId/:messageId', (req, res) => {
  const { conversationId, messageId } = req.params;
  const { content } = req.body;

  const convMessages = db.messages[conversationId];
  if (!convMessages) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const msgIndex = convMessages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  convMessages[msgIndex].content = content;
  convMessages[msgIndex].isEdited = true;
  convMessages[msgIndex].editedAt = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  // Update conversation last message if it was the last message
  if (msgIndex === convMessages.length - 1) {
    const conv = db.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessage = `${convMessages[msgIndex].senderName.split(' ')[0]}: ${content}`;
    }
  }

  res.json(convMessages[msgIndex]);
});

app.delete('/api/messages/:conversationId/:messageId', (req, res) => {
  const { conversationId, messageId } = req.params;

  const convMessages = db.messages[conversationId];
  if (!convMessages) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  db.messages[conversationId] = convMessages.filter(m => m.id !== messageId);

  // Update last message preview
  const remaining = db.messages[conversationId];
  const conv = db.conversations.find(c => c.id === conversationId);
  if (conv) {
    if (remaining.length > 0) {
      const last = remaining[remaining.length - 1];
      conv.lastMessage = `${last.senderName.split(' ')[0]}: ${last.content}`;
      conv.lastMessageTime = last.timestamp;
    } else {
      conv.lastMessage = 'لا توجد رسائل';
      conv.lastMessageTime = '';
    }
  }

  res.json({ success: true });
});

// M. EXAMS AND GRADES SYSTEM (درجات الطلاب) ENDPOINTS
app.get('/api/exams', (req, res) => {
  res.json(db.exams);
});

app.post('/api/exams', (req, res) => {
  const { title, curriculum, circleId, circleName, period, criteria, date, createdById, createdByName } = req.body;
  if (!title || !circleId || !criteria || !Array.isArray(criteria)) {
    return res.status(400).json({ error: 'title, circleId, and criteria are required' });
  }

  const maxTotalScore = criteria.reduce((sum: number, c: any) => sum + (Number(c.maxScore) || 0), 0);

  const newExam = {
    id: `exam-${Date.now()}`,
    title,
    curriculum: curriculum || 'منهج القرآن الكريم',
    circleId,
    circleName: circleName || 'حلقة قرآنية',
    period: period || 'الفصل الأول',
    date: date || new Date().toLocaleDateString('ar-SA'),
    criteria,
    maxTotalScore,
    status: 'draft',
    createdById,
    createdByName
  };

  db.exams.unshift(newExam);
  res.status(201).json(newExam);
});

app.get('/api/grades', (req, res) => {
  res.json(db.gradesRecords);
});

app.get('/api/grades/:examId', (req, res) => {
  const { examId } = req.params;
  const record = db.gradesRecords.find(g => g.examId === examId);
  if (record) {
    res.json(record);
  } else {
    res.json(null);
  }
});

app.post('/api/grades', (req, res) => {
  const { examId, circleId, studentGrades, status, enteredByUserId, enteredByUserName, teacherName, curriculum, period } = req.body;
  
  if (!examId || !studentGrades) {
    return res.status(400).json({ error: 'examId and studentGrades are required' });
  }

  let recordIndex = db.gradesRecords.findIndex(g => g.examId === examId);

  const newRecord = {
    id: recordIndex >= 0 ? db.gradesRecords[recordIndex].id : `grade-rec-${Date.now()}`,
    examId,
    circleId,
    curriculum: curriculum || 'منهج القرأن',
    period: period || 'الفصل الأول',
    teacherName,
    enteredByUserId: enteredByUserId || 'u-user',
    enteredByUserName: enteredByUserName || 'المستخدم',
    enteredDate: new Date().toLocaleDateString('ar-SA'),
    status: status || 'draft',
    studentGrades
  };

  if (recordIndex >= 0) {
    db.gradesRecords[recordIndex] = newRecord;
  } else {
    db.gradesRecords.unshift(newRecord);
  }

  // Also update exam status if approved
  const exam = db.exams.find(e => e.id === examId);
  if (exam && status === 'approved') {
    exam.status = 'approved';
    exam.approvedByName = enteredByUserName;
    exam.approvedDate = new Date().toLocaleDateString('ar-SA');
  }

  res.status(200).json(newRecord);
});

app.post('/api/grades/:examId/approve', (req, res) => {
  const { examId } = req.params;
  const { approvedBy } = req.body;

  const record = db.gradesRecords.find(g => g.examId === examId);
  if (record) {
    record.status = 'approved';
    record.approvedBy = approvedBy || 'المدير العام';
    record.approvedDate = new Date().toLocaleDateString('ar-SA');
  }

  const exam = db.exams.find(e => e.id === examId);
  if (exam) {
    exam.status = 'approved';
    exam.approvedByName = approvedBy || 'المدير العام';
    exam.approvedDate = new Date().toLocaleDateString('ar-SA');
  }

  res.json({ success: true, record, exam });
});

app.get('/api/ratings', (req, res) => {
  res.json(db.ratingSettings);
});

app.post('/api/ratings', (req, res) => {
  if (Array.isArray(req.body)) {
    db.ratingSettings = req.body;
    res.json(db.ratingSettings);
  } else {
    res.status(400).json({ error: 'Array expected' });
  }
});

// ==========================================
// Print Center REST Endpoints
// ==========================================

// Get Documents (Filtered by user role & scope permissions)
app.get('/api/print-center/documents', (req, res) => {
  const userType = (req.headers['x-user-type'] as string) || 'guest';
  const userId = (req.headers['x-user-id'] as string) || '';

  let allowedDocs = [...db.printDocuments];

  if (userType === 'admin') {
    // GM gets all documents
    return res.json(allowedDocs);
  } else if (userType === 'branch_manager' || userType === 'supervisor') {
    // Branch / Supervisor gets system_wide, branch, my_circle, staff, or owned
    allowedDocs = allowedDocs.filter(d => 
      d.dataScope === 'system_wide' || 
      d.dataScope === 'branch' || 
      d.dataScope === 'my_circle' || 
      d.dataScope === 'staff' ||
      d.ownerId === userId
    );
  } else if (userType === 'teacher') {
    // Teacher gets system_wide, my_circle, my_students, resource, publication, or shared
    allowedDocs = allowedDocs.filter(d => 
      d.dataScope === 'system_wide' || 
      d.dataScope === 'my_circle' || 
      d.dataScope === 'my_students' ||
      d.docType === 'resource' ||
      d.docType === 'publication' ||
      d.docType === 'shared' ||
      d.ownerId === userId
    );
  } else if (userType === 'parent' || userType === 'student') {
    // Parent / Student gets system_wide, my_students, student, resource, publication, or shared
    allowedDocs = allowedDocs.filter(d => 
      d.dataScope === 'system_wide' || 
      d.dataScope === 'my_students' || 
      d.docType === 'student' ||
      d.docType === 'award' ||
      d.docType === 'certificate' ||
      d.docType === 'resource' ||
      d.docType === 'shared' ||
      d.ownerId === userId
    );
  }

  res.json(allowedDocs);
});

// Create Document
app.post('/api/print-center/documents', (req, res) => {
  const data = req.body;
  const count = db.printDocuments.length + 1;
  const serialNumber = `DOC-1447-${String(count).padStart(3, '0')}`;

  const newDoc: PrintDocument = {
    id: `doc-${Date.now()}`,
    serialNumber,
    title: data.title || 'مستند جديد',
    docType: data.docType || 'report',
    dataScope: data.dataScope || 'system_wide',
    ownerId: data.ownerId || 'u-1',
    ownerName: data.ownerName || 'المدير العام',
    entityType: data.entityType || 'general',
    entityName: data.entityName || '',
    description: data.description || '',
    date: new Date().toLocaleDateString('ar-SA'),
    allowView: data.allowView ?? true,
    allowPrint: data.allowPrint ?? true,
    allowPdf: data.allowPdf ?? true,
    allowExcel: data.allowExcel ?? false,
    allowShare: data.allowShare ?? true,
    createdAt: new Date().toISOString()
  };

  db.printDocuments.unshift(newDoc);
  res.status(201).json(newDoc);
});

// Update Document
app.put('/api/print-center/documents/:id', (req, res) => {
  const { id } = req.params;
  const index = db.printDocuments.findIndex(d => d.id === id);
  if (index !== -1) {
    db.printDocuments[index] = { ...db.printDocuments[index], ...req.body };
    return res.json(db.printDocuments[index]);
  }
  res.status(404).json({ error: 'Document not found' });
});

// Delete Document
app.delete('/api/print-center/documents/:id', (req, res) => {
  const { id } = req.params;
  db.printDocuments = db.printDocuments.filter(d => d.id !== id);
  res.json({ success: true });
});

// Templates Endpoints
app.get('/api/print-center/templates', (req, res) => {
  res.json(db.printTemplates);
});

app.put('/api/print-center/templates/:id', (req, res) => {
  const { id } = req.params;
  const index = db.printTemplates.findIndex(t => t.id === id);
  if (index !== -1) {
    db.printTemplates[index] = { ...db.printTemplates[index], ...req.body, updatedAt: new Date().toLocaleDateString('ar-SA') };
    return res.json(db.printTemplates[index]);
  }
  res.status(404).json({ error: 'Template not found' });
});

// Share Rule Endpoint
app.post('/api/print-center/share', (req, res) => {
  const shareData: DocumentShareRule = {
    id: `sh-${Date.now()}`,
    docId: req.body.docId,
    sharedByUserId: req.body.sharedByUserId,
    sharedByUserName: req.body.sharedByUserName,
    sharedByUserRole: req.body.sharedByUserRole,
    targetType: req.body.targetType,
    targetName: req.body.targetName,
    permissionLevel: req.body.permissionLevel || 'view_print',
    notes: req.body.notes,
    sharedAt: req.body.sharedAt || new Date().toLocaleDateString('ar-SA')
  };

  db.printShares.unshift(shareData);

  // Attach to document sharedWith array
  const docIndex = db.printDocuments.findIndex(d => d.id === req.body.docId);
  if (docIndex !== -1) {
    if (!db.printDocuments[docIndex].sharedWith) {
      db.printDocuments[docIndex].sharedWith = [];
    }
    db.printDocuments[docIndex].sharedWith.push(shareData);
  }

  res.status(201).json(shareData);
});

// Audit Logs Endpoints
app.get('/api/print-center/audit-logs', (req, res) => {
  res.json(db.printAuditLogs);
});

app.post('/api/print-center/audit-logs', (req, res) => {
  const newLog: PrintAuditRecord = {
    id: `prt-log-${Date.now()}`,
    userId: req.body.userId || 'u-1',
    userName: req.body.userName || 'مستخدم',
    userRole: req.body.userRole || 'عضو',
    docId: req.body.docId,
    docType: req.body.docType,
    docTitle: req.body.docTitle,
    entityName: req.body.entityName || 'عام',
    action: req.body.action,
    copiesCount: req.body.copiesCount || 1,
    timestamp: req.body.timestamp || new Date().toISOString()
  };

  db.printAuditLogs.unshift(newLog);
  res.status(201).json(newLog);
});

// AI Smart Search Intent Analysis Endpoint
app.post('/api/smart-search', async (req, res) => {
  const { query, userRole } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  // Check if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      query,
      aiEnabled: false,
      extractedIntent: {
        category: 'all',
        keywords: [query],
        isComparison: query.includes('قارن') || query.includes('مقارنة')
      }
    });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `أنت محرك تحليل استعلامات البحث الذكي لنظام إدارة الملتقى القرآني.
قم بتحليل استعلام المستخدم باللغة العربية وتحويله إلى كائن JSON دون أي نصوص إضافية:
الاستعلام: "${query}"
دور المستخدم الحالي: "${userRole || 'عام'}"

المطلوب إرجاع كائن JSON بالحقول التالية فقط:
{
  "category": "students" | "teachers_staff" | "circles" | "exams_grades" | "field_visits" | "shelf_files" | "activities_awards" | "decisions_tasks" | "all",
  "isComparison": boolean,
  "comparisonEntities": [string, string] | null,
  "filters": {
    "status": string | null,
    "maxAttendance": number | null,
    "minScore": number | null,
    "maxScore": number | null,
    "timeframe": string | null
  },
  "summaryReasoning": "شرح مختصر باللغة العربية للفهم الذكي للاستعلام"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({
        query,
        aiEnabled: true,
        extractedIntent: parsed
      });
    }

    res.json({
      query,
      aiEnabled: true,
      extractedIntent: {
        category: 'all',
        keywords: [query],
        isComparison: false
      }
    });
  } catch (err: any) {
    console.error('Gemini smart search analysis error:', err);
    res.json({
      query,
      aiEnabled: false,
      extractedIntent: {
        category: 'all',
        keywords: [query],
        isComparison: false
      }
    });
  }
});



// Port and server listening, then Vite mounting
async function startServer() {
  // Vite middleware installation for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving from client dist compilation
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booting on port ${PORT}...`);
    console.log(`Backend API layer initialized successfully.`);
  });
}

startServer();
