import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, BookOpen, Phone, Award, HeartPulse, FileText, 
  CheckCircle, HelpCircle, RefreshCw, X, Plus, ChevronRight, 
  ChevronLeft, Calendar, ShieldCheck, AlertCircle, Sparkles,
  GraduationCap, Building, UserCheck, Stethoscope, MessageSquare
} from 'lucide-react';
import { Student } from '../types';

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>, keepOpenForAnother?: boolean) => void;
  nextStudentId: string;
}

export default function NewStudentModal({
  isOpen,
  onClose,
  onSave,
  nextStudentId
}: NewStudentModalProps) {
  // Active Tab Index (0 to 5)
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form Initial State
  const initialFormState = {
    // 1. Basic Info
    name: '',
    birthDate: '',
    age: 14,
    gender: 'male' as 'male' | 'female',
    id: nextStudentId,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active' as Student['status'],

    // 2. Halaqa Info
    circle: 'حلقة حفظ الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    halaqaStartDate: new Date().toISOString().split('T')[0],

    // 3. Parent Info
    parentName: '',
    relationship: 'أب',
    parentPhone: '',
    parentOccupation: '',

    // 4. Educational & Quranic Info
    memorizedJuzCount: 3,
    lastSurah: 'سورة البقرة',
    tajweedLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'certified',
    readingLevel: 'very_good' as 'excellent' | 'very_good' | 'good' | 'needs_support',
    school: '',

    // 5. Health & Special Support
    healthNotes: '',
    specialNeeds: '',
    educationalNotes: '',

    // 6. General Notes & Indicators
    academicIndicator: 'green' as Student['academicIndicator'],
    generalNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Update student ID preview when nextStudentId changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, id: nextStudentId }));
  }, [nextStudentId]);

  // Auto-calculate age when birthDate changes
  const handleBirthDateChange = (dateStr: string) => {
    let calcAge = formData.age;
    if (dateStr) {
      const birthYear = new Date(dateStr).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear < currentYear && birthYear > 1990) {
        calcAge = currentYear - birthYear;
      }
    }
    setFormData(prev => ({ ...prev, birthDate: dateStr, age: calcAge }));
  };

  // Form Validation per tab & overall
  const validateTab = (tabIndex: number): boolean => {
    const errors: Record<string, string> = {};

    if (tabIndex === 0) {
      if (!formData.name.trim()) {
        errors.name = 'اسم الطالب الكامل مطلوب بشكل إلزامي';
      }
      if (formData.age <= 0 || formData.age > 30) {
        errors.age = 'يرجى إدخال عمر صحيح بين 5 و 30 سنة';
      }
    } else if (tabIndex === 2) {
      if (!formData.parentName.trim()) {
        errors.parentName = 'اسم ولي الأمر مطلوب لإجراءات التواصل والتصريح';
      }
      if (!formData.parentPhone.trim()) {
        errors.parentPhone = 'رقم الهاتف مطلوب لاستقبال التنبيهات والتقرير';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextTab = () => {
    if (validateTab(activeTab)) {
      if (activeTab < 5) setActiveTab(activeTab + 1);
    }
  };

  const handlePrevTab = () => {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };

  const handleResetForm = () => {
    setFormData({
      ...initialFormState,
      id: nextStudentId
    });
    setValidationErrors({});
    setActiveTab(0);
    setShowResetConfirm(false);
  };

  const handleSubmit = (shouldKeepOpen: boolean = false) => {
    // Validate Tab 0 & Tab 2 (Required sections)
    const isTab0Valid = validateTab(0);
    const isTab2Valid = validateTab(2);

    if (!isTab0Valid) {
      setActiveTab(0);
      return;
    }
    if (!isTab2Valid) {
      setActiveTab(2);
      return;
    }

    // Call Parent Save Callback
    onSave(formData, shouldKeepOpen);

    if (shouldKeepOpen) {
      // Reset student-specific details but keep Halaqa, Teacher & Status for fast batch entry
      setFormData(prev => ({
        ...initialFormState,
        id: `ST-${String(Number(prev.id.replace('ST-', '')) + 1).padStart(6, '0')}`,
        circle: prev.circle,
        teacher: prev.teacher,
        status: prev.status
      }));
      setActiveTab(0);
      setValidationErrors({});
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Tabs Meta Config
  const tabsConfig = [
    { 
      id: 0, 
      label: 'البيانات الأساسية', 
      icon: User, 
      isComplete: formData.name.trim().length > 0,
      isRequired: true,
      desc: 'الاسم، الميلاد، رقم الطالب، الجنس'
    },
    { 
      id: 1, 
      label: 'بيانات الحلقة', 
      icon: BookOpen, 
      isComplete: !!formData.circle,
      isRequired: true,
      desc: 'الحلقة والمعلم المباشر'
    },
    { 
      id: 2, 
      label: 'بيانات ولي الأمر', 
      icon: Phone, 
      isComplete: formData.parentName.trim().length > 0 && formData.parentPhone.trim().length > 0,
      isRequired: true,
      desc: 'ولي الأمر، رقم التواصل، صلة القرابة'
    },
    { 
      id: 3, 
      label: 'البيانات التعليمية', 
      icon: Award, 
      isComplete: formData.memorizedJuzCount >= 0,
      isRequired: false,
      desc: 'عدد الأجزاء، التجويد، القراءة'
    },
    { 
      id: 4, 
      label: 'البيانات الصحية والتربوية', 
      icon: HeartPulse, 
      isComplete: !!(formData.healthNotes || formData.specialNeeds || formData.educationalNotes),
      isRequired: false,
      desc: 'اختياري: ملاحظات صحية وتوصيات'
    },
    { 
      id: 5, 
      label: 'الملاحظات والاعتماد', 
      icon: FileText, 
      isComplete: true,
      isRequired: false,
      desc: 'الملخص النهائي والاعتماد'
    }
  ];

  // Tooltips Dictionary
  const tooltipsDict: Record<string, string> = {
    studentCode: 'كود فريد يولد تلقائياً بالنظام لاستخدامه في بطاقة الطالب وتقارير الحضور والغياب الميدانية.',
    academicIndicator: 'رمز لوني تحليلي لتقييم كفاءة الطالب المبدئية عند الالتحاق: أخضر (متقدم/خاتم)، أصفر (مستقر)، أحمر (يحتاج دعم ودورة مكثفة).',
    tajweedLevel: 'توصيف كفاءة مخارج الحروف وأحكام الترتيل للاستفادة منها عند التوزيع والترشيح للمسابقات.',
    initialHifz: 'عدد الأجزاء المتقنة بالكامل التي تم اجتياز سبر اختبارها لدى لجنة الاستقبال.'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* HEADER BAR */}
          <div className="bg-gradient-to-r from-emerald-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex justify-between items-center border-b border-emerald-800/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-400/30 text-emerald-300">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg font-display tracking-tight text-white">إعادة تصميم نافذة تسجيل طالب جديد</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {formData.id}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">نظام الإدخال المعياري المقسم إلى تبويبات مع التحقق والاعتماد الذكي</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* TABS NAVIGATION BAR (HORIZONTAL RESPONSIVE STEPPER) */}
          <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 overflow-x-auto shrink-0 scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {tabsConfig.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (validateTab(activeTab) || tab.id < activeTab) {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]' 
                        : tab.isComplete
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : tab.isComplete ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <span>{tab.label}</span>
                    
                    {tab.isRequired && !tab.isComplete && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-200">
                        مطلوب
                      </span>
                    )}
                    {tab.isComplete && !isActive && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB CONTENT BODY (SCROLLABLE AREA) */}
          <div className="p-4 sm:p-6 overflow-y-auto grow space-y-4 text-right text-xs">

            {/* TAB 0: BASIC INFORMATION */}
            {activeTab === 0 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span className="font-black text-slate-800 text-sm font-display">البيانات الأساسية والشخصية للطالب</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-1.5 px-3 rounded-lg border border-slate-200 text-[11px]">
                    <span className="text-slate-500">رقم الطالب النظامي:</span>
                    <span className="font-mono font-black text-emerald-700">{formData.id}</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTooltip(activeTooltip === 'studentCode' ? null : 'studentCode')}
                      className="text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {activeTooltip === 'studentCode' && (
                  <div className="bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <p>{tooltipsDict.studentCode}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {/* Quadruple Full Name */}
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>اسم الطالب الكامل (رباعي) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">كما هو مدون بالهوية الرسمية</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({});
                    }}
                    placeholder="مثال: يوسف بن أحمد بن صالح السعيد"
                    className={`w-full p-3 bg-slate-50/50 border rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all ${
                      validationErrors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-250'
                    }`}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{validationErrors.name}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Birth Date */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">تاريخ الميلاد</label>
                    <input 
                      type="date" 
                      value={formData.birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Auto Calculated Age */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>العمر (بالسنوات) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-emerald-700 font-bold">(حساب تلقائي)</span>
                    </label>
                    <input 
                      type="number" 
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      min={5}
                      max={30}
                      className="w-full p-2.5 bg-slate-100 border border-slate-250 rounded-xl text-xs font-black text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Gender Selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">الجنس</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="male">ذكر (طالب)</option>
                      <option value="female">أنثى (طالبة)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  {/* Joining Date */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">تاريخ الالتحاق بالملتقى</label>
                    <input 
                      type="date" 
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Enrollment Status */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">حالة ملف الطالب</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Student['status'] })}
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="active">🟢 نشط ومستمر بالحلقات</option>
                      <option value="inactive">🟡 متوقف مؤقتاً (بإجازة)</option>
                      <option value="graduate">🎓 خريج خاتم</option>
                      <option value="archived">⚪ منسحب ومؤرشف</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 1: HALAQA & TRACK ASSIGNMENT */}
            {activeTab === 1 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50/60 p-3 rounded-xl border border-emerald-150">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-700" />
                    <span className="font-black text-emerald-950 text-sm font-display">توزيع الحلقة والمسار المنهجي والكادر المشرف</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">إسناد تلقائي للمعلم</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Halaqa (Auto Assigned) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">الحلقة المخصصة للطالب</label>
                    <div className="w-full p-3 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-emerald-950 flex items-center justify-between shadow-2xs">
                      <span>{formData.circle}</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        إضافة تلقائية لحلقة المعلم
                      </span>
                    </div>
                  </div>

                  {/* Assigned Teacher */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">المعلم المباشر للحلقة</label>
                    <input 
                      type="text" 
                      value={formData.teacher}
                      readOnly
                      className="w-full p-3 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {/* Halaqa Attendance Start Date */}
                  <label className="font-bold text-slate-700 block">تاريخ بدء الحضور بالحلقة</label>
                  <input 
                    type="date" 
                    value={formData.halaqaStartDate}
                    onChange={(e) => setFormData({ ...formData, halaqaStartDate: e.target.value })}
                    className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </motion.div>
            )}

            {/* TAB 2: PARENT & GUARDIAN DATA */}
            {activeTab === 2 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50/60 p-3 rounded-xl border border-amber-150">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-700" />
                    <span className="font-black text-amber-950 text-sm font-display">بيانات ولي الأمر وتفاصيل التواصل والمتابعة</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">إلزامية للبوابة والمتابعة</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Parent Full Name */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-700 block">اسم ولي الأمر الثلاثي / الكامل <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.parentName}
                      onChange={(e) => {
                        setFormData({ ...formData, parentName: e.target.value });
                        if (validationErrors.parentName) setValidationErrors({});
                      }}
                      placeholder="مثال: عبدالمجيد بن صالح السعيد"
                      className={`w-full p-3 bg-slate-50/50 border rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all ${
                        validationErrors.parentName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-250'
                      }`}
                      required
                    />
                    {validationErrors.parentName && (
                      <p className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{validationErrors.parentName}</span>
                      </p>
                    )}
                  </div>

                  {/* Relationship */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">صلة القرابة <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="أب">أب</option>
                      <option value="أم">أم</option>
                      <option value="أخ">أخ</option>
                      <option value="عم">عم</option>
                      <option value="خال">خال</option>
                      <option value="جد">جد</option>
                      <option value="ولي أمر آخر">ولي أمر آخر</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parent Phone */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">رقم الهاتف للواتساب والاتصال <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.parentPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, parentPhone: e.target.value });
                        if (validationErrors.parentPhone) setValidationErrors({});
                      }}
                      placeholder="05XXXXXXXX"
                      className={`w-full p-3 bg-slate-50/50 border rounded-xl text-xs font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all ${
                        validationErrors.parentPhone ? 'border-rose-500 bg-rose-50/20' : 'border-slate-250'
                      }`}
                      required
                    />
                    {validationErrors.parentPhone && (
                      <p className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{validationErrors.parentPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* Parent Occupation */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">المهنة / جهة العمل <span className="text-slate-400 font-normal">(اختياري)</span></label>
                    <input 
                      type="text" 
                      value={formData.parentOccupation}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                      placeholder="مثال: معلم / مهندس / أعمال حرة"
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: EDUCATIONAL & QURANIC LEVEL */}
            {activeTab === 3 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-xl border border-indigo-150">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-700" />
                    <span className="font-black text-indigo-950 text-sm font-display">البيانات التعليمية ومستوى الحفظ والتلاوة السابق</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-1 rounded-lg">قياس المستوى القرآني</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Memorized Juz Count */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>عدد الأجزاء المحفوظة سابقاً</span>
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'initialHifz' ? null : 'initialHifz')}
                        className="text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </label>
                    <input 
                      type="number" 
                      value={formData.memorizedJuzCount}
                      onChange={(e) => setFormData({ ...formData, memorizedJuzCount: Number(e.target.value) })}
                      min={0}
                      max={30}
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-black text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Last Surah Reached */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">آخر سورة وصل إليها الطالب</label>
                    <input 
                      type="text" 
                      value={formData.lastSurah}
                      onChange={(e) => setFormData({ ...formData, lastSurah: e.target.value })}
                      placeholder="مثال: سورة البقرة - الآية 100"
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {activeTooltip === 'initialHifz' && (
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p>{tooltipsDict.initialHifz}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tajweed Level */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>مستوى أحكام التجويد</span>
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'tajweedLevel' ? null : 'tajweedLevel')}
                        className="text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </label>
                    <select
                      value={formData.tajweedLevel}
                      onChange={(e) => setFormData({ ...formData, tajweedLevel: e.target.value as any })}
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="beginner">مبتدئ (مبادئ الترتيل)</option>
                      <option value="intermediate">متوسط (ضبط النون والتنوين)</option>
                      <option value="advanced">متقدم (ضبط المخارج والمدود)</option>
                      <option value="certified">مجاز بالسند المتصل</option>
                    </select>
                  </div>

                  {/* Reading Level */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">مستوى القراءة والطلاقة</label>
                    <select
                      value={formData.readingLevel}
                      onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value as any })}
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="excellent">ممتاز (طلاقة بدون تهجئة)</option>
                      <option value="very_good">جيد جداً (مستقر)</option>
                      <option value="good">جيد (حاجيات مراجعة)</option>
                      <option value="needs_support">بحاجة لدعم وتشجيع</option>
                    </select>
                  </div>

                  {/* School & Grade */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">المدرسة والصف الحالي</label>
                    <input 
                      type="text" 
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      placeholder="مثال: مدرسة الإمام عاصم - ثاني متوسط"
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {activeTooltip === 'tajweedLevel' && (
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p>{tooltipsDict.tajweedLevel}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: HEALTH & SPECIAL SUPPORT */}
            {activeTab === 4 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-rose-50/60 p-3 rounded-xl border border-rose-150">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-rose-700" />
                    <span className="font-black text-rose-950 text-sm font-display">البيانات الصحية والاحتياجات التربوية الخاصة <span className="text-slate-400 font-normal">(اختياري)</span></span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-1 rounded-lg">سرية وتوجيه للمعلم</span>
                </div>

                <div className="space-y-3">
                  {/* Health Notes */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-rose-600" />
                      <span>ملاحظات صحية أو تنبيهات طوارئ</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={formData.healthNotes}
                      onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                      placeholder="تنويه حول أي حالات مثل: الربو، حساسية طعام، مشاكل نظر، أو أدوية حتمية..."
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  {/* Special Needs */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>احتياجات خاصة أو الترتيبات المكانية</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={formData.specialNeeds}
                      onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                      placeholder="تفضيلات المقعد الأمامي بالحلقة، ترتيبات بصرية أو احتياجات تعلم فريدة..."
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  {/* Behavioral / Educational Guidance */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>توصيات تربوية خاصة للتعامل مع الطالب</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={formData.educationalNotes}
                      onChange={(e) => setFormData({ ...formData, educationalNotes: e.target.value })}
                      placeholder="أسلوب التحفيز المفضل لدى الطالب، نقاط التميز الشخصي، توصيات من ولي الأمر..."
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: GENERAL NOTES & SUMMARY REVIEW */}
            {activeTab === 5 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    <span className="font-black text-slate-900 text-sm font-display">مراجعة ملخص الملف والاعتماد النهائي</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">الخطوة الأخيرة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Initial Academic Indicator */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>مؤشر التقييم المبدئي الشامل</span>
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'academicIndicator' ? null : 'academicIndicator')}
                        className="text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </label>
                    <select
                      value={formData.academicIndicator}
                      onChange={(e) => setFormData({ ...formData, academicIndicator: e.target.value as Student['academicIndicator'] })}
                      className="w-full p-3 bg-white border border-slate-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
                    >
                      <option value="green">🟢 متميز ومؤهل للمسار السريع (أخضر)</option>
                      <option value="yellow">🟡 متوسط ومستقر بمساره (أصفر)</option>
                      <option value="red">🔴 يحتاج خطة دعم وتكثيف مبدئية (أحمر)</option>
                    </select>
                  </div>

                  {/* General Registration Notes */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">ملاحظات لجنة القبول والتسجيل</label>
                    <input 
                      type="text" 
                      value={formData.generalNotes}
                      onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                      placeholder="أي توصيات أو شروط إضافية عند القبول..."
                      className="w-full p-3 bg-slate-50/50 border border-slate-250 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {activeTooltip === 'academicIndicator' && (
                  <div className="bg-slate-100 border border-slate-300 text-slate-800 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p>{tooltipsDict.academicIndicator}</p>
                  </div>
                )}

                {/* DATA SUMMARY REVIEW CARDS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-black text-xs text-slate-800 font-display flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>ملخص بيانات الحافظ قبل الحفظ:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] font-bold">بيانات الطالب:</span>
                      <p className="font-black text-slate-800">{formData.name || 'لم يدخل الاسم'}</p>
                      <p className="text-slate-600">العمر: <span className="font-bold">{formData.age} سنة</span> | الجنس: {formData.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                      <p className="text-slate-500">الكود: <span className="font-mono font-bold text-emerald-700">{formData.id}</span></p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] font-bold">الحلقة والكادر:</span>
                      <p className="font-black text-emerald-950">{formData.circle}</p>
                      <p className="text-slate-600">المعلم: <span className="font-bold">{formData.teacher}</span></p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] font-bold">ولي الأمر والتواصل:</span>
                      <p className="font-black text-slate-800">{formData.parentName || 'لم يدخل الاسم'}</p>
                      <p className="text-slate-600">صلة القرابة: <span className="font-bold">{formData.relationship}</span></p>
                      <p className="text-slate-600 font-mono">الهاتف: <span className="font-bold">{formData.parentPhone}</span></p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* RESET CONFIRMATION MODAL OVERLAY */}
          {showResetConfirm && (
            <div className="bg-amber-50 border-y border-amber-200 p-3 px-5 text-xs text-amber-900 flex justify-between items-center animate-fadeIn shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <span className="font-bold">هل أنت أكتيد في رغبتك بتفريغ كافة الحقول وإعادة النموذج للحالة الأولى؟</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-amber-700 hover:bg-amber-800 text-white p-1.5 px-3 rounded-lg font-black cursor-pointer"
                >
                  نعم، فرّغ الحقول
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-white text-slate-700 border border-slate-300 p-1.5 px-3 rounded-lg font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS BAR */}
          <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
            {/* Right Group: Navigation & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className="bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 p-2.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="إعادة تعيين كافة حقول الاستمارة"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">إعادة تعيين الحقول</span>
              </button>

              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={handlePrevTab}
                  className="bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 p-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>السابق</span>
                </button>
              )}
            </div>

            {/* Left Group: Next / Save Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                إلغاء
              </button>

              {activeTab < 5 ? (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md transition-all"
                >
                  <span>التبويب التالي</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    className="bg-indigo-900 hover:bg-indigo-950 text-white p-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    title="حفظ طالب جديد ثم إبقاء النافذة لإضافة طالب آخر لنفس الحلقة"
                  >
                    <Plus className="h-4 w-4" />
                    <span>حفظ وإضافة طالب آخر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 px-6 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>حفظ وإغلاق النافذة</span>
                  </button>
                </>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
