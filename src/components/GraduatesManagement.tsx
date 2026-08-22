/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Search, Filter, ShieldAlert, Award, Calendar, BookOpen, AlertCircle,
  Eye, Edit, Trash, Plus, CheckCircle, UserCheck, Settings, ArrowLeftRight, 
  FileText, ClipboardList, PlusCircle, Printer, Download, GraduationCap, 
  User, Check, Clock, TrendingUp, Shield, HelpCircle, FileDown, Briefcase, 
  MapPin, Image as ImageIcon, Send, Activity, Trash2, ArrowUpRight, RotateCcw,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for Graduates System
export interface GraduateTrackLog {
  date: string;
  type: 'follow_up' | 'assignment' | 'achievement' | 'status_change' | 'general';
  title: string;
  notes: string;
  by: string;
}

export interface GraduateAttachment {
  id: string;
  name: string;
  type: string; // 'pdf' | 'doc' | 'image'
  size: string;
  date: string;
}

export interface Graduate {
  id: string; // Stays fixed e.g., GR-000001
  name: string;
  avatar?: string;
  birthDate: string;
  age: number;
  phone: string;
  email: string;
  guardianName?: string;
  guardianPhone?: string;
  
  // Graduation Info
  graduationDate: string;
  circleGraduatedFrom: string;
  teacher: string;
  studyDurationYears: number;
  lastEducationalLevel: string;
  lastCompletedPlan: string;
  lastExamScore: number;
  finalGrade: 'excellent' | 'very_good' | 'good' | 'pass';
  overallCompletionRate: number; // e.g. 100%

  // Achievements
  memorizedPartsCount: number;
  certificatesCount: number;
  awards: string[];
  badges: string[];
  competitions: string[];
  notableParticipations: string[];

  // Historical Journey (from student days to graduation)
  history: Array<{
    date: string;
    event: string;
    description: string;
    category: 'registration' | 'transfer' | 'exam' | 'achievement' | 'graduation';
  }>;

  // Post-Graduation Status
  status: string; // 'reviewing' | 'teacher' | 'supervisor' | 'volunteer' | 'external' | 'disconnected' | 'unknown'
  
  // Follow ups after graduation
  followUps: Array<{
    id: string;
    date: string;
    intervalType: string; // 'annual' | 'semi-annual' | 'quarterly'
    revisionStatus: string; // 'excellent' | 'good' | 'needs_improvement'
    memorizationContinuance: 'yes' | 'no' | 'partial';
    participatingInCenter: boolean;
    newAchievements: string;
    comments: string;
    nextFollowUpDate: string;
  }>;

  // Assignments inside the center
  assignments: Array<{
    id: string;
    role: 'teaching' | 'supervision' | 'arbitration' | 'volunteering' | 'committees' | 'seasonal_programs';
    title: string;
    startDate: string;
    status: 'active' | 'completed';
    description: string;
  }>;

  attachments: GraduateAttachment[];
  isArchived: boolean;
}

