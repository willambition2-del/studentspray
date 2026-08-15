/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, RefreshCcw, XCircle, FileText, ChevronLeft, 
  MapPin, Calendar, ClipboardList, Info, HelpCircle, CornerDownLeft,
  Plus, Search, Filter, Printer, Download, Eye, Paperclip, MessageSquare,
  ArrowRightLeft, ShieldAlert, Send, Edit3, UserCheck, DollarSign, BookOpen,
  Award, Building2, User, Layers, Check, Clock, AlertTriangle, FileCheck,
  ExternalLink, Sparkles, X, ChevronDown, CheckSquare, Share2
} from 'lucide-react';
import { ApprovalRequest, ApprovalType, UrgencyLevel, ApprovalAttachment, ClarificationRequest, ApprovalAuditEntry } from '../types';

interface ApprovalsCenterProps {
  approvals: ApprovalRequest[];
  onAction: (
    id: string, 
    status: 'approved' | 'rejected' | 'revision' | 'conditional_approved', 
    notes?: string,
    extraData?: Partial<ApprovalRequest>
  ) => void;
  onCreate?: (newReq: Partial<ApprovalRequest>) => void;
}

export default function ApprovalsCenter({ approvals, onAction, onCreate }: ApprovalsCenterProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'archive' | 'communications'>('pending');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');

  // Currently inspected request
  const [examiningReq, setExaminingReq] = useState<ApprovalRequest | null>(null);

  // Inspector Action Form States
  const [decisionMode, setDecisionMode] = useState<'approve' | 'conditional' | 'revision' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [approvalConditions, setApprovalConditions] = useState('');
  
  // Data editing mode within request
  const [isEditingData, setIsEditingData] = useState(false);
  const [editForm, setEditForm] = useState<{
    allocatedBudget?: number;
    targetCircleName?: string;
    customPlanDays?: number;
    extraInstructions?: string;
  }>({});

  // Addressing / Communication Thread States
  const [newThreadNote, setNewThreadNote] = useState('');
  const [showClarificationForm, setShowClarificationForm] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [targetCommittee, setTargetCommittee] = useState('اللجنة العلمية والمناهج');
  const [forwardNotes, setForwardNotes] = useState('');

  // Decision Document Certificate Modal
  const [printDocReq, setPrintDocReq] = useState<ApprovalRequest | null>(null);

  // New Request Submission Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReqForm, setNewReqForm] = useState<{
    title: string;
    type: ApprovalType;
    department: string;
    requesterName: string;
    requesterRole: string;
    urgency: UrgencyLevel;
    details: string;
    targetBranch: string;
    targetCircle: string;
    affectedEntityCount: number;
    estimatedBudget: number;
  }>({
    title: '',
    type: 'admin_decision',
    department: 'إدارة الفروع والشؤون التعليمية',
    requesterName: 'الأستاذ أحمد السعيد',
    requesterRole: 'مشرف تعليمي',
    urgency: 'normal',
    details: '',
    targetBranch: 'فرع الشمال',
    targetCircle: 'حلقة الإمام عاصم',
    affectedEntityCount: 1,
    estimatedBudget: 0
  });

  // Category Helpers
  const getTypeNameAr = (type: ApprovalType) => {
    switch (type) {
      case 'student_plan': return 'اعتماد خطة طالب فردية';
      case 'circle_plan': return 'اعتماد ميزان/خطة حلقة';
      case 'activity': return 'اعتماد نشاط أو فعالية صيفية';
      case 'annual_report': return 'اعتماد التقرير السنوي والإحصاء';
      case 'student_transfer': return 'اعتماد نقل طالب بين الفروع';
      case 'admin_decision': return 'اعتماد قرارات إدارية عليا';
      case 'financial_budget': return 'اعتماد ميزانية وصرفيات مالية';
      case 'curriculum_change': return 'اعتماد وتطوير المناهج والمتون';
      case 'quality_audit': return 'اعتماد معايير وتقارير الجودة';
      case 'parent_appeal': return 'اعتماد التماسات أولياء الأمور';
      case 'teacher_nomination': return 'ترشيح وتعيين كادر تعليمي';
      default: return 'طلب اعتماد رسمي';
    }
  };

  const getUrgencyBadge = (urgency?: UrgencyLevel) => {
    switch (urgency) {
      case 'urgent':
        return <span className="bg-red-100 text-red-900 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"><AlertTriangle className="h-3 w-3 text-red-600" /> عاجل جداً</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"><Clock className="h-3 w-3 text-amber-600" /> هام</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">عادي</span>;
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected' | 'revision' | 'conditional_approved') => {
    switch (status) {
      case 'pending': 
        return <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-600" /> بانتظار الرأي الإداري</span>;
      case 'approved': 
        return <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> معتمد وموافق عليه</span>;
      case 'conditional_approved': 
        return <span className="bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5 text-teal-600" /> اعتماد مشروط بضوابط</span>;
      case 'rejected': 
        return <span className="bg-red-50 text-red-900 border border-red-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-600" /> مرفوض مسبّباً</span>;
      case 'revision': 
        return <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"><RefreshCcw className="h-3.5 w-3.5 text-blue-600" /> مُعاد للمراجعة والتعديل</span>;
    }
  };

  // Filtered requests lists
  const pendingRequests = approvals.filter(a => a.status === 'pending');
  const finishedRequests = approvals.filter(a => a.status !== 'pending');

  const getDisplayedRequests = () => {
    let source = activeTab === 'pending' ? pendingRequests : finishedRequests;
    
    return source.filter(req => {
      const matchesSearch = 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.decisionNumber && req.decisionNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (req.department && req.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (req.details && req.details.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' ? true : req.type === selectedType;
      const matchesUrgency = selectedUrgency === 'all' ? true : (req.urgency || 'normal') === selectedUrgency;
      const matchesDepartment = selectedDepartment === 'all' ? true : req.department === selectedDepartment;
      const matchesArchiveStatus = (activeTab === 'archive' && selectedStatusFilter !== 'all') 
        ? req.status === selectedStatusFilter 
        : true;

      return matchesSearch && matchesType && matchesUrgency && matchesDepartment && matchesArchiveStatus;
    });
  };

  const selectedStatusFilter = archiveStatusFilter;
  const displayedRequests = getDisplayedRequests();

  // Handlers
  const handleOpenExamine = (req: ApprovalRequest) => {
    setExaminingReq(req);
    setActionNotes(req.notes || '');
    setDecisionReason(req.decisionReason || '');
    setApprovalConditions(req.approvalConditions || '');
    setDecisionMode(null);
    setIsEditingData(false);
    setEditForm({
      allocatedBudget: req.approvedBudget || req.estimatedBudget || 0,
      targetCircleName: req.targetCircle || '',
      customPlanDays: req.editableData?.customPlanDays || 30,
      extraInstructions: req.editableData?.extraInstructions || ''
    });
  };

  const handleExecuteDecision = (status: 'approved' | 'rejected' | 'revision' | 'conditional_approved') => {
    if (!examiningReq) return;

    const extraData: Partial<ApprovalRequest> = {
      decisionReason: decisionReason,
      approvalConditions: status === 'conditional_approved' ? approvalConditions : undefined,
      approvedBudget: editForm.allocatedBudget,
      editableData: {
        ...examiningReq.editableData,
        allocatedBudget: editForm.allocatedBudget,
        targetCircleName: editForm.targetCircleName,
        customPlanDays: editForm.customPlanDays,
        extraInstructions: editForm.extraInstructions
      },
      auditTrail: [
        {
          id: `at-${Date.now()}`,
          author: 'المدير العام',
          role: 'رئيس مركز الموافقات العليا',
          action: status === 'approved' ? 'اعتماد وموافقة نهائية' :
                  status === 'conditional_approved' ? 'اعتماد مشروط وضوابط' :
                  status === 'revision' ? 'إعادة للمراجعة والتعديل' : 'رفض المعاملة مسبباً',
          notes: actionNotes || decisionReason || approvalConditions,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onAction(examiningReq.id, status, actionNotes, extraData);
    setExaminingReq(null);
    setDecisionMode(null);
    setActionNotes('');
    setDecisionReason('');
    setApprovalConditions('');
  };

  const handleSaveDataEdits = () => {
    if (!examiningReq) return;
    const updatedReq = {
      ...examiningReq,
      approvedBudget: editForm.allocatedBudget,
      targetCircle: editForm.targetCircleName || examiningReq.targetCircle,
      editableData: {
        ...examiningReq.editableData,
        allocatedBudget: editForm.allocatedBudget,
        targetCircleName: editForm.targetCircleName,
        customPlanDays: editForm.customPlanDays,
        extraInstructions: editForm.extraInstructions
      }
    };
    
    // Call onAction with pending status to save updated data fields
    onAction(examiningReq.id, examiningReq.status, examiningReq.notes, {
      approvedBudget: editForm.allocatedBudget,
      targetCircle: editForm.targetCircleName || examiningReq.targetCircle,
      editableData: updatedReq.editableData,
      auditTrail: [
        {
          id: `at-${Date.now()}`,
          author: 'المدير العام',
          role: 'رئيس المركز',
          action: 'تعديل بيانات ومعلمات المعاملة',
          notes: `تم تعديل الميزانية المعتمدة إلى (${editForm.allocatedBudget?.toLocaleString()} ريال) وتحديث الشروط التنفيذية.`,
          timestamp: new Date().toISOString()
        }
      ]
    });

    setExaminingReq(updatedReq);
    setIsEditingData(false);
  };

  const handleAddThreadNote = () => {
    if (!examiningReq || !newThreadNote.trim()) return;

    const newAuditTrail = [
      ...(examiningReq.auditTrail || []),
      {
        id: `at-${Date.now()}`,
        author: 'المدير العام',
        role: 'إدارة العليا',
        action: 'توجيه إداري ومخاطبة رسمية',
        notes: newThreadNote.trim(),
        timestamp: new Date().toISOString()
      }
    ];

    onAction(examiningReq.id, examiningReq.status, examiningReq.notes, {
      auditTrail: newAuditTrail
    });

    setExaminingReq({ ...examiningReq, auditTrail: newAuditTrail });
    setNewThreadNote('');
  };

  const handleSendClarification = () => {
    if (!examiningReq || !clarificationQuestion.trim()) return;

    const newClarifications: ClarificationRequest[] = [
      ...(examiningReq.clarificationRequests || []),
      {
        id: `clr-${Date.now()}`,
        requestedBy: 'المدير العام',
        question: clarificationQuestion.trim(),
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    ];

    const newAuditTrail = [
      ...(examiningReq.auditTrail || []),
      {
        id: `at-${Date.now()}`,
        author: 'المدير العام',
        role: 'إدارة العليا',
        action: 'طلب استكمال مستندات وإيضاح',
        notes: `تم توجيه سؤال رسمي للجهة الطالبة: "${clarificationQuestion.trim()}"`,
        timestamp: new Date().toISOString()
      }
    ];

    onAction(examiningReq.id, examiningReq.status, examiningReq.notes, {
      clarificationRequests: newClarifications,
      auditTrail: newAuditTrail
    });

    setExaminingReq({
      ...examiningReq,
      clarificationRequests: newClarifications,
      auditTrail: newAuditTrail
    });

    setClarificationQuestion('');
    setShowClarificationForm(false);
  };

  const handleForwardToCommittee = () => {
    if (!examiningReq) return;

    const newAuditTrail = [
      ...(examiningReq.auditTrail || []),
      {
        id: `at-${Date.now()}`,
        author: 'المدير العام',
        role: 'إدارة العليا',
        action: `تحويل المعاملة إلى (${targetCommittee})`,
        notes: forwardNotes ? `ملاحظات الإحالة: ${forwardNotes}` : `تم إحالة الملف للدراسة الفنية لدى ${targetCommittee}.`,
        timestamp: new Date().toISOString()
      }
    ];

    onAction(examiningReq.id, examiningReq.status, examiningReq.notes, {
      assignedCommittee: targetCommittee,
      auditTrail: newAuditTrail
    });

    setExaminingReq({
      ...examiningReq,
      assignedCommittee: targetCommittee,
      auditTrail: newAuditTrail
    });

    setForwardNotes('');
    setShowForwardModal(false);
  };

  const handleCreateNewRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqForm.title || !newReqForm.details) return;

    if (onCreate) {
      onCreate({
        ...newReqForm,
        status: 'pending',
        createdAt: new Date().toISOString(),
        editableData: {
          allocatedBudget: newReqForm.estimatedBudget
        }
      });
    }

    setShowNewModal(false);
    setNewReqForm({
      title: '',
      type: 'admin_decision',
      department: 'إدارة الفروع والشؤون التعليمية',
      requesterName: 'الأستاذ أحمد السعيد',
      requesterRole: 'مشرف تعليمي',
      urgency: 'normal',
      details: '',
      targetBranch: 'فرع الشمال',
      targetCircle: 'حلقة الإمام عاصم',
      affectedEntityCount: 1,
      estimatedBudget: 0
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="approvals-center-root">
      
      {/* 1. TOP HEADER & SUMMARY METRICS */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                مركز القرارات والموافقة العليا الشامل
              </span>
              <span className="bg-white/10 text-slate-200 text-[11px] font-mono px-2.5 py-0.5 rounded-full">
                عام 1447 - 1448 هـ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              مركز الاعتمادات والموافقات العليا
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              المحطة الموحدة للبت والاعتماد لجميع القضايا والمبادرات والخطط والتحويلات والميزانيات الواردة من جميع الفروع، المعلمين، المشرفين، الشؤون التعليمية والمالية وأولياء الأمور.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>تقديم طلب اعتماد جديد</span>
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-slate-400 text-[11px] font-medium">إجمالي المعاملات الواردة</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{approvals.length}</span>
              <FileCheck className="h-4 w-4 text-emerald-400" />
            </div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-amber-500/20 flex flex-col justify-between space-y-1">
            <span className="text-amber-300 text-[11px] font-medium">بانتظار البت والاعتماد</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-amber-200">{pendingRequests.length}</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-500/20 flex flex-col justify-between space-y-1">
            <span className="text-emerald-300 text-[11px] font-medium">القرارات المعمدة والنافذة</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-200">
                {approvals.filter(a => a.status === 'approved' || a.status === 'conditional_approved').length}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-blue-500/20 flex flex-col justify-between space-y-1">
            <span className="text-blue-300 text-[11px] font-medium">تحت المراجعة والتعديل</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-blue-200">
                {approvals.filter(a => a.status === 'revision').length}
              </span>
              <RefreshCcw className="h-4 w-4 text-blue-400" />
            </div>
          </div>

          <div className="bg-red-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-red-500/20 flex flex-col justify-between space-y-1 col-span-2 sm:col-span-1">
            <span className="text-red-300 text-[11px] font-medium">المعاملات المرفوضة مسبباً</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-red-200">
                {approvals.filter(a => a.status === 'rejected').length}
              </span>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABS NAVIGATION & MAIN CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => { setActiveTab('pending'); setExaminingReq(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>الطلبات المعلقة ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('archive'); setExaminingReq(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>أرشيف القرارات والمعاملات المعمدة ({finishedRequests.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('communications'); setExaminingReq(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'communications'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span>سجل المخاطبات المتبادلة وتوسيع المعالجة</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded-xl border border-slate-100 shrink-0 self-end md:self-auto">
          المزامن التلقائي: <span className="text-emerald-700 font-mono">Real-time Connected</span>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="البحث بالرقم المرجعي، العنوان، اسم الجهة الطالبة، أو نص القرار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-sans"
            >
              <option value="all">كل تصنيفات الاعتمادات (الكل)</option>
              <option value="student_plan">خطة طالب فردية</option>
              <option value="circle_plan">ميزان/خطة حلقة قرآنية</option>
              <option value="activity">أنشطة صيفية ورحلات</option>
              <option value="annual_report">تقارير الإحصاء السنوية</option>
              <option value="student_transfer">نقل وتوجيه معزز للطلاب</option>
              <option value="financial_budget">صفيات وميزانيات مالية</option>
              <option value="curriculum_change">تحديث وتطوير المناهج</option>
              <option value="quality_audit">معايير وتقارير الجودة</option>
              <option value="parent_appeal">التماسات أولياء الأمور</option>
              <option value="teacher_nomination">ترشيح وتعيين معلم</option>
              <option value="admin_decision">قرارات إدارية كبرى</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            >
              <option value="all">كل درجات الاستعجال</option>
              <option value="urgent">عاجل جداً</option>
              <option value="high">هام</option>
              <option value="normal">عادي</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            >
              <option value="all">كل الجهات الطالبة</option>
              <option value="قسم التعليم والحلقات (فرع الشمال)">قسم التعليم والحلقات</option>
              <option value="إدارة الشؤون التعليمية">إدارة الشؤون التعليمية</option>
              <option value="إدارة الأنشطة والرحلات">إدارة الأنشطة والرحلات</option>
              <option value="شؤون الطلاب والتسجيل">شؤون الطلاب والتسجيل</option>
              <option value="إدارة المالية والوسائل">إدارة المالية والوسائل</option>
              <option value="اللجنة العلمية والمناهج">اللجنة العلمية والمناهج</option>
              <option value="إدارة الكوادر والموارد البشرية">إدارة الكوادر والموارد البشرية</option>
              <option value="مجلس أولياء الأمور والرعاية">مجلس أولياء الأمور</option>
            </select>
          </div>
        </div>

        {/* Extra Status filter if viewing Archive */}
        {activeTab === 'archive' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-bold">
            <span className="text-slate-400 text-[11px] shrink-0">تصفية نتائج الأرشيف:</span>
            <button
              onClick={() => setArchiveStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${archiveStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              الكل ({finishedRequests.length})
            </button>
            <button
              onClick={() => setArchiveStatusFilter('approved')}
              className={`px-3 py-1 rounded-lg transition-all ${archiveStatusFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'}`}
            >
              معتمد وموافقة ({finishedRequests.filter(f => f.status === 'approved').length})
            </button>
            <button
              onClick={() => setArchiveStatusFilter('conditional_approved')}
              className={`px-3 py-1 rounded-lg transition-all ${archiveStatusFilter === 'conditional_approved' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800'}`}
            >
              اعتماد مشروط ({finishedRequests.filter(f => f.status === 'conditional_approved').length})
            </button>
            <button
              onClick={() => setArchiveStatusFilter('revision')}
              className={`px-3 py-1 rounded-lg transition-all ${archiveStatusFilter === 'revision' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'}`}
            >
              معاد للمراجعة ({finishedRequests.filter(f => f.status === 'revision').length})
            </button>
            <button
              onClick={() => setArchiveStatusFilter('rejected')}
              className={`px-3 py-1 rounded-lg transition-all ${archiveStatusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800'}`}
            >
              مرفوض ({finishedRequests.filter(f => f.status === 'rejected').length})
            </button>
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT VIEW PANELS */}

      {/* TAB 1 & TAB 2: REQUESTS LIST & INSPECTOR SPLIT VIEW */}
      {(activeTab === 'pending' || activeTab === 'archive') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="approvals-split-panel">
          
          {/* REQUESTS LIST COLUMN */}
          <div className={`space-y-3 transition-all duration-300 ${examiningReq ? 'lg:col-span-6' : 'lg:col-span-12'}`} id="approvals-requests-column">
            
            {displayedRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => handleOpenExamine(req)}
                className={`p-5 bg-white rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between gap-4 relative overflow-hidden ${
                  examiningReq?.id === req.id 
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/10' 
                    : 'border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Urgent indicator strip */}
                {req.urgency === 'urgent' && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-red-500" />
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-lg text-[10px] font-mono">
                      {req.decisionNumber || req.id}
                    </span>
                    <span className="bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg px-2.5 py-0.5 text-[10px] font-bold">
                      {getTypeNameAr(req.type)}
                    </span>
                    {getUrgencyBadge(req.urgency)}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    تاريخ الرفع: {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 font-display text-sm leading-snug">{req.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-700">{req.requesterName}</span>
                    <span>•</span>
                    <span className="text-slate-400">{req.department || 'إدارة الفرع'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed line-clamp-2 text-xs font-normal pt-1">
                    {req.details}
                  </p>
                </div>

                {/* Additional Metadata indicators */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1">
                  {req.targetBranch && (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      {req.targetBranch}
                    </span>
                  )}
                  {req.estimatedBudget ? (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-mono font-bold">
                      <DollarSign className="h-3 w-3 text-emerald-600" />
                      الميزانية: {req.estimatedBudget.toLocaleString()} ريال
                    </span>
                  ) : null}
                  {req.attachments && req.attachments.length > 0 && (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      <Paperclip className="h-3 w-3 text-slate-400" />
                      {req.attachments.length} مرفقات رسمية
                    </span>
                  )}
                  {req.assignedCommittee && (
                    <span className="flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-100 font-bold">
                      <UserCheck className="h-3 w-3 text-purple-600" />
                      محال إلى: {req.assignedCommittee}
                    </span>
                  )}
                </div>

                {/* Footer status & Action link */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  {getStatusBadge(req.status)}

                  <div className="flex items-center gap-2">
                    {req.status !== 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintDocReq(req);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="معاينة وطباعة القرار الرسمي المعمد"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">وثيقة القرار</span>
                      </button>
                    )}

                    <span className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      معاينة وتدقيق
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {displayedRequests.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 space-y-3">
                <ClipboardList className="h-12 w-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">لا تتوفر أي طلبات مطابقة لفلاتر البحث الحالية</h4>
                <p className="text-slate-400 text-xs">الحمد لله، كافة المعاملات والقرارات مستوفية ومسجلة بشكل سليم.</p>
              </div>
            )}
          </div>

          {/* INSPECTOR & ACTION PANEL COLUMN */}
          {examiningReq && (
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6 sticky top-4 animate-fade-in self-start" id="inspector-panel">
              
              {/* Header Inspector */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] px-2.5 py-0.5 font-extrabold font-mono">
                    {examiningReq.decisionNumber || examiningReq.id}
                  </span>
                  <h3 className="font-extrabold text-slate-900 font-display text-base mt-1">
                    {examiningReq.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {examiningReq.status !== 'pending' && (
                    <button
                      onClick={() => setPrintDocReq(examiningReq)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>وثيقة القرار</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setExaminingReq(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Full Request Details & Metadata */}
              <div className="space-y-4 text-xs">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">تصنيف المعاملة:</span>
                    <span className="font-bold text-slate-800 text-[11px]">{getTypeNameAr(examiningReq.type)}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">الجهة والرافع:</span>
                    <span className="font-bold text-slate-800 text-[11px]">{examiningReq.requesterName}</span>
                    <span className="text-[10px] text-slate-400 block">{examiningReq.department}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">درجة الاستعجال:</span>
                    <div className="mt-0.5">{getUrgencyBadge(examiningReq.urgency)}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">الفرع المعني:</span>
                    <span className="font-bold text-slate-800">{examiningReq.targetBranch || 'جميع الفروع'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">المستفيدون المتأثرون:</span>
                    <span className="font-bold text-slate-800 font-mono">{examiningReq.affectedEntityCount || 1} طالب / معلم</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">الميزانية التقديرية:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {examiningReq.estimatedBudget ? `${examiningReq.estimatedBudget.toLocaleString()} ريال` : 'غير مطلوبة'}
                    </span>
                  </div>
                </div>

                {/* Request Statement Content */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">نص طلب الاعتماد ومبررات الرفع الإنشائية:</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 leading-relaxed text-slate-700 font-medium text-xs whitespace-pre-line">
                    {examiningReq.details}
                  </div>
                </div>

                {/* Attachments Section */}
                {examiningReq.attachments && examiningReq.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="font-bold text-slate-700 block">المرفقات والمستندات الرسمية المرفقة:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {examiningReq.attachments.map((att, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-all">
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800 truncate">{att.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{att.size || 'PDF'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDITABLE DATA SECTION (المرونة في التعديل على البيانات قبل الاعتماد) */}
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-amber-700" />
                      <span className="font-bold text-amber-900">مرونة التعديل على بيانات المعاملة قبل Bَت القرار</span>
                    </div>
                    <button
                      onClick={() => setIsEditingData(!isEditingData)}
                      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      {isEditingData ? 'إلغاء التعديل' : 'تعديل المعلمات والبيانات'}
                    </button>
                  </div>

                  {isEditingData ? (
                    <div className="space-y-3 pt-2 border-t border-amber-200/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-amber-900 block mb-1">الميزانية المعتمدة الصافية (ريال):</label>
                          <input
                            type="number"
                            value={editForm.allocatedBudget || ''}
                            onChange={(e) => setEditForm({ ...editForm, allocatedBudget: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-600 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-amber-900 block mb-1">الحلقة / الفرع المستهدف:</label>
                          <input
                            type="text"
                            value={editForm.targetCircleName || ''}
                            onChange={(e) => setEditForm({ ...editForm, targetCircleName: e.target.value })}
                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-600 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">توجيهات إضافية على الخطة والتنفيذ:</label>
                        <input
                          type="text"
                          value={editForm.extraInstructions || ''}
                          onChange={(e) => setEditForm({ ...editForm, extraInstructions: e.target.value })}
                          placeholder="مثال: اشتراط التقييم الأسبوعي، أو تقديم تقرير ختامي"
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-600"
                        />
                      </div>

                      <button
                        onClick={handleSaveDataEdits}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Check className="h-4 w-4" />
                        <span>حفظ التعديلات على المعاملة</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-950 font-medium space-y-1">
                      {examiningReq.approvedBudget !== undefined && (
                        <p>• الميزانية المعمدة المعدلة: <span className="font-mono font-bold text-emerald-800">{examiningReq.approvedBudget.toLocaleString()} ريال</span></p>
                      )}
                      {examiningReq.editableData?.extraInstructions && (
                        <p>• التوجيهات الفنية الإضافية: <span className="font-bold">{examiningReq.editableData.extraInstructions}</span></p>
                      )}
                      {!examiningReq.approvedBudget && !examiningReq.editableData?.extraInstructions && (
                        <p className="text-amber-800/80">لم يتم تعديل البيانات الأساسية للطلب، يمكنك تعديل القيم قبل المصادقة والاعتماد.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* EXPANDED ADDRESSING & COMMUNICATION THREAD (توسيع دائرة المخاطبة) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                      <span className="font-bold text-slate-800">سجل المخاطبات المتبادلة والإحالات</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowClarificationForm(!showClarificationForm)}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle className="h-3 w-3" />
                        <span>طلب توضيح</span>
                      </button>

                      <button
                        onClick={() => setShowForwardModal(true)}
                        className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>تحويل للجنة</span>
                      </button>
                    </div>
                  </div>

                  {/* Clarification Input Inline */}
                  {showClarificationForm && (
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2 animate-fade-in">
                      <span className="font-bold text-indigo-900 block text-[11px]">طلب استكمال مستندات أو استفسار رسمي من الجهة الطالبة:</span>
                      <textarea
                        value={clarificationQuestion}
                        onChange={(e) => setClarificationQuestion(e.target.value)}
                        placeholder="اكتب استفسارك الموجه للجهة الطالبة بوضوح..."
                        rows={2}
                        className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowClarificationForm(false)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleSendClarification}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          <span>إرسال الاستفسار</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thread Audit Entries List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-[11px]">
                    {examiningReq.auditTrail && examiningReq.auditTrail.length > 0 ? (
                      examiningReq.auditTrail.map((entry) => (
                        <div key={entry.id} className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-slate-800">{entry.author} ({entry.role})</span>
                            <span className="text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="inline-block bg-indigo-50 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[9px]">
                            {entry.action}
                          </span>
                          {entry.notes && (
                            <p className="text-slate-600 font-medium leading-relaxed mt-1">« {entry.notes} »</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-[10px] text-center py-2">لا توجد مخاطبات سابقة مسجلة على هذه المعاملة.</p>
                    )}
                  </div>

                  {/* Add Administrative Note Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newThreadNote}
                      onChange={(e) => setNewThreadNote(e.target.value)}
                      placeholder="إضافة توجيه إداري أو ملاحظة بالسجل..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                    />
                    <button
                      onClick={handleAddThreadNote}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>تدوين</span>
                    </button>
                  </div>
                </div>

                {/* Pre-existing notes or Conditions */}
                {examiningReq.approvalConditions && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                    <span className="font-bold text-teal-900 flex items-center gap-1 text-[11px]">
                      <CheckSquare className="h-3.5 w-3.5 text-teal-700" />
                      ضوابط وشروط الاعتماد المشروط:
                    </span>
                    <p className="text-teal-950 font-semibold leading-relaxed text-xs">« {examiningReq.approvalConditions} »</p>
                  </div>
                )}

                {examiningReq.notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                      <CornerDownLeft className="h-3.5 w-3.5 text-amber-700" />
                      الملاحظات والتوجيهات الإدارية المعتمدة:
                    </span>
                    <p className="text-amber-950 font-semibold leading-relaxed text-xs">« {examiningReq.notes} »</p>
                  </div>
                )}

              </div>

              {/* DECISION EXECUTION ACTIONS PANEL */}
              <div className="pt-4 border-t border-slate-100 space-y-3" id="decision-actions-subpanel">
                
                {/* Decision Form inputs if a decision mode is selected */}
                {decisionMode && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">
                        {decisionMode === 'approve' && 'صياغة الاعتماد والموافقة النهائية'}
                        {decisionMode === 'conditional' && 'صياغة الاعتماد المشروط بضوابط'}
                        {decisionMode === 'revision' && 'طلب مراجعة وتعديل المعاملة'}
                        {decisionMode === 'reject' && 'تسبيب رفض المعاملة'}
                      </span>
                      <button 
                        onClick={() => setDecisionMode(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        إلغاء
                      </button>
                    </div>

                    {decisionMode === 'conditional' && (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 text-[11px]">الشروط والضوابط التنفيذية اللازمة للاعتماد:</label>
                        <input
                          type="text"
                          value={approvalConditions}
                          onChange={(e) => setApprovalConditions(e.target.value)}
                          placeholder="مثال: تجربة المنهج لمدة شهرين رفقة تقرير تقييمي قبل التعميم"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-teal-500 font-sans"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">توجيهات وملاحظات القرار الرسمي:</label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="اكتب التوجيهات الرسمية الصادرة من الإدارة العليا..."
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={() => handleExecuteDecision(
                        decisionMode === 'approve' ? 'approved' :
                        decisionMode === 'conditional' ? 'conditional_approved' :
                        decisionMode === 'revision' ? 'revision' : 'rejected'
                      )}
                      className={`w-full font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        decisionMode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                        decisionMode === 'conditional' ? 'bg-teal-600 hover:bg-teal-700 text-white' :
                        decisionMode === 'revision' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>تأكيد وإصدار القرار الرسمي</span>
                    </button>
                  </div>
                )}

                {/* Primary Action Buttons Bar */}
                {!decisionMode && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => setDecisionMode('approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                      <span>اعتماد وموافقة</span>
                    </button>

                    <button
                      onClick={() => setDecisionMode('conditional')}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer text-xs"
                    >
                      <CheckSquare className="h-4 w-4 text-teal-600" />
                      <span>اعتماد مشروط</span>
                    </button>

                    <button
                      onClick={() => setDecisionMode('revision')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer text-xs"
                    >
                      <RefreshCcw className="h-4 w-4 text-blue-600" />
                      <span>إعادة للمراجعة</span>
                    </button>

                    <button
                      onClick={() => setDecisionMode('reject')}
                      className="bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 font-bold py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer text-xs"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>رفض المعاملة</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 3: COMMUNICATIONS & THREADS SUMMARY */}
      {activeTab === 'communications' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg font-display">سجل دائرة المخاطبات والتوجيهات المتبادلة</h3>
              <p className="text-slate-400 text-xs mt-0.5">تتبع كامل الاستفسارات الرسمية، الإحالات للجان المناهج والمالية، وإصدار التعليمات بين الإدارة العليا والفروع.</p>
            </div>
          </div>

          <div className="space-y-4">
            {approvals.map((req) => (
              <div key={req.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 font-display text-sm">{req.title}</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{req.id}</span>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div className="space-y-2 text-xs">
                  {req.auditTrail && req.auditTrail.length > 0 ? (
                    req.auditTrail.map((trail) => (
                      <div key={trail.id} className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-800">{trail.author} ({trail.role})</span>
                          <span className="text-slate-400 font-mono">{new Date(trail.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                        <span className="inline-block bg-indigo-50 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px]">
                          {trail.action}
                        </span>
                        {trail.notes && (
                          <p className="text-slate-700 leading-relaxed font-medium mt-1">« {trail.notes} »</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs">لا يوجد سجل مخاطبات تفصيلي بعد لهذه المعاملة.</p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setActiveTab('pending');
                      handleOpenExamine(req);
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>الانتقال لمفتش المعاملة والرد</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: FORWARD TO COMMITTEE */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-display">تحويل المعاملة إلى لجنة أو قسم مختص</h3>
              <button onClick={() => setShowForwardModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر اللجنة أو القسم المحال إليه المعاملة:</label>
                <select
                  value={targetCommittee}
                  onChange={(e) => setTargetCommittee(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="اللجنة العلمية والمناهج">اللجنة العلمية والمناهج</option>
                  <option value="إدارة الشؤون المالية والميزانيات">إدارة الشؤون المالية والميزانيات</option>
                  <option value="إدارة الجودة والرقابة الفنية">إدارة الجودة والرقابة الفنية</option>
                  <option value="اللجنة القانونية ولائحة الأنظمة">اللجنة القانونية ولائحة الأنظمة</option>
                  <option value="قسم الرعاية والتطوير المهارية">قسم الرعاية والتطوير المهارية</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات والتوجيهات للجنة المحال إليها:</label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="اكتب التوجيهات المطلوبة من اللجنة الفنية أثناء دراسة الملف..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowForwardModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleForwardToCommittee}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>تأكيد الإحالة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT OFFICIAL DECISION DOCUMENT CERTIFICATE */}
      {printDocReq && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 animate-fade-in border border-slate-200 my-8 text-right" dir="rtl">
            
            {/* Certificate Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-800 block">ملتقى الهدى القرآني النموذجي</span>
                <span className="font-extrabold text-slate-900 text-lg font-display">وثيقة قرار معمد رسمي</span>
                <span className="text-[10px] text-slate-400 block font-mono">مركز الاعتمادات والموافقات العليا</span>
              </div>

              <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-bold">رقم القرار:</span> {printDocReq.decisionNumber || printDocReq.id}</p>
                <p><span className="font-bold">تاريخ الاعتماد:</span> {printDocReq.decisionDate ? new Date(printDocReq.decisionDate).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}</p>
                <p><span className="font-bold">الحالة:</span> {printDocReq.status === 'approved' ? 'معتمد نافذ' : printDocReq.status === 'conditional_approved' ? 'معتمد مشروط' : 'قرار معالج'}</p>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-sm text-slate-900 font-display">الموضوع: {printDocReq.title}</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600 mt-2 text-[11px]">
                  <p>الجهة الرافعة: <span className="font-bold text-slate-800">{printDocReq.requesterName}</span></p>
                  <p>القسم/الإدارة: <span className="font-bold text-slate-800">{printDocReq.department}</span></p>
                  <p>الفرع المعني: <span className="font-bold text-slate-800">{printDocReq.targetBranch || 'جميع الفروع'}</span></p>
                  <p>تصنيف المعاملة: <span className="font-bold text-slate-800">{getTypeNameAr(printDocReq.type)}</span></p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 block text-sm">نص القرارات والتوجيهات التنفيذية الصادرة:</span>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl font-medium text-slate-900 leading-relaxed font-sans text-xs">
                  {printDocReq.notes || printDocReq.decisionReason || 'بناءً على الصلاحيات المخولة لمركز الاعتمادات والموافقات العليا، وبعد الاطلاع على المسوغات والمرفقات المقدمة، تقرر اعتماد الطلب المذكور أعلاه والعمل بموجبه رسمياً.'}
                </div>
              </div>

              {printDocReq.approvalConditions && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="font-bold text-teal-900 block text-[11px]">ضوابط وشروط الاعتماد:</span>
                  <p className="text-teal-950 font-bold mt-0.5">{printDocReq.approvalConditions}</p>
                </div>
              )}

              {printDocReq.approvedBudget ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-bold">
                  <span>الميزانية المعمدة الرسمية للصرف:</span>
                  <span className="font-mono text-emerald-800 text-sm">{printDocReq.approvedBudget.toLocaleString()} ريال سعودي</span>
                </div>
              ) : null}
            </div>

            {/* Official Signatures & Stamp Footer */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-4 text-center text-xs font-bold">
              <div className="space-y-8">
                <p className="text-slate-600">اعتماد صانع القرار / المدير العام</p>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-slate-900">{printDocReq.decisionMaker || 'المدير العام للملتقيات القرآني'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">ختم المصادقة الالكترونية الموثوقة</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-20 h-20 border-2 border-emerald-800 rounded-full flex flex-col items-center justify-center p-1 text-[8px] text-emerald-900 font-bold rotate-12">
                  <ShieldAlert className="h-5 w-5 text-emerald-800" />
                  <span>معتمد رسمياً</span>
                  <span>مركز الموافقات</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPrintDocReq(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق الوثيقة
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة الوثيقة الرسمية (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: SUBMIT NEW APPROVAL REQUEST */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateNewRequestSubmit} className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-fade-in border border-slate-100 my-8 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base font-display">رفع طلب اعتماد جديد للمركز</h3>
              </div>
              <button type="button" onClick={() => setShowNewModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان موضوع طلب الاعتماد:</label>
                <input
                  type="text"
                  required
                  value={newReqForm.title}
                  onChange={(e) => setNewReqForm({ ...newReqForm, title: e.target.value })}
                  placeholder="مثال: طلب اعتماد خطة حلقة الإسناد المكثفة لموسم 1448هـ"
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تصنيف الاعتماد المطلوب:</label>
                  <select
                    value={newReqForm.type}
                    onChange={(e) => setNewReqForm({ ...newReqForm, type: e.target.value as ApprovalType })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                  >
                    <option value="student_plan">خطة طالب فردية</option>
                    <option value="circle_plan">ميزان/خطة حلقة قرآنية</option>
                    <option value="activity">نشاط أو فعالية صيفية</option>
                    <option value="annual_report">تقرير إحصائي وسنوي</option>
                    <option value="student_transfer">نقل وتوجيه طالب</option>
                    <option value="financial_budget">صرفية أو ميزانية مالية</option>
                    <option value="curriculum_change">تحديث وتطوير منهج</option>
                    <option value="quality_audit">معايير وتدقيق جودة</option>
                    <option value="parent_appeal">التماس أو استثناء ولي أمر</option>
                    <option value="teacher_nomination">ترشيح وتعيين كادر</option>
                    <option value="admin_decision">قرار إداري تنفيذي</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">درجة الأهمية والاستعجال:</label>
                  <select
                    value={newReqForm.urgency}
                    onChange={(e) => setNewReqForm({ ...newReqForm, urgency: e.target.value as UrgencyLevel })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="high">هام</option>
                    <option value="urgent">عاجل جداً</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الشخص الرافع للطلب:</label>
                  <input
                    type="text"
                    required
                    value={newReqForm.requesterName}
                    onChange={(e) => setNewReqForm({ ...newReqForm, requesterName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">القسم أو الجهة الطالبة:</label>
                  <input
                    type="text"
                    required
                    value={newReqForm.department}
                    onChange={(e) => setNewReqForm({ ...newReqForm, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الفرع المعني:</label>
                  <input
                    type="text"
                    value={newReqForm.targetBranch}
                    onChange={(e) => setNewReqForm({ ...newReqForm, targetBranch: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الميزانية المقترحة (ريال إن وجدت):</label>
                  <input
                    type="number"
                    value={newReqForm.estimatedBudget || ''}
                    onChange={(e) => setNewReqForm({ ...newReqForm, estimatedBudget: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نص الطلب والمبررات الإنشائية التفصيلية:</label>
                <textarea
                  required
                  rows={4}
                  value={newReqForm.details}
                  onChange={(e) => setNewReqForm({ ...newReqForm, details: e.target.value })}
                  placeholder="شرح وتوضيح مبررات طلب الاعتماد..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="h-4 w-4" />
                <span>رفع الطلب لمركز الاعتمادات</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
