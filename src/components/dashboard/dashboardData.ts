/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Circle, Teacher, Graduate, AdminAlert, MonthlyTrend } from './dashboardTypes';

// Comprehensive mock data for 320 students representation
export const mockStudents: Student[] = [
  // Exceeding Students
  { id: 's1', name: 'أحمد بن خالد التميمي', circleId: 'c1', circleName: 'حلقة عاصم الكوفي', branch: 'فرع شمال الرياض', status: 'exceeding', attendanceRate: 98, absenceDays: 1, delayDays: 0, memorizedPages: 120, monthlyAveragePages: 15, revisionRate: 96, testScore: 99, group: 'new', grade: 'الصف الخامس الابتدائي', planComplianceRate: 98, monthlyPlan: 'حفظ سورة البقرة (1-50) + مراجعة جزء عَمَّ' },
  { id: 's2', name: 'عبد الرحمن بن سعد العريفي', circleId: 'c1', circleName: 'حلقة عاصم الكوفي', branch: 'فرع شمال الرياض', status: 'exceeding', attendanceRate: 100, absenceDays: 0, delayDays: 0, memorizedPages: 145, monthlyAveragePages: 18, revisionRate: 98, testScore: 100, group: 'current', grade: 'الصف الثاني المتوسط', planComplianceRate: 100, monthlyPlan: 'حفظ سورة آل عمران كاملة + مراجعة 5 أجزاء' },
  { id: 's3', name: 'سليمان بن عبد الله السيف', circleId: 'c2', circleName: 'حلقة قالون الأدائية', branch: 'فرع غرب الرياض', status: 'exceeding', attendanceRate: 96, absenceDays: 2, delayDays: 1, memorizedPages: 98, monthlyAveragePages: 12, revisionRate: 95, testScore: 97, group: 'current', grade: 'الصف السادس الابتدائي', planComplianceRate: 96, monthlyPlan: 'حفظ سورة النساء (1-80) + مراجعة سورة آل عمران' },
  { id: 's4', name: 'فيصل بن محمد الدوسري', circleId: 'c3', circleName: 'حلقة ابن عامر الشامي', branch: 'فرع جنوب الرياض', status: 'exceeding', attendanceRate: 99, absenceDays: 0, delayDays: 1, memorizedPages: 110, monthlyAveragePages: 14, revisionRate: 97, testScore: 98, group: 'current', grade: 'الصف الأول الثانوي', planComplianceRate: 99, monthlyPlan: 'حفظ سورة المائدة كاملة + مراجعة الأجزاء 1-3' },
  
  // Committed Students
  { id: 's5', name: 'محمد بن علي الرشيد', circleId: 'c1', circleName: 'حلقة عاصم الكوفي', branch: 'فرع شمال الرياض', status: 'committed', attendanceRate: 92, absenceDays: 3, delayDays: 2, memorizedPages: 75, monthlyAveragePages: 10, revisionRate: 88, testScore: 90, group: 'current', grade: 'الصف الأول المتوسط', planComplianceRate: 92, monthlyPlan: 'حفظ سورة الأنعام (1-60) + مراجعة جزء تبارك' },
  { id: 's6', name: 'عمر بن صالح الفوزان', circleId: 'c2', circleName: 'حلقة قالون الأدائية', branch: 'فرع غرب الرياض', status: 'committed', attendanceRate: 94, absenceDays: 2, delayDays: 0, memorizedPages: 82, monthlyAveragePages: 11, revisionRate: 89, testScore: 92, group: 'new', grade: 'الصف الرابع الابتدائي', planComplianceRate: 94, monthlyPlan: 'حفظ سورة الأعراف (1-50) + مراجعة جزء قد سمع' },
  { id: 's7', name: 'بندر بن عبد العزيز الحجيلان', circleId: 'c3', circleName: 'حلقة ابن عامر الشامي', branch: 'فرع جنوب الرياض', status: 'committed', attendanceRate: 91, absenceDays: 4, delayDays: 1, memorizedPages: 70, monthlyAveragePages: 9, revisionRate: 84, testScore: 88, group: 'current', grade: 'الصف الثالث المتوسط', planComplianceRate: 90, monthlyPlan: 'حفظ سورة الأنفال + مراجعة سورة التوبة' },
  { id: 's8', name: 'عبد الله بن فهد القاسم', circleId: 'c4', circleName: 'حلقة الكسائي المبتدئة', branch: 'فرع شمال الرياض', status: 'committed', attendanceRate: 95, absenceDays: 1, delayDays: 3, memorizedPages: 68, monthlyAveragePages: 8, revisionRate: 87, testScore: 89, group: 'current', grade: 'الصف الخامس الابتدائي', planComplianceRate: 93, monthlyPlan: 'حفظ جزء عَمَّ كاملاً + مراجعة أذكار اليوم' },
  
  // Lagging Students
  { id: 's9', name: 'خالد بن يوسف السبيعي', circleId: 'c5', circleName: 'حلقة نافع المدني', branch: 'فرع شرق الرياض', status: 'lagging', attendanceRate: 75, absenceDays: 12, delayDays: 5, memorizedPages: 35, monthlyAveragePages: 4, revisionRate: 62, testScore: 68, group: 'current', grade: 'الصف الثاني المتوسط', planComplianceRate: 65, monthlyPlan: 'خطة علاجية: تثبيت سورة الملك + مراجعة صغار السور' },
  { id: 's10', name: 'زياد بن سليمان الماجد', circleId: 'c5', circleName: 'حلقة نافع المدني', branch: 'فرع شرق الرياض', status: 'lagging', attendanceRate: 72, absenceDays: 15, delayDays: 8, memorizedPages: 30, monthlyAveragePages: 3, revisionRate: 58, testScore: 60, group: 'current', grade: 'الصف الأول المتوسط', planComplianceRate: 60, monthlyPlan: 'خطة تقوية: حفظ صفحتين أسبوعياً + متابعة حضور ولي الأمر' },
  { id: 's11', name: 'سعد بن محمد القحطاني', circleId: 'c5', circleName: 'حلقة نافع المدني', branch: 'فرع شرق الرياض', status: 'lagging', attendanceRate: 81, absenceDays: 8, delayDays: 4, memorizedPages: 42, monthlyAveragePages: 5, revisionRate: 68, testScore: 72, group: 'new', grade: 'الصف السادس الابتدائي', planComplianceRate: 70, monthlyPlan: 'حفظ سورة الواقعة + مراجعة جزء عَمَّ' },
  { id: 's12', name: 'ياسر بن صالح العودة', circleId: 'c2', circleName: 'حلقة قالون الأدائية', branch: 'فرع غرب الرياض', status: 'lagging', attendanceRate: 78, absenceDays: 10, delayDays: 6, memorizedPages: 48, monthlyAveragePages: 6, revisionRate: 71, testScore: 74, group: 'current', grade: 'الصف الثالث المتوسط', planComplianceRate: 72, monthlyPlan: 'حفظ سورة يس + مراجعة سورة الرحمن والواقعة' },
  
  // Graduated
  { id: 's13', name: 'معاذ بن صالح العويد', circleId: 'c1', circleName: 'حلقة عاصم الكوفي', branch: 'فرع شمال الرياض', status: 'committed', attendanceRate: 97, absenceDays: 2, delayDays: 1, memorizedPages: 600, monthlyAveragePages: 22, revisionRate: 99, testScore: 98, group: 'graduated', grade: 'المركاز الجامعي', planComplianceRate: 100, monthlyPlan: 'مراجعة المصحف كاملاً وتثبيت الإجازة بالسند' },
  { id: 's14', name: 'عبد الله بن إبراهيم السبيعي', circleId: 'c3', circleName: 'حلقة ابن عامر الشامي', branch: 'فرع جنوب الرياض', status: 'committed', attendanceRate: 99, absenceDays: 1, delayDays: 0, memorizedPages: 600, monthlyAveragePages: 24, revisionRate: 100, testScore: 100, group: 'graduated', grade: 'المركاز الجامعي', planComplianceRate: 100, monthlyPlan: 'مراجعة المصحف كاملاً وإتقان القراءات العشر' }
];

