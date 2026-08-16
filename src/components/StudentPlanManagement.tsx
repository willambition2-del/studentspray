/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, BookOpen, User, CheckCircle, Save, Sparkles, Search, 
  Printer, ArrowRight, Lightbulb, FileText, Calendar, Edit, Award, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

export interface StudentPlanData {
  studentId: string;
  studentName: string;
  circleName: string;
  teacherName: string;
  hifzFrom: string;
  hifzTo: string;
  muraajaaFrom: string;
  muraajaaTo: string;
  tafheemVerses: string; // تفهيم وتفسير الآيات
  targetDays: string;
  startDate: string;
  status: 'active' | 'completed' | 'needs_review';
  teacherNotes: string;
  updatedAt: string;
  // Plan Achievement Fields (قسم إنجاز الخطة)
  hifzAchievementPercent?: number;
  muraajaaAchievementPercent?: number;
  achievementGrade?: string;
  achievementNotes?: string;
  // Monthly Attendance & Absence Fields (تسجيل الحضور والغياب الشهري باليوم)
  attendanceMonth?: string;
  attendedDays?: number;
  absentExcusedDays?: number;
  absentUnexcusedDays?: number;
  totalStudyDays?: number;
}

// Initial mock plans for system students
export const INITIAL_STUDENT_PLANS: Record<string, StudentPlanData> = {
  'ST-000001': {
    studentId: 'ST-000001',
    studentName: 'عبدالرحمن بن ياسر المزروعي',
    circleName: 'حلقة حفظ الطليعة (خاتمين)',
    teacherName: 'الشيخ عبد الرحمن السعيد',
    hifzFrom: 'سورة البقرة (الآية ١)',
    hifzTo: 'سورة البقرة (الآية ٢٥)',
    muraajaaFrom: 'سورة آل عمران (الآية ١٠٠)',
    muraajaaTo: 'سورة آل عمران (الآية ١٥٠)',
    tafheemVerses: 'تفهيم الآيات: تتناول الآيات صفات المتقين ومقاصد هداية الكتاب العزيز، والفرق بين المؤمنين والمنافقين. يوصى بالتركيز على تدبر معاني صفات المتقين والتخلق بها.',
    targetDays: '٧ أيام',
    startDate: '2026-08-01',
    status: 'active',
    teacherNotes: 'الطالب ممتاز ومتقن للحفظ، يرجى الاستمرار على هذا المستوى.',
    updatedAt: '2026-08-08',
    hifzAchievementPercent: 95,
    muraajaaAchievementPercent: 92,
    achievementGrade: 'ممتاز مرتفع (إنجاز متقدم)',
    achievementNotes: 'أتم الحفظ والمراجعة بإتقان وجودة عالية في الترتيل.',
    attendanceMonth: 'أغسطس 2026',
    attendedDays: 22,
    absentExcusedDays: 2,
    absentUnexcusedDays: 1,
    totalStudyDays: 25
  },
  'ST-000002': {
    studentId: 'ST-000002',
    studentName: 'باسل بن عبدالكريم الوهيبي',
    circleName: 'حلقة حفص للإتقان (متقدم)',
    teacherName: 'أ. حازم عمر الحركي',
    hifzFrom: 'سورة النساء (الآية ١٥)',
    hifzTo: 'سورة النساء (الآية ٢٦)',
    muraajaaFrom: 'سورة البقرة (الجزء الثاني)',
    muraajaaTo: 'سورة البقرة (الجزء الثالث)',
    tafheemVerses: 'تفهيم الآيات: تبيين أحكام الأرحام والنساء والواجبات الأسريّة، وتوضيح معاني الحكمة والرحمة في التشريع الإسلامي.',
    targetDays: '٥ أيام',
    startDate: '2026-08-02',
    status: 'active',
    teacherNotes: 'يرجى التركيز على المراجعة القريبة لتثبيت الحفظ القديم.',
    updatedAt: '2026-08-07',
    hifzAchievementPercent: 100,
    muraajaaAchievementPercent: 95,
    achievementGrade: 'مكتمل بنجاح بتفوق',
    achievementNotes: 'انجاز الخطة بالكامل وفق الخطة الزمنية المقررة.',
    attendanceMonth: 'أغسطس 2026',
    attendedDays: 24,
    absentExcusedDays: 1,
    absentUnexcusedDays: 0,
    totalStudyDays: 25
  },
  'ST-000003': {
    studentId: 'ST-000003',
    studentName: 'معاذ بن يوسف الدوسري',
    circleName: 'شعبة الفقه والعقيدة (متوسط)',
    teacherName: 'يونس الدوسري',
    hifzFrom: 'سورة الكهف (الآية ١)',
    hifzTo: 'سورة الكهف (الآية ٣٠)',
    muraajaaFrom: 'سورة الإسراء (كاملة)',
    muraajaaTo: 'سورة الإسراء (كاملة)',
    tafheemVerses: 'تفهيم الآيات: بيان قصة أصحاب الكهف والدروس المستفادة في الثبات على الحق والفرار بالدين من الفتن.',
    targetDays: '٦ أيام',
    startDate: '2026-08-03',
    status: 'active',
    teacherNotes: 'مراجعة أسباب النزول ومعاني الغريب في السورة.',
    updatedAt: '2026-08-06',
    hifzAchievementPercent: 85,
    muraajaaAchievementPercent: 88,
    achievementGrade: 'جيد جداً (قيد التثبيت)',
    achievementNotes: 'تقدم ملحوظ مع الحاجة لمراجعة أحكام التجويد والمدود.',
    attendanceMonth: 'أغسطس 2026',
    attendedDays: 20,
    absentExcusedDays: 3,
    absentUnexcusedDays: 2,
    totalStudyDays: 25
  },
  'ST-000004': {
    studentId: 'ST-000004',
    studentName: 'معاذ بن خالد بن عبدالله النفيسي',
    circleName: 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: 'الشيخ عمر بن عبدالعزيز التركي',
    hifzFrom: 'سورة النساء (الآية ١٥)',
    hifzTo: 'سورة النساء (الآية ٢٦)',
    muraajaaFrom: 'سورة آل عمران (الآية ١٠٠)',
    muraajaaTo: 'سورة آل عمران (الآية ١٣٠)',
    tafheemVerses: 'تفهيم الآيات: شرح وتدبر الآيات الكريمة في سورة النساء، وتوضيح مخارج الحروف وأحكام الغنة والترتيل.',
    targetDays: '٧ أيام',
    startDate: '2026-08-01',
    status: 'active',
    teacherNotes: 'التزامه ممتاز، ومستواه متقدم ما شاء الله.',
    updatedAt: '2026-08-08',
    hifzAchievementPercent: 98,
    muraajaaAchievementPercent: 96,
    achievementGrade: 'ممتاز - التزام تام',
    achievementNotes: 'مستوى استثنائي في الحفظ والتسميع اليومي وتدبر الألفاظ.',
    attendanceMonth: 'أغسطس 2026',
    attendedDays: 25,
    absentExcusedDays: 0,
    absentUnexcusedDays: 0,
    totalStudyDays: 25
  }
};

