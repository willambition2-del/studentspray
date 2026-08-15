/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, MailWarning, UserCheck, CheckCircle2, Archive, 
  ChevronLeft, X, Filter, Info, MapPin, AlertTriangle, UserX 
} from 'lucide-react';
import { CriticalAlert, AlertSeverity, AlertType } from '../types';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
  onAction: (id: string, updates: Partial<CriticalAlert>) => void;
}

export default function CriticalAlerts({ alerts, onAction }: CriticalAlertsProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Examining alert state
  const [examiningAlert, setExaminingAlert] = useState<CriticalAlert | null>(null);
  const [assigneeName, setAssigneeName] = useState('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' ? true : alert.severity === severityFilter;
    
    // Status matching (defaulting to exclude archived unless explicit)
    const matchesStatus = statusFilter === 'all' ? true : alert.status === statusFilter;
    if (statusFilter !== 'archived' && alert.status === 'archived') {
      return false;
    }

    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.assignedTo && alert.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="bg-red-100 text-red-900 border border-red-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse inline-flex items-center gap-1">حرج طارئ</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-900 border border-orange-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1">خطورة عالية</span>;
      case 'medium':
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold">متوسط</span>;
      case 'low':
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold">منخفض</span>;
    }
  };

  const getStatusBadge = (status: 'active' | 'assigned' | 'resolved' | 'archived') => {
    switch (status) {
      case 'active':
        return <span className="bg-amber-50 text-amber-900 border border-amber-250 px-2 py-0.5 rounded-sm text-[10px] font-bold">نشط ومكشوف</span>;
      case 'assigned':
        return <span className="bg-blue-50 text-blue-900 border border-blue-250 px-2 py-0.5 rounded-sm text-[10px] font-bold">تم الإسناد والتحويل</span>;
      case 'resolved':
        return <span className="bg-emerald-100 text-emerald-950 border border-emerald-200 px-2 py-0.5 rounded-sm text-[10px] font-bold">تمت المعالجة والإغلاق</span>;
      case 'archived':
        return <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-sm text-[10px]">مؤرشف بالأرشيف</span>;
    }
  };

  const handleOpenAlert = (alert: CriticalAlert) => {
    setExaminingAlert(alert);
    setAssigneeName(alert.assignedTo || '');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examiningAlert || !assigneeName) return;
    
    onAction(examiningAlert.id, {
      assignedTo: assigneeName,
      status: 'assigned'
    });
    setExaminingAlert(null);
  };

  const handleResolveAlert = (id: string) => {
    onAction(id, { status: 'resolved' });
    setExaminingAlert(null);
  };

  const handleArchiveAlert = (id: string) => {
    onAction(id, { status: 'archived' });
    setExaminingAlert(null);
  };

  return (
    <div className="space-y-6" id="critical-alerts-root">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">مركز الطوارئ والتنبيهات الحرجة فورا</h2>
          <p className="text-slate-400 text-xs">مستشعر الذكاء والوقاية للبحث ورصد الغياب، تأخر التقييمات، انحراف الخطط وفقدان الملفات الاحتياطية</p>
        </div>

        {/* Level severity Quick Switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start shrink-0 text-xs font-bold">
          <button 
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500'}`}
          >
            تنبيهات فعالة ({alerts.filter(a => a.status === 'active' || a.status === 'assigned').length})
          </button>
          <button 
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'resolved' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500'}`}
          >
            محلولة معالجة ({alerts.filter(a => a.status === 'resolved').length})
          </button>
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500'}`}
          >
            استعراض السجلات الكلية
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 justify-between" id="alerts-filters-bar">
        {/* Search */}
        <div className="relative flex-1">
          <AlertTriangle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث بنوع التنبيه، التفاصيل والخلل المطروح..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Severity select filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
        >
          <option value="all">كل درجات التنبيهات</option>
          <option value="critical">حرج (يتطلب فحص وازمات)</option>
          <option value="high">مرتفع الخطورة (فروع)</option>
          <option value="medium">متوسط الأهمية</option>
          <option value="low">منخفض الأثر</option>
        </select>
      </div>

      {/* Grid listing and split inspector panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="alerts-split-container">
        
        {/* list box - 7 cols or full */}
        <div className={`space-y-3.5 ${examiningAlert ? 'lg:col-span-7' : 'lg:col-span-12'}`} id="alerts-list-column">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => handleOpenAlert(alert)}
              className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer text-right flex items-start gap-4 ${
                examiningAlert?.id === alert.id 
                  ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-xs' 
                  : 'border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-red-600 bg-red-50 border-red-150' :
                alert.severity === 'high' ? 'text-orange-600 bg-orange-50 border-orange-150' :
                alert.severity === 'medium' ? 'text-indigo-600 bg-indigo-50 border-indigo-150' :
                'text-slate-500 bg-slate-50 border-slate-150'
              }`}>
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm leading-snug">{alert.title}</p>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    رصد: {new Date(alert.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>

                <p className="text-slate-500 leading-relaxed font-semibold mt-1">{alert.details}</p>
                
                {alert.assignedTo && (
                  <p className="text-[10px] text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded-sm w-fit font-bold mt-1.5 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    تحويل ومتابعة من طرف: {alert.assignedTo}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-slate-50/75">
                  {getStatusBadge(alert.status)}
                  <span className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-0.5">
                    تفاصيل المعالجة الفنية
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-slate-400 text-xs mt-3">رائع! لا تتوفر أي تنبيهات حرجات بالمواصفات المحددة للفلترة.</p>
            </div>
          )}
        </div>

        {/* Inspector panel: Edit / Transfer alerts - 5 cols */}
        {examiningAlert && (
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-md space-y-4 self-start sticky top-4 animate-fade-in" id="alert-inspector">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-red-50 text-red-950 border border-red-100 rounded-sm text-[9px] px-2 py-0.5 font-bold">
                  مراقب الكوارث والطوارئ
                </span>
                <p className="font-bold text-xs text-slate-700 mt-1 font-mono">تنبيه رقم: {examiningAlert.id}</p>
              </div>
              <button 
                onClick={() => setExaminingAlert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert content detailed */}
            <div className="space-y-3.5 text-xs font-semibold">
              <div>
                <p className="text-slate-400 font-bold mb-0.5">العنوان والتشخيص:</p>
                <p className="font-bold text-slate-800 text-sm leading-snug">{examiningAlert.title}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold mb-1">تفاصيل ومبررات الخلل المالي أو الإشرافي:</p>
                <div className="p-3.5 bg-slate-50 rounded-xl text-slate-600 font-medium font-mono leading-relaxed border border-slate-100">
                  {examiningAlert.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-slate-400 font-bold mb-0.5">درجة الخطورة:</p>
                  <div>{getSeverityBadge(examiningAlert.severity)}</div>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-0.5">خط المتابعة:</p>
                  <div>{getStatusBadge(examiningAlert.status)}</div>
                </div>
              </div>

              {/* Assignment Form (تحويل للجهة المختصة) */}
              {examiningAlert.status !== 'resolved' && (
                <form onSubmit={handleAssignSubmit} className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    تحويل القضية للمتابعة (جهة معنية بالحل الفوري)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="مثال: الشيخ فهد (مدير حلقة عاصم)"
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-750 text-white px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      إسناد وتحويل
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">سيتم إرسال إشعار فوري وتكليف المعنى بالأمر بالتحقيق الفني.</span>
                </form>
              )}

              {/* Action buttons (معالجة، أرشفة) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-3.5 border-t border-slate-100/70">
                <button
                  type="button"
                  onClick={() => handleArchiveAlert(examiningAlert.id)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Archive className="h-4 w-4 shrink-0" />
                  <span>أرشفة التنبيه</span>
                </button>

                {examiningAlert.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => handleResolveAlert(examiningAlert.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-100" />
                    <span>اعتماد المعالجة وحلّه</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 py-2.5 rounded-xl text-center flex items-center justify-center font-bold">
                    تم الحل بنجاح
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
