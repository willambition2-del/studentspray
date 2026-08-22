/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Award, BookOpen, Users, Activity, TrendingUp, TrendingDown, Calendar, Clock, 
  Sparkles, ShieldCheck, ChevronLeft, ChevronRight, HelpCircle, UserX, Eye, X, CheckCircle2,
  PieChart, BarChart3, UserCheck, AlertCircle, Compass
} from 'lucide-react';
import { mockGraduates, mockMonthlyTrends, academicYearComp } from './dashboardData';

export interface DisconnectedGraduate {
  id: string;
  name: string;
  year: string;
  reason: string;
  contact: string;
  lastSeen: string;
  circleName: string;
}

export interface FullQuranExamGraduate {
  id: string;
  name: string;
  year: string;
  score: number;
  rating: string;
  committee: string;
  examDate: string;
}

export default function GraduatesTimelineView() {
  const [activeComparisonMode, setActiveComparisonMode] = useState<'months' | 'years'>('months');
  const [simulationGraduateBatch, setSimulationGraduateBatch] = useState<'all' | '1446' | '1445' | '1444'>('all');
  const [selectedYearRate, setSelectedYearRate] = useState<'1449' | '1448' | '1447'>('1449');
  const [showTooltip, setShowTooltip] = useState<number | null>(null);

  // Modals state
  const [showDisconnectedModal, setShowDisconnectedModal] = useState<boolean>(false);
  const [showFullQuranExamModal, setShowFullQuranExamModal] = useState<boolean>(false);

  const [disconnectedGraduates] = useState<DisconnectedGraduate[]>([]);
  const [fullQuranExamGraduates] = useState<FullQuranExamGraduate[]>([]);

  // Graduation rate calculator by year
  const yearlyGraduationStats = {
    '1449': { yearLabel: '1449 هـ (العام الحالي)', graduates: 58, totalStudents: 320, rate: 18.1 },
    '1448': { yearLabel: '1448 هـ', graduates: 42, totalStudents: 285, rate: 14.7 },
    '1447': { yearLabel: '1447 هـ', graduates: 35, totalStudents: 265, rate: 13.2 },
  };

  // General Cumulative Graduation Rate
  const generalCumulativeStats = {
    totalCumulativeGraduates: 158,
    totalCumulativeStudents: 1050,
    cumulativeRate: 15.0
  };

  // Age Breakdown (Exactly 4 stages requested)
  const ageBreakdown = [
    { label: 'أقل من 15 سنة', count: 12, rate: 20.7, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    { label: 'بين الـ 15 والـ 20 سنة', count: 28, rate: 48.3, color: 'bg-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-900' },
    { label: 'أكبر من 20 سنة', count: 13, rate: 22.4, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800' },
    { label: 'فوق الـ 30 سنة', count: 5, rate: 8.6, color: 'bg-purple-600', bg: 'bg-purple-50', text: 'text-purple-900' },
  ];

  // Filter graduates based on simulated batch
  const filteredGraduates = mockGraduates.filter(g => {
    if (simulationGraduateBatch === 'all') return true;
    return g.year === simulationGraduateBatch;
  });

  // Calculate coordinates for SVG Line Chart 1 (Attendance Trend over 12 Months)
  const attendanceCoords = mockMonthlyTrends.map((t, i) => {
    const x = 30 + (i * 48);
    const val = t.attendanceRate;
    const y = 110 - ((val - 70) * (90 / 30));
    return { x, y, data: t };
  });

  const attendancePath = attendanceCoords.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // Line Chart 2 (Plan Compliance trend over 12 Months)
  const complianceCoords = mockMonthlyTrends.map((t, i) => {
    const x = 30 + (i * 48);
    const val = t.planCompliance;
    const y = 110 - ((val - 70) * (90 / 30));
    return { x, y, data: t };
  });

  const compliancePath = complianceCoords.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="space-y-6" id="graduates-timeline-section">
      
      {/* SECTION 6: GRADUATES AND ALUMNI INDICATORS */}
      <div className="space-y-6" id="graduates-block">
        
        {/* TOP MAIN HEADER CARD: GRADUATES IMPACT & CORE METRICS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-display">رصد وأثر خريجي الملتقى</h4>
                <span className="p-0.5 px-2 bg-emerald-50 text-emerald-800 font-bold text-[9px] rounded-md border border-emerald-200">
                  لوحة التتبع والاستدامة
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                تتبع مستقبلي للأثر الاجتماعي والمهني لطلاب حلقات تحفيظ القرآن الكريم والتحليلات العمرية ونسب التخرج السنوية والعامة.
              </p>
            </div>
          </div>

          {/* GRID OF 6 DETAILED STATISTICAL CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
            
            {/* Stat 1: Total Graduates */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-bold text-[10px]">إجمالي الخريجين</span>
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-slate-900">58 طالباً</p>
                <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">الحفاظ المجازون بالكامل</span>
              </div>
            </div>

            {/* Stat 2: Working in Teaching */}
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-indigo-700">
                <span className="font-bold text-[10px]">العاملون بالتعليم القرآني</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-indigo-950">4 مدرسين</p>
                <span className="text-[9px] text-indigo-700 font-bold block mt-0.5">كوادر تدريسية فعالة</span>
              </div>
            </div>

            {/* Stat 3: Participated in Activities */}
            <div className="p-3.5 bg-amber-50/50 border border-amber-150 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-amber-800">
                <span className="font-bold text-[10px]">مشاركون بالأنشطة كقدوات</span>
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-amber-950">5 خريجين</p>
                <span className="text-[9px] text-amber-700 font-bold block mt-0.5">أنشطة تفاعلية ومجتمعية</span>
              </div>
            </div>

            {/* Stat 4: Still Present as Students in Circles */}
            <div className="p-3.5 bg-teal-50/50 border border-teal-150 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-teal-800">
                <span className="font-bold text-[10px]">متواجدون كطلاب بحلقاتهم</span>
                <UserCheck className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-teal-950">12 خريجاً</p>
                <span className="text-[9px] text-teal-700 font-bold block mt-0.5">مستمرون بحلقات الإجازة والمراجعة</span>
              </div>
            </div>

            {/* Stat 5: Disconnected Graduates + VIEW BUTTON */}
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2 flex flex-col justify-between hover:border-rose-300 transition-all">
              <div className="flex justify-between items-center text-rose-800">
                <span className="font-bold text-[10px]">الخريجون المنقطعون</span>
                <UserX className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-rose-950">6 خريجين</p>
                <span className="text-[9px] text-rose-700 font-bold block mt-0.5">يتطلبون إعادة تواصل واحتواء</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDisconnectedModal(true)}
                className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold p-1.5 px-2 rounded-xl text-[10px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 mt-1"
              >
                <Eye className="h-3 w-3" />
                <span>عرض قائمة المنقطعين</span>
              </button>
            </div>

            {/* Stat 6: Took Full Quran Override Exam + VIEW BUTTON */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex justify-between items-center text-emerald-800">
                <span className="font-bold text-[10px]">اختبروا التجاوز بالكامل</span>
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-mono text-xl font-black text-emerald-950">18 خريجاً</p>
                <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">اجتازوا اختبار المصحف كاملاً</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullQuranExamModal(true)}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold p-1.5 px-2 rounded-xl text-[10px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 mt-1"
              >
                <Eye className="h-3 w-3" />
                <span>عرض خريجي التجاوز</span>
              </button>
            </div>

          </div>

          {/* TWO MAIN SECTION PANELS: GRADUATION RATES & AGE BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-100">
            
            {/* PANEL 1: GRADUATION RATES (SAME YEAR & GENERAL CUMULATIVE) - 6 cols */}
            <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-4 text-right">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2.5">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs text-slate-900 font-display flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-indigo-600" />
                    نسب التخرج السنوية والعامة (Graduation Rates)
                  </h5>
                  <p className="text-[10px] text-slate-500">نسبة الخريجين مقارنة بطلاب نفس العام والدفعة، مع النسبة العامة التراكمية.</p>
                </div>

                {/* Select Year for Same-Year Rate */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[10px]">
                  <span className="text-slate-400 font-bold px-1">العام:</span>
                  {(['1449', '1448', '1447'] as const).map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYearRate(yr)}
                      className={`p-1 px-2.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                        selectedYearRate === yr ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {yr} هـ
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                
                {/* Rate 1: Same-Year Graduation Rate */}
                <div className="p-3.5 bg-white border border-indigo-200 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-sans font-bold text-[11px]">نسبة خريجي نفس العام</span>
                    <span className="bg-indigo-50 text-indigo-800 p-0.5 px-2 rounded-md text-[9px] font-bold">
                      {yearlyGraduationStats[selectedYearRate].yearLabel}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-950">{yearlyGraduationStats[selectedYearRate].rate}%</span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      ({yearlyGraduationStats[selectedYearRate].graduates} خريجاً / {yearlyGraduationStats[selectedYearRate].totalStudents} طالباً)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${yearlyGraduationStats[selectedYearRate].rate}%` }} 
                    />
                  </div>
                </div>

                {/* Rate 2: General Cumulative Rate */}
                <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-sans font-bold text-[11px]">النسبة العامة الشاملة للجميع</span>
                    <span className="bg-emerald-50 text-emerald-800 p-0.5 px-2 rounded-md text-[9px] font-bold">
                      التراكمي العام
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-900">{generalCumulativeStats.cumulativeRate}%</span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      ({generalCumulativeStats.totalCumulativeGraduates} خريجاً / {generalCumulativeStats.totalCumulativeStudents} طالباً كلياً)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                      style={{ width: `${generalCumulativeStats.cumulativeRate}%` }} 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* PANEL 2: AGE BREAKDOWN (4 EXACT STAGES REQUESTED) - 6 cols */}
            <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-4 text-right">
              <div className="space-y-0.5 border-b border-slate-200 pb-2.5">
                <h5 className="font-bold text-xs text-slate-900 font-display flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  معدل الخريجين حسب العمر (أربع مراحل)
                </h5>
                <p className="text-[10px] text-slate-500">التوزيع النسبي للخريجين الحفاظ موزعاً على الفئات العمرية الأربع المعتمدة.</p>
              </div>

              {/* 4 AGE STAGES GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {ageBreakdown.map((stage, idx) => (
                  <div key={idx} className={`p-3 bg-white border border-slate-200 rounded-2xl space-y-1.5 text-center flex flex-col justify-between shadow-2xs`}>
                    <span className="text-[10px] text-slate-600 font-bold block">{stage.label}</span>
                    <div>
                      <p className={`font-mono text-lg font-black ${stage.text}`}>{stage.rate}%</p>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block">({stage.count} خريجين)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${stage.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Historical Tracker of Graduates (التتبع التاريخي للخريجين) */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-800 text-xs font-display">التتبع التاريخي والسلوكي للخريجين</h4>
              <p className="text-[10px] text-slate-400">يدعم السجل ربط الدفعات التاريخية وتقصي المخرجات في سوق العمل القرآني.</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-1 rounded-lg text-[10px]">
              <span className="text-slate-500 font-bold px-1.5">فرز الدفعة:</span>
              <select 
                value={simulationGraduateBatch}
                onChange={(e) => setSimulationGraduateBatch(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">كافة الحفاظ</option>
                <option value="1446">دفعة 1446 هـ</option>
                <option value="1445">دفعة 1445 هـ</option>
                <option value="1444">دفعة 1444 هـ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs" id="graduates-scroll-list">
            {filteredGraduates.map((g) => (
              <div key={g.id} className="p-3 bg-slate-50/75 border border-slate-150 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-850">{g.name}</p>
                  <p className="text-slate-400 text-[10px]">خريج دفعة عام: <b className="font-mono text-indigo-700">{g.year} هـ</b></p>
                </div>
                <div className="text-left font-mono text-[9px] space-y-1">
                  <span className={`p-0.5 px-2 rounded-md font-bold block ${
                    g.worksInQuranicEdu ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-150 text-slate-600'
                  }`}>
                    {g.worksInQuranicEdu ? 'عامل في التعليم القرآني' : 'مسار تتبع خارجي'}
                  </span>
                  {g.participatedInAlumniActivities && (
                    <span className="p-0.5 px-2 bg-indigo-50 text-indigo-850 rounded-md font-bold block">مشارك بالأنشطة المساندة</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 8: CHRONOLOGICAL COMPARISONS (مقارنات زمنية وسنوات دراسية) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4" id="chronological-comparisons-block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
              التحليلات والمقارنات الزمنية التراكمية
            </h3>
            <p className="text-[10px] text-slate-400">تحليل معزز للمقارنة الشهرية، الفصلية، السنوية وتفاضل السنوات التدريسية المتتالية.</p>
          </div>

          <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl gap-1 shrink-0 text-xs text-slate-800 font-bold">
            <button 
              onClick={() => setActiveComparisonMode('months')}
              className={`p-1.5 px-3.5 rounded-lg transition-colors cursor-pointer ${activeComparisonMode === 'months' ? 'bg-white text-emerald-950 font-display shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              منحنى مؤشرات الـ 12 شهراً الماضية
            </button>
            <button 
              onClick={() => setActiveComparisonMode('years')}
              className={`p-1.5 px-3.5 rounded-lg transition-colors cursor-pointer ${activeComparisonMode === 'years' ? 'bg-white text-emerald-950 font-display shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              مقارنة السنوات الدراسية (1448 × 1449)
            </button>
          </div>
        </div>

        {/* COMPARATIVE VIEW 1: MONTHLY 12-MONTH SVG CHARTS */}
        {activeComparisonMode === 'months' && (
          <div className="space-y-6" id="rolling-months-charts">
            
            {/* Chart 1: Attendance curve */}
            <div className="bg-slate-50/75 border border-slate-150 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 font-display">1- منحنى الحضور والمواظبة اليومية العامة بالملتقى (آخر 12 شهراً)</span>
                <span className="text-[10px] text-slate-400 font-mono">طيف القياس: 70% إلى 100%</span>
              </div>
              
              <div className="overflow-x-auto">
                <svg className="w-[600px] sm:w-full h-40 bg-white rounded-lg border border-slate-150 p-1" viewBox="0 0 600 130">
                  <line x1="30" y1="20" x2="570" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="50" x2="570" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="110" x2="570" y2="110" stroke="#e2e8f0" strokeWidth="1.5" />
                  
                  <path 
                    d={attendancePath}
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {attendanceCoords.map((p, i) => (
                    <g key={i} className="cursor-pointer group">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4.5" 
                        fill="#059669" 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                        onMouseEnter={() => setShowTooltip(i)}
                        onMouseLeave={() => setShowTooltip(null)}
                      />
                      <text 
                        x={p.x} 
                        y="125" 
                        textAnchor="middle" 
                        className="text-[9px] font-bold text-slate-550 fill-current font-sans"
                      >
                        {p.data.month}
                      </text>
                      
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[9px] font-bold text-emerald-850 fill-current opacity-70 group-hover:opacity-100 font-mono transition-opacity"
                      >
                        {p.data.attendanceRate}%
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Chart 2: Plan compliance curve */}
            <div className="bg-slate-50/75 border border-slate-150 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 font-display">2- منحنى الالتزام والتقدم بخطط التسميع والحفظ المنهجي (آخر 12 شهراً)</span>
                <span className="text-[10px] text-slate-400 font-mono">طيف القياس: 70% إلى 100%</span>
              </div>
              
              <div className="overflow-x-auto">
                <svg className="w-[600px] sm:w-full h-40 bg-white rounded-lg border border-slate-150 p-1" viewBox="0 0 600 130">
                  <line x1="30" y1="20" x2="570" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="50" x2="570" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="110" x2="570" y2="110" stroke="#e2e8f0" strokeWidth="1.5" />
                  
                  <path 
                    d={compliancePath}
                    fill="none" 
                    stroke="#4338ca" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {complianceCoords.map((p, i) => (
                    <g key={i} className="cursor-pointer group">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4.5" 
                        fill="#3730a3" 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                      />
                      <text 
                        x={p.x} 
                        y="125" 
                        textAnchor="middle" 
                        className="text-[9px] font-bold text-slate-550 fill-current font-sans"
                      >
                        {p.data.month}
                      </text>
                      
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[9px] font-bold text-indigo-900 fill-current opacity-70 group-hover:opacity-100 font-mono transition-opacity"
                      >
                        {p.data.planCompliance}%
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

          </div>
        )}

        {/* COMPARATIVE VIEW 2: YEARS (1448 vs 1449 COMPARISON) */}
        {activeComparisonMode === 'years' && (
          <div className="space-y-6" id="years-comparative-block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Year 1448 Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-right space-y-3">
                <h4 className="font-bold text-slate-700 text-xs font-display flex items-center justify-between">
                  <span>العام السابق الدراسي</span>
                  <span className="font-mono bg-slate-200 text-slate-805 p-1 px-2.5 rounded text-[10px]">{academicYearComp.y1448.yearLabel}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-sans">إجمالي الطلاب المقيدين:</span>
                    <span className="text-slate-800 font-bold">{academicYearComp.y1448.totalStudents} طالباً</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">معدل الحضور اليومي:</span>
                    <span className="text-slate-800 font-bold">{academicYearComp.y1448.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">الالتزام بخطط التسميع:</span>
                    <span className="text-slate-800 font-bold">{academicYearComp.y1448.planCompliance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">إجمالي صفحات الحفظ:</span>
                    <span className="text-slate-800 font-bold">{academicYearComp.y1448.memorizedPagesTotal} ص</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">أنشطة فاعلة منفذة:</span>
                    <span className="text-slate-800 font-bold">{academicYearComp.y1448.executedActivities} فعاليات</span>
                  </div>
                </div>
              </div>

              {/* Year 1449 Card */}
              <div className="bg-emerald-50/45 border border-emerald-100 p-4 rounded-xl text-right space-y-3">
                <h4 className="font-bold text-slate-800 text-xs font-display flex items-center justify-between">
                  <span>العام الفعلي الجاري التراكمي</span>
                  <span className="font-mono bg-emerald-100 text-emerald-856 p-1 px-2.5 rounded text-[10px]">{academicYearComp.y1449.yearLabel}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono font-medium text-slate-655">
                  <div className="flex justify-between">
                    <span className="font-sans">إجمالي الطلاب المقيدين:</span>
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      {academicYearComp.y1449.totalStudents} طالباً
                      <span className="text-[10px] text-emerald-600">({Math.round(((320-285)/285)*100)}%+ ⬆)</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">معدل الحضور اليومي:</span>
                    <span className="text-emerald-850 font-bold">{academicYearComp.y1449.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">الالتزام بخطط التسميع:</span>
                    <span className="text-emerald-850 font-bold">{academicYearComp.y1449.planCompliance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">إجمالي صفحات الحفظ:</span>
                    <span className="text-emerald-850 font-bold">{academicYearComp.y1449.memorizedPagesTotal} ص</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">أنشطة فاعلة منفذة:</span>
                    <span className="text-emerald-850 font-bold">{academicYearComp.y1449.executedActivities} فعاليات</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                تحليل اتجاه الأداء ونمو الملتقى القرآني:
              </p>
              <p className="text-slate-550 leading-relaxed font-medium">سجل الملتقى نمواً استثنائياً في السعة الاستيعابية للطلاب بمقدار <b className="text-emerald-600 font-mono">12.2%</b> مقارنة بمسار عام 1448 هـ، صاحبه تحسن ملحوظ في مستوى جودة الإتقان وعدد صفحات الحفظ المنجزة شهرياً بنسبة <b className="text-indigo-600 font-mono">15.5%</b>، مما يمنح الإدارة قرارات حصر الميزانية بكفاءة مثالية.</p>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: DISCONNECTED GRADUATES LIST */}
      {showDisconnectedModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right flex flex-col max-h-[85vh]">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between border-b border-rose-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-800 text-rose-200 rounded-xl">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-display">قائمة الخريجين المنقطعين وتتبع التواصل</h3>
                  <p className="text-[10px] text-rose-200">سجل الخريجين الذين انقطع تواصلهم لمتابعة خطة الاحتواء وإعادة الإدماج</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDisconnectedModal(false)} 
                className="text-slate-200 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">الاسم والحلقة</th>
                      <th className="p-2.5 text-center">الدفعة</th>
                      <th className="p-2.5">سبب الانقطاع</th>
                      <th className="p-2.5 text-center">رقم التواصل</th>
                      <th className="p-2.5 text-center">آخر مشاهدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disconnectedGraduates.map((dg) => (
                      <tr key={dg.id} className="hover:bg-slate-50">
                        <td className="p-2.5 space-y-0.5">
                          <p className="font-bold text-slate-900">{dg.name}</p>
                          <p className="text-[10px] text-slate-400">{dg.circleName}</p>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{dg.year}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">{dg.reason}</td>
                        <td className="p-2.5 text-center font-mono text-slate-800">{dg.contact}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500 text-[10px]">{dg.lastSeen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold text-[11px]">إجمالي الخريجين المنقطعين المسجلين: {disconnectedGraduates.length} خريجاً</span>
              <button 
                type="button"
                onClick={() => setShowDisconnectedModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-4 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL QURAN OVERRIDE EXAM GRADUATES LIST */}
      {showFullQuranExamModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right flex flex-col max-h-[85vh]">
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-900 text-amber-400 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-display">سجل الخريجين المعتمدين باختبار التجاوز بالمصحف كاملًا</h3>
                  <p className="text-[10px] text-emerald-200">الخريجون الذين اجتازوا الاختبار الممركز الشامل للمصحف الشريف كاملاً بنجاح معتمد</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowFullQuranExamModal(false)} 
                className="text-slate-200 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">اسم الخريج</th>
                      <th className="p-2.5 text-center">سنة التخرج</th>
                      <th className="p-2.5 text-center">الدرجة المكتسبة</th>
                      <th className="p-2.5">التقدير الفني</th>
                      <th className="p-2.5">اللجنة المعتمدة</th>
                      <th className="p-2.5 text-center">تاريخ الاجتياز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fullQuranExamGraduates.map((fq) => (
                      <tr key={fq.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{fq.name}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{fq.year}</td>
                        <td className="p-2.5 text-center font-mono font-black text-emerald-800 text-sm">{fq.score}%</td>
                        <td className="p-2.5">
                          <span className="p-0.5 px-2 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                            {fq.rating}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{fq.committee}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500 text-[10px]">{fq.examDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold text-[11px]">إجمالي الخريجين المجتازين لاختبار التجاوز بالمصحف كاملاً: {fullQuranExamGraduates.length} حافظاً</span>
              <button 
                type="button"
                onClick={() => setShowFullQuranExamModal(false)}
                className="bg-emerald-950 hover:bg-slate-900 text-white font-bold p-2 px-5 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
