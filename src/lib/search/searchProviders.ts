import { SearchResultItem, SearchResultCategory } from './searchTypes';
import { 
  getOrCreateCircleCodeRecord, 
  assignStudentToCircle, 
  assignStaffToCircle,
  generateExamId,
  generateActivityId,
  generateBadgeId,
  generateTaskId,
  generateFileId,
  generateReportId
} from '../numberingSystem';

/**
 * Global Search Data Provider Registry
 * Aggregates and converts system entity data into normalized SearchResultItems.
 */

// 1. Students Indexer
export function getStudentSearchItems(studentsList: any[] = []): SearchResultItem[] {
  if (!Array.isArray(studentsList) || studentsList.length === 0) return [];
  return studentsList.map((rawStudent, idx) => {
    const student = assignStudentToCircle(rawStudent, rawStudent.circleName || rawStudent.circle || 'حلقة قرآنية', idx + 1);
    const isExceeding = student.status === 'exceeding';
    const isCommitted = student.status === 'committed';
    const isLagging = student.status === 'lagging';

    const badgeLabel = isExceeding ? 'طالب متفوق' : isCommitted ? 'طالب منتظم' : 'طالب متعثر';
    const badgeColor = isExceeding ? 'emerald' : isCommitted ? 'indigo' : 'rose';

    return {
      id: `student-${student.id}`,
      title: `${student.name} | ${student.organizationalId}`,
      subtitle: `الرقم الداخلي: ${student.permanentId} • ${student.circleName || student.circle || ''} (${student.circleCode})`,
      category: 'students',
      categoryLabel: 'الطلاب',
      badge: `${badgeLabel} • ${student.organizationalId}`,
      badgeColor,
      keyMetrics: [
        { label: 'الرمز التنظيمي', value: student.organizationalId },
        { label: 'المعرف الثابت', value: student.permanentId },
        { label: 'رمز الحلقة', value: student.circleCode },
        { label: 'المحفوظ', value: `${student.memorizedPages || 0} ص` },
        { label: 'إنجاز الخطة', value: `${student.planComplianceRate || student.attendanceRate || 0}%`, color: isLagging ? 'text-rose-600' : 'text-emerald-600' },
      ],
      snippet: `الاسم: ${student.name} | المعرف الداخلي الثابت: ${student.permanentId} | الرقم التنظيمي للحلقة: ${student.organizationalId} | الحلقة: ${student.circleName || student.circle || ''}`,
      relevanceScore: 0,
      actionTab: 'students',
      actionParams: {
        entityId: student.id,
        circleId: student.circleId,
        filterText: student.name
      },
      rawEntity: student,
      allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student']
    };
  });
}

// 2. Circles Indexer
export function getCircleSearchItems(circlesList: any[] = []): SearchResultItem[] {
  if (!Array.isArray(circlesList) || circlesList.length === 0) return [];
  return circlesList.map(rawCircle => {
    const circleRecord = getOrCreateCircleCodeRecord(rawCircle.id || rawCircle.name, rawCircle.name);
    const branch = (rawCircle as any).branch || 'الفرع الرئيسي';
    const regCount = (rawCircle as any).regularStudentsCount || rawCircle.activeStudentsCount || rawCircle.studentsCount || 0;

    return {
      id: `circle-${rawCircle.id}`,
      title: `${rawCircle.name} | ${circleRecord.circleCode}`,
      subtitle: `رمز الحلقة: ${circleRecord.circleCode} • ${branch} • المعلم: ${rawCircle.teacherName || 'كادر تعليمي'}`,
      category: 'circles',
      categoryLabel: 'الحلقات',
      badge: `${circleRecord.circleCode} • ${rawCircle.priorityLabel || 'حلقة قرآنية'}`,
      badgeColor: (rawCircle.overallScore || 0) >= 90 ? 'emerald' : (rawCircle.overallScore || 0) >= 80 ? 'indigo' : 'amber',
      keyMetrics: [
        { label: 'رمز الحلقة', value: circleRecord.circleCode },
        { label: 'الطلاب', value: `${regCount} طالب` },
        { label: 'التقييم العام', value: `${rawCircle.overallScore || 0}%` },
        { label: 'إنجاز الخطة', value: `${rawCircle.planComplianceRate || 0}%` },
      ],
      snippet: `رمز الحلقة التنظيمي: ${circleRecord.circleCode} | الاسم: ${rawCircle.name} | المعلم: ${rawCircle.teacherName || ''} | عدد الطلاب: ${regCount}`,
      relevanceScore: 0,
      actionTab: 'circles',
      actionParams: {
        circleId: rawCircle.id,
        filterText: rawCircle.name
      },
      rawEntity: { ...rawCircle, circleCode: circleRecord.circleCode },
      allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student']
    };
  });
}

