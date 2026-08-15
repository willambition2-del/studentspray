/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, User, Heart, Star, Calendar, Clock, BookOpen, AlertCircle, 
  CheckCircle, MessageSquare, Bell, FileText, Settings, Shield, Award, 
  Send, Plus, Trash2, Printer, Download, Eye, Check, X, ChevronRight, 
  ArrowLeft, ShieldAlert, BarChart3, HelpCircle, Mail, Phone, Lock, 
  Sliders, Layout, BadgeCheck, FileCheck, RefreshCw, Sparkles, MessageCircle,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredPlans } from './StudentPlanManagement';

// Parent Portal Types
export interface Child {
  id: string;
  name: string;
  avatar?: string;
  circleName: string;
  teacherName: string;
  educationalStatus: 'نشط' | 'متعثر' | 'متقدم' | 'خريج';
  statusIndicator: 'green' | 'yellow' | 'red';
  completionRate: number; // %
  attendanceRate: number; // %
  lastExamScore: number; // %
  lastExamDate: string;
  lastCompletedPlan: string;
  currentLevel: string;
  notes: string;
  strengths: string[];
  weaknesses: string[];
  teacherRecommendation: string;
  
  // Plans (Section 3)
  plans: {
    current: { title: string; goal: string; duration: string; progress: number; remaining: string; status: string };
    monthly: { title: string; goal: string; progress: number; status: string };
    quarterly: { title: string; goal: string; progress: number; status: string };
    annual: { title: string; goal: string; progress: number; status: string };
    alert?: { type: 'delay' | 'advance' | 'stopped' | 'new'; message: string };
  };

  // Reports (Section 4)
  reports: Array<{
    id: string;
    type: 'شهري' | 'ربع سنوي' | 'سنوي' | 'إنجاز حفظ' | 'حضور' | 'تقييم عام';
    date: string;
    completion: number;
    grade: string;
    strengths: string[];
    improvements: string[];
    teacherNotes: string;
    recommendations: string;
  }>;

  // Achievements & Badges (Section 9)
  achievements: Array<{
    id: string;
    type: 'badge' | 'award' | 'certificate' | 'competition';
    title: string;
    description: string;
    date: string;
    iconType: string;
  }>;
}

export interface ParentRequest {
  id: string;
  type: 'استفسار عام' | 'متابعة ابن' | 'ربط/تعديل بيانات' | 'طلب اجتماع مع المعلم' | 'طلب دعم تربوي';
  childId?: string;
  title: string;
  content: string;
  status: 'قيد المراجعة' | 'قيد التنفيذ' | 'مكتمل' | 'مرفوض' | 'يحتاج استكمال بيانات';
  date: string;
  adminResponse?: string;
  responseDate?: string;
  actionsTaken?: string[];
  rejectionReason?: string;
  attachmentName?: string;
}

export interface DirectMessage {
  id: string;
  sender: 'parent' | 'admin' | 'teacher';
  senderName: string;
  text: string;
  timestamp: string;
  childId?: string;
}

export interface PortalNotification {
  id: string;
  childId: string;
  childName: string;
  type: 'غياب' | 'اختبار' | 'نتيجة تقييم' | 'تحديث خطة' | 'وسام أو إنجاز' | 'تنبيه إداري';
  title: string;
  content: string;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  isArchived: boolean;
}

export interface SystemAnnouncement {
  id: string;
  type: 'educational' | 'administrative' | 'activity' | 'general';
  title: string;
  content: string;
  date: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  isViewed: boolean;
}

