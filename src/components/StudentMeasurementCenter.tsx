import React, { useState } from 'react';
import { 
  Award, TrendingUp, AlertTriangle, CheckCircle2, Clock, BookOpen, 
  BarChart3, UserCheck, ShieldAlert, Sparkles, Filter, Search, 
  Send, Bell, Edit3, ArrowUpRight, GraduationCap, Users, Calendar, Check,
  FileCheck2, SlidersHorizontal, Activity, Layers, HeartPulse, ChevronLeft,
  X, HelpCircle, Trophy, Phone, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AssessmentStudent {
  id: string;
  name: string;
  statusType: 'super' | 'committed' | 'delayed';
  statusLabel: string;
  branch: string;
  circle: string;
  dailyAttendance: number; // %
  totalHifzPages: number; // pages
  monthlyProgressPages: number; // pages
  evaluationScore: number; // %
  actionLabel: string;
}

export const INITIAL_ASSESSMENT_STUDENTS: AssessmentStudent[] = [
  {
    id: 'AS-01',
    name: 'أحمد بن خالد التميمي',
    statusType: 'super',
    statusLabel: 'متجاوز متفوق',
    branch: 'فرع شمال الرياض',
    circle: 'حلقة عاصم الكوفي',
    dailyAttendance: 98,
    totalHifzPages: 120,
    monthlyProgressPages: 15,
    evaluationScore: 99,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-02',
    name: 'عبد الرحمن بن سعد العريفي',
    statusType: 'super',
    statusLabel: 'متجاوز متفوق',
    branch: 'فرع شمال الرياض',
    circle: 'حلقة عاصم الكوفي',
    dailyAttendance: 100,
    totalHifzPages: 145,
    monthlyProgressPages: 18,
    evaluationScore: 100,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-03',
    name: 'سليمان بن عبد الله السيف',
    statusType: 'super',
    statusLabel: 'متجاوز متفوق',
    branch: 'فرع غرب الرياض',
    circle: 'حلقة قالون الأدائية',
    dailyAttendance: 96,
    totalHifzPages: 98,
    monthlyProgressPages: 12,
    evaluationScore: 97,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-04',
    name: 'فيصل بن محمد الدوسري',
    statusType: 'super',
    statusLabel: 'متجاوز متفوق',
    branch: 'فرع جنوب الرياض',
    circle: 'حلقة ابن عامر الشامي',
    dailyAttendance: 99,
    totalHifzPages: 110,
    monthlyProgressPages: 14,
    evaluationScore: 98,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-05',
    name: 'محمد بن علي الرشيد',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع شمال الرياض',
    circle: 'حلقة عاصم الكوفي',
    dailyAttendance: 92,
    totalHifzPages: 75,
    monthlyProgressPages: 10,
    evaluationScore: 90,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-06',
    name: 'عمر بن صالح الفوزان',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع غرب الرياض',
    circle: 'حلقة قالون الأدائية',
    dailyAttendance: 94,
    totalHifzPages: 82,
    monthlyProgressPages: 11,
    evaluationScore: 92,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-07',
    name: 'بندر بن عبد العزيز الحجيلان',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع جنوب الرياض',
    circle: 'حلقة ابن عامر الشامي',
    dailyAttendance: 91,
    totalHifzPages: 70,
    monthlyProgressPages: 9,
    evaluationScore: 88,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-08',
    name: 'عبد الله بن فهد القاسم',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع شمال الرياض',
    circle: 'حلقة الكسائي المبتدئة',
    dailyAttendance: 95,
    totalHifzPages: 68,
    monthlyProgressPages: 8,
    evaluationScore: 89,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-09',
    name: 'خالد بن يوسف السبيعي',
    statusType: 'delayed',
    statusLabel: 'متأخر خططياً',
    branch: 'فرع شرق الرياض',
    circle: 'حلقة نافع المدني',
    dailyAttendance: 75,
    totalHifzPages: 35,
    monthlyProgressPages: 4,
    evaluationScore: 68,
    actionLabel: 'إرسال تنبيه وقرار دعم'
  },
  {
    id: 'AS-10',
    name: 'زياد بن سليمان الماجد',
    statusType: 'delayed',
    statusLabel: 'متأخر خططياً',
    branch: 'فرع شرق الرياض',
    circle: 'حلقة نافع المدني',
    dailyAttendance: 72,
    totalHifzPages: 30,
    monthlyProgressPages: 3,
    evaluationScore: 60,
    actionLabel: 'إرسال تنبيه وقرار دعم'
  },
  {
    id: 'AS-11',
    name: 'سعد بن محمد القحطاني',
    statusType: 'delayed',
    statusLabel: 'متأخر خططياً',
    branch: 'فرع شرق الرياض',
    circle: 'حلقة نافع المدني',
    dailyAttendance: 81,
    totalHifzPages: 42,
    monthlyProgressPages: 5,
    evaluationScore: 72,
    actionLabel: 'إرسال تنبيه وقرار دعم'
  },
  {
    id: 'AS-12',
    name: 'ياسر بن صالح العودة',
    statusType: 'delayed',
    statusLabel: 'متأخر خططياً',
    branch: 'فرع غرب الرياض',
    circle: 'حلقة قالون الأدائية',
    dailyAttendance: 78,
    totalHifzPages: 48,
    monthlyProgressPages: 6,
    evaluationScore: 74,
    actionLabel: 'إرسال تنبيه وقرار دعم'
  },
  {
    id: 'AS-13',
    name: 'معاذ بن صالح العويد',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع شمال الرياض',
    circle: 'حلقة عاصم الكوفي',
    dailyAttendance: 97,
    totalHifzPages: 600,
    monthlyProgressPages: 22,
    evaluationScore: 98,
    actionLabel: 'تكريم وتحفيز مباشر'
  },
  {
    id: 'AS-14',
    name: 'عبد الله بن إبراهيم السبيعي',
    statusType: 'committed',
    statusLabel: 'ملتزم بالخطة',
    branch: 'فرع جنوب الرياض',
    circle: 'حلقة ابن عامر الشامي',
    dailyAttendance: 99,
    totalHifzPages: 600,
    monthlyProgressPages: 24,
    evaluationScore: 100,
    actionLabel: 'تكريم وتحفيز مباشر'
  }
];

export default function StudentMeasurementCenter() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'delayed' | 'super' | 'committed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Action Modals State
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<AssessmentStudent | null>(null);
  const [actionType, setActionType] = useState<'reward' | 'support' | null>(null);
  const [showGradeEntryModal, setShowGradeEntryModal] = useState(false);
  const [showKPIEditModal, setShowKPIEditModal] = useState(false);
  
  // Custom Toast/Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logic
  const filteredStudents = INITIAL_ASSESSMENT_STUDENTS.filter(student => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'delayed' ? student.statusType === 'delayed' :
      activeFilter === 'super' ? student.statusType === 'super' :
      student.statusType === 'committed';
      
    const matchesQuery = 
      student.name.includes(searchQuery) ||
      student.circle.includes(searchQuery) ||
      student.branch.includes(searchQuery);

    const matchesBranch = 
      selectedBranch === 'all' ? true : student.branch === selectedBranch;

    return matchesFilter && matchesQuery && matchesBranch;
  });

  const countCommitted = INITIAL_ASSESSMENT_STUDENTS.filter(s => s.statusType === 'committed').length; // 6
  const countSuper = INITIAL_ASSESSMENT_STUDENTS.filter(s => s.statusType === 'super').length; // 4
  const countDelayed = INITIAL_ASSESSMENT_STUDENTS.filter(s => s.statusType === 'delayed').length; // 4

  const handleActionClick = (student: AssessmentStudent) => {
    setSelectedStudentForAction(student);
    if (student.statusType === 'delayed') {
      setActionType('support');
    } else {
      setActionType('reward');
    }
  };

  const executeReward = () => {
    if (!selectedStudentForAction) return;
    showToast(`✓ تم إرسال وسام التكريم وتحفيز الطالب "${selectedStudentForAction.name}" عبر الواتساب والمنصة الموحدة.`);
    setSelectedStudentForAction(null);
    setActionType(null);
  };

  const executeSupport = () => {
    if (!selectedStudentForAction) return;
    showToast(`⚠️ تم إصدار قرار الدعم والتنبيه المباشر للحافظ "${selectedStudentForAction.name}" وإشعاره مع ولي أمره بمسار الاستدراك.`);
    setSelectedStudentForAction(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/40 px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-3"
          >
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              مركز قياس الطلاب والمنهج الموحد
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[11px] font-mono">
              رصد دقيق 100%
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
            متابعة دقة تنفيذ المناهج التعليمية والتربوية
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
            رصد متقدم لفرسان الصدارة، الطلاب المتعثرين، معايير المقررات السنوية ونسب انضباط الحضور.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <BarChart3 className="h-52 w-52 text-indigo-300" />
        </div>
      </div>

      {/* TOP METRIC CARDS & FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-150 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              التفاصيل (الكل)
            </button>
            <button
              onClick={() => setActiveFilter('super')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'super' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>المتجاوزون (المتفوقين) ({countSuper})</span>
            </button>
            <button
              onClick={() => setActiveFilter('committed')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'committed' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>الطلاب الملتزمون بالخطة ({countCommitted})</span>
            </button>
            <button
              onClick={() => setActiveFilter('delayed')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'delayed' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>الطلاب المتأخرون ({countDelayed})</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400">
            إجمالي الطلاب المرصودين: <span className="font-mono text-slate-900 text-sm font-black">14</span> طالباً
          </div>
        </div>

        {/* 3 Summary Stat Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-bold text-xs block mb-1">الالتزام بالخطة</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-blue-900">6</span>
                <span className="text-xs font-bold text-blue-700">طالباً</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-bold text-xs block mb-1">المتجاوزون (المتفوقين)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-900">4</span>
                <span className="text-xs font-bold text-emerald-700">طالباً</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-700">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-rose-50/40 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-bold text-xs block mb-1">المتأخرون عن الخطة</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-900">4</span>
                <span className="text-xs font-bold text-amber-700">طالباً</span>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* CORE KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. الخطط والالتزام */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-indigo-50 text-indigo-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-indigo-200">
                الخطط والالتزام
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-sm font-display">مؤشر التسميع المقرر</h3>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">تنفيذ الخطط - التسميع المقرر حسب الأسبوع</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">نسبة الالتزام الكلية</span>
              <span className="text-2xl font-black font-mono text-indigo-950">87%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50/80 p-2 rounded-xl text-center border border-emerald-150">
              معدل ممتاز مقارنة بالفترة السابقة
            </p>
          </div>
        </div>

        {/* 2. صفحات ومقررات */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200">
                صفحات ومقررات
              </span>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-sm font-display">مؤشر الحفظ</h3>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">عدد الصفحات المنجزة شهرياً</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي المنجز</span>
              <span className="text-2xl font-black font-mono text-slate-900">1,350 <span className="text-xs text-slate-500 font-sans">صفحة</span></span>
            </div>
            <div className="text-[11px] text-slate-600 font-semibold space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
              <p>بمتوسط شهري: <span className="font-mono font-bold text-slate-900">11.5</span> صفحات لكل طالب</p>
              <p className="text-emerald-700 font-bold">أفضل الحلقات: حلقة عاصم</p>
            </div>
          </div>
        </div>

        {/* 3. الإتقان والتكرار */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-blue-50 text-blue-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-blue-200">
                الإتقان والتكرار
              </span>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-sm font-display">مؤشر المراجعة</h3>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">التثبيت والمكوك الأسبوعي</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">إنجاز التكرار</span>
              <span className="text-2xl font-black font-mono text-blue-900">89%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '89%' }}></div>
            </div>
            <p className="text-[11px] text-blue-800 font-bold bg-blue-50/80 p-2 rounded-xl text-center border border-blue-150">
              أفضل الحلقات: حلقة ابن عامر
            </p>
          </div>
        </div>

        {/* 4. علم الآلة والتجويد */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-purple-50 text-purple-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-purple-200">
                علم الآلة والتجويد
              </span>
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-sm font-display">مؤشر المقررات</h3>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">متون التجويد والعلوم الفرعية</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-1 text-center font-mono">
              <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-150">
                <span className="text-emerald-800 text-[10px] font-bold block font-sans">نشطة</span>
                <span className="text-emerald-900 font-black text-sm">3</span>
              </div>
              <div className="bg-blue-50 p-1.5 rounded-xl border border-blue-150">
                <span className="text-blue-800 text-[10px] font-bold block font-sans">مكتملة</span>
                <span className="text-blue-900 font-black text-sm">2</span>
              </div>
              <div className="bg-rose-50 p-1.5 rounded-xl border border-rose-150">
                <span className="text-rose-800 text-[10px] font-bold block font-sans">متعثرة</span>
                <span className="text-rose-900 font-black text-sm">1</span>
              </div>
            </div>
            <p className="text-[10px] text-amber-800 font-bold bg-amber-50 p-2 rounded-xl text-center border border-amber-200 flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>مقرر فرع الجنوب به تعثر فني</span>
            </p>
          </div>
        </div>

      </div>

      {/* DETAILED EXAMS & ATTENDANCE & BEHAVIOR ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 5. تقييمات ممركزة (مؤشر الاختبارات) - 2 Cols */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">
                  تقييمات ممركزة
                </span>
                <h3 className="font-black text-slate-900 text-base font-display">مؤشر الاختبارات والدرجات النهائية</h3>
              </div>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                نتائج المقررات الشفوية والتحريرية (مبني على إدخال الدرجات النهائية)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 text-[11px] font-bold block mb-1">متوسط الدرجات</span>
              <span className="text-2xl font-black font-mono text-slate-900">81.7%</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-emerald-700 text-[11px] font-bold block mb-1">نسبة النجاح</span>
              <span className="text-2xl font-black font-mono text-emerald-900">92.3%</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-rose-700 text-[11px] font-bold block mb-1">نسبة الرسوب</span>
              <span className="text-2xl font-black font-mono text-rose-900">7.7%</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-amber-800 text-[11px] font-bold block mb-1">لم يختبر</span>
              <span className="text-2xl font-black font-mono text-amber-900">13.3% <span className="text-[10px] font-sans font-bold">(2 طالباً)</span></span>
            </div>
          </div>

          {/* Exam Grade Distribution Bars */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs text-slate-700">توزيع الطلاب وتجاوز الاختبارات حسب الفئات:</h4>
            
            <div className="space-y-2 text-xs font-bold">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>تجاوز الاختبار فوق 90% (ممتاز مرتفع)</span>
                  <span className="font-mono text-slate-900">30.8%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '30.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>تجاوز الاختبار فوق 80% (جيد جداً فما فوق)</span>
                  <span className="font-mono text-slate-900">61.5%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '61.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>تجاوز الاختبار فوق 70% (جيد مرتفع)</span>
                  <span className="font-mono text-slate-900">84.6%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '84.6%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold border-t border-slate-100 pt-3">
            <span>تحديث قاعدة رصد الدرجات: موثقة معتمدة</span>
            <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700">آخر رصد: 1447/12/10</span>
          </div>
        </div>

        {/* 6, 7, 8. الحضور + السلوك + الأنشطة - 1 Col */}
        <div className="space-y-4">
          
          {/* مؤشر الحضور والمواظبة */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-850 text-sm font-display flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>مؤشر الحضور والمواظبة</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">شامل الحلقات</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-150">
                <span className="text-[10px] font-bold text-emerald-800 block">الحضور العام</span>
                <span className="text-xl font-black font-mono text-emerald-950">90%</span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-150">
                <span className="text-[10px] font-bold text-rose-800 block">الغياب المكتمل</span>
                <span className="text-xl font-black font-mono text-rose-950">7%</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-150">
                <span className="text-[10px] font-bold text-amber-800 block">الاستئذان</span>
                <span className="text-xl font-black font-mono text-amber-950">3%</span>
              </div>
            </div>
          </div>

          {/* مؤشر الانضباط والسلوك */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-850 text-sm font-display flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-indigo-600" />
                <span>مؤشر الانضباط والسلوك</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">تلقائي</span>
            </div>
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
              رصد مباشر للسلوكيات الفنية وحالات التقويم التربوي بالحلقات التابعة.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">الملاحظات</span>
                <span className="text-lg font-black font-mono text-slate-900">4</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block">التنبيهات</span>
                <span className="text-lg font-black font-mono text-amber-900">2</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block">تحسن سلوكي</span>
                <span className="text-lg font-black font-mono text-emerald-900">3</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 pt-1">
              <Check className="h-3 w-3 text-emerald-600" />
              <span>تمت مشاركة التقارير مع أولياء الأمور تلقائياً.</span>
            </p>
          </div>

          {/* مؤشر الأنشطة والفعاليات */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-850 text-sm font-display flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>مؤشر الأنشطة والفعاليات</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">الملتقى</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">الأنشطة</span>
                <span className="text-base font-black font-mono text-slate-900">12</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">المشاركون</span>
                <span className="text-base font-black font-mono text-slate-900">145</span>
              </div>
              <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 block">نسبة المشاركة</span>
                <span className="text-base font-black font-mono text-indigo-950">85%</span>
              </div>
            </div>
          </div>

        </div>

      </div>



      {/* MODAL: ACTION FOR STUDENT (REWARD / SUPPORT) */}
      <AnimatePresence>
        {selectedStudentForAction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-right space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  {actionType === 'support' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Award className="h-5 w-5 text-emerald-600" />
                  )}
                  <h3 className="font-black text-slate-900 text-base">
                    {actionType === 'support' ? 'إصدار قرار دعم وتنبيه خططي' : 'إصدار وسام تكريم وتحفيز مباشر'}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedStudentForAction(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-black text-slate-900 text-sm">{selectedStudentForAction.name}</p>
                <p className="text-xs text-slate-500 font-bold">{selectedStudentForAction.circle} • {selectedStudentForAction.branch}</p>
                <div className="flex items-center gap-3 pt-1 text-xs font-mono font-bold text-slate-700">
                  <span>نسبة التقييم: {selectedStudentForAction.evaluationScore}%</span>
                  <span>الحفظ: {selectedStudentForAction.totalHifzPages} ص</span>
                </div>
              </div>

              {actionType === 'support' ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    سيتم إرسال إشعار تنبيه رسمي لولي الأمر وللمعلم المباشر، وتفعيل مسار تقوية فردي في خطة الطالب.
                  </p>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سبب قرار الدعم والتنبيه:</label>
                    <textarea 
                      defaultValue="تأخر عن خطة التسميع السنوية وتراجع معدل الحضور الأسبوعي."
                      className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    سيتم منح الطالب وسام التميز، وإرسال بطاقة تهنئة فورية لولي الأمر عبر الرسائل والإشعارات.
                  </p>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">عبارة التكريم والثناء:</label>
                    <textarea 
                      defaultValue="نبارك للطالب تميزه وتجاوزه لخطة الحفظ المقررة بنسبة تفوق استثنائية."
                      className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={actionType === 'support' ? executeSupport : executeReward}
                  className={`flex-1 py-3 rounded-xl text-xs font-black text-white cursor-pointer transition-all shadow-xs ${
                    actionType === 'support' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {actionType === 'support' ? 'تأكيد وإرسال قرار الدعم' : 'تأكيد وإرسال التكريم المباشر'}
                </button>
                <button
                  onClick={() => setSelectedStudentForAction(null)}
                  className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ENTER GRADE RESULTS */}
      <AnimatePresence>
        {showGradeEntryModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 text-right space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-950" />
                  <h3 className="font-black text-slate-900 text-base">إدخال درجات المقررات والاختبارات الممركزة</h3>
                </div>
                <button onClick={() => setShowGradeEntryModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اختر الحلقة:</label>
                  <select className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <option>حلقة عاصم الكوفي (شمال الرياض)</option>
                    <option>حلقة قالون الأدائية (غرب الرياض)</option>
                    <option>حلقة ابن عامر الشامي (جنوب الرياض)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المقرر / الاختبار:</label>
                  <input 
                    type="text" 
                    defaultValue="اختبار المنهج النهائي - الفصل الدراسي"
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800 text-xs">رصد سريع للدرجات (من 100):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900">أحمد بن خالد التميمي</span>
                      <input type="number" defaultValue="99" className="w-16 p-1 text-center font-mono font-bold border border-slate-300 rounded-lg" />
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900">عبد الرحمن بن سعد العريفي</span>
                      <input type="number" defaultValue="100" className="w-16 p-1 text-center font-mono font-bold border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    showToast('✓ تم حفظ واعتماد درجات الاختبارات الممركزة ونشرها بالسجلات المعتمدة.');
                    setShowGradeEntryModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-black bg-indigo-950 text-white hover:bg-indigo-900 cursor-pointer transition-all shadow-xs"
                >
                  حفظ واعتماد الدرجات
                </button>
                <button
                  onClick={() => setShowGradeEntryModal(false)}
                  className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VIEW / EDIT KPIS */}
      <AnimatePresence>
        {showKPIEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 text-right space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-indigo-950" />
                  <h3 className="font-black text-slate-900 text-base">عرض وتعديل مستهدفات KPIs للمناهج</h3>
                </div>
                <button onClick={() => setShowKPIEditModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستهدف الالتزام بالخطة:</label>
                  <input type="text" defaultValue="85%" className="w-full font-mono font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستهدف متوسط الحفظ الشهري (صفحات):</label>
                  <input type="text" defaultValue="12 صفحة / طالب" className="w-full font-mono font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستهدف نسبة النجاح العامة:</label>
                  <input type="text" defaultValue="90%" className="w-full font-mono font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    showToast('✓ تم تحديث وحفظ مستهدفات KPIs لمركز القياس بنجاح.');
                    setShowKPIEditModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-black bg-indigo-950 text-white hover:bg-indigo-900 cursor-pointer transition-all shadow-xs"
                >
                  حفظ المستهدفات المعدلة
                </button>
                <button
                  onClick={() => setShowKPIEditModal(false)}
                  className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
