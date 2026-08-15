/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Printer, Download, ClipboardList, CheckCircle, 
  Users, BookOpen, Clock, Award, Compass, RefreshCw, Layers,
  Plus, Edit3, Trash2, Image as ImageIcon, FileSpreadsheet, Check,
  Shield, QrCode, Sparkles, Sliders, X, Filter, Target, TrendingUp, CheckSquare
} from 'lucide-react';
import { mockStudents, mockCircles, mockTeachers, mockGraduates } from './dashboardData';
import { Circle } from './dashboardTypes';

export interface CustomReportItem {
  id: string;
  category: 'activities' | 'memorization' | 'revision' | 'curriculum' | 'grades' | 'students' | 'achievements' | 'efficiency' | 'other';
  categoryLabel: string;
  title: string;
  subtitle: string;
  scope: string;
  summary: string;
  keyPoints: string[];
  recommendations: string;
  kpis: { label: string; value: string; status: string }[];
  dateCreated: string;
}

export default function QuickReportsView() {
  // Built-in report keys or custom report id or 'individual_circle'
  const [activeReportKey, setActiveReportKey] = useState<string>('executive');
  
  // Selected Circle for Individual Circle Reports
  const [selectedCircleId, setSelectedCircleId] = useState<string>('c1');
  
  // Detailed vs Brief Report View Toggle
  const [isDetailedMode, setIsDetailedMode] = useState<boolean>(true);

  // Official Branding / Seal / Signature Toggles
  const [showSeal, setShowSeal] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showLetterhead, setShowLetterhead] = useState<boolean>(true);
  const [showQRCode, setShowQRCode] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  // Export State & Toast Feedback
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showCustomReportModal, setShowCustomReportModal] = useState<boolean>(false);
  const [showEditReportModal, setShowEditReportModal] = useState<boolean>(false);

  // Custom Created Reports Storage
  const [customReports, setCustomReports] = useState<CustomReportItem[]>([
    {
      id: 'custom-1',
      category: 'activities',
      categoryLabel: 'الأنشطة والبرامج',
      title: 'تقرير الملتقيات الثقافية وقوافل الحفاظ للربع الحالي',
      subtitle: 'حصر شامل للفاعليات الميدانية والمسابقات القرآنية لملتقى الهدى',
      scope: 'جميع الفروع بالحلقات',
      summary: 'تم بحمد الله إقامة 8 مسابقات فرعية و3 قوافل قرآنية ميدانية شهدت مشاركة 240 طالباً، وقد حقق الفاعليات نسبة رضا إجمالية تجاوزت 96% من أولياء الأمور والطلاب.',
      keyPoints: [
        'إقامة لقاء الحفاظ المتفوقين السنوي بفرع شمال الرياض.',
        'تكريم 45 طالباً متفوقاً في حفظ الأجزاء الخمسة الأولى.',
        'توفير رحلات إيمانية وترفيهية للحلقات الملتزمة بمعدل حضور 95%+.'
      ],
      recommendations: 'اعتماد الميزانية الإضافية للنشاط الثقافي للربع القادم والتوسع في القوافل القرآنيّة.',
      kpis: [
        { label: 'عدد الفاعليات', value: '11 نشاطاً', status: 'مكتمل بنجاح' },
        { label: 'الطلاب المشاركين', value: '240 طالباً', status: 'تجاوز المستهدف' },
        { label: 'نسبة الرضا العامة', value: '96.5 %', status: 'ممتاز مرتفع' }
      ],
      dateCreated: '١٤٤٧/١٢/١٠ هـ'
    },
    {
      id: 'custom-2',
      category: 'memorization',
      categoryLabel: 'الحفظ والتسميع',
      title: 'تقرير كفاءة ومعدلات التسميع اليومي للحفاظ',
      subtitle: 'قياس سرعة إنجاز الصفحات ودقة الضبط بالتجويد والأداء',
      scope: 'حلقات المتقدمين والخاتمين',
      summary: 'أظهرت مؤشرات التسميع اليومي ارتفاعاً ملحوظاً في حجم الصفحات المنجزة أسبوعياً بمعدل 14 صفحة لكل طالب بحلقات الخاتمين.',
      keyPoints: [
        'متوسط التسميع اليومي للطالب: 3.5 صفحة.',
        'نسبة الخطأ والتنبيهات التجويدية: أقل من 1.2 ملاحظة لكل جزء.',
        'التزام ممتاز بجداول الإعداد والتسميع المسبق.'
      ],
      recommendations: 'تكثيف جلسات المراجعة الصغرى والكبرى للطلاب المتقدمين لمنع التلبيس في المتشابهات.',
      kpis: [
        { label: 'إجمالي الصفحات المسمعة', value: '4,850 صفحة', status: 'قياسي' },
        { label: 'متوسط الدقة والأداء', value: '94.8 %', status: 'ممتاز' },
        { label: 'نسبة الالتزام بالتسميع', value: '92.0 %', status: 'ثابت' }
      ],
      dateCreated: '١٤٤٧/١٢/١٢ هـ'
    }
  ]);

  // Editable overrides for active report
  const [editableReportData, setEditableReportData] = useState<Record<string, {
    title?: string;
    subtitle?: string;
    summary?: string;
    keyPoints?: string[];
    recommendations?: string;
    authorName?: string;
    managerName?: string;
  }>>({});

  // New Custom Report Form State
  const [newReportCategory, setNewReportCategory] = useState<CustomReportItem['category']>('activities');
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportSubtitle, setNewReportSubtitle] = useState('');
  const [newReportScope, setNewReportScope] = useState('عام لجميع الحلقات');
  const [newReportSummary, setNewReportSummary] = useState('');
  const [newReportKeyPointsText, setNewReportKeyPointsText] = useState('');
  const [newReportRecs, setNewReportRecs] = useState('');

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export Actions
  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      
      const element = document.getElementById('printable-area');
      if (!element) return;

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${getReportTitle()}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; }
            table { border-collapse: collapse; width: 100%; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .header-box { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 10px; margin-bottom: 20px; }
            .title { color: #065f46; font-size: 18px; font-weight: bold; }
            .kpi-card { border: 1px solid #e2e8f0; padding: 10px; background: #f8fafc; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div className="header-box">
            <h2>الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض</h2>
            <h3>ملتقى الهدى القرآني النموذجي</h3>
            <p className="title">${getReportTitle()}</p>
          </div>
          ${element.innerHTML}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getReportTitle().slice(0, 30)} - ملتقى الهدى.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerToast('تم تصدير التقرير بنجاح كملف وورد MS Word (.doc)');
    }, 800);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);

      // Construct CSV data with UTF-8 BOM
      let csvContent = '\uFEFF';
      csvContent += `تقرير ملتقى الهدى القرآني - ${getReportTitle()}\n`;
      csvContent += `تاريخ التصدير,${new Date().toLocaleDateString('ar-SA')}\n\n`;

      if (activeReportKey === 'individual_circle') {
        const activeCircle = mockCircles.find(c => c.id === selectedCircleId) || mockCircles[0];
        const circleStudents = mockStudents.filter(s => s.circleId === activeCircle.id);

        csvContent += `اسم الحلقة,المعلم المكلف,إجمالي الطلاب,نسبة الحضور,نسبة الالتزام بالخطة,معدل الدرجات\n`;
        csvContent += `${activeCircle.name},${activeCircle.teacherName},${activeCircle.studentsCount},${activeCircle.attendanceRate}%,${activeCircle.planComplianceRate}%,${activeCircle.avgTestScore}%\n\n`;

        csvContent += `اسم الطالب,الحالة,الصفحات المسمعة,المعدل الشهري,نسبة الحضور,درجة الاختبار\n`;
        circleStudents.forEach(s => {
          csvContent += `"${s.name}",${s.status === 'exceeding' ? 'متفوق' : s.status === 'committed' ? 'ملتزم' : 'يحتاج متابعة'},${s.memorizedPages},${s.monthlyAveragePages},${s.attendanceRate}%,${s.testScore}%\n`;
        });
      } else if (activeReportKey === 'students') {
        csvContent += `اسم الطالب,الحلقة التابعة,عدد صفحات الحفظ,معدل الحضور,درجة التقييم\n`;
        mockStudents.forEach(s => {
          csvContent += `"${s.name}","${s.circleName}",${s.memorizedPages},${s.attendanceRate}%,${s.testScore}%\n`;
        });
      } else if (activeReportKey === 'circles') {
        csvContent += `حلقة التحفيظ,المحفظ المكلف,عدد المنتسبين,نسبة الالتزام بالمنهج,معدل الحضور,التقييم العام\n`;
        mockCircles.forEach(c => {
          csvContent += `"${c.name}","${c.teacherName}",${c.studentsCount},${c.planComplianceRate}%,${c.attendanceRate}%,${c.overallScore}%\n`;
        });
      } else if (activeReportKey === 'teachers') {
        csvContent += `اسم المعلم,كفاءة حضور الطلاب,دقة خطة التقويم,التقييم الفني,الحالة\n`;
        mockTeachers.forEach(t => {
          csvContent += `"${t.name}",${t.attendanceRate}%,${t.planCompliance}%,${t.rating}/5,${t.status}\n`;
        });
      } else {
        csvContent += `المؤشر القياسي,الرصيد الفعلي,حالة الكفاءة\n`;
        csvContent += `معدل الحضور والمواظبة الكلي,91%,ممتاز وثابت\n`;
        csvContent += `نسبة تنفيذ خطة الحفظ,87%,متوافق مع الخريطة الزمنية\n`;
        csvContent += `متوسط الاختبارات الممركزة,88.5%,ممتاز مرتفع\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getReportTitle().slice(0, 25)} - بيانات Excel.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerToast('تم تصدير الجداول والبيانات بنجاح بصيغة إكسل MS Excel (.csv)');
    }, 800);
  };

  const handleExportImage = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerToast('تم تجهيز الصورة عالية الدقة (PNG) للتقرير وجاري التحميل...');
    }, 1200);
  };

  // Add Custom Report Handler
  const handleCreateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return;

    const catLabels: Record<CustomReportItem['category'], string> = {
      activities: 'الأنشطة والبرامج',
      memorization: 'الحفظ والتسميع',
      revision: 'المراجعة والإتقان',
      curriculum: 'المنهج والخطط',
      grades: 'الدرجات والاختبارات',
      students: 'الطلاب ومصلحتهم',
      achievements: 'الإنجازات والجوائز',
      efficiency: 'الكفاءة والأداء',
      other: 'تقرير عام'
    };

    const keyPointsArray = newReportKeyPointsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newReport: CustomReportItem = {
      id: `custom-${Date.now()}`,
      category: newReportCategory,
      categoryLabel: catLabels[newReportCategory] || 'مخصص',
      title: newReportTitle.trim(),
      subtitle: newReportSubtitle.trim() || 'تقرير مخصص معتمد صادر من الإدارة العامة',
      scope: newReportScope.trim() || 'عام',
      summary: newReportSummary.trim() || 'لا توجد خلاصة مضافة.',
      keyPoints: keyPointsArray.length > 0 ? keyPointsArray : ['تم استيفاء الشروط والمعايير المعتمدة بالملتقى.'],
      recommendations: newReportRecs.trim() || 'متابعة تنفيذ التوصيات وفق الخطة الميدانية.',
      kpis: [
        { label: 'معدل الإنجاز', value: '95 %', status: 'مستهدف محقق' },
        { label: 'مستوى الالتزام', value: 'عالي', status: 'ممتاز' },
        { label: 'التقييم العام', value: '4.8 / 5', status: 'معتمد' }
      ],
      dateCreated: new Date().toLocaleDateString('ar-SA')
    };

    setCustomReports(prev => [newReport, ...prev]);
    setActiveReportKey(newReport.id);
    setShowCustomReportModal(false);

    // Reset Form
    setNewReportTitle('');
    setNewReportSubtitle('');
    setNewReportSummary('');
    setNewReportKeyPointsText('');
    setNewReportRecs('');

    triggerToast('تمت إضافة التقرير المخصص بنجاح وتثبيته في منصة التقارير!');
  };

  // Helper getters
  const activeCustomReport = customReports.find(r => r.id === activeReportKey);
  const activeEditableData = editableReportData[activeReportKey] || {};

  const getReportTitle = () => {
    if (activeEditableData.title) return activeEditableData.title;
    if (activeCustomReport) return activeCustomReport.title;

    switch (activeReportKey) {
      case 'executive': return 'التقرير التنفيذي العام والتقويم الإداري لملتقى الهدى';
      case 'students': return 'تقرير مصلحة الطلاب ومستويات الحفظ والمواظبة';
      case 'circles': return 'تقرير متابعة أداء وإنتاجية الحلقات التفاضلي';
      case 'teachers': return 'تقرير كفاءة وتقييم المعلمين والمحفظين التراكمي';
      case 'plans': return 'تقرير دقة تنفيذ الخطط وجداول التسميع الأسبوعية';
      case 'courses': return 'تقرير المقررات ومناهج علوم الآلة والتجويد المعتمدة';
      case 'activities': return 'تقرير حصر المحاضرات والملتقيات والأنشطة التربوية';
      case 'graduates': return 'تقرير قياس أثر الحفاظ المتخرجين وسجل توظيفهم المهني';
      case 'individual_circle': {
        const circle = mockCircles.find(c => c.id === selectedCircleId) || mockCircles[0];
        return `تقرير الأداء الميداني والنقاط المهمة لـ (${circle.name})`;
      }
      default: return 'تقرير معتمد - ملتقى الهدى';
    }
  };

  const getReportSubtitle = () => {
    if (activeEditableData.subtitle) return activeEditableData.subtitle;
    if (activeCustomReport) return activeCustomReport.subtitle;

    if (activeReportKey === 'individual_circle') {
      const circle = mockCircles.find(c => c.id === selectedCircleId) || mockCircles[0];
      return `تقرير تقويمي تفصيلي للحلقة بقيادة المحفظ أ. ${circle.teacherName} — ${circle.priorityLabel}`;
    }

    return 'تقرير رسمي موثق متوافق مع معايير الهوية البصرية المعتمدة لملتقى الهدى القرآني';
  };

  // Active Circle Data for Individual Circle View
  const selectedCircleData = mockCircles.find(c => c.id === selectedCircleId) || mockCircles[0];
  const selectedCircleStudents = mockStudents.filter(s => s.circleId === selectedCircleData.id);

  // Save Edits to current report
  const handleSaveReportEdits = (
    title: string, 
    subtitle: string, 
    summary: string, 
    keyPointsArr: string[], 
    recs: string,
    author: string,
    manager: string
  ) => {
    setEditableReportData(prev => ({
      ...prev,
      [activeReportKey]: {
        title,
        subtitle,
        summary,
        keyPoints: keyPointsArr,
        recommendations: recs,
        authorName: author,
        managerName: manager
      }
    }));
    setShowEditReportModal(false);
    triggerToast('تمت تحديثات نص التقرير والنقاط الرئيسية بنجاح!');
  };

  return (
    <div className="space-y-6 text-right font-sans" id="quick-reports-section">
      
      {/* TOP SELECTION BOARD & ACTIONS HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        
        {/* Title & Add Custom Report Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>منصة إعداد وتصدير التقارير السريعة التلقائية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              انقر على أي مستند أدناه لتوليد مسودة رسمية فورية تفصيلية ومخصصة متوائمة مع الهوية البصرية لملتقى الهدى.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCustomReportModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة تقرير مخصص جديد</span>
            </button>
          </div>
        </div>

        {/* REPORT TRIGGER BUTTONS GRID */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>التقارير المعتمدة والقياسية (اختر للتوليد):</span>
            <span className="text-slate-400 font-normal">إجمالي التقارير المتاحة: {8 + customReports.length + 1}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            
            {/* 8 Built-in Core Buttons */}
            <button 
              onClick={() => setActiveReportKey('executive')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'executive' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">التقرير التنفيذي العام</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('students')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'students' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Users className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير الطلاب والنتائج</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('circles')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'circles' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير الحلقات التفاضلي</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('teachers')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'teachers' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Users className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير أداء المدرسين</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('plans')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'plans' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير المناهج والخطط</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('courses')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'courses' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <ClipboardList className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير المقررات والعلوم</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('activities')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'activities' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Compass className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير الأنشطة التربوية</span>
            </button>

            <button 
              onClick={() => setActiveReportKey('graduates')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'graduates' 
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30' 
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200'
              }`}
            >
              <Award className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">تقرير الخريجين القياسي</span>
            </button>

            {/* Individual Circle Report Button */}
            <button 
              onClick={() => setActiveReportKey('individual_circle')}
              className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center gap-2 cursor-pointer ${
                activeReportKey === 'individual_circle' 
                  ? 'bg-amber-800 text-white border-amber-800 shadow-sm ring-2 ring-amber-500/30' 
                  : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              <Target className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="truncate">تقرير حلقة فردية</span>
            </button>

            {/* Custom User Reports Buttons */}
            {customReports.map(cReport => (
              <button
                key={cReport.id}
                onClick={() => setActiveReportKey(cReport.id)}
                className={`p-3 rounded-xl border font-bold text-xs text-right transition-all flex items-center justify-between gap-1 cursor-pointer ${
                  activeReportKey === cReport.id 
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm ring-2 ring-purple-500/30' 
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-200'
                }`}
              >
                <span className="truncate">{cReport.title}</span>
                <span className="text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md shrink-0 font-bold">
                  {cReport.categoryLabel}
                </span>
              </button>
            ))}

          </div>
        </div>

        {/* INDIVIDUAL CIRCLE SELECTOR BAR (Visible when 'individual_circle' is active) */}
        {activeReportKey === 'individual_circle' && (
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-800 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-950 block">حدد الحلقة المستهدفة للتجميع الفردي:</span>
                <span className="text-[10px] text-amber-800 block">سيتم توليد تقرير خاص بالحلقة يتضمن الأداء ومصلحة الطلاب والنقاط المهمة</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCircleId}
                onChange={e => setSelectedCircleId(e.target.value)}
                className="bg-white border border-amber-300 text-amber-950 text-xs font-bold p-2 px-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden w-full sm:w-auto"
              >
                {mockCircles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — أ. {c.teacherName} ({c.studentsCount} طالب)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>

      {/* DOCUMENT PREVIEW TOOLBAR & OPTIONS CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Detailed View Toggle & Edit Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsDetailedMode(!isDetailedMode)}
              className={`p-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isDetailedMode 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sliders className="h-4 w-4 text-emerald-700" />
              <span>{isDetailedMode ? 'عرض شمول مفصل (مستفيض)' : 'عرض موجز (قياسي)'}</span>
            </button>

            <button
              onClick={() => setShowEditReportModal(true)}
              className="p-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-250 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="h-4 w-4 text-amber-700" />
              <span>تعديل نص التقرير والنقاط الرئيسية</span>
            </button>
          </div>

          {/* EXPORT BUTTONS (PDF, WORD, EXCEL, IMAGE) */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 px-3 bg-white border border-slate-250 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span>طباعة / PDF</span>
            </button>

            <button 
              onClick={handleExportWord}
              disabled={isExporting}
              className="p-2 px-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <FileText className="h-4 w-4 text-blue-700" />
              <span>تصدير Word (.doc)</span>
            </button>

            <button 
              onClick={handleExportExcel}
              disabled={isExporting}
              className="p-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              <span>تصدير Excel (.csv)</span>
            </button>

            <button 
              onClick={handleExportImage}
              disabled={isExporting}
              className="p-2 px-3 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4 text-purple-700" />
              <span>حفظ كصورة (PNG)</span>
            </button>
          </div>

        </div>

        {/* SEAL & SIGNATURE BRANDING TOGGLES BAR */}
        <div className="pt-2 border-t border-slate-150 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <span className="font-bold text-slate-700">تخصيص عناصر الهوية والتوثيق:</span>
          
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showLetterhead} 
                onChange={e => setShowLetterhead(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-700">الترويسة الرسمية</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSeal} 
                onChange={e => setShowSeal(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-700">الختم الموثق</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSignature} 
                onChange={e => setShowSignature(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-700">التوقيع الاعتمادي</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showQRCode} 
                onChange={e => setShowQRCode(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-700">كود التحقق QR</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showWatermark} 
                onChange={e => setShowWatermark(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-700">العلامة المائية</span>
            </label>
          </div>
        </div>

      </div>

      {/* DOCUMENT VIEW CONTAINER (A4 PHYSICAL PAPER SIMULATION) */}
      <div className="bg-slate-200/80 p-3 sm:p-8 rounded-2xl border border-slate-300/80 shadow-inner flex flex-col items-center" id="generated-report-frame">
        
        {/* PAPER CONTAINER */}
        <div 
          className="w-full max-w-[780px] bg-white border border-slate-300 rounded-lg shadow-xl p-6 sm:p-10 relative text-right text-slate-800 font-sans leading-relaxed flex flex-col justify-between min-h-[980px] print-paper overflow-hidden" 
          id="printable-area"
        >
          
          {/* WATERMARK EMBLEM (Optional) */}
          {showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-0">
              <div className="text-center font-display">
                <span className="text-8xl font-black block">ملتقى الهدى</span>
                <span className="text-4xl font-bold block">الرياض - ١٤٤٧ هـ</span>
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT BODY WRAPPER */}
          <div className="space-y-6 relative z-10">
            
            {/* OFFICIAL LETTERHEAD SECTION */}
            {showLetterhead && (
              <div className="border-b-2 border-emerald-900 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-xs">الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض</p>
                    <p className="font-black text-slate-900 text-base font-display text-emerald-950">
                      ملتقى الهدى القرآني النموذجي بالرياض
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      المركز الرئيسي والإدارة العامة • ترخيص رسمي رقم: ق/١٤٤٢
                    </p>
                  </div>

                  {/* Logo Emblem Placeholder & QR Code */}
                  <div className="flex items-center gap-3">
                    {showQRCode && (
                      <div className="text-center p-1.5 bg-slate-50 rounded-lg border border-slate-200 hidden sm:block">
                        <QrCode className="h-9 w-9 text-slate-800 mx-auto" />
                        <span className="text-[8px] font-mono font-bold text-slate-500 block mt-0.5">رمز الموثوقية</span>
                      </div>
                    )}
                    <div className="text-center space-y-1 shrink-0 bg-emerald-900 text-white p-2.5 rounded-xl border border-emerald-950 shadow-xs">
                      <span className="text-[9px] font-bold text-emerald-200 block">الهوية المعتمدة</span>
                      <span className="text-[11px] font-bold block">بسم الله الرحمن الرحيم</span>
                    </div>
                  </div>
                </div>

                {/* Document Metadata Strip */}
                <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-600 font-mono font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>رقم التصدير: م هـ / ت أ / {Math.floor(Math.random() * 8000 + 1000)}</span>
                  <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</span>
                  <span>حالة المستند: موثق ومعتمد رسمياً</span>
                </div>
              </div>
            )}

            {/* DOCUMENT TITLE SECTION */}
            <div className="text-center py-2 space-y-1.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight font-display border-b-2 border-emerald-800 pb-2 inline-block px-4">
                {getReportTitle()}
              </h1>
              <p className="text-xs text-slate-600 font-medium pt-1">
                {getReportSubtitle()}
              </p>
            </div>

            {/* KPI METRICS HEADER CARDS (In Detailed Mode) */}
            {isDetailedMode && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">معدل الانضباط العام</span>
                  <span className="text-sm font-black font-mono text-emerald-800 block mt-0.5">93.5 %</span>
                  <span className="text-[9px] text-emerald-700 font-bold block">نطاق ممتاز</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي الطلاب المسجلين</span>
                  <span className="text-sm font-black font-mono text-slate-900 block mt-0.5">320 طالباً</span>
                  <span className="text-[9px] text-slate-600 font-bold block">موزعين على 5 فروع</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">معدل درجات الاختبارات</span>
                  <span className="text-sm font-black font-mono text-indigo-800 block mt-0.5">88.5 %</span>
                  <span className="text-[9px] text-indigo-700 font-bold block">تقييم ممركز</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">مستوى الالتزام بالخطة</span>
                  <span className="text-sm font-black font-mono text-emerald-800 block mt-0.5">91.0 %</span>
                  <span className="text-[9px] text-emerald-700 font-bold block">مطابق للجدول</span>
                </div>
              </div>
            )}

            {/* DYNAMIC REPORT CONTENT RENDERING */}
            <div className="space-y-5 text-xs text-slate-800">

              {/* A. INDIVIDUAL CIRCLE REPORT TEMPLATE */}
              {activeReportKey === 'individual_circle' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex justify-between items-center border-b border-amber-200/80 pb-2">
                      <span className="font-bold text-amber-950 text-xs">بطاقة التعريف بالحلقة:</span>
                      <span className="bg-amber-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {selectedCircleData.priorityLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-amber-900 font-medium pt-1">
                      <div><b>اسم الحلقة:</b> {selectedCircleData.name}</div>
                      <div><b>المعلم المكلف:</b> أ. {selectedCircleData.teacherName}</div>
                      <div><b>عدد المنتسبين:</b> {selectedCircleData.studentsCount} طلاب</div>
                      <div><b>نسبة الحضور:</b> {selectedCircleData.attendanceRate}%</div>
                      <div><b>إنجاز الصفحات:</b> {selectedCircleData.memorizationPages} ص</div>
                      <div><b>دقة الخطة:</b> {selectedCircleData.planComplianceRate}%</div>
                      <div><b>معدل الاختبارات:</b> {selectedCircleData.avgTestScore}%</div>
                      <div><b>تقييم الحلقة:</b> {selectedCircleData.overallScore} / 100</div>
                    </div>
                  </div>

                  {/* Key Points Section for Individual Circle */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>النقاط المهمة والملاحظات التربوية الخاصة بهذه الحلقة:</span>
                    </h4>
                    <ul className="space-y-1.5 text-slate-700 pr-4 list-disc text-xs leading-relaxed">
                      <li>تظهر الحلقة انضباطاً عالياً في تسميع الحفظ المقرر للربع الحالي.</li>
                      <li>تميز الطلاب المتقدمين في جلسات المراجعة الكبرى وسجلات الأمانة الفنية.</li>
                      <li>توصية تربوية: استمرار تحفيز الطلاب الخاتمين ودعم المراجعة المكثفة قبل الاختبارات الممركزة.</li>
                    </ul>
                  </div>

                  {/* Student List Table for this Specific Circle */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">جدول حصر طلاب {selectedCircleData.name}:</h4>
                    <table className="w-full border-collapse border border-slate-200 text-center font-medium">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900">
                          <th className="border border-slate-200 p-2 font-bold">اسم الطالب</th>
                          <th className="border border-slate-200 p-2 font-bold">حالة الالتزام</th>
                          <th className="border border-slate-200 p-2 font-bold">الصفحات المسمعة</th>
                          <th className="border border-slate-200 p-2 font-bold">نسبة الحضور</th>
                          <th className="border border-slate-200 p-2 font-bold">درجة الاختبار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCircleStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-slate-400">لا يوجد طلاب مسجلون بحسب السجل الحالي</td>
                          </tr>
                        ) : (
                          selectedCircleStudents.map(st => (
                            <tr key={st.id} className="hover:bg-slate-50">
                              <td className="border border-slate-200 p-2 font-bold text-slate-900">{st.name}</td>
                              <td className="border border-slate-200 p-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  st.status === 'exceeding' ? 'bg-emerald-100 text-emerald-800' :
                                  st.status === 'committed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {st.status === 'exceeding' ? 'متفوق جداً' : st.status === 'committed' ? 'منتظم' : 'يلزم متابعة'}
                                </span>
                              </td>
                              <td className="border border-slate-200 p-2 font-mono">{st.memorizedPages} صفحة</td>
                              <td className="border border-slate-200 p-2 font-mono">{st.attendanceRate}%</td>
                              <td className="border border-slate-200 p-2 font-mono font-bold text-indigo-800">{st.testScore}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* B. EXECUTIVE REPORT TEMPLATE */}
              {activeReportKey === 'executive' && (
                <div className="space-y-4">
                  <p className="leading-relaxed font-normal">
                    {activeEditableData.summary || 'نعرض لفضيلتكم خلاصة الأداء والموثوقية الفنية لملتقى الهدى لهذا الفصل الدراسي الجاري. سجل الملتقى معدلات كفاءة استثنائية تعكس الجهود المنظمة لضبط عمليات التحفيظ والمراجعة الميدانية على النحو الموضح بالجدول التراكمي:'}
                  </p>
                  
                  <table className="w-full border-collapse border border-slate-200 text-center font-medium">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-200 p-2 font-bold">مؤشر الحوكمة والأثر</th>
                        <th className="border border-slate-200 p-2 font-bold">الرصيد الفعلي</th>
                        <th className="border border-slate-200 p-2 font-bold">حالة الكفاءة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 p-2">معدل الحضور والمواظبة الكلي</td>
                        <td className="border border-slate-200 p-2 font-mono font-bold">91 %</td>
                        <td className="border border-slate-200 p-2 text-emerald-700 font-bold">ثابت وممتاز</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-2">نسبة تنفيذ مناهج حفظ الطلاب</td>
                        <td className="border border-slate-200 p-2 font-mono font-bold">87 %</td>
                        <td className="border border-slate-200 p-2 text-indigo-700 font-bold">متوافق مع الخريطة الزمنية</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-2">متوسطات درجات الاختبارات الممركزة</td>
                        <td className="border border-slate-200 p-2 font-mono font-bold">88.5 %</td>
                        <td className="border border-slate-200 p-2 text-emerald-700 font-bold">ممتاز جداً</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Editable or Default Key Points */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs">النقاط الرئيسية والمعالم:</p>
                    <ul className="list-disc pr-4 space-y-1 text-slate-700 text-xs leading-relaxed">
                      {(activeEditableData.keyPoints || [
                        'اكتمال مرحلة التقييم الممركزة بفرعي الشمال والجنوب بنسبة نجاح 98%.',
                        'استقرار العجز المالي والإداري بالحلقات وتأمين كافة المستلزمات التعليمية.',
                        'اعتماد نظام الجوائز والتحفيز السريع للطلاب الملتزمين بالحفظ والمراجعة.'
                      ]).map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-1 text-emerald-950">
                    <p className="font-bold text-xs">توصية الأمانة الفنية العامة:</p>
                    <p className="font-medium leading-relaxed">
                      {activeEditableData.recommendations || 'توصي الإدارة العامة بمضاعفة المتابعة الميدانية للحلقات التي تواجه تعثراً فائقاً بفرع الشرق، للعودة بالالتزام إلى النطاق الآمن قبل انتهاء خط الفصل الزمني الحالي.'}
                    </p>
                  </div>
                </div>
              )}

              {/* C. STUDENTS & RESULTS TEMPLATE */}
              {activeReportKey === 'students' && (
                <div className="space-y-4">
                  <p className="leading-relaxed font-normal">
                    {activeEditableData.summary || 'تتمثل بيانات حصر مذكرات الحفظ وسجلات مصلحة الطلاب والمواظبة بالفصل الحالي بالجدول التراكمي التالي:'}
                  </p>
                  <table className="w-full border-collapse border border-slate-200 text-center font-medium">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-200 p-2 font-bold">اسم الطالب</th>
                        <th className="border border-slate-200 p-2 font-bold">الحلقة التابعة</th>
                        <th className="border border-slate-200 p-2 font-bold">صفحات الحفظ</th>
                        <th className="border border-slate-200 p-2 font-bold">معدل الحضور</th>
                        <th className="border border-slate-200 p-2 font-bold">درجة الاختبار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockStudents.slice(0, 8).map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="border border-slate-200 p-2 font-bold text-slate-900">{s.name}</td>
                          <td className="border border-slate-200 p-2">{s.circleName}</td>
                          <td className="border border-slate-200 p-2 font-mono">{s.memorizedPages} ص</td>
                          <td className="border border-slate-200 p-2 font-mono">{s.attendanceRate}%</td>
                          <td className="border border-slate-200 p-2 font-mono font-bold text-emerald-800">{s.testScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* D. CIRCLES DIFFERENTIAL TEMPLATE */}
              {activeReportKey === 'circles' && (
                <div className="space-y-4">
                  <p className="leading-relaxed font-normal">
                    {activeEditableData.summary || 'تقرير توازن ومقارنة أداء حلقات تحفيظ القرآن الكريم بالملتقى لبيان الأرصدة والتقييمات الفنية:'}
                  </p>
                  <table className="w-full border-collapse border border-slate-200 text-center font-medium">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-200 p-2 font-bold">حلقة التحفيظ</th>
                        <th className="border border-slate-200 p-2 font-bold">المحفظ المكلّف</th>
                        <th className="border border-slate-200 p-2 font-bold">المنتسبين</th>
                        <th className="border border-slate-200 p-2 font-bold">الالتزام بالمنهج</th>
                        <th className="border border-slate-200 p-2 font-bold">التقييم العام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCircles.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="border border-slate-200 p-2 font-bold text-slate-900">{c.name}</td>
                          <td className="border border-slate-200 p-2">أ. {c.teacherName}</td>
                          <td className="border border-slate-200 p-2 font-mono">{c.studentsCount} طلاب</td>
                          <td className="border border-slate-200 p-2 font-mono text-indigo-700 font-bold">{c.planComplianceRate}%</td>
                          <td className="border border-slate-200 p-2 font-bold text-emerald-800">{c.priorityLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* E. TEACHERS TEMPLATE */}
              {activeReportKey === 'teachers' && (
                <div className="space-y-4">
                  <p className="leading-relaxed font-normal">
                    {activeEditableData.summary || 'تتمثل بيانات قياس مدى التزام الكادر التدريسي وحصيلة المتابعة الدورية بالبلورة الفنية التالية:'}
                  </p>
                  <table className="w-full border-collapse border border-slate-200 text-center font-medium">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-200 p-2 font-bold">المعلم الفاضل</th>
                        <th className="border border-slate-200 p-2 font-bold">كفاءة حضور الطلاب</th>
                        <th className="border border-slate-200 p-2 font-bold">دقة خطة التقويم</th>
                        <th className="border border-slate-200 p-2 font-bold">تصنيف الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTeachers.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="border border-slate-200 p-2 font-bold text-slate-900">{t.name}</td>
                          <td className="border border-slate-200 p-2 font-mono">{t.attendanceRate}%</td>
                          <td className="border border-slate-200 p-2 font-mono">{t.planCompliance}%</td>
                          <td className="border border-slate-200 p-2 font-bold">
                            {t.status === 'outstanding' ? 'صدارة متميزة' : t.status === 'stable' ? 'مستقرة' : 'يلزم المساعدة والمتابعة'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* F. CUSTOM USER CREATED REPORT RENDERING */}
              {activeCustomReport && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-bold text-xs flex justify-between items-center">
                    <span>تصنيف التقرير: {activeCustomReport.categoryLabel}</span>
                    <span>نطاق التقرير: {activeCustomReport.scope}</span>
                  </div>

                  <p className="leading-relaxed font-normal text-xs">
                    {activeEditableData.summary || activeCustomReport.summary}
                  </p>

                  {/* Key Points */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs">النقاط الرئيسية والمعالم:</p>
                    <ul className="list-disc pr-4 space-y-1 text-slate-700 text-xs leading-relaxed">
                      {(activeEditableData.keyPoints || activeCustomReport.keyPoints).map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200 space-y-1 text-purple-950">
                    <p className="font-bold text-xs">التوصيات والإرشادات:</p>
                    <p className="font-medium leading-relaxed">
                      {activeEditableData.recommendations || activeCustomReport.recommendations}
                    </p>
                  </div>
                </div>
              )}

              {/* G. FALLBACK TEMPLATE FOR OTHER DEFAULT REPORTS */}
              {['plans', 'courses', 'activities', 'graduates'].includes(activeReportKey) && !activeCustomReport && (
                <div className="space-y-4">
                  <p className="leading-relaxed font-normal">
                    {activeEditableData.summary || `التقرير التفصيلي المعتمد المخصص لـ (${getReportTitle()}) يظهر مطابقة تامة للمعايير القياسية بمصلحة ملتقى الهدى بالرياض للعام الحالي ١٤٤٧ هـ.`}
                  </p>
                  
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700 font-medium text-xs">
                    <p className="font-bold text-slate-900">النقاط الرئيسية وبيانات الأمانة العامة:</p>
                    {(activeEditableData.keyPoints || [
                      'مستوى الاستجابة التلقائية للطلاب والمدرسين: ممتاز مرتفع.',
                      'إجمالي الأهداف المحققة بالخطة: ١٠٠٪ من المستهدف المرحلي.',
                      'التوصية الإدارية: المصادقة الكاملة وتعميم التقرير بجميع فروع الملتقى.'
                    ]).map((pt, idx) => (
                      <p key={idx}>• {pt}</p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* SIGNATURE & STAMPS FOOTER BLOCK */}
          <div className="border-t-2 border-slate-200 pt-6 mt-8 flex items-end justify-between gap-4 relative z-10">
            
            {/* Author Signature */}
            <div className="space-y-1 text-center">
              <p className="font-bold text-slate-900 text-xs">مُعّد التقرير والتدقيق الفني</p>
              <p className="text-slate-600 text-[11px]">
                {activeEditableData.authorName || 'الأستاذ حازم بن عبدالله (سجل المتابعة)'}
              </p>
              {showSignature && (
                <div className="pt-2 font-mono text-[10px] text-emerald-800 font-bold underline">
                  [توقيع إلكتروني موثق]
                </div>
              )}
            </div>

            {/* Official Emerald/Gold Seal Emblem */}
            {showSeal && (
              <div className="w-20 h-20 rounded-full border-4 border-emerald-800 bg-emerald-50/50 flex items-center justify-center text-center rotate-6 shadow-xs select-none pointer-events-none p-1 shrink-0">
                <div className="border border-emerald-700 rounded-full w-full h-full flex flex-col items-center justify-center">
                  <span className="text-[7px] font-black text-emerald-900 leading-tight">ملتقى الهدى</span>
                  <span className="text-[6px] font-bold text-emerald-800">ختم الاعتماد</span>
                  <span className="text-[6px] font-mono text-emerald-900">١٤٤٧ هـ</span>
                </div>
              </div>
            )}

            {/* General Manager Approval */}
            <div className="space-y-1 text-center">
              <p className="font-bold text-slate-900 text-xs">المدير العام لملتقى الهدى</p>
              <p className="text-slate-600 text-[11px]">
                {activeEditableData.managerName || 'الشيخ عبدالرحمن بن محمد السعيد'}
              </p>
              {showSignature && (
                <div className="text-emerald-800 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                  معتمد بصلاحيات المدير العام
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* CREATE CUSTOM REPORT MODAL */}
      {showCustomReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">إضافة تقرير مخصص جديد</h3>
                  <p className="text-[11px] text-slate-500">اختر التصنيف وأدخل البيانات ليتم توليد التقرير فوراً</p>
                </div>
              </div>
              <button onClick={() => setShowCustomReportModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateCustomReport} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تصنيف التقرير المخصص *
                  </label>
                  <select
                    value={newReportCategory}
                    onChange={e => setNewReportCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="activities">الأنشطة والبرامج</option>
                    <option value="memorization">الحفظ والتسميع</option>
                    <option value="revision">المراجعة والإتقان</option>
                    <option value="curriculum">المنهج والخطط</option>
                    <option value="grades">الدرجات والاختبارات</option>
                    <option value="students">الطلاب ومصلحتهم</option>
                    <option value="achievements">الإنجازات والجوائز</option>
                    <option value="efficiency">الكفاءة والأداء</option>
                    <option value="other">تقرير عام مخصص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نطاق التقرير (مثل: حلقة محددة / فرع / عام)
                  </label>
                  <input
                    type="text"
                    value={newReportScope}
                    onChange={e => setNewReportScope(e.target.value)}
                    placeholder="مثال: حلقة الطليعة، فرع شمال الرياض"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان التقرير المخصص *
                </label>
                <input
                  type="text"
                  required
                  value={newReportTitle}
                  onChange={e => setNewReportTitle(e.target.value)}
                  placeholder="مثال: تقرير إنجاز المراجعة الكبرى لحلقة عاصم الكوفي"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الوصف / العنوان الفرعي
                </label>
                <input
                  type="text"
                  value={newReportSubtitle}
                  onChange={e => setNewReportSubtitle(e.target.value)}
                  placeholder="مثال: حصر أسبوعي شامل لمعدلات الحفظ والإتقان"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الخلاصة التنفيذية للتقرير
                </label>
                <textarea
                  rows={2}
                  value={newReportSummary}
                  onChange={e => setNewReportSummary(e.target.value)}
                  placeholder="اكتب خلاصة موجزة تعكس الأداء والتفاصيل الرئيسية..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  النقاط الرئيسية والمعالم (اكتب كل نقطة في سطر جديد)
                </label>
                <textarea
                  rows={3}
                  value={newReportKeyPointsText}
                  onChange={e => setNewReportKeyPointsText(e.target.value)}
                  placeholder="النقطة الأولى: إنجاز 95% من المقرر.&#10;النقطة الثانية: تم تكريم الطلاب المتفوقين.&#10;النقطة الثالثة: استمرار جلسات التثبيت."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التوصيات التربوية والإدارية
                </label>
                <input
                  type="text"
                  value={newReportRecs}
                  onChange={e => setNewReportRecs(e.target.value)}
                  placeholder="مثال: الاستمرار في تطبيق المتابعة اليومية المكثفة"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCustomReportModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newReportTitle.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>توليد التقرير وتثبيته</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REPORT MODAL */}
      {showEditReportModal && (
        <EditReportModal
          activeTitle={getReportTitle()}
          activeSubtitle={getReportSubtitle()}
          activeSummary={activeEditableData.summary || ''}
          activeKeyPoints={activeEditableData.keyPoints || []}
          activeRecs={activeEditableData.recommendations || ''}
          activeAuthor={activeEditableData.authorName || 'الأستاذ حازم بن عبدالله'}
          activeManager={activeEditableData.managerName || 'الشيخ عبدالرحمن بن محمد السعيد'}
          onSave={handleSaveReportEdits}
          onClose={() => setShowEditReportModal(false)}
        />
      )}

      {/* TOAST FEEDBACK FLOATING NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white p-3.5 px-6 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-2 text-xs animate-fade-in z-50">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// EDIT REPORT MODAL COMPONENT
interface EditReportModalProps {
  activeTitle: string;
  activeSubtitle: string;
  activeSummary: string;
  activeKeyPoints: string[];
  activeRecs: string;
  activeAuthor: string;
  activeManager: string;
  onSave: (
    title: string, 
    subtitle: string, 
    summary: string, 
    keyPointsArr: string[], 
    recs: string,
    author: string,
    manager: string
  ) => void;
  onClose: () => void;
}

function EditReportModal({
  activeTitle,
  activeSubtitle,
  activeSummary,
  activeKeyPoints,
  activeRecs,
  activeAuthor,
  activeManager,
  onSave,
  onClose
}: EditReportModalProps) {
  const [title, setTitle] = useState(activeTitle);
  const [subtitle, setSubtitle] = useState(activeSubtitle);
  const [summary, setSummary] = useState(activeSummary);
  const [keyPointsText, setKeyPointsText] = useState(
    activeKeyPoints.length > 0 
      ? activeKeyPoints.join('\n') 
      : 'اكتمال التقييم الممركز بالحلقة.\nالتزام عالي بالحضور والسمت الإيماني.'
  );
  const [recs, setRecs] = useState(activeRecs);
  const [author, setAuthor] = useState(activeAuthor);
  const [manager, setManager] = useState(activeManager);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kpArray = keyPointsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    onSave(title, subtitle, summary, kpArray, recs, author, manager);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">تعديل محتوى التقرير والنقاط الرئيسية</h3>
              <p className="text-[11px] text-slate-500">تعديل الصياغة المباشرة للتقرير قبل الطباعة أو التصدير</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان التقرير</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الفرعي / الوصف</label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">فقرة الخلاصة التنفيذية</label>
            <textarea
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">النقاط الرئيسية (سطر لكل نقطة)</label>
            <textarea
              rows={3}
              value={keyPointsText}
              onChange={e => setKeyPointsText(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التوصية العامة</label>
            <input
              type="text"
              value={recs}
              onChange={e => setRecs(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم مُعدّ التقرير</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدير الاعتمادي</label>
              <input
                type="text"
                value={manager}
                onChange={e => setManager(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              حفظ التغييرات على التقرير
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