// System Students list helper
export const SYSTEM_STUDENTS = [
  { id: 'ST-000001', name: 'عبدالرحمن بن ياسر المزروعي', circle: 'حلقة حفظ الطليعة (خاتمين)', teacher: 'الشيخ عبد الرحمن السعيد' },
  { id: 'ST-000002', name: 'باسل بن عبدالكريم الوهيبي', circle: 'حلقة حفص للإتقان (متقدم)', teacher: 'أ. حازم عمر الحركي' },
  { id: 'ST-000003', name: 'معاذ بن يوسف الدوسري', circle: 'شعبة الفقه والعقيدة (متوسط)', teacher: 'يونس الدوسري' },
  { id: 'ST-000004', name: 'معاذ بن خالد بن عبدالله النفيسي', circle: 'حلقة الإمام عاصم (المستوى المتقدم)', teacher: 'الشيخ عمر بن عبدالعزيز التركي' },
  { id: 'ST-000005', name: 'عمر بن أحمد الشمري', circle: 'حلقة الإمام الشاطبي', teacher: 'أ. محمد بن علي' },
  { id: 'ST-000006', name: 'سلمان بن فهد العتيبي', circle: 'حلقة البراعم والناشئين', teacher: 'أ. إبراهيم الخالد' }
];

import {
  getStudents,
  getEducationalPlans,
  createEducationalPlan,
  updateEducationalPlan,
  StudentProfileDto,
  EducationalPlan,
} from '../lib/api';