// 3. Teachers & Staff Indexer
export function getTeachersStaffSearchItems(demoUsers: any[] = []): SearchResultItem[] {
  const staffItems: SearchResultItem[] = [];

  if (Array.isArray(demoUsers)) {
    demoUsers.forEach((rawU, idx) => {
      const u = assignStaffToCircle(rawU, rawU.circleName, idx + 1);
      const isTeacher = u.type === 'teacher';
      const isSupervisor = u.type === 'supervisor';
      const isAdmin = u.type === 'admin' || u.type === 'branch_manager';

      if (isTeacher || isSupervisor || isAdmin) {
        staffItems.push({
          id: `user-${u.id}`,
          title: u.organizationalId ? `${u.name} | ${u.organizationalId}` : `${u.name} | ${u.permanentId}`,
          subtitle: `المعرف الداخلي: ${u.permanentId} ${u.organizationalId ? `• التنظيمي: ${u.organizationalId}` : ''} • ${u.roleName}`,
          category: 'teachers_staff',
          categoryLabel: 'الكادر والمعلمون',
          badge: u.organizationalId || u.permanentId,
          badgeColor: isTeacher ? 'indigo' : isSupervisor ? 'purple' : 'emerald',
          keyMetrics: [
            { label: 'المعرف الثابت', value: u.permanentId },
            { label: 'الرمز التنظيمي', value: u.organizationalId || 'إداري عام' },
            { label: 'الرتبة', value: u.roleName || 'كادر تعليمي' },
          ],
          snippet: `الاسم: ${u.name} | المعرف الداخلي الثابت: ${u.permanentId} ${u.organizationalId ? `| الرقم التنظيمي: ${u.organizationalId}` : ''} | الرتبة: ${u.roleName}`,
          relevanceScore: 0,
          actionTab: isTeacher ? 'teachers' : isAdmin ? 'users' : 'field-visits',
          actionParams: { entityId: u.id },
          rawEntity: u,
          allowedUserTypes: isAdmin ? ['admin', 'branch_manager'] : ['admin', 'branch_manager', 'supervisor', 'teacher']
        });
      }
    });
  }

  return staffItems;
}

// 4. Field Visits Indexer
export function getFieldVisitSearchItems(visitsList: any[] = []): SearchResultItem[] {
  if (!Array.isArray(visitsList) || visitsList.length === 0) return [];
  return visitsList.map(visit => {
    return {
      id: `visit-${visit.id}`,
      title: `زيارة ميدانية: ${visit.circleName || visit.halaqa?.name || 'حلقة'}`,
      subtitle: `الموجه: ${visit.supervisorName || visit.supervisor?.user?.displayName || ''} • التاريخ: ${visit.visitDate || visit.scheduledDate || ''} (رقم ${visit.visitNumber || ''})`,
      category: 'field_visits',
      categoryLabel: 'الزيارات الميدانية',
      badge: `زيارة ميدانية`,
      badgeColor: 'purple',
      keyMetrics: [
        { label: 'رقم الزيارة', value: visit.visitNumber || visit.id },
        { label: 'نوع الزيارة', value: visit.visitType === 'periodic' ? 'دورية' : 'توجيهية' },
        { label: 'المعلم', value: visit.teacherName || visit.teacher?.user?.displayName || '' },
        { label: 'التاريخ', value: visit.visitDate || visit.scheduledDate || '' }
      ],
      snippet: `السبب والملاحظات: ${visit.reason || ''} - ${visit.initialNotes || visit.summary || ''}`,
      relevanceScore: 0,
      actionTab: 'field-visits',
      actionParams: { entityId: visit.id, circleId: visit.circleId || visit.halaqaId },
      rawEntity: visit,
      allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher']
    };
  });
}

