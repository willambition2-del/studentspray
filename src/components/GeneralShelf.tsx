import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, Download, Upload, Plus, Trash2, Pin, Megaphone, 
  Sparkles, AlertCircle, FileCheck, Search, Filter, MessageSquare, 
  Share2, Shield, Heart, Eye, CheckCircle, Clock, Paperclip, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShelfPost, ShelfResource, ShelfAnnouncement, ShelfReflection, User } from '../types';
import {
  getShelfSections,
  getShelfItems,
  createShelfItem,
  createShelfSection,
  deleteShelfItem,
  ShelfSection,
  ShelfItem,
} from '../lib/api/shelf';

interface GeneralShelfProps {
  currentUser: User | any;
}

export default function GeneralShelf({ currentUser }: GeneralShelfProps) {
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'resources' | 'announcements' | 'reflections'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal States
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showAddReflectionModal, setShowAddReflectionModal] = useState(false);

  // User Permissions
  const userType = currentUser?.type || 'student';
  const isAdminOrDirector = userType === 'admin' || userType === 'branch_manager';
  const isTeacherOrSupervisor = userType === 'teacher' || userType === 'supervisor';
  const canPublish = isAdminOrDirector || isTeacherOrSupervisor;

  // Initial Mock State for Posts
  const [posts, setPosts] = useState<ShelfPost[]>([
    {
      id: 'post-1',
      title: 'بدء التسجيل في المبادرة الصيفية لختم السورة الكريمة',
      content: 'تعلن الإدارة العامة للملتقى عن فتح باب التسجيل في المبادرة القرآنية الرمضانية والصيفية لتكثيف الحفظ والمراجعة لحفظة كتاب الله. نرجو من كافة أولياء الأمور والمدرسين تحفيز الطلاب.',
      category: 'announcement',
      authorName: 'الشيخ عبدالرحمن بن محمد السعيد',
      authorRole: 'المدير العام',
      authorId: 'u-1',
      date: '1447/08/10 هـ',
      isPinned: true,
      targetAudience: 'all',
      attachmentName: 'جدول_المبادرة_الصيفية.pdf',
      attachmentUrl: '#'
    },
    {
      id: 'post-2',
      title: 'وقفة تدبرية: إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا',
      content: 'من الفوائد العظيمة في تكرار النظر في سورة الزلزلة أن يستحضر المؤمن عظمة الحساب ودقة الأعمال، وأن يحرص الطالب على تعاهد القرآن صفحة صفحة ولا يستصغر قليل العمل.',
      category: 'reflection',
      authorName: 'الأستاذ محمد بن فهد الدوسري',
      authorRole: 'الموجه الفني التربوي',
      authorId: 'u-3',
      date: '1447/08/08 هـ',
      isPinned: false,
      targetAudience: 'all'
    },
    {
      id: 'post-3',
      title: 'تنبيه هائم: مواعيد الاختبار المجمع للفصل الدراسي الأول',
      content: 'نلفت عناية الإخوة المدرسين إلى أن الاختبار المجمع سيبدأ يوم الأحد القادم. يرجى استكمال رصد الدرجات اليومية وتصفية السجلات قبل موعد اللجنة.',
      category: 'warning',
      authorName: 'الأستاذ خالد بن عبدالله النفيسي',
      authorRole: 'المدير التنفيذي',
      authorId: 'u-2',
      date: '1447/08/05 هـ',
      isPinned: false,
      targetAudience: 'teachers'
    },
    {
      id: 'post-4',
      title: 'توجيه تربوي: كيف تجعل ابنك يحب الحلقة القرآنية؟',
      content: 'إن التحفيز بالكلمة الطيبة والثناء أمام الزملاء والاستماع الدائم لقراءته بالبيت يغرس في نفس الابن حب المسجد والارتباط الوثيق بالحلقة القرآنية.',
      category: 'guidance',
      authorName: 'الأستاذ عمر بن عبدالعزيز التركي',
      authorRole: 'معلم حلقة',
      authorId: 'u-4',
      date: '1447/08/02 هـ',
      isPinned: false,
      targetAudience: 'parents'
    }
  ]);

  // Initial Mock Resources (Files)
  const [resources, setResources] = useState<ShelfResource[]>([
    {
      id: 'res-1',
      title: 'مصحف التجويد الملون مع تفسير المفردات',
      description: 'نسخة رقمية عالية الجودة مع تظليل أحكام التجويد ومفردات الغريب لطلاب المستويات المتقدمة.',
      fileType: 'pdf',
      fileName: 'مصحف_التجويد_الملون.pdf',
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...', // mock data url
      fileSize: '18.4 MB',
      date: '1447/07/20 هـ',
      addedBy: 'إدارة الشؤون التعليمية',
      downloadCount: 142
    },
    {
      id: 'res-2',
      title: 'متن الجزرية في التجويد (مكتوب ومضبوط)',
      description: 'الملزمة الرسمية المقررة لدورة التجويد والضباط بحلقة حفص للإتقان.',
      fileType: 'doc',
      fileName: 'متن_الجزرية_المعتمد.docx',
      fileUrl: 'data:application/msword;base64,JVBERi0xLjQKJ...',
      fileSize: '2.1 MB',
      date: '1447/07/15 هـ',
      addedBy: 'أ. حازم عمر الحركي',
      downloadCount: 89
    },
    {
      id: 'res-3',
      title: 'دليل ولي الأمر لمتابعة خطة الحفظ اليومية',
      description: 'كتيب إرشادي يشرح كيفية تتبع دفتر المتابعة المنزلي والتواصل مع المعلم عبر النظام.',
      fileType: 'book',
      fileName: 'دليل_ولي_الأمر.pdf',
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
      fileSize: '4.5 MB',
      date: '1447/07/01 هـ',
      addedBy: 'المدير التنفيذي',
      downloadCount: 210
    }
  ]);

  // Initial Mock Reflections
  const [reflections, setReflections] = useState<ShelfReflection[]>([
    {
      id: 'ref-1',
      verseOrTitle: 'وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ',
      reflectionText: 'التنافس في حفظ القرآن منافسة شريفة تعمر القلوب بالسكينة والأخلاق، وتجعل أوقات الشباب معمورة بذكر الله.',
      authorName: 'الشيخ عبد الرحمن السعيد',
      date: '1447/08/09 هـ',
      category: 'قرآني'
    },
    {
      id: 'ref-2',
      verseOrTitle: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      reflectionText: 'شرف التعليم لا يضاهيه شرف، ومنّة الله على معلم القرآن أن جعل أوقاته في تعليم كلام الله سبحانه.',
      authorName: 'أ. محمد الدوسري',
      date: '1447/08/04 هـ',
      category: 'تربوي'
    }
  ]);

  const [sections, setSections] = useState<ShelfSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load backend data
  const loadShelfData = async () => {
    try {
      setApiError(null);
      let loadedSections = await getShelfSections();
      if (!loadedSections || loadedSections.length === 0) {
        // Ensure default section exists
        try {
          const defaultSec = await createShelfSection({
            name: 'القسم العام',
            slug: 'general',
            description: 'المحتوى العام للملتقى القرآني',
            visibility: 'ALL_USERS',
            order: 1,
            isActive: true,
          });
          loadedSections = [defaultSec];
        } catch {
          // ignore if already exists
        }
      }
      setSections(loadedSections);
      const secId = loadedSections[0]?.id;
      setActiveSectionId(secId || null);

      const itemsRes = await getShelfItems();
      const items = itemsRes.items || [];

      // Map to posts, resources, reflections
      const mappedPosts: ShelfPost[] = items
        .filter(it => it.type === 'ANNOUNCEMENT' || it.type === 'ARTICLE' || it.type === 'GENERAL')
        .map(it => ({
          id: it.id,
          title: it.title,
          content: it.content,
          category: it.type === 'ANNOUNCEMENT' ? 'announcement' : 'general',
          authorName: it.authorName || 'الإدارة',
          authorRole: it.authorRole || 'مشرف',
          authorId: it.authorId || '',
          date: new Date(it.publishedAt || it.createdAt).toLocaleDateString('ar-SA'),
          isPinned: it.isPinned,
          targetAudience: it.targetAudience === 'PARENTS_ONLY' ? 'parents' : it.targetAudience === 'TEACHERS_ONLY' ? 'teachers' : 'all',
          attachmentName: it.attachmentName || undefined,
          attachmentUrl: it.attachmentUrl || undefined,
        }));

      const mappedResources: ShelfResource[] = items
        .filter(it => it.type === 'BOOK' || it.type === 'CURRICULUM' || it.type === 'RESOURCE')
        .map(it => ({
          id: it.id,
          title: it.title,
          description: it.content,
          fileType: it.fileType === 'pdf' ? 'pdf' : it.fileType === 'doc' ? 'doc' : 'book',
          fileName: it.attachmentName || 'ملف_تعليمي.pdf',
          fileUrl: it.attachmentUrl || '#',
          fileSize: it.fileSize || '1.5 MB',
          date: new Date(it.publishedAt || it.createdAt).toLocaleDateString('ar-SA'),
          addedBy: it.authorName || 'إدارة الشؤون التعليمية',
          downloadCount: it.downloadCount || 0,
        }));

      if (mappedPosts.length > 0) setPosts(mappedPosts);
      if (mappedResources.length > 0) setResources(mappedResources);
    } catch (err: any) {
      setApiError(err.message || 'تعذر تحميل بيانات الرف العام من الخادم');
    }
  };

  useEffect(() => {
    loadShelfData();
  }, []);

  // Form States
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    category: ShelfPost['category'];
    targetAudience: ShelfPost['targetAudience'];
    attachmentName: string;
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    category: 'general',
    targetAudience: 'all',
    attachmentName: '',
    isPinned: false
  });

  const [newResource, setNewResource] = useState<{
    title: string;
    description: string;
    fileType: ShelfResource['fileType'];
    fileName: string;
    fileContent: string;
  }>({
    title: '',
    description: '',
    fileType: 'pdf',
    fileName: '',
    fileContent: ''
  });

  const [newReflection, setNewReflection] = useState<{
    verseOrTitle: string;
    reflectionText: string;
    category: ShelfReflection['category'];
  }>({
    verseOrTitle: '',
    reflectionText: '',
    category: 'قرآني'
  });

  // Action Handlers
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      setApiError(null);
      const targetSecId = activeSectionId || sections[0]?.id;
      if (!targetSecId) throw new Error('لا يوجد قسم متاح للنشر');

      const audience = newPost.targetAudience === 'parents' ? 'PARENTS_ONLY' : newPost.targetAudience === 'teachers' ? 'TEACHERS_ONLY' : 'ALL_USERS';
      const createdItem = await createShelfItem({
        sectionId: targetSecId,
        title: newPost.title,
        content: newPost.content,
        type: newPost.category === 'announcement' ? 'ANNOUNCEMENT' : 'ARTICLE',
        targetAudience: audience as any,
        isPinned: newPost.isPinned,
        isPublished: true,
        attachmentName: newPost.attachmentName || undefined,
      });

      const created: ShelfPost = {
        id: createdItem.id,
        title: createdItem.title,
        content: createdItem.content,
        category: newPost.category,
        authorName: createdItem.authorName || currentUser?.name || 'مسؤول النظام',
        authorRole: createdItem.authorRole || currentUser?.roleName || 'الإدارة',
        authorId: createdItem.authorId || currentUser?.id,
        date: new Date().toLocaleDateString('ar-SA'),
        isPinned: createdItem.isPinned,
        targetAudience: newPost.targetAudience,
        attachmentName: createdItem.attachmentName || undefined,
        attachmentUrl: createdItem.attachmentUrl || undefined
      };

      setPosts(prev => [created, ...prev]);
      setShowAddPostModal(false);
      setNewPost({ title: '', content: '', category: 'general', targetAudience: 'all', attachmentName: '', isPinned: false });
    } catch (err: any) {
      setApiError(err.message || 'تعذر إنشاء المنشور');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setNewResource(prev => ({
          ...prev,
          fileName: file.name,
          fileContent: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title.trim() || !newResource.fileName) return;

    try {
      setApiError(null);
      const targetSecId = activeSectionId || sections[0]?.id;
      if (!targetSecId) throw new Error('لا يوجد قسم متاح لنشر المصدر');

      const createdItem = await createShelfItem({
        sectionId: targetSecId,
        title: newResource.title,
        content: newResource.description || newResource.title,
        type: newResource.fileType === 'book' ? 'BOOK' : 'RESOURCE',
        targetAudience: 'ALL_USERS',
        fileType: newResource.fileType,
        attachmentName: newResource.fileName,
        isPublished: true,
      });

      const created: ShelfResource = {
        id: createdItem.id,
        title: createdItem.title,
        description: createdItem.content,
        fileType: newResource.fileType,
        fileName: newResource.fileName,
        fileUrl: createdItem.attachmentUrl || 'data:text/plain;base64,2KfZhNmC2LHYo9mGINmE2YTZhdmE2YHZjA==',
        fileSize: '1.2 MB',
        date: new Date().toLocaleDateString('ar-SA'),
        addedBy: createdItem.authorName || currentUser?.name || 'إدارة المركز',
        downloadCount: 0
      };

      setResources(prev => [created, ...prev]);
      setShowAddResourceModal(false);
      setNewResource({ title: '', description: '', fileType: 'pdf', fileName: '', fileContent: '' });
    } catch (err: any) {
      setApiError(err.message || 'تعذر إنشاء المورد التعليمي');
    }
  };

  const handleCreateReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReflection.verseOrTitle.trim() || !newReflection.reflectionText.trim()) return;

    try {
      setApiError(null);
      const targetSecId = activeSectionId || sections[0]?.id;
      if (targetSecId) {
        await createShelfItem({
          sectionId: targetSecId,
          title: newReflection.verseOrTitle,
          content: newReflection.reflectionText,
          type: 'ARTICLE',
          targetAudience: 'ALL_USERS',
          isPublished: true,
        });
      }

      const created: ShelfReflection = {
        id: `ref-${Date.now()}`,
        verseOrTitle: newReflection.verseOrTitle,
        reflectionText: newReflection.reflectionText,
        authorName: currentUser?.name || 'المشرف',
        date: new Date().toLocaleDateString('ar-SA'),
        category: newReflection.category
      };

      setReflections(prev => [created, ...prev]);
      setShowAddReflectionModal(false);
      setNewReflection({ verseOrTitle: '', reflectionText: '', category: 'قرآني' });
    } catch (err: any) {
      setApiError(err.message || 'تعذر إضافة الوقفة التدبرية');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور؟')) {
      try {
        setApiError(null);
        await deleteShelfItem(id);
        setPosts(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        setApiError(err.message || 'تعذر حذف المنشور');
      }
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصدر التعليمي؟')) {
      try {
        setApiError(null);
        await deleteShelfItem(id);
        setResources(prev => prev.filter(r => r.id !== id));
      } catch (err: any) {
        setApiError(err.message || 'تعذر حذف المصدر');
      }
    }
  };

  const handleDownloadFile = (resItem: ShelfResource) => {
    // Increment download count
    setResources(prev => prev.map(r => r.id === resItem.id ? { ...r, downloadCount: r.downloadCount + 1 } : r));

    // Create real trigger download link
    const blob = new Blob([`محتوى تعليمي للملف: ${resItem.title}\nاسم الملف: ${resItem.fileName}\nمركز الهدى القرآني`], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = resItem.fileName || 'ملف_المصدر.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Audience Filtering Logic
  const filteredPosts = posts.filter(post => {
    // Target Audience
    if (post.targetAudience !== 'all') {
      if (post.targetAudience === 'teachers' && !['admin', 'branch_manager', 'supervisor', 'teacher'].includes(userType)) return false;
      if (post.targetAudience === 'students' && !['admin', 'branch_manager', 'student'].includes(userType)) return false;
      if (post.targetAudience === 'parents' && !['admin', 'branch_manager', 'parent'].includes(userType)) return false;
    }
    // Category Filter
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q) || post.authorName.toLowerCase().includes(q);
    }
    return true;
  });

  const getCategoryBadge = (cat: ShelfPost['category']) => {
    switch (cat) {
      case 'announcement':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Megaphone className="h-3 w-3" /> إعلان مهم</span>;
      case 'warning':
        return <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3" /> تنبيه هائل</span>;
      case 'benefit':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="h-3 w-3" /> فائدة قرآنية</span>;
      case 'guidance':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><BookOpen className="h-3 w-3" /> توجيه تربوي</span>;
      case 'reflection':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Heart className="h-3 w-3" /> وقفة تدبرية</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">منشور عام</span>;
    }
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs px-3 py-1 rounded-full font-bold border border-emerald-400/30">
                المساحة التشاركية والمحتوى العام
              </span>
              <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                جميع المستخدمين
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-emerald-300" />
              <span>الرف العام</span>
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl font-light">
              المنصة الموحدة لنشر الإعلانات الرسمية، المصادر التعليمية، والفوائد والوقفات التدبرية لطلاب ومعلمي الملتقى.
            </p>
          </div>

          {apiError && (
            <div className="bg-rose-500/20 border border-rose-400 text-rose-100 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{apiError}</span>
            </div>
          )}

          {canPublish && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddPostModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة منشور</span>
              </button>
              <button
                onClick={() => setShowAddResourceModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4 text-emerald-300" />
                <span>رفع مصدر تعليمي</span>
              </button>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 border-t border-white/10 pt-4 mt-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'posts' 
                ? 'bg-white text-emerald-950 shadow-md font-black' 
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>المنشورات والتوجيهات</span>
            <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded-full text-[10px]">{posts.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'resources' 
                ? 'bg-white text-emerald-950 shadow-md font-black' 
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>المصادر والملفات</span>
            <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded-full text-[10px]">{resources.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'announcements' 
                ? 'bg-white text-emerald-950 shadow-md font-black' 
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>الإعلانات الهامة</span>
            <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded-full text-[10px]">
              {posts.filter(p => p.category === 'announcement' || p.category === 'warning').length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('reflections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'reflections' 
                ? 'bg-white text-emerald-950 shadow-md font-black' 
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>الوقفات والفوائد</span>
            <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded-full text-[10px]">{reflections.length}</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الرف العام..."
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {activeSubTab === 'posts' && (
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">التصنيف:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedCategory('announcement')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                selectedCategory === 'announcement' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              إعلانات
            </button>
            <button
              onClick={() => setSelectedCategory('guidance')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                selectedCategory === 'guidance' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              توجيهات
            </button>
            <button
              onClick={() => setSelectedCategory('reflection')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                selectedCategory === 'reflection' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              وقفات
            </button>
          </div>
        )}
      </div>

      {/* SUB TAB 1: POSTS & GUIDANCE */}
      {activeSubTab === 'posts' && (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">لا توجد منشورات مطابقة للبحث</p>
              <p className="text-xs text-slate-400">يمكنك تعديل خيارات التصفية أو نشر منشور جديد</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div 
                key={post.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md relative ${
                  post.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {post.isPinned && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300">
                    <Pin className="h-3 w-3 fill-amber-700" />
                    <span>منشور مثبت</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(post.category)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {post.date}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{post.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line mb-4 font-normal">
                  {post.content}
                </p>

                {post.attachmentName && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between mb-4 max-w-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Paperclip className="h-4 w-4 text-emerald-600" />
                      <span>{post.attachmentName}</span>
                    </div>
                    <button 
                      onClick={() => alert(`تنزيل المرفق: ${post.attachmentName}`)}
                      className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      تنزيل المرفق
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs">
                      {post.authorName[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{post.authorName}</span>
                      <span className="text-[10px] text-slate-400 block">{post.authorRole}</span>
                    </div>
                  </div>

                  {isAdminOrDirector && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-slate-400 hover:text-rose-600 transition-all p-1 cursor-pointer"
                      title="حذف المنشور"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB TAB 2: RESOURCES & DOWNLOADS */}
      {activeSubTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resItem) => (
            <div key={resItem.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase font-mono">
                    {resItem.fileType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{resItem.date}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{resItem.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{resItem.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>الحجم: {resItem.fileSize || 'غير محدد'}</span>
                  <span>التحميلات: {resItem.downloadCount}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDownloadFile(resItem)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>تنزيل الملف</span>
                  </button>

                  {isAdminOrDirector && (
                    <button
                      onClick={() => handleDeleteResource(resItem.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="حذف المصدر"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB TAB 3: ANNOUNCEMENTS */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-4">
          {posts.filter(p => p.category === 'announcement' || p.category === 'warning').map(ann => (
            <div key={ann.id} className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 relative">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-5 w-5 text-amber-700" />
                <h3 className="font-black text-slate-900 text-base">{ann.title}</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-3">{ann.content}</p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-amber-200/50 pt-2">
                <span>المُصدر: {ann.authorName} ({ann.authorRole})</span>
                <span>التاريخ: {ann.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB TAB 4: REFLECTIONS */}
      {activeSubTab === 'reflections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reflections.map(ref => (
            <div key={ref.id} className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="bg-emerald-200/60 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  فائدة {ref.category}
                </span>
                <span className="text-[10px] text-slate-400">{ref.date}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm text-center py-2 px-3 bg-white/80 rounded-xl border border-emerald-100 font-display">
                "{ref.verseOrTitle}"
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{ref.reflectionText}</p>
              <div className="text-[11px] text-slate-500 text-left pt-2 border-t border-emerald-100">
                — {ref.authorName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD POST */}
      {showAddPostModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">إضافة منشور جديد بالرف العام</h3>
              <button onClick={() => setShowAddPostModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المنشور *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="مثال: تنبيه بخصوص حلقة الحفظ..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تصنيف المنشور</label>
                  <select
                    value={newPost.category}
                    onChange={e => setNewPost({ ...newPost, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  >
                    <option value="general">منشور عام</option>
                    <option value="announcement">إعلان</option>
                    <option value="warning">تنبيه</option>
                    <option value="guidance">توجيه تربوي</option>
                    <option value="benefit">فائدة قرآنية</option>
                    <option value="reflection">وقفة تدبرية</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجمهور المستهدف</label>
                  <select
                    value={newPost.targetAudience}
                    onChange={e => setNewPost({ ...newPost, targetAudience: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  >
                    <option value="all">جميع المستخدمين</option>
                    <option value="teachers">المدرسون فقط</option>
                    <option value="students">الطلاب فقط</option>
                    <option value="parents">أولياء الأمور فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">محتوى المنشور *</label>
                <textarea
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  placeholder="اكتب تفاصيل المنشور هنا..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                  required
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم مرفق (اختياري)</label>
                <input
                  type="text"
                  value={newPost.attachmentName}
                  onChange={e => setNewPost({ ...newPost, attachmentName: e.target.value })}
                  placeholder="مثال: الجدول_التنفيذي.pdf"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              {isAdminOrDirector && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={newPost.isPinned}
                    onChange={e => setNewPost({ ...newPost, isPinned: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isPinned" className="font-bold text-slate-700 text-xs">تثبيت هذا المنشور في أعلى الرف العام</label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700"
                >
                  نشر بالرف العام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD RESOURCE */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">رفع مصدر تعليمي جديد</h3>
              <button onClick={() => setShowAddResourceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المصدر / الكتاب *</label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder="مثال: كتيب التجويد الميسر..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف مختصر</label>
                <input
                  type="text"
                  value={newResource.description}
                  onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                  placeholder="وصف محتوى الملف والهدف منه..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الملف</label>
                  <select
                    value={newResource.fileType}
                    onChange={e => setNewResource({ ...newResource, fileType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  >
                    <option value="pdf">مستند PDF</option>
                    <option value="book">كتاب إلكتروني</option>
                    <option value="doc">ملف Word / مستند</option>
                    <option value="media">مواد تعليمية / صوتية</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اختيار ملف حقيقي *</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full text-xs font-mono p-1"
                  />
                  {newResource.fileName && (
                    <span className="text-[10px] text-emerald-700 font-mono block mt-1">تم إرفاق: {newResource.fileName}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700"
                >
                  رفع وتحفيظ المصدر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
