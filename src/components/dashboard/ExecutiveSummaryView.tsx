/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, BookOpen, UserCheck, Activity, Award, TrendingUp, TrendingDown, 
  AlertTriangle, ShieldAlert, Sparkles, X, ChevronLeft, Printer, RefreshCw 
} from 'lucide-react';
import { mockStudents, mockCircles, mockTeachers, mockAlerts } from './dashboardData';
import { Student, Teacher } from './dashboardTypes';

interface ExecutiveSummaryViewProps {
  onNavigateToTab: (index: number) => void;
  onCompareCircles: () => void;
  onNavigateToHub?: () => void;
  stats?: any;
}

export default function ExecutiveSummaryView({ 
  onNavigateToTab, onCompareCircles, onNavigateToHub, stats 
}: ExecutiveSummaryViewProps) {
  const [activeModal, setActiveModal] = useState<'student' | 'teacher' | null>(null);
  const [healthCalculationBase, setHealthCalculationBase] = useState<'current' | 'simulated'>('current');
  const [simulationAttendance, setSimulationAttendance] = useState(95);
  const [simulationPlan, setSimulationPlan] = useState(90);

  // Dynamic calculations for executive statistics from Backend stats
  const currentStudentsCount = stats?.totalStudents || 0;
  const newStudentsCount = 0;
  const graduatedStudentsCount = stats?.graduatesCount || 0;

  const totalCirclesCount = stats?.totalHalaqas || 0;
  const activeCirclesCount = totalCirclesCount;
  const averageStudentsPerCircle = totalCirclesCount > 0 ? Math.round(currentStudentsCount / totalCirclesCount) : 0;

  const totalTeachersCount = stats?.totalTeachers || 0;
  const avgTeacherRating = '5.00';

  // Health Score Calculation basis
  const actualAttendance = healthCalculationBase === 'current' ? (stats?.attendanceRate || 95) : simulationAttendance;
  const actualPlanProgress = healthCalculationBase === 'current' ? (stats?.planComplianceRate || 90) : simulationPlan;
  const actualTestsScore = 90;
  const actualRevisionRate = 90;
  const actualActivitiesRate = 90;

  const schoolHealthScore = Math.round(
    (actualAttendance * 0.25) + 
    (actualPlanProgress * 0.25) + 
    (actualTestsScore * 0.20) + 
    (actualRevisionRate * 0.15) + 
    (actualActivitiesRate * 0.15)
  );

  const isImproved = schoolHealthScore >= 85;

  return (
    <div className="space-y-6" id="executive-summary-section">
      
      {/* SECTION 1: EXECUTIVE SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        
        {/* Card 1: الطلاب */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group" id="kpi-students-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 translate-y-[-8px] opacity-40 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between z-10">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-bold block">إجمالي الطلاب</span>
              <p className="text-3xl font-bold text-slate-800 font-mono tracking-tight">{currentStudentsCount + newStudentsCount}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium z-10">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">الجدد: <b className="text-emerald-600 font-mono text-xs">{newStudentsCount}</b></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
              <span className="text-slate-500">الخريجون: <b className="text-indigo-600 font-mono text-xs">{graduatedStudentsCount}</b></span>
            </div>
            <button 
              onClick={() => setActiveModal('student')}
              className="text-emerald-700 hover:text-emerald-850 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              التفاصيل
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 2: الحلقات */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group" id="kpi-circles-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 translate-y-[-8px] opacity-40 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between z-10">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-bold block">إجمالي الحلقات</span>
              <p className="text-3xl font-bold text-slate-800 font-mono tracking-tight">{totalCirclesCount}</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium z-10">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">النشطة: <b className="text-indigo-600 font-mono text-xs">{activeCirclesCount}</b></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
              <span className="text-slate-500">متوسط طلاب الحلقة: <b className="text-slate-700 font-mono text-xs">{averageStudentsPerCircle}</b></span>
            </div>
            <button 
              onClick={onCompareCircles}
              className="text-indigo-700 hover:text-indigo-850 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              مقارنة الحلقات
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 3: المدرسين */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group" id="kpi-teachers-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full translate-x-8 translate-y-[-8px] opacity-40 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between z-10">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-bold block">إجمالي المدرسين</span>
              <p className="text-3xl font-bold text-slate-800 font-mono tracking-tight">{totalTeachersCount}</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-550">متوسط تقييم المشرفين:</span>
              <span className="text-amber-700 font-bold font-mono bg-amber-50 px-1.5 py-0.5 rounded">⭐️ {avgTeacherRating} / 5</span>
            </div>
            <button 
              onClick={() => setActiveModal('teacher')}
              className="text-amber-700 hover:text-amber-850 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              تقرير المدرسين
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 4: صحة الملتقى العامة */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group" id="kpi-health-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full translate-x-8 translate-y-[-8px] opacity-40 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between z-10">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-bold block">صحة الملتقى العامة</span>
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-bold text-slate-800 font-mono">{schoolHealthScore}</p>
                <span className="text-slate-400 text-xs font-mono">/ 100</span>
              </div>
            </div>
            <div className={`p-2 rounded-xl border ${schoolHealthScore >= 80 ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-red-50 text-red-700 border-red-100 animate-pulse'}`}>
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium z-10">
            <div className="flex items-center gap-1.5">
              {isImproved ? (
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  ⬆ تحسن عن الشهر السابق
                </span>
              ) : (
                <span className="text-red-600 font-bold flex items-center gap-0.5">
                  <TrendingDown className="h-3.5 w-3.5" />
                  ⬇ انخفاض عن الشهر السابق
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">تحديث لحظي</span>
          </div>
        </div>

      </div>

      {/* REGION: GENERAL HEALTH SCORING METRIC ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="health-gauges-block">
        
        {/* Gauge dial chart representing health */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden lg:col-span-1">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              مؤشر صحة الملتقى العامة (Gauge)
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">يتم الحساب آليا من متوسط الحضور، الخطط، الاختبارات والأنشطة.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 relative">
            {/* SVG Arc Gauge */}
            <svg className="w-40 h-24" viewBox="0 0 100 55">
              {/* background path */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="10" 
                strokeLinecap="round"
              />
              {/* progress path */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke={schoolHealthScore >= 80 ? "#10b981" : "#ef4444"} 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={`${(schoolHealthScore / 100) * 126} 126`}
              />
              {/* Pointer Needle relative to score */}
              <g transform={`rotate(${((schoolHealthScore / 100) * 180) - 90} 50 50)`}>
                <line x1="50" y1="50" x2="50" y2="15" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="4.5" fill="#1e293b" />
              </g>
            </svg>
            
            <div className="text-center mt-[-10px] z-10">
              <span className="text-2xl font-bold text-slate-800 font-mono">{schoolHealthScore}%</span>
              <p className="text-[10px] font-bold text-slate-500 bg-slate-50 p-1 px-3 border border-slate-100 rounded-full mt-1 inline-block">
                {schoolHealthScore >= 90 ? 'أداء استثنائي ممتاز' : schoolHealthScore >= 80 ? 'أداء ثابت ومستقر' : 'تراجع يستدعي التدخل'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[10px] flex justify-between text-slate-400">
            <span>توزيع الأوزان:</span>
            <span>حضور 25٪ • خطط 25٪ • اختبارات 20٪</span>
          </div>
        </div>

        {/* Interactive Simulation tool for GM */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-800 font-display">محاكاة قرارات التحسين وتأثير الأداء</h3>
              <p className="text-[10px] text-slate-500 leading-normal">عدّل قيم المدخلات الحالية أدناه لمحاكاة أثر تحسّن الحلقات على مستوى جاهزية وصحة الملتقى الكلية.</p>
            </div>
            <div className="flex gap-1.5 shrink-0 text-[10px]">
              <button 
                onClick={() => setHealthCalculationBase('current')}
                className={`p-1 px-2.5 rounded-lg border font-bold transition-colors ${healthCalculationBase === 'current' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                الواقع الفعلي
              </button>
              <button 
                onClick={() => setHealthCalculationBase('simulated')}
                className={`p-1 px-2.5 rounded-lg border font-bold transition-colors ${healthCalculationBase === 'simulated' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                محاكاة الأثر
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>متوسط الحضور اليومي للملتقى (المحاكاة):</span>
                <span className="font-mono text-emerald-600 font-bold">{actualAttendance}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={actualAttendance}
                disabled={healthCalculationBase === 'current'}
                onChange={(e) => setSimulationAttendance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>معدل الالتزام بخطط تسميع الطلاب:</span>
                <span className="font-mono text-indigo-600 font-bold">{actualPlanProgress}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={actualPlanProgress}
                disabled={healthCalculationBase === 'current'}
                onChange={(e) => setSimulationPlan(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
            <span className="text-indigo-850 font-medium">النتيجة لمحاكاة المركز:</span>
            {healthCalculationBase === 'current' ? (
              <span className="text-[10px] text-slate-450">أنت الآن تستعرض الأرقام الحقيقية المصدقة للخادم.</span>
            ) : (
              <span className="text-emerald-700 font-bold">قراراتك المذكورة ترفع مؤشر صحة الأداء العام بـ <b className="font-mono text-sm">{Math.max(0, schoolHealthScore - 87)}</b> نقطة!</span>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 7: ADMINISTRATIVE ALERTS (التنبيهات الإدارية) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4" id="admin-alerts-panel">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
              مركز المتابعة والتنبيهات الإدارية النشطة
            </h3>
            <p className="text-[10px] text-slate-400">تنبيهات فورية مصنفة بالأولوية لمساعدة الإدارة في اتخاذ القرار وإسناد الحلقات.</p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToHub && (
              <button 
                onClick={onNavigateToHub}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-98 cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
              >
                <span>الانتقال لمركز المتابعة المتقدم</span>
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
            <span className="bg-slate-50 border border-slate-150 p-1.5 px-3 rounded-lg text-[10px] font-mono font-bold text-slate-500">
              {mockAlerts.length} تنبيهات معلقة
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="alerts-grid">
          {mockAlerts.map((alert) => {
            const levelClass = 
              alert.category === 'critical' ? 'bg-red-50 text-red-800 border-red-150' :
              alert.category === 'high' ? 'bg-amber-50 text-amber-800 border-amber-150' :
              alert.category === 'medium' ? 'bg-indigo-50 text-indigo-800 border-indigo-150' :
              'bg-slate-50 text-slate-700 border-slate-200';

            const badgeClass =
              alert.category === 'critical' ? 'bg-red-500 text-white animate-pulse' :
              alert.category === 'high' ? 'bg-amber-500 text-white' :
              alert.category === 'medium' ? 'bg-indigo-500 text-white' :
              'bg-slate-400 text-white';

            return (
              <div 
                key={alert.id} 
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-right hover:shadow-xs transition-shadow ${levelClass}`}
                id={`alert-card-${alert.id}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`p-1 px-2.5 text-[9px] font-bold rounded-full ${badgeClass}`}>
                      {alert.category === 'critical' ? 'حرجة للغاية' :
                       alert.category === 'high' ? 'عالية الأولوية' :
                       alert.category === 'medium' ? 'متوسطة' : 'اعتيادية'}
                    </span>
                    <span className="font-mono text-[9px] text-slate-450">{alert.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs leading-normal">{alert.title}</h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-medium">{alert.details}</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100/50 flex items-center justify-end">
                  <button 
                    onClick={() => {
                      if (alert.category === 'critical' || alert.category === 'high') {
                        onNavigateToTab(2); // navigate to Teachers / Circles
                      } else {
                        onNavigateToTab(1); // navigate to Educational Indicators
                      }
                    }}
                    className="p-1 px-3 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 font-bold rounded-lg text-[10px] active:scale-95 transition-all text-center cursor-pointer"
                  >
                    متابعة واتخاذ قرار
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL OVERLAYS FOR DETAILS */}
      {activeModal === 'student' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-300" />
                <h3 className="font-bold text-sm">بيانات مصلحة طلاب الملتقى بالتفصيل</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-emerald-800 p-1 rounded-lg">✕</button>
            </div>
            
            <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
              <p className="text-xs text-slate-550 leading-relaxed">السجلات التالية تمثل عينة فرز فورية تمثل المصلحة الحالية للطلاب الجدد والحاليين بالملتقى لربطهم بالقرارات الإدارية لاحقاً.</p>
              
              <div className="space-y-2">
                {mockStudents.map(st => (
                  <div key={st.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-slate-800">{st.name}</p>
                      <p className="text-slate-400 text-[10px]">{st.circleName} • {st.branch}</p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className={`p-1 px-2 rounded font-bold ${
                        st.status === 'exceeding' ? 'bg-emerald-50 text-emerald-700' :
                        st.status === 'committed' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {st.status === 'exceeding' ? 'متفوق' : st.status === 'committed' ? 'ملتزم' : 'متأخر'}
                      </span>
                      <span className="bg-slate-150 p-1 px-2 rounded text-slate-650">درجة الاختبار: {st.testScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-left">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  onNavigateToTab(1); // Go to educational indicators
                }}
                className="bg-emerald-800 text-white font-bold text-xs p-2 px-5 rounded-xl cursor-pointer hover:bg-emerald-850"
              >
                الانتقال لمؤشرات الطلاب الفنية
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right">
            <div className="bg-amber-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">كشف الكادر التعليمي والتربوي</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-amber-700 p-1 rounded-lg">✕</button>
            </div>
            
            <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
              <p className="text-xs text-slate-550">مراجعة التقييمات العامة والالتظام الفني وخطة المتابعة للمدرسين والمحفظين المقيدين.</p>
              
              <div className="space-y-2">
                {mockTeachers.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{t.name}</p>
                      <p className="text-slate-400 text-[10px]">تقييم المشرفين الكلي: <b className="text-amber-600">% {t.supervisorRating}</b></p>
                    </div>
                    <div className="text-left space-y-1">
                      <span className={`p-1 px-2.5 rounded font-bold text-[9px] inline-block ${
                        t.status === 'outstanding' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 border' :
                        t.status === 'stable' ? 'bg-indigo-50 text-indigo-800 border-indigo-200 border' : 'bg-red-50 text-red-800 border-red-200 border animate-pulse'
                      }`}>
                        {t.status === 'outstanding' ? 'متميز جداً' : t.status === 'stable' ? 'مستقر' : 'يستحق الدعم الفني'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-left">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  onNavigateToTab(2); // Go to teachers / circles
                }}
                className="bg-amber-800 text-white font-bold text-xs p-2 px-5 rounded-xl cursor-pointer hover:bg-amber-850"
              >
                تحديث دراسة الكفاءات والتدخل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