export const mockCircles: Circle[] = [
  {
    id: 'c1',
    name: 'حلقة عاصم الكوفي',
    teacherId: 't1',
    teacherName: 'عبد العزيز التركي',
    studentsCount: 18,
    activeStudentsCount: 18,
    attendanceRate: 96,
    planComplianceRate: 94,
    memorizationPages: 1350,
    revisionRate: 95,
    avgTestScore: 95,
    supervisorRating: 97,
    overallScore: 95.8,
    activitiesCount: 6,
    status: 'excellent',
    priorityLabel: 'ممتاز جداً'
  },
  {
    id: 'c2',
    name: 'حلقة قالون الأدائية',
    teacherId: 't2',
    teacherName: 'محمد بن يحيى الغامدي',
    studentsCount: 15,
    activeStudentsCount: 14,
    attendanceRate: 90,
    planComplianceRate: 88,
    memorizationPages: 960,
    revisionRate: 88,
    avgTestScore: 89,
    supervisorRating: 90,
    overallScore: 89.2,
    activitiesCount: 4,
    status: 'good',
    priorityLabel: 'ممتاز'
  },
  {
    id: 'c3',
    name: 'حلقة ابن عامر الشامي',
    teacherId: 't3',
    teacherName: 'صالح بن سليمان العويد',
    studentsCount: 20,
    activeStudentsCount: 20,
    attendanceRate: 94,
    planComplianceRate: 91,
    memorizationPages: 1210,
    revisionRate: 91,
    avgTestScore: 91,
    supervisorRating: 94,
    overallScore: 92.6,
    activitiesCount: 5,
    status: 'excellent',
    priorityLabel: 'ممتاز مرتفع'
  },
  {
    id: 'c4',
    name: 'حلقة الكسائي المبتدئة',
    teacherId: 't4',
    teacherName: 'فهد بن صالح القحطاني',
    studentsCount: 16,
    activeStudentsCount: 15,
    attendanceRate: 88,
    planComplianceRate: 84,
    memorizationPages: 780,
    revisionRate: 84,
    avgTestScore: 84,
    supervisorRating: 85,
    overallScore: 85.2,
    activitiesCount: 3,
    status: 'good',
    priorityLabel: 'جيد جداً'
  },
  {
    id: 'c5',
    name: 'حلقة نافع المدني',
    teacherId: 't5',
    teacherName: 'سليمان بن داود الماجد',
    studentsCount: 14,
    activeStudentsCount: 11,
    attendanceRate: 58,
    planComplianceRate: 62,
    memorizationPages: 390,
    revisionRate: 66,
    avgTestScore: 66,
    supervisorRating: 60,
    overallScore: 61.2,
    activitiesCount: 1,
    status: 'lagging',
    priorityLabel: 'يحتاج رعاية عاجلة'
  }
];

