import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Paperclip, Users, Search, UserCheck, 
  Shield, BookOpen, Clock, Check, CheckCheck, X, FileText, PhoneCall, Sparkles,
  PlusCircle, Pencil, Trash2, Lock, Plus, CheckSquare, Square, UserPlus, Edit3, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation, ChatMessage, User, Student, ChatMember } from '../types';
import { getChatConversations, getChatMessages, sendChatMessage, markChatAsRead } from '../lib/api/chat';

interface ChatSystemProps {
  currentUser: User | any;
  studentsList?: Student[];
}

export default function ChatSystem({ currentUser, studentsList = [] }: ChatSystemProps) {
  const userType = currentUser?.type || 'student';
  const userId = currentUser?.id || 'u-stu';
  const isExecutive = ['admin', 'branch_manager'].includes(userType) || (currentUser?.roleName && currentUser.roleName.includes('المدير'));

  // Active Selected Conversation ID
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Modals and editing state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New conversation form inputs
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatSubtitle, setNewChatSubtitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isRestricted, setIsRestricted] = useState(true);

  // Message edit and delete state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Catalog of available contacts for Directors to pick from
  const availableContacts: ChatMember[] = [
    { id: 'u-1', name: 'الشيخ عبدالرحمن بن محمد السعيد', role: 'المدير العام', avatar: '👨‍💼' },
    { id: 'u-2', name: 'الأستاذ خالد بن عبدالله النفيسي', role: 'المدير التنفيذي', avatar: '👨‍💼' },
    { id: 'u-3', name: 'الأستاذ محمد بن فهد الدوسري', role: 'الموجه الفني والتربوي', avatar: '👨‍🏫' },
    { id: 'u-4', name: 'الأستاذ عبد الرحمن السعيد', role: 'معلم حلقة الطليعة', avatar: '👳' },
    { id: 'u-8', name: 'الأستاذ عمر بن عبدالعزيز التركي', role: 'معلم حلقة ابن كثير', avatar: '👳' },
    { id: 'u-5', name: 'الأستاذ صالح بن سليمان العويّد', role: 'ولي أمر الطالب معاذ العويّد', avatar: '🧔' },
    { id: 'u-6', name: 'الأستاذ فهد بن سعد الدوسري', role: 'ولي أمر الطالب سلمان الدوسري', avatar: '🧔' },
    { id: 'u-7', name: 'الدكتور عبدالله بن إبراهيم السبيعي', role: 'ولي أمر الطالب إبراهيم السبيعي', avatar: '🧔' },
    { id: 'u-stu', name: 'الطالب معاذ بن خالد النفيسي', role: 'طالب بحلقة الطليعة', avatar: '🎓' },
    { id: 'st-2', name: 'الطالب يوسف بن أحمد السعيد', role: 'طالب بحلقة الطليعة', avatar: '🎓' },
    { id: 'st-3', name: 'الطالب عبدالله بن محمد العتيبي', role: 'طالب بحلقة الطليعة', avatar: '🎓' }
  ];

  // Initial Conversations Database
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-staff',
      type: 'staff',
      title: 'مجموعة المدرسين والإدارة',
      subtitle: 'المساحة الخاصة بالكادر التعليمي والإداري للتنسيق اليومي',
      allowedRoles: ['admin', 'branch_manager', 'supervisor', 'teacher'],
      lastMessage: 'أ. حازم: تم تجهيز تقارير الاختبارات اليومية بنجاح.',
      lastMessageTime: '10:30 ص',
      unreadCount: { 'u-4': 1, 'u-1': 0 },
      members: [
        { id: 'u-1', name: 'الشيخ عبدالرحمن بن محمد السعيد', role: 'المدير العام', avatar: '👨‍💼' },
        { id: 'u-2', name: 'الأستاذ خالد بن عبدالله النفيسي', role: 'المدير التنفيذي', avatar: '👨‍💼' },
        { id: 'u-3', name: 'الأستاذ محمد بن فهد الدوسري', role: 'الموجه الفني', avatar: '👨‍🏫' },
        { id: 'u-4', name: 'الأستاذ عمر بن عبدالعزيز التركي', role: 'مدرس حلقة', avatar: '👳' }
      ]
    },
    {
      id: 'conv-circle-taliya',
      type: 'circle',
      title: 'مجموعة حلقة حفظ الطليعة (خاتمين)',
      subtitle: 'المجموعة المخصصة لطلاب ومعلم حلقة الطليعة للخاتمين',
      circleId: 'c1',
      allowedRoles: ['admin', 'branch_manager', 'supervisor', 'teacher', 'student'],
      allowedUserIds: ['u-1', 'u-2', 'u-3', 'u-4', 'u-stu', 'ST-000001', 'ST-000002'],
      lastMessage: 'الشيخ عبدالرحمن: نلتقي اليوم بعد صلاة العصر للتثبيت.',
      lastMessageTime: '09:15 ص',
      unreadCount: { 'u-stu': 0 },
      members: [
        { id: 'u-4', name: 'الأستاذ عبد الرحمن السعيد', role: 'مدرس الحلقة', avatar: '👳' },
        { id: 'u-stu', name: 'معاذ بن خالد النفيسي', role: 'طالب', avatar: '🎓' },
        { id: 'st-2', name: 'يوسف بن أحمد السعيد', role: 'طالب', avatar: '🎓' },
        { id: 'st-3', name: 'عبدالله بن محمد العتيبي', role: 'طالب', avatar: '🎓' }
      ]
    },
    {
      id: 'conv-pt-saleh-abdulrahman',
      type: 'parent_teacher',
      title: 'التواصل مع المدرس أ. عبد الرحمن السعيد',
      subtitle: 'محادثة خاصة ومباشرة بين ولي الأمر (صالح العويّد) ومعلم الحلقة (عبد الرحمن السعيد)',
      teacherId: 'u-4',
      parentId: 'u-5',
      studentId: 'ST-000001',
      allowedRoles: ['parent', 'teacher'],
      allowedUserIds: ['u-4', 'u-5'],
      lastMessage: 'ولي الأمر: السلام عليكم الشيخ عبد الرحمن، أرجو الاطمئنان على مستوى معاذ.',
      lastMessageTime: 'أمس',
      unreadCount: { 'u-4': 1, 'u-5': 0 },
      members: [
        { id: 'u-5', name: 'الأستاذ صالح بن سليمان العويّد', role: 'ولي أمر الطالب معاذ', avatar: '🧔' },
        { id: 'u-4', name: 'الأستاذ عبد الرحمن السعيد', role: 'معلم الحلقة', avatar: '👳' }
      ]
    }
  ]);

  // Initial Messages Database
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'conv-staff': [
      {
        id: 'm1',
        conversationId: 'conv-staff',
        senderId: 'u-1',
        senderName: 'الشيخ عبدالرحمن السعيد',
        senderRole: 'المدير العام',
        content: 'السلام عليكم ورحمة الله وبركاته، أهلاً بكم جميعاً في مجموعة الكادر التعليمي للإدارة.',
        timestamp: '08:00 ص'
      },
      {
        id: 'm2',
        conversationId: 'conv-staff',
        senderId: 'u-3',
        senderName: 'أ. محمد الدوسري',
        senderRole: 'الموجه الفني',
        content: 'وعليكم السلام ورحمة الله، تم التنسيق لمواعيد التوجيه الفني لحلقات المتقدمين.',
        timestamp: '09:30 ص'
      },
      {
        id: 'm3',
        conversationId: 'conv-staff',
        senderId: 'u-4',
        senderName: 'أ. عمر التركي',
        senderRole: 'مدرس حلقة',
        content: 'تم تجهيز تقارير الاختبارات اليومية بنجاح.',
        timestamp: '10:30 ص'
      }
    ],
    'conv-circle-taliya': [
      {
        id: 'mc1',
        conversationId: 'conv-circle-taliya',
        senderId: 'u-4',
        senderName: 'الشيخ عبدالرحمن السعيد',
        senderRole: 'معلم الحلقة',
        content: 'أهلاً بأبنائي طلاب حلقة الطليعة، أذكركم بمراجعة الجزء الأول من سورة البقرة قبل جلسة اليوم.',
        timestamp: '08:30 ص'
      },
      {
        id: 'mc2',
        conversationId: 'conv-circle-taliya',
        senderId: 'u-stu',
        senderName: 'معاذ النفيسي',
        senderRole: 'طالب',
        content: 'حاضر أستاذنا الفاضل، أتممت المراجعة بحمد الله.',
        timestamp: '09:00 ص'
      },
      {
        id: 'mc3',
        conversationId: 'conv-circle-taliya',
        senderId: 'u-4',
        senderName: 'الشيخ عبدالرحمن السعيد',
        senderRole: 'معلم الحلقة',
        content: 'بارك الله فيك يا معاذ. نلتقي اليوم بعد صلاة العصر للتثبيت.',
        timestamp: '09:15 ص'
      }
    ],
    'conv-pt-saleh-abdulrahman': [
      {
        id: 'mpt1',
        conversationId: 'conv-pt-saleh-abdulrahman',
        senderId: 'u-5',
        senderName: 'أ. صالح العويّد',
        senderRole: 'ولي أمر الطالب معاذ',
        content: 'السلام عليكم ورحمة الله وبركاته يا شيخ عبد الرحمن، أود الاطمئنان على التزام معاذ بمقرر الحفظ الجديد.',
        timestamp: 'أمس 06:00 م'
      },
      {
        id: 'mpt2',
        conversationId: 'conv-pt-saleh-abdulrahman',
        senderId: 'u-4',
        senderName: 'أ. عبد الرحمن السعيد',
        senderRole: 'معلم الحلقة',
        content: 'وعليكم السلام ورحمة الله أبا معاذ، معاذ من أنشط الطلاب بالحلقة ومستواه متقدم وممتاز ما شاء الله.',
        timestamp: 'أمس 07:15 م'
      }
    ]
  });

  // Sync conversations from backend NestJS API
  useEffect(() => {
    let isMounted = true;
    getChatConversations()
      .then(apiConvs => {
        if (!isMounted || !Array.isArray(apiConvs) || apiConvs.length === 0) return;
        const mapped: Conversation[] = apiConvs.map(c => ({
          id: c.id,
          type: c.type === 'HALAQA' ? 'circle' : c.type === 'STAFF' ? 'staff' : 'parent_teacher',
          title: c.title,
          subtitle: c.type === 'HALAQA' ? 'حلقة تحفيظ' : c.type === 'STAFF' ? 'طاقم العمل' : 'قناة تواصل',
          icon: c.type === 'HALAQA' ? '📖' : c.type === 'STAFF' ? '🏛️' : '👨‍👧',
          isRestricted: true,
          unreadCount: { [userId]: c.unreadCount },
          lastMessage: c.lastMessage?.text || '',
          lastMessageTime: c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '',
          members: []
        }));
        setConversations(prev => {
          const merged = [...mapped, ...prev.filter(p => !mapped.some(m => m.id === p.id))];
          return merged;
        });
        if (mapped.length > 0 && (!selectedConvId || selectedConvId === 'conv-staff')) {
          setSelectedConvId(mapped[0].id);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedConvId]);

  // Filter visible conversations according to role permissions and targeted user restrictions
  const visibleConversations = conversations.filter(conv => {
    // Parent (ولي الأمر): ONLY sees parent_teacher conversations where they are the designated parent
    if (userType === 'parent') {
      if (conv.type !== 'parent_teacher' && !conv.isCustomPrivate) return false;
      if (conv.parentId && conv.parentId !== userId && conv.allowedUserIds && !conv.allowedUserIds.includes(userId)) {
        return false;
      }
    }

    // Supervisor (الموجه الفني والتربوي): Only sees Teachers & Admin group ('staff')
    if (userType === 'supervisor') {
      if (conv.type !== 'staff' && !conv.allowedUserIds?.includes(userId)) return false;
    }

    // Staff Group filter: Hide from students and parents
    if (conv.type === 'staff') {
      if (['student', 'parent'].includes(userType)) return false;
    }

    // Circle Group filter: Students only see their circle group!
    if (conv.type === 'circle') {
      if (userType === 'student') {
        if (conv.allowedUserIds && !conv.allowedUserIds.includes(userId)) {
          return false;
        }
      }
    }

    // GENERAL MANAGER / EXECUTIVE DIRECTORS:
    // Remove generic parent-teacher channels from their main list UNLESS explicitly created as a targeted private chat for a specific parent!
    if (['admin', 'branch_manager'].includes(userType) || (currentUser?.roleName && currentUser.roleName.includes('المدير'))) {
      if (conv.type === 'parent_teacher') {
        // Only show parent conversations if the manager was explicitly added or if it is a custom targeted chat
        const isExplicit = conv.allowedUserIds?.includes(userId) || conv.members.some(m => m.id === userId);
        const isTargetedCustom = conv.isCustomPrivate || conv.createdById === userId;
        if (!isExplicit && !isTargetedCustom) {
          return false; // Hide non-targeted general parent chats from Executive Director list
        }
      }
    }

    // Custom restricted room permissions check
    if (conv.allowedUserIds && conv.allowedUserIds.length > 0) {
      if (!conv.allowedUserIds.includes(userId) && !['admin', 'branch_manager'].includes(userType)) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return conv.title.toLowerCase().includes(q) || conv.subtitle.toLowerCase().includes(q);
    }

    return true;
  });

  // Automatically select first visible conversation if current selection is invalid
  useEffect(() => {
    if (visibleConversations.length > 0 && !visibleConversations.some(c => c.id === selectedConvId)) {
      setSelectedConvId(visibleConversations[0].id);
    }
  }, [visibleConversations, selectedConvId]);

  const activeConv = conversations.find(c => c.id === selectedConvId) || visibleConversations[0];
  const activeMessages = selectedConvId ? (messages[selectedConvId] || []) : [];

  // Fetch messages from backend API when selectedConvId changes
  useEffect(() => {
    if (!selectedConvId || selectedConvId.startsWith('conv-staff') || selectedConvId.startsWith('conv-circle')) return;
    let isMounted = true;
    getChatMessages(selectedConvId)
      .then(res => {
        if (!isMounted || !res?.items) return;
        const mapped: ChatMessage[] = res.items.reverse().map(m => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.senderName,
          senderRole: m.isMe ? 'أنت' : 'عضو',
          content: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(prev => ({
          ...prev,
          [selectedConvId]: mapped
        }));
        markChatAsRead(selectedConvId).catch(() => {});
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedConvId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Send Message Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;
    if (!selectedConvId) return;

    const text = messageInput.trim();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: userId,
      senderName: currentUser?.name || 'مستخدم النظام',
      senderRole: currentUser?.roleName || (userType === 'parent' ? 'ولي أمر' : userType === 'student' ? 'طالب' : 'معلم'),
      content: text,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      attachmentName: selectedFile ? selectedFile.name : undefined,
      attachmentUrl: selectedFile ? '#' : undefined
    };

    // Add to message list
    setMessages(prev => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg]
    }));

    // Update conversation last message preview
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: `${newMsg.senderName.split(' ')[0]}: ${newMsg.content}`,
          lastMessageTime: newMsg.timestamp
        };
      }
      return c;
    }));

    setMessageInput('');
    setSelectedFile(null);

    // Sync to backend NestJS API
    sendChatMessage(selectedConvId, text).catch(() => {});
  };

  // Create Custom Restricted Conversation Handler (For Director General / Executives)
  const handleCreateCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    const chosenMembers = availableContacts.filter(c => selectedMemberIds.includes(c.id));
    const newConvId = `conv-custom-${Date.now()}`;

    const newConv: Conversation = {
      id: newConvId,
      type: 'private',
      title: newChatTitle.trim(),
      subtitle: newChatSubtitle.trim() || 'محادثة موجهة خاصة خاضعة لتحديد الصلاحيات المباشرة',
      isCustomPrivate: true,
      createdById: userId,
      createdByName: currentUser?.name || 'المدير العام',
      allowedUserIds: [userId, ...selectedMemberIds],
      allowedRoles: ['admin', 'branch_manager'],
      lastMessage: 'تم إنشاء القاعة وتحديد الأعضاء المسموح لهم بالدخول.',
      lastMessageTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      unreadCount: {},
      members: [
        { id: userId, name: currentUser?.name || 'المدير العام', role: currentUser?.roleName || 'الإدارة القيادية', avatar: '👨‍💼' },
        ...chosenMembers
      ]
    };

    const initialMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: newConvId,
      senderId: userId,
      senderName: currentUser?.name || 'المدير العام',
      senderRole: currentUser?.roleName || 'الإدارة القيادية',
      content: `مرحباً بكم، تم افتتاح هذه القاعة الخاصة بقرار إداري لتنسيق العمل ومتابعة المهام بين الأعضاء المحددين فقط.`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => [newConv, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newConvId]: [initialMsg]
    }));
    setSelectedConvId(newConvId);

    // Reset form
    setNewChatTitle('');
    setNewChatSubtitle('');
    setSelectedMemberIds([]);
    setShowCreateModal(false);
  };

  // Start Editing Message
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  // Save Edited Message
  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;

    setMessages(prev => ({
      ...prev,
      [selectedConvId]: (prev[selectedConvId] || []).map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            content: editingText.trim(),
            isEdited: true,
            editedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return m;
      })
    }));

    setEditingMessageId(null);
    setEditingText('');
  };

  // Delete Message Handler
  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => {
      const currentList = prev[selectedConvId] || [];
      const updatedList = currentList.filter(m => m.id !== msgId);
      
      // Update last message preview if last message was deleted
      if (updatedList.length > 0) {
        const last = updatedList[updatedList.length - 1];
        setConversations(cPrev => cPrev.map(c => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              lastMessage: `${last.senderName.split(' ')[0]}: ${last.content}`,
              lastMessageTime: last.timestamp
            };
          }
          return c;
        }));
      }

      return {
        ...prev,
        [selectedConvId]: updatedList
      };
    });

    setDeleteConfirmMsgId(null);
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const getConvTypeBadge = (type: Conversation['type'], isCustomPrivate?: boolean) => {
    if (isCustomPrivate) {
      return <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3 text-purple-700" /> محادثة مخصصة محددة الأعضاء</span>;
    }
    switch (type) {
      case 'circle':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><BookOpen className="h-3 w-3 text-emerald-700" /> مجموعة الحلقة</span>;
      case 'staff':
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="h-3 w-3 text-indigo-700" /> المدرسون والإدارة</span>;
      case 'parent_teacher':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Users className="h-3 w-3 text-amber-700" /> ولي الأمر والمعلم</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> محادثة خاصة</span>;
    }
  };

  const filteredContacts = availableContacts.filter(c => 
    c.id !== userId && (
      c.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
      c.role.toLowerCase().includes(memberSearch.toLowerCase())
    )
  );

  return (
    <div className="space-y-4 text-right font-sans">
      
      {/* HEADER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <span>المحادثات والتواصل الداخلي</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تواصل مباشر وآمن ومحدد الصلاحيات بين المدرسين، الإدارة، الطلاب، وأولياء الأمور
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Executive Action: Create Custom Chat with Member Picker */}
          {isExecutive && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>إنشاء محادثة وتحديد الأعضاء</span>
            </button>
          )}

          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>الحساب الحالي: {currentUser?.name || 'المدير العام'}</span>
          </span>
        </div>
      </div>

      {/* CHAT MAIN LAYOUT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* SIDEBAR: CONVERSATIONS LIST (35% width on desktop) */}
        <div className="md:col-span-4 border-l border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          
          {/* SEARCH BOX & EXECUTIVE SHORTCUT */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في المحادثات..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {isExecutive && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-1.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-purple-700" />
                <span>فتح محادثة موجهة (خاص بالإدارة)</span>
              </button>
            )}
          </div>

          {/* LIST OF CONVERSATIONS */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {visibleConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">لا توجد محادثات متاحة</p>
                {isExecutive && (
                  <p className="text-[11px] text-slate-500">يمكنك إنشاء محادثة مخصصة واختيار أعضائها بنفسك.</p>
                )}
              </div>
            ) : (
              visibleConversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const unread = conv.unreadCount?.[userId] || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-3.5 text-right transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-r-4 border-emerald-600 shadow-2xs' 
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {conv.isCustomPrivate ? '🔒' : conv.type === 'circle' ? '📖' : conv.type === 'staff' ? '👨‍💼' : '🧔'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1 mb-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{conv.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{conv.lastMessageTime || ''}</span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-slate-500 truncate font-light">
                          {conv.lastMessage || 'بدء محادثة جديدة...'}
                        </p>
                        {unread > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5">
                        {getConvTypeBadge(conv.type, conv.isCustomPrivate)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-400 text-center font-mono">
            نظام المحادثات الآمن — مركز الهدى
          </div>
        </div>

        {/* CHAT DISPLAY PANE (65% width on desktop) */}
        <div className="md:col-span-8 flex flex-col justify-between bg-slate-50/30">
          
          {activeConv ? (
            <>
              {/* CHAT HEADER */}
              <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-900 rounded-full flex items-center justify-center font-bold text-lg">
                    {activeConv.isCustomPrivate ? '🔒' : activeConv.type === 'circle' ? '📖' : activeConv.type === 'staff' ? '👨‍💼' : '🧔'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-sm">{activeConv.title}</h3>
                      {activeConv.isCustomPrivate && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200">
                          قاعة مخصصة
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-light">{activeConv.subtitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMembersModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-700" />
                  <span>الأعضاء ({activeConv.members.length})</span>
                </button>
              </div>

              {/* MESSAGES LIST */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[400px] max-h-[500px]">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Sparkles className="h-8 w-8 mx-auto text-emerald-400" />
                    <p className="text-xs font-bold">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  activeMessages.map(msg => {
                    const isMe = msg.senderId === userId;
                    const canEdit = isMe || isExecutive;
                    const canDelete = isMe || isExecutive;
                    const isEditingThis = editingMessageId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`group flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                      >
                        {/* Sender info line */}
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-700">{msg.senderName}</span>
                          <span className="text-[9px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-md font-medium">
                            {msg.senderRole}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{msg.timestamp}</span>
                          {msg.isEdited && (
                            <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-mono border border-amber-200">
                              (معدّلة)
                            </span>
                          )}
                        </div>

                        {/* Message Bubble + Action Buttons */}
                        <div className="relative flex items-center gap-2 max-w-lg">
                          
                          {/* Quick action buttons (Edit & Delete) shown on hover or for management */}
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 shadow-2xs rounded-lg p-1 ${isMe ? 'order-last' : 'order-first'}`}>
                            {canEdit && !isEditingThis && (
                              <button
                                onClick={() => handleStartEdit(msg)}
                                title="تعديل الرسالة"
                                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmMsgId(msg.id)}
                                title="حذف الرسالة"
                                className="p-1 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Message Body or Inline Edit Box */}
                          <div
                            className={`w-full p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isMe 
                                ? 'bg-emerald-700 text-white rounded-tr-xs' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                            }`}
                          >
                            {isEditingThis ? (
                              <div className="space-y-2 min-w-[260px]">
                                <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                                  <Edit3 className="h-3 w-3" />
                                  <span>تعديل نص الرسالة:</span>
                                </div>
                                <textarea
                                  value={editingText}
                                  onChange={e => setEditingText(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-white text-slate-900 rounded-xl text-xs font-medium border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                />
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(msg.id)}
                                    className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 cursor-pointer shadow-2xs"
                                  >
                                    حفظ التعديل
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-line font-normal">{msg.content}</p>

                                {msg.attachmentName && (
                                  <div className={`mt-2 p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                                    isMe ? 'bg-emerald-800/80 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}>
                                    <span className="font-mono truncate">{msg.attachmentName}</span>
                                    <a 
                                      href="#" 
                                      onClick={e => { e.preventDefault(); alert(`تحميل المرفق: ${msg.attachmentName}`); }}
                                      className="underline text-[10px] font-bold cursor-pointer"
                                    >
                                      تحميل
                                    </a>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE INPUT FORM */}
              <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-slate-200 space-y-2">
                {selectedFile && (
                  <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-mono">
                    <span>مرفق: {selectedFile.name}</span>
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="p-2.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-all" title="إرفاق ملف">
                    <Paperclip className="h-5 w-5" />
                    <input 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                      className="hidden" 
                    />
                  </label>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />

                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 px-5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>إرسال</span>
                    <Send className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
              <p>اختر محادثة من القائمة الجانبية لبدء التواصل</p>
            </div>
          )}

        </div>
      </div>

      {/* CREATE CUSTOM CONVERSATION MODAL (DIRECTOR GENERAL / EXECUTIVE) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">إنشاء محادثة مخصصة وتحديد الأعضاء</h3>
                  <p className="text-[11px] text-slate-500">لوحة المدير العام والتنفيذي — قمع وصلاحية الدخول</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateCustomChat} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان المحادثة / القاعة *
                </label>
                <input
                  type="text"
                  required
                  value={newChatTitle}
                  onChange={e => setNewChatTitle(e.target.value)}
                  placeholder="مثال: التواصل الخاص بشأن الطالب معاذ العويّد"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الغرض / وصف المحادثة
                </label>
                <input
                  type="text"
                  value={newChatSubtitle}
                  onChange={e => setNewChatSubtitle(e.target.value)}
                  placeholder="مثال: قاعة تواصل خاصة بين الإدارة ومعلم الحلقة وولي الأمر فقط"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    اختر الأعضاء المسموح لهم بالدخول فقط ({selectedMemberIds.length}):
                  </label>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    سرية تامة
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="تصفية حسب الاسم أو الصفة (معلم، ولي أمر، موجه)..."
                    className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {filteredContacts.map(contact => {
                    const isSelected = selectedMemberIds.includes(contact.id);

                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleMemberSelection(contact.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{contact.avatar || '👤'}</span>
                          <div>
                            <span className="text-xs block">{contact.name}</span>
                            <span className="text-[10px] text-slate-500 block font-normal">{contact.role}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-purple-700" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-200 text-[11px] text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-purple-700" />
                  <span>تأكيد الخصوصية المشددة:</span>
                </div>
                <p className="text-[10px] leading-relaxed text-purple-800">
                  سيتم حجب هذه المحادثة بالكامل عن باقي أولياء الأمور والمعلمين غير المحددين في هذه القائمة.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newChatTitle.trim() || selectedMemberIds.length === 0}
                  className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>إنشاء وبدء المحادثة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBERS MODAL */}
      {showMembersModal && activeConv && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">أعضاء المحادثة ({activeConv.members.length})</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeConv.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{member.avatar || '👤'}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{member.name}</span>
                      <span className="text-[10px] text-slate-500 block">{member.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    عضو
                  </span>
                </div>
              ))}
            </div>

            <div className="text-left pt-2 border-t">
              <button
                onClick={() => setShowMembersModal(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmMsgId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">تأكيد حذف الرسالة</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت أخيرًا متأكد من رغبتك في حذف هذه الرسالة من المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setDeleteConfirmMsgId(null)}
                className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteMessage(deleteConfirmMsgId)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                حذف الرسالة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
