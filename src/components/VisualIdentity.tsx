/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, Image, Type, Phone, Mail, Globe, Sparkles, Printer, 
  Upload, CloudUpload, FileCheck, CheckCircle2, Database, Plus, Download, 
  RefreshCcw, RefreshCw, ArrowLeftRight, Check, X, AlertTriangle, Eye, 
  ShieldCheck, ClipboardList, Info, HelpCircle, Lock, Unlock, Settings, 
  TrendingUp, History, User, Users, Trash2, Sliders, LayoutGrid, FileText, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VisualIdentity as VisualIdentityType } from '../types';

interface ExtendedVisualIdentityComponentProps {
  identity: VisualIdentityType;
  onSave: (data: VisualIdentityType) => void;
}

export default function VisualIdentity({ identity, onSave }: ExtendedVisualIdentityComponentProps) {
  // --- Section 1 to 5 Core States ---
  const [centerName, setCenterName] = useState(identity.centerName || 'ملتقى الهدى القرآني النموذجي');
  const [logo, setLogo] = useState(identity.logo || '1');
  const [textLogo, setTextLogo] = useState(identity.textLogo || 'سند متصل بالتجويد والإتقان');
  const [phone, setPhone] = useState(identity.phone || '0554321098');
  const [email, setEmail] = useState(identity.email || 'info@huda.edu.sa');
  const [website, setWebsite] = useState(identity.website || 'www.hudataleem.org');
  const [affiliate, setAffiliate] = useState(identity.affiliate || 'الجمعية الخيرية لتحفيظ القرآن الكريم بالرياض');
  
  // Design system customization (Section 1)
  const [primaryColor, setPrimaryColor] = useState(identity.primaryColor || '#059669');
  const [secondaryColor, setSecondaryColor] = useState(identity.secondaryColor || '#ecfdf5');
  const [uiStylePattern, setUiStylePattern] = useState<'formal' | 'educational' | 'interactive'>(identity.uiStylePattern || 'educational');

  // Gender UI Mode (Section 2)
  const [genderMode, setGenderMode] = useState<'boys' | 'girls' | 'mixed'>(identity.genderMode || 'mixed');
  const [genderModeLocked, setGenderModeLocked] = useState(identity.genderModeLocked || false);
  const [showGenderUnlockDialog, setShowGenderUnlockDialog] = useState(false);

  // Backup Policies & Manual Control (Section 3)
  const [autoBackupInterval, setAutoBackupInterval] = useState<'daily' | 'weekly' | 'monthly' | 'disabled'>(identity.autoBackupInterval || 'weekly');
  const [backupNote, setBackupNote] = useState('');
  const [backupsList, setBackupsList] = useState<Array<{
    id: string;
    version: string;
    fileName: string;
    createdAt: string;
    size: string;
    type: 'auto' | 'manual';
    creator: string;
    statsSnapshot: { students: number; circles: number; teachers: number; achievements: number };
  }>>([
    {
      id: 'bk-1',
      version: 'V2.4.1',
      fileName: 'huda_academy_auto_weekly_2026_06_22.json',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      size: '1.45 MB',
      type: 'auto',
      creator: 'مجدول الأمان التلقائي',
      statsSnapshot: { students: 142, circles: 12, teachers: 8, achievements: 412 }
    },
    {
      id: 'bk-2',
      version: 'V2.4.0',
      fileName: 'huda_academy_manual_pre_summer_2026_06_18.json',
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      size: '1.38 MB',
      type: 'manual',
      creator: 'عبدالرحمن السعيد (المدير)',
      statsSnapshot: { students: 138, circles: 11, teachers: 8, achievements: 388 }
    }
  ]);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [restorePrimaryConsent, setRestorePrimaryConsent] = useState(false);
  const [restoreSecondaryConsent, setRestoreSecondaryConsent] = useState(false);
  const [restoreDoubleCode, setRestoreDoubleCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // General System Behavior (Section 4)
  const [defaultLanguage, setDefaultLanguage] = useState<'ar' | 'en'>(identity.defaultLanguage || 'ar');
  const [timezone, setTimezone] = useState(identity.timezone || 'Asia/Riyadh');
  const [studentIdFormat, setStudentIdFormat] = useState(identity.studentIdFormat || 'ST-000000');
  const [enableEduIndicators, setEnableEduIndicators] = useState(identity.enableEduIndicators !== false);
  const [enableSmartAlerts, setEnableSmartAlerts] = useState(identity.enableSmartAlerts !== false);
  const [enableAutoReports, setEnableAutoReports] = useState(identity.enableAutoReports !== false);
  const [interfaceDetailLevel, setInterfaceDetailLevel] = useState<'brief' | 'detailed'>(identity.interfaceDetailLevel || 'detailed');

  // UI behavior (Section 5)
  const [defaultFontSize, setDefaultFontSize] = useState<'small' | 'medium' | 'large'>(identity.defaultFontSize || 'medium');
  const [tableDensity, setTableDensity] = useState<'dense' | 'comfortable'>(identity.tableDensity || 'comfortable');
  const [showQuickIndicators, setShowQuickIndicators] = useState(identity.showQuickIndicators !== false);
  const [enableInteractiveCards, setEnableInteractiveCards] = useState(identity.enableInteractiveCards !== false);
  const [viewLayoutStyle, setViewLayoutStyle] = useState<'table' | 'cards'>(identity.viewLayoutStyle || 'table');

  // Configuration Rollback & Audit Logs (Section 9)
  const [configHistory, setConfigHistory] = useState<Array<{
    id: string;
    timestamp: string;
    operator: string;
    changesSummary: string;
    snapshot: any;
  }>>(identity.configHistory || [
    {
      id: 'cfg-init',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      changesSummary: 'توليد البيئة النموذجية الأولى وتثبيت الأكواد التشغيلية',
      operator: 'النظام الآلي',
      snapshot: {
        centerName: 'ملتقى الهدى القرآني النموذجي',
        logo: '1',
        textLogo: 'سند متصل بالتجويد والإتقان',
        phone: '0554321098',
        email: 'info@huda.edu.sa',
        primaryColor: '#059669',
        secondaryColor: '#ecfdf5',
        uiStylePattern: 'educational',
        genderMode: 'mixed',
        defaultFontSize: 'medium',
        tableDensity: 'comfortable'
      }
    }
  ]);

  // Operational states
  const [activeSection, setActiveSection] = useState<'visual' | 'gender' | 'backup' | 'general' | 'behavior' | 'templates' | 'history'>('visual');
  const [showDoubleSaveConfirm, setShowDoubleSaveConfirm] = useState(false);
  const [doubleConfirmSaveCode, setDoubleConfirmSaveCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset Color Palettes
  const COLOR_PRESETS = [
    { name: 'أخضر محفلي (قرآني)', primary: '#059669', secondary: '#ecfdf5', label: 'Classic standard Quranic green' },
    { name: 'أزرق وقار إداري', primary: '#1e40af', secondary: '#eff6ff', label: 'Administrative blue' },
    { name: 'بنفسجي تربوي دافئ', primary: '#7c3aed', secondary: '#f5f3ff', label: 'Cozy educational purple' },
    { name: 'ياقوتي حماسي', primary: '#be123c', secondary: '#fff1f2', label: 'Championship red' },
    { name: 'أزرق كوني مميز', primary: '#0ea5e9', secondary: '#f0f9ff', label: 'Modern sky blue' },
    { name: 'برتقالي وقائي دافئ', primary: '#d97706', secondary: '#fef3c7', label: 'Vibrant orange gold' },
    { name: 'الفحم الإملائي الصلب', primary: '#334155', secondary: '#f8fafc', label: 'Formal steel slate' }
  ];

  // Auto-calculate matching secondary tint if primary changes
  const applyCustomPrimary = (hexColor: string) => {
    setPrimaryColor(hexColor);
    // Rough calculation of complementary secondary light pastel (95% brightness)
    // Simply set secondary to a very light matching shade
    if (hexColor.startsWith('#')) {
      setSecondaryColor(`${hexColor}10`); // Apply opacity for a beautiful soft tint
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Section 6: Configuration Templates
  const handleLoadTemplatePreset = (presetType: 'small' | 'medium' | 'large') => {
    if (presetType === 'small') {
      setCenterName('ملتقى الرياحين القرآني الصغير');
      setUiStylePattern('educational');
      setGenderMode('boys');
      setAutoBackupInterval('monthly');
      setEnableEduIndicators(true);
      setEnableSmartAlerts(false);
      setEnableAutoReports(false);
      setInterfaceDetailLevel('brief');
      setDefaultFontSize('small');
      setTableDensity('comfortable');
      setPrimaryColor('#0284c7');
      setSecondaryColor('#f0f9ff');
      showToast('✓ تم تحميل تكوين (الملتقى الصغير): واجهات مختصرة، ترخيص غياب مرن، نسخ مصلحي شهري وصيانة خفيفة.');
    } else if (presetType === 'medium') {
      setCenterName('ملتقى الهدى القرآني المعتدل');
      setUiStylePattern('educational');
      setGenderMode('mixed');
      setAutoBackupInterval('weekly');
      setEnableEduIndicators(true);
      setEnableSmartAlerts(true);
      setEnableAutoReports(true);
      setInterfaceDetailLevel('detailed');
      setDefaultFontSize('medium');
      setTableDensity('comfortable');
      setPrimaryColor('#059669');
      setSecondaryColor('#ecfdf5');
      showToast('✓ تم تفعيل قالب (الملتقى المتوسط): حماية أوتوماتيكية أسبوعية، مؤشرات مدمجة وكثافة متزنة.');
    } else if (presetType === 'large') {
      setCenterName('أكاديمية الإمام الشاطبي الكبرى للقراءات');
      setUiStylePattern('formal');
      setGenderMode('mixed');
      setAutoBackupInterval('daily');
      setEnableEduIndicators(true);
      setEnableSmartAlerts(true);
      setEnableAutoReports(true);
      setInterfaceDetailLevel('detailed');
      setDefaultFontSize('large');
      setTableDensity('dense');
      setPrimaryColor('#475569');
      setSecondaryColor('#f1f5f9');
      showToast('✓ تم تحميل التكوين الكلاسيكي (الصرح الكبير): جداول مكثفة، نسخ تلقائي يومي صارم وكفاءة إدارية كبرى.');
    }
  };

  const handleExportTemplate = () => {
    const configExport = {
      centerName, logo, textLogo, phone, email, website, affiliate,
      primaryColor, secondaryColor, uiStylePattern, genderMode,
      autoBackupInterval, defaultLanguage, timezone, studentIdFormat,
      enableEduIndicators, enableSmartAlerts, enableAutoReports,
      interfaceDetailLevel, defaultFontSize, tableDensity
    };
    navigator.clipboard.writeText(JSON.stringify(configExport, null, 2));
    showToast('✓ تم تشفير التكوين وتوليد الرابط التقني ونسخه لحافظة جهازك بنجاح.');
  };

  const handleImportTemplate = () => {
    const pasted = prompt('يرجى لصق كود التكوين المصدّر سابقاً لاستدعائه:');
    if (!pasted) return;
    try {
      const parsed = JSON.parse(pasted);
      if (parsed.centerName) {
        if (parsed.centerName) setCenterName(parsed.centerName);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.secondaryColor) setSecondaryColor(parsed.secondaryColor);
        if (parsed.uiStylePattern) setUiStylePattern(parsed.uiStylePattern);
        if (parsed.genderMode) setGenderMode(parsed.genderMode);
        if (parsed.autoBackupInterval) setAutoBackupInterval(parsed.autoBackupInterval);
        if (parsed.defaultFontSize) setDefaultFontSize(parsed.defaultFontSize);
        if (parsed.tableDensity) setTableDensity(parsed.tableDensity);
        showToast('✓ فك التشفير ناجح: تم استرجاع وفحص قالب الإعدادات وتوطينه فوراً.');
      }
    } catch(e) {
      alert('كود التكوين المدخل غير متوافق أو يحتوي على رموز تالفة.');
    }
  };

  // Section 2: Gender Lock managers
  const attemptGenderChange = (mode: 'boys' | 'girls' | 'mixed') => {
    if (genderModeLocked) {
      setShowGenderUnlockDialog(true);
    } else {
      setGenderMode(mode);
      // Auto tint theme based on gender preference for delightful UX!
      if (mode === 'boys') {
        setPrimaryColor('#1d4ed8'); // Sapphire
        setSecondaryColor('#eff6ff');
      } else if (mode === 'girls') {
        setPrimaryColor('#db2777'); // Magenta Rose
        setSecondaryColor('#fff1f2');
      } else {
        setPrimaryColor('#059669'); // Emerald
        setSecondaryColor('#ecfdf5');
      }
      showToast(`✓ تم توجيه الواجهات لاستخدام نمط (${mode === 'boys' ? 'حلقات البنين والذكور' : mode === 'girls' ? 'دور الذكر والنساء' : 'الوضع المختلط الشامل'}).`);
    }
  };

  // Section 3: Backup execution
  const triggerManualBackup = (e: React.FormEvent) => {
    e.preventDefault();
    const mockFilename = `huda_academy_manual_${Date.now().toString().slice(-4)}_snapshot.json`;
    const newBk = {
      id: `bk-${Date.now()}`,
      version: 'V2.4.2',
      fileName: mockFilename,
      createdAt: new Date().toISOString(),
      size: '1.41 MB',
      type: 'manual' as const,
      creator: 'المدير العام (عبدالرحمن السعيد)',
      statsSnapshot: { students: 145, circles: 12, teachers: 8, achievements: 420 }
    };
    setBackupsList([newBk, ...backupsList]);
    setBackupNote('');
    showToast(`✓ تم البدء فورياً في ضغط قواعد البيانات وتوليد سجل الاسترداد الآمن (${mockFilename}).`);
  };

  const executeRestorePoint = () => {
    if (!restoringBackupId) return;
    setIsRestoring(true);
    setTimeout(() => {
      setIsRestoring(false);
      showToast('✓ تمت استعادة قاعدة الجداول بالكامل وإغلاق المنافذ المؤقتة بنجاح.');
      
      // Add operational trace log to configuration history
      const targetBk = backupsList.find(b => b.id === restoringBackupId);
      const logItem = {
        id: `cfg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        changesSummary: `استعادة كاملة للنظام من نسخة أمان (${targetBk?.fileName}) وتظهير العمليات`,
        operator: 'عبدالرحمن السعيد (طلب استرجاع)',
        snapshot: targetBk ? { ...identity } : {}
      };
      setConfigHistory([logItem, ...configHistory]);
      
      setRestoringBackupId(null);
      setRestorePrimaryConsent(false);
      setRestoreSecondaryConsent(false);
    }, 2000);
  };

  // Section 9: ROLLBACK (تراجع للتهيئة السابقة)
  const executeRollback = (historyItem: typeof configHistory[0]) => {
    const doubleCheck = window.confirm(`هل أنت متأكد من رغبتك في التراجع الفوري عن التهيئة الحالية واسترجاع التكوين المتخذ بواسطة (${historyItem.operator}) بتاريخ ${new Date(historyItem.timestamp).toLocaleString('ar-SA')}؟`);
    if (!doubleCheck) return;
    
    const snap = historyItem.snapshot;
    if (snap) {
      if (snap.centerName) setCenterName(snap.centerName);
      if (snap.logo) setLogo(snap.logo);
      if (snap.textLogo) setTextLogo(snap.textLogo);
      if (snap.phone) setPhone(snap.phone);
      if (snap.email) setEmail(snap.email);
      if (snap.primaryColor) setPrimaryColor(snap.primaryColor);
      if (snap.secondaryColor) setSecondaryColor(snap.secondaryColor);
      if (snap.uiStylePattern) setUiStylePattern(snap.uiStylePattern);
      if (snap.genderMode) setGenderMode(snap.genderMode);
      if (snap.defaultFontSize) setDefaultFontSize(snap.defaultFontSize);
      if (snap.tableDensity) setTableDensity(snap.tableDensity);
      
      showToast(`✓ تمت العودة بنجاح إلى النسخة السابقة وإلغاء جميع التعديلات اللاحقة.`);
      
      // Append a trace log
      const rollbackLog = {
        id: `cfg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        changesSummary: `إجراء تراجع واسترداد التهيئة التاريخية المؤرخة (${historyItem.changesSummary})`,
        operator: 'المدير العام',
        snapshot: { ...snap }
      };
      setConfigHistory([rollbackLog, ...configHistory]);
    }
  };

  // Section 8: Final save action
  const handleFinalSave = () => {
    setShowDoubleSaveConfirm(true);
  };

  const executeSaveConfirmed = () => {
    const updatedModel: VisualIdentityType = {
      centerName,
      logo,
      textLogo,
      phone,
      email,
      website,
      affiliate,
      primaryColor,
      secondaryColor,
      uiStylePattern,
      genderMode,
      genderModeLocked,
      autoBackupInterval,
      defaultLanguage,
      timezone,
      studentIdFormat,
      enableEduIndicators,
      enableSmartAlerts,
      enableAutoReports,
      interfaceDetailLevel,
      defaultFontSize,
      tableDensity,
      showQuickIndicators,
      enableInteractiveCards,
      viewLayoutStyle,
      configHistory: [
        {
          id: `cfg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: 'المدير العام (حفظ تعديلات واجهة)',
          changesSummary: `جملة تحديثات على الألوان والوضع الهيكلي للملتقى (${centerName})`,
          snapshot: {
            centerName, logo, textLogo, phone, email, primaryColor, secondaryColor, uiStylePattern, genderMode, defaultFontSize, tableDensity
          }
        },
        ...configHistory
      ]
    };

    onSave(updatedModel);
    setShowDoubleSaveConfirm(false);
    setDoubleConfirmSaveCode('');
    showToast('✓ تم دمج وبث التهيئة الجديدة إلى كامل النظام والمحاور البصرية بنجاح.');
  };

  // Drag and drop logo mockup simulation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      simulateUpload(e.dataTransfer.files[0].name);
    }
  };

  const simulateUpload = (name: string) => {
    setUploadProgress(`جاري فحص وضغط الترويسة (${name})...`);
    setTimeout(() => {
      setLogo('CustomUploadedSymbol');
      setUploadProgress(`✓ تم تثبيت الشعار المفرغ (${name}) بنجاح.`);
      setTimeout(() => setUploadProgress(null), 3000);
    }, 1200);
  };

  const handleDeleteLogo = () => {
    setLogo('placeholder_none');
    showToast('✓ تم إزالة شعار الصرح تماماً وسيظهر النظام بالترويسة النصية الموحدة.');
  };

  // Helper to draw active mock logo node
  const getLogoNode = (id: string) => {
    if (id === '1') {
      return (
        <div className="h-12 w-12 bg-emerald-800 text-amber-300 rounded-full border border-amber-200 flex items-center justify-center font-display font-bold text-lg shadow-sm">
          هدى
        </div>
      );
    }
    if (id === '2') {
      return (
        <div className="h-12 w-12 bg-indigo-900 text-white rounded-xl border border-indigo-400 flex items-center justify-center font-black text-xl font-display shadow-sm">
          نصفـ
        </div>
      );
    }
    return (
      <div className="h-12 w-12 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-xs">
        <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
      </div>
    );
  };

  // Propagate CSS variables inline preview for immediate impact inside the simulator!
  useEffect(() => {
    // We override target colors on the document element for real live update inside the app!
    const root = document.documentElement;
    if (primaryColor) {
      root.style.setProperty('--color-emerald-600', primaryColor);
      root.style.setProperty('--color-emerald-700', primaryColor);
      root.style.setProperty('--color-emerald-800', primaryColor);
      root.style.setProperty('--color-emerald-50', secondaryColor || '#ecfdf5');
      root.style.setProperty('--color-emerald-100', secondaryColor || '#d1fae5');
    }
    
    // Propagate system-wide default font size
    let size = '16px';
    if (defaultFontSize === 'small') size = '14px';
    if (defaultFontSize === 'large') size = '18px';
    root.style.fontSize = size;
  }, [primaryColor, secondaryColor, defaultFontSize]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="system-super-configurator">
      
      {/* Toast feedback panel */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-5 left-5 bg-slate-900 border border-slate-700 text-white p-3.5 px-6 rounded-xl text-xs font-bold shadow-2xl z-50 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-sky-50 text-sky-800 border border-sky-150 p-1 px-3 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Settings className="h-3 w-3 inline text-sky-500" />
              صلاحية مدير النظام العام
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-150 p-1 px-2.5 rounded-full text-[10px] font-bold">
              مصفوفة التحكم الدستورية الشاملة
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">مستودع التحكم المركزي والتهيئة الذكية</h2>
          <p className="text-slate-450 text-xs font-medium">تصميم الهوية البصرية، إعدادات حوكمة الجداول، سياسات النسخ الاحتياطي التلقائي والمحاكاة التراكمية الفورية للقرارات البيئية.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10 text-xs font-bold">
          <button 
            type="button"
            onClick={handleFinalSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-xs hover:scale-98 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>حفظ وبث الإعدادات الحالية</span>
          </button>
        </div>
      </div>

      {/* MASTER COLUMNS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="super-configurator-split">
        
        {/* LEFT COLUMN - 4 COLS: SECTION SELECTOR ACCORDION (1, 2, 3, 4, 5, 6, 8, 9) */}
        <div className="lg:col-span-4 space-y-3">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-1">
            <p className="text-slate-400 text-[10px] font-bold tracking-wider mb-2">أبواب مصفوفة التحكم الثمانية</p>
            
            {/* Sec 1 */}
            <button
              onClick={() => setActiveSection('visual')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'visual' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                <span className="text-xs">القسم 1: الهوية البصرية وشكل النظام</span>
              </div>
              <span className="text-[10px] text-emerald-700 underline font-mono">نشط</span>
            </button>

            {/* Sec 2 */}
            <button
              onClick={() => setActiveSection('gender')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'gender' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-xs">القسم 2: وضع تخصص النظام (جندر)</span>
              </div>
              {genderModeLocked ? (
                <Lock className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>

            {/* Sec 3 */}
            <button
              onClick={() => setActiveSection('backup')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'backup' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-600" />
                <span className="text-xs">القسم 3: الأمان والنسخ الاحتياطي الفوري</span>
              </div>
              <span className="bg-sky-50 text-sky-800 text-[9px] font-bold rounded-sm p-0.5 px-1">{autoBackupInterval}</span>
            </button>

            {/* Sec 4 */}
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'general' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-600" />
                <span className="text-xs">القسم 4: إعدادات السلوك العام والترقيم</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>

            {/* Sec 5 */}
            <button
              onClick={() => setActiveSection('behavior')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'behavior' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-indigo-500" />
                <span className="text-xs">القسم 5: سلوك وكثافة الجداول والخطوط</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>

            {/* Sec 6 */}
            <button
              onClick={() => setActiveSection('templates')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'templates' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-xs">الجمع والتحميل: إدارة القوالب السريعة</span>
              </div>
              <span className="bg-orange-50 text-orange-850 text-[9px] font-bold rounded-sm p-0.5 px-1">سريعة</span>
            </button>

            {/* Sec 9 */}
            <button
              onClick={() => setActiveSection('history')}
              className={`w-full p-3 rounded-xl text-right flex items-center justify-between transition-all ${activeSection === 'history' ? 'bg-emerald-50 text-emerald-950 border border-emerald-150 font-bold' : 'hover:bg-slate-50 text-slate-700 font-semibold text-xs'}`}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-purple-600" />
                <span className="text-xs">القسم 9: سجل التغييرات والتراجع (Rollback)</span>
              </div>
              <span className="bg-purple-50 text-purple-800 font-mono text-[9px] px-1.5 rounded">{configHistory.length} مسجل</span>
            </button>

          </div>

          {/* SEC 8 ACCEPTS RESTRICTION INDICATION */}
          <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-900 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <h4 className="font-bold font-display">الأمان الفيدرالي ومصادقة اللوائح</h4>
            </div>
            <p className="text-indigo-200 text-[11px] leading-relaxed font-medium">
              الوصول لهذه اللوحة مقصور حصرياً على رتبة <strong>المدير العام</strong>. تُسجل البصمة الزمنية للمتصفح وتفاصيل التعديلات داخل سجلات الرصد الآلية تلقائياً لقرارات استرجاع الآمنين.
            </p>
          </div>

        </div>

        {/* MIDDLE COLUMN - 5 COLS: DYNAMIC ACTIVE FORM VALUE */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-5" id="settings-workbench-area">
            
            {/* Visual Identity Section */}
            {activeSection === 'visual' && (
              <div className="space-y-4 animate-fade-in" id="workbench-visual">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم الأول: الهوية البصرية وشعار الصرح</h3>
                  <p className="text-slate-450 text-[11px]">تنزيل ورفع الشعارات وتعديل العناوين والألوان الممررة فورياً لكامل المنصات.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">اسم الصرح / الملتقى القرآني:</label>
                    <input 
                      type="text" 
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">الشعار النصي اللفظي (Slogan):</label>
                    <input 
                      type="text" 
                      value={textLogo}
                      onChange={(e) => setTextLogo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">الجهة القانونية التابعة:</label>
                      <input 
                        type="text" 
                        value={affiliate}
                        onChange={(e) => setAffiliate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">موقع الويب الخارجي:</label>
                      <input 
                        type="text" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Logo Handling */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700">شعار الملتقى (رفع وتغيير):</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${isDragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && simulateUpload(e.target.files[0].name)} className="hidden" accept="image/*" />
                        <CloudUpload className="h-6 w-6 text-slate-450 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-600 leading-none">اسحب الشعار أو تصفح</span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getLogoNode(logo)}
                          <div>
                            <p className="text-[10px] font-bold text-slate-700">الشعار البصري المقر</p>
                            <p className="text-[9px] text-slate-400">ملف نشط بالصفحة الأولى</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="p-1.5 hover:bg-red-50 text-red-650 hover:text-red-700 border border-transparent hover:border-red-150 rounded"
                          title="حذف وحذف الشعار الحالي"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {uploadProgress && <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded">{uploadProgress}</p>}
                  </div>

                  {/* Themes Colors Palette selection */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">منتقي الألوان وقوالب الهوية البصرية:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                            showToast(`✓ تم تطبيق حزمة ألوان (${preset.name}) على الواجهات بالكامل.`);
                          }}
                          className={`p-1.5 rounded-lg border text-right transition-all flex flex-col justify-between ${primaryColor === preset.primary ? 'border-amber-400 ring-2 ring-amber-100 scale-102' : 'border-slate-150'}`}
                        >
                          <div className="w-full h-2 rounded-xs" style={{ backgroundColor: preset.primary }} />
                          <span className="text-[8px] font-bold text-slate-500 truncate mt-1">{preset.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500">لون مخصص أساسي:</span>
                        <input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => applyCustomPrimary(e.target.value)}
                          className="w-full h-8 rounded border border-slate-200 cursor-pointer bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500">لون مخصص ثانوي:</span>
                        <input 
                          type="color" 
                          value={secondaryColor} 
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-full h-8 rounded border border-slate-200 cursor-pointer bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* UI Style pattern */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">نمط وعمارة الواجهة العامة:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setUiStylePattern('formal')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${uiStylePattern === 'formal' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-slate-50 text-slate-650'}`}
                      >
                        <p className="font-bold text-xs">رسمي إداري</p>
                        <p className="text-[8px] opacity-80 font-medium">حواف حادة، جداول كلاسيكية</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUiStylePattern('educational')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${uiStylePattern === 'educational' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-650'}`}
                      >
                        <p className="font-bold text-xs">تربوي هادئ</p>
                        <p className="text-[8px] opacity-80">ظلال ناعمة، طمأنينة بصرية</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUiStylePattern('interactive')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${uiStylePattern === 'interactive' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-650'}`}
                      >
                        <p className="font-bold text-xs">حديث تفاعلي</p>
                        <p className="text-[8px] opacity-80">توهج وحرية تصميمية</p>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Gender Preferences (Section 2) */}
            {activeSection === 'gender' && (
              <div className="space-y-4 animate-fade-in" id="workbench-gender">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم الثاني: تخصص النظام والنوع (Gender Mode)</h3>
                  <p className="text-slate-450 text-[11px]">يحدد هذا الإعداد قنوات التلوين التلقائي، وعمارة الأيقونات، وكثافة الواجهات لدور البنين أو البنات.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => attemptGenderChange('boys')}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${genderMode === 'boys' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100' : 'border-slate-150 text-slate-600'}`}
                    >
                      <User className="h-6 w-6 text-blue-600" />
                      <p className="font-bold text-xs">ذكور وبنين</p>
                      <p className="text-[8px] text-slate-400">تلوين كحلي/أزرق وقار</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => attemptGenderChange('girls')}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${genderMode === 'girls' ? 'border-pink-500 bg-pink-50 text-pink-950 ring-2 ring-pink-100' : 'border-slate-150 text-slate-600'}`}
                    >
                      <User className="h-6 w-6 text-pink-500" />
                      <p className="font-bold text-xs">إناث وفتيات</p>
                      <p className="text-[8px] text-slate-400">تلوين وردي/نرجسي هادئ</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => attemptGenderChange('mixed')}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${genderMode === 'mixed' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100' : 'border-slate-150 text-slate-600'}`}
                    >
                      <Users className="h-6 w-6 text-indigo-600" />
                      <p className="font-bold text-xs">مختلط شامل</p>
                      <p className="text-[8px] text-slate-400">تلوين رسمي / زمرد رصين</p>
                    </button>
                  </div>

                  {/* Lock features */}
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-2">
                    <div className="flex items-start gap-2.5">
                      <input 
                        type="checkbox" 
                        id="gender-lock-chk"
                        checked={genderModeLocked}
                        onChange={(e) => setGenderModeLocked(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="gender-lock-chk" className="font-bold text-slate-700 text-xs cursor-pointer select-none">
                          تأمين وقفل الإعداد الأساسي هذا
                        </label>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                          عند القفل، سيُمنع إدراج أي تغيير عشوائي أو طائش لهذا الوضع إلا بمكالمة بوند المصادقة العامة عبر كود الأمان المشفر.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backups & Restore (Section 3) */}
            {activeSection === 'backup' && (
              <div className="space-y-4 animate-fade-in" id="workbench-backup">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم الثالث: سياسات النسخ الاحتياطي وعمليات الاسترجاع</h3>
                  <p className="text-slate-450 text-[11px]">مستودع صيانة الجداول وتحفيظ الأرشفة الآمنة لمنع فقدان كشوفات وسجلات الطلاب.</p>
                </div>

                <div className="space-y-4 pt-2">
                  
                  {/* Auto backup interval setting */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650 block">مجدول الأرشفة السحابية التلقائية:</label>
                    <select
                      value={autoBackupInterval}
                      onChange={(e) => {
                        setAutoBackupInterval(e.target.value as any);
                        showToast(`✓ تم تحديث مجدول الأمان ليقوم بالنسخ كل: ${e.target.value === 'disabled' ? 'تعطيل الحماية تلقائياً' : e.target.value}.`);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white font-medium"
                    >
                      <option value="daily">نسخ تلقائي يومي آمن (موصى به صيفاً)</option>
                      <option value="weekly">أوتوماتيكي أسبوعي (الوضع المتزن)</option>
                      <option value="monthly">نسخ احتياطي شهري شامل</option>
                      <option value="disabled">تعطيل وإيقاف الجدولة الآلية (مخاطر عالية)</option>
                    </select>
                  </div>

                  {/* Manual trigger */}
                  <form onSubmit={triggerManualBackup} className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">تحفيز أخذ لقطة فورية (Manual Backup)</p>
                    <div className="space-y-1">
                      <input 
                        type="text"
                        placeholder="دون ملاحظة سريعة (مثال: قبل دمج شعب التوحيد)..."
                        value={backupNote}
                        onChange={(e) => setBackupNote(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Database className="h-4 w-4" />
                      <span>إنشاء نسخة تشغيلية احتياطية الآن</span>
                    </button>
                    <span className="text-[9px] text-slate-400 font-medium block text-center">* يؤدي الضغط إلى حزم كافة بيانات الطلاب السبعة فورا.</span>
                  </form>

                  {/* Past Backups management */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">لقطات الاسترداد السابقة المسجلة:</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {backupsList.map((bk) => (
                        <div key={bk.id} className="p-3 bg-white border border-slate-150 rounded-xl text-xs flex justify-between items-center gap-4">
                          <div className="space-y-0.5">
                            <p className="font-bold font-mono text-[10px] text-slate-800 truncate max-w-[180px]">{bk.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-medium">نوع: {bk.type === 'auto' ? 'أوتوماتيكي' : 'يدوي عالي الصلاحية'} • حجم: {bk.size}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRestoringBackupId(bk.id);
                                setRestorePrimaryConsent(false);
                                setRestoreSecondaryConsent(false);
                              }}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-2 py-1 rounded text-[10px] shadow-3xs"
                            >
                              استعادة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* General Settings (Section 4) */}
            {activeSection === 'general' && (
              <div className="space-y-4 animate-fade-in" id="workbench-general">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم الرابع: إعدادات سلوك العرض والترقيم للنظام</h3>
                  <p className="text-slate-450 text-[11px]">خيارات وقوانين تحدد أسلوب ترقيم الطلاب والسياسات التحفيزية.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 block">اللغة الافتراضية للوحات:</span>
                      <select
                        value={defaultLanguage}
                        onChange={(e) => setDefaultLanguage(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-bold"
                      >
                        <option value="ar">العربية (المعززة بالتجويد)</option>
                        <option value="en">English (Standard)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 block">المنطقة الزمنية الرسمية:</span>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono"
                      >
                        <option value="Asia/Riyadh">توقيت مكة المكرمة (GMT+3)</option>
                        <option value="Asia/Dubai">توقيت دبي الوطني (GMT+4)</option>
                        <option value="Africa/Cairo">توقيت القاهرة الموحد (GMT+2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700">صيغة وهيكل ترقيم الطلاب الجدد بالمنظومة:</span>
                    <input 
                      type="text" 
                      value={studentIdFormat}
                      onChange={(e) => setStudentIdFormat(e.target.value)}
                      placeholder="ST-000000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none bg-white font-bold"
                    />
                    <span className="text-[9px] text-slate-400 font-medium">* سيقوم النظام تلقائياً بالحشو الرقمي بناءً على هذا الهيكل (ST-000001، ST-000002).</span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-750 block">سياسات وإشارات الرصد التلقائي:</span>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">تفعيل المؤشر التعليمي العام</p>
                        <p className="text-[9px] text-slate-400">يزود المدير برسم تخطيطي لقدرات الحفظ.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableEduIndicators}
                        onChange={(e) => setEnableEduIndicators(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">تفعيل نظام التنبيهات الذكية (Smart Alerts)</p>
                        <p className="text-[9px] text-slate-400">يرصد أوتوماتيكياً تراجع وتحت المراقبة.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableSmartAlerts}
                        onChange={(e) => setEnableSmartAlerts(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">التقارير القياسية والتحاليل التلقائية</p>
                        <p className="text-[9px] text-slate-400">إرسال كشوف الحضور لولي الأمر شهرياً.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableAutoReports}
                        onChange={(e) => setEnableAutoReports(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">مستوى إدلاء التفاصيل بالأدوات</p>
                        <p className="text-[9px] text-slate-400">حجم البيانات المفرزة للمشرف.</p>
                      </div>
                      <div className="bg-slate-100 p-0.5 rounded flex gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setInterfaceDetailLevel('brief')}
                          className={`p-1 px-2.5 rounded ${interfaceDetailLevel === 'brief' ? 'bg-white shadow-3xs' : 'text-slate-400'}`}
                        >
                          مختصر
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterfaceDetailLevel('detailed')}
                          className={`p-1 px-2.5 rounded ${interfaceDetailLevel === 'detailed' ? 'bg-white shadow-3xs' : 'text-slate-400'}`}
                        >
                          تفصيلي
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* UI Behavior settings (Section 5) */}
            {activeSection === 'behavior' && (
              <div className="space-y-4 animate-fade-in" id="workbench-behavior">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم الخامس: سلوك العرض وعموم الواجهات للمتصفح</h3>
                  <p className="text-slate-450 text-[11px]">إعدادات تؤثر حصرياً على طريقة تقديم وحسابات الفلترة والشاشات المقتضبة.</p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">حجم الخط الافتراضي باللوحات:</span>
                    <select
                      value={defaultFontSize}
                      onChange={(e) => setDefaultFontSize(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-bold"
                    >
                      <option value="small">صغير (مقتضب للمشرفين - 14px)</option>
                      <option value="medium">متوسط متناسق كلاسيكي (16px)</option>
                      <option value="large">كبير مقروء مريح (18px)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">كثافة وازدحام الجداول (Density):</span>
                    <select
                      value={tableDensity}
                      onChange={(e) => setTableDensity(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-bold"
                    >
                      <option value="dense">مكتنز ومضغوط (مساحات رصد واسعة)</option>
                      <option value="comfortable">مسترسل ومريح (سلاسة بالقراءة)</option>
                    </select>
                  </div>

                  {/* toggles */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-805">إظهار المؤشرات السريعة بالمقدمة</p>
                        <p className="text-[9px] text-slate-400">رموز ومربعات إحصائية تحت التسميع.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={showQuickIndicators}
                        onChange={(e) => setShowQuickIndicators(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-805">تفعيل مؤثرات وحركات البطاقات التفاعلية</p>
                        <p className="text-[9px] text-slate-400">حركات انزلاقية للأزرار والمصنفات.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableInteractiveCards}
                        onChange={(e) => setEnableInteractiveCards(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-805">نمط رصد تصنيف القوائم بالشعبة:</p>
                        <p className="text-[9px] text-slate-400">الترتيب الطبيعي للشاشات المزدوجة.</p>
                      </div>
                      <div className="bg-slate-100 p-0.5 rounded flex gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setViewLayoutStyle('table')}
                          className={`p-1 px-2 rounded ${viewLayoutStyle === 'table' ? 'bg-white shadow-3xs' : 'text-slate-400'}`}
                        >
                          جدول إملائي
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewLayoutStyle('cards')}
                          className={`p-1 px-2 rounded ${viewLayoutStyle === 'cards' ? 'bg-white shadow-3xs' : 'text-slate-400'}`}
                        >
                          شبكة بطاقات
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Configuration Templates section */}
            {activeSection === 'templates' && (
              <div className="space-y-4 animate-fade-in" id="workbench-templates">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم السادس: إدارة قبال وقوالب التكوين المجهزة</h3>
                  <p className="text-slate-450 text-[11px]">تحميل حزمة إعدادات كاملة مسبقة ومصادق عليها لتفادي التخصيص اليدوي الطويل.</p>
                </div>

                <div className="space-y-3 pt-2" id="academy-preset-cards">
                  
                  <div 
                    onClick={() => handleLoadTemplatePreset('small')}
                    className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-pointer text-right flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-850 text-xs">ملتقى قرآني صغير (Small School)</p>
                      <p className="text-[10px] text-slate-400">واجهات موجزة، نسخ أمان شهري، حماية غياب مرنة.</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-450 shrink-0" />
                  </div>

                  <div 
                    onClick={() => handleLoadTemplatePreset('medium')}
                    className="p-3 border border-indigo-100 bg-indigo-50/20 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer text-right flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-indigo-950 text-xs">ملتقى متوسط معتدل (Standard Policy)</p>
                      <p className="text-[10px] text-indigo-700">توازن تام للألوان، نسخ أمان أسبوعي ترحيلي، كامل المؤشرات.</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-indigo-400 shrink-0" />
                  </div>

                  <div 
                    onClick={() => handleLoadTemplatePreset('large')}
                    className="p-3 border border-slate-150 bg-slate-50/50 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-right flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-850 text-xs">صرح وأكاديمية كبرى وقراءات (Large Academy)</p>
                      <p className="text-[10px] text-slate-400">جداول مكثفة للغاية، خطوط مريحة للحفاظ، نسخ يومي آمن.</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-450 shrink-0" />
                  </div>

                  {/* bulk custom actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleExportTemplate}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Download className="h-4 w-4 text-[inherit]" />
                      <span>تصدير هذا التكوين</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleImportTemplate}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Upload className="h-4 w-4 text-[inherit]" />
                      <span>استيراد كود تهيئة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rollbacks and change logs history */}
            {activeSection === 'history' && (
              <div className="space-y-4 animate-fade-in" id="workbench-history">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">القسم التاسع: أرشيف سجل التغييرات والتراجع الفوري</h3>
                  <p className="text-slate-450 text-[11px]">مراجعة تاريخية للتهيئة التشغيلية مع إمكانية التصفير أو الرجوع التدريجي بنقرة زر.</p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {configHistory.map((hist, idx) => (
                    <div 
                      key={hist.id}
                      className="p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl space-y-2 text-xs hover:border-slate-3 w-full"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span className="font-mono">{new Date(hist.timestamp).toLocaleString('ar-SA')}</span>
                        <span className="bg-emerald-50 text-emerald-800 p-0.5 px-2 rounded-sm">{hist.operator}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{hist.changesSummary}</p>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-100/60">
                        <button
                          type="button"
                          onClick={() => executeRollback(hist)}
                          className="bg-white border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-3xs"
                        >
                          <RefreshCcw className="h-3 w-3 text-slate-500" />
                          <span>تراجع واستعادة هذا التكوين</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN - 3 COLS: SECTION 7: SETTINGS IMPACT SIMULATOR (STICKY VISUAL VIEWPORT) */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-5 pb-6 space-y-4 sticky top-4" id="visual-impact-simulator-viewport">
            <div className="border-b border-white/10 pb-2 flex justify-between items-center">
              <div>
                <span className="bg-indigo-900 border border-indigo-750 text-indigo-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                  القسم 7
                </span>
                <h3 className="font-bold text-white text-xs font-display flex items-center gap-1.5 mt-1">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  محاكي ومظاهر بيئة النظام الحية
                </h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="الاستشعار التفاعلي نشط" />
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
              يقوم المحاكي أدناه بلصق خياراتك الحالية للألوان، النمط، النوع والكثافة واختبارها على قالب بطاقات الطلاب وجداول المدير قبل الحفظ المعتمد.
            </p>

            {/* Simulated Live Frame */}
            <div className={`p-4 rounded-xl border border-white/5 space-y-4 relative overflow-hidden transition-all duration-300 ${
              uiStylePattern === 'formal' ? 'bg-slate-950 rounded-xs' : 
              uiStylePattern === 'interactive' ? 'bg-slate-900 border-indigo-805 shadow-[0_0_15px_rgba(124,58,237,0.15)]' :
              'bg-slate-850/40 border-slate-800/80 rounded-2xl'
            }`} id="simulator-sandbox-frame">
              
              {/* Simulation Label tag */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold text-indigo-300">SANDBOX SIMULATION VIEW</span>
                <span className="text-[8px] bg-white/5 p-0.5 px-2 rounded-sm text-slate-400">حجم: {defaultFontSize}</span>
              </div>

              {/* Demostration Element 1: Student Record */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-450 font-bold border-r border-slate-700 pr-1">واجهة عرض الطلاب (معاينة):</p>
                <div className={`transition-all duration-300 ${tableDensity === 'dense' ? 'p-2 space-y-1' : 'p-3.5 space-y-2'} rounded-lg border border-white/10 bg-white/5`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[9px]">
                        {genderMode === 'girls' ? '👩‍🎓' : '👨‍🎓'}
                      </div>
                      <div>
                        {/* Gender text changes */}
                        <p className="font-bold text-[10px] text-white">
                          {genderMode === 'girls' ? 'الفتات: مريم بنت أحمد الأنصاري' : 'الطالب: معاذ بن خالد اليوسف'}
                        </p>
                        <p className="text-[8px] text-slate-400 font-mono">الرقم الفني: {studentIdFormat.replace('000000', '142')}</p>
                      </div>
                    </div>
                    {/* Primary color highlights dynamic badge */}
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
                      ممتاز 98%
                    </span>
                  </div>

                  <div className="text-[9px] text-slate-350 bg-white/5 p-1 rounded font-mono flex justify-between items-center text-right font-medium">
                    <span>المنجز: ٣ أجزاء بالتجويد</span>
                    <span className="text-emerald-400">الالتزام: ٩٦%</span>
                  </div>
                </div>
              </div>

              {/* Demostration Element 2: Executive stats card widget */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-450 font-bold border-r border-slate-700 pr-1">بطاقات لوحة الإحصاءات وإشارات الرصد:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2.5 rounded-lg border bg-white/5 text-right space-y-1 transition-all ${uiStylePattern === 'formal' ? 'border-amber-500/40 text-slate-200' : 'border-white/5 text-indigo-100'}`}>
                    <p className="text-[9px] text-slate-400 font-bold">مجموع خط السند</p>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-xs">١٦ مجازاً</span>
                      <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/5 text-right space-y-1" style={{ borderLeftColor: primaryColor }}>
                    <p className="text-[9px] text-slate-400 font-bold">نسبة الالتزام</p>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-xs">٩٢.١ %</span>
                      <span className="w-1.5 h-1.5 rounded bg-sky-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Demostration Element 3: Display Style feedback indicator */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold">المنطقة الزمنية:</span>
                <span className="font-mono text-emerald-400 font-bold">{timezone}</span>
              </div>

            </div>

            {/* Clear reset options triggers inside sidebar */}
            <div className="space-y-2 pt-2 text-[11px] font-bold text-center">
              <button
                type="button"
                onClick={() => {
                  setPrimaryColor('#059669');
                  setSecondaryColor('#ecfdf5');
                  setUiStylePattern('educational');
                  setGenderMode('mixed');
                  setTableDensity('comfortable');
                  setDefaultFontSize('medium');
                  showToast('✓ تمت استعادة إعدادات المصنع البصرية لنمط الألوان والخطوط.');
                }}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>إعادة تعيين لمعايير المصنع</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: RESTORE BACKUP PROTECTION DOUBLE CONSENT GUARD (Section 3) */}
      {restoringBackupId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="security-restore-panel">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-150 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-red-650">
              <div className="p-2.5 rounded-full bg-red-50 border border-red-100 animate-pulse text-red-700">
                <AlertTriangle className="h-6 w-6 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-slate-805 font-display text-sm sm:text-base">بروتوكول الأمان الدستوري والموافقة الصارمة</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">مطلوب موافقة المدير العام المسجلة فورا قبل الاستدعاء.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 leading-normal text-xs font-semibold">
              <p className="text-slate-400 font-bold">الملف المستهدف للاسترداد وتجميد الجداول الحالية:</p>
              <p className="font-mono text-indigo-950 text-[11px] font-bold truncate">
                {backupsList.find(b => b.id === restoringBackupId)?.fileName}
              </p>
              <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between items-center text-[10px] text-slate-450 font-semibold">
                <span>تاريخ الأرشفة: V2.4.1</span>
                <span>المشغل: مجدول الأمان التلقائي</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs font-semibold">
              {/* Double Confirm Checkboxes */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2 text-indigo-950">
                <input 
                  type="checkbox" 
                  id="primary-consent-chk"
                  checked={restorePrimaryConsent}
                  onChange={(e) => setRestorePrimaryConsent(e.target.checked)}
                  className="rounded border-slate-200 text-indigo-600 mt-1 cursor-pointer"
                />
                <label htmlFor="primary-consent-chk" className="cursor-pointer select-none leading-relaxed">
                  أنبه وأقر نحن إدارة الملتقى بأن هذا الإجراء سيقوم باستبدال واستعادة كافة البيانات بملفات النسخة التاريخية وحذف الفترات الحالية تماماً.
                </label>
              </div>

              <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex items-start gap-2 text-red-950">
                <input 
                  type="checkbox" 
                  id="secondary-consent-chk"
                  checked={restoreSecondaryConsent}
                  onChange={(e) => setRestoreSecondaryConsent(e.target.checked)}
                  className="rounded border-red-200 text-red-700 mt-1 cursor-pointer"
                />
                <label htmlFor="secondary-consent-chk" className="cursor-pointer select-none leading-relaxed">
                  أوافق تماماً على تسجيل عنوان IP الفني وبصمة الدخول لقرارات التراجع والمراجعة الوقائية بجداول العمليات الرسمية بالخادم.
                </label>
              </div>

              {/* Pin confirmation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">اكتب رمز التأكيد النهائي لقفل العملية (اكتب "استعادة"):</span>
                <input 
                  type="text"
                  placeholder="اكتب كلمة استعادة هنا للتوثيق"
                  value={restoreDoubleCode}
                  onChange={(e) => setRestoreDoubleCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center text-xs font-display focus:outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestoringBackupId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold"
                >
                  إلغاء وإيقاف الاسترجاع
                </button>
                <button
                  type="button"
                  onClick={executeRestorePoint}
                  disabled={!restorePrimaryConsent || !restoreSecondaryConsent || restoreDoubleCode !== 'استعادة' || isRestoring}
                  className={`px-5 py-2 rounded-xl text-xs font-bold font-display shadow-xs ${
                    restorePrimaryConsent && restoreSecondaryConsent && restoreDoubleCode === 'استعادة' && !isRestoring
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                      : 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  {isRestoring ? 'جاري الفك المبرمج...' : 'نعم، ابدأ الاستعادة الكاملة'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: GENDER UNLOCK DIALOG CODES (Section 2) */}
      {showGenderUnlockDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-150 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-700">
              <Lock className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-slate-800 font-display text-sm">فك تأمين وقفل وضع الصرح (Gender UI Lock)</h3>
            </div>
            
            <p className="text-slate-500 text-xs leading-normal font-semibold">
              هذا الإعداد مغلق ومؤمن حالياً بواسطة المدير لحماية النظام من التبديل المفاجئ. لفك التأمين، اضغط أدناه لفتح القفل.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowGenderUnlockDialog(false)}
                className="px-4 py-2 hover:bg-slate-50 border border-slate-150 rounded-xl font-bold"
              >
                إبقاء القفل مغلقاً
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenderModeLocked(false);
                  setShowGenderUnlockDialog(false);
                  showToast('✓ تم تفكيك وإلغاء القفل. يمكنك تعديل نمط النوع (ذكور/إناث) بحرّية الآن.');
                }}
                className="bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl font-bold"
              >
                فك القفل فوراً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DOUBLE SAVE CONFIRMATION (Section 8) */}
      {showDoubleSaveConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="double-confirm-manager-action">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-150 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-full bg-slate-100 border border-slate-205">
                <Check className="h-5 w-5 shrink-0 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display text-sm sm:text-base">تحريز وتطبيق التهيئة العامة للنظام</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">مطلوب مصادقة من رتبة المدير العام لتطبيق الهيكل الجديد.</p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-655 space-y-3 leading-relaxed">
              <p>ستقوم هذه العملية بترحيل وتعميم الهوية البصرية الحالية، سياسات النسخ التلقائي ({autoBackupInterval})، صيغة ترقيم الطلاب، وتوهج الألغاز البصرية على كامل المنصة.</p>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 block font-bold">أدخل كود تأكيد الحفظ العام (اكتب "حفظ"):</span>
                <input 
                  type="text"
                  placeholder='اكتب كلمة حفظ للمتابعة'
                  value={doubleConfirmSaveCode}
                  onChange={(e) => setDoubleConfirmSaveCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowDoubleSaveConfirm(false);
                  setDoubleConfirmSaveCode('');
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold"
              >
                إلغاء المعايرة
              </button>
              <button
                type="button"
                onClick={executeSaveConfirmed}
                disabled={doubleConfirmSaveCode !== 'حفظ'}
                className={`px-5 py-2 rounded-xl font-bold ${
                  doubleConfirmSaveCode === 'حفظ'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200'
                }`}
              >
                تحديث وتعميم التهيئة فورا
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