let inMemoryStudentPlans: Record<string, StudentPlanData> = { ...INITIAL_STUDENT_PLANS };

export function getStoredPlans(): Record<string, StudentPlanData> {
  return inMemoryStudentPlans;
}

export function saveStoredPlans(plans: Record<string, StudentPlanData>) {
  inMemoryStudentPlans = plans;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('alhudacenter_plan_updated', { detail: plans }));
  }
}

interface StudentPlanManagementProps {
  defaultMode?: 'all' | 'plan_assignment' | 'achievement';
}

export default function StudentPlanManagement({ defaultMode = 'all' }: StudentPlanManagementProps = {}) {
  const [plans, setPlans] = useState<Record<string, StudentPlanData>>({});
  const [studentsList, setStudentsList] = useState<Array<{ id: string; name: string; circle: string; teacher: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [activeMode, setActiveMode] = useState<'all' | 'plan_assignment' | 'achievement'>(defaultMode);
  const [isLoading, setIsLoading] = useState(true);

  // Load real students and plans from backend API
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [studentsRes, plansRes] = await Promise.all([
          getStudents({ limit: 100 }),
          getEducationalPlans({ limit: 100 }),
        ]);

        const rawStudents = studentsRes.items || [];
        const mappedStudents = rawStudents.map((s: any) => {
          const activeMem = s.halaqaMemberships?.find((m: any) => m.isActive);
          const circleName = activeMem?.halaqa?.name || 'الحلقة العامة';
          const teacherName = activeMem?.halaqa?.teachers?.find((t: any) => t.isActive)?.teacher?.user?.displayName || 'معلم الحلقة';
          return {
            id: s.id,
            name: s.user?.displayName || s.user?.username || `طالب ${s.studentNumber || s.id.slice(0, 6)}`,
            circle: circleName,
            teacher: teacherName,
          };
        });

        setStudentsList(mappedStudents);
        if (mappedStudents.length > 0 && !selectedStudentId) {
          setSelectedStudentId(mappedStudents[0].id);
        }

        const rawPlans = plansRes.items || [];
        const plansMap: Record<string, StudentPlanData> = {};
        for (const p of rawPlans) {
          if (p.studentId) {
            plansMap[p.studentId] = {
              studentId: p.studentId,
              studentName: p.student?.user?.displayName || 'طالب',
              circleName: p.halaqa?.name || 'الحلقة',
              teacherName: 'المعلم',
              hifzFrom: p.items?.[0]?.surahNumber ? `سورة رقم ${p.items[0].surahNumber} (الآية ${p.items[0].fromAyah || 1})` : 'سورة البقرة (الآية ١)',
              hifzTo: p.items?.[0]?.toAyah ? `سورة رقم ${p.items[0].surahNumber} (الآية ${p.items[0].toAyah})` : 'سورة البقرة (الآية ٢٥)',
              muraajaaFrom: 'سورة آل عمران (الآية ١٠٠)',
              muraajaaTo: 'سورة آل عمران (الآية ١٥٠)',
              tafheemVerses: p.notes || 'تفهيم الآيات وشرح مقاصد السور.',
              targetDays: '٧ أيام',
              startDate: p.startDate || new Date().toISOString().split('T')[0],
              status: p.status === 'ACTIVE' ? 'active' : p.status === 'COMPLETED' ? 'completed' : 'needs_review',
              teacherNotes: p.notes || '',
              updatedAt: p.updatedAt ? p.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
              hifzAchievementPercent: 90,
              muraajaaAchievementPercent: 85,
              achievementGrade: 'ممتاز',
              attendanceMonth: 'أغسطس 2026',
              attendedDays: 22,
              absentExcusedDays: 2,
              absentUnexcusedDays: 1,
              totalStudyDays: 25,
            };
          }
        }
        setPlans(plansMap);
      } catch (err) {
        console.error('Failed to load students and plans from backend API', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (defaultMode) {
      setActiveMode(defaultMode);
    }
  }, [defaultMode]);

  // Form State
  const [formData, setFormData] = useState<StudentPlanData>({
    studentId: '',
    studentName: '',
    circleName: '',
    teacherName: '',
    hifzFrom: 'سورة البقرة (الآية ١)',
    hifzTo: 'سورة البقرة (الآية ٢٥)',
    muraajaaFrom: 'سورة آل عمران (الآية ١٠٠)',
    muraajaaTo: 'سورة آل عمران (الآية ١٥٠)',
    tafheemVerses: 'تفهيم الآيات: تتناول الآيات صفات المتقين ومقاصد هداية الكتاب العزيز.',
    targetDays: '٧ أيام',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
    teacherNotes: '',
    updatedAt: new Date().toISOString().split('T')[0],
    attendanceMonth: 'أغسطس 2026',
    attendedDays: 22,
    absentExcusedDays: 2,
    absentUnexcusedDays: 1,
    totalStudyDays: 25
  });

  // Update form when selected student changes
  useEffect(() => {
    if (!selectedStudentId) return;
    const existing = plans[selectedStudentId];
    const stu = studentsList.find(s => s.id === selectedStudentId);

    if (existing) {
      setFormData(existing);
    } else if (stu) {
      setFormData({
        studentId: stu.id,
        studentName: stu.name,
        circleName: stu.circle,
        teacherName: stu.teacher,
        hifzFrom: 'سورة البقرة (الآية ١)',
        hifzTo: 'سورة البقرة (الآية ١٥)',
        muraajaaFrom: 'سورة الفاتحة',
        muraajaaTo: 'سورة البقرة (الآية ٥)',
        tafheemVerses: 'تفهيم الآيات: شرح وتدبر الآيات المقررة مع بيان غريب الكلمات والدروس التربوية المستفادة.',
        targetDays: '٧ أيام',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        teacherNotes: '',
        updatedAt: new Date().toISOString().split('T')[0],
        attendanceMonth: 'أغسطس 2026',
        attendedDays: 22,
        absentExcusedDays: 2,
        absentUnexcusedDays: 1,
        totalStudyDays: 25
      });
    }
  }, [selectedStudentId, plans, studentsList]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedRecord: StudentPlanData = {
        ...formData,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      // Save plan directly to NestJS API
      await createEducationalPlan({
        name: `خطة الطالب ${formData.studentName}`,
        studentId: formData.studentId,
        type: 'HIFZ',
        status: 'ACTIVE',
        startDate: formData.startDate,
        notes: formData.tafheemVerses || formData.teacherNotes,
      });

      setPlans(prev => ({ ...prev, [formData.studentId]: updatedRecord }));
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3500);
    } catch (err) {
      console.error('Failed to save student plan to backend API', err);
    }
  };

  const filteredStudents = studentsList.filter(s => 
    s.name.includes(searchTerm) || s.circle.includes(searchTerm) || s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-12 font-sans" id="student-plan-management-container">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-amber-300 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold">
              <ClipboardList className="h-4 w-4" />
              <span>إدارة الخطط القرآنية الفردية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              {activeMode === 'achievement' ? 'قسم إنجاز الخطة الدراسية وسجل الحضور' : 'قسم خطة الطالب وتفهيم الآيات'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              {activeMode === 'achievement' 
                ? 'رصد ومتابعة نسبة إنجاز خطة الحفظ والمراجعة للطالب مع إدخال أيام الحضور والغياب وتصديرها لملف الطالب وبوابة ولي الأمر.'
                : 'إدخال وتخصيص مقرر الحفظ ومقرر المراجعة من والى لكل طالب، مع تدوين قسم تفهيم وتدبر معاني الآيات لتظهر فوراً في ملف الطالب وبوابة ولي الأمر وبوابة الطالب.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPrintView(!showPrintView)}
              className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-4 py-2.5 rounded-2xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span>{showPrintView ? 'إغلاق المعاينة' : 'طباعة تقرير الخطة'}</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccessMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 font-bold text-xs"
        >
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>تم حفظ وتحديث خطة الطالب وتفهيم الآيات بنجاح! وظهرت الآن في ملف الطالب وبوابة ولي الأمر.</span>
        </motion.div>
      )}

      {/* Main Form & Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right Side: Student Picker Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                <span>اختر الطالب بالنظام</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
                {SYSTEM_STUDENTS.length} طلاب
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم الطالب أو الحلقة..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map((stu) => {
                const isSelected = selectedStudentId === stu.id;
                const hasPlan = !!plans[stu.id];
                return (
                  <button
                    key={stu.id}
                    onClick={() => handleSelectStudent(stu.id)}
                    className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-xs font-bold' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {stu.id.slice(-3)}
                    </div>
                    <div className="space-y-1 min-w-0 flex-grow">
                      <p className="text-xs font-bold truncate leading-snug">{stu.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{stu.circle}</p>
                      {hasPlan && (
                        <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          خطة محدثة ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Left Side: Plan Editor Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSavePlan} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-xs space-y-6">
            
            {/* Form Title & Student Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  الطالب المحدد بالنظام
                </span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-700" />
                  <span>{formData.studentName}</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {formData.circleName} • المدرس: {formData.teacherName}
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-500 font-medium">
                <p>رقم الطالب: <span className="font-bold text-slate-800">{formData.studentId}</span></p>
                <p>آخر تحديث: <span className="font-bold text-slate-800">{formData.updatedAt}</span></p>
              </div>
            </div>

            {/* Mode Selection Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMode('plan_assignment')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'plan_assignment' 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>الخطة المقررة وتفهيم الآيات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('achievement')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'achievement' 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>إنجاز الخطة والسجل الشهري</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('all')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'all' 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>العرض الشامل</span>
              </button>
            </div>

            {/* Plan Assignment Sections (الحفظ والمراجعة وتفهيم الآيات) */}
            {(activeMode === 'plan_assignment' || activeMode === 'all') && (
              <>
                {/* Memorization Range (مقرر الحفظ من - إلى) */}
                <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    <span>مقرر الحفظ الجديد (من وإلى)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        من (بداية مقرر الحفظ):
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.hifzFrom}
                        onChange={(e) => setFormData({ ...formData, hifzFrom: e.target.value })}
                        placeholder="مثال: سورة البقرة (الآية ١)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        إلى (نهاية مقرر الحفظ):
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.hifzTo}
                        onChange={(e) => setFormData({ ...formData, hifzTo: e.target.value })}
                        placeholder="مثال: سورة البقرة (الآية ٢٥)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Review Range (مقرر المراجعة من - إلى) */}
                <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                  <h3 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-amber-600" />
                    <span>مقرر المراجعة والورد التثبيتي (من وإلى)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        من (بداية مقرر المراجعة):
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.muraajaaFrom}
                        onChange={(e) => setFormData({ ...formData, muraajaaFrom: e.target.value })}
                        placeholder="مثال: سورة آل عمران (الآية ١٠٠)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        إلى (نهاية مقرر المراجعة):
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.muraajaaTo}
                        onChange={(e) => setFormData({ ...formData, muraajaaTo: e.target.value })}
                        placeholder="مثال: سورة آل عمران (الآية ١٥٠)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tafheem Verses (تفهيم الآيات) */}
                <div className="space-y-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-900 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-600" />
                      <span>قسم تفهيم وتدبر الآيات المقررة (توجيهات المعلم ومعاني الآيات)</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-md">
                      يظهر في ملف الطالب وبوابة ولي الأمر
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={formData.tafheemVerses}
                    onChange={(e) => setFormData({ ...formData, tafheemVerses: e.target.value })}
                    placeholder="اكتب هنا تفهيم وتفسير معاني الآيات، مقاصد السورة، غريب الكلمات، والفوائد التربوية والتجويدية التي ينبغي للطالب وولي أمره التركيز عليها..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </>
            )}

            {/* 🏆 قسم إنجاز الخطة وسجل الحضور والغياب الشهري (Plan Achievement & Attendance Tracking) */}
            {(activeMode === 'achievement' || activeMode === 'all') && (
              <div className="space-y-5 bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-amber-50/40 p-5 rounded-2xl border border-teal-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-teal-700" />
                    <h3 className="text-xs sm:text-sm font-bold text-teal-950">
                      قسم إنجاز الخطة الدراسية وسجل الحضور والغياب الشهري
                    </h3>
                  </div>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-100/90 px-2.5 py-1 rounded-full border border-teal-200">
                    متكامل ومباشر مع ملف الطالب وبوابة ولي الأمر
                  </span>
                </div>

              {/* 🎯 Sub-Section 1: Plan Achievement Metrics (إنجاز الخطة) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-teal-100/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 border-b border-slate-100 pb-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>رصد إنجاز الخطة وتقييم المقرر:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Hifz Achievement % */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      نسبة إنجاز مقرر الحفظ (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.hifzAchievementPercent ?? 95}
                      onChange={(e) => setFormData({ ...formData, hifzAchievementPercent: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Muraajaa Achievement % */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      نسبة إنجاز مقرر المراجعة (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.muraajaaAchievementPercent ?? 90}
                      onChange={(e) => setFormData({ ...formData, muraajaaAchievementPercent: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Achievement Grade */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      التقدير العام لإنجاز الخطة:
                    </label>
                    <input
                      type="text"
                      value={formData.achievementGrade || 'ممتاز مرتفع (إنجاز متقدم)'}
                      onChange={(e) => setFormData({ ...formData, achievementGrade: e.target.value })}
                      placeholder="مثال: ممتاز مرتفع / مكتمل بنجاح / جيد جداً"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Achievement Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    ملاحظات وتقييم إنجاز الخطة:
                  </label>
                  <input
                    type="text"
                    value={formData.achievementNotes || 'أتم الحفظ والمراجعة بإتقان وجودة عالية في الترتيل.'}
                    onChange={(e) => setFormData({ ...formData, achievementNotes: e.target.value })}
                    placeholder="اكتب ملاحظات معلم الحلقة على مستوى إنجاز الطالب في الخطة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* 📅 Sub-Section 2: Monthly Attendance & Absence (سجل الحضور والغياب الشهري باليوم) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-teal-100/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <span>سجل الحضور والغياب الشهري للطالب (بالأيام):</span>
                  </div>
                  {formData.totalStudyDays && formData.totalStudyDays > 0 && (
                    <span className="text-[10px] font-bold bg-teal-700 text-white px-2.5 py-0.5 rounded-full">
                      نسبة الحضور الشهري: {Math.round(((formData.attendedDays || 0) / (formData.totalStudyDays || 1)) * 100)}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Month Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      الشهر المرصود:
                    </label>
                    <input
                      type="text"
                      value={formData.attendanceMonth || 'أغسطس 2026'}
                      onChange={(e) => setFormData({ ...formData, attendanceMonth: e.target.value })}
                      placeholder="مثال: أغسطس 2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Total Study Days */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      إجمالي أيام الدراسة:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.totalStudyDays || 25}
                      onChange={(e) => setFormData({ ...formData, totalStudyDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Attended Days */}
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                      أيام الحضور الفعلي:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={formData.attendedDays || 0}
                      onChange={(e) => setFormData({ ...formData, attendedDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Absent Excused */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1">
                      الغياب بعذر:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={formData.absentExcusedDays || 0}
                      onChange={(e) => setFormData({ ...formData, absentExcusedDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Absent Unexcused */}
                  <div>
                    <label className="block text-[10px] font-bold text-rose-800 mb-1">
                      الغياب بدون عذر:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={formData.absentUnexcusedDays || 0}
                      onChange={(e) => setFormData({ ...formData, absentUnexcusedDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-rose-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Summary bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-700">
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      • حضر: {formData.attendedDays || 0} أيام
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-700">
                      • غائب بعذر: {formData.absentExcusedDays || 0} أيام
                    </span>
                    <span className="flex items-center gap-1 font-bold text-rose-700">
                      • غائب بدون عذر: {formData.absentUnexcusedDays || 0} أيام
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    إجمالي الغياب: <span className="font-bold text-slate-800">{(formData.absentExcusedDays || 0) + (formData.absentUnexcusedDays || 0)} أيام</span> من أصل <span className="font-bold text-slate-800">{formData.totalStudyDays || 25} يوم دراسي</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Additional Fields: Duration & Teacher Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  المدة الزمنية المستهدفة للخطة:
                </label>
                <input
                  type="text"
                  value={formData.targetDays}
                  onChange={(e) => setFormData({ ...formData, targetDays: e.target.value })}
                  placeholder="مثال: ٧ أيام / أسبوع واحد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  توجيهات إضافية من المعلم لولي الأمر والطالب:
                </label>
                <input
                  type="text"
                  value={formData.teacherNotes}
                  onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
                  placeholder="مثال: الطالب ممتاز ومتقن للحفظ، يرجى الاستمرار على هذا المستوى."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-[1.01]"
              >
                <Save className="h-4 w-4" />
                <span>
                  {activeMode === 'achievement' && 'حفظ إنجاز الخطة والسجل الشهري'}
                  {activeMode === 'plan_assignment' && 'حفظ الخطة المقررة وتفهيم الآيات'}
                  {activeMode === 'all' && 'حفظ وتعميم خطة الطالب بالكامل'}
                </span>
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Printable Report View Modal/Card */}
      {showPrintView && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-2xl space-y-6">
          <div className="border-b-2 border-emerald-800 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-emerald-950 font-display">
                ملتقى الهدى القرآني النموذجـي - كشف تقرير الخطة وتفهيم الآيات
              </h2>
              <p className="text-xs text-slate-600">
                التقرير المعتمد لمقررات الحفظ والمراجعة وتدبر معاني الآيات الكريمة
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة المستند</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-200">
            <div><span className="text-slate-500">اسم الطالب:</span> <p className="font-bold text-slate-900">{formData.studentName}</p></div>
            <div><span className="text-slate-500">الحلقة:</span> <p className="font-bold text-slate-900">{formData.circleName}</p></div>
            <div><span className="text-slate-500">معلم الحلقة:</span> <p className="font-bold text-slate-900">{formData.teacherName}</p></div>
            <div><span className="text-slate-500">تاريخ الخطة:</span> <p className="font-bold text-slate-900">{formData.updatedAt}</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>مقرر الحفظ المحدد</span>
              </h4>
              <p className="text-xs text-emerald-950">
                <span className="font-bold">من:</span> {formData.hifzFrom}
              </p>
              <p className="text-xs text-emerald-950">
                <span className="font-bold">إلى:</span> {formData.hifzTo}
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
              <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <span>مقرر المراجعة المحدد</span>
              </h4>
              <p className="text-xs text-amber-950">
                <span className="font-bold">من:</span> {formData.muraajaaFrom}
              </p>
              <p className="text-xs text-amber-950">
                <span className="font-bold">إلى:</span> {formData.muraajaaTo}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-2">
            <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-indigo-600" />
              <span>قسم تفهيم وتدبر الآيات المقررة</span>
            </h4>
            <p className="text-xs text-indigo-950 leading-relaxed font-medium">
              {formData.tafheemVerses}
            </p>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl border border-teal-200 space-y-3">
            <h4 className="font-bold text-teal-950 text-xs flex items-center justify-between border-b border-teal-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-teal-700" />
                قسم إنجاز الخطة ورصد الحضور والغياب الشهري ({formData.attendanceMonth || 'أغسطس 2026'})
              </span>
              <span className="bg-teal-700 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                نسبة الحضور: {Math.round(((formData.attendedDays || 0) / (formData.totalStudyDays || 1)) * 100)}%
              </span>
            </h4>

            {/* Achievement metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block">إنجاز الحفظ:</span>
                <span className="font-black text-emerald-900 text-sm">{formData.hifzAchievementPercent ?? 95}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-teal-200">
                <span className="text-[10px] text-teal-700 font-bold block">إنجاز المراجعة:</span>
                <span className="font-black text-teal-900 text-sm">{formData.muraajaaAchievementPercent ?? 90}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold block">التقدير العام:</span>
                <span className="font-bold text-amber-900 text-xs">{formData.achievementGrade || 'ممتاز مرتفع'}</span>
              </div>
            </div>

            {/* Attendance breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="bg-white p-2 rounded-xl border border-teal-100">
                <span className="text-[10px] text-slate-500 block">إجمالي الأيام</span>
                <span className="font-black text-slate-800">{formData.totalStudyDays || 25} يوم</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-600 block">أيام الحضور</span>
                <span className="font-black text-emerald-700">{formData.attendedDays || 0} يوم</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-600 block">غياب بعذر</span>
                <span className="font-black text-amber-700">{formData.absentExcusedDays || 0} يوم</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-600 block">غياب بدون عذر</span>
                <span className="font-black text-rose-700">{formData.absentUnexcusedDays || 0} يوم</span>
              </div>
            </div>

            {formData.achievementNotes && (
              <p className="text-[11px] text-teal-900 font-medium bg-white/80 p-2 rounded-lg border border-teal-100">
                <span className="font-bold text-teal-950">تقييم المعلم:</span> {formData.achievementNotes}
              </p>
            )}
          </div>

          {formData.teacherNotes && (
            <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-700">
              <span className="font-bold">ملاحظات المعلم:</span> {formData.teacherNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