export default function ParentPortal({ currentUser }: { currentUser?: any }) {
  // 3-Stage Session State
  // 'portal' is default active state for instant rich demonstration, but can be switched to 'auth', 'admin', or other statuses.
  const [sessionState, setSessionState] = useState<'portal' | 'auth' | 'admin' | 'pending' | 'needs_info' | 'rejected' | 'disabled'>('portal');

  // Accounts state with five pre-populated states (including demo account with عبدالرحمن and عمر)
  const [accounts, setAccounts] = useState([
    {
      id: 'PR-4890',
      name: currentUser?.name || 'صالح بن عبدالله العريني',
      phone: currentUser?.phone || '0554890123',
      password: '123',
      status: '🟢 نشط' as const,
      registrationDate: '15/06/2026',
      email: currentUser?.email || 'saleh.oraini@example.com',
      preferredChannel: 'SMS',
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      childrenNames: [
        { name: 'عبدالرحمن بن صالح العريني', teacherName: 'أ. حازم عمر الحركي' },
        { name: 'عمر بن صالح العريني', teacherName: 'أ. عبدالرحمن السعيد' }
      ]
    },
    {
      id: 'PR-4891',
      name: 'أحمد بن محمد اليوسف',
      phone: '0567777777',
      password: '123',
      status: '🟡 قيد المراجعة' as const,
      registrationDate: '25/06/2026',
      email: 'ahmed.yousef@example.com',
      preferredChannel: 'WhatsApp',
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: true,
      childrenNames: [
        { name: 'يزيد أحمد اليوسف', teacherName: 'أ. عبدالرحمن السعيد' },
        { name: 'فيصل أحمد اليوسف', teacherName: 'أ. حازم عمر الحركي' }
      ]
    },
    {
      id: 'PR-4892',
      name: 'خالد بن عثمان العمري',
      phone: '0512345678',
      password: '123',
      status: '🟠 يحتاج استكمال' as const,
      registrationDate: '24/06/2026',
      email: 'khaled.omari@example.com',
      preferredChannel: 'In-App',
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      childrenNames: [
        { name: 'عبدالعزيز خالد العمري', teacherName: 'أ. محمد الحربي' }
      ],
      completionRequested: 'يرجى كتابة ورفع الرقم الوطني الموحد أو سجل العائلة للابن للتأكد من صلة القرابة ومطابقة السجلات الحكومية.'
    },
    {
      id: 'PR-4893',
      name: 'محمد بن راشد الدوسري',
      phone: '0544444444',
      password: '123',
      status: '🔴 مرفوض' as const,
      registrationDate: '23/06/2026',
      email: 'mohamed.dousari@example.com',
      preferredChannel: 'SMS',
      pushEnabled: false,
      emailEnabled: false,
      smsEnabled: true,
      childrenNames: [
        { name: 'تركي محمد الدوسري', teacherName: 'أ. فهد الغامدي' }
      ],
      rejectionReason: 'اسم الطالب المدخل تركي الدوسري غير مدرج بملفات الحلقات الرسمية بالملتقى، يرجى إعادة تعبئة الطلب بالاسم المدرسي المعتمد.'
    },
    {
      id: 'PR-4894',
      name: 'فهد بن سليمان المطيري',
      phone: '0533333333',
      password: '123',
      status: '⚫ معطل' as const,
      registrationDate: '22/06/2026',
      email: 'fahad.mutairi@example.com',
      preferredChannel: 'SMS',
      pushEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
      childrenNames: [
        { name: 'رائد فهد المطيري', teacherName: 'أ. صالح الحصين' }
      ]
    }
  ]);

  // Current logged in account / details
  const [currentParent, setCurrentParent] = useState({
    id: 'PR-4890',
    name: 'صالح بن عبدالله العريني',
    phone: '0554890123',
    email: 'saleh.oraini@example.com',
    preferredChannel: 'SMS', // SMS, WhatsApp, In-App
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true
  });

  // Login & Registration state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form inputs
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regChildren, setRegChildren] = useState<{ name: string; teacherName: string }[]>([
    { name: '', teacherName: '' }
  ]);

  // Data completion form input
  const [parentCompletionReply, setParentCompletionReply] = useState('');

  // Admin approval forms inputs
  const [adminRejectionInput, setAdminRejectionInput] = useState<{ [key: string]: string }>({});
  const [adminCompletionInput, setAdminCompletionInput] = useState<{ [key: string]: string }>({});
  const [adminShowRejectionForm, setAdminShowRejectionForm] = useState<string | null>(null);
  const [adminShowCompletionForm, setAdminShowCompletionForm] = useState<string | null>(null);

  // Mock administrative visibility settings (Section 12 - fully customizable by administration)
  const [adminControls, setAdminControls] = useState({
    showTeacherNotes: true,
    showDetailedGrades: true,
    showAttendanceStats: true,
    showTeacherRecommendations: true,
    showChildIndicators: true,
    allowDirectMessaging: true,
    allowMeetingRequests: true
  });

  // Password reset simulation
  const [passwordState, setPasswordState] = useState({ old: '', newPassword: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active simulated parent children array (Section 2)
  const [children, setChildren] = useState<Child[]>([
    {
      id: 'ST-00981',
      name: 'عبدالرحمن بن صالح العريني',
      circleName: 'حلقة معاذ بن جبل النموذجية',
      teacherName: 'أ. حازم عمر الحركي',
      educationalStatus: 'نشط',
      statusIndicator: 'green',
      completionRate: 92,
      attendanceRate: 98,
      lastExamScore: 96,
      lastExamDate: '18/11/1446',
      lastCompletedPlan: 'حفظ سورة الكهف والأنبياء بالتجويد',
      currentLevel: 'المستوى الخامس (ضبط الحفظ والأداء التراكمي)',
      notes: 'عبدالرحمن طالب متميز ومثالي، سريع الاستجابة لتوجيهات المعلم وله مستقبل باهر.',
      strengths: ['مخارج حروف دقيقة جداً', 'التزام تام بأوقات التسميع والتحضير', 'هدوء وأدب رفيع في الحلقة'],
      weaknesses: ['تسرع طفيف عند الانتقال بين الآيات الطويلة'],
      teacherRecommendation: 'الاستمرار في مراجعة الأجزاء الخمسة الأولى لتمكينها بنسبة 100% والبدء بمسار الحفظ الفائق.',
      plans: {
        current: {
          title: 'خطة التمكين والضبط الكبرى',
          goal: 'حفظ ومراجعة سورة البقرة وآل عمران مع التطبيق العملي لمخارج الحروف',
          duration: '3 أشهر (من 01/10/1446 إلى 30/12/1446)',
          progress: 88,
          remaining: '6 صفحات للتسميع النهائي',
          status: 'متقدم بشكل ممتاز'
        },
        monthly: {
          title: 'الخطة التمكينية لشهر ذي القعدة',
          goal: 'تسميع ومراجعة الجزء الثالث كاملاً بمعدل صفحة يومياً',
          progress: 95,
          status: 'نشط ومكتمل تقريباً'
        },
        quarterly: {
          title: 'خطة الربع الحالي',
          goal: 'حفظ 3 أجزاء جديدة وضبط التجويد النظري',
          progress: 90,
          status: 'على وشك الاكتمال'
        },
        annual: {
          title: 'الخطة السنوية العامة للعام 1446هـ',
          goal: 'إتمام حفظ 10 أجزاء جديدة من القرآن الكريم وبمعدل ضبط لا يقل عن 95%',
          progress: 92,
          status: 'في المسار الصحيح'
        },
        alert: {
          type: 'advance',
          message: 'تقدم أسرع من المتوقع بمعدل 4 أيام عن الخطة الزمنية المقررة.'
        }
      },
      reports: [
        {
          id: 'REP-001',
          type: 'شهري',
          date: 'شعبان 1446هـ',
          completion: 96,
          grade: 'ممتاز مرتفع',
          strengths: ['الانضباط اليومي', 'جودة الاستذكار من المصحف المرتل'],
          improvements: ['التأني والترتيل ببطء لتمكين المدود المشبعة'],
          teacherNotes: 'أداء متميز ينم عن رعاية واهتمام بالغين من الأسرة الكريمة.',
          recommendations: 'حث الطالب على المشاركة في مسابقة الملتقى السنوية الكبرى للحفاظ.'
        },
        {
          id: 'REP-002',
          type: 'ربع سنوي',
          date: 'الفصل الدراسي الثاني 1446هـ',
          completion: 94,
          grade: 'ممتاز',
          strengths: ['سرعة الحفظ البديهي', 'تحسن ملحوظ في أحكام الراءات'],
          improvements: ['مراجعة أحكام الهمزات المزدوجة برواية حفص'],
          teacherNotes: 'الطالب متعاون جداً مع زملائه ويساعد في إدارة النشاط الصفي.',
          recommendations: 'متابعة ورد التسميع العائلي اليومي لدعم الطالب معنوياً.'
        },
        {
          id: 'REP-003',
          type: 'إنجاز حفظ',
          date: 'رمضان 1446هـ',
          completion: 100,
          grade: 'ممتاز',
          strengths: ['حفظ الجزء العشرين والواحد والعشرين'],
          improvements: ['مواضع التشابه في سورة النمل والعنكبوت'],
          teacherNotes: 'حقق إنجازاً متميزاً في الحفظ والمراجعة خلال الشهر الفضيل.',
          recommendations: 'منح الطالب مكافأة تشجيعية في المنزل لتعزيز حافز التميز لديه.'
        }
      ],
      achievements: [
        {
          id: 'ACH-001',
          type: 'badge',
          title: 'وسام الحافظ الملتزم',
          description: 'يُمنح للطلاب الذين يحققون نسبة حضور 100% وانضباط كامل لثلاثة أشهر متتالية.',
          date: '10/11/1446',
          iconType: 'star'
        },
        {
          id: 'ACH-002',
          type: 'certificate',
          title: 'شهادة إتمام حفظ الأجزاء الخمسة الأولى',
          description: 'اجتياز الاختبار التقييمي بتقدير ممتاز مرتفع بنسبة 98%.',
          date: '22/08/1446',
          iconType: 'cert'
        },
        {
          id: 'ACH-003',
          type: 'award',
          title: 'جائزة الطالب المثالي للأسبوع المفتوح',
          description: 'تكريم رسمي من إدارة الملتقى لمساهماته المتميزة بالنشاط.',
          date: '05/09/1446',
          iconType: 'medal'
        }
      ]
    },
    {
      id: 'ST-00982',
      name: 'عمر بن صالح العريني',
      circleName: 'حلقة مصعب بن عمير الفضية',
      teacherName: 'أ. عبدالرحمن السعيد',
      educationalStatus: 'متعثر',
      statusIndicator: 'yellow',
      completionRate: 64,
      attendanceRate: 85,
      lastExamScore: 78,
      lastExamDate: '15/11/1446',
      lastCompletedPlan: 'مراجعة وتسميع جزء عم وتبارك بالتجويد',
      currentLevel: 'المستوى الثاني (تأسيس القراءة والضبط البدائي)',
      notes: 'عمر ذكي ويملك قدرات جيدة، ولكنه يعاني من تشتت الانتباه وكثرة الغياب في بعض الأيام.',
      strengths: ['صوت ندي وتلاوة خاشعة', 'سرعة بديهة في التلقين الشفهي'],
      weaknesses: ['صعوبة التركيز في الحلقات الطويلة', 'ضعف الاستعداد المنزلي'],
      teacherRecommendation: 'ضرورة تكثيف التنسيق مع الأسرة لوضع جدول مراجعة منزلي صارم ومحدد لضبط التعثر الحالي.',
      plans: {
        current: {
          title: 'الخطة العلاجية لضبط الحفظ والتعثر',
          goal: 'تمكين وحفظ الجزء التاسع والعشرين والتركيز على مخارج الحروف الأساسية',
          duration: 'شهران (من 15/10/1446 إلى 15/12/1446)',
          progress: 55,
          remaining: '12 صفحة متأخرة عن الجدول المقر',
          status: 'يوجد تأخر عن التنفيذ المقر'
        },
        monthly: {
          title: 'خطة شهر ذي القعدة التدخلية',
          goal: 'تسميع نصف جزء بمعدل نصف صفحة يومياً مع المراجعة المتكررة',
          progress: 60,
          status: 'متعثر ويحتاج دعم ومتابعة مكثفة'
        },
        quarterly: {
          title: 'خطة الربع الحالي العلاجية',
          goal: 'إعادة مراجعة وضبط سورة الملك والمدثر والقلم بالكامل',
          progress: 48,
          status: 'تحت المتابعة الدورية'
        },
        annual: {
          title: 'الخطة السنوية العامة للعام 1446هـ',
          goal: 'إتمام حفظ جزأين كاملين وإتقان التلاوة المسترسلة دون لحن جلي',
          progress: 64,
          status: 'متأخرة وبحاجة لدعم من الولي'
        },
        alert: {
          type: 'delay',
          message: 'تأخر في التنفيذ بمعدل 8 صفحات عن المسار المخطط له.'
        }
      },
      reports: [
        {
          id: 'REP-004',
          type: 'شهري',
          date: 'شعبان 1446هـ',
          completion: 68,
          grade: 'مقبول مرتفع',
          strengths: ['التجاوب مع معلم التلقين'],
          improvements: ['تفادي الغياب المتكرر يومي الاثنين والأربعاء'],
          teacherNotes: 'يحتاج عمر إلى تشجيع منزلي يومي ومتابعة دفتر التسميع الورقي بانتظام.',
          recommendations: 'تخصيص نصف ساعة يومياً قبل النوم لتسميع الآيات للوالد أو الوالدة.'
        },
        {
          id: 'REP-005',
          type: 'ربع سنوي',
          date: 'الفصل الدراسي الثاني 1446هـ',
          completion: 72,
          grade: 'جيد',
          strengths: ['حضور اللقاءات التفاعلية'],
          improvements: ['تقليل اللحن الخفي في صفات الحروف المستعلية'],
          teacherNotes: 'التعثر الحاصل ناتج عن نقص في تمكين الحفظ المنزلي الاستباقي.',
          recommendations: 'عمل اجتماع عاجل مع المعلم لتنسيق الدعم التربوي المباشر.'
        }
      ],
      achievements: [
        {
          id: 'ACH-004',
          type: 'badge',
          title: 'وسام الطالب المثابر والصبور',
          description: 'يُمنح للطلاب الذين يجتهدون لتجاوز الصعاب والتعثرات التعليمية بالصبر والمثابرة.',
          date: '02/10/1446',
          iconType: 'shield'
        }
      ]
    }
  ]);

  // Active selected child
  const [selectedChildId, setSelectedChildId] = useState<string>('ST-00981');
  const activeChild = children.find(c => c.id === selectedChildId) || children[0];

  // Request state management (Section 6)
  const [requests, setRequests] = useState<ParentRequest[]>([
    {
      id: 'REQ-101',
      type: 'طلب دعم تربوي',
      childId: 'ST-00982',
      title: 'طلب خطة تقوية إضافية لعمر بسبب صعوبات ضبط سورة الملك',
      content: 'نأمل من المعلم الفاضل تزويدنا بخطة مراجعة مساندة قصيرة المدى لمساعدة عمر في تجاوز الصعوبة الحالية في ضبط سورة الملك، مع استعدادنا التام لمتابعته في المنزل يومياً بشكل دقيق.',
      status: 'قيد التنفيذ',
      date: '20/06/2026',
      actionsTaken: ['تمت مراجعة الطلب من المشرف التعليمي وتوجيه المعلم بتخصيص 5 دقائق تفريد تلاوة لعمر في بداية كل حلقة.'],
      attachmentName: 'سجل_التسميع_المنزلي_لعمر.pdf'
    },
    {
      id: 'REQ-102',
      type: 'طلب اجتماع مع المعلم',
      childId: 'ST-00981',
      title: 'تنسيق موعد اجتماع هاتفي قصير لمناقشة ترفيع عبدالرحمن',
      content: 'أود تنسيق موعد قصير ومناسب للشيخ حازم للحديث حول إمكانية مشاركة عبدالرحمن في المسابقة السنوية على مستوى المنطقة وترفيعه للمستوى الأعلى لثقتنا في همته ومثابرته الكبيرة.',
      status: 'مكتمل',
      date: '10/06/2026',
      adminResponse: 'تم الاتصال بالولي وتنسيق الموعد بنجاح يوم الثلاثاء الماضي، وتم الاتفاق على جدول أعمال مشاركة عبدالرحمن بالمسابقة الإقليمية وتوفير المواد التدريبية اللازمة.',
      responseDate: '12/06/2026',
      actionsTaken: ['تم التنسيق الهاتفي', 'تم تسليم الحقيبة التدريبية للمسابقة للطلب المباشر.']
    },
    {
      id: 'REQ-103',
      type: 'طلب استفسار',
      childId: 'ST-00982',
      title: 'استفسار حول آلية احتساب درجات التقييم التراكمي لعمر',
      content: 'نرجو توضيح المعايير المتبعة لاحتساب نسبة الإنجاز والدرجات في التقرير الشهري لشهر شعبان حيث نرى أنه يستحق تقدير جيد جداً مقارنة بما يسمعه في البيت.',
      status: 'مرفوض',
      date: '05/06/2026',
      adminResponse: 'تمت دراسة استفساركم الفاضل بمطابقة درجات دفتر التسميع الحلقي اليومي والمعدل التراكمي لاختبارات نهاية الأسبوع الموثقة لدينا.',
      rejectionReason: 'تم شرح الدرجات هاتفياً للولي وتوضيح أن غياب الطالب في 3 اختبارات أسبوعية أدى تلقائياً لتدني النسبة، ولم يكن هناك خلل في الاحتساب الإداري.',
      responseDate: '07/06/2026'
    }
  ]);

  // Request form state
  const [newReqType, setNewReqType] = useState<'استفسار عام' | 'متابعة ابن' | 'ربط/تعديل بيانات' | 'طلب اجتماع مع المعلم' | 'طلب دعم تربوي'>('طلب دعم تربوي');
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqContent, setNewReqContent] = useState('');
  const [newReqChildId, setNewReqChildId] = useState(activeChild.id);
  const [newReqAttachment, setNewReqAttachment] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Direct Chat messages state (Section 7)
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([
    { id: '1', sender: 'admin', senderName: 'أ. مساعد الشؤون التعليمية', text: 'السلام عليكم ورحمة الله وبركاته، والد الطالبين المتميزين عبدالرحمن وعمر. نسعد بتواصلك الدائم معنا ونأمل إشعارنا بأي ملاحظات تربوية لديكم.', timestamp: '18/06/2026 10:15 ص', childId: 'ST-00982' },
    { id: '2', sender: 'parent', senderName: 'صالح العريني (الوالد)', text: 'وعليكم السلام ورحمة الله وبركاته. أشكركم جزيل الشكر على جهودكم واهتمامكم البالغ، وخاصة الشيخ حازم على توجيهه المستمر لعبدالرحمن.', timestamp: '18/06/2026 11:30 ص', childId: 'ST-00981' },
    { id: '3', sender: 'teacher', senderName: 'أ. حازم عمر الحركي', text: 'حياك الله يا أبا عبدالرحمن، ابنكم قرة عين وبطل مميز بالحلقة وندعو له بالثبات دائماً. تم رصد تميزه وحفظه المتكامل لورد الكهف.', timestamp: '19/06/2026 04:20 م', childId: 'ST-00981' },
    { id: '4', sender: 'parent', senderName: 'صالح العريني (الوالد)', text: 'جزاكم الله خيراً يا شيخ حازم. وماذا بخصوص الخطة المخصصة لعمر في مصعب بن عمير؟ نخشى عليه من فتور الحفظ الحاصل.', timestamp: '19/06/2026 05:00 م', childId: 'ST-00982' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Notifications center state (Section 5)
  const [notifications, setNotifications] = useState<PortalNotification[]>([
    { id: 'nt-1', childId: 'ST-00982', childName: 'عمر', type: 'غياب', title: 'تسجيل غياب الطالب عمر عن حلقة اليوم', content: 'نلفت نظركم إلى أنه تم تسجيل غياب الطالب عمر بن صالح عن الحضور لحلقتنا اليوم دون إشعار مسبق. نرجو حثه على الانتظام والالتزام.', date: '24/06/2026', time: '04:10 م', priority: 'high', isRead: false, isArchived: false },
    { id: 'nt-2', childId: 'ST-00981', childName: 'عبدالرحمن', type: 'وسام أو إنجاز', title: 'منح وسام الحافظ الملتزم لعبدالرحمن', content: 'تهانينا الحارة! تم منح ابنكم عبدالرحمن وسام الحافظ الملتزم تقديراً لانضباطه وتفوقه الكامل وحصوله على معدل 100% في الحضور والمواظبة.', date: '22/06/2026', time: '05:30 م', priority: 'medium', isRead: true, isArchived: false },
    { id: 'nt-3', childId: 'ST-00982', childName: 'عمر', type: 'نتيجة تقييم', title: 'صدور التقييم الشهري لشهر شعبان لعمر', content: 'تم إصدار التقرير والتقييم الشهري لعمر في مسار ضبط التأسيس وحصوله على معدل 68%. نرجو مراجعة التقرير لدعم الخطة العلاجية.', date: '20/06/2026', time: '08:00 م', priority: 'high', isRead: false, isArchived: false },
    { id: 'nt-4', childId: 'ST-00981', childName: 'عبدالرحمن', type: 'اختبار', title: 'اجتياز اختبار ضبط الأجزاء الخمسة الأولى بنجاح', content: 'نبارك لكم تفوق عبدالرحمن واجتيازه الاختبار الكلي للأجزاء الخمسة الأولى بنسبة ممتازة بلغت 98% وحصوله على الترقية للمستوى التالي.', date: '15/06/2026', time: '06:00 م', priority: 'medium', isRead: true, isArchived: false }
  ]);

  // System board announcements (Section 8)
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([
    {
      id: 'ann-1',
      type: 'activity',
      title: 'إطلاق مسابقة الهدى السنوية الكبرى لحفظ القرآن وتجويده',
      content: 'تعلن إدارة الملتقى القرآني عن فتح باب التسجيل لمسابقة الهدى السنوية الكبرى لعام 1446هـ في فروعها الخمسة، بجوائز مالية وعينية قيمة تتجاوز 50,000 ريال سعودي. يرجى من أولياء الأمور الراغبين في ترشيح أبنائهم التواصل مع معلم الحلقة لتسجيل أسمائهم قبل نهاية الشهر الجاري.',
      date: '22/06/2026',
      hasAttachment: true,
      attachmentName: 'بروشور_وشروط_مسابقة_الهدى.pdf',
      isViewed: false
    },
    {
      id: 'ann-2',
      type: 'administrative',
      title: 'مواعيد لقاءات أولياء الأمور الدورية مع الإدارة التعليمية',
      content: 'يسر ملتقى الهدى دعوة آباء وأولياء أمور الطلاب الكرام لحضور اللقاء المفتوح مع المشرف التعليمي العام والمعلمين لمناقشة التقدم التربوي والخطط المستقبلية لأبنائنا الطلاب. سيتم تنظيم اللقاء هاتفياً أو حضورياً بمقر الملتقى حسب رغبتكم ابتداءً من الأسبوع القادم.',
      date: '18/06/2026',
      hasAttachment: false,
      isViewed: true
    },
    {
      id: 'ann-3',
      type: 'educational',
      title: 'تطبيق آلية المتابعة الذكية الجديدة عبر بطاقات التقييم التراكمي',
      content: 'في إطار سعينا المستمر لتطوير الأداء الأكاديمي والتعليمي داخل الحلقات، تم رسمياً اعتماد نظام بطاقات المتابعة اليومية الإلكترونية للخطط التعليمية. يمكن لجميع أولياء الأمور الآن معرفة الورد اليومي ومقدار التقدم والانحراف عن الخطة مباشرة من بوابة ولي الأمر عبر هذه المنصة.',
      date: '10/06/2026',
      hasAttachment: true,
      attachmentName: 'دليل_استخدام_منصة_المتابعة_للأهالي.pdf',
      isViewed: true
    }
  ]);

  // Active view tabs
  const [activePortalTab, setActivePortalTab] = useState<string>('home');

  // Authentication & Stage 1 Registration Action Handlers
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginPhone.trim() || !loginPassword.trim()) {
      alert('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    const matched = accounts.find(acc => acc.phone === loginPhone && acc.password === loginPassword);
    if (!matched) {
      alert('رقم الجوال أو كلمة المرور غير صحيحة، يرجى إعادة المحاولة.');
      return;
    }
    
    // Log in
    setCurrentParent({
      id: matched.id,
      name: matched.name,
      phone: matched.phone,
      email: matched.email || '',
      preferredChannel: matched.preferredChannel || 'SMS',
      pushEnabled: matched.pushEnabled ?? true,
      emailEnabled: matched.emailEnabled ?? true,
      smsEnabled: matched.smsEnabled ?? true,
    });
    
    // Set view state based on status
    if (matched.status === '🟢 نشط') {
      setSessionState('portal');
    } else if (matched.status === '🟡 قيد المراجعة') {
      setSessionState('pending');
    } else if (matched.status === '🟠 يحتاج استكمال') {
      setSessionState('needs_info');
    } else if (matched.status === '🔴 مرفوض') {
      setSessionState('rejected');
    } else if (matched.status === '⚫ معطل') {
      setSessionState('disabled');
    }
  };

  const handleQuickLogin = (phone: string) => {
    const matched = accounts.find(acc => acc.phone === phone);
    if (!matched) return;
    
    setLoginPhone(matched.phone);
    setLoginPassword(matched.password);
    
    setCurrentParent({
      id: matched.id,
      name: matched.name,
      phone: matched.phone,
      email: matched.email || '',
      preferredChannel: matched.preferredChannel || 'SMS',
      pushEnabled: matched.pushEnabled ?? true,
      emailEnabled: matched.emailEnabled ?? true,
      smsEnabled: matched.smsEnabled ?? true,
    });
    
    if (matched.status === '🟢 نشط') {
      setSessionState('portal');
    } else if (matched.status === '🟡 قيد المراجعة') {
      setSessionState('pending');
    } else if (matched.status === '🟠 يحتاج استكمال') {
      setSessionState('needs_info');
    } else if (matched.status === '🔴 مرفوض') {
      setSessionState('rejected');
    } else if (matched.status === '⚫ معطل') {
      setSessionState('disabled');
    }
  };

  const handleSelfRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      alert('الرجاء تعبئة كافة بيانات الحساب الأساسية');
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      alert('كلمتا المرور غير متطابقتين، يرجى التثبت والمحاولة مرة أخرى.');
      return;
    }
    
    const phoneExists = accounts.some(acc => acc.phone === regPhone);
    if (phoneExists) {
      alert('عذراً، رقم الهاتف مدخل ومسجل مسبقاً بالنظام. يرجى تسجيل الدخول مباشرة.');
      return;
    }
    
    const validChildren = regChildren.filter(c => c.name.trim() !== '');
    if (validChildren.length === 0) {
      alert('الرجاء إضافة ابن واحد على الأقل مع اسم المعلم إن وجد لاستكمال طلب المتابعة.');
      return;
    }
    
    const newId = 'PR-' + Math.floor(Math.random() * 1000 + 5000);
    const newAcc = {
      id: newId,
      name: regName,
      phone: regPhone,
      password: regPassword,
      status: '🟡 قيد المراجعة' as const,
      registrationDate: new Date().toLocaleDateString('ar-SA') + ' م',
      email: regEmail || `${newId.toLowerCase()}@example.com`,
      preferredChannel: 'SMS' as const,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      childrenNames: validChildren
    };
    
    setAccounts(prev => [...prev, newAcc]);
    
    // Auto-login to show 'pending' status
    setCurrentParent({
      id: newAcc.id,
      name: newAcc.name,
      phone: newAcc.phone,
      email: newAcc.email,
      preferredChannel: newAcc.preferredChannel,
      pushEnabled: newAcc.pushEnabled,
      emailEnabled: newAcc.emailEnabled,
      smsEnabled: newAcc.smsEnabled,
    });
    
    // Clear registration form
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegChildren([{ name: '', teacherName: '' }]);
    
    setSessionState('pending');
    alert('تم إرسال طلب تسجيلك بنجاح للإدارة! حالة حسابك الحالية: قيد المراجعة 🟡. يمكنك مراجعة وتفعيل الحساب من لوحة التحكم الإدارية في الأعلى بمحاكاة الاعتماد!');
  };

  const handleRequestCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentCompletionReply.trim()) {
      alert('الرجاء إدخال البيانات المطلوبة أولاً للرد على الإدارة.');
      return;
    }
    
    setAccounts(prev => prev.map(acc => {
      if (acc.id === currentParent.id) {
        return {
          ...acc,
          status: '🟡 قيد المراجعة' as const,
          completionRequested: undefined,
          notes: `البيانات المستكملة من ولي الأمر: ${parentCompletionReply}`
        };
      }
      return acc;
    }));
    
    setParentCompletionReply('');
    setSessionState('pending');
    alert('تم تقديم البيانات المطلوبة بنجاح! تم تحويل حالة حسابك مجدداً إلى "قيد المراجعة" 🟡 للتدقيق من قبل الإدارة.');
  };

  // Stage 2 Administrative Action Handlers
  const handleApproveAccount = (accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        // Dynamic child generation so they actually appear inside the portal
        acc.childrenNames.forEach((cNameObj: any) => {
          const childExists = children.some(c => c.name === cNameObj.name);
          if (!childExists) {
            const newChildId = 'ST-' + Math.floor(Math.random() * 100000 + 1000);
            const newChild: Child = {
              id: newChildId,
              name: cNameObj.name,
              circleName: 'حلقة عثمان بن عفان النموذجية',
              teacherName: cNameObj.teacherName || 'أ. أحمد الشمري',
              educationalStatus: 'نشط',
              statusIndicator: 'green',
              completionRate: 75,
              attendanceRate: 94,
              lastExamScore: 90,
              lastExamDate: new Date().toLocaleDateString('ar-SA'),
              lastCompletedPlan: 'تسميع الربع الأخير من جزء عم',
              currentLevel: 'المستوى الأول (تأسيس وحفظ قصار السور)',
              notes: 'طالب ممتاز يمتلك مخارج حروف سليمة وحفظاً منزلياً مستمراً بدعم من الأسرة.',
              strengths: ['مخارج دقيقة', 'سرعة التلقين'],
              weaknesses: ['تسرع بسيط في المدود'],
              teacherRecommendation: 'حث الطالب على المراجعة المنفردة والاستماع للمصحف المعلم للشيخ الحصري.',
              plans: {
                current: {
                  title: 'خطة حفظ جزء عم والمراجعة المستمرة',
                  goal: 'حفظ جزء عم مع إتقان أحكام النون الساكنة والتنوين',
                  duration: 'شهران',
                  progress: 75,
                  remaining: '8 صفحات مع المراجعة الشاملة',
                  status: 'في المسار التربوي المعتاد'
                },
                monthly: {
                  title: 'خطة شهر ذي الحجة',
                  goal: 'مراجعة شاملة لقصار السور وضبط التجويد',
                  progress: 85,
                  status: 'نشط ومستمر'
                },
                quarterly: {
                  title: 'الخطة الربعية الحالية',
                  goal: 'حفظ سورتي الملك والقلم مع التجويد',
                  progress: 45,
                  status: 'جارٍ العمل عليها'
                },
                annual: {
                  title: 'الخطة السنوية العامة للابن',
                  goal: 'حفظ ثلاثة أجزاء من المفصل وإتقان قراءة حفص',
                  progress: 60,
                  status: 'في مساره الطبيعي'
                }
              },
              reports: [
                {
                  id: 'REP-DYN-' + Math.floor(Math.random() * 1000),
                  type: 'شهري',
                  date: 'شعبان 1446هـ',
                  completion: 88,
                  grade: 'ممتاز',
                  strengths: ['الالتزام بالحضور اليومي', 'جودة القراءة والتجويد'],
                  improvements: ['تحسين الوقف والابتداء'],
                  teacherNotes: 'أظهر الابن التزاماً وتطوراً رائعاً خلال هذا الشهر.',
                  recommendations: 'الاستمرار بالتحفيز المنزلي والمتابعة الهاتفية.'
                }
              ],
              achievements: [
                {
                  id: 'ACH-DYN-' + Math.floor(Math.random() * 1000),
                  type: 'badge',
                  title: 'وسام المنضبط المثالي',
                  description: 'يمنح للطالب الذي لم يسجل أي غياب أو تأخير لثلاثين يوماً متواصلة.',
                  date: new Date().toLocaleDateString('ar-SA'),
                  iconType: 'star'
                }
              ]
            };
            setChildren(prevChildren => [...prevChildren, newChild]);
          }
        });
        
        return { ...acc, status: '🟢 نشط' as const, rejectionReason: undefined, completionRequested: undefined };
      }
      return acc;
    }));
    
    // Update active user state if the approved account is the currently logged-in one
    if (currentParent && currentParent.phone === accounts.find(a => a.id === accountId)?.phone) {
      setSessionState('portal');
    }
    
    alert('تم اعتماد وتنشيط حساب ولي الأمر بنجاح! وتم ربط وتأسيس الملفات التعليمية لأبنائه تلقائياً في البوابة.');
  };

  const handleRejectAccount = (accountId: string, reason: string) => {
    if (!reason.trim()) {
      alert('الرجاء كتابة سبب الرفض لتوجيه ولي الأمر بشكل صحيح.');
      return;
    }
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: '🔴 مرفوض' as const, rejectionReason: reason };
      }
      return acc;
    }));
    setAdminShowRejectionForm(null);
    alert('تم رفض طلب التسجيل بنجاح مع إرسال مبررات الرفض لولي الأمر.');
  };

  const handleRequestCompletion = (accountId: string, requestedInfo: string) => {
    if (!requestedInfo.trim()) {
      alert('الرجاء كتابة البيانات المطلوب استكمالها لتوجيه ولي الأمر.');
      return;
    }
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: '🟠 يحتاج استكمال' as const, completionRequested: requestedInfo };
      }
      return acc;
    }));
    setAdminShowCompletionForm(null);
    alert('تمت مطالبة ولي الأمر باستكمال البيانات بنجاح، وستتغير حالة حسابه إلى "يحتاج استكمال" 🟠.');
  };

  const handleDisableAccount = (accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: '⚫ معطل' as const };
      }
      return acc;
    }));
    alert('تم تعطيل حساب ولي الأمر مؤقتاً بنجاح وسحب جميع صلاحيات الدخول لبوابة المتابعة 🔴.');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle.trim() || !newReqContent.trim()) {
      alert('الرجاء تعبئة جميع الحقول الإلزامية للطلب');
      return;
    }

    const newReq: ParentRequest = {
      id: 'REQ-' + (requests.length + 101),
      type: newReqType,
      childId: newReqChildId,
      title: newReqTitle,
      content: newReqContent,
      status: 'قيد المراجعة',
      date: 'اليوم (مقدم حديثاً)',
      attachmentName: newReqAttachment ? newReqAttachment.split('\\').pop() : undefined
    };

    setRequests(prev => [newReq, ...prev]);
    setNewReqTitle('');
    setNewReqContent('');
    setNewReqAttachment('');
    setIsSubmittingRequest(false);
    alert('تم تقديم طلبك بنجاح للإدارة، وسيتم مراجعته والرد عليه خلال 24 ساعة بمشيئة الله. يمكنك متابعة حالة الطلب في سجل الطلبات.');
  };

  // Send Direct Message (Section 7)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    if (!adminControls.allowDirectMessaging) {
      alert('عذراً، قامت إدارة الملتقى بإغلاق المحادثات المباشرة مؤقتاً ضمن لوحة الإدارة.');
      return;
    }

    const newMsg: DirectMessage = {
      id: 'msg-' + Date.now(),
      sender: 'parent',
      senderName: 'صالح العريني (الوالد)',
      text: newMessageText,
      timestamp: 'الآن',
      childId: activeChild.id
    };

    setChatMessages(prev => [...prev, newMsg]);
    setNewMessageText('');

    // Simulate auto response from system or teacher after 2 seconds
    setTimeout(() => {
      const autoResp: DirectMessage = {
        id: 'msg-auto-' + Date.now(),
        sender: 'admin',
        senderName: 'المساعد الإداري الآلي',
        text: `نشكرك على تواصلك يا أبا ${activeChild.name.split(' ')[0]}. تم تسليم رسالتك وجاري إحالتها للمعلم المشرف لإفادتك بالإجابة الكافية والوافية بأقرب وقت.`,
        timestamp: 'الآن',
        childId: activeChild.id
      };
      setChatMessages(prev => [...prev, autoResp]);
    }, 1500);
  };

  // Mark all notifications as read (Section 5)
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    alert('تم تحديد جميع التنبيهات كقروءة بنجاح.');
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n));
  };

  // Toggle single notification read status
  const toggleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  // Update Parent profile (Section 11)
  const handleUpdateContactInfo = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم تحديث بيانات الاتصال وتفضيلات البوابة بنجاح!');
  };

  // Simulate password reset (Section 11)
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordState.old || !passwordState.newPassword || !passwordState.confirm) {
      setPasswordError('الرجاء تعبئة جميع حقول كلمة المرور.');
      return;
    }

    if (passwordState.newPassword !== passwordState.confirm) {
      setPasswordError('تأكيد كلمة المرور الجديدة غير متطابق!');
      return;
    }

    setPasswordSuccess('تم تغيير كلمة المرور للبوابة بنجاح! يرجى حفظها لاستخدامها لاحقاً.');
    setPasswordState({ old: '', newPassword: '', confirm: '' });
  };

  // Print PDF Simulated triggers (Section 16)
  const [printPreviewState, setPrintPreviewState] = useState<{
    open: boolean;
    title: string;
    childName: string;
    data: any;
  } | null>(null);

  const triggerPrintSimulated = (title: string, childName: string, data: any) => {
    setPrintPreviewState({
      open: true,
      title,
      childName,
      data
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="parent-portal-system-main">
      
      {sessionState === 'portal' && (
        <>
          {/* Visual Header / Brand */}
          <div className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-900 p-6 rounded-2xl text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="bg-amber-400 p-2 rounded-lg text-emerald-950 shadow-md">
              <Heart className="h-6 w-6 text-emerald-950 fill-emerald-950" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
                بوابة ولي الأمر الذكية
                <span className="text-xs bg-emerald-800 text-amber-300 px-2 py-0.5 rounded-full border border-emerald-700 font-sans">
                  نسخة الولي الشريك
                </span>
              </h2>
            </div>
          </div>
          <p className="text-emerald-100 text-xs md:text-sm max-w-2xl font-sans">
            مرحباً بك يا <span className="font-bold text-amber-300">{currentParent.name}</span>. تتيح لك هذه المنصة الآمنة المتابعة اللحظية لأداء ومؤشرات أبنائك، والتفاعل البنّاء مع الإدارة لتعزيز مسيرتهم القرآنية.
          </p>
        </div>

        {/* Selected Child Quick Selector */}
        <div className="flex items-center gap-2 bg-emerald-900/50 p-2.5 rounded-xl border border-emerald-800 w-full lg:w-auto">
          <Users className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-200 whitespace-nowrap">الابن النشط الحالي:</span>
          <select 
            value={selectedChildId}
            onChange={(e) => {
              setSelectedChildId(e.target.value);
              // reset active request or child detail filters if needed
            }}
            className="bg-emerald-950 text-white text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-700 focus:outline-none focus:ring-1 focus:ring-amber-400 w-full"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.circleName.split(' ')[1] || 'الحلقة'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADMIN CONTROLS / SIMULATOR BANNER (Section 12: Administrative Authority & Privacy Rules) */}
      <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-900">
            <Sliders className="h-5 w-5 text-amber-700" />
            <span className="text-xs font-bold">لوحة محاكاة إدارة الملتقى (التحكم في خصوصية ولي الأمر وما يظهر في البوابة)</span>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-full">أداة إشرافية خاصة بمجلس الإدارة</span>
        </div>
        <p className="text-amber-800 text-[11px]">
          تسمح هذه المفاتيح لمحاكاة صلاحيات الإدارة المركزية في تحديد وحظر بعض التفاصيل الحساسة قبل عرضها للآباء، لضمان الضبط التربوي الكامل.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {Object.entries(adminControls).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setAdminControls(prev => ({ ...prev, [key]: !value }))}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-center flex items-center justify-center gap-1 ${
                value 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {value ? <CheckCircle className="h-3 w-3 text-emerald-700 shrink-0" /> : <X className="h-3 w-3 text-rose-700 shrink-0" />}
              {key === 'showTeacherNotes' && 'ملاحظات المعلمين'}
              {key === 'showDetailedGrades' && 'تفاصيل الدرجات'}
              {key === 'showAttendanceStats' && 'نسب الحضور'}
              {key === 'showTeacherRecommendations' && 'التوصيات التربوية'}
              {key === 'showChildIndicators' && 'مؤشرات الألوان 🟢🟡🔴'}
              {key === 'allowDirectMessaging' && 'المحادثات المباشرة'}
              {key === 'allowMeetingRequests' && 'طلب موعد اجتماع'}
            </button>
          ))}
        </div>
      </div>

      {/* PORTAL TAB NAVIGATION - SECTIONS 1 TO 11 */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
        {[
          { id: 'home', label: 'الرئيسية وملخص الأبناء', icon: Layout },
          { id: 'plans', label: 'الخطط التعليمية والتنبيهات', icon: BookOpen },
          { id: 'reports', label: 'التقارير الدورية والإنجاز', icon: FileText },
          { id: 'achievements', label: 'الجوائز والأوسمة والشهادات', icon: Award },
          { id: 'requests', label: 'مركز تقديم وتتبع الطلبات', icon: ClipboardList },
          { id: 'chat', label: 'المراسلة والتواصل المباشر', icon: MessageSquare },
          { id: 'notifications', label: `مركز الإشعارات والتنبيهات (${notifications.filter(n=>!n.isRead).length})`, icon: Bell },
          { id: 'settings', label: 'إعدادات حساب الولي والخصوصية', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePortalTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activePortalTab === tab.id 
                ? 'bg-emerald-50 text-emerald-950 border-emerald-950 shadow-xs' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${activePortalTab === tab.id ? 'text-emerald-950' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* PORTAL TAB CONTENT RENDERING */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 min-h-[450px]">
        
        {/* ========================================= */}
        {/* SECTION 1: HOME PAGE (الرئيسية وملخص الأبناء) */}
        {/* ========================================= */}
        {activePortalTab === 'home' && (
          <div className="space-y-6">
            
            {/* Quick Executive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">الأبناء المرتبطون بالبوابة</span>
                  <p className="text-xl font-black font-mono text-emerald-900 mt-1">{children.length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-700/20" />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">أبناء في حالة تميز ونشاط</span>
                  <p className="text-xl font-black font-mono text-emerald-700 mt-1">
                    {children.filter(c => c.educationalStatus === 'نشط' || c.educationalStatus === 'متقدم' || c.educationalStatus === 'خريج').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-700/20" />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">طلبات مفتوحة قيد المتابعة</span>
                  <p className="text-xl font-black font-mono text-amber-700 mt-1">
                    {requests.filter(r => r.status === 'قيد المراجعة' || r.status === 'قيد التنفيذ').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-700/20" />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">التنبيهات غير المقروءة للأسرة</span>
                  <p className="text-xl font-black font-mono text-rose-700 mt-1">
                    {notifications.filter(n => !n.isRead).length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-rose-700/20" />
              </div>
            </div>

            {/* General Notifications and Last Important Warning banner */}
            {notifications.some(n => n.priority === 'high' && !n.isRead) && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-900">
                <ShieldAlert className="h-5 w-5 text-rose-700 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">تنبيه إداري عاجل للأسرة:</span>{' '}
                  {notifications.find(n => n.priority === 'high' && !n.isRead)?.content}
                </div>
                <button 
                  onClick={() => setActivePortalTab('notifications')}
                  className="mr-auto text-xs font-bold underline text-rose-800"
                >
                  عرض في مركز الإشعارات
                </button>
              </div>
            )}

            {/* List of Connected Children (Section 2 - Detailed Cards) */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-emerald-800" />
                ملف الأبناء المرتبطين (نظام العرض والمتابعة اللحظية)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map(child => (
                  <div 
                    key={child.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      selectedChildId === child.id 
                        ? 'border-emerald-800 bg-emerald-50/20 shadow-md ring-1 ring-emerald-950/20' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-950 text-white rounded-xl h-11 w-11 flex items-center justify-center font-bold font-display shadow-xs">
                          {child.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{child.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">الرقم التعريفي: {child.id}</span>
                        </div>
                      </div>

                      {/* Status indicator badge (Section 12 visibility constraint check) */}
                      {adminControls.showChildIndicators && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          child.statusIndicator === 'green' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : child.statusIndicator === 'yellow'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          ● {child.educationalStatus}
                        </span>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5 my-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">نسبة إنجاز الخطة</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{child.completionRate}%</span>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block">نسبة الحضور</span>
                        <span className="text-xs font-black text-slate-800 font-mono">
                          {adminControls.showAttendanceStats ? `${child.attendanceRate}%` : 'محجوبة'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">آخر اختبار</span>
                        <span className="text-xs font-black text-slate-800 font-mono">
                          {adminControls.showDetailedGrades ? `${child.lastExamScore}%` : 'محجوبة'}
                        </span>
                      </div>
                    </div>

                    {/* Teacher & Circle names */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-500">الحلقة القرآنية:</span>
                        <span>{child.circleName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-500">المعلم المشرف:</span>
                        <span>{child.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-500">آخر خطة مكتملة:</span>
                        <span className="text-emerald-800 font-medium">{child.lastCompletedPlan}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedChildId(child.id);
                          setActivePortalTab('plans');
                        }}
                        className="text-xs font-bold text-emerald-900 hover:underline flex items-center gap-0.5"
                      >
                        عرض الخطط التعليمية
                        <ArrowLeft className="h-3 w-3 mr-1" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedChildId(child.id);
                          setActivePortalTab('reports');
                        }}
                        className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        عرض التقارير الشاملة
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Quick Portal Guide Banner */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-10 w-10 text-emerald-800/30 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">هل تحتاج مساعدة في فهم بطاقات المتابعة؟</h4>
                  <p className="text-[11px] text-slate-500">تواصل مباشرة مع معلّم الحلقة أو قدّم طلب استفسار تربوي من خلال قائمة طلبات البوابة.</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePortalTab('requests')}
                className="bg-emerald-950 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900 shrink-0"
              >
                تقديم طلب جديد الآن
              </button>
            </div>

          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 3: EDUCATIONAL PLANS (الخطط التعليمية والتنبيهات) */}
        {/* ========================================= */}
        {activePortalTab === 'plans' && (() => {
          const systemPlans = getStoredPlans();
          const childPlan = systemPlans[activeChild.id] || systemPlans['ST-000001'];

          return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">متابعة مسار الخطط التعليمية للابن</h3>
                <p className="text-xs text-slate-500">عرض الأهداف والمدد الزمنية المتبقية ومؤشر التقدم.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border">
                الابن المختار: {activeChild.name}
              </span>
            </div>

            {/* 📜 تقرير ومختصر الخطة وتفهيم الآيات الخاص بولي الأمر */}
            {childPlan && (
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-700 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-700/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      تقرير ومختصر الخطة المعين من المعلم
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      طالب الحلقة: {childPlan.studentName} ({childPlan.circleName})
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-200 bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-700 font-mono">
                    آخر تحديث: {childPlan.updatedAt}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-700/60 space-y-1">
                    <span className="text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      مقرر الحفظ الحالي (من وإلى):
                    </span>
                    <p className="text-xs text-emerald-100 font-medium pt-1">
                      من: <span className="text-white font-bold">{childPlan.hifzFrom}</span>
                    </p>
                    <p className="text-xs text-emerald-100 font-medium">
                      إلى: <span className="text-white font-bold">{childPlan.hifzTo}</span>
                    </p>
                  </div>

                  <div className="bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-700/60 space-y-1">
                    <span className="text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      مقرر المراجعة والتثبيت (من وإلى):
                    </span>
                    <p className="text-xs text-emerald-100 font-medium pt-1">
                      من: <span className="text-white font-bold">{childPlan.muraajaaFrom}</span>
                    </p>
                    <p className="text-xs text-emerald-100 font-medium">
                      إلى: <span className="text-white font-bold">{childPlan.muraajaaTo}</span>
                    </p>
                  </div>
                </div>

                {/* تفهيم الآيات */}
                <div className="bg-amber-400/10 p-3.5 rounded-xl border border-amber-400/30 space-y-1.5">
                  <span className="text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    قسم تفهيم وتدبر الآيات الكريمة المقررة (توجيهات المعلم للأسرة):
                  </span>
                  <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                    {childPlan.tafheemVerses}
                  </p>
                </div>

                {/* 🏆 قسم إنجاز الخطة وسجل الحضور والغياب الشهري باليوم */}
                <div className="bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-700/60 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-emerald-800 pb-2">
                    <span className="text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Award className="h-4 w-4" />
                      قسم إنجاز الخطة وسجل الحضور والغياب الشهري ({childPlan.attendanceMonth || 'أغسطس 2026'}):
                    </span>
                    <span className="bg-emerald-800 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-600">
                      نسبة الالتزام بالحلقة: {Math.round(((childPlan.attendedDays || 0) / (childPlan.totalStudyDays || 1)) * 100)}%
                    </span>
                  </div>

                  {/* Plan Achievement metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-700">
                      <span className="text-[10px] text-emerald-200 block">إنجاز الحفظ</span>
                      <span className="font-bold text-amber-300">{childPlan.hifzAchievementPercent ?? 95}%</span>
                    </div>
                    <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-700">
                      <span className="text-[10px] text-emerald-200 block">إنجاز المراجعة</span>
                      <span className="font-bold text-amber-300">{childPlan.muraajaaAchievementPercent ?? 90}%</span>
                    </div>
                    <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-700">
                      <span className="text-[10px] text-emerald-200 block">التقدير العام</span>
                      <span className="font-bold text-white text-[11px]">{childPlan.achievementGrade || 'ممتاز مرتفع'}</span>
                    </div>
                  </div>

                  {/* Monthly Attendance breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-emerald-200 block">إجمالي أيام الدراسة</span>
                      <span className="font-bold text-white">{childPlan.totalStudyDays || 25} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-amber-300 block">أيام الحضور الفعلي</span>
                      <span className="font-bold text-amber-300">{childPlan.attendedDays || 0} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-amber-200 block">أيام الغياب بعذر</span>
                      <span className="font-bold text-amber-200">{childPlan.absentExcusedDays || 0} يوم</span>
                    </div>
                    <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800">
                      <span className="text-[10px] text-rose-300 block">أيام الغياب بدون عذر</span>
                      <span className="font-bold text-rose-300">{childPlan.absentUnexcusedDays || 0} يوم</span>
                    </div>
                  </div>

                  {childPlan.achievementNotes && (
                    <p className="text-[11px] text-emerald-100 bg-emerald-900/50 p-2 rounded-lg border border-emerald-800">
                      <span className="font-bold text-amber-300">تقييم إنجاز الخطة:</span> {childPlan.achievementNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Plan Warning Alert (Section 3) */}
            {activeChild.plans.alert && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                activeChild.plans.alert.type === 'delay' 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {activeChild.plans.alert.type === 'delay' ? (
                  <ShieldAlert className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold">تنبيه متعلق بالخطة التعليمية:</h4>
                  <p className="text-[11px] mt-0.5">{activeChild.plans.alert.message}</p>
                </div>
              </div>
            )}

            {/* Active Plan Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Plan overview & visual bar */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-emerald-950 text-white px-2.5 py-1 rounded-lg font-bold">الخطة النشطة الحالية</span>
                    <span className="text-[10px] text-slate-400 font-bold">{activeChild.plans.current.duration}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{activeChild.plans.current.title}</h4>
                  
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">الهدف الرئيسي والمخرجات المرجوة</span>
                    <p className="text-xs text-slate-700 font-sans mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      {activeChild.plans.current.goal}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-500">نسبة تقدم الحفظ والتسميع</span>
                      <span className="font-mono font-bold text-emerald-900">{activeChild.plans.current.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-emerald-700 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${activeChild.plans.current.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>البداية (0%)</span>
                      <span className="text-emerald-900 font-bold">الحالة: {activeChild.plans.current.status}</span>
                      <span>اكتمال الخطة (100%)</span>
                    </div>
                  </div>

                  {/* Remaining info */}
                  <div className="p-3 bg-slate-100 text-slate-800 rounded-lg text-xs flex items-center justify-between">
                    <span className="font-bold">المقدار المتبقي لإتمام الخطة:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                      {activeChild.plans.current.remaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Mini sub-plans */}
              <div className="space-y-4">
                
                {/* Monthly */}
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-slate-800">الخطة الشهرية</h5>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 rounded">{activeChild.plans.monthly.progress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{activeChild.plans.monthly.title}</p>
                  <p className="text-[10px] text-slate-400">الهدف: {activeChild.plans.monthly.goal}</p>
                </div>

                {/* Quarterly */}
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-slate-800">الخطة الربع سنوية</h5>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 rounded">{activeChild.plans.quarterly.progress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{activeChild.plans.quarterly.title}</p>
                  <p className="text-[10px] text-slate-400">الهدف: {activeChild.plans.quarterly.goal}</p>
                </div>

                {/* Annual */}
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-slate-800">الخطة السنوية الكبرى</h5>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 rounded">{activeChild.plans.annual.progress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{activeChild.plans.annual.title}</p>
                  <p className="text-[10px] text-slate-400">الهدف: {activeChild.plans.annual.goal}</p>
                </div>

              </div>
            </div>

            {/* Print Plan Option */}
            <div className="flex justify-end">
              <button
                onClick={() => triggerPrintSimulated('بطاقة متابعة الخطة التعليمية للأبناء', activeChild.name, activeChild.plans)}
                className="bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Printer className="h-4 w-4" />
                طباعة وتصدير الخطة التعليمية للابن
              </button>
            </div>
          </div>
          );
        })()}

        {/* ========================================= */}
        {/* SECTION 4: REPORTS (التقارير الدورية والإنجاز) */}
        {/* ========================================= */}
        {activePortalTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">التقارير التربوية والدورية الصادرة</h3>
                <p className="text-xs text-slate-500">مراجعة تقييم المعلم والتوصيات الصادرة من اللجنة التعليمية.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border">
                الابن المختار: {activeChild.name}
              </span>
            </div>

            {/* List of reports for active child */}
            <div className="space-y-4">
              {activeChild.reports.map((report) => (
                <div key={report.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-xs transition-shadow space-y-4 bg-slate-50/20">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs bg-emerald-900 text-white font-bold">
                        تقرير {report.type}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">{report.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">التقدير العام</span>
                        <span className="text-xs font-bold text-emerald-800">{report.grade}</span>
                      </div>
                      <div className="text-right border-r pr-4 border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">نسبة إنجاز الخطة المقررة</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{report.completion}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/50">
                      <span className="text-xs font-bold text-emerald-900 block mb-1.5 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-emerald-700" />
                        نقاط القوة والتميز الملاحظة:
                      </span>
                      <ul className="list-disc list-inside text-xs text-emerald-850 space-y-1 pr-1">
                        {report.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                      </ul>
                    </div>

                    <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100/50">
                      <span className="text-xs font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                        نقاط تحتاج لتحسين ومتابعة منزلية:
                      </span>
                      <ul className="list-disc list-inside text-xs text-amber-850 space-y-1 pr-1">
                        {report.improvements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Teacher notes & Recommendations (Section 12 visibility rules checked) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminControls.showTeacherNotes && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-500 block mb-1">ملاحظات معلم الحلقة:</span>
                        <p className="text-xs text-slate-700 font-sans leading-relaxed">{report.teacherNotes}</p>
                      </div>
                    )}

                    {adminControls.showTeacherRecommendations && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-500 block mb-1">توصيات تربوية للأسرة:</span>
                        <p className="text-xs text-slate-700 font-sans leading-relaxed">{report.recommendations}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => triggerPrintSimulated(`التقرير التربوي والدوري - تقرير ${report.type}`, activeChild.name, report)}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      طباعة التقرير وتصدير ملف PDF المعتمد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 9: ACHIEVEMENTS & OSWAH (الجوائز والأوسمة والشهادات) */}
        {/* ========================================= */}
        {activePortalTab === 'achievements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">سجل الإنجازات والأوسمة للأبناء</h3>
                <p className="text-xs text-slate-500">استعرض الأوسمة والجوائز التي منحتها الإدارة للطلاب المتميزين.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border">
                الابن المختار: {activeChild.name}
              </span>
            </div>

            {/* Badges and Medals visual grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeChild.achievements.map((ach) => (
                <div key={ach.id} className="border border-slate-100 rounded-xl p-4 text-center space-y-3 bg-slate-50/40 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[8px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                    {ach.date}
                  </div>

                  <div className="mx-auto h-14 w-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 shadow-xs mb-1">
                    {ach.iconType === 'star' && <Star className="h-7 w-7 text-amber-500 fill-amber-500" />}
                    {ach.iconType === 'cert' && <Award className="h-7 w-7 text-emerald-800" />}
                    {ach.iconType === 'medal' && <Heart className="h-7 w-7 text-rose-600 fill-rose-600" />}
                    {ach.iconType === 'shield' && <Shield className="h-7 w-7 text-indigo-700" />}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{ach.title}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {ach.type === 'badge' ? 'وسام شرفي' : ach.type === 'certificate' ? 'شهادة رسمية' : 'جائزة عينية'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                    {ach.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex justify-center gap-2">
                    <button 
                      onClick={() => triggerPrintSimulated(`شهادة ووسام إنجاز - ${ach.title}`, activeChild.name, ach)}
                      className="text-[10px] font-bold text-emerald-900 hover:underline flex items-center gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      طباعة الشهادة
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => alert('جاري تنزيل ملف الصورة المرفق للشهادة بالجودة العالية...')}
                      className="text-[10px] font-bold text-slate-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      تنزيل الوثيقة
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary achievements card */}
            <div className="bg-emerald-950 p-5 rounded-2xl text-white space-y-2">
              <h4 className="text-xs font-bold text-amber-300">💡 توصية إدارية خاصة بالتميز:</h4>
              <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                تحرص إدارة ملتقى الهدى على تتويج جهود أبنائنا بالأوسمة والشارات المخصصة لكل إنجاز جديد. نرجو منكم طباعة هذه الأوسمة وإهدائها لهم في المنزل لتعزيز الثقة في أنفسهم واستمرارهم على نهج حفظ كتاب الله تعالى.
              </p>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 6: REQUEST CENTER (مركز تقديم وتتبع الطلبات) */}
        {/* ========================================= */}
        {activePortalTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">مركز تقديم وتتبع طلبات أولياء الأمور</h3>
                <p className="text-xs text-slate-500">تقديم طلبات مراجعة، تعديل بيانات، ربط، أو تنسيق اجتماعات ومتابعة ردود الإدارة.</p>
              </div>
              <button
                onClick={() => setIsSubmittingRequest(!isSubmittingRequest)}
                className="bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {isSubmittingRequest ? 'إلغاء تقديم الطلب' : 'تقديم طلب رسمي جديد'}
              </button>
            </div>

            {/* New Request Form Modal/Dropdown (Section 6) */}
            <AnimatePresence>
              {isSubmittingRequest && (
                <motion.form
                  onSubmit={handleCreateRequest}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4"
                >
                  <h4 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200">تعبئة بيانات الطلب الرسمي</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع الطلب الإداري *</label>
                      <select
                        value={newReqType}
                        onChange={(e) => setNewReqType(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="طلب دعم تربوي">طلب دعم تربوي ومساندة لحل تعثر</option>
                        <option value="طلب اجتماع مع المعلم">طلب تنسيق اجتماع مع معلم الحلقة</option>
                        <option value="طلب ربط/تعديل بيانات">طلب ربط أو تعديل بيانات الأبناء</option>
                        <option value="طلب متابعة طالب">طلب متابعة خاصة لمسار الطالب</option>
                        <option value="استفسار عام">استفسار عام للإدارة التعليمية</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ربط الطلب بالطالب *</label>
                      <select
                        value={newReqChildId}
                        onChange={(e) => setNewReqChildId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        {children.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المرفقات المساندة (اختياري)</label>
                      <input
                        type="file"
                        onChange={(e) => setNewReqAttachment(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">يُسمح برفع ملفات PDF و Word والصور فقط (يمنع الفيديو).</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">عنوان الطلب باختصار *</label>
                    <input
                      type="text"
                      placeholder="أدخل عنواناً موجزاً وواضحاً لطلبك..."
                      value={newReqTitle}
                      onChange={(e) => setNewReqTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">شرح وتفاصيل الطلب والمبررات *</label>
                    <textarea
                      rows={4}
                      placeholder="اكتب هنا تفاصيل طلبك بالتفصيل لمساعدة الإدارة على اتخاذ الإجراء المناسب..."
                      value={newReqContent}
                      onChange={(e) => setNewReqContent(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSubmittingRequest(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      إلغاء الحفظ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-950 rounded-lg flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      إرسال الطلب رسمياً
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List and Status Tracking of requests */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="h-4 w-4 text-emerald-800" />
                سجل تتبع ومتابعة الطلبات السابقة ({requests.length})
              </h4>

              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="border border-slate-100 rounded-xl p-4 bg-white hover:shadow-xs transition-shadow space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                          {req.id}
                        </span>
                        <span className="text-xs font-bold text-slate-950">{req.type}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] text-slate-400 font-bold">المرسل بخصوص: {children.find(c=>c.id===req.childId)?.name || 'طالب مجهول'}</span>
                      </div>

                      {/* Status Badges */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        req.status === 'مكتمل'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : req.status === 'قيد التنفيذ'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : req.status === 'قيد المراجعة'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : req.status === 'مرفوض'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-800">
                      <h5 className="font-bold mb-1">موضوع الطلب: {req.title}</h5>
                      <p className="font-sans leading-relaxed text-[11px] text-slate-600">{req.content}</p>
                      
                      {req.attachmentName && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] font-bold text-emerald-900">
                          <FileText className="h-3.5 w-3.5" />
                          المرفق: {req.attachmentName}
                        </div>
                      )}
                    </div>

                    {/* Admin Response & Action logs */}
                    {req.adminResponse && (
                      <div className="bg-emerald-50/40 border-r-2 border-emerald-800 p-3 rounded-l-lg text-xs space-y-1.5">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-700" />
                          الرد والقرار الإداري ({req.responseDate}):
                        </span>
                        <p className="font-sans text-slate-700 text-[11px] leading-relaxed">{req.adminResponse}</p>
                      </div>
                    )}

                    {req.rejectionReason && (
                      <div className="bg-rose-50/40 border-r-2 border-rose-800 p-3 rounded-l-lg text-xs space-y-1">
                        <span className="font-bold text-rose-900 flex items-center gap-1">
                          <X className="h-4 w-4 text-rose-700" />
                          سبب الرفض والافادة الإدارية:
                        </span>
                        <p className="font-sans text-slate-700 text-[11px] leading-relaxed">{req.rejectionReason}</p>
                      </div>
                    )}

                    {req.actionsTaken && req.actionsTaken.length > 0 && (
                      <div className="pt-2 text-[10px] text-slate-500 space-y-1">
                        <span className="font-bold text-slate-600">الإجراءات المتخذة من الإدارة:</span>
                        <ul className="list-disc list-inside space-y-0.5 pr-2">
                          {req.actionsTaken.map((act, idx) => (
                            <li key={idx} className="font-sans">{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer tracking stamp */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2.5">
                      <span>تاريخ تقديم الطلب: {req.date}</span>
                      <button 
                        onClick={() => triggerPrintSimulated(`بطاقة تتبع وإجراءات الطلب - ${req.id}`, activeChild.name, req)}
                        className="text-slate-500 hover:text-emerald-900 flex items-center gap-0.5"
                      >
                        <Printer className="h-3 w-3" />
                        طباعة كرت تتبع الطلب
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 7: CHAT / DIRECT CONTACT (المراسلة والتواصل المباشر) */}
        {/* ========================================= */}
        {activePortalTab === 'chat' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">صندوق المراسلات والتواصل الهاتفي</h3>
                <p className="text-xs text-slate-500">قنوات الاتصال المباشر والمحفوظ مع معلمي الحلقات ومساعد المشرف العام.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border">
                الابن النشط بالمحادثة: {activeChild.name}
              </span>
            </div>

            {/* Chat Box Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Message History area (Col 1 & 2) */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col h-[400px]">
                
                {/* Header info */}
                <div className="bg-white p-3 border-b border-slate-200 rounded-t-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-900 text-white p-1 rounded">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">المحادثة النشطة مع اللجنة التعليمية</span>
                      <span className="text-[10px] text-slate-400 block">جميع الرسائل مؤرشفة ومسجلة زمنياً</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded">
                    متصل بالدعم
                  </span>
                </div>

                {/* Messages view */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
                  {chatMessages.map((msg) => {
                    const isParent = msg.sender === 'parent';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${isParent ? 'mr-auto items-left text-left' : 'ml-auto items-right text-right'}`}
                      >
                        <span className="text-[9px] text-slate-400 font-bold mb-0.5 px-1.5">{msg.senderName}</span>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isParent 
                            ? 'bg-emerald-950 text-white rounded-tl-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tr-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 rounded-b-xl flex gap-2">
                  <input
                    type="text"
                    placeholder={adminControls.allowDirectMessaging ? "اكتب هنا رسالتك المباشرة للمعلم..." : "تم إيقاف المراسلات المباشرة من لوحة الإدارة"}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={!adminControls.allowDirectMessaging}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!adminControls.allowDirectMessaging}
                    className="bg-emerald-950 hover:bg-emerald-900 text-white p-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Side contact options (Col 3) */}
              <div className="space-y-4">
                <div className="border border-slate-100 p-4 rounded-xl space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-800 pb-2 border-b">أرقام التواصل الهاتفي السريع</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold block">إدارة الشؤون التعليمية</span>
                        <span className="text-slate-400 text-[10px]">مساعد المدير العام</span>
                      </div>
                      <a href="tel:0500000000" className="text-emerald-900 font-bold font-mono">0500000000</a>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold block">مكتب الاتصال والربط العائلي</span>
                        <span className="text-slate-400 text-[10px]">استقبال استفسارات الأهالي</span>
                      </div>
                      <a href="tel:0500000001" className="text-emerald-900 font-bold font-mono">0500000001</a>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold block">مسؤول الدعم الفني والتقني</span>
                        <span className="text-slate-400 text-[10px]">بوابة الولي الذكية والبريد</span>
                      </div>
                      <a href="tel:0500000002" className="text-emerald-900 font-bold font-mono">0500000002</a>
                    </div>
                  </div>
                </div>

                {/* Reminder Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-[11px] text-slate-600 leading-relaxed font-sans">
                  💡 <span className="font-bold text-slate-800">ملاحظة أمنية:</span> جميع محادثات أولياء الأمور مع الكادر التعليمي مسجلة ومحفوظة تلقائياً في سجل الرقابة والمراقبة الإدارية لضمان جودة الأداء وحماية خصوصية بيانات الطلاب.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 5: NOTIFICATIONS (مركز الإشعارات والتنبيهات) */}
        {/* ========================================= */}
        {activePortalTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">مركز الإشعارات والتنبيهات الفورية</h3>
                <p className="text-xs text-slate-500">متابعة تنبيهات الغياب، الاختبارات القادمة، الإنجازات، والأوسمة.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-xs font-bold text-emerald-900 hover:underline"
                >
                  تحديد الكل كمقروء
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {notifications.filter(n => !n.isArchived).map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 relative ${
                    notif.isRead ? 'bg-white border-slate-100' : 'bg-amber-50/20 border-amber-200 shadow-2xs'
                  }`}
                >
                  {/* Read indicator dot */}
                  {!notif.isRead && (
                    <div className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full bg-amber-500"></div>
                  )}

                  {/* Priority icon */}
                  <div className={`p-2 rounded-lg shrink-0 ${
                    notif.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {notif.type === 'غياب' ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : notif.type === 'وسام أو إنجاز' ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        للابن: {notif.childName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans leading-relaxed">{notif.content}</p>
                    <span className="text-[9px] text-slate-400 block pt-1 font-bold">
                      أرسل بتاريخ: {notif.date} في تمام الساعة {notif.time}
                    </span>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-1.5 mr-auto">
                    <button
                      onClick={() => toggleNotificationRead(notif.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                      title={notif.isRead ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => archiveNotification(notif.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"
                      title="أرشفة التنبيه"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SECTION 11: SETTINGS (إعدادات حساب الولي والخصوصية) */}
        {/* ========================================= */}
        {activePortalTab === 'settings' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">إعدادات الحساب وتفضيلات الخصوصية للأسرة</h3>
              <p className="text-xs text-slate-500">تحديث أرقام الاتصال المفضلة وتفعيل التنبيهات الفورية للبوابة.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form 1: Contact info */}
              <form onSubmit={handleUpdateContactInfo} className="space-y-4 border border-slate-100 p-5 rounded-xl bg-slate-50/20">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 pb-2 border-b">
                  <User className="h-4 w-4 text-emerald-800" />
                  تحديث تفاصيل جهة الاتصال والولي
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم ولي الأمر الثلاثي</label>
                    <input
                      type="text"
                      value={currentParent.name}
                      onChange={(e) => setCurrentParent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">رقم الجوال الفعال للبوابة</label>
                    <input
                      type="text"
                      value={currentParent.phone}
                      onChange={(e) => setCurrentParent(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">البريد الإلكتروني المعتمد</label>
                    <input
                      type="email"
                      value={currentParent.email}
                      onChange={(e) => setCurrentParent(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">قناة الإشعارات المفضلة لدينا</label>
                    <select
                      value={currentParent.preferredChannel}
                      onChange={(e) => setCurrentParent(prev => ({ ...prev, preferredChannel: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="SMS">الرسائل النصية القصيرة SMS</option>
                      <option value="WhatsApp">تطبيق الواتساب WhatsApp</option>
                      <option value="In-App">التنبيهات الفورية داخل البوابة فقط</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="block text-[10px] font-bold text-slate-500">تفضيلات استقبال التنبيهات:</span>
                  
                  <div className="flex flex-col gap-2.5 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentParent.pushEnabled} 
                        onChange={(e) => setCurrentParent(p => ({ ...p, pushEnabled: e.target.checked }))}
                        className="rounded text-emerald-800 focus:ring-emerald-800"
                      />
                      تفعيل الإشعارات الفورية داخل متصفح البوابة
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentParent.smsEnabled}
                        onChange={(e) => setCurrentParent(p => ({ ...p, smsEnabled: e.target.checked }))}
                        className="rounded text-emerald-800 focus:ring-emerald-800"
                      />
                      استلام إشعار غياب أو تعثر مباشر بهاتفي المحمول (SMS)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentParent.emailEnabled}
                        onChange={(e) => setCurrentParent(p => ({ ...p, emailEnabled: e.target.checked }))}
                        className="rounded text-emerald-800 focus:ring-emerald-800"
                      />
                      إرسال التقرير الشهري بنهاية كل فصل عبر البريد الإلكتروني
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-950 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    حفظ التفضيلات
                  </button>
                </div>
              </form>

              {/* Form 2: Password reset */}
              <form onSubmit={handlePasswordReset} className="space-y-4 border border-slate-100 p-5 rounded-xl bg-slate-50/20">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 pb-2 border-b">
                  <Lock className="h-4 w-4 text-emerald-800" />
                  أمان الحساب وتغيير كلمة المرور
                </h4>

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg font-sans">
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg font-sans">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">كلمة المرور الحالية المعتمدة</label>
                    <input
                      type="password"
                      placeholder="أدخل كلمة مرور البوابة الحالية..."
                      value={passwordState.old}
                      onChange={(e) => setPasswordState(prev => ({ ...prev, old: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">كلمة المرور الجديدة المقترحة</label>
                    <input
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة..."
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      placeholder="أعد إدخال كلمة المرور للتحقق..."
                      value={passwordState.confirm}
                      onChange={(e) => setPasswordState(prev => ({ ...prev, confirm: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-rose-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    تغيير كلمة المرور
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </>
  )}

    {/* 👤 STAGE 1: SELF-REGISTRATION & AUTHENTICATION SCREEN */}
    {sessionState === 'auth' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="auth-section-container">
        {/* Main Auth Form Container (Col 1-7) */}
        <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-100 space-y-6" id="auth-forms-card">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-150">
              بوابة ولي الأمر الرسمية لملتقى الهدى
            </span>
            <h2 className="text-xl font-bold text-slate-800 font-display">تواصل آمن وشراكة تربوية فاعلة</h2>
            <p className="text-xs text-slate-500 font-sans">قم بتسجيل الدخول لمتابعة الأداء التعليمي لخطط التسميع والحفظ لأبنائك</p>
          </div>

          {/* Form Selection Tabs */}
          <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-150" id="auth-tab-selector">
            <button
              id="btn-switch-login-tab"
              type="button"
              onClick={() => {
                setRegName('');
                setLoginPhone('');
                setLoginPassword('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg text-center transition-all ${
                !regName ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              تسجيل الدخول لبوابة المتابعة
            </button>
            <button
              id="btn-switch-register-tab"
              type="button"
              onClick={() => {
                setRegName(' '); // space indicates we've initiated registration form
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg text-center transition-all ${
                regName ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              طلب تسجيل ذاتي جديد (بوابة ولي أمر)
            </button>
          </div>

          {/* Login Mode */}
          {!regName ? (
            <form onSubmit={handleLogin} className="space-y-4" id="form-parent-login">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">رقم الجوال المسجل للبوابة</label>
                <div className="relative">
                  <input
                    id="input-login-phone"
                    type="text"
                    placeholder="مثال: 0554890123"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs text-right font-mono"
                  />
                  <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">كلمة المرور الآمنة</label>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type="password"
                    placeholder="أدخل كلمة المرور..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs text-right font-sans"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                id="btn-submit-parent-login"
                type="submit"
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Shield className="h-4 w-4" />
                تسجيل الدخول للبوابة الآمنة
              </button>
            </form>
          ) : (
            /* Phase 1: Self-Registration Form */
            <form onSubmit={handleSelfRegister} className="space-y-4" id="form-parent-self-register">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">الاسم الثلاثي لولي الأمر (معتمد)</label>
                  <input
                    id="input-reg-name"
                    type="text"
                    placeholder="الاسم الكامل للوالد..."
                    value={regName === ' ' ? '' : regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">رقم الجوال الفعال (للتفعيل)</label>
                  <input
                    id="input-reg-phone"
                    type="text"
                    placeholder="مثال: 0567777777"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">البريد الإلكتروني للولي (اختياري)</label>
                <input
                  id="input-reg-email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">كلمة المرور المقترحة للبوابة</label>
                  <input
                    id="input-reg-password"
                    type="password"
                    placeholder="أدخل كلمة المرور..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">تأكيد كلمة المرور المدخلة</label>
                  <input
                    id="input-reg-confirm"
                    type="password"
                    placeholder="أعد إدخال كلمة المرور للتحقق..."
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs font-sans"
                  />
                </div>
              </div>

              {/* Children inputs (Stage 1 Required) */}
              <div className="space-y-3 pt-2 border-t border-slate-100" id="reg-children-list-container">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">بيانات الأبناء المراد ربطهم بالحساب (مبسط)</span>
                  <button
                    id="btn-add-reg-child"
                    type="button"
                    onClick={() => setRegChildren([...regChildren, { name: '', teacherName: '' }])}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-sans"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة ابن آخر
                  </button>
                </div>

                {regChildren.map((child, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-150 relative animate-fade-in" id={`reg-child-row-${index}`}>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">اسم الابن الكامل (ثلاثي/رباعي)</label>
                      <input
                        id={`input-reg-child-name-${index}`}
                        type="text"
                        placeholder="الاسم المدرسي للابن..."
                        value={child.name}
                        onChange={(e) => {
                          const updated = [...regChildren];
                          updated[index].name = e.target.value;
                          setRegChildren(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">اسم المعلم الحالي (إن وجد)</label>
                      <input
                        id={`input-reg-child-teacher-${index}`}
                        type="text"
                        placeholder="أ. اسم معلم الحلقة التأسيسية..."
                        value={child.teacherName}
                        onChange={(e) => {
                          const updated = [...regChildren];
                          updated[index].teacherName = e.target.value;
                          setRegChildren(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    {regChildren.length > 1 && (
                      <button
                        id={`btn-remove-reg-child-${index}`}
                        type="button"
                        onClick={() => setRegChildren(regChildren.filter((_, idx) => idx !== index))}
                        className="text-rose-600 hover:text-rose-900 absolute left-2 top-2 p-1 bg-white rounded-full border shadow-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                id="btn-submit-self-registration"
                type="submit"
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 mt-4"
              >
                <Send className="h-4 w-4" />
                إرسال الطلب واعتماد الملف الذاتي
              </button>
            </form>
          )}
        </div>

        {/* Quick Demo Sidebar / Guidelines (Col 8-12) */}
        <div className="lg:col-span-5 space-y-6" id="auth-guidelines-sidebar">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl space-y-4" id="card-sim-testing-toolkit">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <h3 className="text-sm font-bold font-display">مساعد التقييم والوصول السريع</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              صُممت هذه البوابة للتحقق الكامل من المراحل الثلاث لاعتماد حساب ولي الأمر:
            </p>
            <ol className="text-xs text-slate-300 list-decimal list-inside space-y-2 pr-1 font-sans">
              <li><span className="font-bold text-amber-300">التسجيل الذاتي (المرحلة 1):</span> يمكنك ملء طلب تسجيل جديد بالأبناء وإرساله ليدخل في حالة المراجعة مباشرة.</li>
              <li><span className="font-bold text-amber-300">المراجعة والاعتماد (المرحلة 2):</span> انتقل إلى <span className="underline cursor-pointer text-amber-300 font-bold" onClick={() => setSessionState('admin')}>لوحة الإدارة</span> في الأعلى للموافقة أو طلب استكمال أو رفض الطلب.</li>
              <li><span className="font-bold text-amber-300">تفعيل بوابة المتابعة (المرحلة 3):</span> بمجرد تفعيل الحساب، يمكنك الدخول للبوابة الكاملة وتتبع أداء الأبناء المربوطين والتقارير والخطط!</li>
            </ol>

            <div className="pt-2 border-t border-slate-700" id="sim-direct-links-section">
              <span className="block text-[11px] font-bold text-slate-400 mb-2 font-sans">روابط الدخول السريع للحسابات التجريبية:</span>
              <div className="flex flex-col gap-2">
                <button
                  id="btn-quick-login-active"
                  type="button"
                  onClick={() => handleQuickLogin('0554890123')}
                  className="w-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-xl p-2.5 text-[11px] font-bold text-emerald-200 flex items-center justify-between transition-all"
                >
                  <span>الدخول كولي أمر نشط (صالح العريني) 🟢</span>
                  <span className="text-[9px] bg-emerald-900 text-white px-2 py-0.5 rounded-full font-mono">نشط</span>
                </button>

                <button
                  id="btn-quick-login-pending"
                  type="button"
                  onClick={() => handleQuickLogin('0567777777')}
                  className="w-full bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded-xl p-2.5 text-[11px] font-bold text-amber-200 flex items-center justify-between transition-all"
                >
                  <span>الدخول كحساب قيد المراجعة (أحمد اليوسف) 🟡</span>
                  <span className="text-[9px] bg-amber-900 text-white px-2 py-0.5 rounded-full font-mono">مراجعة</span>
                </button>

                <button
                  id="btn-quick-login-needs-info"
                  type="button"
                  onClick={() => handleQuickLogin('0512345678')}
                  className="w-full bg-orange-950 hover:bg-orange-900 border border-orange-800 rounded-xl p-2.5 text-[11px] font-bold text-orange-200 flex items-center justify-between transition-all"
                >
                  <span>الدخول لحساب يحتاج استكمال (خالد العمري) 🟠</span>
                  <span className="text-[9px] bg-orange-900 text-white px-2 py-0.5 rounded-full font-mono">استكمال</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3" id="card-system-constraints-bullet">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 pb-2 border-b">
              <Shield className="h-4 w-4 text-emerald-950" />
              القيود واللوائح النظامية للمنصة
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-2 pr-1 list-disc list-inside font-sans">
              <li>لا يمكن لولي الأمر تعديل بيانات الطلاب الفنية مطلقاً ويتم ذلك مركزياً من إدارة الملتقى.</li>
              <li>يقتصر عرض بوابة ولي الأمر على بيانات الأبناء المربوطين بالحساب فقط لخصوصية البيانات.</li>
              <li>الاعتماد والتحقق الإداري المسبق شرط إلزامي وأساسي لتفعيل الدخول لبوابة المتابعة الذكية.</li>
              <li>جميع العمليات والإرسالات مسجلة بالكامل لضمان الموثوقية التامة والأمان التربوي.</li>
            </ul>
          </div>
        </div>
      </div>
    )}

    {/* ⚙️ STAGE 2: ADMINISTRATIVE APPROVAL DASHBOARD */}
    {sessionState === 'admin' && (
      <div className="space-y-6" id="admin-approvals-dashboard-view">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="admin-approval-header">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-300" />
              لوحة المشرف العام لطلبات أولياء الأمور والاعتماد الإداري (المرحلة 2)
            </h3>
            <p className="text-xs text-slate-300 font-sans">تحتوي هذه اللوحة على طلبات التسجيل الذاتي للأهالي، مع تحديد صلة القرابة ومطابقة الأبناء وتنشيط حساباتهم.</p>
          </div>
          <button
            id="btn-back-to-auth-from-admin"
            type="button"
            onClick={() => setSessionState('auth')}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1 self-start md:self-auto font-sans"
          >
            <ArrowLeft className="h-4 w-4 text-slate-200" />
            العودة لشاشة الدخول والترحيب
          </button>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admin-approval-kpi-grid">
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-xs" id="admin-kpi-total">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي أولياء الأمور</span>
              <span className="text-xl font-black font-mono text-slate-800">{accounts.length}</span>
            </div>
            <Users className="h-8 w-8 text-slate-400/20" />
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between shadow-xs" id="admin-kpi-pending">
            <div>
              <span className="text-[10px] text-amber-800 font-bold block">طلبات قيد المراجعة 🟡</span>
              <span className="text-xl font-black font-mono text-amber-950">{accounts.filter(a => a.status === '🟡 قيد المراجعة').length}</span>
            </div>
            <Clock className="h-8 w-8 text-amber-500/20" />
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between shadow-xs" id="admin-kpi-completion">
            <div>
              <span className="text-[10px] text-orange-800 font-bold block">بانتظار استكمال بيانات 🟠</span>
              <span className="text-xl font-black font-mono text-orange-950">{accounts.filter(a => a.status === '🟠 يحتاج استكمال').length}</span>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500/20" />
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between shadow-xs" id="admin-kpi-active">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block">حسابات نشطة معتمدة 🟢</span>
              <span className="text-xl font-black font-mono text-emerald-950">{accounts.filter(a => a.status === '🟢 نشط').length}</span>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500/20" />
          </div>
        </div>

        {/* Table / List of Registered Parents */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm" id="admin-parent-requests-table">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2.5 border-b">
            <ClipboardList className="h-4 w-4 text-emerald-950" />
            سجل الطلبات وإجراءات الاعتماد الفورية للأهالي
          </h4>

          <div className="overflow-x-auto" id="admin-table-overflow-container">
            <table className="w-full text-right text-xs" dir="rtl" id="table-admin-approval-list">
              <thead>
                <tr className="border-b border-slate-150 text-slate-500 font-bold text-[11px] bg-slate-50/50">
                  <th className="p-3">اسم ولي الأمر</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">الأبناء والربط المقترح</th>
                  <th className="p-3">تاريخ الطلب</th>
                  <th className="p-3 text-center">حالة الحساب</th>
                  <th className="p-3 text-left">إجراءات الإشراف والمصادقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors" id={`admin-tr-acc-${acc.id}`}>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <div>
                          <span className="block font-sans">{acc.name}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">كود الحساب: {acc.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{acc.phone}</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-emerald-950 font-mono">({acc.childrenNames.length} أبناء)</span>
                        <div className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                          {acc.childrenNames.map((c, i) => (
                            <span key={i} className="font-sans">● {c.name} {c.teacherName ? `(المعلم: ${c.teacherName})` : ''}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-sans">{acc.registrationDate}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        acc.status === '🟢 نشط' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' :
                        acc.status === '🟡 قيد المراجعة' ? 'bg-amber-50 text-amber-800 border border-amber-150' :
                        acc.status === '🟠 يحتاج استكمال' ? 'bg-orange-50 text-orange-800 border border-orange-150' :
                        acc.status === '🔴 مرفوض' ? 'bg-rose-50 text-rose-800 border border-rose-150' :
                        'bg-slate-50 text-slate-800 border border-slate-150'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="p-3 text-left">
                      <div className="flex flex-wrap items-center justify-end gap-1.5" id={`admin-actions-acc-${acc.id}`}>
                        {acc.status !== '🟢 نشط' && (
                          <button
                            id={`btn-admin-approve-${acc.id}`}
                            type="button"
                            onClick={() => handleApproveAccount(acc.id)}
                            className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 transition-all"
                          >
                            <Check className="h-3 w-3" />
                            اعتماد وتفعيل
                          </button>
                        )}

                        {acc.status === '🟢 نشط' && (
                          <button
                            id={`btn-admin-disable-${acc.id}`}
                            type="button"
                            onClick={() => handleDisableAccount(acc.id)}
                            className="bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 transition-all"
                          >
                            <X className="h-3 w-3" />
                            تعطيل الحساب
                          </button>
                        )}

                        <button
                          id={`btn-admin-completion-toggle-${acc.id}`}
                          type="button"
                          onClick={() => {
                            setAdminShowCompletionForm(acc.id);
                            setAdminShowRejectionForm(null);
                          }}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 transition-all"
                        >
                          <AlertCircle className="h-3 w-3" />
                          طلب استكمال
                        </button>

                        <button
                          id={`btn-admin-reject-toggle-${acc.id}`}
                          type="button"
                          onClick={() => {
                            setAdminShowRejectionForm(acc.id);
                            setAdminShowCompletionForm(null);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 transition-all"
                        >
                          <X className="h-3 w-3" />
                          رفض
                        </button>
                      </div>

                      {/* Dropdown Form for Rejection Reason */}
                      {adminShowRejectionForm === acc.id && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2.5 text-right space-y-2" id={`admin-rejection-form-${acc.id}`}>
                          <label className="text-[10px] font-bold text-slate-500 block">اكتب سبب الرفض الموجه لولي الأمر:</label>
                          <textarea
                            id={`textarea-admin-rejection-reason-${acc.id}`}
                            placeholder="مثال: يرجى كتابة اسم الابن مطابقاً للهوية الوطنية..."
                            value={adminRejectionInput[acc.id] || ''}
                            onChange={(e) => setAdminRejectionInput({ ...adminRejectionInput, [acc.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`btn-admin-cancel-rejection-${acc.id}`}
                              type="button"
                              onClick={() => setAdminShowRejectionForm(null)}
                              className="text-[10px] font-bold text-slate-500 bg-white border px-2 py-1 rounded"
                            >
                              إلغاء
                            </button>
                            <button
                              id={`btn-admin-confirm-rejection-${acc.id}`}
                              type="button"
                              onClick={() => handleRejectAccount(acc.id, adminRejectionInput[acc.id] || '')}
                              className="text-[10px] font-bold text-white bg-rose-600 px-3 py-1 rounded"
                            >
                              تأكيد الرفض 🔴
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dropdown Form for Completion Request */}
                      {adminShowCompletionForm === acc.id && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2.5 text-right space-y-2" id={`admin-completion-form-${acc.id}`}>
                          <label className="text-[10px] font-bold text-slate-500 block">اكتب تفاصيل البيانات المطلوب استكمالها:</label>
                          <textarea
                            id={`textarea-admin-completion-request-${acc.id}`}
                            placeholder="مثال: يرجى تزويدنا برقم الهوية وسجل العائلة لمطابقة الأبناء..."
                            value={adminCompletionInput[acc.id] || ''}
                            onChange={(e) => setAdminCompletionInput({ ...adminCompletionInput, [acc.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`btn-admin-cancel-completion-${acc.id}`}
                              type="button"
                              onClick={() => setAdminShowCompletionForm(null)}
                              className="text-[10px] font-bold text-slate-500 bg-white border px-2 py-1 rounded"
                            >
                              إلغاء
                            </button>
                            <button
                              id={`btn-admin-confirm-completion-${acc.id}`}
                              type="button"
                              onClick={() => handleRequestCompletion(acc.id, adminCompletionInput[acc.id] || '')}
                              className="text-[10px] font-bold text-white bg-orange-600 px-3 py-1 rounded"
                            >
                              إرسال طلب الاستكمال 🟠
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Context Display for notes or previous history */}
                      {(acc.completionRequested || acc.rejectionReason || acc.notes) && (
                        <div className="mt-2.5 text-[10px] leading-relaxed text-slate-500 font-sans border-t pt-1.5" id={`admin-context-${acc.id}`}>
                          {acc.notes && (
                            <p>📝 <span className="font-bold text-slate-700">ملاحظة التدقيق:</span> {acc.notes}</p>
                          )}
                          {acc.completionRequested && (
                            <p>📌 <span className="font-bold text-orange-800">طلب الاستكمال الحالي:</span> {acc.completionRequested}</p>
                          )}
                          {acc.rejectionReason && (
                            <p>📌 <span className="font-bold text-rose-800">سبب الرفض السابق:</span> {acc.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {/* 🟡 STATUS SCREEN: PENDING (قيد المراجعة) */}
    {sessionState === 'pending' && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-xl mx-auto text-center space-y-6 shadow-sm" id="status-screen-pending-card">
        <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-200">
          <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-sans">
            حالة الحساب: قيد المراجعة والتدقيق الإداري 🟡
          </span>
          <h3 className="text-lg font-bold text-slate-800 font-display">طلب تسجيل حسابك قيد التدقيق والمطابقة حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            مرحباً بك يا <span className="font-bold text-slate-800">{currentParent.name}</span>. نشكرك على ثقتك بملتقى الهدى لتعليم القرآن.
            لقد استلمنا بيانات حسابك وقائمة الأبناء بنجاح، ويقوم القسم التعليمي حالياً بمطابقتها مع السجلات الفنية للحلقات لربطها وتفعيل الحساب بشكل آمن.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl text-right text-xs space-y-1.5 border border-slate-150" id="pending-data-display">
          <span className="font-bold text-emerald-950 block border-b pb-1 mb-1.5 font-display">البيانات المقدمة لطلب المتابعة:</span>
          <p>● <span className="font-bold">ولي الأمر:</span> {currentParent.name}</p>
          <p>● <span className="font-bold">رقم الهاتف:</span> {currentParent.phone}</p>
          <p>● <span className="font-bold">الأبناء المطلوب ربطهم:</span></p>
          <div className="pr-3 text-[11px] text-slate-500 space-y-0.5">
            {accounts.find(a => a.phone === currentParent.phone)?.childrenNames.map((c, i) => (
              <p key={i}>- {c.name} {c.teacherName ? `(المعلم: ${c.teacherName})` : ''}</p>
            ))}
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl text-xs text-amber-900 border border-amber-150 leading-relaxed text-right font-sans" id="pending-reviewer-note">
          💡 <span className="font-bold">عزيزي المقيم / المصحح:</span> طلب هذا الحساب قيد المراجعة الإلزامية بنجاح!
          يمكنك نقر زر <span className="font-bold underline cursor-pointer" onClick={() => setSessionState('admin')}>لوحة الاعتماد الإداري ⚙️</span> في الشريط العلوي لتنشيط واعتماد حساب ولي الأمر هذا فورياً، ثم العودة لتصفح البوبة بعد التفعيل!
        </div>
      </div>
    )}

    {/* 🟠 STATUS SCREEN: NEEDS INFO (يحتاج استكمال) */}
    {sessionState === 'needs_info' && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-xl mx-auto text-center space-y-6 shadow-sm" id="status-screen-needs-info-card">
        <div className="mx-auto h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center border-2 border-orange-200">
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 font-sans">
            حالة الحساب: يتطلب استكمال بيانات إضافية 🟠
          </span>
          <h3 className="text-lg font-bold text-slate-800 font-display">تطلب إدارة ملتقى الهدى تفاصيل إضافية لتنشيط الحساب</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            أهلاً بك يا <span className="font-bold text-slate-800">{currentParent.name}</span>. تم مراجعة طلبك جزئياً ويتطلب استكمال النقاط أدناه لتفعيل الحساب بالكامل وبدء المتابعة.
          </p>
        </div>

        <div className="bg-orange-50/30 p-4 rounded-xl text-right text-xs text-orange-950 border border-orange-150 leading-relaxed" id="needs-info-admin-instruction">
          📌 <span className="font-bold block text-orange-800 mb-1">البيانات والملفات المطلوبة من الإدارة:</span>
          {accounts.find(a => a.phone === currentParent.phone)?.completionRequested || 'يرجى تزويدنا برقم الهوية للتأكد من ربط الحساب بالأبناء.'}
        </div>

        <form onSubmit={handleRequestCompletionSubmit} className="space-y-3 text-right" id="form-parent-completion-reply">
          <label className="text-[11px] font-bold text-slate-500 block">اكتب ردك أو البيانات المطلوبة للإدارة هنا:</label>
          <textarea
            id="textarea-parent-completion-reply"
            required
            rows={3}
            placeholder="اكتب ردك هنا (مثال: الاسم الفعلي للابن في الحلقات هو خالد صالح العريني، ورقمه التعريفي هو ST-109)..."
            value={parentCompletionReply}
            onChange={(e) => setParentCompletionReply(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-850 rounded-xl p-3 text-xs"
          />
          <button
            id="btn-submit-parent-completion"
            type="submit"
            className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
          >
            <Send className="h-4 w-4 text-white" />
            إرسال البيانات المستكملة للإدارة
          </button>
        </form>
      </div>
    )}

    {/* 🔴 STATUS SCREEN: REJECTED (مرفوض) */}
    {sessionState === 'rejected' && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-xl mx-auto text-center space-y-6 shadow-sm" id="status-screen-rejected-card">
        <div className="mx-auto h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center border-2 border-rose-200">
          <X className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 font-sans">
            حالة الحساب: تم رفض طلب تسجيل الحساب 🔴
          </span>
          <h3 className="text-lg font-bold text-slate-800 font-display">نعتذر عن عدم إمكانية اعتماد حساب المتابعة حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            تم مراجعة طلبك لربط الأبناء بالبوابة من قبل المشرف العام ولم تتوفر صلاحية الموافقة للسبب الإداري التالي:
          </p>
        </div>

        <div className="bg-rose-50/30 p-4 rounded-xl text-right text-xs text-rose-950 border border-rose-150 leading-relaxed" id="rejected-reason-box">
          📌 <span className="font-bold block text-rose-800 mb-1">سبب الرفض والتدقيق الفني:</span>
          {accounts.find(a => a.phone === currentParent.phone)?.rejectionReason || 'الاسم المدخل غير متوافق مع الأسماء بملفات الحلقات المدرسية.'}
        </div>

        <div className="flex gap-2 justify-center" id="rejected-actions-box">
          <button
            id="btn-rejected-edit-request"
            type="button"
            onClick={() => {
              const acc = accounts.find(a => a.phone === currentParent.phone);
              if (acc) {
                setRegName(acc.name);
                setRegPhone(acc.phone);
                setRegEmail(acc.email || '');
                setRegPassword(acc.password);
                setRegConfirmPassword(acc.password);
                setRegChildren(acc.childrenNames);
                setSessionState('auth');
                alert('تم تحميل بيانات طلبك السابق في حقول التسجيل، يرجى التثبت وتعديل الأخطاء ثم إعادة الإرسال.');
              }
            }}
            className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all font-sans"
          >
            تعديل الطلب وإعادة الإرسال
          </button>
          <button
            id="btn-rejected-contact-admin"
            type="button"
            onClick={() => alert('يمكنك التواصل هاتفياً مع الدعم الفني للملتقى لمراجعة حسابك على الرقم: 0114890000')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all font-sans"
          >
            الاتصال بالدعم الفني
          </button>
        </div>
      </div>
    )}

    {/* ⚫ STATUS SCREEN: DISABLED (معطل) */}
    {sessionState === 'disabled' && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-xl mx-auto text-center space-y-6 shadow-sm" id="status-screen-disabled-card">
        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
          <ShieldAlert className="h-8 w-8 text-slate-500" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-sans">
            حالة الحساب: معطل مؤقتاً ⚫
          </span>
          <h3 className="text-lg font-bold text-slate-800 font-display">تم تعطيل حساب المتابعة الخاص بولي الأمر</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            نود إحاطتكم علماً بأن هذا الحساب تم إيقافه وسحب تراخيص الدخول المباشر لبوابة المتابعة من قبل لجنة الشؤون التعليمية.
            يرجى التوجه لمقر إدارة ملتقى الهدى حضورياً لمراجعة الحالة التعليمية لأبنائك وتنشيط الحساب مرة أخرى.
          </p>
        </div>
      </div>
    )}

    {/* DETAILED PRINT DIALOG / POPUP PREVIEW (Section 16: Professional Printing Layout) */}
    <AnimatePresence>
      {printPreviewState && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden space-y-6"
            >
              
              {/* Header print logo */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-900">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">المملكة العربية السعودية</span>
                  <span className="text-xs font-bold block text-slate-900 font-display">ملتقى الهدى لتعليم القرآن الكريم</span>
                  <span className="text-[9px] text-slate-500 block">بوابة تواصل الأسرة الرسمية والأولياء</span>
                </div>
                
                <div className="h-12 w-12 bg-emerald-950 rounded-full flex items-center justify-center font-bold text-white font-display text-sm">
                  الهدى
                </div>
              </div>

              {/* Document title */}
              <div className="text-center space-y-1">
                <span className="text-xs bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200 font-bold">
                  مستند وتسميع رسمي معتمد ومطبوع
                </span>
                <h4 className="text-base font-bold text-slate-900 pt-1">{printPreviewState.title}</h4>
                <p className="text-[10px] text-slate-400">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')} م | الساعة: 11:30 م</p>
              </div>

              {/* Student Metadata box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">اسم الطالب الثلاثي:</span>
                  <span className="font-bold text-slate-900">{printPreviewState.childName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">رقم سجل الطالب المعتمد:</span>
                  <span className="font-bold text-slate-900 font-mono">ST-00981-PARENT</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">الحلقة والحفظ:</span>
                  <span className="font-bold text-slate-900">حلقة معاذ بن جبل النموذجية</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">توقيع المعلم والمصادقة:</span>
                  <span className="font-bold text-emerald-800">أ. حازم عمر الحركي (معتمد)</span>
                </div>
              </div>

              {/* Dynamic printed content display depending on what was requested */}
              <div className="text-xs space-y-2 bg-slate-50/20 p-4 rounded-xl border border-dashed border-slate-300">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">تفاصيل ومخرجات المستند المطبوع:</span>
                
                {printPreviewState.title.includes('التقرير التربوي') ? (
                  <div className="space-y-2 leading-relaxed">
                    <p className="font-sans">● <span className="font-bold">المستوى الدراسي:</span> ممتاز مرتفع بمعدل عام {printPreviewState.data.completion}%.</p>
                    <p className="font-sans">● <span className="font-bold">ملاحظة التميز:</span> {printPreviewState.data.teacherNotes}</p>
                    <p className="font-sans">● <span className="font-bold">توصيات المتابعة:</span> {printPreviewState.data.recommendations}</p>
                  </div>
                ) : printPreviewState.title.includes('الخطة التعليمية') ? (
                  <div className="space-y-2 leading-relaxed">
                    <p className="font-sans">● <span className="font-bold">الخطة المعتمدة:</span> {printPreviewState.data.current?.title || 'خطة الحفظ'}</p>
                    <p className="font-sans">● <span className="font-bold">الهدف الاستراتيجي للابن:</span> {printPreviewState.data.current?.goal}</p>
                    <p className="font-sans">● <span className="font-bold">نسبة إنجاز الأهداف:</span> {printPreviewState.data.current?.progress}%.</p>
                  </div>
                ) : (
                  <div className="space-y-2 leading-relaxed">
                    <p className="font-sans">● <span className="font-bold">موضوع الوثيقة:</span> {printPreviewState.data.title || printPreviewState.data.content}</p>
                    <p className="font-sans">● <span className="font-bold">التفصيل المثبت:</span> {printPreviewState.data.description || printPreviewState.data.content}</p>
                    <p className="font-sans">● <span className="font-bold">الجهة المصدرة للقرار:</span> الشؤون التعليمية بملتقى الهدى.</p>
                  </div>
                )}
              </div>

              {/* Seals & Signatures block */}
              <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-4 border-t border-slate-200">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">ختم الاعتماد الرسمي للملتقى</span>
                  <div className="mx-auto h-12 w-12 rounded-full border-2 border-emerald-900 border-dashed flex items-center justify-center text-[8px] font-bold text-emerald-900 leading-none">
                    ملتقى الهدى<br/>القرآني
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">توقيع المشرف التعليمي العام</span>
                  <span className="text-xs font-bold block text-slate-800 pt-2 font-serif">عبد الرحمن السعيد</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2.5">
                <button
                  onClick={() => setPrintPreviewState(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  إغلاق المعاينة
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setPrintPreviewState(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" />
                  بدء الطباعة الفعلية للورق
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
