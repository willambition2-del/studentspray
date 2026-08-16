/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, Download, FileSpreadsheet, Share2, Eye, ShieldCheck, 
  Search, Filter, Plus, CheckCircle, Award, FileText, BookOpen, 
  Users, GraduationCap, Calendar, Clock, AlertTriangle, Sparkles, 
  Settings, Lock, Unlock, Shield, Trash2, Check, X, RefreshCw,
  QrCode, UserCheck, Layers, FileCode, CheckSquare, ChevronRight, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, PrintDocument, PrintDocType, DataScope, PrintTemplate, 
  PrintAuditRecord, DocumentShareRule 
} from '../types';
import {
  getStudents,
  getHalaqas,
  getAttendanceReport,
  getDashboardSummary,
  getAdministrativeReport,
  downloadStudentReportPdf,
  downloadHalaqaReportPdf,
  downloadAttendanceCsv,
  downloadStudentsCsv,
} from '../lib/api';

interface PrintCenterProps {
  currentUser: User | null;
  onNavigate?: (tab: string) => void;
}

export default function PrintCenter({ currentUser, onNavigate }: PrintCenterProps) {
  const [activeTab, setActiveTab] = useState<PrintDocType | 'templates' | 'audit_log'>('report');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const [documents, setDocuments] = useState<PrintDocument[]>([]);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<PrintAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<PrintDocument | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<PrintDocument | null>(null);
  const [shareTargetType, setShareTargetType] = useState<string>('teacher');
  const [shareTargetName, setShareTargetName] = useState<string>('');
  const [sharePermissionLevel, setSharePermissionLevel] = useState<'view' | 'view_print' | 'view_pdf' | 'full'>('view_print');
  const [shareNotes, setShareNotes] = useState<string>('');

  const [newDocModalOpen, setNewDocModalOpen] = useState<boolean>(false);
  const [newDocForm, setNewDocForm] = useState<Partial<PrintDocument>>({
    title: '',
    docType: 'report',
    dataScope: 'system_wide',
    description: '',
    allowView: true,
    allowPrint: true,
    allowPdf: true,
    allowExcel: false,
    allowShare: true
  });

  const [templateEditModal, setTemplateEditModal] = useState<PrintTemplate | null>(null);

  const isGM = currentUser?.type === 'admin';
  const isBranchManager = currentUser?.type === 'branch_manager';
  const isSupervisor = currentUser?.type === 'supervisor';
  const isTeacher = currentUser?.type === 'teacher';
  const isParent = currentUser?.type === 'parent';
  const isStudent = currentUser?.type === 'student';

  // Load Real Data from server
  const loadPrintCenterData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [studentsRes, halaqasRes, attendanceRes, dashboardRes, adminRes] = await Promise.allSettled([
        getStudents({ limit: 50 }),
        getHalaqas({ limit: 50 }),
        getAttendanceReport({ limit: 50 }),
        getDashboardSummary(),
        getAdministrativeReport(),
      ]);

      const students = studentsRes.status === 'fulfilled' ? studentsRes.value.items || [] : [];
      const halaqas = halaqasRes.status === 'fulfilled' ? halaqasRes.value.items || [] : [];
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value : null;
      const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value : null;
      const admin = adminRes.status === 'fulfilled' ? adminRes.value : null;

      const realDocs: PrintDocument[] = [];

      // 1. General Attendance Report
      realDocs.push({
        id: 'doc-attendance-01',
        serialNumber: 'DOC-ATT-01',
        title: 'كشف الحضور والغياب العام لجميع الحلقات',
        docType: 'attendance',
        dataScope: 'system_wide',
        description: `تقرير شامل لبيانات الحضور مع نسبة حضور عامة بلغت ${attendance?.summary?.rate ?? 0}% وإجمالي جلسات ${attendance?.summary?.total ?? 0}.`,
        date: new Date().toISOString().split('T')[0],
        allowView: true,
        allowPrint: true,
        allowPdf: true,
        allowExcel: true,
        allowShare: true,
        createdAt: new Date().toISOString(),
      });

      // 2. Student Registry Document
      realDocs.push({
        id: 'doc-students-list-01',
        serialNumber: 'DOC-STU-01',
        title: 'سجل قيد وبيانات الطلاب المقيدين بالملتقى',
        docType: 'student',
        dataScope: 'system_wide',
        description: `كشف إداري رسمي صادر بأسماء وأرقام وتوزيع الطلاب المقيدين (إجمالي ${students.length} طالب).`,
        date: new Date().toISOString().split('T')[0],
        allowView: true,
        allowPrint: true,
        allowPdf: true,
        allowExcel: true,
        allowShare: true,
        createdAt: new Date().toISOString(),
      });

      // 3. Administrative Operations Summary
      if (admin || dashboard) {
        realDocs.push({
          id: 'doc-admin-summary-01',
          serialNumber: 'DOC-ADM-01',
          title: 'التقرير الإداري الموحد: القرارات والتكليفات والتنبيهات',
          docType: 'publication',
          dataScope: 'system_wide',
          description: `ملخص إداري تنفيذي للقرارات المعتمدة (${admin?.activeDecisionsCount ?? 0}) والتكليفات المفتوحة (${admin?.openTasksCount ?? 0}) والتنبيهات.`,
          date: new Date().toISOString().split('T')[0],
          allowView: true,
          allowPrint: true,
          allowPdf: true,
          allowExcel: false,
          allowShare: true,
          createdAt: new Date().toISOString(),
        });
      }

      // 4. Per-Student Academic Reports
      students.forEach((st: any) => {
        realDocs.push({
          id: `doc-student-${st.id}`,
          serialNumber: `STU-${st.studentNumber || st.id.slice(0, 4)}`,
          title: `تقرير الأداء الأكاديمي الشامل: ${st.name}`,
          studentId: st.id,
          studentName: st.name,
          docType: 'report',
          dataScope: 'my_students',
          entityName: st.name,
          description: `تقرير مفصل يوضح سجلات الحفظ والمراجعة ونتائج الاختبارات والأوسمة الممنوحة للطالب.`,
          date: new Date().toISOString().split('T')[0],
          allowView: true,
          allowPrint: true,
          allowPdf: true,
          allowExcel: false,
          allowShare: true,
          createdAt: new Date().toISOString(),
        });
      });

      // 5. Per-Halaqa Performance Reports
      halaqas.forEach((h: any) => {
        realDocs.push({
          id: `doc-halaqa-${h.id}`,
          serialNumber: `HAL-${h.code || h.id.slice(0, 4)}`,
          title: `تقرير إنجاز ومتابعة حلقة: ${h.name}`,
          circleId: h.id,
          circleName: h.name,
          docType: 'circle',
          dataScope: 'my_circle',
          entityName: h.name,
          description: `تقرير متابعة دوري يتضمن مؤشرات حضور الطلاب ومعدلات التسميع والإنجاز في الخطة المعتمدة.`,
          date: new Date().toISOString().split('T')[0],
          allowView: true,
          allowPrint: true,
          allowPdf: true,
          allowExcel: false,
          allowShare: true,
          createdAt: new Date().toISOString(),
        });
      });

      setDocuments(realDocs);

      // Default templates
      setTemplates([
        {
          id: 'tmpl-official-report',
          name: 'قالب التقرير الأكاديمي الرسمي',
          type: 'report',
          headerTitle: 'الملتقى القرآني النموذجي',
          subtitle: 'الشؤون التعليمية والتربوية',
          layoutStyle: 'formal',
          signatureTitle1: 'المدير العام',
          updatedAt: new Date().toISOString().split('T')[0],
        },
        {
          id: 'tmpl-official-cert',
          name: 'قالب شهادات الإتمام والتكريم',
          type: 'certificate',
          headerTitle: 'شهادة تقدير وتكريم',
          subtitle: 'إتمام حفظ الأجزاء المقررة',
          layoutStyle: 'modern',
          signatureTitle1: 'المشرف التعليمي',
          updatedAt: new Date().toISOString().split('T')[0],
        },
      ]);
    } catch (err: any) {
      console.error('Error fetching Print Center data:', err);
      setErrorMsg('عذراً، تعذر تحميل مستندات مركز الطباعة. يرجى التحقق من الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrintCenterData();
  }, [currentUser]);

  // Record audit log helper
  const recordAuditAction = (doc: PrintDocument, action: 'print' | 'pdf' | 'excel') => {
    const record: PrintAuditRecord = {
      id: `audit-${Date.now()}`,
      userId: currentUser?.id || 'u-user',
      userName: currentUser?.name || 'مستخدم',
      userRole: currentUser?.roleName || currentUser?.type || 'مستخدم',
      docId: doc.id,
      docType: doc.docType,
      docTitle: doc.title,
      entityName: doc.entityName || doc.studentName || doc.circleName || 'عام',
      action,
      copiesCount: 1,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [record, ...prev]);
  };

  // Filtered documents by active tab, search, and scope
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Tab filter
      if (activeTab !== 'templates' && activeTab !== 'audit_log') {
        if (doc.docType !== activeTab) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesSerial = doc.serialNumber.toLowerCase().includes(q);
        const matchesEntity = (doc.entityName || '').toLowerCase().includes(q);
        const matchesStudent = (doc.studentName || '').toLowerCase().includes(q);
        const matchesCircle = (doc.circleName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSerial && !matchesEntity && !matchesStudent && !matchesCircle) {
          return false;
        }
      }

      // Scope filter
      if (filterScope !== 'all' && doc.dataScope !== filterScope) {
        return false;
      }

      // Format filter
      if (filterFormat === 'printable' && !doc.allowPrint) return false;
      if (filterFormat === 'pdf_only' && !doc.allowPdf) return false;
      if (filterFormat === 'excel_only' && !doc.allowExcel) return false;

      return true;
    });
  }, [documents, activeTab, searchQuery, filterScope, filterFormat]);

  // Tab Item Configuration
  const tabsList = [
    { id: 'report', label: 'التقارير', icon: FileText, desc: 'تقارير الأداء الفنية والتربوية والإدارية' },
    { id: 'award', label: 'الأوسمة والجوائز', icon: Award, desc: 'بطاقات الأوسمة وشارات شرف التميز' },
    { id: 'certificate', label: 'الشهادات', icon: GraduationCap, desc: 'شهادات الإتمام والتكريم والتقدير' },
    { id: 'grade', label: 'الدرجات والاختبارات', icon: CheckSquare, desc: 'كشوف نتائج الاختبارات والتقييمات' },
    { id: 'attendance', label: 'الحضور والالتزام', icon: Calendar, desc: 'سجلات الحضور والغياب والمواظبة' },
    { id: 'student', label: 'ملفات الطلاب', icon: Users, desc: 'البطاقات التعريفية ومستندات الطلاب' },
    { id: 'circle', label: 'الحلقات والكشوف', icon: BookOpen, desc: 'كشوف الحلقات وبيانات المنتسبين' },
    { id: 'resource', label: 'المصادر والرف العام', icon: Layers, desc: 'الملازم والمناهج والكتب المتاحة للطباعة' },
    { id: 'publication', label: 'المنشورات والقرارات', icon: Sparkles, desc: 'القرارات الإدارية والتعاميم المعتمدة' },
    { id: 'shared', label: 'مشارك معي', icon: Share2, desc: 'المستندات التي شاركتها الإدارة معي' },
    ...(isGM ? [
      { id: 'templates', label: 'قوالب الطباعة', icon: Sliders, desc: 'تخصيص الهوية والشعارات لقوالب المستندات' },
      { id: 'audit_log', label: 'سجل الطباعة والتصدير', icon: Clock, desc: 'رقابة وعرض عمليات الطباعة والتنزيل' }
    ] : [])
  ];

  // Print Action Trigger
  const handleTriggerPrint = (doc: PrintDocument) => {
    if (!doc.allowPrint) {
      alert('عذراً، هذا المستند غير قابل للطباعة المباشرة حسب إعدادات الأمان الخاصة به.');
      return;
    }
    recordAuditAction(doc, 'print');
    
    // Open printable view window or frame
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('يرجى السماح بالتطبيقات المنبثقة لطباعة المستند.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة: ${doc.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #059669;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #065f46;
            margin: 0 0 5px 0;
            font-size: 24px;
          }
          .header p {
            color: #64748b;
            margin: 0;
            font-size: 12px;
          }
          .meta-box {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .content {
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60px;
            color: rgba(5, 150, 105, 0.05);
            font-weight: 900;
            pointer-events: none;
            z-index: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: right;
            font-size: 12px;
          }
          th {
            background-color: #ecfdf5;
            color: #065f46;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">الملتقى القرآني</div>

        <div class="header">
          <h1>الملتقى القرآني النموذجي</h1>
          <p>مركز التقارير والوثائق الرسمية والطباعة</p>
        </div>

        <div class="meta-box">
          <div><strong>اسم المستند:</strong> ${doc.title}</div>
          <div><strong>الرقم التسلسلي:</strong> ${doc.serialNumber}</div>
          <div><strong>تاريخ الإصدار:</strong> ${doc.date}</div>
        </div>

        <div class="content">
          <p><strong>الوصف:</strong> ${doc.description || 'مستند رسمي صادر من مركز الطباعة الموحد بالملتقى.'}</p>
          <p><strong>الجهة / الشخص المعني:</strong> ${doc.entityName || doc.studentName || doc.circleName || 'عام'}</p>
        </div>

        <div class="footer">
          <div>طبع بواسطة: ${currentUser?.name || 'مستخدم النظام'} (${currentUser?.roleName || ''})</div>
          <div>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</div>
          <div>كود التحقق الآمن: ${doc.id.toUpperCase()}</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Real Server PDF Trigger
  const handleTriggerPdf = async (doc: PrintDocument) => {
    if (!doc.allowPdf) {
      alert('عذراً، هذا المستند محظور من تحميل ملفات PDF بقرار الأمان.');
      return;
    }
    recordAuditAction(doc, 'pdf');

    try {
      if (doc.studentId) {
        await downloadStudentReportPdf(doc.studentId, doc.studentName || doc.title);
      } else if (doc.circleId) {
        await downloadHalaqaReportPdf(doc.circleId, doc.circleName || doc.title);
      } else {
        handleTriggerPrint(doc);
      }
    } catch (err: any) {
      console.error('PDF generation error, fallback to print view:', err);
      handleTriggerPrint(doc);
    }
  };

  // Real Server CSV / Excel Trigger
  const handleTriggerExcel = async (doc: PrintDocument) => {
    if (!doc.allowExcel) {
      alert('عذراً، التصدير إلى صيغة Excel غير متاح لهذا المستند.');
      return;
    }
    recordAuditAction(doc, 'excel');

    try {
      if (doc.serialNumber === 'DOC-STU-01' || doc.docType === 'student') {
        await downloadStudentsCsv();
      } else {
        await downloadAttendanceCsv();
      }
    } catch (err: any) {
      console.error('CSV export error:', err);
      alert('حدث خطأ أثناء تصدير ملف CSV.');
    }
  };

  // Create Document Handler
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title) return;

    const newDoc: PrintDocument = {
      id: `doc-${Date.now()}`,
      serialNumber: `DOC-NEW-${Date.now().toString().slice(-4)}`,
      title: newDocForm.title,
      docType: newDocForm.docType || 'report',
      dataScope: newDocForm.dataScope || 'system_wide',
      description: newDocForm.description,
      date: new Date().toISOString().split('T')[0],
      allowView: newDocForm.allowView ?? true,
      allowPrint: newDocForm.allowPrint ?? true,
      allowPdf: newDocForm.allowPdf ?? true,
      allowExcel: newDocForm.allowExcel ?? false,
      allowShare: newDocForm.allowShare ?? true,
      createdAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setNewDocModalOpen(false);
    setNewDocForm({
      title: '',
      docType: 'report',
      dataScope: 'system_wide',
      description: '',
      allowView: true,
      allowPrint: true,
      allowPdf: true,
      allowExcel: false,
      allowShare: true,
    });
  };

  // Add Share Rule Handler
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModalDoc || !shareTargetName) return;

    setShareModalDoc(null);
    setShareTargetName('');
    setShareNotes('');
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans" dir="rtl" id="print-center-module">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold font-display">
              <Printer className="w-4 h-4 text-amber-300" />
              <span>المنظومة المركزية للوثائق والطباعة والاعتماد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              مركز الطباعة الموحد
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              محرك الطباعة والتصدير والشهادات والأوسمة وكشوف الدرجات لجميع القطاعات بالملتقى، محكوم بنظام الصلاحيات والدقة حسب الأدوار ونطاقات البيانات المعتمدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {(isGM || isBranchManager) && (
              <button
                onClick={() => setNewDocModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer font-display"
              >
                <Plus className="w-4 h-4" />
                <span>إدراج مستند رسمي جديد</span>
              </button>
            )}

            <button
              onClick={loadPrintCenterData}
              title="تحديث قائمة المستندات"
              className="p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-700 rounded-2xl transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Scope Indicator Bar */}
        <div className="mt-6 pt-4 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-100">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>نطاق الصلاحية الحالي:</span>
            <span className="font-bold text-amber-200 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800">
              {isGM && 'المدير العام (وصول كامل لجميع القطاعات والسجلات والقوالب)'}
              {isBranchManager && 'المدير التنفيذي (مستندات الفرع والحلقات والتقارير)'}
              {isSupervisor && 'الموجه التربوي (الحلقات والمدرسون والتقارير الميدانية)'}
              {isTeacher && 'المعلم (حلقة الإمام عاصم وطلابها والمصادر المتاحة)'}
              {isParent && 'ولي الأمر (مستندات وأوسمة وشهادات الأبناء فقط)'}
              {isStudent && 'الطالب (سجل الطالب والأوسمة والشهادات والمصادر)'}
            </span>
          </div>

          <div className="text-[11px] text-emerald-200/80 font-medium">
            إجمالي المستندات المصرحة: <strong className="text-white font-bold">{documents.length}</strong> مستنداً
          </div>
        </div>
      </div>

      {/* Main Tabs Horizontal Scroll Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-x-auto" id="print-center-tabs">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabsList.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={tab.desc}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Controls (Visible for document tabs) */}
      {activeTab !== 'templates' && activeTab !== 'audit_log' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم المستند، الرقم التسلسلي، الطالب، أو الحلقة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Scope & Format Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <Filter className="w-3.5 h-3.5" />
              <span>نطاق البيانات:</span>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">جميع النطاقات المصرحة</option>
                <option value="system_wide">النظام العام</option>
                <option value="branch">الفرع</option>
                <option value="my_circle">الحلقة</option>
                <option value="my_students">الطلاب / الأبناء</option>
                <option value="staff">الكادر</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>نوع التصدير:</span>
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">الكل</option>
                <option value="printable">قابل للطباعة</option>
                <option value="pdf_only">يدعم PDF</option>
                <option value="excel_only">يدعم Excel</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-400 text-xs font-bold">جاري تجميع مستندات مركز الطباعة ومطابقة مصفوفة الصلاحيات...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="font-bold text-xs">{errorMsg}</p>
          <button onClick={loadPrintCenterData} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">إعادة المحاولة</button>
        </div>
      ) : activeTab === 'templates' ? (
        /* TEMPLATES MANAGEMENT TAB (GM Only) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">إدارة قوالب المستندات والطباعة</h2>
              <p className="text-xs text-slate-500">تخصيص الترويسات، الشعارات، الهوامش، الأختام وكود التحقق لشهادات وأوراق الملتقى الرسمية.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {tmpl.type}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm font-display">{tmpl.name}</h3>
                  </div>
                  <button 
                    onClick={() => setTemplateEditModal(tmpl)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-emerald-700 transition-colors"
                    title="تعديل القالب"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-[11px] space-y-1 text-slate-600 border border-slate-100">
                  <p><strong>العنوان الرئيسي:</strong> {tmpl.headerTitle}</p>
                  <p><strong>نمط التصميم:</strong> {tmpl.layoutStyle}</p>
                  <p><strong>التوقيعات المضمنة:</strong> {tmpl.signatureTitle1 || 'المدير العام'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>آخر تحديث: {tmpl.updatedAt}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle className="w-3 h-3" /> نشط في الطباعة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'audit_log' ? (
        /* PRINT AUDIT LOG TAB (GM / Admin Only) */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">سجل عمليات الطباعة والتصدير والمشاركة</h2>
              <p className="text-xs text-slate-500">توثيق رقابي دقيق لكافة عمليات الطباعة وتنزيل PDF وتصدير Excel مع اسم المستخدم والوقت والصفة.</p>
            </div>
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-xl">
              إجمالي السجلات: {auditLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 rounded-r-xl">المستخدم والدور</th>
                  <th className="p-3">نوع المستند</th>
                  <th className="p-3">اسم المستند</th>
                  <th className="p-3">الجهة / الشخص المعني</th>
                  <th className="p-3">نوع الإجراء</th>
                  <th className="p-3 rounded-l-xl">الوقت والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">لا توجد عمليات طباعة مسجلة حتى الآن.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        <div>{log.userName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{log.userRole}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {log.docType}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{log.docTitle}</td>
                      <td className="p-3 text-slate-600">{log.entityName || 'عام'}</td>
                      <td className="p-3 font-bold">
                        {log.action === 'print' && <span className="text-emerald-700 flex items-center gap-1"><Printer className="w-3.5 h-3.5"/> طباعة</span>}
                        {log.action === 'pdf' && <span className="text-rose-700 flex items-center gap-1"><Download className="w-3.5 h-3.5"/> PDF</span>}
                        {log.action === 'excel' && <span className="text-amber-700 flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5"/> Excel</span>}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('ar-SA')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DOCUMENTS CARDS GRID VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 font-display">
              قائمة المستندات المتاحة ({filteredDocuments.length})
            </h2>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">لا توجد مستندات تطابق نطاق البحث أو الصلاحية الحالية</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                قد لا تملك الصلاحية الكافية لمشاهدة هذا القسم، أو لم تقم الإدارة بمشاركة مستندات معك بعد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map(doc => (
                <div 
                  key={doc.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  {/* Decorative corner pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {doc.serialNumber}
                        </span>
                        <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                          نطاق: {doc.dataScope}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm font-display leading-snug group-hover:text-emerald-900 transition-colors">
                        {doc.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.description || 'مستند موحد قابل للطباعة والتصدير والمشاركة مع أصحاب المصلحة.'}
                  </p>

                  {/* Entity Tag */}
                  {(doc.entityName || doc.studentName || doc.circleName) && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between border border-slate-100">
                      <span className="text-slate-400 text-[10px]">الجهة / الشخص:</span>
                      <span className="text-emerald-800">{doc.entityName || doc.studentName || doc.circleName}</span>
                    </div>
                  )}

                  {/* Action Permissions Matrix Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold pt-2 border-t border-slate-100">
                    <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${doc.allowPrint ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                      <Printer className="w-3 h-3"/> طباعة
                    </span>
                    <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${doc.allowPdf ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                      <Download className="w-3 h-3"/> PDF
                    </span>
                    <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${doc.allowExcel ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                      <FileSpreadsheet className="w-3 h-3"/> Excel
                    </span>
                  </div>

                  {/* Primary Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer font-display"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة وطباعة</span>
                    </button>

                    <button
                      onClick={() => handleTriggerPdf(doc)}
                      disabled={!doc.allowPdf}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5 text-rose-600" />
                      <span>تحميل PDF</span>
                    </button>
                  </div>

                  {/* Secondary Share Button (Admin/Manager) */}
                  {(isGM || isBranchManager) && (
                    <button
                      onClick={() => setShareModalDoc(doc)}
                      className="w-full text-slate-600 hover:text-emerald-800 text-[11px] font-bold py-1 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>مشاركة المستند مع الصلاحيات</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT PREVIEW & PRINT MODAL */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold font-display text-sm text-white">{selectedDoc.title}</h3>
                    <p className="text-[10px] text-emerald-200">الرقم التسلسلي: {selectedDoc.serialNumber}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Body Content Preview */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
                {/* Official Paper Layout Mock */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden" id="printable-preview-card">
                  {/* Watermark background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-6xl font-black font-display text-emerald-900">
                    ملتقى الهدى القرآني
                  </div>

                  {/* Document Header */}
                  <div className="flex items-center justify-between border-b border-emerald-600/30 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-black font-display text-emerald-900">ملتقى الهدى القرآني النموذجي</h2>
                      <p className="text-[11px] text-slate-500">الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض (مكْنون)</p>
                    </div>

                    <div className="bg-amber-400 text-emerald-950 font-display font-bold text-sm px-3 py-1.5 rounded-xl border border-amber-300">
                      الهدى
                    </div>
                  </div>

                  {/* Document Meta Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-slate-400 text-[10px] block">نوع المستند:</span>
                      <span className="text-emerald-800">{selectedDoc.docType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">الجهة / المعني:</span>
                      <span>{selectedDoc.entityName || selectedDoc.studentName || selectedDoc.circleName || 'عام'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">تاريخ الإصدار:</span>
                      <span>{selectedDoc.date}</span>
                    </div>
                  </div>

                  {/* Main Document Content */}
                  <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                    <p className="text-sm font-bold text-slate-900">{selectedDoc.title}</p>
                    <p className="text-slate-600">{selectedDoc.description || 'مستند موحد صادر رسمياً من المركز يضمن مطابقة البيانات والمعايير الفنية المعتمَدة.'}</p>

                    {/* Content Data Table (if exists) */}
                    {selectedDoc.contentData && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="font-bold text-emerald-900 text-xs">تفاصيل البيانات المسجلة:</h4>
                        <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                          {JSON.stringify(selectedDoc.contentData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Document Footer Seals & Signatures */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                    <div className="text-center space-y-1">
                      <p className="text-slate-400 text-[10px]">ختم واعتماد المركز:</p>
                      <div className="w-20 h-12 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center text-[9px] text-emerald-800 bg-emerald-50">
                        الختم الرسمي
                      </div>
                    </div>

                    <div className="text-left space-y-1">
                      <p className="text-slate-400 text-[10px]">اعتماد المدير العام:</p>
                      <p className="text-slate-800">الشيخ عبدالرحمن بن محمد السعيد</p>
                      <p className="text-[9px] text-slate-400">المدير العام لملتقى الهدى</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Footer Buttons */}
              <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerPrint(selectedDoc)}
                    disabled={!selectedDoc.allowPrint}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة المستند الآن</span>
                  </button>

                  <button
                    onClick={() => handleTriggerPdf(selectedDoc)}
                    disabled={!selectedDoc.allowPdf}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </button>

                  {selectedDoc.allowExcel && (
                    <button
                      onClick={() => handleTriggerExcel(selectedDoc)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      <span>تصدير Excel</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE DOCUMENT MODAL (Admin / Manager) */}
      <AnimatePresence>
        {shareModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-display text-sm">
                  <Share2 className="w-5 h-5 text-amber-300" />
                  <span>مشاركة مستند وتحديد الصلاحيات</span>
                </div>
                <button onClick={() => setShareModalDoc(null)} className="p-1 text-emerald-200 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleShareSubmit} className="p-6 space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">المستند المراد مشاركته:</label>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm font-display">
                    {shareModalDoc.title} ({shareModalDoc.serialNumber})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">فئة الجهة المستهدفة:</label>
                    <select
                      value={shareTargetType}
                      onChange={(e) => setShareTargetType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="user">مستخدم محدد</option>
                      <option value="teacher">مدرس محدد</option>
                      <option value="circle">حلقة معينة</option>
                      <option value="staff">الكادر الإداري</option>
                      <option value="all_teachers">جميع المدرسين</option>
                      <option value="parents">جميع أولياء الأمور</option>
                      <option value="students">جميع الطلاب</option>
                      <option value="everyone">الجميع</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">اسم الشخص / الجهة:</label>
                    <input
                      type="text"
                      value={shareTargetName}
                      onChange={(e) => setShareTargetName(e.target.value)}
                      placeholder="مثال: أ. عمر التركي، حلقة عاصم..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">صلاحية الوصول الممنوحة:</label>
                  <select
                    value={sharePermissionLevel}
                    onChange={(e) => setSharePermissionLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="view">مشاهدة فقط (View Only)</option>
                    <option value="view_print">مشاهدة + طباعة (View & Print)</option>
                    <option value="view_pdf">مشاهدة + تحميل PDF</option>
                    <option value="full">مشاهدة + طباعة + تحميل PDF (كامل الصلاحية)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">ملاحظات توجيهية للمستلم:</label>
                  <textarea
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    placeholder="أدخل أي ملاحظات إدارية ملحقة بالمشاركة..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShareModalDoc(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    تأكيد المشاركة الآن
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW DOCUMENT MODAL */}
      <AnimatePresence>
        {newDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-display text-sm">
                  <Plus className="w-5 h-5 text-amber-300" />
                  <span>إدراج مستند رسمي جديد لمركز الطباعة</span>
                </div>
                <button onClick={() => setNewDocModalOpen(false)} className="p-1 text-emerald-200 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDocument} className="p-6 space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">عنوان المستند:</label>
                  <input
                    type="text"
                    value={newDocForm.title || ''}
                    onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                    placeholder="عنوان المستند الرسمي..."
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">نوع المستند:</label>
                    <select
                      value={newDocForm.docType || 'report'}
                      onChange={(e) => setNewDocForm({ ...newDocForm, docType: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="report">تقرير</option>
                      <option value="award">وسام / جائزة</option>
                      <option value="certificate">شهادة</option>
                      <option value="grade">كشف درجات</option>
                      <option value="attendance">حضور وغياب</option>
                      <option value="student">ملف طالب</option>
                      <option value="circle">كشف حلقة</option>
                      <option value="resource">مصدر تعليمي</option>
                      <option value="publication">منشور / قرار</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">نطاق البيانات:</label>
                    <select
                      value={newDocForm.dataScope || 'system_wide'}
                      onChange={(e) => setNewDocForm({ ...newDocForm, dataScope: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="system_wide">جميع النظام العام</option>
                      <option value="branch">الفرع فقط</option>
                      <option value="my_circle">الحلقة فقط</option>
                      <option value="my_students">الطلاب المعنيون فقط</option>
                      <option value="staff">الكادر الإداري</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">وصف المستند وتفاصيله:</label>
                  <textarea
                    value={newDocForm.description || ''}
                    onChange={(e) => setNewDocForm({ ...newDocForm, description: e.target.value })}
                    placeholder="وصف ملخص لنواحي استخدام وطباعة هذا المستند..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                {/* Permissions Toggles */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-slate-600 mb-1">إعدادات الصلاحيات الأمنية:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newDocForm.allowPrint ?? true} 
                        onChange={(e) => setNewDocForm({ ...newDocForm, allowPrint: e.target.checked })} 
                      />
                      <span>السماح بالطباعة</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newDocForm.allowPdf ?? true} 
                        onChange={(e) => setNewDocForm({ ...newDocForm, allowPdf: e.target.checked })} 
                      />
                      <span>السماح بتحميل PDF</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newDocForm.allowExcel ?? false} 
                        onChange={(e) => setNewDocForm({ ...newDocForm, allowExcel: e.target.checked })} 
                      />
                      <span>السماح بتصدير Excel</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newDocForm.allowShare ?? true} 
                        onChange={(e) => setNewDocForm({ ...newDocForm, allowShare: e.target.checked })} 
                      />
                      <span>السماح بالمشاركة</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNewDocModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    إنشاء المستند الرسمي
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TEMPLATE MODAL */}
      <AnimatePresence>
        {templateEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-display text-sm">
                  <Settings className="w-5 h-5 text-amber-300" />
                  <span>تعديل قالب الطباعة: {templateEditModal.name}</span>
                </div>
                <button onClick={() => setTemplateEditModal(null)} className="p-1 text-emerald-200 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setTemplates(prev => prev.map(t => t.id === templateEditModal.id ? templateEditModal : t));
                setTemplateEditModal(null);
              }} className="p-6 space-y-4 text-xs font-bold">

                <div>
                  <label className="block text-slate-500 mb-1">اسم القالب:</label>
                  <input
                    type="text"
                    value={templateEditModal.name}
                    onChange={(e) => setTemplateEditModal({ ...templateEditModal, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">العنوان الرئيسي للترويسة:</label>
                    <input
                      type="text"
                      value={templateEditModal.headerTitle}
                      onChange={(e) => setTemplateEditModal({ ...templateEditModal, headerTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">العنوان الفرعي:</label>
                    <input
                      type="text"
                      value={templateEditModal.subtitle}
                      onChange={(e) => setTemplateEditModal({ ...templateEditModal, subtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">مسمى التوقيع الأول:</label>
                    <input
                      type="text"
                      value={templateEditModal.signatureTitle1 || ''}
                      onChange={(e) => setTemplateEditModal({ ...templateEditModal, signatureTitle1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">اسم المسؤول الموقّع:</label>
                    <input
                      type="text"
                      value={templateEditModal.signatureName1 || ''}
                      onChange={(e) => setTemplateEditModal({ ...templateEditModal, signatureName1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTemplateEditModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    حفظ القالب المعاير
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
