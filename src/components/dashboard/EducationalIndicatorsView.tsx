/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, Star, ShieldAlert, Award, FileText, 
  Smile, Frown, Users, Activity, Calendar, Compass, ShieldCheck, Edit3, Save, X, Clock 
} from 'lucide-react';
import { mockStudents, mockCircles } from './dashboardData';
import { Student } from './dashboardTypes';

interface EducationalIndicatorsViewProps {
  onAddDecision: (title: string, content: string) => void;
}

export interface ExamGradeRecord {
  id: string;
  studentName: string;
  circleName: string;
  oralScore: number | null; // الدرجة الشفوية من 50
  writtenScore: number | null; // الدرجة التحريرية من 50
  finalScore: number | null; // المجموع من 100
  status: 'tested' | 'untested';
}

export default function EducationalIndicatorsView({ onAddDecision }: EducationalIndicatorsViewProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'lagging' | 'exceeding' | 'committed'>('all');
  const [showDirectActionModal, setShowDirectActionModal] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // State for Curriculum Final Exam Grades Modal & Records
  const [showGradesModal, setShowGradesModal] = useState<boolean>(false);
  const [examSearch, setExamSearch] = useState<string>('');
  const [lastRecordedDate, setLastRecordedDate] = useState<string>('1447/12/10');

  const [examRecords, setExamRecords] = useState<ExamGradeRecord[]>([]);

  // Dynamic Exam Statistics Calculation
  const examStats = useMemo(() => {
    const total = examRecords.length;
    const untested = examRecords.filter(r => r.status === 'untested' || r.finalScore === null).length;
    const untestedRate = total > 0 ? Number(((untested / total) * 100).toFixed(1)) : 0;

    const testedRecords = examRecords.filter(r => r.status === 'tested' && r.finalScore !== null);
    const testedCount = testedRecords.length;

    const sumScores = testedRecords.reduce((acc, r) => acc + (r.finalScore || 0), 0);
    const avgScore = testedCount > 0 ? Number((sumScores / testedCount).toFixed(1)) : 0;

    const passedCount = testedRecords.filter(r => (r.finalScore || 0) >= 60).length;
    const failedCount = testedRecords.filter(r => (r.finalScore || 0) < 60).length;

    const passRate = testedCount > 0 ? Number(((passedCount / testedCount) * 100).toFixed(1)) : 0;
    const failRate = testedCount > 0 ? Number(((failedCount / testedCount) * 100).toFixed(1)) : 0;

    const above90Count = testedRecords.filter(r => (r.finalScore || 0) >= 90).length;
    const above80Count = testedRecords.filter(r => (r.finalScore || 0) >= 80).length;
    const above70Count = testedRecords.filter(r => (r.finalScore || 0) >= 70).length;

    const above90Rate = testedCount > 0 ? Number(((above90Count / testedCount) * 100).toFixed(1)) : 0;
    const above80Rate = testedCount > 0 ? Number(((above80Count / testedCount) * 100).toFixed(1)) : 0;
    const above70Rate = testedCount > 0 ? Number(((above70Count / testedCount) * 100).toFixed(1)) : 0;

    return {
      total,
      untested,
      untestedRate,
      testedCount,
      avgScore,
      passedCount,
      failedCount,
      passRate,
      failRate,
      above90Count,
      above90Rate,
      above80Count,
      above80Rate,
      above70Count,
      above70Rate
    };
  }, [examRecords]);

  // Handler for updating student grade record
  const handleUpdateRecord = (id: string, field: 'oralScore' | 'writtenScore' | 'status', value: any) => {
    setExamRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        let updatedOral = rec.oralScore;
        let updatedWritten = rec.writtenScore;
        let updatedStatus = rec.status;

        if (field === 'oralScore') updatedOral = value !== '' ? Math.min(50, Math.max(0, Number(value))) : null;
        if (field === 'writtenScore') updatedWritten = value !== '' ? Math.min(50, Math.max(0, Number(value))) : null;
        if (field === 'status') updatedStatus = value;

        if (updatedOral === null && updatedWritten === null) {
          updatedStatus = 'untested';
        } else if (updatedOral !== null || updatedWritten !== null) {
          updatedStatus = 'tested';
        }

        let calculatedFinal: number | null = null;
        if (updatedOral !== null || updatedWritten !== null) {
          calculatedFinal = (updatedOral || 0) + (updatedWritten || 0);
        }

        return {
          ...rec,
          oralScore: updatedOral,
          writtenScore: updatedWritten,
          finalScore: calculatedFinal,
          status: updatedStatus
        };
      }
      return rec;
    }));

    const todayStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    setLastRecordedDate(todayStr);
  };

  // Calculations for educational indicators
  const studentsFiltered = useMemo(() => {
    if (filterMode === 'all') return mockStudents;
    return mockStudents.filter(s => s.status === filterMode);
  }, [filterMode]);

  const stats = useMemo(() => {
    const total = mockStudents.length;
    const committed = mockStudents.filter(s => s.status === 'committed').length;
    const exceeding = mockStudents.filter(s => s.status === 'exceeding').length;
    const lagging = mockStudents.filter(s => s.status === 'lagging').length;

    return { total, committed, exceeding, lagging };
  }, []);

  const handleActionSubmit = (student: Student) => {
    onAddDecision(
      `تدخل عاجل ودعم تربوي للطالب: ${student.name}`,
      `توجيه رسمي لإخطار حلقة الطالب (${student.circleName}) لتقديم تسهيلات وجلسات حفظ موازنة وتجاوز النقص الحالي. الإجراءات المحددة: ${actionNotes}`
    );
    setShowDirectActionModal(null);
    setActionNotes('');
  };

  return (
    <div className="space-y-6" id="educational-indicators-section">
      
      {/* HEADER SECTION FOR FILTERING EXCELLENCE vs DELAY */}
      <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden" id="edu-header">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-800 rounded-full translate-x-[-10px] translate-y-[-10px] opacity-30 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1">
            <span className="p-1 px-3 bg-emerald-800 text-emerald-300 rounded font-bold text-[9px] uppercase tracking-wider">مركز قياس الطلاب والمنهج</span>
            <h3 className="text-sm font-bold font-display">متابعة دقة تنفيذ المناهج التعليمية والتربوية</h3>
            <p className="text-[11px] text-emerald-100">رصد متقدم لفرسان الصدارة، الطلاب المتعثرين، معايير المقررات السنوية ونسب انضباط الحضور.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-slate-800">
            <button 
              onClick={() => setFilterMode('all')}
              className={`p-1.5 px-3.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${filterMode === 'all' ? 'bg-white text-emerald-950 font-display shadow-xs' : 'bg-emerald-800 text-emerald-150 hover:bg-emerald-820'}`}
            >
              التفاصيل (الكل)
            </button>
            <button 
              onClick={() => setFilterMode('lagging')}
              className={`p-1.5 px-3.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${filterMode === 'lagging' ? 'bg-red-500 text-white font-display' : 'bg-emerald-800 text-emerald-150 hover:bg-emerald-820'}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              الطلاب المتأخرون
            </button>
            <button 
              onClick={() => setFilterMode('exceeding')}
              className={`p-1.5 px-3.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${filterMode === 'exceeding' ? 'bg-amber-500 text-slate-900 font-display' : 'bg-emerald-800 text-emerald-150 hover:bg-emerald-820'}`}
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              الطلاب المتفوقون
            </button>
          </div>
        </div>

        {/* METRICS SPLIT SUMMARY BADGES */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-emerald-800 text-center text-xs text-emerald-100 z-10 relative">
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-300">الملتزمون بالخطة</span>
            <p className="text-lg font-bold font-mono">{stats.committed} طالباً</p>
          </div>
          <div className="border-x border-emerald-800 space-y-0.5">
            <span className="text-[10px] text-amber-300">المتجاوزون (المتفوقين)</span>
            <p className="text-lg font-bold font-mono text-amber-300">{stats.exceeding} طالباً</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-red-300">المتأخرون عن الخطة</span>
            <p className="text-lg font-bold font-mono text-red-300">{stats.lagging} طالباً</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: FIVE EDUCATIONAL INDICATORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 shadow-2xs" id="edu-indicators-grid">
        
        {/* Indicators 1: مؤشر الالتزام بالخطط */}
        <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="p-0.5 px-2 bg-indigo-50 text-indigo-700 font-bold rounded text-[9px]">الخطط والالتزام</span>
            <h4 className="font-bold text-slate-800 text-xs">تنفيذ الخطط</h4>
            <p className="text-[10px] text-slate-400">التسميع المقرر حسب الأسبوع</p>
          </div>
          <div className="font-mono space-y-1 pt-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>نسبة الالتزام الكلية</span>
              <span className="font-bold">87%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '87%' }} />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">معدل ممتاز مقارنة بالفترة السابقة</span>
        </div>

        {/* Indicators 2: مؤشر الحفظ */}
        <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="p-0.5 px-2 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px]">صفحات ومقررات</span>
            <h4 className="font-bold text-slate-800 text-xs">مؤشر الحفظ</h4>
            <p className="text-[10px] text-slate-400">عدد الصفحات المنجزة شهرياً</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-800 font-mono">1,350 صفحة</p>
            <p className="text-[10px] text-slate-500 font-medium">بمتوسط شهري: <b className="font-mono text-emerald-600">11.5 صفحات</b> لكل طالب</p>
          </div>
          <p className="text-[10px] text-slate-450 border-t border-slate-50 pt-1 text-right">أفضل الحلقات: <b className="text-slate-700">حلقة عاصم</b></p>
        </div>

        {/* Indicators 3: مؤشر المراجعة */}
        <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="p-0.5 px-2 bg-amber-50 text-amber-700 font-bold rounded text-[9px]">الإتقان والتكرار</span>
            <h4 className="font-bold text-slate-800 text-xs">مؤشر المراجعة</h4>
            <p className="text-[10px] text-slate-400">التثبيت والمكوك الأسبوعي</p>
          </div>
          <div className="font-mono space-y-1 pt-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>إنجاز التكرار</span>
              <span className="font-bold">89%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '89%' }} />
            </div>
          </div>
          <p className="text-[10px] text-slate-450 border-t border-slate-50 pt-1 text-right">أفضل الحلقات: <b className="text-slate-700">ابن عامر</b></p>
        </div>

        {/* Indicators 4: مؤشر المقررات */}
        <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="p-0.5 px-2 bg-teal-50 text-teal-700 font-bold rounded text-[9px]">علم الآلة والتجويد</span>
            <h4 className="font-bold text-slate-800 text-xs">مؤشر المقررات</h4>
            <p className="text-[10px] text-slate-400">متون التجويد والعلوم الفرعية</p>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] pt-1">
            <div className="bg-slate-50 p-1 rounded">
              <span className="text-slate-400 block text-[8px]">نشطة</span>
              <b className="text-slate-700 text-xs">3</b>
            </div>
            <div className="bg-emerald-50 p-1 rounded">
              <span className="text-emerald-554 block text-[8px]">مكتملة</span>
              <b className="text-emerald-700 text-xs">2</b>
            </div>
            <div className="bg-red-50 p-1 rounded">
              <span className="text-red-554 block text-[8px]">متعثرة</span>
              <b className="text-red-700 text-xs">1</b>
            </div>
          </div>
          <span className="text-[9px] text-red-600 font-bold">مقرر فرع الجنوب به تعثر فني</span>
        </div>

        {/* Indicators 5: مؤشر الاختبارات (نتائج المقررات الشفوية والتحريرية) */}
        <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-2 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs">
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-1">
              <span className="p-0.5 px-2 bg-red-50 text-red-700 font-bold rounded text-[9px]">تقييمات ممركزة</span>
              <span className="p-0.5 px-1.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[8px] border border-indigo-100">الدرجات النهائية للمنهج المقرر</span>
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">مؤشر الاختبارات</h4>
            </div>
            <p className="text-[9.5px] text-slate-400">نتائج المقررات الشفوية والتحريرية (مبني على إدخال الدرجات النهائية)</p>
          </div>

          {/* Detailed Exam Metrics */}
          <div className="space-y-1.5 text-[10px] font-mono border-t border-b border-slate-100 py-2">
            <div className="flex justify-between items-center text-slate-800">
              <span className="font-sans text-slate-500 font-bold">متوسط الدرجات:</span>
              <b className="text-slate-900 font-black">{examStats.avgScore}%</b>
            </div>
            <div className="flex justify-between items-center text-emerald-600">
              <span className="font-sans font-bold">نسبة النجاح:</span>
              <b className="font-bold">{examStats.passRate}%</b>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span className="font-sans font-bold">نسبة الرسوب:</span>
              <b className="font-bold">{examStats.failRate}%</b>
            </div>
            <div className="flex justify-between items-center text-amber-700">
              <span className="font-sans font-bold">نسبة من لم يختبر:</span>
              <b className="font-bold">{examStats.untestedRate}% <span className="text-[8px] font-normal font-sans">({examStats.untested} طالباً)</span></b>
            </div>
            <div className="flex justify-between items-center text-emerald-800 pt-1 border-t border-slate-100/70">
              <span className="font-sans font-bold">تجاوز الاختبار فوق 90%:</span>
              <b className="font-bold text-emerald-700">{examStats.above90Rate}%</b>
            </div>
            <div className="flex justify-between items-center text-teal-800">
              <span className="font-sans font-bold">تجاوز الاختبار فوق 80%:</span>
              <b className="font-bold text-teal-700">{examStats.above80Rate}%</b>
            </div>
            <div className="flex justify-between items-center text-sky-800">
              <span className="font-sans font-bold">تجاوز الاختبار فوق 70%:</span>
              <b className="font-bold text-sky-700">{examStats.above70Rate}%</b>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400 font-mono">آخر رصد: {lastRecordedDate}</span>
          </div>
        </div>

      </div>

      {/* SECTION 3: THREE PASTORAL / EDUCATIONAL BEHAVIORAL INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="pastoral-indicators-region">
        
        {/* Attendance Index (الحضور والغياب والاستئذان) */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Activity className="h-4 w-4 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">مؤشر الحضور والمواظبة</h4>
          </div>
          
          {/* Vertical styled stacked bar chart representation of daily attendance */}
          <div className="space-y-3 font-mono text-xs text-slate-600">
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700 flex items-center gap-1">
                  <Smile className="h-4 w-4 text-emerald-500 shrink-0" />
                  نسبة الحضور العامة بالملتقى
                </span>
                <span className="text-emerald-700">90%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700 flex items-center gap-1">
                  <Frown className="h-4 w-4 text-red-500 shrink-0" />
                  نسبة الغياب المكتمل
                </span>
                <span className="text-red-700">7%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  نسبة الاستئذان
                </span>
                <span className="text-amber-700">3%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '3%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Discipline Index (الانضباط، الملاحظات التربوية، التنبيهات وغيرها) */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">مؤشر الانضباط والسلوك</h4>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">رصد مباشر للسلوكيات الفنية وحالات التقويم التربوي بالحلقات التابعة.</p>
          
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-450 block text-[9px] font-bold">الملاحظات التربوية</span>
              <p className="text-lg font-bold text-slate-800 font-mono">4</p>
            </div>
            <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
              <span className="text-red-700 block text-[9px] font-bold">حالات التنبيه</span>
              <p className="text-lg font-bold text-red-700 font-mono">2</p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
              <span className="text-emerald-700 block text-[9px] font-bold">حالات تحسن سلوكي</span>
              <p className="text-lg font-bold text-emerald-700 font-mono">3</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block text-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 leading-relaxed">
            تمت مشاركة التقارير مع أولياء الأمور تلقائياً.
          </span>
        </div>

        {/* Activities and Events Index (مؤشر الأنشطة والمشاركات) */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Compass className="h-4 w-4 text-indigo-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">مؤشر الأنشطة والفعاليات</h4>
          </div>
          
          <div className="space-y-3 font-medium text-xs text-slate-600">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-150">
              <span className="text-slate-700">عدد الأنشطة المنفذة:</span>
              <span className="font-mono font-bold text-slate-800 bg-white p-1 px-2.5 rounded-lg border border-slate-100">12 نشاطاً</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-150">
              <span className="text-slate-700">الطلاب المشاركون:</span>
              <span className="font-mono font-bold text-emerald-750 bg-emerald-50 p-1 px-2.5 rounded-lg border border-emerald-100">145 طالباً</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-150">
              <span className="text-slate-700">نسبة المشاركة العامة:</span>
              <span className="font-mono font-bold text-indigo-750 bg-indigo-50 p-1 px-2.5 rounded-lg border border-indigo-100">85 %</span>
            </div>
          </div>
        </div>

      </div>



      {/* CURRICULUM FINAL EXAM GRADES ENTRY & KPI ANALYSIS MODAL */}
      {showGradesModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-right max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-indigo-950 text-white p-5 flex items-center justify-between border-b border-indigo-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-900 text-amber-400 rounded-2xl border border-indigo-800">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">إدخال وتعديل الدرجات النهائية للمنهج المقرر</h3>
                  <p className="text-xs text-indigo-200">التقييمات الممركزة - إدخال نتائج الاختيارات الشفوية والتحريرية لحساب المؤشرات آلياً</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowGradesModal(false)} 
                className="text-slate-300 hover:text-white hover:bg-indigo-900 p-2 rounded-xl transition-all cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* TOP LIVE KPIs DASHBOARD SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">متوسط الدرجات</span>
                  <p className="text-base font-black text-indigo-950 font-mono">{examStats.avgScore}%</p>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-emerald-700 font-bold block">نسبة النجاح</span>
                  <p className="text-base font-black text-emerald-800 font-mono">{examStats.passRate}%</p>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-rose-700 font-bold block">نسبة الرسوب</span>
                  <p className="text-base font-black text-rose-800 font-mono">{examStats.failRate}%</p>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-amber-800 font-bold block">لم يختبر</span>
                  <p className="text-base font-black text-amber-900 font-mono">{examStats.untestedRate}%</p>
                </div>
                <div className="p-2.5 bg-emerald-100/60 border border-emerald-300 rounded-2xl space-y-1">
                  <span className="text-[10px] text-emerald-900 font-bold block">تجاوز فوق 90%</span>
                  <p className="text-base font-black text-emerald-950 font-mono">{examStats.above90Rate}%</p>
                </div>
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-teal-800 font-bold block">تجاوز فوق 80%</span>
                  <p className="text-base font-black text-teal-900 font-mono">{examStats.above80Rate}%</p>
                </div>
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-sky-800 font-bold block">تجاوز فوق 70%</span>
                  <p className="text-base font-black text-sky-900 font-mono">{examStats.above70Rate}%</p>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="🔍 بحث باسم الطالب أو الحلقة..."
                    className="w-full p-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-bold">
                  إجمالي كشف الطلاب للمنهج المقرر: <span className="font-mono text-slate-900 font-black">{examRecords.length} طالباً</span> (المختبرين: {examStats.testedCount} | لم يختبروا: {examStats.untested})
                </div>
              </div>

              {/* STUDENTS GRADES ENTRY TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <tr>
                      <th className="p-3">الطالب والحلقة</th>
                      <th className="p-3 text-center">الدرجة الشفوية (من 50)</th>
                      <th className="p-3 text-center">الدرجة التحريرية (من 50)</th>
                      <th className="p-3 text-center">المجموع النهائي (من 100)</th>
                      <th className="p-3 text-center">حالة الاختبار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examRecords
                      .filter(r => r.studentName.includes(examSearch) || r.circleName.includes(examSearch))
                      .map((rec) => {
                        const isFailed = rec.finalScore !== null && rec.finalScore < 60;
                        const isAbove90 = rec.finalScore !== null && rec.finalScore >= 90;
                        const isUntested = rec.status === 'untested' || rec.finalScore === null;

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 space-y-0.5">
                              <p className="font-bold text-slate-900">{rec.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{rec.circleName}</p>
                            </td>
                            
                            {/* Oral Grade Input */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={rec.oralScore !== null ? rec.oralScore : ''}
                                onChange={(e) => handleUpdateRecord(rec.id, 'oralScore', e.target.value)}
                                placeholder="0 - 50"
                                className="w-20 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white"
                              />
                            </td>

                            {/* Written Grade Input */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={rec.writtenScore !== null ? rec.writtenScore : ''}
                                onChange={(e) => handleUpdateRecord(rec.id, 'writtenScore', e.target.value)}
                                placeholder="0 - 50"
                                className="w-20 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white"
                              />
                            </td>

                            {/* Calculated Total */}
                            <td className="p-3 text-center font-mono font-black text-sm">
                              {isUntested ? (
                                <span className="text-amber-700 bg-amber-50 p-1 px-2 rounded-md text-xs font-sans font-bold">
                                  لم يرصد بعد
                                </span>
                              ) : (
                                <span className={`p-1 px-3 rounded-lg border ${
                                  isAbove90 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                  isFailed ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}>
                                  {rec.finalScore}%
                                </span>
                              )}
                            </td>

                            {/* Status Selector */}
                            <td className="p-3 text-center">
                              <select
                                value={rec.status}
                                onChange={(e) => handleUpdateRecord(rec.id, 'status', e.target.value)}
                                className={`p-1.5 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                                  rec.status === 'tested' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <option value="tested">تم الاختبار ورصد الدرجة</option>
                                <option value="untested">لم يختبر بعد (غائب / مؤجل)</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
              <div className="text-slate-500 font-semibold text-[11px]">
                ✓ تُحسب النسب المئوية آلياً بمجرد تعديل درجات الشفوي والتحريري وحالة الاختبار.
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowGradesModal(false)} 
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold p-2.5 px-5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGradesModal(false);
                    alert('✓ تم حفظ الدرجات النهائية للمنهج المقرر وتحديث نافذة مؤشر الاختبارات بنجاح!');
                  }}
                  className="bg-indigo-950 hover:bg-slate-900 text-white font-black p-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ وتطبيق مؤشرات الاختبارات</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