export default function GraduatesManagement() {
  // Post-graduation status templates
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; color: string }>>([
    { id: 'reviewing', name: 'يواصل المراجعة والتمكين', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 'teacher', name: 'مدرس في الملتقى', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'supervisor', name: 'مشرف في الملتقى', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { id: 'volunteer', name: 'متطوع مساهم', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { id: 'external', name: 'يعمل/يدرس في جهة أخرى', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'disconnected', name: 'منقطع عن التواصل', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { id: 'unknown', name: 'غير معروف الحالة', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  ]);

  // Management Permissions State (for Section 15: General Manager Permissions)
  const [userRole, setUserRole] = useState<'gm' | 'supervisor' | 'teacher'>('gm');
  const [permissions, setPermissions] = useState({
    viewProfiles: true,
    editData: true,
    issueCertificates: true,
    archiveGraduate: true,
    reactivateGraduate: true,
    promoteToStaff: true
  });

  // Certificate template state (Section 8)
  const [certificateConfig, setCertificateConfig] = useState({
    title: 'شهادة تخرج وإتمام حفظ القرآن الكريم',
    subTitle: 'يشهد ملتقى الهدى القرآني بأن الخريج قد أتم بنجاح حفظ كتاب الله كاملاً تلاوةً وتجويداً',
    sealEnabled: true,
    signaturesEnabled: true,
    centerLogo: true,
    primaryColor: '#064e3b', // emerald-900
    sealText: 'ملتقى الهدى - الختم الرسمي للتميز',
    signee1: 'د. عبد الرحمن السعيد (المدير العام)',
    signee2: 'أ. خالد النفيسي (مدير الشؤون التعليمية)'
  });

  // New status input
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('bg-purple-100 text-purple-800 border-purple-200');

  // Interactive Student Integration simulation input (Section 13)
  const [integrationStudentId, setIntegrationStudentId] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState<string | null>(null);

  // Live State from API
  const [graduates, setGraduates] = useState<Graduate[]>([]);

  // Selected graduate for detail view
  const [selectedGraduateId, setSelectedGraduateId] = useState<string | null>(null);
  
  // Dashboard card filter state
  const [dashboardFilter, setDashboardFilter] = useState<string>('all');
  
  // Search & advanced filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchCircle, setSearchCircle] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchLevel, setSearchLevel] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Archive view toggle
  const [showArchiveOnly, setShowArchiveOnly] = useState(false);

  // New assignment modal / form state
  const [isAssigning, setIsAssigning] = useState(false);
  const [newAssignRole, setNewAssignRole] = useState<'teaching' | 'supervision' | 'arbitration' | 'volunteering' | 'committees' | 'seasonal_programs'>('teaching');
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');

  // New follow-up state
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [newFuType, setNewFuType] = useState('annual');
  const [newFuRevision, setNewFuRevision] = useState('excellent');
  const [newFuContinuance, setNewFuContinuance] = useState<'yes' | 'no' | 'partial'>('yes');
  const [newFuActive, setNewFuActive] = useState(true);
  const [newFuAch, setNewFuAch] = useState('');
  const [newFuComments, setNewFuComments] = useState('');

  // File Upload state (simulation)
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileType, setUploadFileType] = useState('pdf');
  const [uploadFileSize, setUploadFileSize] = useState('1.5 MB');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Print Template selection and Preview Modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<'card' | 'cert' | 'appreciation' | 'report' | 'stats'>('cert');
  const [printGraduate, setPrintGraduate] = useState<Graduate | null>(null);

  // Edit basic info modal / fields
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Calculations for KPI Dashboard (Sections 10, 12)
  const totalCount = graduates.length;
  const archivedCount = graduates.filter(g => g.isArchived).length;
  const activeCount = graduates.filter(g => !g.isArchived).length;
  
  // Stats
  const currentYearGraduates = graduates.filter(g => g.graduationDate.includes('1446') && !g.isArchived).length;
  const activeCommunicators = graduates.filter(g => !g.isArchived && g.status !== 'disconnected' && g.status !== 'unknown').length;
  const becomeTeachers = graduates.filter(g => !g.isArchived && g.status === 'teacher').length;
  const becomeSupervisors = graduates.filter(g => !g.isArchived && g.status === 'supervisor').length;
  const inActivities = graduates.filter(g => !g.isArchived && g.assignments.length > 0).length;
  const disconnectedCount = graduates.filter(g => !g.isArchived && g.status === 'disconnected').length;

  // Sustainability Index calculation (Section 12)
  const statsRetentionRate = Math.round((graduates.filter(g => !g.isArchived && (g.status === 'reviewing' || g.status === 'teacher' || g.status === 'supervisor' || g.status === 'volunteer')).length / activeCount) * 100) || 0;
  const statsServiceRate = Math.round((graduates.filter(g => !g.isArchived && (g.status === 'teacher' || g.status === 'supervisor' || g.status === 'volunteer')).length / activeCount) * 100) || 0;
  const statsActivityParticipation = Math.round((graduates.filter(g => !g.isArchived && g.assignments.some(a => a.status === 'active' || a.status === 'completed')).length / activeCount) * 100) || 0;
  const statsStaffBecomeRate = Math.round((graduates.filter(g => !g.isArchived && (g.status === 'teacher' || g.status === 'supervisor')).length / activeCount) * 100) || 0;
  
  // Overall sustainability impact index
  const overallSustainabilityIndex = Math.round((statsRetentionRate + statsServiceRate + statsActivityParticipation + statsStaffBecomeRate) / 4) || 0;

  // Age distributions, Top Circles, Top Teachers
  const ageDistribution = {
    under18: graduates.filter(g => g.age < 18).length,
    age18to20: graduates.filter(g => g.age >= 18 && g.age <= 20).length,
    over20: graduates.filter(g => g.age > 20).length
  };

  const circleStats = graduates.reduce((acc, curr) => {
    acc[curr.circleGraduatedFrom] = (acc[curr.circleGraduatedFrom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const teacherStats = graduates.reduce((acc, curr) => {
    acc[curr.teacher] = (acc[curr.teacher] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCircle = Object.entries(circleStats).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'لا يوجد';
  const topTeacher = Object.entries(teacherStats).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'لا يوجد';

  // Integrations action (Section 13)
  const handleSimulateIntegration = () => {
    if (!integrationStudentId.trim()) {
      setIntegrationStatus('الرجاء إدخال رقم تعريفي صحيح للطالب');
      return;
    }
    // Check if already a graduate
    if (graduates.some(g => g.id === `GR-${integrationStudentId}` || g.id === integrationStudentId)) {
      setIntegrationStatus('خطأ: هذا الرقم التعريفي مسجل بالفعل كخريج في النظام.');
      return;
    }

    setIntegrationStatus('جاري التحقق من مسار الطالب وسجلاته في إدارة الطلاب...');
    
    setTimeout(() => {
      // Create a new graduate from integration data
      const newGrad: Graduate = {
        id: `GR-${integrationStudentId.replace(/\D/g, '') || '10293'}`,
        name: `خريج مستجد تم ترحيله تلقائياً`,
        birthDate: '15/06/1430',
        age: 17,
        phone: '0559998881',
        email: 'integrated.student@example.com',
        guardianName: 'أبو الطالب المترشح للتخرج',
        guardianPhone: '0509998881',
        graduationDate: '25/01/1448',
        circleGraduatedFrom: 'حلقة مصلحة السنوات الممتازة',
        teacher: 'الشيخ عبد الرحمن السعيد',
        studyDurationYears: 3,
        lastEducationalLevel: 'المستوى الخامس (ضبط الحفظ والأداء التراكمي)',
        lastCompletedPlan: 'خطة إتمام الحفظ السنوي',
        lastExamScore: 95,
        finalGrade: 'very_good',
        overallCompletionRate: 100,
        memorizedPartsCount: 30,
        certificatesCount: 1,
        awards: ['وسام تخرج الدفعة الحالية'],
        badges: ['خريج ترحيل تلقائي'],
        competitions: [],
        notableParticipations: [],
        history: [
          { date: '01/01/1445', event: 'التسجيل في الحلقات', description: 'تم البدء بمسار الطلاب وضبط التلاوة', category: 'registration' },
          { date: '25/01/1448', event: 'اعتماد التخرج التلقائي', description: 'تخرج الطالب وترحيله إلى وحدة إدارة الخريجين وإغلاق المسار التعليمي مع الاحتفاظ برقم التعريف', category: 'graduation' }
        ],
        status: 'reviewing',
        followUps: [],
        assignments: [],
        attachments: [],
        isArchived: false
      };

      setGraduates(prev => [newGrad, ...prev]);
      setIntegrationStatus(`تم الترحيل بنجاح! تم إغلاق ملف الطالب التعليمي ونقله لوحدة الخريجين بالرقم الثابت: ${newGrad.id}`);
    }, 1200);
  };

  // Add customized status (Section 4)
  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const cleanId = 'status_' + Date.now();
    setStatuses(prev => [...prev, {
      id: cleanId,
      name: newStatusName,
      color: newStatusColor
    }]);
    setNewStatusName('');
  };

  // File Upload processing with constraints (Section 14)
  const handleFileUploadSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadFileName.trim()) {
      setUploadError('الرجاء إدخال اسم للملف المراد رفعه');
      return;
    }

    if (uploadFileType === 'video') {
      setUploadError('عذراً، يمنع رفع ملفات الفيديو نهائياً تماشياً مع سياسة التخزين والاستضافة للملتقى!');
      return;
    }

    if (!selectedGraduateId) {
      setUploadError('الرجاء اختيار خريج أولاً لإرفاق المستند بملفه.');
      return;
    }

    // Add attachment to selected graduate
    setGraduates(prev => prev.map(g => {
      if (g.id === selectedGraduateId) {
        const newAtt: GraduateAttachment = {
          id: 'att-' + Date.now(),
          name: uploadFileName + (uploadFileType === 'pdf' ? '.pdf' : uploadFileType === 'doc' ? '.docx' : '.png'),
          type: uploadFileType,
          size: uploadFileSize,
          date: 'اليوم (مرفوع حديثاً)'
        };
        return {
          ...g,
          attachments: [newAtt, ...g.attachments]
        };
      }
      return g;
    }));

    setUploadFileName('');
    alert('تم رفع وإرفاق المستند بنجاح لملف الخريج!');
  };

  // Add Assignment (Section 6)
  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGraduateId || !newAssignTitle.trim()) return;

    setGraduates(prev => prev.map(g => {
      if (g.id === selectedGraduateId) {
        const newAssign = {
          id: 'as-' + Date.now(),
          role: newAssignRole,
          title: newAssignTitle,
          startDate: '01/01/1448',
          status: 'active' as const,
          description: newAssignDesc
        };
        return {
          ...g,
          assignments: [newAssign, ...g.assignments]
        };
      }
      return g;
    }));

    setIsAssigning(false);
    setNewAssignTitle('');
    setNewAssignDesc('');
    alert('تم تكليف الخريج بالمهمة المحددة بنجاح وإظهارها في ملفه الشخصي.');
  };

  // Add Follow Up (Section 5)
  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGraduateId) return;

    setGraduates(prev => prev.map(g => {
      if (g.id === selectedGraduateId) {
        const newFu = {
          id: 'fu-' + Date.now(),
          date: 'اليوم',
          intervalType: newFuType,
          revisionStatus: newFuRevision,
          memorizationContinuance: newFuContinuance,
          participatingInCenter: newFuActive,
          newAchievements: newFuAch || 'لا يوجد إنجازات جديدة مسجلة',
          comments: newFuComments || 'تمت المتابعة الدورية',
          nextFollowUpDate: 'بعد 6 أشهر من الآن'
        };
        return {
          ...g,
          followUps: [newFu, ...g.followUps]
        };
      }
      return g;
    }));

    setIsAddingFollowUp(false);
    setNewFuAch('');
    setNewFuComments('');
    alert('تم تسجيل المتابعة الدورية للخريج وحفظ المؤشرات الجديدة.');
  };

  // Edit Basic Info Action
  const handleSaveBasicInfo = () => {
    if (!selectedGraduateId) return;
    setGraduates(prev => prev.map(g => {
      if (g.id === selectedGraduateId) {
        return {
          ...g,
          name: editName,
          phone: editPhone,
          email: editEmail,
          guardianName: editGuardianName,
          guardianPhone: editGuardianPhone,
          status: editStatus
        };
      }
      return g;
    }));
    setIsEditingInfo(false);
    alert('تم تحديث البيانات الأساسية بنجاح.');
  };

  const startEditInfo = (grad: Graduate) => {
    setEditName(grad.name);
    setEditPhone(grad.phone);
    setEditEmail(grad.email);
    setEditGuardianName(grad.guardianName || '');
    setEditGuardianPhone(grad.guardianPhone || '');
    setEditStatus(grad.status);
    setIsEditingInfo(true);
  };

  // Archive / Reactivate
  const toggleArchiveStatus = (gradId: string) => {
    if (!permissions.archiveGraduate && graduates.find(g => g.id === gradId)?.isArchived === false) {
      alert('عذراً، لا تملك الصلاحية لأرشفة الخريجين!');
      return;
    }
    if (!permissions.reactivateGraduate && graduates.find(g => g.id === gradId)?.isArchived === true) {
      alert('عذراً، لا تملك الصلاحية لإعادة تفعيل الخريجين!');
      return;
    }

    setGraduates(prev => prev.map(g => {
      if (g.id === gradId) {
        const targetState = !g.isArchived;
        return { ...g, isArchived: targetState };
      }
      return g;
    }));
    alert('تم تعديل حالة الأرشفة للخريج بنجاح.');
  };

  // Filter and Sort core logic
  const filteredGraduates = graduates.filter(grad => {
    // Dashboard quick filter
    if (dashboardFilter === 'this_year' && !grad.graduationDate.includes('1446')) return false;
    if (dashboardFilter === 'active' && (grad.status === 'disconnected' || grad.status === 'unknown')) return false;
    if (dashboardFilter === 'teachers' && grad.status !== 'teacher') return false;
    if (dashboardFilter === 'supervisors' && grad.status !== 'supervisor') return false;
    if (dashboardFilter === 'active_tasks' && grad.assignments.length === 0) return false;
    if (dashboardFilter === 'disconnected' && grad.status !== 'disconnected') return false;

    // Archive filter
    if (showArchiveOnly) {
      if (!grad.isArchived) return false;
    } else {
      if (grad.isArchived) return false;
    }

    // Search inputs
    const matchesName = grad.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesId = grad.id.toLowerCase().includes(searchId.toLowerCase());
    const matchesYear = searchYear ? grad.graduationDate.includes(searchYear) : true;
    const matchesCircle = searchCircle ? grad.circleGraduatedFrom.includes(searchCircle) : true;
    const matchesTeacher = searchTeacher ? grad.teacher.includes(searchTeacher) : true;
    const matchesLevel = searchLevel ? grad.lastEducationalLevel.includes(searchLevel) : true;
    const matchesStatus = searchStatus ? grad.status === searchStatus : true;

    return matchesName && matchesId && matchesYear && matchesCircle && matchesTeacher && matchesLevel && matchesStatus;
  }).sort((a, b) => {
    let fieldA = a[sortBy as keyof Graduate];
    let fieldB = b[sortBy as keyof Graduate];

    if (typeof fieldA === 'string') {
      return sortOrder === 'asc' 
        ? (fieldA as string).localeCompare(fieldB as string)
        : (fieldB as string).localeCompare(fieldA as string);
    }
    if (typeof fieldA === 'number') {
      return sortOrder === 'asc'
        ? (fieldA as number) - (fieldB as number)
        : (fieldB as number) - (fieldA as number);
    }
    return 0;
  });

  const selectedGraduate = graduates.find(g => g.id === selectedGraduateId);

  // Trigger print view (Section 16)
  const openPrintPreview = (template: 'card' | 'cert' | 'appreciation' | 'report' | 'stats', grad?: Graduate) => {
    setPrintTemplate(template);
    setPrintGraduate(grad || selectedGraduate || graduates[0]);
    setPrintModalOpen(true);
  };

  // Helper translations/labels
  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'ممتاز مرتفع';
      case 'very_good': return 'جيد جداً';
      case 'good': return 'جيد';
      default: return 'مقبول';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teaching': return 'التدريس وتحفيظ كتاب الله';
      case 'supervision': return 'الإشراف على الحلقات والمتابعة';
      case 'arbitration': return 'تحكيم المسابقات والاختبارات';
      case 'volunteering': return 'تطوع مساهم باللجان';
      case 'committees': return 'اللجان الإدارية والتنظيمية';
      case 'seasonal_programs': return 'البرامج الموسمية الرمضانية';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="graduates-management-system">
      
      {/* Header and Brand */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-7 w-7 text-amber-400" />
            <h2 className="text-xl md:text-2xl font-bold font-display">إدارة الخريجين والتكامل المستدام</h2>
          </div>
          <p className="text-emerald-100 text-xs md:text-sm">
            المنصة التنفيذية الشاملة لمتابعة مخرجات الملتقى، وقياس أثر الاستدامة والتكليفات التعليمية.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => openPrintPreview('stats')}
            className="bg-amber-400 hover:bg-amber-500 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            طباعة تقرير الإحصائيات العام
          </button>
          
          <button
            onClick={() => {
              setDashboardFilter('all');
              setSelectedGraduateId(null);
            }}
            className="bg-emerald-700/50 hover:bg-emerald-700/80 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            إعادة تعيين الواجهة
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS (Section 1 & 12) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="graduates-kpi-cards">
        
        {/* Card 1: Total Graduates */}
        <div 
          onClick={() => { setDashboardFilter('all'); setSelectedGraduateId(null); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            dashboardFilter === 'all' 
              ? 'bg-emerald-900 border-emerald-900 text-white shadow-md scale-[1.02]' 
              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${dashboardFilter === 'all' ? 'text-emerald-200' : 'text-slate-400'}`}>
              إجمالي الخريجين الحافظين
            </span>
            <GraduationCap className={`h-5 w-5 ${dashboardFilter === 'all' ? 'text-amber-400' : 'text-emerald-700'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">{activeCount}</div>
          <div className={`text-[10px] mt-1 ${dashboardFilter === 'all' ? 'text-emerald-200' : 'text-slate-500'}`}>
            {archivedCount} في السجلات المؤرشفة
          </div>
        </div>

        {/* Card 2: This Year Graduates */}
        <div 
          onClick={() => { setDashboardFilter('this_year'); setSelectedGraduateId(null); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            dashboardFilter === 'this_year' 
              ? 'bg-emerald-900 border-emerald-900 text-white shadow-md scale-[1.02]' 
              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${dashboardFilter === 'this_year' ? 'text-emerald-200' : 'text-slate-400'}`}>
              خريجو العام الحالي (1446هـ)
            </span>
            <Calendar className={`h-5 w-5 ${dashboardFilter === 'this_year' ? 'text-amber-400' : 'text-indigo-700'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">{currentYearGraduates}</div>
          <div className={`text-[10px] mt-1 ${dashboardFilter === 'this_year' ? 'text-emerald-200' : 'text-slate-500'}`}>
            خريجون متميزون بنسبة 100%
          </div>
        </div>

        {/* Card 3: Active with Center */}
        <div 
          onClick={() => { setDashboardFilter('active'); setSelectedGraduateId(null); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            dashboardFilter === 'active' 
              ? 'bg-emerald-900 border-emerald-900 text-white shadow-md scale-[1.02]' 
              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${dashboardFilter === 'active' ? 'text-emerald-200' : 'text-slate-400'}`}>
              النشطون والمتواصلون
            </span>
            <Activity className={`h-5 w-5 ${dashboardFilter === 'active' ? 'text-amber-400' : 'text-teal-700'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">{activeCommunicators}</div>
          <div className={`text-[10px] mt-1 ${dashboardFilter === 'active' ? 'text-emerald-200' : 'text-emerald-700'}`}>
            معدل استمرار العلاقة: {statsRetentionRate}%
          </div>
        </div>

        {/* Card 4: Become Staff */}
        <div 
          onClick={() => { setDashboardFilter('teachers'); setSelectedGraduateId(null); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            dashboardFilter === 'teachers' 
              ? 'bg-emerald-900 border-emerald-900 text-white shadow-md scale-[1.02]' 
              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${dashboardFilter === 'teachers' ? 'text-emerald-200' : 'text-slate-400'}`}>
              الخريجون ككادر تعليمي
            </span>
            <UserCheck className={`h-5 w-5 ${dashboardFilter === 'teachers' ? 'text-amber-400' : 'text-sky-700'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">{becomeTeachers}</div>
          <div className={`text-[10px] mt-1 ${dashboardFilter === 'teachers' ? 'text-emerald-200' : 'text-slate-500'}`}>
            {becomeSupervisors} مشرفون معتمدون
          </div>
        </div>

      </div>

      {/* QUICK ACCESSIBLE FILTERS FOR SECTION 1 */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-xl">
        <button
          onClick={() => { setDashboardFilter('all'); setSelectedGraduateId(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dashboardFilter === 'all' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-600 hover:text-slate-900'}`}
        >
          الكل ({activeCount})
        </button>
        <button
          onClick={() => { setDashboardFilter('teachers'); setSelectedGraduateId(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dashboardFilter === 'teachers' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-600 hover:text-slate-900'}`}
        >
          أصبحوا معلمين ({becomeTeachers})
        </button>
        <button
          onClick={() => { setDashboardFilter('supervisors'); setSelectedGraduateId(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dashboardFilter === 'supervisors' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-600 hover:text-slate-900'}`}
        >
          أصبحوا مشرفين ({becomeSupervisors})
        </button>
        <button
          onClick={() => { setDashboardFilter('active_tasks'); setSelectedGraduateId(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dashboardFilter === 'active_tasks' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-600 hover:text-slate-900'}`}
        >
          المشاركون بالتكليفات ({inActivities})
        </button>
        <button
          onClick={() => { setDashboardFilter('disconnected'); setSelectedGraduateId(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dashboardFilter === 'disconnected' ? 'bg-white shadow-xs text-rose-800' : 'text-rose-600 hover:text-rose-900'}`}
        >
          المنقطعون ({disconnectedCount})
        </button>
      </div>

      {/* THREE COLUMN GRID: MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 & 2: LIST AND DETAILED DATA (Left / Center) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 2: Advanced Search, Filter and Table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" />
                سجل وقائمة الخريجين المتقدمة
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1 text-xs"
                >
                  <Filter className="h-4 w-4" />
                  {isFiltersExpanded ? 'إخفاء التصفية' : 'تصفية متقدمة'}
                </button>
                <button
                  onClick={() => openPrintPreview('report')}
                  className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-1 text-xs font-medium"
                >
                  <Printer className="h-4 w-4" />
                  طباعة الكشف
                </button>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو السجل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Expanded Advanced Filters */}
            <AnimatePresence>
              {isFiltersExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الرقم التعريفي</label>
                      <input
                        type="text"
                        placeholder="GR-XXXX"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">سنة التخرج</label>
                      <input
                        type="text"
                        placeholder="مثال: 1446"
                        value={searchYear}
                        onChange={(e) => setSearchYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الحلقة التي تخرج منها</label>
                      <input
                        type="text"
                        placeholder="ابحث بالحلقة..."
                        value={searchCircle}
                        onChange={(e) => setSearchCircle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المعلم المشرف</label>
                      <input
                        type="text"
                        placeholder="اسم المعلم..."
                        value={searchTeacher}
                        onChange={(e) => setSearchTeacher(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المستوى العلمي</label>
                      <input
                        type="text"
                        placeholder="مثال: المستوى الخامس"
                        value={searchLevel}
                        onChange={(e) => setSearchLevel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة بعد التخرج</label>
                      <select
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      >
                        <option value="">كل الحالات</option>
                        {statuses.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sorting Toggles */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              <span className="font-medium">ترتيب الخريجين حسب:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                  className={`px-2 py-1 rounded-md font-semibold ${sortBy === 'name' ? 'bg-white shadow-xs text-emerald-900' : ''}`}
                >
                  الاسم {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
                <button
                  onClick={() => { setSortBy('graduationDate'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                  className={`px-2 py-1 rounded-md font-semibold ${sortBy === 'graduationDate' ? 'bg-white shadow-xs text-emerald-900' : ''}`}
                >
                  تاريخ التخرج {sortBy === 'graduationDate' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
                <button
                  onClick={() => { setSortBy('lastExamScore'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                  className={`px-2 py-1 rounded-md font-semibold ${sortBy === 'lastExamScore' ? 'bg-white shadow-xs text-emerald-900' : ''}`}
                >
                  المعدل الختامي {sortBy === 'lastExamScore' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </div>
            </div>

            {/* Table / List Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-100">
                    <th className="p-3 font-bold">الخريج (الرمز والمعلومات)</th>
                    <th className="p-3 font-bold">تاريخ وتفاصيل التخرج</th>
                    <th className="p-3 font-bold">المستوى / الحلقة</th>
                    <th className="p-3 font-bold">الحالة الحالية</th>
                    <th className="p-3 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGraduates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        لا يوجد خريجون يطابقون خيارات البحث المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredGraduates.map(grad => {
                      const currentStatusConfig = statuses.find(s => s.id === grad.status) || { name: grad.status, color: 'bg-slate-100 text-slate-800' };
                      return (
                        <tr 
                          key={grad.id} 
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedGraduateId === grad.id ? 'bg-emerald-50/50' : ''}`}
                          onClick={() => setSelectedGraduateId(grad.id)}
                        >
                          <td className="p-3">
                            <div className="font-bold text-slate-800 text-sm">{grad.name}</div>
                            <div className="text-slate-400 text-[10px] font-mono mt-0.5">{grad.id} • {grad.age} عاماً</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{grad.graduationDate}</div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">درجة الاختبار: {grad.lastExamScore}% ({getGradeLabel(grad.finalGrade)})</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-700 truncate max-w-[150px]">{grad.circleGraduatedFrom}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">المعلم: {grad.teacher}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${currentStatusConfig.color}`}>
                              {currentStatusConfig.name}
                            </span>
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedGraduateId(grad.id)}
                                className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                                title="عرض الملف الكامل"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditInfo(grad)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-slate-100 rounded"
                                title="تعديل البيانات الأساسية"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleArchiveStatus(grad.id)}
                                className={`p-1 rounded ${grad.isArchived ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                title={grad.isArchived ? 'إلغاء الأرشفة والتفعيل' : 'أرشفة الخريج'}
                              >
                                {grad.isArchived ? <RotateCcw className="h-4 w-4" /> : <Trash className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Archive Toggle View (Section 9) */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <button
                onClick={() => setShowArchiveOnly(!showArchiveOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showArchiveOnly 
                    ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                {showArchiveOnly ? 'عرض الخريجين النشطين' : 'عرض أرشيف الخريجين السابقين'}
              </button>
              <span className="text-slate-400 font-mono text-[10px]">
                مجموع السجلات الحالية: {graduates.length}
              </span>
            </div>
          </div>

          {/* Section 7 & 11: Charts and Analytics Network */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-700" />
              شبكة الخريجين ومؤشرات الاستدامة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Distribution by Years */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-500">الخريجون حسب دفعات السنوات</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">العام 1446هـ (الدفعة الذهبية)</span>
                    <span className="font-bold text-slate-800">2 خريجين</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '66%' }}></div>
                  </div>
                  
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">العام 1445هـ</span>
                    <span className="font-bold text-slate-800">1 خريج</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '33%' }}></div>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">الأعوام السابقة</span>
                    <span className="font-bold text-slate-800">2 خريجين</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '66%' }}></div>
                  </div>
                </div>
              </div>

              {/* Age Distributions */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-500">توزيع الخريجين حسب الفئات العمرية</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 bg-white rounded-lg">
                    <div className="text-xs text-slate-400">دون 18</div>
                    <div className="text-sm font-bold text-slate-800">{ageDistribution.under18}</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <div className="text-xs text-slate-400">18-20 سنة</div>
                    <div className="text-sm font-bold text-slate-800">{ageDistribution.age18to20}</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <div className="text-xs text-slate-400">فوق 20</div>
                    <div className="text-sm font-bold text-slate-800">{ageDistribution.over20}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  متوسط عمر التخرج: 18.6 عاماً
                </div>
              </div>

              {/* Key Analytical insights (Section 10) */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 block">إحصاءات المخرجات والمساهمة</span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">أكثر حلقة تخرجاً:</span>
                    <span className="font-bold text-slate-800">{topCircle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">أكثر معلم تخريجاً:</span>
                    <span className="font-bold text-slate-800">{topTeacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نسبة الانخراط الإيجابي:</span>
                    <span className="font-bold text-emerald-800">{overallSustainabilityIndex}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">متوسط سنوات الدراسة:</span>
                    <span className="font-bold text-slate-800">4.6 سنوات</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Section 12: Detailed Sustainability Index */}
            <div className="border-t border-slate-100 pt-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-800">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-emerald-950">مؤشر أثر واستدامة الخريجين (Graduates Sustainability Index)</h4>
                    <p className="text-[10px] md:text-xs text-emerald-800">يقيس الأثر التراكمي لخدمة الملتقى والتواصل الفعال بعد التخرج والمساهمة الحقيقية بالمؤسسة.</p>
                  </div>
                </div>
                <div className="text-center bg-white border border-emerald-200 px-4 py-2 rounded-xl shrink-0">
                  <div className="text-xs text-slate-400">مؤشر الاستدامة</div>
                  <div className="text-2xl font-black font-mono text-emerald-700">{overallSustainabilityIndex}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 13: Simulated Integration & Transition Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-indigo-700" />
              تكامل وتخريج الطلاب (بوابة الانتقال الآلي)
            </h3>
            <p className="text-xs text-slate-500">
              عند اعتماد تخرج الطالب من مسار شؤون الطلاب، ينقل آلياً لملف الخريجين مع قفل مساره التعليمي الفعال، والاحتفاظ بكامل درجات اختباراته وأوسمته وسجله التاريخي برقم تعريف موحد.
            </p>
            
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">الرقم التعريفي للطالب المتخرج</label>
                  <input
                    type="text"
                    placeholder="مثال: ST-000001 أو رقم تعريفي حر"
                    value={integrationStudentId}
                    onChange={(e) => setIntegrationStudentId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  onClick={handleSimulateIntegration}
                  className="bg-indigo-900 hover:bg-indigo-950 text-white px-4 py-1.5 rounded-lg text-xs font-semibold self-end transition-colors"
                >
                  محاكاة اعتماد التخرج والترحيل التلقائي
                </button>
              </div>

              {integrationStatus && (
                <div className="bg-white border border-indigo-200 p-2.5 rounded-lg text-xs font-medium text-indigo-950 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                  {integrationStatus}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 8: CERTIFICATES & STAMP TEMPLATE EDITOR */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                مركز إدارة وتخصيص الشهادات وقوالب الطباعة
              </h3>
              <button
                onClick={() => openPrintPreview('cert')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                معاينة الشهادة الحالية
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              يمكنك تخصيص ترويسة الشهادة، كتابة العبارات التقديرية، تفعيل الأختام الرسمية وتوقيعات مجلس الإدارة العام قبل إصدار الشهادات للطلاب.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">عنوان الشهادة الرئيسي</label>
                  <input
                    type="text"
                    value={certificateConfig.title}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">نص ومضمون الشهادة العام</label>
                  <textarea
                    value={certificateConfig.subTitle}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, subTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs h-16 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">نص الختم الدائري</label>
                  <input
                    type="text"
                    value={certificateConfig.sealText}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, sealText: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-3 rounded-xl text-xs space-y-2.5">
                <div className="font-bold text-slate-700 mb-1">خيارات التفعيل والقوالب:</div>
                
                <div className="flex items-center justify-between">
                  <span>تفعيل الختم الذهبي المعتمد</span>
                  <input
                    type="checkbox"
                    checked={certificateConfig.sealEnabled}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, sealEnabled: e.target.checked }))}
                    className="rounded text-emerald-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>إظهار شعار ملتقى الهدى</span>
                  <input
                    type="checkbox"
                    checked={certificateConfig.centerLogo}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, centerLogo: e.target.checked }))}
                    className="rounded text-emerald-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>تضمين توقيعات مجلس الإدارة</span>
                  <input
                    type="checkbox"
                    checked={certificateConfig.signaturesEnabled}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, signaturesEnabled: e.target.checked }))}
                    className="rounded text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">توقيع المصدق الأول</label>
                  <input
                    type="text"
                    value={certificateConfig.signee1}
                    onChange={(e) => setCertificateConfig(prev => ({ ...prev, signee1: e.target.value }))}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: PROFILE DETAIL VIEW & ACTIONS (Right Side) */}
        <div className="space-y-6">
          
          {/* Section 3 & 4 & 5 & 6: Active Selected Graduate Details */}
          {selectedGraduate ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5 space-y-5">
              
              {/* Cover & Avatar Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-800 to-emerald-600 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold font-display shadow-xs mb-3">
                  {selectedGraduate.name[0]}
                </div>
                <h3 className="font-bold text-base text-slate-900">{selectedGraduate.name}</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                  {selectedGraduate.id}
                </span>

                {/* Edit & Printable Document Buttons */}
                <div className="flex justify-center gap-1.5 mt-3">
                  <button
                    onClick={() => startEditInfo(selectedGraduate)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    تعديل الملف
                  </button>
                  <button
                    onClick={() => openPrintPreview('card', selectedGraduate)}
                    className="bg-amber-400 hover:bg-amber-500 text-emerald-950 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                  >
                    <Printer className="h-3 w-3" />
                    بطاقة الخريج
                  </button>
                  <button
                    onClick={() => openPrintPreview('cert', selectedGraduate)}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Award className="h-3 w-3" />
                    إصدار شهادة
                  </button>
                </div>
              </div>

              {/* Status Indicator & Assignment Quick Controls */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">حالة الخريج بعد التخرج:</span>
                  <span className="font-semibold text-emerald-800">
                    {(statuses.find(s => s.id === selectedGraduate.status))?.name || selectedGraduate.status}
                  </span>
                </div>
                
                {/* Section 6: Quick assigning to roles */}
                <div className="pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="w-full bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-900 font-bold py-1 px-2 rounded-lg text-[11px] text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    تكليف بمهام (تعليم/إشراف/تطوع)
                  </button>
                </div>

                {isAssigning && (
                  <form onSubmit={handleAddAssignment} className="bg-white p-2.5 border border-slate-200 rounded-lg space-y-2 mt-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">نوع التكليف المباشر</label>
                      <select
                        value={newAssignRole}
                        onChange={(e) => setNewAssignRole(e.target.value as any)}
                        className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                      >
                        <option value="teaching">التدريس وتحفيظ الطلاب</option>
                        <option value="supervision">الإشراف الإداري</option>
                        <option value="arbitration">التحكيم بالاختبارات</option>
                        <option value="volunteering">تطوع ولجان مساندة</option>
                        <option value="committees">برامج موسمية ولجان فرعية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">مسمى التكليف</label>
                      <input
                        type="text"
                        placeholder="مثال: معلم حلقة الفتح"
                        value={newAssignTitle}
                        onChange={(e) => setNewAssignTitle(e.target.value)}
                        className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">وصف موجز للمهام</label>
                      <textarea
                        placeholder="اختياري..."
                        value={newAssignDesc}
                        onChange={(e) => setNewAssignDesc(e.target.value)}
                        className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] h-10 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAssigning(false)}
                        className="text-[10px] text-slate-500 hover:underline px-2"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-850 hover:bg-emerald-900 text-white text-[10px] px-2.5 py-1 rounded font-bold"
                      >
                        إسناد التكليف
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Data Category 1: Basic Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">البيانات الأساسية</h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="bg-slate-50/50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">تاريخ الميلاد والسن</span>
                    <span className="font-semibold text-slate-800">{selectedGraduate.birthDate} ({selectedGraduate.age} سنة)</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">بيانات التواصل المباشر</span>
                    <span className="font-semibold text-slate-800">{selectedGraduate.phone}</span>
                  </div>
                  {selectedGraduate.guardianName && (
                    <div className="bg-slate-50/50 p-2 rounded-lg col-span-2">
                      <span className="text-[10px] text-slate-400 block">بيانات ولي الأمر (اختياري)</span>
                      <span className="font-semibold text-slate-800">{selectedGraduate.guardianName} ({selectedGraduate.guardianPhone})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Category 2: Graduation Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">تفاصيل وبيانات التخرج</h4>
                <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">تاريخ التخرج الفعلي:</span>
                    <span className="font-bold text-slate-800">{selectedGraduate.graduationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الحلقة المتخرج منها:</span>
                    <span className="font-semibold text-slate-800">{selectedGraduate.circleGraduatedFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">معلم التخرج المباشر:</span>
                    <span className="font-semibold text-slate-800">{selectedGraduate.teacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مدة الدراسة بالملتقى:</span>
                    <span className="font-semibold text-slate-800">{selectedGraduate.studyDurationYears} سنوات متتالية</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">آخر اختبار ومستوى علمي:</span>
                    <span className="font-semibold text-indigo-950">{selectedGraduate.lastEducationalLevel}</span>
                  </div>
                </div>
              </div>

              {/* Data Category 3: Achievements (Awards, Badges) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">الأوسمة والجوائز المسجلة</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGraduate.awards.map((aw, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-[10px] font-bold">
                      🏆 {aw}
                    </span>
                  ))}
                  {selectedGraduate.badges.map((bd, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-[10px] font-semibold">
                      🎗️ {bd}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Category 4: Assignments Display */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">المهام والتكليفات النشطة</h4>
                <div className="space-y-1.5">
                  {selectedGraduate.assignments.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">لا يوجد تكليفات نشطة مع الملتقى حالياً.</p>
                  ) : (
                    selectedGraduate.assignments.map(as => (
                      <div key={as.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-800">{as.title}</span>
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded">
                            {getRoleLabel(as.role)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{as.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Data Category 5: Follow-Up & Review Log (Section 5) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">سجل المتابعة الدورية</h4>
                  <button
                    onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
                    className="text-[10px] text-emerald-800 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    تسجيل متابعة
                  </button>
                </div>

                {isAddingFollowUp && (
                  <form onSubmit={handleAddFollowUp} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold">جدولة المتابعة</label>
                      <select value={newFuType} onChange={(e) => setNewFuType(e.target.value)} className="w-full p-1 bg-white border border-slate-200 rounded">
                        <option value="quarterly">دورية ربع سنوية</option>
                        <option value="semi-annual">دورية نصف سنوية</option>
                        <option value="annual">دورية سنوية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold">حالة المراجعة والتلاوة</label>
                      <select value={newFuRevision} onChange={(e) => setNewFuRevision(e.target.value)} className="w-full p-1 bg-white border border-slate-200 rounded">
                        <option value="excellent">ممتازة (متمكن)</option>
                        <option value="good">جيدة (يحتاج مراجعة طفيفة)</option>
                        <option value="needs_improvement">يحتاج تدريب وتسميع مكثف</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>هل مستمر بالحفظ الإضافي؟</span>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setNewFuContinuance('yes')} className={`px-2 py-0.5 text-[10px] rounded ${newFuContinuance === 'yes' ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-700'}`}>نعم</button>
                        <button type="button" onClick={() => setNewFuContinuance('no')} className={`px-2 py-0.5 text-[10px] rounded ${newFuContinuance === 'no' ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-700'}`}>لا</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold">الإنجازات والشهادات الجديدة</label>
                      <input type="text" placeholder="مثال: حفظ متن جديد أو سند" value={newFuAch} onChange={(e) => setNewFuAch(e.target.value)} className="w-full p-1 bg-white border border-slate-200 rounded text-[10px]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold">ملاحظات الزيارة/المكالمة</label>
                      <input type="text" placeholder="ملاحظات..." value={newFuComments} onChange={(e) => setNewFuComments(e.target.value)} className="w-full p-1 bg-white border border-slate-200 rounded text-[10px]" />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button type="button" onClick={() => setIsAddingFollowUp(false)} className="text-[10px] text-slate-500">إلغاء</button>
                      <button type="submit" className="bg-emerald-900 text-white text-[10px] px-2.5 py-1 rounded font-bold">حفظ</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {selectedGraduate.followUps.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">لا يوجد متابعات دورية مسجلة بعد التخرج.</p>
                  ) : (
                    selectedGraduate.followUps.map(fu => (
                      <div key={fu.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>تاريخ المتابعة: {fu.date}</span>
                          <span className="text-emerald-800">
                            {fu.intervalType === 'semi-annual' ? 'نصف سنوي' : fu.intervalType === 'annual' ? 'سنوي' : 'ربع سنوي'}
                          </span>
                        </div>
                        <div className="text-[10px] space-y-0.5 text-slate-600">
                          <div>المراجعة: <span className="font-semibold">{fu.revisionStatus === 'excellent' ? 'ممتازة وضبط دقيق' : 'متوسطة'}</span></div>
                          {fu.newAchievements && <div>المكتسبات الجديدة: <span className="font-semibold">{fu.newAchievements}</span></div>}
                          {fu.comments && <div className="italic text-slate-500">"{fu.comments}"</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Data Category 6: Documents & Attachments (Section 14) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">الوثائق والمستندات الملحقة</h4>
                
                {/* Simulated file upload form with constraints */}
                <form onSubmit={handleFileUploadSimulated} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold">اسم المستند</label>
                      <input
                        type="text"
                        placeholder="مثال: الإجازة المسندة"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold">نوع الملف</label>
                      <select
                        value={uploadFileType}
                        onChange={(e) => setUploadFileType(e.target.value)}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-[10px]"
                      >
                        <option value="pdf">ملف PDF</option>
                        <option value="doc">مستند Word</option>
                        <option value="image">صورة إثبات</option>
                        <option value="video">ملف فيديو (ممنوع)</option>
                      </select>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="text-[9px] text-rose-800 bg-rose-50 p-1.5 rounded font-medium">
                      ⚠️ {uploadError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-1 px-2 rounded transition-all"
                  >
                    اعتماد وإضافة المستند للفايل
                  </button>
                </form>

                {/* List attachments */}
                <div className="space-y-1.5 pt-1">
                  {selectedGraduate.attachments.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">لا يوجد مستندات مرفوعة لهذا الخريج.</p>
                  ) : (
                    selectedGraduate.attachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-emerald-800" />
                          <div className="max-w-[120px] truncate">
                            <span className="font-semibold block text-slate-800">{att.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{att.size} • {att.date}</span>
                          </div>
                        </div>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert('تحميل الملف التخيلي بنجاح!'); }}
                          className="text-emerald-800 hover:underline text-[10px] font-bold shrink-0"
                        >
                          تحميل
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 15: Role transition (Promoting to supervisor or teacher) */}
              {permissions.promoteToStaff && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-amber-900 block">إجراءات تعيين ككادر وظيفي (صلاحيات المدير العام)</span>
                  <p className="text-[10px] text-amber-800">يمكنك نقل الخريج مباشرة ليصبح معلماً أو مشرفاً في لوحة التحكم للحلقات.</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setGraduates(prev => prev.map(g => g.id === selectedGraduate.id ? { ...g, status: 'teacher' } : g));
                        alert('تم تعيين الخريج معلماً رسمياً في كادر الملتقى بنجاح!');
                      }}
                      className="bg-white hover:bg-amber-100 text-amber-950 font-bold py-1 px-2.5 rounded border border-amber-300 text-[10px]"
                    >
                      تعيين كمعلم رسمي
                    </button>
                    <button
                      onClick={() => {
                        setGraduates(prev => prev.map(g => g.id === selectedGraduate.id ? { ...g, status: 'supervisor' } : g));
                        alert('تم ترقية الخريج ليصبح مشرف حلقات معتمد في كادر الملتقى!');
                      }}
                      className="bg-white hover:bg-amber-100 text-amber-950 font-bold py-1 px-2.5 rounded border border-amber-300 text-[10px]"
                    >
                      تعيين كمشرف معتمد
                    </button>
                  </div>
                </div>
              )}

              {/* Data Category 7: Chronological Journey Logs (Section 3.4) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 border-r-2 border-emerald-700 pr-2">السجل والمسار التاريخي للخريج</h4>
                <div className="relative border-r border-slate-200 mr-2 pr-4 space-y-3 pt-2">
                  {selectedGraduate.history.map((hist, idx) => (
                    <div key={idx} className="relative text-xs text-slate-600">
                      <div className="absolute right-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border border-white"></div>
                      <span className="text-[9px] text-slate-400 font-mono block">{hist.date}</span>
                      <span className="font-bold text-slate-800 block text-[11px]">{hist.event}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{hist.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
              <GraduationCap className="h-10 w-10 mx-auto text-slate-400 mb-2.5" />
              <p className="font-bold text-xs">الرجاء اختيار خريج من القائمة الجانبية لعرض وتعديل ملفه الشخصي ومتابعته وسجله التاريخي.</p>
            </div>
          )}

          {/* SECTION 15: General Manager Permissions Configuration widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-800" />
              مصفوفة صلاحيات وحدة الخريجين (المدير العام)
            </h3>
            
            <div className="bg-slate-50 p-3 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span>تعديل وحفظ ملفات الخريجين الأساسية</span>
                <input
                  type="checkbox"
                  checked={permissions.editData}
                  onChange={(e) => setPermissions(prev => ({ ...prev, editData: e.target.checked }))}
                  className="rounded text-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>صلاحية طباعة وإصدار الشهادات الرسمية</span>
                <input
                  type="checkbox"
                  checked={permissions.issueCertificates}
                  onChange={(e) => setPermissions(prev => ({ ...prev, issueCertificates: e.target.checked }))}
                  className="rounded text-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>أرشفة الخريجين القدامى والمنقطعين</span>
                <input
                  type="checkbox"
                  checked={permissions.archiveGraduate}
                  onChange={(e) => setPermissions(prev => ({ ...prev, archiveGraduate: e.target.checked }))}
                  className="rounded text-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>تحويل وتكليف الخريج كمعلم أو مشرف بحلقات المصلحة</span>
                <input
                  type="checkbox"
                  checked={permissions.promoteToStaff}
                  onChange={(e) => setPermissions(prev => ({ ...prev, promoteToStaff: e.target.checked }))}
                  className="rounded text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Custom post-graduation status creator (Section 4) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1">
              <Settings className="h-4 w-4 text-emerald-800" />
              تخصيص وإضافة حالات الخريجين الإدارية
            </h3>
            <p className="text-[10px] text-slate-500">يمكنك هنا إضافة مسميات جديدة لحالة الخريج لتظهر في قائمة التعديل والتصفية.</p>
            
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="مسمى الحالة الجديدة (مثال: منتدب)"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
                <button
                  onClick={handleAddStatus}
                  className="bg-emerald-900 hover:bg-emerald-950 text-white px-3 py-1 text-xs font-semibold rounded"
                >
                  إضافة الحالة
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {statuses.map(s => (
                  <span key={s.id} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${s.color}`}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3 & 16: EDIT BASIC DETAILS MODAL */}
      <AnimatePresence>
        {isEditingInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">تعديل ملف الخريج الأساسي</h3>
                <button 
                  onClick={() => setIsEditingInfo(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">الاسم الكامل للخريج</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">رقم التواصل الفعال</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">اسم ولي الأمر</label>
                    <input
                      type="text"
                      value={editGuardianName}
                      onChange={(e) => setEditGuardianName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">رقم ولي الأمر</label>
                    <input
                      type="text"
                      value={editGuardianPhone}
                      onChange={(e) => setEditGuardianPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">الحالة الإدارية الحالية</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setIsEditingInfo(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveBasicInfo}
                  className="bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  حفظ التعديلات والبيانات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 16: PROFESSIONAL PRINT PREVIEW MODAL */}
      <AnimatePresence>
        {printModalOpen && printGraduate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative"
            >
              
              {/* Controls bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-emerald-800" />
                  <span className="font-bold text-sm text-slate-800">صندوق الطباعة وتصدير الشهادات الاحترافية</span>
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={printTemplate} 
                    onChange={(e) => setPrintTemplate(e.target.value as any)}
                    className="px-2.5 py-1 border border-slate-200 bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    <option value="cert">شهادة التخرج وإتمام الحفظ</option>
                    <option value="card">بطاقة تخرج الخريج الرسمية</option>
                    <option value="appreciation">شهادة تقدير وتفوق</option>
                    <option value="report">التقرير الكامل عن الخريج</option>
                    <option value="stats">كشف إحصائي وتحليلي لدفعة الخريجين</option>
                  </select>
                  
                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    تأكيد الطباعة / تصدير PDF
                  </button>
                  
                  <button 
                    onClick={() => setPrintModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
              </div>

              {/* Template Printable View Content */}
              <div className="border-4 border-double border-emerald-900 p-8 rounded-xl bg-amber-50/20 text-center relative overflow-hidden shadow-xs" id="printable-template">
                
                {/* Background Watermark/Aesthetics */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
                  <GraduationCap className="h-96 w-96 text-emerald-900" />
                </div>

                {/* LOGO AND HEADINGS */}
                {certificateConfig.centerLogo && (
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-emerald-900 text-amber-300 mx-auto rounded-full flex items-center justify-center font-bold text-sm border-2 border-amber-300 shadow-md">
                      الهدى
                    </div>
                    <div className="text-[10px] text-emerald-900 font-bold tracking-widest mt-1">ملتقى الهدى القرآني بالرياض</div>
                    <div className="text-[9px] text-slate-500 font-medium">الجهة التابعة: الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض</div>
                  </div>
                )}

                {/* TEMPLATE CONDITIONAL CONTENT */}
                {printTemplate === 'cert' && (
                  <div className="space-y-6 py-4">
                    <h2 className="text-xl md:text-2xl font-bold text-emerald-950 tracking-tight font-display border-b-2 border-emerald-900 pb-2 inline-block">
                      {certificateConfig.title}
                    </h2>
                    
                    <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed font-semibold">
                      {certificateConfig.subTitle}
                    </p>

                    <div className="bg-white/80 border border-emerald-100 p-4 rounded-xl max-w-md mx-auto text-right space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">اسم الحافظ الخريج:</span>
                        <span className="font-bold text-slate-900 text-sm">{printGraduate.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">الرقم التعريفي الموحد:</span>
                        <span className="font-bold text-slate-900 font-mono">{printGraduate.id}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">الحلقة والمعلم:</span>
                        <span className="font-semibold text-slate-800">{printGraduate.circleGraduatedFrom} ({printGraduate.teacher})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">معدل الاختبار النهائي:</span>
                        <span className="font-bold text-emerald-900">{printGraduate.lastExamScore}% ({getGradeLabel(printGraduate.finalGrade)})</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-emerald-800 italic font-semibold">
                      "نسأل الله العلي القدير أن يجعل القرآن الكريم ربيعاً لقلبه ونوراً لصدره وأن ينفع به وبما حفظ"
                    </p>
                  </div>
                )}

                {printTemplate === 'card' && (
                  <div className="max-w-md mx-auto space-y-4 py-6 text-right">
                    <div className="bg-emerald-900 text-white p-3.5 rounded-t-xl text-center">
                      <span className="text-xs font-bold block tracking-wider">بطاقة خريج ملتقى الهدى القرآني</span>
                      <span className="text-[9px] text-emerald-200">صلاحية رسمية موثقة ومعتمدة</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-b-xl grid grid-cols-3 gap-3 text-xs">
                      <div className="col-span-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">اسم الخريج الحافظ:</span>
                          <span className="font-bold text-slate-800 text-sm">{printGraduate.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 block">رقم الهوية/التعريف:</span>
                            <span className="font-mono font-bold text-emerald-900">{printGraduate.id}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">سنة التخرج:</span>
                            <span className="font-bold text-slate-800">1446 هـ</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                        <User className="h-10 w-10 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {printTemplate === 'appreciation' && (
                  <div className="space-y-6 py-4">
                    <h2 className="text-xl md:text-2xl font-bold text-amber-600 tracking-tight font-display border-b-2 border-amber-600 pb-2 inline-block">
                      شهادة تفوق وتميز وشكر وتقدير
                    </h2>
                    
                    <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                      يسر مجلس إدارة ملتقى الهدى القرآني تقديم عميق الشكر والتقدير والامتنان للخريج المتميز <span className="font-bold text-emerald-900 text-sm">{printGraduate.name}</span> نظراً لما قدمه من جهد استثنائي، وضبط متميز لأجزاء كتاب الله، ومشاركته الفاعلة باللجان وتأثيره الإيجابي المستدام بالملتقى.
                    </p>

                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {printGraduate.awards.map((aw, idx) => (
                        <span key={idx} className="bg-amber-100 text-amber-950 text-[10px] font-bold px-2 py-1 rounded">
                          🎖️ {aw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {printTemplate === 'report' && (
                  <div className="text-right text-xs space-y-4 max-w-2xl mx-auto py-2">
                    <h3 className="font-bold text-base text-slate-800 border-b border-slate-200 pb-2 text-center">
                      التقرير التاريخي الشامل لمسار الخريج
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
                      <div><span className="text-slate-400">اسم الخريج:</span> <strong className="text-slate-800">{printGraduate.name}</strong></div>
                      <div><span className="text-slate-400">الرقم التعريفي:</span> <strong className="text-slate-800 font-mono">{printGraduate.id}</strong></div>
                      <div><span className="text-slate-400">الحلقة العلمية:</span> <strong className="text-slate-800">{printGraduate.circleGraduatedFrom}</strong></div>
                      <div><span className="text-slate-400">معلم المسار:</span> <strong className="text-slate-800">{printGraduate.teacher}</strong></div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 block text-xs">سجل الحركة والأحداث التاريخية:</span>
                      <div className="border-r-2 border-emerald-900 pr-3 space-y-3 mr-1">
                        {printGraduate.history.map((h, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-semibold text-emerald-900 text-[10px] block">{h.date} - {h.event}</span>
                            <span className="text-slate-600 text-[10px]">{h.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {printTemplate === 'stats' && (
                  <div className="text-right text-xs space-y-4 max-w-xl mx-auto py-2">
                    <h3 className="font-bold text-base text-slate-800 border-b border-slate-200 pb-2 text-center">
                      الكشف التحليلي السنوي ومؤشرات استدامة دفعة الخريجين
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <div className="text-slate-400">معدل الاستدامة العام للدفعة</div>
                        <div className="text-2xl font-black text-emerald-900">{overallSustainabilityIndex}%</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <div className="text-slate-400">إجمالي الحفاظ النشطين بالكادر</div>
                        <div className="text-2xl font-black text-emerald-900">{becomeTeachers + becomeSupervisors}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIGNATURES AND SEALS LAYER */}
                <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between text-right text-xs">
                  {certificateConfig.signaturesEnabled && (
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[9px] block">توقيع واعتماد مجلس الإدارة:</span>
                      <span className="font-bold text-slate-800 block text-[10px]">{certificateConfig.signee1}</span>
                      <span className="font-medium text-slate-500 block text-[9px]">{certificateConfig.signee2}</span>
                    </div>
                  )}

                  {certificateConfig.sealEnabled && (
                    <div className="w-20 h-20 border-4 border-double border-amber-500 rounded-full flex items-center justify-center text-[8px] font-bold text-amber-600 p-1 text-center select-none rotate-12 shrink-0">
                      {certificateConfig.sealText}
                    </div>
                  )}
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
