/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldVisitRecord } from '../types/fieldVisits';

export const INITIAL_MOCK_FIELD_VISITS: FieldVisitRecord[] = [
  {
    id: 'vis-1',
    visitNumber: 'VIS-1447-001',
    circleId: 'c1',
    circleName: 'حلقة عاصم الكوفي',
    teacherId: 't1',
    teacherName: 'أ. عبد العزيز التركي',
    supervisorId: 'u-3',
    supervisorName: 'الأستاذ محمد بن فهد الدوسري',
    visitDate: '2026-08-05',
    startTime: '16:30',
    endTime: '18:15',
    visitType: 'periodic',
    reason: 'الزيارة الميدانية الدورية للثلاثي الأول ومتابعة إتقان الرواية',
    initialNotes: 'حلقة نشطة جداً بالمسجد الجامع بحضور مبكر للطلاب والمعلم',
    axes: [
      {
        id: 'educational',
        name: 'الجانب التعليمي',
        description: 'جودة التلاوة وتصحيح الأخطاء والتجويد',
        weight: 25,
        score: 96,
        notes: 'الشيخ عبد العزيز متمكن جداً من مخارج الحروف ويستخدم سبورة التجويد بمهارة.',
        strengths: ['إتقان مخارج الحروف الشفوية والحلقية', 'استخدام التكرار الجماعي للمتعثرين'],
        improvements: ['تنبيه الطالب معاذ على ترقيق الراء المكسورة'],
        evidences: [
          {
            id: 'ev-1',
            title: 'سجل التسميع اليومي والمتابعة',
            type: 'system_link',
            systemRef: 'سجل التسميع للحلقة - شهر أغسطس',
            uploadedBy: 'أ. محمد الدوسري',
            uploadedAt: '2026-08-05'
          }
        ]
      },
      {
        id: 'tarbawi',
        name: 'الجانب التربوي',
        description: 'التحفيز وبناء القيم والوقار',
        weight: 20,
        score: 95,
        notes: 'تفاعل ممتاز بين المعلم والطلاب مع توزيع بطاقات التميز في بداية الحلقة.',
        strengths: ['استخدام أسلوب التنافس المتبادل بين المجموعات', 'ربط الآيات بالقيم الأخلاقية'],
        improvements: ['زيادة التحفيز الفردي للطلاب الجدد'],
        evidences: []
      },
      {
        id: 'outcomes',
        name: 'أداء الطلاب ونتائجهم',
        description: 'نسب الحفظ والمراجعة ونتائج الاختبارات',
        weight: 20,
        score: 95,
        notes: 'نسبة الحفظ 96% والمراجعة 95% واختبارات القراءة بدرجات مرتفعة.',
        strengths: ['إتقان ممتاز لمنهج المراجعة الكبرى', 'ارتفاع متوسط درجات الاختبار الموحد'],
        improvements: [],
        evidences: []
      },
      {
        id: 'admin_org',
        name: 'الإدارة والتنظيم',
        description: 'انتظام السجلات ورصد الحضور والغياب',
        weight: 15,
        score: 98,
        notes: 'جميع السجلات الإلكترونية والورقية مكتملة ومحدثة فوراً.',
        strengths: ['الرصد الفوري للحضور عبر التطبيق'],
        improvements: [],
        evidences: []
      },
      {
        id: 'environment',
        name: 'البيئة والتنظيم',
        description: 'ترتيب الحلقة وهدوء المكان والوسائل',
        weight: 10,
        score: 92,
        notes: 'المكان مرتب والإضاءة ممتازة.',
        strengths: ['تنظيم الحلقة على شكل حدوة حصان مناسبة'],
        improvements: ['تأمين لوحة إعلانات مخصصة للوسائل القرأنية'],
        evidences: []
      },
      {
        id: 'initiative',
        name: 'المبادرة والتطوير',
        description: 'ابتكار أنشطة محفزة والتواصل مع أولياء الأمور',
        weight: 10,
        score: 94,
        notes: 'مبادرة "سفير التجويد" مفعلة بين الطلاب بنجاح.',
        strengths: ['التواصل الأسبوعي المباشر مع أولياء الأمور عبر الرسائل'],
        improvements: [],
        evidences: []
      }
    ],
    totalScore: 95.7,
    level: 'excellent',
    systemDataSnapshot: {
      attendanceRate: 96,
      hifzRate: 95,
      revisionRate: 95,
      examAvgScore: 95,
      laggingStudentsCount: 0,
      distinguishedStudentsCount: 6,
      totalStudents: 18,
      activitiesCount: 6,
      badgesCount: 12,
      previousVisitScore: 92,
      previousVisitDate: '2026-05-10',
      previousRecommendationsCount: 2,
      previousRecommendationsImplementedRate: 100
    },
    discrepancyAlert: {
      hasDiscrepancy: false,
      differencePercentage: 0.3,
      message: 'التقييم الميداني متطابق تماماً مع مؤشرات النظام الفعليه.'
    },
    evidenceConfidence: 'high',
    confidenceScorePercentage: 96,
    notes: [
      {
        id: 'n-1',
        text: 'أداء نموذج يوصى بتعميمه على بقية المعلمين الجدد بالفرع.',
        visibility: 'shared_with_teacher',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        createdAt: '2026-08-05'
      },
      {
        id: 'n-2',
        text: 'مرشح للحصول على مكافأة التميز التربوي في الملتقى القادم.',
        visibility: 'admin_only',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        createdAt: '2026-08-05'
      }
    ],
    globalStrengths: [
      'التزام تام بجدول الحلقة ورصد الحضور الفوري',
      'إتقان تدريس أحكام التجويد وتطبيقاتها الشفهية',
      'تفاعل وتنافس إيجابي مرتفع بين الطلاب'
    ],
    globalImprovements: [
      'توفير لوحة إعلانات مخصصة للمصطلحات التجويدية بالمسجد'
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'تنظيم ورشة عمل مصغرة لمعلمي الفرع حول أسلوب سفير التجويد',
        domain: 'المبادرة والتطوير',
        assignedToRole: 'teacher',
        assignedToName: 'أ. عبد العزيز التركي',
        startDate: '2026-08-10',
        dueDate: '2026-08-25',
        priority: 'medium',
        status: 'completed',
        notes: 'تم إعداد المادة العرضية ومشاركتها مع الإدارة',
        completedAt: '2026-08-12'
      }
    ],
    improvementPlan: {
      id: 'plan-1',
      title: 'خطة تعزيز التميز الميداني - حلقة عاصم',
      targetCompletionRate: 100,
      currentCompletionRate: 100,
      recommendations: [],
      lastUpdated: '2026-08-12'
    },
    status: 'approved',
    teacherResponse: {
      id: 'tr-1',
      teacherId: 't1',
      teacherName: 'أ. عبد العزيز التركي',
      notes: 'أشكر الموجه الفني على التوجيهات القيمة ونعدكم باستمرار هذا العطاء بإذن الله.',
      submittedAt: '2026-08-06'
    },
    appeals: [],
    reportAccessRequests: [],
    auditTrail: [
      {
        id: 'aud-1',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        action: 'إنشاء مسودة الزيارة وتعبئة المحاور',
        timestamp: '2026-08-05 17:00'
      },
      {
        id: 'aud-2',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        action: 'اعتماد التقرير النهائي وإرسال الملخص للمعلم للإحاطة',
        timestamp: '2026-08-05 18:30'
      }
    ],
    previousVisitFollowup: {
      previousVisitId: 'prev-00',
      werePreviousRecommendationsResolved: 'fully',
      notes: 'تمت معالجة توصية تنظيم سجل المراجعة الشاملة بنسبة 100%'
    },
    createdAt: '2026-08-05',
    updatedAt: '2026-08-12'
  },
  {
    id: 'vis-2',
    visitNumber: 'VIS-1447-002',
    circleId: 'c5',
    circleName: 'حلقة نافع المدني',
    teacherId: 't5',
    teacherName: 'سليمان بن داود الماجد',
    supervisorId: 'u-3',
    supervisorName: 'الأستاذ محمد بن فهد الدوسري',
    visitDate: '2026-08-08',
    startTime: '16:45',
    endTime: '18:00',
    visitType: 'therapeutic',
    reason: 'زيارة علاجية طارئة بسبب تراجع نسبة الحضور وتأخر خطة الحفظ',
    initialNotes: 'تأخر بدء الحلقة 15 دقيقة، غياب 4 طلاب بدون عذر مسبق',
    axes: [
      {
        id: 'educational',
        name: 'الجانب التعليمي',
        description: 'جودة التلاوة وتصحيح الأخطاء والتجويد',
        weight: 25,
        score: 62,
        notes: 'ضعف في متابعة أخطاء التجويد الشائعة ونقص في درجات التسميع اليومي.',
        strengths: ['حسن معاملة الطلاب وسعة الصدر'],
        improvements: ['التشديد على تطبيق أحكام النون الساكنة والتنوين', 'إسناد المقادير بحسب طاقة كل طالب'],
        evidences: [
          {
            id: 'ev-2',
            title: 'صورة من كشف التسميع والأخطاء المتكررة',
            type: 'image',
            uploadedBy: 'أ. محمد الدوسري',
            uploadedAt: '2026-08-08'
          }
        ]
      },
      {
        id: 'tarbawi',
        name: 'الجانب التربوي',
        description: 'التحفيز وبناء القيم والوقار',
        weight: 20,
        score: 60,
        notes: 'ضعف التحفيز وانعدام المنافسة داخل الحلقة.',
        strengths: [],
        improvements: ['تطبيق جدول نقاط التميز اليومي', 'إنشاء مجموعة تنافسية بالقرآن'],
        evidences: []
      },
      {
        id: 'outcomes',
        name: 'أداء الطلاب ونتائجهم',
        description: 'نسب الحفظ والمراجعة ونتائج الاختبارات',
        weight: 20,
        score: 58,
        notes: 'نسبة الحفظ 62%، والغياب مرتفع (42%)، ووجود 3 طلاب متعثرين بحاجة لخطة إنقاذ.',
        strengths: [],
        improvements: ['إعداد برنامج علاج المكثف للطلاب المتعثرين الثلاثة'],
        evidences: []
      },
      {
        id: 'admin_org',
        name: 'الإدارة والتنظيم',
        description: 'انتظام السجلات ورصد الحضور والغياب',
        weight: 15,
        score: 65,
        notes: 'تأخر في رصد الحضور الإلكتروني لمد ثلاث أيام متتالية.',
        strengths: [],
        improvements: ['رصد الحضور فور وصول الطلاب دون تأجيل'],
        evidences: []
      },
      {
        id: 'environment',
        name: 'البيئة والتنظيم',
        description: 'ترتيب الحلقة وهدوء المكان والوسائل',
        weight: 10,
        score: 60,
        notes: 'تشتت الطلاب أثناء التسميع لعدم تنظيم أدوار الجلوس.',
        strengths: [],
        improvements: ['إعادة ترتيب مقاعد التسميع للحفاظ على الهدوء'],
        evidences: []
      },
      {
        id: 'initiative',
        name: 'المبادرة والتطوير',
        description: 'ابتكار أنشطة محفزة والتواصل مع أولياء الأمور',
        weight: 10,
        score: 55,
        notes: 'عدم التواصل مع أولياء أمور الطلاب الغائبين والمتعثرين.',
        strengths: [],
        improvements: ['الاتصال الهاتفي الفوري بأولياء الأمور الغائبين'],
        evidences: []
      }
    ],
    totalScore: 60.8,
    level: 'needs_improvement',
    systemDataSnapshot: {
      attendanceRate: 58,
      hifzRate: 62,
      revisionRate: 66,
      examAvgScore: 66,
      laggingStudentsCount: 3,
      distinguishedStudentsCount: 0,
      totalStudents: 14,
      activitiesCount: 1,
      badgesCount: 1,
      previousVisitScore: 68,
      previousVisitDate: '2026-04-15',
      previousRecommendationsCount: 3,
      previousRecommendationsImplementedRate: 33
    },
    discrepancyAlert: {
      hasDiscrepancy: true,
      differencePercentage: 2.8,
      message: 'يوجد اتفاق بين التقييم الميداني المنخفض ومؤشرات النظام التي تؤكد الحاجة لتدخل إداري ترشيحي.'
    },
    evidenceConfidence: 'high',
    confidenceScorePercentage: 92,
    notes: [
      {
        id: 'n-21',
        text: 'الحلقة تحتاج إلى مساندة عاجلة من المشرف التربوي لمتابعة الطلاب المتعثرين أولاً بأول.',
        visibility: 'shared_with_teacher',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        createdAt: '2026-08-08'
      },
      {
        id: 'n-22',
        text: 'سجل التزام المعلم منخفض. يوصى بمساءلة إدارية من المدير التنفيذي وتوفير معلم مساند.',
        visibility: 'confidential',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        createdAt: '2026-08-08'
      }
    ],
    globalStrengths: [
      'حسن خلق المعلم وتقبله للتوجيهات والإرشادات الفنية'
    ],
    globalImprovements: [
      'معالجة الالتزام بالوقت وبدء الحلقة في الموعد المحدد (16:30)',
      'الرصد الفوري اليومي للحضور والتواصل مع أسر الغائبين',
      'إقرار خطة استدراكية للطلاب الثلاثة المتعثرين'
    ],
    recommendations: [
      {
        id: 'rec-201',
        title: 'إرسال إنذار غياب وتواصل هاتف أسبوعي لأولياء أمور الطلاب المتعثرين',
        domain: 'المبادرة والتطوير',
        assignedToRole: 'teacher',
        assignedToName: 'سليمان بن داود الماجد',
        startDate: '2026-08-09',
        dueDate: '2026-08-16',
        priority: 'urgent',
        status: 'overdue',
        notes: 'تأخر معلم الحلقة في تقديم السجل الأسبوعي لإنذارات الغياب'
      },
      {
        id: 'rec-202',
        title: 'تخصيص معلم مساند ساعتين أسبوعياً لتقوية معايير الحفظ',
        domain: 'أداء الطلاب ونتائجهم',
        assignedToRole: 'management',
        assignedToName: 'المدير التنفيذي (أ. خالد النفيسي)',
        startDate: '2026-08-10',
        dueDate: '2026-08-20',
        priority: 'high',
        status: 'in_progress',
        notes: 'جاري التنسيق لتكليف معلم بديل للحصص التكثيفية'
      }
    ],
    improvementPlan: {
      id: 'plan-2',
      title: 'خطة العلاج العاجل والإنقاذ - حلقة نافع المدني',
      targetCompletionRate: 100,
      currentCompletionRate: 35,
      recommendations: [],
      lastUpdated: '2026-08-11'
    },
    status: 'approved',
    teacherResponse: {
      id: 'tr-2',
      teacherId: 't5',
      teacherName: 'سليمان بن داود الماجد',
      notes: 'نعاني من ظروف خاصة ببعض الطلاب في الحي وسنقوم بتفعيل الاتصالات الهاتفية بالوالدين هذا الأسبوع.',
      submittedAt: '2026-08-10'
    },
    appeals: [
      {
        id: 'app-1',
        teacherId: 't5',
        teacherName: 'سليمان بن داود الماجد',
        axisOrItem: 'جانب البيئة والتنظيم',
        reason: 'عدم احتساب محاولة تعديل مكان الحلقة للجهة الشرقية من المسجد',
        explanation: 'تم توفير مسند مخصص للمصاحف لكن لم يتم توثيقه في تقرير الموجه.',
        status: 'pending',
        submittedAt: '2026-08-11'
      }
    ],
    reportAccessRequests: [
      {
        id: 'req-1',
        teacherId: 't5',
        teacherName: 'سليمان بن داود الماجد',
        visitId: 'vis-2',
        visitDate: '2026-08-08',
        reason: 'رغبة في الاطلاع على التفاصيل الكاملة للتوصيات والقياسات لإبرازها للجنة المتابعة بالفرع',
        status: 'pending',
        requestedAt: '2026-08-11'
      }
    ],
    auditTrail: [
      {
        id: 'aud-21',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        action: 'إنشاء التقرير الميداني العلاجي',
        timestamp: '2026-08-08 18:30'
      },
      {
        id: 'aud-22',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        action: 'اعتماد التقرير وترفيعه للإدارة التنفيذية لسرعة التدخل',
        timestamp: '2026-08-08 19:15'
      }
    ],
    previousVisitFollowup: {
      previousVisitId: 'prev-02',
      werePreviousRecommendationsResolved: 'not_resolved',
      notes: 'لم يكتمل تنفيذ توصية حصر الطلاب المتعثرين من الزيارة السابقة'
    },
    createdAt: '2026-08-08',
    updatedAt: '2026-08-11'
  },
  {
    id: 'vis-3',
    visitNumber: 'VIS-1447-003',
    circleId: 'c2',
    circleName: 'حلقة قالون الأدائية',
    teacherId: 't2',
    teacherName: 'أ. محمد بن يحيى الغامدي',
    supervisorId: 'u-3',
    supervisorName: 'الأستاذ محمد بن فهد الدوسري',
    visitDate: '2026-08-11',
    startTime: '16:30',
    endTime: '17:45',
    visitType: 'followup',
    reason: 'متابعة أثر تطبيق الخطة المقررة لقياس جودة الترديد الموحد',
    initialNotes: 'حضور انضباطي ومتابعة دقيقة لمجموعات التسميع',
    axes: [
      {
        id: 'educational',
        name: 'الجانب التعليمي',
        description: 'جودة التلاوة وتصحيح الأخطاء والتجويد',
        weight: 25,
        score: 90,
        notes: 'مستوى التسميع جيد جداً، مع اهتمام بتجويد الرد.',
        strengths: ['التزام المعلم بالتسلسل التسميعي الحازم'],
        improvements: ['توسيع وقت المراجعة البعيدة'],
        evidences: []
      },
      {
        id: 'tarbawi',
        name: 'الجانب التربوي',
        description: 'التحفيز وبناء القيم والوقار',
        weight: 20,
        score: 88,
        notes: 'البيئة هادئة ومحفزة على الاستمرار.',
        strengths: ['لوحة النجوم الأسبوعية مفعّلة بانتظام'],
        improvements: [],
        evidences: []
      },
      {
        id: 'outcomes',
        name: 'أداء الطلاب ونتائجهم',
        description: 'نسب الحفظ والمراجعة ونتائج الاختبارات',
        weight: 20,
        score: 89,
        notes: 'نسب الحفظ 88% والمراجعة 88%.',
        strengths: ['تقدم ملحوظ في مستوى الطالب عمر الفوزان'],
        improvements: ['متابعة الطالب ياسر العودة لتجاوز تعثره القريب'],
        evidences: []
      },
      {
        id: 'admin_org',
        name: 'الإدارة والتنظيم',
        description: 'انتظام السجلات ورصد الحضور والغياب',
        weight: 15,
        score: 92,
        notes: 'السجلات محدثة والغياب مرصود بانتظام.',
        strengths: [],
        improvements: [],
        evidences: []
      },
      {
        id: 'environment',
        name: 'البيئة والتنظيم',
        description: 'ترتيب الحلقة وهدوء المكان والوسائل',
        weight: 10,
        score: 90,
        notes: 'المكان مهيأ والهدوء ممتاز.',
        strengths: [],
        improvements: [],
        evidences: []
      },
      {
        id: 'initiative',
        name: 'المبادرة والتطوير',
        description: 'ابتكار أنشطة محفزة والتواصل مع أولياء الأمور',
        weight: 10,
        score: 85,
        notes: 'تواصل شهري جيد مع الأسر.',
        strengths: [],
        improvements: ['تفعيل رسائل تذكيرية أسبوعية'],
        evidences: []
      }
    ],
    totalScore: 89.2,
    level: 'very_good',
    systemDataSnapshot: {
      attendanceRate: 90,
      hifzRate: 88,
      revisionRate: 88,
      examAvgScore: 89,
      laggingStudentsCount: 1,
      distinguishedStudentsCount: 3,
      totalStudents: 15,
      activitiesCount: 4,
      badgesCount: 8,
      previousVisitScore: 86,
      previousVisitDate: '2026-05-02',
      previousRecommendationsCount: 2,
      previousRecommendationsImplementedRate: 100
    },
    discrepancyAlert: {
      hasDiscrepancy: false,
      differencePercentage: 0.2,
      message: 'التقييم الميداني متطابق تماماً مع بيانات النظام.'
    },
    evidenceConfidence: 'high',
    confidenceScorePercentage: 90,
    notes: [
      {
        id: 'n-31',
        text: 'جهد مشكور للمعلم والتزام ملحوظ بالخطة الدراسية.',
        visibility: 'shared_with_teacher',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        createdAt: '2026-08-11'
      }
    ],
    globalStrengths: [
      'انضباط تام بالسجلات والمنهج المقرر',
      'تفعيل ممتاز للوحة التنافس والنجوم الأسبوعية'
    ],
    globalImprovements: [
      'إقرار خطة دعم خاصة للطالب ياسر العودة لتفادي التعثر'
    ],
    recommendations: [
      {
        id: 'rec-301',
        title: 'تخصيص 10 دقائق من وقت الحلقة يومياً للمراجعة التراكمية',
        domain: 'الجانب التعليمي',
        assignedToRole: 'teacher',
        assignedToName: 'أ. محمد بن يحيى الغامدي',
        startDate: '2026-08-12',
        dueDate: '2026-08-22',
        priority: 'medium',
        status: 'in_progress',
        notes: 'جاري التطبيق في حلقات الأسبوع الفعلي'
      }
    ],
    improvementPlan: {
      id: 'plan-3',
      title: 'خطة تعزيز جودة الأداء - حلقة قالون',
      targetCompletionRate: 100,
      currentCompletionRate: 50,
      recommendations: [],
      lastUpdated: '2026-08-11'
    },
    status: 'pending_approval',
    appeals: [],
    reportAccessRequests: [],
    auditTrail: [
      {
        id: 'aud-31',
        authorName: 'أ. محمد الدوسري',
        authorRole: 'الموجه الفني',
        action: 'تعبئة تقرير الزيارة ورفعه للإعتماد الإداري النهائي',
        timestamp: '2026-08-11 18:00'
      }
    ],
    previousVisitFollowup: {
      previousVisitId: 'prev-03',
      werePreviousRecommendationsResolved: 'fully',
      notes: 'تمت معالجة توصيات الزيارة السابقة كاملة'
    },
    createdAt: '2026-08-11',
    updatedAt: '2026-08-11'
  }
];

let inMemoryFieldVisits: FieldVisitRecord[] = [...INITIAL_MOCK_FIELD_VISITS];

export const getStoredFieldVisits = (): FieldVisitRecord[] => {
  return inMemoryFieldVisits;
};

export const saveStoredFieldVisits = (visits: FieldVisitRecord[]) => {
  inMemoryFieldVisits = visits;
};
