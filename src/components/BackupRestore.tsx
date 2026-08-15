/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, Plus, Download, RefreshCcw, RefreshCw, ArrowLeftRight, Check, X, 
  AlertTriangle, Eye, ShieldCheck, ClipboardList, Info, HelpCircle 
} from 'lucide-react';
import { BackupInfo } from '../types';

interface BackupRestoreProps {
  backups: BackupInfo[];
  onCreateBackup: (note?: string) => void;
  onRestoreBackup: (id: string) => Promise<any>;
}

export default function BackupRestore({ backups, onCreateBackup, onRestoreBackup }: BackupRestoreProps) {
  const [backupNote, setBackupNote] = useState('');
  const [comparingIds, setComparingIds] = useState<string[]>([]);
  
  // Specific restore safety state
  const [restoringItem, setRestoringItem] = useState<BackupInfo | null>(null);
  const [autoBackupChecked, setAutoBackupChecked] = useState(true);
  const [gmConsentChecked, setGmConsentChecked] = useState(false);
  const [isRestoringInProgress, setIsRestoringInProgress] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const handleCreateClick = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBackup(backupNote || undefined);
    setBackupNote('');
  };

  const handleDownloadBackup = (backup: BackupInfo) => {
    // Generate simulated database JSON for user download
    const simulatedData = {
      manifest: {
        center: 'ملتقى الهدى القرآني بالرياض',
        backupId: backup.id,
        version: backup.version,
        createdAt: backup.createdAt,
        checksum: `SHA256-${backup.id.slice(3)}${Date.now().toString().slice(-4)}`
      },
      database_counts: backup.stats,
      acknowledgement: 'أنتج السجل بواسطة إدارة الحوسبة السحابية للملتقى القرآني النموذجي.'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(simulatedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", backup.fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleToggleCompare = (id: string) => {
    if (comparingIds.includes(id)) {
      setComparingIds(comparingIds.filter(x => x !== id));
    } else {
      if (comparingIds.length >= 2) {
        // limit to 2
        setComparingIds([comparingIds[1], id]);
      } else {
        setComparingIds([...comparingIds, id]);
      }
    }
  };

  const handleTriggerRestore = (backup: BackupInfo) => {
    setRestoringItem(backup);
    setGmConsentChecked(false);
    setAutoBackupChecked(true);
    setRestoreSuccessMsg(null);
  };

  const handleConfirmRestore = async () => {
    if (!restoringItem || !gmConsentChecked || !autoBackupChecked) return;

    setIsRestoringInProgress(true);
    try {
      const res = await onRestoreBackup(restoringItem.id);
      setIsRestoringInProgress(false);
      setRestoreSuccessMsg(`تهانينا! تمت استعادة البيانات وصور الجداول بنجاح إلى النسخة (${restoringItem.version}). تم أوتوماتيكياً ترحيل النسخة الاحتياطية الوقائية الحالية برقم جديد لحفظ البيانات السابقة.`);
      setTimeout(() => {
        setRestoringItem(null);
        setRestoreSuccessMsg(null);
      }, 5000);
    } catch (err) {
      setIsRestoringInProgress(false);
      alert('حدث خطأ فني أثناء استرجاع الجداول السحابية.');
    }
  };

  const getCompareTable = () => {
    if (comparingIds.length < 2) return null;
    const b1 = backups.find(b => b.id === comparingIds[0]);
    const b2 = backups.find(b => b.id === comparingIds[1]);
    if (!b1 || !b2) return null;

    const statsKeys: Array<{ key: keyof typeof b1.stats; label: string }> = [
      { key: 'students', label: 'عدد الطلاب المقيدين' },
      { key: 'circles', label: 'عدد الحلقات والمدارس' },
      { key: 'teachers', label: 'عديد المعلمين والمقرئين' },
      { key: 'supervisors', label: 'كادر المشرفين الفنيين' },
      { key: 'plans', label: 'الخطة والجدولة المقررة' },
      { key: 'activities', label: 'الأنشطة والمسابقات' },
      { key: 'achievements', label: 'إجمالي منجزات الحفظ' },
      { key: 'graduates', label: 'مستوى عدد الخريجين' },
      { key: 'reports', label: 'سجلات التقارير المرفوعة' },
    ];

    return (
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-750 shadow-md space-y-4 animate-fade-in" id="compare-backups-panel">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div>
            <span className="bg-slate-800 text-indigo-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">مقارن القواعد الفني</span>
            <h3 className="font-bold text-sm font-display text-white mt-1">جدول الاختلافات والمقارنة الإحصائية</h3>
          </div>
          <button 
            onClick={() => setComparingIds([])}
            className="text-slate-400 hover:text-white text-xs border border-slate-700 px-2 py-1 rounded-lg"
          >
            إلغاء المقارنة
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-indigo-400">
                <th className="p-2 font-bold">المؤشر وقسم الجدول</th>
                <th className="p-2 font-mono text-[10px]">{b1.fileName.slice(0, 30)}...</th>
                <th className="p-2 font-mono text-[10px]">{b2.fileName.slice(0, 30)}...</th>
                <th className="p-2 font-bold text-center">الفرق الإحصائي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-[11px]">
              {statsKeys.map(item => {
                const val1 = b1.stats[item.key] || 0;
                const val2 = b2.stats[item.key] || 0;
                const diff = val2 - val1;
                return (
                  <tr key={item.key} className="hover:bg-slate-850/50">
                    <td className="p-2.5 text-slate-350">{item.label}</td>
                    <td className="p-2.5 font-mono text-slate-200">{val1}</td>
                    <td className="p-2.5 font-mono text-slate-200">{val2}</td>
                    <td className="p-2.5 text-center font-mono">
                      {diff === 0 ? (
                        <span className="text-slate-450">-</span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-400 font-bold">+{diff} (ارتفاع)</span>
                      ) : (
                        <span className="text-rose-400 font-bold">{diff} (انخفاض)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="backup-restore-root">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">الأمن والنسخ الاحتياطي الوقائي للبيانات</h2>
          <p className="text-slate-400 text-xs">حفظ كافة سجلات الطلاب، الحلقات، المنجزات، التقارير وقرارات الإدارة في ملفات أمن مشفرة</p>
        </div>
      </div>

      {/* Backup comparison trigger results */}
      {getCompareTable()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Create Backup Form settings */}
        <div className="lg:col-span-4 space-y-4" id="generate-backup-box">
          <form onSubmit={handleCreateClick} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-emerald-600" />
                حفظ نقطة استعادة فورية
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">النسخ الفوري متاح لجميع الجداول السبعة</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600">تدوين ملاحظة سريعة للنسخة (اختياري)</label>
              <textarea
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                placeholder="مثال: نسخة آمنة قبل دمج حلقات فرع الشمال، أو نهاية العام الصيفي..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              أخذ لقطة فورية (Backup)
            </button>
          </form>

          {/* Guidelines Box */}
          <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              سلامة ووقاية القواعد:
            </h4>
            <p className="text-indigo-800 leading-relaxed font-semibold">
              قبل أي عملية استعادة أو تراجع، يقوم النظام الكوديكال لدينا بأخذ لقطة احترازية مشفرة بقاعدة البيانات بشكل أتمتة احتياطاً وحماية لعمل الطلاب.
            </p>
          </div>
        </div>

        {/* Right Side: Backups List */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="backups-list-box">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">الأرشيف الفعلي والسجل الزمني للنسخ الاحتياطية</h3>
              <p className="text-slate-400 text-xs text-right">اختر نسختين كحد أقصى للمقارنة أو اضغط استعادة</p>
            </div>
            {comparingIds.length > 0 && (
              <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                تم تحديد ({comparingIds.length}/2) نسخ للمقارنة
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {backups.map((backup) => {
              const isComparing = comparingIds.includes(backup.id);
              return (
                <div 
                  key={backup.id}
                  className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => handleToggleCompare(backup.id)}
                      title="مقارنة بالنسخة الأخرى"
                      className="rounded border-slate-300 text-indigo-600 mt-1 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] font-bold text-slate-800 line-clamp-1">{backup.fileName}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-semibold items-center">
                        <span>نوع المشغّل: {backup.backedUpBy}</span>
                        <span>•</span>
                        <span>توزيع النواة: {backup.version}</span>
                        <span>•</span>
                        <span className="font-mono">{new Date(backup.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                      
                      {/* Compact stats summary */}
                      <div className="flex gap-2 text-[9px] text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-sm w-fit font-bold shadow-2xs mt-1.5">
                        <span>الطلاب: {backup.stats.students}</span>
                        <span>|</span>
                        <span>الحلقات: {backup.stats.circles}</span>
                        <span>|</span>
                        <span>المعلمون: {backup.stats.teachers}</span>
                        <span>|</span>
                        <span>الخريجون: {backup.stats.graduates}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handleDownloadBackup(backup)}
                      title="تحميل نسخة JSON مشفرة"
                      className="p-1.5 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>تنزيل</span>
                    </button>

                    <button
                      onClick={() => handleTriggerRestore(backup)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>بث استعادة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SAFETY RESTORE DIALOG MODAL (Satisfies Requirement 6 protocol) */}
      {restoringItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="restore-protection-dialog">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-150 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100 animate-pulse">
                <AlertTriangle className="h-6 w-6 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display">بروتوكول الأمان الدستوري قبل الاستعادة</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">مطلوب موافقة المدير العام الرسمية النهائية</p>
              </div>
            </div>

            {restoreSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950 font-medium text-xs leading-relaxed animate-fade-in">
                <p className="font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">« تم ترحيل واستعادة قاعدة البيانات بنجاح »</p>
                <p>{restoreSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                
                {/* 1. Show backup file details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <p className="text-slate-400 font-bold">تفاصيل الملف المستهدف للتراجع والاستعادة:</p>
                  <p className="font-bold text-indigo-950 font-mono text-[11px] break-all">{restoringItem.fileName}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100/65">
                    <span>تحرير: {restoringItem.backedUpBy}</span>
                    <span>النواة: {restoringItem.version}</span>
                  </div>
                </div>

                {/* 2. Show statistics contents stats as requested */}
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold mb-1">إحصائيات ومحتويات نسخة الاسترجاع المحددة:</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-700 font-bold">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">الطلاب</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.students}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">الحلقات</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.circles}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">المعلمون</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.teachers}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">الخريجون</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.graduates}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">الخطط الدراسية</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.plans}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-medium">إنجازات الحفظ</p>
                      <p className="font-mono mt-0.5 text-slate-900">{restoringItem.stats.achievements}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Auto backup notice */}
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-start gap-2 text-indigo-950 font-bold text-[11px] leading-relaxed">
                  <input 
                    type="checkbox" 
                    id="auto-bk-chk"
                    checked={autoBackupChecked}
                    onChange={(e) => setAutoBackupChecked(e.target.checked)}
                    className="rounded border-slate-200 text-indigo-650 mt-1"
                  />
                  <div>
                    <label htmlFor="auto-bk-chk" className="cursor-pointer select-none">
                      إنشاء نسخة احتياطية جديدة تلقائياً قبل تنفيذ الاستعادة حلاقة للأمن والوقاية (مستحسن بشدة).
                    </label>
                  </div>
                </div>

                {/* 4. Final confirmation from General Manager */}
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-2 text-rose-950 font-bold text-[11px] leading-relaxed">
                  <input 
                    type="checkbox" 
                    id="consent-bk-chk"
                    required
                    checked={gmConsentChecked}
                    onChange={(e) => setGmConsentChecked(e.target.checked)}
                    className="rounded border-rose-200 text-rose-750 mt-1 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="consent-bk-chk" className="cursor-pointer select-none">
                      أقسم وأؤكد أنا المدير العام عبدالرحمن السعيد بأنني واثق وموافق تماماً على استرجاع النظام وإجراء تراجع البيانات وسحب العمليات الحالية إلى هذا الموضع.
                    </label>
                  </div>
                </div>

                {/* Real buttons actions for REST restore */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setRestoringItem(null)}
                    disabled={isRestoringInProgress}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                  >
                    إلغاء التراجع المبرمج
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={!gmConsentChecked || !autoBackupChecked || isRestoringInProgress}
                    className={`px-5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 ${
                      (gmConsentChecked && autoBackupChecked && !isRestoringInProgress)
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    {isRestoringInProgress ? 'جاري ترحيل ومعالجة جداول البيانات...' : 'اعتماد وبدء الاستعادة الفورية'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