// 5. Exams & Grades Indexer
export function getExamGradeSearchItems(examsData: any[]): SearchResultItem[] {
  const exams = Array.isArray(examsData) && examsData.length > 0 ? examsData : [
    {
      id: 'exam-1',
      title: 'اختبار محرم المجمع - سورة البقرة',
      curriculum: 'منهج الحفظ والمراجعة المكثف',
      circleName: 'حلقة عاصم الكوفي',
      period: 'الفصل الأول 1447هـ',
      date: '1447/01/15 هـ',
      status: 'approved',
      maxTotalScore: 100
    },
    {
      id: 'exam-2',
      title: 'اختبار صفار الشهري - الأجزاء الثلاثة الأولى',
      curriculum: 'منهج الإتقان والتثبيت',
      circleName: 'حلقة قالون الأدائية',
      period: 'الفصل الأول 1447هـ',
      date: '1447/02/20 هـ',
      status: 'approved',
      maxTotalScore: 100
    }
  ];

  return exams.map(exam => ({
    id: `exam-${exam.id}`,
    title: exam.title,
    subtitle: `${exam.circleName} • المنهج: ${exam.curriculum}`,
    category: 'exams_grades',
    categoryLabel: 'الدرجات والاختبارات',
    badge: exam.status === 'approved' ? 'اختبار معتمد' : 'مسودة اختبار',
    badgeColor: exam.status === 'approved' ? 'emerald' : 'amber',
    keyMetrics: [
      { label: 'الفترة', value: exam.period },
      { label: 'التاريخ', value: exam.date },
      { label: 'الدرجة الكلية', value: `${exam.maxTotalScore} درجة` }
    ],
    snippet: `اختبار درجات الأجزاء والتلاوة والتجويد للحلقة القرأنية: ${exam.circleName}`,
    relevanceScore: 0,
    actionTab: 'grades',
    actionParams: { entityId: exam.id },
    rawEntity: exam,
    allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student']
  }));
}

// 6. Shelf Files & Resources Indexer
export function getShelfFilesSearchItems(shelfData: any): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // Default shelf materials
  const sampleResources = [
    {
      id: 'res-1',
      title: 'الخطة التشغيلية والتربوية لشهر رمضان المبارك 1447هـ',
      description: 'جدول دراسي مكثف لختمات القران وتثبيت المراجعة وحصص التفسير التفاعلي.',
      category: 'خطط ودلائل',
      author: 'الإدارة العامة للملتقى',
      date: '2026-08-01',
      tags: ['رمضان', 'خطة', 'تثبيت', 'مراجعة']
    },
    {
      id: 'res-2',
      title: 'دليل أحكام التجويد الميسر لحلقات المبتدئين',
      description: 'ملف تعليمي مصور يشرح مخارج الحروف وأحكام النون الساكنة والتنوين والمدود.',
      category: 'كتب ومصادر',
      author: 'اللجنة العلمية بالملتقى',
      date: '2026-07-15',
      tags: ['تجويد', 'مخارج', 'مبتدئين', 'دليل']
    },
    {
      id: 'res-3',
      title: 'جدول التسميع والمراجعة السنوية للحفاظ والخاتمين',
      description: 'منهجية توزيع الأجزاء اليومية للطلاب الخاتمين مع النماذج التقييمية.',
      category: 'مناهج قرآنية',
      author: 'الموجه التربوي',
      date: '2026-08-10',
      tags: ['خاتمين', 'مراجعة', 'جدول', 'حفظ']
    }
  ];

  sampleResources.forEach(res => {
    items.push({
      id: `shelf-${res.id}`,
      title: res.title,
      subtitle: `${res.category} • المصدر: ${res.author}`,
      category: 'shelf_files',
      categoryLabel: 'الملفات والمصادر',
      badge: res.category,
      badgeColor: 'sky',
      keyMetrics: [
        { label: 'التصنيف', value: res.category },
        { label: 'التاريخ', value: res.date },
        { label: 'الناشر', value: res.author }
      ],
      snippet: `${res.description} [الكلمات المفتاحية: ${res.tags.join(', ')}]`,
      relevanceScore: 0,
      actionTab: 'shelf',
      actionParams: { entityId: res.id, filterText: res.title },
      rawEntity: res,
      allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student']
    });
  });

  return items;
}

