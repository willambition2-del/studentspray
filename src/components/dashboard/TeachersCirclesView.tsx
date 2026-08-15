/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Award, AlertTriangle, UserCheck, Star, Sparkles, BookOpen, 
  ArrowUpDown, Filter, Search, ShieldCheck, CheckSquare, RefreshCw 
} from 'lucide-react';
import { mockTeachers, mockCircles } from './dashboardData';
import { Circle, Teacher } from './dashboardTypes';

export default function TeachersCirclesView() {
  const [circlesSearch, setCirclesSearch] = useState('');
  const [circlesSortField, setCirclesSortField] = useState<'students' | 'attendance' | 'compliance' | 'overall' | 'supervisor' | 'memorization'>('students');
  const [circlesSortDir, setCirclesSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Interactive Circles Selection for Multi-Comparison Block
  const [comparedCircleIds, setComparedCircleIds] = useState<string[]>(['c1', 'c3']); // preselected عاصم + ابن عامر

  // Sort and filter circles
  const sortedCircles = useMemo(() => {
    let result = [...mockCircles];
    if (circlesSearch.trim()) {
      const q = circlesSearch.toLowerCase();
      result = result.filter(c => c.name.includes(q) || c.teacherName.includes(q));
    }
    
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      
      if (circlesSortField === 'students') {
        valA = a.studentsCount;
        valB = b.studentsCount;
      } else if (circlesSortField === 'attendance') {
        valA = a.attendanceRate;
        valB = b.attendanceRate;
      } else if (circlesSortField === 'compliance') {
        valA = a.planComplianceRate;
        valB = b.planComplianceRate;
      } else if (circlesSortField === 'overall') {
        valA = a.overallScore;
        valB = b.overallScore;
      } else if (circlesSortField === 'supervisor') {
        valA = a.supervisorRating;
        valB = b.supervisorRating;
      } else if (circlesSortField === 'memorization') {
        valA = a.memorizationPages;
        valB = b.memorizationPages;
      }
      
      return circlesSortDir === 'desc' ? valB - valA : valA - valB;
    });
    
    return result;
  }, [circlesSearch, circlesSortField, circlesSortDir]);

  // Retrieve selected circle components for Side-by-Side comparison
  const comparedCircles = useMemo(() => {
    return mockCircles.filter(c => comparedCircleIds.includes(c.id));
  }, [comparedCircleIds]);

  const handleToggleCompare = (id: string) => {
    setComparedCircleIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter(cid => cid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Grouping teachers by rating/status
  const outstandingTeachers = mockTeachers.filter(t => t.status === 'outstanding');
  const needsSupportTeachers = mockTeachers.filter(t => t.status === 'needs_support');
  const stableTeachers = mockTeachers.filter(t => t.status === 'stable');

  return (
    <div className="space-y-6" id="teachers-circles-section">
      
      {/* SECTION 4: TEACHERS PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="teachers-indicators-block">
        
        {/* Outstanding Teachers */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Award className="h-4 w-4 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">أفضل المدرسين والمعلمين</h4>
          </div>
          <p className="text-[10px] text-slate-450 leading-normal">تم التقييم بناء على أداء الطلاب التعليمي، الانضباط، وتنفيذ بنود خطة المشرف.</p>
          
          <div className="space-y-2.5">
            {outstandingTeachers.map((t) => (
              <div key={t.id} className="p-3 bg-emerald-50/45 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">{t.name}</p>
                  <p className="text-slate-500 text-[10px]">معدل حضور الطلاب: <b className="text-slate-700 font-mono">{t.attendanceRate}%</b></p>
                </div>
                <div className="text-left space-y-0.5">
                  <span className="p-0.5 px-2 bg-emerald-500 text-white font-bold text-[9px] rounded-md">متميز جداً</span>
                  <p className="text-slate-450 text-[10px] font-mono">التقييم: <b className="text-emerald-700">{t.rating} / 5</b></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teachers Needing Support */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">مدرسون يحتاجون دعماً وإسناداً</h4>
          </div>
          <p className="text-[10px] text-slate-450 leading-normal">يتم تحديدهم بناء على انخفاض نتائج اختبارات الطلاب، ضعف التجويد، والتقويمات المتراكمة.</p>
          
          <div className="space-y-2.5">
            {needsSupportTeachers.map((t) => (
              <div key={t.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between text-xs animate-pulse">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">{t.name}</p>
                  <p className="text-red-800 text-[10px]">الالتزام بالخطة: <b className="font-mono">{t.planCompliance}%</b></p>
                </div>
                <div className="text-left space-y-0.5">
                  <span className="p-0.5 px-2 bg-red-500 text-white font-bold text-[8px] rounded-md">بحاجة دعم فني</span>
                  <p className="text-slate-400 text-[10px] font-mono">التقييم الكلي: <b className="text-red-700">{t.rating} / 5</b></p>
                </div>
              </div>
            ))}
            {needsSupportTeachers.length === 0 && (
              <p className="text-[11px] text-slate-400 p-4 text-center">لا يوجد أي مدرس في النطاق الحرج حالياً.</p>
            )}
          </div>
        </div>

        {/* Average Teachers Evaluation Metrics */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserCheck className="h-4 w-4 text-indigo-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs font-display">معدل كفاءة التدريس الكلية</h4>
          </div>
          <p className="text-[10px] text-slate-450">التطوير الكلي لتقييمات المشرفين الشهرية بالمقارنة السابقة.</p>
          
          <div className="space-y-4 py-2 text-center text-xs">
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
              <span className="text-slate-500 font-bold">المتوسط العام للكادر</span>
              <p className="text-3xl font-bold font-mono text-indigo-700">92 %</p>
            </div>
            
            <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold">المقارنة مع الشهر السابق:</span>
              <span className="font-mono font-bold flex items-center gap-0.5 text-sm">
                ⬆ تحسن بـ 2٪
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 5: CIRCLES PERFORMANCE MATRIX (ترتيب الحلقات) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4" id="circles-ranking-module">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
              منظومة ترتيب وأداء الحلقات (التفاضلي)
            </h3>
            <p className="text-[10px] text-slate-400">كشف شامل للمقارنة الدقيقة والتقييم التفاضلي، فرز متعدد، واختيار الحلقات للمقارنة المتزامنة.</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap text-slate-800">
            {/* Search filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-1.5 px-2.5 rounded-xl text-xs w-44">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input 
                type="text"
                placeholder="بحث باسم الحلقة أو المعلم..."
                value={circlesSearch}
                onChange={(e) => setCirclesSearch(e.target.value)}
                className="bg-transparent text-slate-700 outline-none w-full text-[11px]"
              />
            </div>

            {/* Sort toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-1.5 px-3 rounded-xl text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select 
                value={circlesSortField}
                onChange={(e) => setCirclesSortField(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="students">عدد الطلاب</option>
                <option value="attendance">معدل الحضور</option>
                <option value="compliance">الالتزام بالخطة</option>
                <option value="overall">التقييم الإجمالي</option>
                <option value="supervisor">تقييم الموجه الفني</option>
                <option value="memorization">أوجه الحفظ الجديدة</option>
              </select>
            </div>

            <button 
              onClick={() => setCirclesSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 px-3 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100 text-xs font-bold font-mono text-slate-700 cursor-pointer flex items-center gap-1"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              {circlesSortDir === 'desc' ? 'تنازلي ⬇' : 'تصاعدي ⬆'}
            </button>
          </div>
        </div>

        {/* Ranking List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs" id="circles-performance-ranking-table">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150">
                <th className="p-3 font-bold text-center w-10">مقارنة</th>
                <th className="p-3 font-bold">الحلقة والمشرف المعني</th>
                <th className="p-3 font-bold text-center">الطلاب المقيدون</th>
                <th className="p-3 font-bold text-center">الحضور اليومي</th>
                <th className="p-3 font-bold text-center">الالتزام بالخطة</th>
                <th className="p-3 font-bold text-center">معدل أوجه الحفظ الجديدة</th>
                <th className="p-3 font-bold text-center">متوسط الاختبارات</th>
                <th className="p-3 font-bold text-center text-indigo-700 bg-indigo-50/50">تقييم الموجه الفني</th>
                <th className="p-3 font-bold text-center text-emerald-800 bg-emerald-50/50">التقييم الإجمالي</th>
                <th className="p-3 font-bold text-center">شكل الأولوية والتقدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCircles.map((circle) => {
                const isSelected = comparedCircleIds.includes(circle.id);
                return (
                  <tr key={circle.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/25' : ''}`}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCompare(circle.id)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer accent-indigo-600"
                        title="اختر لمقارنة الأداء"
                      />
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{circle.name}</p>
                      <p className="text-slate-400 text-[10px]">أ. {circle.teacherName}</p>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-700">{circle.studentsCount} طلاب</td>
                    <td className="p-3 text-center">
                      <span className={`p-1 px-2 rounded-md font-mono font-bold text-[10px] ${
                        circle.attendanceRate >= 90 ? 'bg-emerald-50 text-emerald-800 border-emerald-100 border' :
                        circle.attendanceRate >= 80 ? 'bg-indigo-50 text-indigo-800' : 'bg-red-50 text-red-800 border-red-100 border animate-pulse'
                      }`}>
                        {circle.attendanceRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-700">{circle.planComplianceRate}%</td>
                    <td className="p-3 text-center">
                      <span className="font-bold bg-slate-50 p-1 px-2 rounded font-mono text-slate-800">{circle.memorizationPages} ص</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-750">{circle.avgTestScore}%</td>
                    <td className="p-3 text-center bg-indigo-50/20 font-mono font-bold text-indigo-800">
                      <span className="p-1 px-2 bg-indigo-50 border border-indigo-150 rounded-md text-[11px]">
                        {circle.supervisorRating}%
                      </span>
                    </td>
                    <td className="p-3 text-center bg-emerald-50/20 font-mono font-bold text-emerald-800">
                      <span className="p-1 px-2.5 bg-emerald-100 border border-emerald-200 rounded-md text-xs font-black">
                        {circle.overallScore}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] p-1 px-2.5 rounded-full inline-block ${
                        circle.priorityLabel?.includes('ممتاز جداً') ? 'bg-emerald-100 text-emerald-850 border border-emerald-300 font-bold' :
                        circle.priorityLabel?.includes('ممتاز مرتفع') ? 'bg-teal-100 text-teal-850 border border-teal-300 font-bold' :
                        circle.priorityLabel?.includes('ممتاز') ? 'bg-sky-100 text-sky-850 border border-sky-300 font-bold' :
                        circle.priorityLabel?.includes('جيد جداً') ? 'bg-indigo-100 text-indigo-850 border border-indigo-300 font-bold' :
                        'bg-rose-100 text-rose-850 border border-rose-300 font-bold animate-pulse'
                      }`}>
                        {circle.priorityLabel || (circle.status === 'excellent' ? 'ممتاز جداً' : circle.status === 'good' ? 'ممتاز' : 'يحتاج رعاية عاجلة')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 (Part 2): COMPARATIVE WIZARD (نافذة لمقارنة حلقات تخصصية) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-5" id="circles-comparison-wizard">
        <div className="space-y-0.5">
          <span className="bg-indigo-50 text-indigo-700 font-bold p-1 px-2 rounded font-mono text-[9px] uppercase">أداة تفاضلية متكاملة</span>
          <h3 className="text-xs font-bold text-slate-800 font-display">مقارنة الحفظ والتقدم الفني والتقييم الشامل (Side-by-Side Comparison)</h3>
          <p className="text-[10px] text-slate-400">اختر من الجدول للحساب التلقائي للفوارق الحفظية والمعدلات التربوية وتقييمات التوجيه الفني بين الحلقات.</p>
        </div>

        {/* Selected circle badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-450 self-center">المقارنة تشمل حالياً:</span>
          {comparedCircles.map(cc => (
            <span key={cc.id} className="p-1 px-3 bg-indigo-50 text-indigo-850 font-bold border border-indigo-150 rounded-full flex items-center gap-1">
              {cc.name}
              <button 
                onClick={() => handleToggleCompare(cc.id)}
                disabled={comparedCircleIds.length <= 1}
                className="hover:text-red-600 disabled:opacity-30 cursor-pointer"
                title="إزالة المقارنة"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Grid displays */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="comparison-columns-grid">
          {comparedCircles.map((circle) => (
            <div key={circle.id} className="bg-slate-50/75 border border-slate-150 p-4 rounded-xl space-y-4 text-right flex flex-col justify-between">
              <div className="space-y-2">
                <div className="border-b border-indigo-100 pb-2 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs font-display flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {circle.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">المعلم المربي: أ. {circle.teacherName}</p>
                  </div>
                  <span className="p-0.5 px-2 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-md font-mono">
                    {circle.overallScore}%
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">عدد الطلاب المقيدين:</span>
                    <span className="font-bold text-slate-800">{circle.studentsCount} طلاب</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">معدل الحضور اليومي:</span>
                    <span className={`font-bold ${circle.attendanceRate >= 90 ? 'text-emerald-700' : 'text-red-700'}`}>{circle.attendanceRate}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">معدل أوجه الحفظ الجديدة:</span>
                    <span className="font-bold text-slate-800">{circle.memorizationPages} ص</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">دقة الالتزام بالخطة:</span>
                    <span className="font-bold text-indigo-700">{circle.planComplianceRate}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">متوسط درجات الاختبارات:</span>
                    <span className="font-bold text-slate-800">{circle.avgTestScore}%</span>
                  </div>

                  <div className="flex justify-between bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100">
                    <span className="text-indigo-900 font-sans font-bold">تقييم الموجه الفني:</span>
                    <span className="font-bold text-indigo-800">{circle.supervisorRating}%</span>
                  </div>

                  <div className="flex justify-between bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-900 font-sans font-bold">التقييم الإجمالي للحلقة:</span>
                    <span className="font-black text-emerald-800">{circle.overallScore}%</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Micro SVG comparison bar graph for selected circle */}
              <div className="pt-3 border-t border-slate-150">
                <span className="text-[9px] text-slate-400 block mb-1">المؤشرات التفاضلية الرئيسية (درجة / 100):</span>
                <div className="h-10 flex gap-1 items-end pt-1 bg-white rounded border border-slate-150 justify-around">
                  <div className="flex flex-col items-center gap-0.5 w-full" title={`حضور ${circle.attendanceRate}%`}>
                    <div className="w-2.5 bg-emerald-500 rounded-t" style={{ height: `${circle.attendanceRate * 0.3}px` }} />
                    <span className="text-[7px] text-slate-400">حضور</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 w-full" title={`التزام ${circle.planComplianceRate}%`}>
                    <div className="w-2.5 bg-indigo-500 rounded-t" style={{ height: `${circle.planComplianceRate * 0.3}px` }} />
                    <span className="text-[7px] text-slate-400">التزام</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 w-full" title={`موجه فني ${circle.supervisorRating}%`}>
                    <div className="w-2.5 bg-teal-500 rounded-t" style={{ height: `${circle.supervisorRating * 0.3}px` }} />
                    <span className="text-[7px] text-slate-400">موجه</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 w-full" title={`تقييم إجمالي ${circle.overallScore}%`}>
                    <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: `${circle.overallScore * 0.3}px` }} />
                    <span className="text-[7px] text-slate-400">إجمالي</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