export const mockTeachers: Teacher[] = [
  { id: 't1', name: 'أ. عبد العزيز التركي', rating: 4.9, studentAvgScore: 95, planCompliance: 94, attendanceRate: 98, supervisorRating: 97, status: 'outstanding' },
  { id: 't2', name: 'أ. محمد بن يحيى الغامدي', rating: 4.5, studentAvgScore: 89, planCompliance: 88, attendanceRate: 92, supervisorRating: 90, status: 'stable' },
  { id: 't3', name: 'أ. صالح بن سليمان العويد', rating: 4.8, studentAvgScore: 91, planCompliance: 91, attendanceRate: 96, supervisorRating: 94, status: 'outstanding' },
  { id: 't4', name: 'أ. فهد بن صالح القحطاني', rating: 4.2, studentAvgScore: 84, planCompliance: 84, attendanceRate: 91, supervisorRating: 85, status: 'stable' },
  { id: 't5', name: 'أ. سليمان بن داود الماجد', rating: 2.8, studentAvgScore: 66, planCompliance: 62, attendanceRate: 68, supervisorRating: 60, status: 'needs_support' }
];

export const mockGraduates: Graduate[] = [
  { id: 'g1', name: 'عبد المحسن بن مبارك الدوسري', year: '1446', isQuranMemorizer: true, worksInQuranicEdu: true, participatedInAlumniActivities: true },
  { id: 'g2', name: 'نايف بن محمد السبيعي', year: '1446', isQuranMemorizer: true, worksInQuranicEdu: false, participatedInAlumniActivities: true },
  { id: 'g3', name: 'رياض بن عبد العزيز الموسى', year: '1445', isQuranMemorizer: true, worksInQuranicEdu: true, participatedInAlumniActivities: false },
  { id: 'g4', name: 'عبد الرحمن بن خالد السيف', year: '1445', isQuranMemorizer: true, worksInQuranicEdu: true, participatedInAlumniActivities: true },
  { id: 'g5', name: 'سلطان بن فهد التميمي', year: '1444', isQuranMemorizer: true, worksInQuranicEdu: false, participatedInAlumniActivities: false },
  { id: 'g6', name: 'بدر بن يوسف السلمان', year: '1444', isQuranMemorizer: true, worksInQuranicEdu: true, participatedInAlumniActivities: true }
];