// 7. Activities & Awards Indexer
export function getActivityAwardSearchItems(): SearchResultItem[] {
  const items = [
    {
      id: 'act-1',
      title: 'مسابقة الماهر بالقرآن الكريم السنوية',
      type: 'مسابقة قرآنية',
      desc: 'تنافس في حفظ الأجزاء الخمسة الأخيرة والتلاوة الندية بين كافة فروع الملتقى.',
      points: 500,
      badge: 'وسام الماهر'
    },
    {
      id: 'act-2',
      title: 'رحلة المتميزين والطلاب المتفوقين',
      type: 'نشاط تربوي',
      desc: 'رحلة تحفيزية للطلاب الحاصلين على نسبة إنجاز أعلى من 95% في الخطة.',
      points: 300,
      badge: 'وسام التفوق'
    },
    {
      id: 'act-3',
      title: 'وسام المواظبة والانضباط اليومي',
      type: 'شارة تميز',
      desc: 'شارة تمنح للطالب المنتظم دون أي غياب طوال الشهر الدراسي.',
      points: 200,
      badge: 'وسام الانضباط'
    }
  ];

  return items.map(act => ({
    id: `act-${act.id}`,
    title: act.title,
    subtitle: `${act.type} • الشارة: ${act.badge}`,
    category: 'activities_awards',
    categoryLabel: 'الأنشطة والأوسمة',
    badge: act.badge,
    badgeColor: 'amber',
    keyMetrics: [
      { label: 'النوع', value: act.type },
      { label: 'نقاط التميز', value: `+${act.points} نقطة` }
    ],
    snippet: act.desc,
    relevanceScore: 0,
    actionTab: 'activities-awards',
    actionParams: { entityId: act.id },
    rawEntity: act,
    allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student']
  }));
}

// 8. Administrative Decisions, Alerts & Tasks Indexer
export function getDecisionsTasksSearchItems(decisionsData: any[], alertsData: any[]): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  if (Array.isArray(decisionsData)) {
    decisionsData.forEach(d => {
      items.push({
        id: `decision-${d.id}`,
        title: d.title || 'قرار إداري رسمي',
        subtitle: `التاريخ: ${d.date || '1447هـ'} • رقم القرار: ${d.decisionNumber || 'DEC-1447'}`,
        category: 'decisions_tasks',
        categoryLabel: 'القرارات والمهام',
        badge: 'قرار إداري',
        badgeColor: 'rose',
        keyMetrics: [
          { label: 'الأولوية', value: d.priority || 'عالية' },
          { label: 'التاريخ', value: d.date || 'اليوم' }
        ],
        snippet: d.details || d.description || 'قرار رسمي صادر عن الإدارة العامة للملتقى القرآني.',
        relevanceScore: 0,
        actionTab: 'governance-center',
        actionParams: { entityId: d.id },
        rawEntity: d,
        allowedUserTypes: ['admin', 'branch_manager'], // Confidential decision
        confidentialityLevel: 'restricted'
      });
    });
  }

  if (Array.isArray(alertsData)) {
    alertsData.forEach(a => {
      items.push({
        id: `alert-${a.id}`,
        title: a.title || 'تنبيه متابعة دراسية',
        subtitle: `الفرع: ${a.branch || 'شمال الرياض'} • الحالة: ${a.status || 'نشط'}`,
        category: 'decisions_tasks',
        categoryLabel: 'القرارات والمهام',
        badge: 'تنبيه إنذار مبكر',
        badgeColor: 'amber',
        keyMetrics: [
          { label: 'مستوى التنبيه', value: a.level || 'متوسط' },
          { label: 'الحالة', value: a.status || 'قيد المتابعة' }
        ],
        snippet: a.message || a.details || 'تنبيه استباقي لتتبع انخفاض نسب الحفظ والغياب بالحلقة.',
        relevanceScore: 0,
        actionTab: 'tracking-alerts',
        actionParams: { entityId: a.id },
        rawEntity: a,
        allowedUserTypes: ['admin', 'branch_manager', 'supervisor', 'teacher']
      });
    });
  }

  return items;
}
