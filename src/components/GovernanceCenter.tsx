/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, FileText, ClipboardList, Plus, 
  CheckCircle2, ArrowLeftRight, ChevronLeft, Eye, Activity, Sparkles, AlertTriangle, Layers, FileCheck, Hash, Save, RefreshCw
} from 'lucide-react';
import { CriticalAlert, AdminDecision, AuditLog } from '../types';
import CriticalAlerts from './CriticalAlerts';
import AdminDecisions from './AdminDecisions';
import AuditLogs from './AuditLogs';
import { 
  getStoredPrefixSettings, 
  savePrefixSettings, 
  getStoredCounters, 
  getStoredCircleCodeMaps,
  NumberingPrefixSettings
} from '../lib/numberingSystem';

export interface GovernanceCenterProps {
  initialTab?: 'overview' | 'decisions' | 'alerts' | 'audit-logs';
  alerts: CriticalAlert[];
  onAlertAction: (id: string, updates: Partial<CriticalAlert>) => void;
  decisions: AdminDecision[];
  onAddDecision: (data: Partial<AdminDecision>) => void;
  onUpdateDecision: (id: string, updates: Partial<AdminDecision>) => void;
  logs: AuditLog[];
  currentUser?: any;
}

export default function GovernanceCenter({
  initialTab = 'overview',
  alerts = [],
  onAlertAction,
  decisions = [],
  onAddDecision,
  onUpdateDecision,
  logs = []
}: GovernanceCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'decisions' | 'alerts' | 'audit-logs' | 'numbering'>(initialTab as any);
  const [prefixSettings, setPrefixSettings] = useState<NumberingPrefixSettings>(getStoredPrefixSettings());
  const [numberingSavedMessage, setNumberingSavedMessage] = useState(false);

  const numberingCounters = getStoredCounters();
  const circleMaps = getStoredCircleCodeMaps();

  const handleSaveNumberingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePrefixSettings(prefixSettings);
    setNumberingSavedMessage(true);
    setTimeout(() => setNumberingSavedMessage(false), 3000);
  };

  // Sync active sub-tab if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Derived Statistics
  const activeAlertsCount = alerts.filter(a => a.status === 'active' || a.status === 'assigned').length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const resolvedAlertsCount = alerts.filter(a => a.status === 'resolved').length;

  const activeDecisionsCount = decisions.filter(d => d.status !== 'archived').length;
  const approvedDecisionsCount = decisions.filter(d => d.status === 'approved').length;
  const ongoingDecisionsCount = decisions.filter(d => d.status === 'ongoing').length;

  const totalLogsCount = logs.length;
  const todayLogsCount = logs.filter(l => {
    if (!l.timestamp) return false;
    const logDate = new Date(l.timestamp).toDateString();
    return logDate === new Date().toDateString();
  }).length;

  // Health Score Calculation
  const healthScore = alerts.length > 0 
    ? Math.min(100, Math.max(60, Math.round(((alerts.length - criticalAlertsCount) / alerts.length) * 100))) 
    : 100;

  return (
    <div className="space-y-6 font-sans dir-rtl text-right" id="governance-center-root">
      
      {/* Top Main Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>مركز الحوكمة والإشراف والتنظيم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              مركز الحوكمة والرقابة والقرارات
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              منظومة إشرافية موحدة لمتابعة وإصدار القرارات الإدارية، استقبال ومعالجة التنبيهات والإنذارات الحرجة، وتدقيق سجل العمليات والحركات بالنظام بنسق مرن وعالي الأمان.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveSubTab('decisions')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>إصدار قرار جديد</span>
            </button>
            <button
              onClick={() => setActiveSubTab('alerts')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>التنبيهات الحالية ({activeAlertsCount})</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>نظرة عامة ومؤشرات الحوكمة</span>
          </button>

          <button
            onClick={() => setActiveSubTab('decisions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'decisions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>القرارات الرسمية ({decisions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'alerts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>التنبيهات والإنذارات ({alerts.length})</span>
            {activeAlertsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit-logs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit-logs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>سجل العمليات والرقابة ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('numbering' as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              (activeSubTab as string) === 'numbering'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Hash className="h-4 w-4 text-emerald-400" />
            <span>إعدادات الترقيم الموحد</span>
          </button>
        </div>
      </div>

      {/* Main View Switch */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in" id="governance-overview-tab">
          
          {/* Top 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Admin Decisions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">القرارات التنفيذية</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-slate-800 font-mono">{activeDecisionsCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  معتمد: <span className="text-emerald-700 font-bold">{approvedDecisionsCount}</span> | جاري: <span className="text-blue-700 font-bold">{ongoingDecisionsCount}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('decisions')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-50"
              >
                <span>إدارة القرارات الصادرة</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 2: Alerts & Incidents */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">التنبيهات والإنذارات</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-slate-800 font-mono">{activeAlertsCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  حرج طارئ: <span className="text-rose-600 font-bold">{criticalAlertsCount}</span> | معالج: <span className="text-emerald-700 font-bold">{resolvedAlertsCount}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('alerts')}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-50"
              >
                <span>متابعة التنبيهات</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 3: Audit Logs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">سجل الرقابة وحركات النظام</span>
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-slate-800 font-mono">{totalLogsCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  حركات اليوم: <span className="text-indigo-700 font-bold">{todayLogsCount || totalLogsCount}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('audit-logs')}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-50"
              >
                <span>استعراض السجل الكامل</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 4: Governance Health Index */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-100">مؤشر السلامة التنظيمية</span>
                <div className="p-2 bg-white/20 text-white rounded-xl">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-3xl font-black font-mono">{healthScore}%</div>
                <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                  {criticalAlertsCount === 0 ? 'استقرار تام في الحوكمة والإنضباط' : 'يتطلب معالجة التنبيهات الحرجة'}
                </p>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full transition-all" style={{ width: `${healthScore}%` }} />
              </div>
            </div>

          </div>

          {/* Quick Insights Grid: Decisions + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Decisions Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">أحدث القرارات الإدارية</h3>
                </div>
                <button
                  onClick={() => setActiveSubTab('decisions')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل ({decisions.length})</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {decisions.slice(0, 3).map((dec) => (
                  <div
                    key={dec.id}
                    onClick={() => setActiveSubTab('decisions')}
                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                          {dec.decisionNumber}
                        </span>
                        <p className="font-bold text-slate-800 text-xs">{dec.title}</p>
                      </div>
                      <p className="text-slate-500 line-clamp-1">{dec.content}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(dec.date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                ))}

                {decisions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    لا توجد قرارات مسجلة حالياً.
                  </div>
                )}
              </div>
            </div>

            {/* Active Critical Alerts Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-sm">التنبيهات التي تقتضي المتابعة</h3>
                </div>
                <button
                  onClick={() => setActiveSubTab('alerts')}
                  className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل ({alerts.length})</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setActiveSubTab('alerts')}
                    className="p-3.5 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl border border-amber-100 cursor-pointer transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.severity === 'critical' ? 'حرج' : 'تنبيه'}
                        </span>
                        <p className="font-bold text-slate-800 text-xs">{alert.title}</p>
                      </div>
                      <p className="text-slate-600 line-clamp-1">{alert.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    لا توجد تنبيهات حرجية نشطة حالياً.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Recent Audit Logs Quick Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-slate-800 text-sm">أحدث حركات النظام وسجل الرقابة</h3>
              </div>
              <button
                onClick={() => setActiveSubTab('audit-logs')}
                className="text-xs font-bold text-slate-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>سجل الرقابة الممتد ({logs.length})</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                    <th className="p-2.5 rounded-r-lg">المستخدم</th>
                    <th className="p-2.5">نوع العملية</th>
                    <th className="p-2.5">الجهة التأثيرية</th>
                    <th className="p-2.5">التفاصيل</th>
                    <th className="p-2.5 rounded-l-lg">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 text-slate-700 font-medium">
                      <td className="p-2.5 font-bold text-slate-900">{log.username}</td>
                      <td className="p-2.5">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {log.operationType}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-indigo-700">{log.affectedEntity}</td>
                      <td className="p-2.5 max-w-xs truncate text-slate-500">{log.details}</td>
                      <td className="p-2.5 font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  لا توجد عمليات مسجلة بالسجل اليوم.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Embedded Decisions View */}
      {activeSubTab === 'decisions' && (
        <div className="animate-fade-in" id="governance-decisions-tab">
          <AdminDecisions
            decisions={decisions}
            onAddDecision={onAddDecision}
            onUpdateDecision={onUpdateDecision}
          />
        </div>
      )}

      {/* Embedded Alerts View */}
      {activeSubTab === 'alerts' && (
        <div className="animate-fade-in" id="governance-alerts-tab">
          <CriticalAlerts
            alerts={alerts}
            onAction={onAlertAction}
          />
        </div>
      )}

      {/* Embedded Audit Logs View */}
      {activeSubTab === 'audit-logs' && (
        <div className="animate-fade-in" id="governance-audit-logs-tab">
          <AuditLogs
            logs={logs}
          />
        </div>
      )}

      {/* Embedded Unified Numbering System View */}
      {activeSubTab === 'numbering' && (
        <div className="animate-fade-in space-y-6" id="governance-numbering-tab">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                  <Hash className="h-5 w-5 text-indigo-600" />
                  <span>إعدادات وتخصيص البادئات والترقيم الموحد المركزية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  إدارة البادئات (Prefixes) والمشغلات التلقائية للرموز التنظيمية والمجموعات والمؤشرات عبر أرجاء النظام بدون المساس بالبيانات السابقة.
                </p>
              </div>

              {numberingSavedMessage && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تم حفظ إعدادات البادئات الموحدة بنجاح!</span>
                </div>
              )}
            </div>

            {/* Form for Prefixes */}
            <form onSubmit={handleSaveNumberingSettings} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الحلقات (Circle)</label>
                  <input
                    type="text"
                    value={prefixSettings.circlePrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, circlePrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="C"
                  />
                  <p className="text-[10px] text-slate-500">مثال: C-01, C-02</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الطالب بالحلقة (Student)</label>
                  <input
                    type="text"
                    value={prefixSettings.studentPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, studentPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="S"
                  />
                  <p className="text-[10px] text-slate-500">مثال: C-03-S07</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة المعلم بالحلقة (Teacher)</label>
                  <input
                    type="text"
                    value={prefixSettings.teacherPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, teacherPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="T"
                  />
                  <p className="text-[10px] text-slate-500">مثال: C-03-T01</p>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                  <label className="text-xs font-bold text-indigo-900 block">المعرف الداخلي الثابت للطالب</label>
                  <input
                    type="text"
                    value={prefixSettings.permanentStudentPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, permanentStudentPrefix: e.target.value })}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-900"
                    placeholder="STD"
                  />
                  <p className="text-[10px] text-indigo-700 font-bold">مثال: STD-0024 (ثابت لا يتغير)</p>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                  <label className="text-xs font-bold text-indigo-900 block">المعرف الداخلي الثابت للكادر</label>
                  <input
                    type="text"
                    value={prefixSettings.permanentStaffPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, permanentStaffPrefix: e.target.value })}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-900"
                    placeholder="STF"
                  />
                  <p className="text-[10px] text-indigo-700 font-bold">مثال: STF-0027 (ثابت لا يتغير)</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة ولي الأمر (Parent)</label>
                  <input
                    type="text"
                    value={prefixSettings.parentPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, parentPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="P"
                  />
                  <p className="text-[10px] text-slate-500">مثال: P-015</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الأنشطة (Activity)</label>
                  <input
                    type="text"
                    value={prefixSettings.activityPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, activityPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="A"
                  />
                  <p className="text-[10px] text-slate-500">مثال: A-025</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الاختبارات (Exam)</label>
                  <input
                    type="text"
                    value={prefixSettings.examPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, examPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="E"
                  />
                  <p className="text-[10px] text-slate-500">مثال: E-014</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة التقارير (Report)</label>
                  <input
                    type="text"
                    value={prefixSettings.reportPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, reportPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="R"
                  />
                  <p className="text-[10px] text-slate-500">مثال: R-031</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الأوسمة (Badge)</label>
                  <input
                    type="text"
                    value={prefixSettings.badgePrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, badgePrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="B"
                  />
                  <p className="text-[10px] text-slate-500">مثال: B-018</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة المهام (Task)</label>
                  <input
                    type="text"
                    value={prefixSettings.taskPrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, taskPrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="TSK"
                  />
                  <p className="text-[10px] text-slate-500">مثال: TSK-047</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">بادئة الملفات (File)</label>
                  <input
                    type="text"
                    value={prefixSettings.filePrefix}
                    onChange={(e) => setPrefixSettings({ ...prefixSettings, filePrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    placeholder="F"
                  />
                  <p className="text-[10px] text-slate-500">مثال: F-092</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ إعدادات البادئات</span>
                </button>
              </div>
            </form>

            {/* Current Counters Overview */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                حالة عدادات الترقيم والمجموعات المسجلة حالياً
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">العداد الحالي للحلقات</span>
                  <span className="text-lg font-extrabold text-indigo-700 font-mono">{numberingCounters.nextCircleIndex - 1} حلقة</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">عداد الطلاب الثابت (STD)</span>
                  <span className="text-lg font-extrabold text-indigo-700 font-mono">STD-{String(numberingCounters.nextPermanentStudentIndex - 1).padStart(4, '0')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">عداد الكادر الثابت (STF)</span>
                  <span className="text-lg font-extrabold text-indigo-700 font-mono">STF-{String(numberingCounters.nextPermanentStaffIndex - 1).padStart(4, '0')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">عداد أولياء الأمور (P)</span>
                  <span className="text-lg font-extrabold text-indigo-700 font-mono">P-{String(numberingCounters.nextParentIndex - 1).padStart(3, '0')}</span>
                </div>
              </div>

              {/* Mapped Circle Codes */}
              {Object.keys(circleMaps).length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">سجل الحلقات والرموز التنظيمية المخصصة لها:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.values(circleMaps).map((cMap) => (
                      <span key={cMap.circleCode} className="bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-mono font-bold shadow-2xs">
                        {cMap.circleCode} | {cMap.circleName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