export const mockAlerts: AdminAlert[] = [
  { id: 'a1', title: 'تجاوز حد الغياب في حلقة نافع المدني للطلاب زياد الماجد وخالد السبيعي', category: 'critical', details: 'تغيب الطلاب لأكثر من 12 يوماً متواصلة هذا الشهر دون عذر رسمي من ولي الأمر، مما يتطلب إشعاراً عاجلاً.', date: '1447/12/10' },
  { id: 'a2', title: 'تأخر الالتزام بخطط التسميع والحفظ لـ 5 طلاب بفرع شرق الرياض', category: 'high', details: 'رصد تراجع بنسبة الالتزام عن المحور المستهدف بفارق 3 أسابيع في المقرر السنوي للحفظ والمراجعة.', date: '1447/12/12' },
  { id: 'a3', title: 'انخفاض معايير أداء حلقة نافع المدني ومعدل الحضور العام', category: 'high', details: 'سجلت الحلقة حضوراً بمعدل 58% فقط مما يضعها في النطاق الحرج بالملتقى والمتابعة الميدانية.', date: '1447/12/15' },
  { id: 'a4', title: 'مدرس حلقة نافع المدني لم يرفع التقارير الأسبوعية للدروس', category: 'medium', details: 'تأخر المحفظ أ. سليمان الماجد عن تسليم خطط تقويم الحفظ للطلاب للأسبوعين الماضيين والمتابعة التقنية.', date: '1447/12/18' },
  { id: 'a5', title: 'مقررات الدراسات التجويدية لفرع الجنوب متأخرة عن الخطة', category: 'medium', details: 'معدل التقدم الفعلي في مقرر علم الآلة وتحفة الأطفال متأخر برصيد حلقة واحدة عن المدة الزمنية المخططة.', date: '1447/12/20' },
  { id: 'a6', title: 'أنشطة اللقاء الرياضي وقوافل الحفاظ تنتظر الاعتماد المالي', category: 'low', details: 'تم اقتراح خطة النشاط الميداني المشترك للحلقات الممتازة بانتظار مصادقة المدير العام بملتقى الهدى.', date: '1447/12/21' }
];

export const mockMonthlyTrends: MonthlyTrend[] = [
  { month: 'محرم', attendanceRate: 88, planCompliance: 80, memorizedPages: 1100, avgTestScore: 82, graduatesCount: 4 },
  { month: 'صفر', attendanceRate: 90, planCompliance: 82, memorizedPages: 1250, avgTestScore: 84, graduatesCount: 3 },
  { month: 'ربيع أول', attendanceRate: 91, planCompliance: 84, memorizedPages: 1300, avgTestScore: 85, graduatesCount: 5 },
  { month: 'ربيع ثان', attendanceRate: 89, planCompliance: 83, memorizedPages: 1180, avgTestScore: 83, graduatesCount: 2 },
  { month: 'جمادى أول', attendanceRate: 92, planCompliance: 85, memorizedPages: 1400, avgTestScore: 86, graduatesCount: 6 },
  { month: 'جمادى ثان', attendanceRate: 93, planCompliance: 87, memorizedPages: 1550, avgTestScore: 88, graduatesCount: 4 },
  { month: 'رجب', attendanceRate: 85, planCompliance: 76, memorizedPages: 980, avgTestScore: 78, graduatesCount: 1 },
  { month: 'شعبان', attendanceRate: 91, planCompliance: 86, memorizedPages: 1450, avgTestScore: 87, graduatesCount: 5 },
  { month: 'رمضان', attendanceRate: 97, planCompliance: 96, memorizedPages: 2600, avgTestScore: 94, graduatesCount: 14 },
  { month: 'شوال', attendanceRate: 78, planCompliance: 72, memorizedPages: 750, avgTestScore: 80, graduatesCount: 2 },
  { month: 'ذو القعدة', attendanceRate: 92, planCompliance: 89, memorizedPages: 1650, avgTestScore: 90, graduatesCount: 6 },
  { month: 'ذو الحجة', attendanceRate: 84, planCompliance: 78, memorizedPages: 1050, avgTestScore: 81, graduatesCount: 5 }
];

// Academic Year Comparisons dataset (1448 vs 1449)
export const academicYearComp = {
  y1448: {
    yearLabel: '1448 هـ',
    totalStudents: 285,
    attendanceRate: 86,
    planCompliance: 81,
    memorizedPagesTotal: 15400,
    avgTestScore: 83,
    graduates: 42,
    executedActivities: 32,
    revisionRate: 80,
  },
  y1449: {
    yearLabel: '1449 هـ (الحالي)',
    totalStudents: 320,
    attendanceRate: 91,
    planCompliance: 87,
    memorizedPagesTotal: 17800,
    avgTestScore: 88,
    graduates: 58,
    executedActivities: 45,
    revisionRate: 86,
  }
};
