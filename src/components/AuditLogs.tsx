/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardList, Search, User, Tag, Calendar, Database, UserPlus, Key, 
  Trash2, FileText, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsProps {
  logs: AuditLog[];
}

export default function AuditLogs({ logs }: AuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [opFilter, setOpFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affectedEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOp = opFilter === 'all' ? true : log.operationType === opFilter;

    return matchesSearch && matchesOp;
  });

  const getOpBadge = (op: string) => {
    switch (op) {
      case 'create':
        return <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-sm border border-emerald-250 text-[10px] font-bold">إنشاء سجل</span>;
      case 'update':
        return <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded-sm border border-amber-250 text-[10px] font-bold">تعديل بيانات</span>;
      case 'delete':
        return <span className="bg-rose-100 text-rose-950 px-2 py-0.5 rounded-sm border border-rose-250 text-[10px] font-bold">طمس وحذف</span>;
      case 'approve':
        return <span className="bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-sm border border-indigo-250 text-[10px] font-bold">اعتماد وتصديق</span>;
      case 'auth':
        return <span className="bg-purple-100 text-purple-950 px-2 py-0.5 rounded-sm border border-purple-250 text-[10px] font-bold">تسجيل النفاذ</span>;
      case 'restore':
        return <span className="bg-blue-100 text-blue-950 px-2 py-0.5 rounded-sm border border-blue-250 text-[10px] font-bold">استعادة تراجع</span>;
      case 'backup':
        return <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded-sm border border-teal-200 text-[10px] font-bold">نسخ أمان</span>;
      case 'decision':
        return <span className="bg-slate-100 text-slate-850 px-2 py-0.5 rounded-sm border border-slate-200 text-[10px] font-bold">قرار إداري</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm text-[10px]">عملية</span>;
    }
  };

  const getOpIcon = (op: string) => {
    const classes = "h-5 w-5 shrink-0";
    switch (op) {
      case 'create': return <UserPlus className={`${classes} text-emerald-600`} />;
      case 'update': return <ClipboardList className={`${classes} text-amber-600`} />;
      case 'delete': return <Trash2 className={`${classes} text-rose-600`} />;
      case 'approve': return <CheckCircle2 className={`${classes} text-indigo-600`} />;
      case 'auth': return <Key className={`${classes} text-purple-600`} />;
      case 'restore': return <RefreshCw className={`${classes} text-blue-600 animate-spin-hover`} />;
      case 'backup': return <Database className={`${classes} text-teal-600`} />;
      case 'decision': return <FileText className={`${classes} text-slate-700`} />;
      default: return <ClipboardList className={classes} />;
    }
  };

  return (
    <div className="space-y-6" id="audit-logs-root">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">مستودع المراقبة وسجل العمليات (Audit Log)</h2>
          <p className="text-slate-400 text-xs">رصد وتسجيل كافة إجراءات الشيوخ والمدراء داخل النظام بالثانية لضمان الدقة والنزاهة المؤسسية</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 justify-between" id="audit-filters-bar">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث باسم المستخدم، أو الكيان والجهة المتأثرة، أو التفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Operation select filter */}
        <select
          value={opFilter}
          onChange={(e) => setOpFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="all">كل أنواع العمليات بالنظام</option>
          <option value="create">إنشاء بيانات ومستخدمين</option>
          <option value="update">تعديلات البيانات</option>
          <option value="delete">عمليات الطمس والحذف</option>
          <option value="approve">التصديقات والاعتمادات العليا</option>
          <option value="auth">لوج تسجيلات الدخول</option>
          <option value="restore">استرجاع وتراجع قواعد البيانات</option>
          <option value="backup">أرشيف النسخ الاحتياطي التلقائي</option>
          <option value="decision">إصدارات ومسودات القرارات</option>
        </select>
      </div>

      {/* Structured Chronological Logs Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="audit-logs-timeline-box">
        <div className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold">
          
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-4 hover:bg-slate-50/40 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0 mt-0.5">
                  {getOpIcon(log.operationType)}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">« {log.affectedEntity} »</p>
                    {getOpBadge(log.operationType)}
                  </div>
                  <p className="text-slate-500 text-[11px] font-sans leading-relaxed">{log.details}</p>
                </div>
              </div>

              {/* User and timestamp metadata */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0 w-full sm:w-auto text-[10px] text-slate-400 font-medium font-mono pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 sm:p-0 border sm:border-0 border-slate-100 rounded-md sm:rounded-none">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-sans font-bold text-slate-700 bg-emerald-50 px-1 py-0.5 rounded-sm">@{log.username}</span>
                </div>
                <span>{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400 leading-normal text-xs">
              لا تتوفر أي سجلات لبروتوكول المراقبة المحددة للبحث.
            </div>
          )}

        </div>
      </div>

      {/* STAFF EVALUATION & ARCHIVING OPERATIONS LOG - MOVED TO GOVERNANCE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs" id="staff-eval-audit-log">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
            <span>سجل عمليات تقييم وأرشفة الكوادر التعليمية</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold font-mono">سجل التدقيق الأكاديمي والحوكمة الحثيث</span>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {[
            { id: 'log-1', timestamp: '2026-06-22T08:15:00Z', actor: 'المدير العام', actionType: 'تقييم أداء', details: 'تحديث علامة التزام الخطة للشيخ عبد الرحمن السعيد لتصبح 95%' },
            { id: 'log-2', timestamp: '2026-06-22T09:30:00Z', actor: 'المشرف العام', actionType: 'إضافة ملاحظة', details: 'إضافة تنويه إيجابي للشيخ يونس الدوسري لالتزامه باللوحة والمذكرات' },
            { id: 'log-3', timestamp: '2026-06-20T11:00:00Z', actor: 'لجنة الحوكمة', actionType: 'أرشفة وتقييم', details: 'أرشفة ملف التقييم السنوي للكوادر التعليمية للعام 1447هـ وتصدير الاعتماد' },
            { id: 'log-4', timestamp: '2026-06-18T14:20:00Z', actor: 'المشرف التعليمي', actionType: 'تدقيق ميداني', details: 'المصادقة على نتائج اختبارات التثبيت لحلقة حفظ الطليعة' }
          ].map((log) => (
            <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center text-right">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">{log.details}</span>
                <span className="text-[10px] text-slate-400 font-mono">المشغل: {log.actor} | البصمة الزمنية: {new Date(log.timestamp).toLocaleString('ar-SA')}</span>
              </div>
              <span className="bg-indigo-50 border border-indigo-150 text-indigo-800 text-[10px] font-bold rounded-sm px-2 py-0.5 shrink-0">
                {log.actionType}
              </span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
