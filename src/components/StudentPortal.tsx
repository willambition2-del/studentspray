/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, Award, CheckCircle, BarChart2, Sparkles, HelpCircle,
  FileCheck, ArrowLeft, Printer, Send, MessageCircle, AlertCircle, RefreshCw,
  Plus, CheckCircle2, MessageSquare, AlertTriangle, Lightbulb, UserCheck,
  CalendarCheck, UserPlus, PhoneCall, Layers, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredPlans } from './StudentPlanManagement';
import { 
  getStoredStudentTasks, 
  updateStudentTaskStatus, 
  getStoredStudentPrivateAlerts, 
  saveStudentPrivateAlert, 
  getStoredStudentProposals, 
  saveStudentProposal,
  getStoredStudentSessionRequests,
  saveStudentSessionRequest,
  StudentTaskOrProblem,
  StudentPrivateAlert,
  StudentProposal,
  StudentPrivateSessionRequest
} from '../lib/circleAlertsStorage';

export default function StudentPortal({ currentUser }: { currentUser?: any }) {
  const [activeTab, setActiveTab] = useState<'plan' | 'evaluations' | 'badges' | 'assistant'>('plan');
  const storedPlans = getStoredPlans();
  
  // Dynamic student profile details
  const studentProfile = {
    name: currentUser?.name || 'معاذ بن خالد بن عبدالله النفيسي',
    id: currentUser?.studentId || currentUser?.id || 'STU-1447-089',
    circleName: currentUser?.circleName || 'حلقة الإمام عاصم (المستوى المتقدم)',
    teacherName: currentUser?.teacherName || 'الشيخ عمر بن عبدالعزيز التركي',
    supervisorName: currentUser?.supervisorName || 'الشيخ محمد بن فهد الدوسري',
    joiningDate: currentUser?.joiningDate || '01/09/1445 هـ',
    currentLevel: currentUser?.currentLevel || 'المستوى الثالث - المهرة بالقرآن'
  };

  const currentStudentPlan: any = Object.values(storedPlans).find((p: any) => 
    (currentUser?.name && p?.studentName?.includes(currentUser.name.split(' ')?.[0] || '')) ||
    (currentUser?.id && p?.studentId === currentUser.id)
  ) || (storedPlans as any)['ST-000004'] || (storedPlans as any)['ST-000001'];
  const [showCertificate, setShowCertificate] = useState(false);

  // Student communication hub state
  const [commSubTab, setCommSubTab] = useState<'tasks' | 'alert' | 'proposal' | 'session'>('tasks');
  const [assignedTasks, setAssignedTasks] = useState<StudentTaskOrProblem[]>([]);
  const [privateAlerts, setPrivateAlerts] = useState<StudentPrivateAlert[]>([]);
  const [proposals, setProposals] = useState<StudentProposal[]>([]);
  const [sessionRequests, setSessionRequests] = useState<StudentPrivateSessionRequest[]>([]);
  
  // Response modal / state
  const [activeTaskToRespond, setActiveTaskToRespond] = useState<StudentTaskOrProblem | null>(null);
  const [taskResponseText, setTaskResponseText] = useState('');

  // New Private Alert form
  const [newAlertForm, setNewAlertForm] = useState({
    title: '',
    category: 'absence_excuse' as StudentPrivateAlert['category'],
    urgency: 'medium' as StudentPrivateAlert['urgency'],
    details: ''
  });

  // New Proposal form
  const [newProposalForm, setNewProposalForm] = useState({
    title: '',
    category: 'revision_group' as StudentProposal['category'],
    proposalText: ''
  });

  // New Private Session Request form
  const [newSessionForm, setNewSessionForm] = useState({
    topic: '',
    sessionType: 'struggle_remedy' as StudentPrivateSessionRequest['sessionType'],
    struggleDetails: '',
    targetSurahs: '',
    preferredTime: '',
    urgency: 'high' as StudentPrivateSessionRequest['urgency']
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const reloadCommData = () => {
    setAssignedTasks(getStoredStudentTasks());
    setPrivateAlerts(getStoredStudentPrivateAlerts());
    setProposals(getStoredStudentProposals());
    setSessionRequests(getStoredStudentSessionRequests());
  };

  useEffect(() => {
    reloadCommData();
    const handleUpdate = () => {
      reloadCommData();
    };
    window.addEventListener('alhudacenter_student_comm_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('alhudacenter_student_comm_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // KPIs with clear tooltips
  const kpis = [
    { 
      id: 'kpi-1', 
      title: 'مقدار الحفظ الفعلي', 
      value: '٢٤ جزءاً', 
      subtitle: 'المتبقي: ٦ أجزاء للختمة', 
      icon: BookOpen, 
      color: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      tooltip: 'يمثل عدد الأجزاء التي تم اختبارها بنجاح وحفظها بشكل راسخ وموثق في السجلات الرسمية.'
    },
    { 
      id: 'kpi-2', 
      title: 'نسبة الالتزام بالخطة', 
      value: '٩٤.٥٪', 
      subtitle: 'تقدم ممتاز ومميز', 
      icon: BarChart2, 
      color: 'bg-amber-50 text-amber-800 border-amber-100',
      tooltip: 'معدل إتمام المقررات اليومية من الحفظ والمراجعة مقارنة بالخطة الفردية المخصصة للطالب.'
    },
    { 
      id: 'kpi-3', 
      title: 'معدل الحضور والانضباط', 
      value: '٩٦.٨٪', 
      subtitle: 'غياب يومين فقط هذا الفصل', 
      icon: Calendar, 
      color: 'bg-indigo-50 text-indigo-800 border-indigo-100',
      tooltip: 'نسبة الأيام التي تم فيها الحضور والتسميع الفعلي من إجمالي أيام انعقاد الحلقات.'
    },
    { 
      id: 'kpi-4', 
      title: 'رصيد أوسمة التميز', 
      value: '٢,٤٥٠ نقطة', 
      subtitle: 'المستوى: حافظ ذهبي', 
      icon: Award, 
      color: 'bg-rose-50 text-rose-800 border-rose-100',
      tooltip: 'مجموع النقاط التشجيعية التي تمنح للطالب نظير الانضباط، جودة التلاوة، والمشاركات الإيجابية.'
    }
  ];

  // Exam records
  const examRecords = [
    { id: 'e-1', date: '2026-07-05', surah: 'سورة آل عمران كاملة', type: 'اختبار ربع سنوي', score: 98, grade: 'ممتاز مرتفع', notes: 'حفظ متقن ومخارج حروف سليمة جداً. بارك الله فيك ونفع بك.', teacher: studentProfile.teacherName },
    { id: 'e-2', date: '2026-06-15', surah: 'الجزء الثالث والعشرون', type: 'اختبار جزء مستقل', score: 95, grade: 'ممتاز', notes: 'تمت المقارنة بنجاح، لديه تردد بسيط في نهايات الآيات لكن التلاوة ممتازة.', teacher: studentProfile.teacherName },
    { id: 'e-3', date: '2026-05-20', surah: 'سورة البقرة كاملة', type: 'اختبار فصلي كبير', score: 100, grade: 'ممتاز مع مرتبة الشرف', notes: 'ما شاء الله تبارك الله، حفظ لؤلؤي بديع وخالٍ تماماً من اللحون والأخطاء.', teacher: studentProfile.teacherName }
  ];

  // Earned Badges
  const badges = [
    { id: 'b-1', title: 'وسام الفجر الصادق', desc: 'يمنح للطلاب الملتزمين بالحضور المبكر في أول دقيقة من تسيير الحلقة لـ ٢٠ يوماً متتالية.', date: '10/06/2026', icon: Clock, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'b-2', title: 'فارس الترتيل المتقن', desc: 'يمنح للطالب الحاصل على درجة ١٠٠٪ في التجويد العملي وتلاوة المتون أمام اللجنة العليا.', date: '25/05/2026', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'b-3', title: 'بطل العزيمة والاستمرار', desc: 'يمنح لمن أنجز خطة الحفظ اليومية كاملة دون أي تراجع أو تعثر لمدة شهرين متواصلين.', date: '02/05/2026', icon: CheckCircle, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'b-4', title: 'نجم الخدمة العائلية', desc: 'تقدير للمشاركة التطوعية في مساعدة بقية طلاب الحلقة وتسميع المراجعة للبراعم الصغار.', date: '18/04/2026', icon: Award, color: 'text-rose-600 bg-rose-50 border-rose-200' }
  ];

  return (
    <div className="space-y-6" id="student-portal-container">
      
      {/* 🌟 Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-700 relative overflow-hidden" id="student-header">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-300">
              <Sparkles className="h-3 w-3" />
              <span>الطالب المتميز والحافظ الواعد</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">{studentProfile.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100 font-medium">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {studentProfile.circleName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 hidden md:inline" />
              <span>المدرس: {studentProfile.teacherName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 hidden md:inline" />
              <span>رقم الطالب الاكاديمي: <span className="font-mono">{studentProfile.id}</span></span>
            </div>
          </div>
          <button 
            onClick={() => setShowCertificate(true)}
            className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all border border-amber-300 shadow-xs flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
            title="انقر لاستخراج وتحميل شهادة تقييم الأداء الأكاديمي والتربوي الشاملة ومشاركتها مع ولي الأمر"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>استخراج شهادة الأداء</span>
          </button>
        </div>
      </div>

      {/* 📊 KPIs Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="student-kpi-grid">
        {kpis.map((kpi) => (
          <div 
            key={kpi.id} 
            className={`p-4 rounded-xl border bg-white shadow-xs transition-all flex items-center justify-between group relative`}
            title={kpi.tooltip}
          >
            <div className="space-y-1.5">
              <p className="text-slate-500 text-xs font-bold flex items-center gap-1">
                {kpi.title}
                <HelpCircle className="h-3 w-3 text-slate-300 cursor-help shrink-0" />
              </p>
              <p className="text-xl sm:text-2xl font-black font-display text-slate-800">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-medium">{kpi.subtitle}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${kpi.color}`}>
              <kpi.icon className="h-5 w-5 shrink-0" />
            </div>

            {/* Micro Explanatory Tooltip Element */}
            <div className="absolute bottom-full mb-1 right-2 left-2 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md leading-relaxed text-right">
              {kpi.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* 🎛️ Navigation tabs for Student view */}
      <div className="border-b border-slate-200 flex overflow-x-auto gap-2" id="student-tabs">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'plan' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          title="شاهد وأنجز الخطة المقررة لحفظ اليوم ومراجعة الأمس"
        >
          📖 الخطة اليومية والمقرر
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'evaluations' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          title="استعرض نتائج تقييمات الحفظ اليومية، ودرجات الاختبارات ربع السنوية وتوصيات المعلمين"
        >
          📝 سجل التقييمات والاختبارات
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'badges' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          title="خزانة الأوسمة التقديرية ونقاط التميز التي تم جمعها بفضل جهودك المباركة"
        >
          🏅 خزانة الأوسمة التقديرية
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assistant' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          title="اطلب مساعدة في الحفظ أو التجويد أو المراجعة بشكل مباشر من الكادر التعليمي"
        >
          💬 طلبات المساعدة والمتابعة
        </button>
      </div>

      {/* 🔮 Tab Contents */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" id="student-tab-content">
        
        {/* 📚 TAB 1: DAILY TARGETS */}
        {activeTab === 'plan' && (
          <div className="space-y-5">
            {/* 🌟 Teacher Assigned Plan Card & Verse Explanation (الخطة وتفهيم الآيات) */}
            {currentStudentPlan && (
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md border border-emerald-700 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      الخطة القرآنية المعتمدة
                    </span>
                    <h3 className="text-sm font-bold text-white font-display">
                      خطة الطالب: {currentStudentPlan.studentName}
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-200 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700">
                    آخر تحديث من المعلم: {currentStudentPlan.updatedAt}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Hifz Range */}
                  <div className="bg-emerald-950/70 p-3.5 rounded-xl border border-emerald-700/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span>مقرر الحفظ المطلوب (من - إلى)</span>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium pt-1">
                      <span className="font-bold text-white">من:</span> {currentStudentPlan.hifzFrom}
                    </p>
                    <p className="text-xs text-emerald-100 font-medium">
                      <span className="font-bold text-white">إلى:</span> {currentStudentPlan.hifzTo}
                    </p>
                  </div>

                  {/* Muraajaa Range */}
                  <div className="bg-emerald-950/70 p-3.5 rounded-xl border border-emerald-700/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                      <RefreshCw className="h-4 w-4 shrink-0" />
                      <span>مقرر المراجعة والورد (من - إلى)</span>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium pt-1">
                      <span className="font-bold text-white">من:</span> {currentStudentPlan.muraajaaFrom}
                    </p>
                    <p className="text-xs text-emerald-100 font-medium">
                      <span className="font-bold text-white">إلى:</span> {currentStudentPlan.muraajaaTo}
                    </p>
                  </div>
                </div>

                {/* Tafheem Verses (تفهيم وتدبر الآيات) */}
                <div className="bg-amber-400/10 p-3.5 rounded-xl border border-amber-400/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>تفهيم وتدبر معاني الآيات المقررة (توجيهات المعلم)</span>
                  </div>
                  <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                    {currentStudentPlan.tafheemVerses}
                  </p>
                </div>

                {/* 🏆 قسم إنجاز الخطة وسجل الحضور والغياب الشهري باليوم */}
                <div className="bg-emerald-950/80 p-4 rounded-xl border border-emerald-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-300" />
                      <h4 className="text-xs font-bold text-white">
                        قسم إنجاز الخطة وسجل الحضور والغياب الشهري ({currentStudentPlan.attendanceMonth || 'أغسطس 2026'})
                      </h4>
                    </div>
                    <span className="bg-emerald-800 text-amber-300 font-bold px-2.5 py-0.5 rounded text-[11px] border border-emerald-600">
                      نسبة الحضور والالتزام: {Math.round(((currentStudentPlan.attendedDays || 0) / (currentStudentPlan.totalStudyDays || 1)) * 100)}%
                    </span>
                  </div>

                  {/* Plan Progress & Achievement metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-emerald-900/60 p-2.5 rounded-lg border border-emerald-700 space-y-0.5">
                      <span className="text-[10px] text-emerald-200 block">نسبة إنجاز مقرر الحفظ</span>
                      <span className="font-bold text-amber-300 text-sm">{currentStudentPlan.hifzAchievementPercent ?? 95}%</span>
                    </div>
                    <div className="bg-emerald-900/60 p-2.5 rounded-lg border border-emerald-700 space-y-0.5">
                      <span className="text-[10px] text-emerald-200 block">نسبة إنجاز مقرر المراجعة</span>
                      <span className="font-bold text-amber-300 text-sm">{currentStudentPlan.muraajaaAchievementPercent ?? 90}%</span>
                    </div>
                    <div className="bg-emerald-900/60 p-2.5 rounded-lg border border-emerald-700 space-y-0.5">
                      <span className="text-[10px] text-emerald-200 block">التقدير العام لإنجاز الخطة</span>
                      <span className="font-bold text-white text-xs">{currentStudentPlan.achievementGrade || 'ممتاز مرتفع'}</span>
                    </div>
                  </div>

                  {/* Monthly Attendance breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-emerald-200 block">إجمالي أيام الحلقة</span>
                      <span className="font-bold text-white text-xs">{currentStudentPlan.totalStudyDays || 25} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-amber-300 block">أيام الحضور الفعلي</span>
                      <span className="font-bold text-amber-300 text-xs">{currentStudentPlan.attendedDays || 0} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-amber-200 block">أيام الغياب بعذر</span>
                      <span className="font-bold text-amber-200 text-xs">{currentStudentPlan.absentExcusedDays || 0} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-rose-300 block">أيام الغياب بدون عذر</span>
                      <span className="font-bold text-rose-300 text-xs">{currentStudentPlan.absentUnexcusedDays || 0} يوم</span>
                    </div>
                  </div>

                  {currentStudentPlan.achievementNotes && (
                    <p className="text-[11px] text-emerald-100 bg-emerald-900/50 p-2 rounded-lg border border-emerald-800">
                      <span className="font-bold text-amber-300">ملاحظات إنجاز الخطة:</span> {currentStudentPlan.achievementNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 text-xs text-emerald-800 space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <span>نصيحة الموجه التربوي الأسبوعية لقوة الحفظ:</span>
              </p>
              <p className="font-medium text-[11px] text-slate-600">
                "إن أفضل الطرق لتمكين الحفظ الجديد في الذاكرة طويلة المدى هو الربط بين الآيات المتشابهة بالرسم وتلاوة المقرر كاملاً عن غيب خمس مرات متتالية قبل خلودك إلى النوم ليلة التسميع."
              </p>
            </div>
          </div>
        )}

        {/* 📝 TAB 2: EXAMS & EVALUATIONS */}
        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">بيان نتائج الاختبارات والتقييمات الأخيرة</h3>
              <p className="text-[11px] text-slate-400">سجل تراكمي بالاختبارات الدورية الكبرى المعتمدة من الموجه وإدارة الملتقى.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                    <th className="p-3">تاريخ الاختبار</th>
                    <th className="p-3">المقرر والمستهدف</th>
                    <th className="p-3">نوع التقييم</th>
                    <th className="p-3 text-center">الدرجة</th>
                    <th className="p-3">التقدير الأكاديمي</th>
                    <th className="p-3">ملاحظات فضيلة الشيخ المختبر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {examRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group relative">
                      <td className="p-3 font-mono text-[11px]">{rec.date}</td>
                      <td className="p-3 font-bold text-slate-800">{rec.surah}</td>
                      <td className="p-3 text-slate-500">{rec.type}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-md font-bold">
                          {rec.score} / ١٠٠
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-bold">{rec.grade}</span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={rec.notes}>
                        {rec.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-[11px]">معيار الدرجات والتقدير العام المعتمد بالملتقى:</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  امتياز مرتفع (٩٨ - ١٠٠) • امتياز (٩٥ - ٩٧) • جيد جداً مرتفع (٩٠ - ٩٤) • جيد جداً (٨٥ - ٨٩) • جيد (٧٥ - ٨٤) • مقبول (٦٠ - ٧٤) • متعثر (أقل من ٦٠).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🏅 TAB 3: BADGES CABINET */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">أوسمة التقدير الممنوحة وشارات التميز</h3>
              <p className="text-[11px] text-slate-400">تمنح هذه الأوسمة لتكريم همتك العالية وتحفيز زملائك في الحلقات القرآنية.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all flex items-start gap-3 relative group"
                  title="ضع مؤشر الفأرة لاستعراض شروط الفوز بلقب هذا الوسام"
                >
                  <div className={`p-2.5 rounded-lg border ${badge.color} shrink-0`}>
                    <badge.icon className="h-5 w-5 shrink-0" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800">{badge.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{badge.desc}</p>
                    <p className="text-[9px] text-slate-400 font-mono">تاريخ المنح: {badge.date}</p>
                  </div>

                  {/* Detailed tooltip */}
                  <div className="absolute bottom-full mb-1 right-2 left-2 bg-slate-800 text-white text-[10px] p-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md leading-relaxed text-right">
                    <strong>شروط الوسام:</strong> {badge.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 💬 TAB 4: TEACHER COMMUNICATION, ASSIGNED TASKS & PROPOSALS */}
        {activeTab === 'assistant' && (
          <div className="space-y-6 text-right font-sans" dir="rtl">
            
            {/* Header info banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl border border-emerald-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">مركز التواصل التفاعلي مع المدرس</span>
                  <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-bold">مدرس الحلقة: {studentProfile.teacherName}</span>
                </div>
                <h3 className="text-base font-bold text-white">نافذة التواصل المباشر، المهام المكلفة، والتنبيهات والمقترحات</h3>
                <p className="text-xs text-emerald-100/80">عرض المهام والمشكلات المرسلة من المعلم، مع إمكانية رفع تنبيهات خاصة ومقترحات تطويرية مباشرة للمعلم.</p>
              </div>

              {/* Subtabs switcher */}
              <div className="bg-emerald-950/80 p-1 rounded-xl border border-emerald-700/60 flex flex-wrap items-center gap-1 self-stretch sm:self-auto text-xs font-bold shrink-0">
                <button
                  onClick={() => setCommSubTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    commSubTab === 'tasks' ? 'bg-amber-400 text-emerald-950 shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>المهام والمشكلات ({assignedTasks.length})</span>
                </button>

                <button
                  onClick={() => setCommSubTab('alert')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    commSubTab === 'alert' ? 'bg-amber-400 text-emerald-950 shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تنبيه خاص للمعلم ({privateAlerts.length})</span>
                </button>

                <button
                  onClick={() => setCommSubTab('proposal')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    commSubTab === 'proposal' ? 'bg-amber-400 text-emerald-950 shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>تقديم مقترح ({proposals.length})</span>
                </button>

                <button
                  onClick={() => setCommSubTab('session')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    commSubTab === 'session' ? 'bg-amber-400 text-emerald-950 shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>طلب جلسة خاصة مع المدرس ({sessionRequests.length})</span>
                </button>
              </div>
            </div>

            {feedbackMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* 📋 SUBTAB 1: ASSIGNED TASKS & PROBLEMS FROM TEACHER */}
            {commSubTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      المشكلات والمهام المكلف بها من قِبَل المعلم ({studentProfile.teacherName})
                    </h3>
                    <p className="text-[11px] text-slate-400">تابع واستجب للمهام أو خطط المعالجة والتدارك الموجهة لشخصك الكويم.</p>
                  </div>
                  <button
                    onClick={() => setAssignedTasks(getStoredStudentTasks())}
                    className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث القائمة</span>
                  </button>
                </div>

                {assignedTasks.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-xs text-slate-700">لا توجد مهام أو مشكلات مكلف بها حالياً</p>
                    <p className="text-[10px] text-slate-400">أنت تسير وفق الخطة المعتمدة بانضباط كامل بارك الله فيك.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`p-4 rounded-2xl border space-y-3 relative transition-all ${
                          task.status === 'completed' 
                            ? 'bg-slate-50 border-slate-200 opacity-90' 
                            : task.priority === 'urgent'
                            ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                            : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                task.priority === 'urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {task.priority === 'urgent' ? '⚡ عاجل ومهم' : task.priority === 'medium' ? 'ملاحظة متابعة' : 'توجيه اعتيادي'}
                              </span>

                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {task.status === 'completed' ? '✓ مكتملة ومعالجة' : task.status === 'in_progress' ? '⏳ قيد التنفيذ' : '🔴 بانتظار التعامل'}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 mt-1">{task.title}</h4>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700 font-medium">
                          <p className="leading-relaxed">{task.description}</p>
                          <div className="text-[11px] text-emerald-900 font-bold bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                            <strong>المطلوب وتوجيه المعلم:</strong> {task.requiredAction}
                          </div>
                        </div>

                        {task.studentResponse && (
                          <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-0.5">
                            <span className="text-[9px] font-bold text-indigo-700 block">ردك وتحديثك السابق:</span>
                            <p className="font-medium">{task.studentResponse}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>تاريخ التكليف: {task.assignedAt}</span>
                          {task.status !== 'completed' ? (
                            <button
                              onClick={() => {
                                setActiveTaskToRespond(task);
                                setTaskResponseText(task.studentResponse || '');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>تحديث الإنجاز والرد</span>
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تم الإنجاز في {task.resolvedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 🚨 SUBTAB 2: RAISE PRIVATE ALERT TO TEACHER */}
            {commSubTab === 'alert' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Submit Alert Form */}
                <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      رفع تنبيه خاص لفضيلة المعلم ({studentProfile.teacherName})
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">يمكنك إرسال تنبيه خاص وسري بخصوص غياب طارئ، صعوبة في حفظ سورة، أو ظرف خاص.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newAlertForm.title.trim() || !newAlertForm.details.trim()) return;

                      const createdAlert: StudentPrivateAlert = {
                        id: `st-alert-${Date.now()}`,
                        studentId: studentProfile.id,
                        studentName: studentProfile.name,
                        circleName: studentProfile.circleName,
                        teacherName: studentProfile.teacherName,
                        title: newAlertForm.title,
                        category: newAlertForm.category,
                        urgency: newAlertForm.urgency,
                        details: newAlertForm.details,
                        status: 'sent',
                        createdAt: new Date().toLocaleString('ar-SA')
                      };

                      const updatedList = saveStudentPrivateAlert(createdAlert);
                      setPrivateAlerts(updatedList);
                      setNewAlertForm({ title: '', category: 'absence_excuse', urgency: 'medium', details: '' });
                      setFeedbackMsg('✓ تم رفع التنبيه بنجاح إلى فضيلة المدرس وسيتم الاطلاع عليه واتخاذ الإجراء.');
                      setTimeout(() => setFeedbackMsg(null), 4000);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">تصنيف التنبيه:</label>
                      <select
                        value={newAlertForm.category}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, category: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="absence_excuse">عذر غياب طارئ أو تقديم استئذان</option>
                        <option value="memorization_struggle">صعوبة في حفظ أو تثبيت سورة معينة</option>
                        <option value="health_issue">ظرف صحي أو إجهاد بدني</option>
                        <option value="other">تنبيه آخر خاص بطلاب الحلقة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">عنوان التنبيه المقتضب:</label>
                      <input
                        type="text"
                        required
                        value={newAlertForm.title}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, title: e.target.value })}
                        placeholder="مثال: استئذان عن حلقة الغد لظرف صحي"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">درجة الاستعجال:</label>
                      <div className="flex gap-2 font-bold">
                        {[
                          { id: 'low', label: 'عادي' },
                          { id: 'medium', label: 'متوسط' },
                          { id: 'high', label: 'عاجل جداً' }
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setNewAlertForm({ ...newAlertForm, urgency: u.id as any })}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] cursor-pointer transition-all ${
                              newAlertForm.urgency === u.id
                                ? 'bg-amber-400 text-emerald-950 font-bold border-amber-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">تفاصيل التنبيه والشرح للمعلم:</label>
                      <textarea
                        required
                        value={newAlertForm.details}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, details: e.target.value })}
                        rows={3}
                        placeholder="اكتب توضيحك بالتفصيل لفضيلة المعلم..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال التنبيه للمعلم</span>
                    </button>
                  </form>
                </div>

                {/* Private Alerts History */}
                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    سجل التنبيهات المرفوعة للمعلم والردود
                  </h4>

                  {privateAlerts.length === 0 ? (
                    <p className="text-xs text-slate-400 p-6 bg-slate-50 rounded-2xl text-center font-medium">لم تقم برفع أي تنبيهات خاصة حتى الآن.</p>
                  ) : (
                    <div className="space-y-3">
                      {privateAlerts.map((al) => (
                        <div key={al.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{al.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              al.status === 'reviewed_by_teacher' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {al.status === 'reviewed_by_teacher' ? '✓ تم الاطلاع والرد من المعلم' : '⏳ قيد المراجعة لدى المعلم'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{al.details}</p>
                          
                          {al.teacherReply && (
                            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-0.5 mt-2">
                              <span className="text-[9px] font-bold text-emerald-700 block">توجيه ورد الشيخ ({al.teacherName}):</span>
                              <p className="font-bold">{al.teacherReply}</p>
                            </div>
                          )}

                          <div className="text-[9px] text-slate-400 pt-1">
                            تاريخ الإرسال: {al.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 💡 SUBTAB 3: SUBMIT PROPOSALS TO TEACHER */}
            {commSubTab === 'proposal' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Submit Proposal Form */}
                <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      تقديم مقترح خاص لفضيلة المعلم ({studentProfile.teacherName})
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">شارك بأفكارك ومقترحاتك لتطوير الحلقة، تنظيم المراجعات، أو المسابقات التشجيعية.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newProposalForm.title.trim() || !newProposalForm.proposalText.trim()) return;

                      const createdProp: StudentProposal = {
                        id: `st-prop-${Date.now()}`,
                        studentId: studentProfile.id,
                        studentName: studentProfile.name,
                        circleName: studentProfile.circleName,
                        teacherName: studentProfile.teacherName,
                        title: newProposalForm.title,
                        category: newProposalForm.category,
                        proposalText: newProposalForm.proposalText,
                        status: 'under_review',
                        createdAt: new Date().toLocaleString('ar-SA')
                      };

                      const updatedList = saveStudentProposal(createdProp);
                      setProposals(updatedList);
                      setNewProposalForm({ title: '', category: 'revision_group', proposalText: '' });
                      setFeedbackMsg('✓ تم إرسال مقترحك البناء للمعلم، نشكر لك حرصك واهتمامك برقي الحلقة.');
                      setTimeout(() => setFeedbackMsg(null), 4000);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">مجال المقترح:</label>
                      <select
                        value={newProposalForm.category}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, category: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="revision_group">تنظيم مجموعات مراجعة ثنائية بين الطلاب</option>
                        <option value="competition_idea">فكرة مسابقة تحفيزية وتسميع بالمكافآت</option>
                        <option value="circle_activity">نشاط اجتماعي أو علمي إضافي للحلقة</option>
                        <option value="schedule_suggestion">مقترح تعديل جدول أوقات التسميع</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">عنوان الفكرة المبتكرة:</label>
                      <input
                        type="text"
                        required
                        value={newProposalForm.title}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, title: e.target.value })}
                        placeholder="مثال: مقترح جلسة مراجعة سريعة قبل صلاة المغرب"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">نص وجوهر المقترح:</label>
                      <textarea
                        required
                        value={newProposalForm.proposalText}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, proposalText: e.target.value })}
                        rows={4}
                        placeholder="شرح الفكرة وآلية تنفيذها المتوقعة بالحل..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال المقترح للمعلم</span>
                    </button>
                  </form>
                </div>

                {/* Proposals History */}
                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    سجل مقترحاتك وملاحظات المعلم
                  </h4>

                  {proposals.length === 0 ? (
                    <p className="text-xs text-slate-400 p-6 bg-slate-50 rounded-2xl text-center font-medium">لم تقدم أي مقترحات حتى الآن. يسعدنا استقبال أفكارك دائماً.</p>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map((pr) => (
                        <div key={pr.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{pr.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              pr.status === 'accepted' || pr.status === 'implemented' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pr.status === 'accepted' ? '✓ مقترح مقبول ومرحّب به' : pr.status === 'implemented' ? '🎉 تم التطبيق بنجاح' : '⏳ قيد الدراسة والدراسة'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{pr.proposalText}</p>
                          
                          {pr.teacherFeedback && (
                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-0.5 mt-2">
                              <span className="text-[9px] font-bold text-amber-800 block">انطباع المعلم ({pr.teacherName}):</span>
                              <p className="font-bold">{pr.teacherFeedback}</p>
                            </div>
                          )}

                          <div className="text-[9px] text-slate-400 pt-1">
                            تاريخ التقديم: {pr.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 🤝 SUBTAB 4: REQUEST PRIVATE SESSION WITH TEACHER */}
            {commSubTab === 'session' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Submit Session Request Form */}
                <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      طلب جلسة خاصة وتسميع فردي مع الشيخ ({studentProfile.teacherName})
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      احجز جلسة خاصة لتدارك تعثر في الحفظ، سبر مراجعة كبرى، ضبط أحكام التجويد، أو استشارة تربوية فردية.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newSessionForm.topic.trim() || !newSessionForm.struggleDetails.trim()) return;

                      const createdSession: StudentPrivateSessionRequest = {
                        id: `st-sess-${Date.now()}`,
                        studentId: studentProfile.id,
                        studentName: studentProfile.name,
                        circleName: studentProfile.circleName,
                        teacherName: studentProfile.teacherName,
                        topic: newSessionForm.topic,
                        sessionType: newSessionForm.sessionType,
                        struggleDetails: newSessionForm.struggleDetails,
                        targetSurahs: newSessionForm.targetSurahs || 'غير محدد',
                        preferredTime: newSessionForm.preferredTime || 'حسب تنسيق الشيخ',
                        urgency: newSessionForm.urgency,
                        status: 'pending',
                        createdAt: new Date().toLocaleString('ar-SA')
                      };

                      const updatedList = saveStudentSessionRequest(createdSession);
                      setSessionRequests(updatedList);
                      setNewSessionForm({
                        topic: '',
                        sessionType: 'struggle_remedy',
                        struggleDetails: '',
                        targetSurahs: '',
                        preferredTime: '',
                        urgency: 'high'
                      });
                      setFeedbackMsg('✓ تم إرسال طلب الجلسة الخاصة بنجاح لفضيلة المعلم، وسيصلك إشعار بالموعد المعتمد.');
                      setTimeout(() => setFeedbackMsg(null), 4500);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">نوع الجلسة المطلوبة:</label>
                      <select
                        value={newSessionForm.sessionType}
                        onChange={(e) => setNewSessionForm({ ...newSessionForm, sessionType: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="struggle_remedy">معالجة تعثر وصعوبة في حفظ أو تثبيت سورة</option>
                        <option value="major_revision">سبر وتثبيت مراجعة كبرى قبل الاختبار</option>
                        <option value="tajweed_drill">تدريب مكثف على مخارج الحروف وأحكام التجويد</option>
                        <option value="counseling">استشارة وتوجيه تربوي وسلوكي فردي</option>
                        <option value="general">أخرى (جلسة خاصة عامة)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">عنوان الموضوع أو الطلب:</label>
                      <input
                        type="text"
                        required
                        value={newSessionForm.topic}
                        onChange={(e) => setNewSessionForm({ ...newSessionForm, topic: e.target.value })}
                        placeholder="مثال: جلسة فردية لمعالجة تشابهات سورة النساء"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        تحديد المشكلة وتفاصيل الصعوبة بدقة لتمكين الشيخ من الإعداد:
                      </label>
                      <textarea
                        required
                        value={newSessionForm.struggleDetails}
                        onChange={(e) => setNewSessionForm({ ...newSessionForm, struggleDetails: e.target.value })}
                        rows={3}
                        placeholder="اشرح المشكلة بالتفصيل (مثل: الخلط بين أواخر الآيات، صعوبة في ضبط الإخفاء الشفوي، الحاجة لسبر 3 أجزاء متتالية...)"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">السور أو الأجزاء المعنية:</label>
                        <input
                          type="text"
                          value={newSessionForm.targetSurahs}
                          onChange={(e) => setNewSessionForm({ ...newSessionForm, targetSurahs: e.target.value })}
                          placeholder="مثال: سورة البقرة / جزء عم"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">الوقت المفضل المقترح:</label>
                        <input
                          type="text"
                          value={newSessionForm.preferredTime}
                          onChange={(e) => setNewSessionForm({ ...newSessionForm, preferredTime: e.target.value })}
                          placeholder="مثال: بعد صلاة المغرب / قبل الحلقة"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">مستوى الأولوية:</label>
                      <div className="flex gap-2 font-bold">
                        {[
                          { id: 'normal', label: 'اعتيادي' },
                          { id: 'medium', label: 'متوسط' },
                          { id: 'high', label: 'عاجل ومهم' }
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setNewSessionForm({ ...newSessionForm, urgency: u.id as any })}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] cursor-pointer transition-all ${
                              newSessionForm.urgency === u.id
                                ? 'bg-amber-400 text-emerald-950 font-bold border-amber-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال طلب الجلسة للمعلم</span>
                    </button>
                  </form>
                </div>

                {/* Session Requests History */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      سجل طلبات الجلسات الخاصة والمواعيد المعتمدة ({sessionRequests.length})
                    </h4>
                    <button
                      onClick={() => setSessionRequests(getStoredStudentSessionRequests())}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>تحديث المواعيد</span>
                    </button>
                  </div>

                  {sessionRequests.length === 0 ? (
                    <p className="text-xs text-slate-400 p-6 bg-slate-50 rounded-2xl text-center font-medium">
                      لم تقدم أي طلبات جلسات خاصة حتى الآن. يمكنك رفع طلب لتثبيت الحفظ والتسميع الفردي.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sessionRequests.map((sess) => {
                        const typeLabels: Record<string, string> = {
                          struggle_remedy: 'معالجة تعثر وصعوبة',
                          major_revision: 'سبر ومراجعة كبرى',
                          tajweed_drill: 'تدريب مخارج وتجويد',
                          counseling: 'استشارة وتوجيه تربوي',
                          general: 'جلسة خاصة'
                        };

                        return (
                          <div 
                            key={sess.id} 
                            className={`p-4 rounded-2xl border space-y-3 transition-all ${
                              sess.status === 'scheduled' || sess.status === 'accepted'
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                                : sess.status === 'completed'
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {typeLabels[sess.sessionType] || sess.sessionType}
                                  </span>

                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    sess.status === 'scheduled' || sess.status === 'accepted'
                                      ? 'bg-emerald-600 text-white font-extrabold shadow-2xs animate-pulse'
                                      : sess.status === 'completed'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-amber-100 text-amber-800 font-bold'
                                  }`}>
                                    {sess.status === 'scheduled' || sess.status === 'accepted'
                                      ? '🟢 تم اعتماد وتحديد الموعد من الشيخ'
                                      : sess.status === 'completed'
                                      ? '✓ تم إنجاز الجلسة'
                                      : '🔴 بانتظار رد واعتماد الشيخ'}
                                  </span>

                                  {sess.urgency === 'high' && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                      عاجل
                                    </span>
                                  )}
                                </div>

                                <h5 className="font-bold text-xs text-slate-900 mt-1">{sess.topic}</h5>
                              </div>
                            </div>

                            {/* Details box */}
                            <div className="p-3 bg-white/90 rounded-xl border border-slate-150 space-y-1.5 text-xs text-slate-700 font-medium">
                              <p className="leading-relaxed text-slate-800">{sess.struggleDetails}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                                {sess.targetSurahs && (
                                  <span>📖 <strong>السور/الأجزاء:</strong> {sess.targetSurahs}</span>
                                )}
                                {sess.preferredTime && (
                                  <span>🕒 <strong>الوقت المفضل:</strong> {sess.preferredTime}</span>
                                )}
                              </div>
                            </div>

                            {/* Teacher confirmation / schedule */}
                            {(sess.scheduledDate || sess.teacherNote) && (
                              <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-300 space-y-1 text-xs">
                                {sess.scheduledDate && (
                                  <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-[11.5px]">
                                    <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>الموعد المعتمد للجلسة: {sess.scheduledDate}</span>
                                  </div>
                                )}
                                {sess.teacherNote && (
                                  <p className="text-[11px] text-emerald-900 font-medium">
                                    <strong>توجيه الشيخ ({sess.teacherName}):</strong> {sess.teacherNote}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>تاريخ تقديم الطلب: {sess.createdAt}</span>
                              <span className="font-medium text-slate-500">مدرس الحلقة: {sess.teacherName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Task Response Modal */}
            <AnimatePresence>
              {activeTaskToRespond && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 shadow-2xl text-right text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        تحديث وتدوين إنجاز المهمة المكلفة
                      </h3>
                      <button onClick={() => setActiveTaskToRespond(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">المهمة المكلف بها:</span>
                      <p className="font-bold text-slate-800">{activeTaskToRespond.title}</p>
                      <p className="text-[11px] text-slate-600">{activeTaskToRespond.requiredAction}</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">اكتب ملخص ما قمت به والإنجاز الفعلي للمعلم:</label>
                      <textarea
                        value={taskResponseText}
                        onChange={(e) => setTaskResponseText(e.target.value)}
                        rows={3}
                        placeholder="مثال: تم إتمام حفظ الورد وإنجاز التسميع الثنائي مع الزميل أسامة..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          const updated = updateStudentTaskStatus(activeTaskToRespond.id, 'completed', taskResponseText || 'تم التنفيذ بنجاح.');
                          setAssignedTasks(updated);
                          setActiveTaskToRespond(null);
                          setFeedbackMsg('✓ تم تسجيل تم الإنجاز وإرسال التحديث للمعلم بنجاح!');
                          setTimeout(() => setFeedbackMsg(null), 4000);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>اعتماد وإغلاق المهمة كمكتملة</span>
                      </button>

                      <button
                        onClick={() => {
                          const updated = updateStudentTaskStatus(activeTaskToRespond.id, 'in_progress', taskResponseText || 'جارِ العمل والإنجاز.');
                          setAssignedTasks(updated);
                          setActiveTaskToRespond(null);
                          setFeedbackMsg('✓ تم تحديث حالة المهمة لقيد التنفيذ وتنبيه المعلم.');
                          setTimeout(() => setFeedbackMsg(null), 4000);
                        }}
                        className="px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold py-2.5 rounded-xl transition-all cursor-pointer border border-indigo-200"
                      >
                        تسجيل كـ قيد التنفيذ
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

      </div>

      {/* 📜 CERTIFICATE MODAL VIEW */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowCertificate(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-3xl overflow-hidden relative z-10"
              id="certificate-print-modal"
            >
              <div className="bg-emerald-900 text-white p-4 flex items-center justify-between border-b border-emerald-800">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-300" />
                  <span className="font-bold text-xs sm:text-sm font-display">شهادة الأداء التربوي والقرآني الشاملة</span>
                </div>
                <button 
                  onClick={() => setShowCertificate(false)}
                  className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              {/* Certificate Canvas Sheet */}
              <div className="p-8 sm:p-12 text-slate-800 text-center space-y-6 relative" id="certificate-print-canvas">
                {/* Visual Borders */}
                <div className="absolute inset-4 border-2 border-emerald-800/10 rounded-xl pointer-events-none" />
                <div className="absolute inset-6 border border-amber-400/20 rounded-lg pointer-events-none" />
                
                {/* Header Info */}
                <div className="flex justify-between items-start text-right text-[10px] text-slate-500 font-bold font-mono">
                  <div>
                    <p>الرقم: STU-1447-089</p>
                    <p>التاريخ: ١٥ محرم ١٤٤٨ هـ</p>
                    <p>المستند: شهادة معتمدة</p>
                  </div>
                  <div className="text-left font-display">
                    <p>المملكة العربية السعودية</p>
                    <p>جمعية تحفيظ القرآن بالرياض (مكْنون)</p>
                    <p>ملتقى الهدى القرآني النموذجي</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-200">
                    <Award className="h-6 w-6 shrink-0" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black font-display tracking-tight text-emerald-900">شهادة تميز في حفظ القرآن الكريم وتجويده</h3>
                  <p className="text-xs text-slate-400 font-medium">مستخرجة من لوحة الطالب الرسمية للعام الدراسي الحالي ١٤٤٧ هـ</p>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed max-w-xl mx-auto text-slate-700 font-medium">
                  يتقدم مجلس إدارة <strong className="text-emerald-950 font-bold">ملتقى الهدى القرآني النموذجي</strong> بوافر الشكر والتقدير والتهاني القلبية الحارة للطالب المتميز والمثابر:
                </p>

                <h4 className="text-lg sm:text-2xl font-black text-amber-500 font-display py-2 border-b border-dashed border-slate-200 max-w-md mx-auto">
                  {studentProfile.name}
                </h4>

                <p className="text-xs sm:text-sm leading-relaxed max-w-xl mx-auto text-slate-700 font-medium font-display">
                  نظير مستواه الرفيع والمشرف في <strong className="text-emerald-900">{studentProfile.circleName}</strong> وتحقيقه مقدار حفظ تراكمي راسخ قدره <strong className="text-emerald-950">{kpis[0].value}</strong> بنسبة انضباط يومي متميزة بلغت <strong className="text-emerald-950">{kpis[1].value}</strong>، ونتائج اختبارات فصلية ممتازة بمتوسط درجات <strong className="text-emerald-950">٩٨ / ١٠٠</strong>.
                </p>

                {/* Score breakdown metrics inside the printed sheet */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-center py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-slate-400 text-[9px] font-bold">نسبة الحضور</p>
                    <p className="text-xs font-black text-emerald-900">{kpis[2].value}</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <p className="text-slate-400 text-[9px] font-bold">الحفظ الإجمالي</p>
                    <p className="text-xs font-black text-emerald-900">{kpis[0].value}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[9px] font-bold">رصيد الأوسمة</p>
                    <p className="text-xs font-black text-emerald-900">{kpis[3].value}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 italic">
                  "نسأل الله عز وجل أن يجعله من أهل القرآن الكريم الذين هم أهل الله وخاصته، وأن ينفع به والديه ودينه ووطنه."
                </p>

                {/* Seal & Signatures */}
                <div className="flex justify-between items-center pt-6 text-[11px] font-bold max-w-lg mx-auto text-slate-700">
                  <div className="space-y-1 text-right">
                    <p>مدرس الحلقة:</p>
                    <p className="text-slate-500 text-[10px]">{studentProfile.teacherName}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-amber-400/30 rounded-full flex items-center justify-center text-[10px] font-black text-amber-500 rotate-12 bg-amber-50/50 uppercase select-none">
                      الختم المعتمد
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <p>المدير العام للملتقى:</p>
                    <p className="text-slate-500 text-[10px]">{studentProfile.supervisorName}</p>
                  </div>
                </div>

              </div>

              {/* Action buttons inside certificate view */}
              <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة الشهادة الرسمية</span>
                </button>
                <button 
                  onClick={() => setShowCertificate(false)}
                  className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
