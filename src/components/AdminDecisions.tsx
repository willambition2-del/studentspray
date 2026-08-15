/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Edit2, BadgeX, CheckCircle, FileCheck, MapPin, 
  Paperclip, Calendar, ArrowLeftRight, X, Info, ChevronLeft, ShieldCheck 
} from 'lucide-react';
import { AdminDecision, DecisionType } from '../types';

interface AdminDecisionsProps {
  decisions: AdminDecision[];
  onAddDecision: (data: Partial<AdminDecision>) => void;
  onUpdateDecision: (id: string, updates: Partial<AdminDecision>) => void;
}

export default function AdminDecisions({ decisions, onAddDecision, onUpdateDecision }: AdminDecisionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [examiningDecision, setExaminingDecision] = useState<AdminDecision | null>(null);

  // Form states for creation/editing
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DecisionType>('general');
  const [docTarget, setDocTarget] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docStatus, setDocStatus] = useState<'draft' | 'approved' | 'ongoing'>('draft');
  const [mockAttachments, setMockAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');

  const clearForm = () => {
    setDocTitle('');
    setDocType('general');
    setDocTarget('');
    setDocDate(new Date().toISOString().split('T')[0]);
    setDocContent('');
    setDocStatus('draft');
    setMockAttachments([]);
    setAttachmentInput('');
  };

  const handleOpenCreate = () => {
    clearForm();
    setIsCreateOpen(true);
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    setMockAttachments([...mockAttachments, attachmentInput.trim()]);
    setAttachmentInput('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setMockAttachments(mockAttachments.filter((_, i) => i !== idx));
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent || !docTarget) return;

    onAddDecision({
      title: docTitle,
      type: docType,
      targetEntity: docTarget,
      date: docDate,
      content: docContent,
      status: docStatus,
      attachments: mockAttachments
    });

    setIsCreateOpen(false);
    clearForm();
  };

  const getDocTypeLabel = (type: DecisionType) => {
    switch (type) {
      case 'hire_teacher': return 'تعيين معلم جديد';
      case 'transfer_teacher': return 'نقل وتكليف معلم';
      case 'hire_supervisor': return 'تعيين مشرف فرعي';
      case 'open_circle': return 'تأسيس وفتح حلقة جديدة';
      case 'close_circle': return 'حل وإغلاق حلقة';
      case 'merge_circles': return 'دمج حلقات قرآنية تجانسية';
      case 'transfer_student': return 'نقل طالب لفرع بديل';
      case 'approve_project': return 'اعتماد مشروع قرآني معزز';
      case 'approve_activity': return 'اعتماد الأنشطة والجوائز';
      case 'general': return 'قرار إداري تنفيدي عام';
    }
  };

  const getStatusBadge = (status: 'draft' | 'approved' | 'ongoing' | 'archived') => {
    switch (status) {
      case 'draft': 
        return <span className="bg-slate-100 text-slate-850 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-slate-200">مسودة دراسة</span>;
      case 'approved': 
        return <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-emerald-250 animate-pulse">قرار نافذ معتمد</span>;
      case 'ongoing': 
        return <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-blue-200">قيد التنفيذ والمتابعة</span>;
      case 'archived': 
        return <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-sm text-[10px] border border-slate-150">مؤرشف بالقرارات التاريخية</span>;
    }
  };

  const filteredDecisions = decisions.filter(desc => {
    const matchesSearch = 
      desc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.decisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.targetEntity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' ? true : desc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : desc.status === statusFilter;

    if (statusFilter !== 'archived' && desc.status === 'archived') {
      return false;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6" id="admin-decisions-root">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">سجل ومصلحة القرارات الإدارية الرسمية</h2>
          <p className="text-slate-400 text-xs">إصدار ومصادقة وثائق تعيين المعلمين، تأسيس حلقات التحفيظ ونقل الحفظة الموهوبين رسمياً</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          إصدار وصياغة قرار جديد
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 justify-between" id="decisions-filters-bar">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث برقم القرار، العنوان، النص أو جهة الاختصاص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Filter Selection dropboxes */}
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="all">كل أنواع القرارات</option>
            <option value="hire_teacher">تعيين معلم</option>
            <option value="transfer_teacher">نقل معلم</option>
            <option value="hire_supervisor">تعيين مشرف</option>
            <option value="open_circle">فتح حلقة جديدة</option>
            <option value="close_circle">أو إغلاق حلقة</option>
            <option value="merge_circles">دمج الحلقات</option>
            <option value="transfer_student">نقل طالب فرع</option>
            <option value="approve_project">اعتماد مشاريع</option>
            <option value="approve_activity">اعتماد فعاليات صيفية</option>
            <option value="general">قرارات عامة تنفيذية</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="all">كل القرارات النشطة</option>
            <option value="draft">المسودات</option>
            <option value="approved">المصادق النافذ</option>
            <option value="ongoing">قيد التنفيذ العملي</option>
            <option value="archived">جميع القرارات المؤرشفة</option>
          </select>
        </div>
      </div>

      {/* Grid splits: Decisions and the Legal document paper view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Cards of decisions */}
        <div className={`space-y-4 ${examiningDecision ? 'lg:col-span-6' : 'lg:col-span-12'}`} id="decisions-cards-wrapper">
          {filteredDecisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => setExaminingDecision(dec)}
              className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer text-right flex flex-col gap-3 ${
                examiningDecision?.id === dec.id 
                  ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-sm' 
                  : 'border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-900 text-[10px] font-bold px-2.5 py-0.5 rounded-sm border border-indigo-150 font-mono">
                    {dec.decisionNumber}
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 rounded-sm px-2 py-0.5 font-bold">
                    {getDocTypeLabel(dec.type)}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(dec.date).toLocaleDateString('ar-SA')}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 font-display text-sm leading-relaxed">{dec.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">الجهة الموجه إليها: {dec.targetEntity}</p>
                <p className="text-slate-500 leading-relaxed text-xs font-semibold mt-2 line-clamp-2">{dec.content}</p>
              </div>

              {dec.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  <span>يتضمن عدد ({dec.attachments.length}) مرفقات معتمدة</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                {getStatusBadge(dec.status)}
                
                <span className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-0.5">
                  قراءة صياغة القرار وتعديله
                  <ChevronLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}

          {filteredDecisions.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250">
              <FileCheck className="h-10 w-10 text-slate-350 mx-auto" strokeWidth={1} />
              <p className="text-slate-400 text-xs mt-3">سجل القرارات نظيف ومجدول بالكامل.</p>
            </div>
          )}
        </div>

        {/* Right Side: Printable legal view and updates */}
        {examiningDecision && (
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-md space-y-5 self-start sticky top-4 animate-fade-in" id="decisions-parchment-viewer">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <p className="font-bold text-sm text-slate-800 font-display">ركن الأوراق والمصادقة التنفيذية</p>
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">أرشيف القرارات المبرمة رقم ق-إ-1447</p>
              </div>
              <button
                onClick={() => setExaminingDecision(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Official Looking Document (The Arabic Parchment Letter) */}
            <div className="bg-orange-50/15 p-6 rounded-2xl border border-amber-100 relative space-y-4 text-xs font-semibold" style={{ backgroundImage: 'radial-gradient(#ecfdf5 1px, transparent 0)', backgroundSize: '24px 24px' }}>
              <div className="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-amber-100">
                <span className="font-bold">ملتقى الهدى القرآني بالرياض</span>
                <span className="font-mono">القرار رقم: {examiningDecision.decisionNumber}</span>
              </div>

              <div className="space-y-4 leading-relaxed font-sans text-slate-850">
                <h4 className="text-center font-bold text-sm text-emerald-950 font-display">« قرار إداري تنظيمي نافذ »</h4>
                
                <div className="space-y-2 leading-relaxed">
                  <p className="font-bold text-xs text-slate-900 border-r-2 border-emerald-500 pr-2">عنوان القرار: {examiningDecision.title}</p>
                  <p className="text-[10px] text-slate-400">تاريخ الإصدار: {new Date(examiningDecision.date).toLocaleDateString('ar-SA')} | تصنيف: {getDocTypeLabel(examiningDecision.type)}</p>
                </div>

                <div className="bg-white/80 p-4 border border-slate-100 rounded-xl leading-relaxed text-slate-600 font-semibold font-mono whitespace-pre-line shadow-2xs">
                  {examiningDecision.content}
                </div>

                <div className="bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100 text-[10px] leading-relaxed text-emerald-900 text-right">
                  <p className="font-bold">الجهة المنوط بها التنفيذ ومكلفة بالقرار:</p>
                  <p className="font-mono text-slate-700 mt-0.5">« {examiningDecision.targetEntity} »</p>
                </div>

                {examiningDecision.attachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] text-slate-400 font-bold">الملحقات والمرفقات الرسمية:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {examiningDecision.attachments.map((file, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 rounded text-[9px] px-2 py-0.5 font-mono text-slate-600 flex items-center gap-1">
                          <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* simulated stamp logo */}
              <div className="flex justify-end pt-4 text-left border-t border-amber-50">
                <div className="text-center space-y-1 border border-dashed border-emerald-600/30 p-2.5 rounded-xl bg-emerald-50/10">
                  <span className="text-[9px] text-slate-400 font-bold block">موقع ومختوم بقرار المدير العام</span>
                  <span className="font-serif italic font-bold text-emerald-800 text-[11px] block mt-1">عبد الرحمن السعيد</span>
                </div>
              </div>
            </div>

            {/* Updates actions */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <p className="text-slate-400 font-bold">متابعة صياغة القرار وحالته التنفيذية:</p>
              
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onUpdateDecision(examiningDecision.id, { status: 'approved' })}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>تفعيل واعتماد نافذ</span>
                </button>

                <button
                  onClick={() => onUpdateDecision(examiningDecision.id, { status: 'ongoing' })}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>تأكيد قيد المتابعة</span>
                </button>

                <button
                  onClick={() => onUpdateDecision(examiningDecision.id, { status: 'archived' })}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <BadgeX className="h-3.5 w-3.5" />
                  <span>تجميد وأرشفة</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="issue-decision-modal">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-100 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-display flex items-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-emerald-600" />
                صياغة وإصدار موازين القرارات الإدارية
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-600">عنوان القرار الإجرائي</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تعيين الشيخ تركي معلماً لحلقة الكور العالية وصغار الحفظة..."
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Type selection dropdown */}
                <div className="space-y-1">
                  <label className="text-slate-600">تصنيف نوع القرار</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DecisionType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="hire_teacher">تعيين مدرس</option>
                    <option value="transfer_teacher">نقل مدرس</option>
                    <option value="hire_supervisor">تعيين مشرف فني</option>
                    <option value="open_circle">فتح حلقة جديدة</option>
                    <option value="close_circle">إغلاق حلقة</option>
                    <option value="merge_circles">دمج حلقات متجانسة</option>
                    <option value="transfer_student">نقل طالب بين فروع</option>
                    <option value="approve_project">اعتماد مشروع قرآني</option>
                    <option value="approve_activity">اعتماد نشاط</option>
                    <option value="general">قرار عام تنظيمي</option>
                  </select>
                </div>

                {/* Target Entity */}
                <div className="space-y-1">
                  <label className="text-slate-600">الجهة المعنية بالتنفيذ والمتابعة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إدارة فرع الشمال - لجنة التدريس"
                    value={docTarget}
                    onChange={(e) => setDocTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-slate-600">تاريخ سريان القرار</label>
                  <input
                    type="date"
                    required
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-mono"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-slate-600">حالة القرار الأولية</label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as 'draft' | 'approved' | 'ongoing')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="draft">حفظ كمسودة أولية تحت المراجعة</option>
                    <option value="approved">مصادقة وتفعيل فوري نافذ</option>
                    <option value="ongoing">تأكيد سريان المتابعة</option>
                  </select>
                </div>

                {/* Text Content */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-600">نص القرار الإداري الشامل والمبررات</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="مثال: بناءً على مرئيات مشرف الحلقات وتوافر مقعد شاغر، يتقرر تعيين الشيخ تركي..."
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white leading-relaxed font-sans"
                  />
                </div>

                {/* Attachments list with ADD simulation */}
                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-100 pt-3">
                  <p className="text-slate-700 font-bold">الملحقات والمرفقات العقدية (تنزيل وثائق المعاينة)</p>
                  
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="اكتب مستند المرفق (مثال: سيرة_ذاتية_تركي.pdf)"
                      value={attachmentInput}
                      onChange={(e) => setAttachmentInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      إضافة ملف
                    </button>
                  </div>

                  {/* List of simulated attachments */}
                  {mockAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {mockAttachments.map((file, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 rounded-md text-[9px] px-2 py-0.75 font-mono text-slate-700 flex items-center gap-1 shrink-0">
                          <Paperclip className="h-3 w-3 text-slate-400" />
                          {file}
                          <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-rose-500 hover:text-rose-700 font-bold font-sans">x</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء الصياغة
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  حفظ وتصميم القرار الإداري
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
