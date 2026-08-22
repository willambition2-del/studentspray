/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Filter, ShieldAlert, Award, Calendar, BookOpen, AlertCircle,
  TrendingUp, TrendingDown, Eye, Edit, Trash, Plus, CheckCircle, UserCheck, 
  Settings, ArrowLeftRight, FileText, ClipboardList, Send, PhoneCall, PlusCircle,
  HelpCircle, ChevronLeft, ArrowDown, ArrowUp, Milestone, Target, Heart, Printer, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NewStudentModal from './NewStudentModal';
import { getStoredPlans } from './StudentPlanManagement';
import StudentMeasurementCenter from './StudentMeasurementCenter';
import { assignStudentToCircle, formatStudentDisplayId } from '../lib/numberingSystem';
import { 
  getStudents, createStudent, updateStudent, archiveStudent, restoreStudent, transferStudentHalaqa,
  getHalaqas, getBranches, addStudentToHalaqa,
  type StudentProfileDto, type HalaqaDto, type BranchDto, ApiError
} from '../lib/api';

// ST-00000X Student Interface representing 1st and subsequent sections
export interface StudentGoal {
  type: string; // 'hifz' | 'revision' | 'attendance' | 'quality'
  title: string;
  target: number;
  actual: number;
  unit: string;
  status: 'achieved' | 'pending' | 'delayed';
  lastUpdated: string;
}

export interface StudentIntervention {
  id: string;
  type: string; // 'support_plan' | 'redistribute' | 'counseling' | 'supervisor' | 'suspension' | 'improvement'
  title: string;
  reason: string;
  authority: string;
  date: string;
  status: 'active' | 'completed' | 'canceled';
}

export interface EducationalDecision {
  id: string;
  title: string;
  reason: string;
  auth: string;
  date: string;
  riskConnected?: string;
}

export interface StudentNote {
  id: string;
  text: string;
  category: 'educational' | 'administrative' | 'behavioral' | 'instructional';
  author: string;
  date: string;
}

export interface Student {
  id: string; // ID Format ST-000001
  name: string;
  circle: string;
  teacher: string;
  status: 'active' | 'inactive' | 'graduate' | 'archived';
  joinDate: string;
  age: number;
  parentName: string;
  parentPhone: string;
  relationship: string;
  school: string;
  email?: string;
  nationalId?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  mentor?: string;
  parentOccupation?: string;
  lastSurah?: string;
  memorizedJuzCount?: number;
  tajweedLevel?: 'beginner' | 'intermediate' | 'advanced' | 'certified';
  readingLevel?: 'excellent' | 'very_good' | 'good' | 'needs_support';
  healthNotes?: string;
  specialNeeds?: string;
  educationalNotes?: string;
  generalNotes?: string;
  
  // Indicators & Risks Analysis Layer
  academicIndicator: 'green' | 'yellow' | 'red'; // 🟢|🟡|🔴
  riskFlags: string[]; // (خطر الانقطاع etc.)
  hifzRate: number; // %
  muraajaaRate: number; // %
  commitmentScore: number; // %
  lastExamScore: number; // /100
  lastExamName: string;
  attendanceRate: number; // %
  trend: 'up' | 'down' | 'stable';
  
  // Unified Numbering System Fields (نظام الترقيم الموحد)
  permanentId?: string; // e.g. STD-0001 (ثابت لا يتغير)
  circleCode?: string; // e.g. C-01
  orderInCircle?: number; // e.g. 1
  organizationalId?: string; // e.g. C-01-S01
  circleHistory?: Array<{ id: string; circleCode: string; circleName: string; organizationalId: string; orderInCircle: number; startDate: string; endDate?: string; reason?: string }>;
  parentPermanentId?: string; // e.g. P-001

  // Complex Sub-records
  timeline: Array<{ date: string; title: string; desc: string; author: string }>;
  goals: StudentGoal[];
  interventions: StudentIntervention[];
  decisions: EducationalDecision[];
  notes: StudentNote[];
  communicationLog: Array<{ date: string; method: string; note: string; officer: string }>;
  achievements: Array<{ date: string; title: string; category: string }>;
}

export default function StudentManagement({ currentUser }: { currentUser?: any } = {}) {
  const isTeacher = currentUser?.type === 'teacher';
  const isSupervisor = currentUser?.type === 'supervisor';
  const isParent = currentUser?.type === 'parent';
  const isStudent = currentUser?.type === 'student';

  // Live State from API
  const [students, setStudents] = useState<Student[]>([]);

  // --- Search and Filters State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndicator, setFilterIndicator] = useState<string>('all');
  const [filterHalaqa, setFilterHalaqa] = useState<string>('all');
  const [filterSmart, setFilterSmart] = useState<string>('all'); // Smart Filters preset
  const [selectedStatCard, setSelectedStatCard] = useState<string | null>(null);

  const [availableHalaqas, setAvailableHalaqas] = useState<HalaqaDto[]>([]);
  const [availableBranches, setAvailableBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({
        limit: 100,
        search: searchQuery.trim() || undefined,
        status: filterStatus === 'archived' ? 'archived' : 'active',
        halaqaId: filterHalaqa !== 'all' ? filterHalaqa : undefined,
      });
      if (res.items && res.items.length > 0) {
        const mapped = res.items.map((p): Student => {
          const activeMembership = p.halaqaMemberships?.find(m => m.isActive && !m.endedAt);
          const primaryGuardian = p.guardians?.find(g => g.isPrimary) || p.guardians?.[0];
          const age = p.dateOfBirth ? Math.max(5, new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : 14;
          return {
            id: p.id,
            name: p.user.displayName || p.user.username,
            circle: activeMembership?.halaqa?.name || 'بدون حلقة',
            teacher: 'مشرف عام',
            status: (p.deletedAt ? 'archived' : (p.user.isActive ? 'active' : 'inactive')) as Student['status'],
            joinDate: p.enrollmentDate ? new Date(p.enrollmentDate).toLocaleDateString('ar-SA') : new Date(p.createdAt).toLocaleDateString('ar-SA'),
            age,
            parentName: primaryGuardian?.parent?.user?.displayName || primaryGuardian?.parent?.user?.username || 'غير مسجل',
            parentPhone: primaryGuardian?.parent?.user?.phone || 'غير مسجل',
            relationship: primaryGuardian?.relationship === 'FATHER' ? 'أب' : (primaryGuardian?.relationship === 'MOTHER' ? 'أم' : 'ولي أمر'),
            school: 'مجمع تحفيظ القرآن',
            email: p.user.email || '',
            nationalId: p.studentNumber || p.id.slice(0, 8),
            permanentId: p.studentNumber || `STD-${p.id.slice(0, 6)}`,
            circleCode: activeMembership?.halaqa?.code,
            academicIndicator: 'green' as const,
            riskFlags: [],
            hifzRate: 95,
            muraajaaRate: 90,
            commitmentScore: 92,
            lastExamScore: 95,
            lastExamName: 'تقييم الحفظ التراكمي',
            attendanceRate: 95,
            trend: 'up' as const,
            timeline: [
              {
                date: new Date(p.createdAt).toLocaleDateString('ar-SA'),
                title: 'التسجيل والقبول',
                desc: `تم تقييد الطالب بالنظام ${activeMembership ? `وإلحاقه بحلقة ${activeMembership.halaqa.name}` : ''}.`,
                author: 'إدارة شؤون الحفاظ'
              }
            ],
            goals: [
              { type: 'hifz', title: 'خطة التحفيظ المستمرة', target: 20, actual: 18, unit: 'صفحة', status: 'achieved' as const, lastUpdated: 'اليوم' }
            ],
            interventions: [],
            decisions: [],
            notes: [],
            communicationLog: [],
            achievements: []
          };
        });
        setStudents(mapped);
      } else if (!searchQuery && filterStatus === 'all' && filterHalaqa === 'all') {
        // Fallback default sample if DB is freshly initialized
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to load students from API:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, filterHalaqa]);

  useEffect(() => {
    getHalaqas({ limit: 100 }).then(res => setAvailableHalaqas(res.items)).catch(() => {});
    getBranches({ limit: 100 }).then(res => setAvailableBranches(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  // --- Screen Controls ---
  const [activeMainView, setActiveMainView] = useState<'assessment' | 'os'>('assessment');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [fullProfileTab, setFullProfileTab] = useState<'timeline' | 'performance' | 'goals' | 'interventions' | 'notes' | 'achievements' | 'documents' | 'map'>('timeline');

  // --- Forms State for Interactivity ---
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // --- Temp Form Variables ---
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    nationalId: '',
    age: 14,
    circle: 'حقة حفظ الطليعة (خاتمين)',
    teacher: 'عبد الرحمن السعيد',
    status: 'active' as Student['status'],
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    relationship: 'أب',
    school: '',
    academicIndicator: 'green' as Student['academicIndicator'],
    initialHifzParts: 3
  });

  const [transferTarget, setTransferTarget] = useState({
    circle: 'حقة حفظ الطليعة (خاتمين)', teacher: 'عبد الرحمن السعيد', reason: ''
  });

  const [quickNoteForm, setQuickNoteForm] = useState({
    text: '', category: 'educational' as StudentNote['category']
  });

  const [newGoalForm, setNewGoalForm] = useState({
    type: 'hifz', title: '', target: 20, unit: 'صفحة'
  });

  const [newInterventionForm, setNewInterventionForm] = useState({
    type: 'support_plan', title: '', reason: '', authority: 'مشرف الحلقات'
  });

  // --- Auto-calculated global mock lists based on database ---
  const halaqatList = Array.from(new Set(students.map(s => s.circle)));

  // --- STATS CARDS COUNT ---
  const statsTotal = students.length;
  const statsActive = students.filter(s => s.status === 'active').length;
  const statsInactive = students.filter(s => s.status === 'inactive').length;
  const statsGraduate = students.filter(s => s.status === 'graduate').length;
  const statsAhead = students.filter(s => s.academicIndicator === 'green').length;
  const statsBehind = students.filter(s => s.academicIndicator === 'red').length;

  // --- CLIENT FILTER LOGIC ---
  const filteredStudents = students.filter(s => {
    // 0. Role-based Scoping
    if (isTeacher && currentUser?.name) {
      const teacherFirstName = currentUser.name.split(' ')?.[1] || currentUser.name.split(' ')?.[0] || '';
      const matchesTeacher = s.teacher.includes(currentUser.name) || 
                             (teacherFirstName && s.teacher.includes(teacherFirstName)) ||
                             (currentUser.roleName && s.circle.includes(currentUser.roleName));
      if (!matchesTeacher) return false;
    }
    if (isParent && currentUser?.name) {
      const parentName = currentUser.name;
      const matchesParent = s.parentName.includes(parentName) || (s.parentPermanentId && s.parentPermanentId === currentUser.id);
      if (!matchesParent) return false;
    }
    if (isStudent && currentUser?.name) {
      const studentName = currentUser.name;
      const matchesStudent = s.name.includes(studentName) || s.id === currentUser.id || s.permanentId === currentUser.id;
      if (!matchesStudent) return false;
    }

    // 1. Search text mapping (ID, Permanent ID, Organizational ID, Circle Code, Name, Phone, parent phone, Halaqa, school)
    const matchesSearch = 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.permanentId && s.permanentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.organizationalId && s.organizationalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.circleCode && s.circleCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.name.includes(searchQuery) ||
      s.parentName.includes(searchQuery) ||
      s.parentPhone.includes(searchQuery) ||
      s.circle.includes(searchQuery) ||
      s.school.includes(searchQuery);

    // 2. Status dropdown Filter
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    // 3. Indicator dropdown Filter
    const matchesIndicator = filterIndicator === 'all' || s.academicIndicator === filterIndicator;

    // 4. Halaqa dropdown Filter
    const matchesHalaqa = filterHalaqa === 'all' || s.circle === filterHalaqa;

    // 5. Stat Card Clicking filter override
    let matchesStatCard = true;
    if (selectedStatCard === 'active') matchesStatCard = s.status === 'active';
    else if (selectedStatCard === 'inactive') matchesStatCard = s.status === 'inactive';
    else if (selectedStatCard === 'graduate') matchesStatCard = s.status === 'graduate';
    else if (selectedStatCard === 'ahead') matchesStatCard = s.academicIndicator === 'green';
    else if (selectedStatCard === 'behind') matchesStatCard = s.academicIndicator === 'red';

    // 6. Smart filters preset mapping
    let matchesSmart = true;
    if (filterSmart === 'only_hifz_delay') {
      matchesSmart = s.hifzRate < 60;
    } else if (filterSmart === 'only_muraajaa_delay') {
      matchesSmart = s.muraajaaRate < 70;
    } else if (filterSmart === 'no_progress_30_days') {
      matchesSmart = s.status === 'inactive' || s.riskFlags.includes('توقف عن التقدم');
    } else if (filterSmart === 'negative_trend') {
      matchesSmart = s.trend === 'down';
    } else if (filterSmart === 'low_plan_fidelity') {
      matchesSmart = s.commitmentScore < 60 || s.riskFlags.includes('ضعف في الالتزام');
    }

    return matchesSearch && matchesStatus && matchesIndicator && matchesHalaqa && matchesStatCard && matchesSmart;
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // --- ACTIONS HANDLERS ---
  const handleSaveStudentFromModal = async (data: Partial<Student>, keepOpenForAnother?: boolean) => {
    const nextNum = students.length + 1;
    const formattedId = data.id || `ST-${String(nextNum).padStart(6, '0')}`;

    const newRec: Student = {
      id: formattedId,
      name: data.name || 'طالب جديد',
      nationalId: data.nationalId || '',
      birthDate: data.birthDate || '',
      gender: data.gender || 'male',
      circle: data.circle || 'حلقة حفظ الطليعة (خاتمين)',
      teacher: data.teacher || 'عبد الرحمن السعيد',
      mentor: data.mentor || 'أ. عبد الرحمن السعيد',
      status: data.status || 'active',
      joinDate: data.joinDate || new Date().toLocaleDateString('ar-SA'),
      age: Number(data.age) || 14,
      parentName: data.parentName || 'غير مسجل',
      parentPhone: data.parentPhone || 'غير مسجل',
      parentOccupation: data.parentOccupation || '',
      relationship: data.relationship || 'أب',
      school: data.school || 'عامة فصول المنطقة',
      email: data.email || '',
      memorizedJuzCount: data.memorizedJuzCount ?? 3,
      lastSurah: data.lastSurah || 'سورة البقرة',
      tajweedLevel: data.tajweedLevel || 'intermediate',
      readingLevel: data.readingLevel || 'very_good',
      healthNotes: data.healthNotes || '',
      specialNeeds: data.specialNeeds || '',
      educationalNotes: data.educationalNotes || '',
      generalNotes: data.generalNotes || '',
      academicIndicator: data.academicIndicator || 'green',
      riskFlags: [],
      hifzRate: 85,
      muraajaaRate: 80,
      commitmentScore: 80,
      lastExamScore: 85,
      lastExamName: `تقييم مبدئي (${data.memorizedJuzCount || 3} أجزاء)`,
      attendanceRate: 90,
      trend: 'stable',
      timeline: [
        { date: 'اليوم', title: 'التسجيل وتوزيع الحلقة', desc: `تم التسجيل بنجاح بالملتقى وإلحاق الطالب بحلقة ${data.circle} ومتابعة المعلم ${data.teacher}. كمية الحفظ الابتدائية: ${data.memorizedJuzCount || 3} أجزاء.`, author: 'المدير المباشر' }
      ],
      goals: [
        { type: 'hifz', title: 'خطة التحفيظ العامة لمسارك', target: 20, actual: 0, unit: 'صفحة', status: 'pending', lastUpdated: 'اليوم' }
      ],
      interventions: [],
      decisions: [],
      notes: data.generalNotes ? [
        { id: `note-${Date.now()}`, text: data.generalNotes, category: 'administrative', author: 'لجنة التسجيل', date: 'اليوم' }
      ] : [],
      communicationLog: [],
      achievements: []
    };

    try {
      const username = `std_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
      const branchId = availableBranches[0]?.id;
      const created = await createStudent({
        username,
        displayName: data.name || 'طالب جديد',
        email: data.email || undefined,
        phone: data.parentPhone || undefined,
        branchId,
        studentNumber: data.id,
        dateOfBirth: data.birthDate || undefined,
        enrollmentDate: data.joinDate || undefined,
        temporaryPassword: 'TempPassword@1447!',
      });

      const targetHalaqa = availableHalaqas.find(h => h.name === data.circle || h.id === data.circle) || availableHalaqas[0];
      if (targetHalaqa && created?.id) {
        await addStudentToHalaqa(targetHalaqa.id, created.id).catch(() => {});
      }

      void loadStudents();
    } catch (err) {
      console.error('Error creating student in backend:', err);
    }

    setStudents(prev => [newRec, ...prev]);

    setSearchQuery('');
    setFilterStatus('all');
    setFilterIndicator('all');
    setFilterHalaqa('all');
    setFilterSmart('all');
    setSelectedStatCard(null);

    if (!keepOpenForAnother) {
      setShowAddStudentModal(false);
    }
  };

  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;

    // Build fresh custom ID format
    const nextNum = students.length + 1;
    const formattedId = `ST-${String(nextNum).padStart(6, '0')}`;

    const newRec: Student = {
      id: formattedId,
      name: newStudentForm.name,
      nationalId: newStudentForm.nationalId,
      circle: newStudentForm.circle,
      teacher: newStudentForm.teacher,
      status: newStudentForm.status,
      joinDate: new Date().toLocaleDateString('ar-SA'),
      age: Number(newStudentForm.age),
      parentName: newStudentForm.parentName || 'غير مسجل',
      parentPhone: newStudentForm.parentPhone || 'غير مسجل',
      relationship: newStudentForm.relationship || 'أب',
      school: newStudentForm.school || 'عامة فصول المنطقة',
      email: newStudentForm.parentEmail || '',
      academicIndicator: newStudentForm.academicIndicator,
      riskFlags: [],
      hifzRate: 85,
      muraajaaRate: 80,
      commitmentScore: 80,
      lastExamScore: 85,
      lastExamName: `تقييم مبدئي (${newStudentForm.initialHifzParts || 3} أجزاء)`,
      attendanceRate: 90,
      trend: 'stable',
      timeline: [
        { date: 'اليوم', title: 'التسجيل وتوزيع الحلقة', desc: `تم التسجيل بنجاح بالملتقى وإلحاق الطالب بحلقة ${newStudentForm.circle} ومتابعة المعلم ${newStudentForm.teacher}. كمية الحفظ الابتدائية: ${newStudentForm.initialHifzParts || 3} أجزاء.`, author: 'المدير المباشر' }
      ],
      goals: [
        { type: 'hifz', title: 'خطة التحفيظ العامة لمسارك', target: 20, actual: 0, unit: 'صفحة', status: 'pending', lastUpdated: 'اليوم' }
      ],
      interventions: [],
      decisions: [],
      notes: [],
      communicationLog: [],
      achievements: []
    };

    const numberedNewRec = assignStudentToCircle(newRec, newStudentForm.circle);

    try {
      const username = `std_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
      const branchId = availableBranches[0]?.id;
      const created = await createStudent({
        username,
        displayName: newStudentForm.name,
        email: newStudentForm.parentEmail || undefined,
        phone: newStudentForm.parentPhone || undefined,
        branchId,
        studentNumber: formattedId,
        temporaryPassword: 'TempPassword@1447!',
      });

      const targetHalaqa = availableHalaqas.find(h => h.name === newStudentForm.circle || h.id === newStudentForm.circle) || availableHalaqas[0];
      if (targetHalaqa && created?.id) {
        await addStudentToHalaqa(targetHalaqa.id, created.id).catch(() => {});
      }

      void loadStudents();
    } catch (err) {
      console.error('Error creating student in backend:', err);
    }

    setStudents([numberedNewRec, ...students]);

    // Clear filters so the newly added student is immediately visible at top of list
    setSearchQuery('');
    setFilterStatus('all');
    setFilterIndicator('all');
    setFilterHalaqa('all');
    setFilterSmart('all');
    setSelectedStatCard(null);

    setShowAddStudentModal(false);
    
    // Clear Form
    setNewStudentForm({
      name: '', nationalId: '', age: 14, circle: 'حقة حفظ الطليعة (خاتمين)', teacher: 'عبد الرحمن السعيد',
      status: 'active', parentName: '', parentPhone: '', parentEmail: '', relationship: 'أب', school: '',
      academicIndicator: 'green', initialHifzParts: 3
    });

    alert(`✓ تم تسجيل الطالب بنجاح وتصوير السجل القياسي الشامل!\n• الرمز المولد: ${formattedId}\n• الاسم: ${newRec.name}\n• الحلقة المسندة: ${newRec.circle}\n• المعلم المشرف: ${newRec.teacher}`);
  };

  const handleApplyTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !transferTarget.reason) {
      alert('الرجاء توفير سبب إجباري مكتوب لإتمام عملية النقل الإداري.');
      return;
    }

    const targetHalaqa = availableHalaqas.find(h => h.name === transferTarget.circle || h.id === transferTarget.circle) || availableHalaqas[0];
    if (targetHalaqa && selectedStudentId) {
      transferStudentHalaqa(selectedStudentId, targetHalaqa.id)
        .then(() => void loadStudents())
        .catch(err => console.error('Transfer student error:', err));
    }

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        const numberedUpdated = assignStudentToCircle(s, transferTarget.circle);
        const newTimeline = [
          { date: 'اليوم', title: 'نقل حلقة إداري', desc: `تم نقل الطالب من حلقته السابقة إلى حلقة ${transferTarget.circle} (${numberedUpdated.circleCode}) بالرمز التنظيمي الجديد (${numberedUpdated.organizationalId}) تحت مسؤولية الشيخ ${transferTarget.teacher}. المعرف الثابت: (${numberedUpdated.permanentId}). السبب: ${transferTarget.reason}`, author: 'المدير التنفيذي' },
          ...s.timeline
        ];
        const newDecisions = [
          { id: `DEC-${Date.now()}`, title: `تعديل الحلقة وتحديث الرمز التنظيمي إلى ${numberedUpdated.organizationalId}`, reason: transferTarget.reason, auth: 'مدير عام الملتقى', date: 'اليوم' },
          ...s.decisions
        ];
        return {
          ...numberedUpdated,
          circle: transferTarget.circle,
          teacher: transferTarget.teacher,
          timeline: newTimeline,
          decisions: newDecisions
        };
      }
      return s;
    }));

    setShowTransferModal(false);
    alert('✓ تم نقل الطالب بنجاح! احتفظ الطالب بمعرفه الثابت وتغير رمزه التنظيمي بالحلقة الجديدة.');
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !quickNoteForm.text) return;

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        const newNote: StudentNote = {
          id: String(s.notes.length + 1),
          text: quickNoteForm.text,
          category: quickNoteForm.category,
          author: 'إشراف عام / مدير النظام',
          date: 'اليوم'
        };
        return {
          ...s,
          notes: [newNote, ...s.notes]
        };
      }
      return s;
    }));

    setQuickNoteForm({ text: '', category: 'educational' });
    setShowNoteModal(false);
  };

  const handleAddPersonalGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !newGoalForm.title) return;

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        const newGoalStr: StudentGoal = {
          type: newGoalForm.type,
          title: newGoalForm.title,
          target: Number(newGoalForm.target),
          actual: 0,
          unit: newGoalForm.unit,
          status: 'pending',
          lastUpdated: 'اليوم'
        };
        return {
          ...s,
          goals: [...s.goals, newGoalStr]
        };
      }
      return s;
    }));

    setShowGoalModal(false);
    setNewGoalForm({ type: 'hifz', title: '', target: 20, unit: 'صفحة' });
  };

  const handleAddInterventionAndDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !newInterventionForm.title) return;

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        const newInt: StudentIntervention = {
          id: `INT-${Date.now()}`,
          type: newInterventionForm.type,
          title: newInterventionForm.title,
          reason: newInterventionForm.reason || 'متابعة سير وتقويم أثر التنبيه لضمان استقرار التحفيظ',
          authority: newInterventionForm.authority,
          date: 'اليوم',
          status: 'active'
        };

        const newDec: EducationalDecision = {
          id: `DEC-INT-${Date.now()}`,
          title: `إقرار خطة دعم وتدخل تحت مسمى: ${newInterventionForm.title}`,
          reason: newInterventionForm.reason,
          auth: newInterventionForm.authority,
          date: 'اليوم'
        };

        return {
          ...s,
          interventions: [newInt, ...s.interventions],
          decisions: [newDec, ...s.decisions]
        };
      }
      return s;
    }));

    setShowInterventionModal(false);
    setNewInterventionForm({ type: 'support_plan', title: '', reason: '', authority: 'مشرف الحلقات' });
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm(`هل أنت متأكد وحاسم في خيار أرشفة/حذف ملف الطالب ${id} كلياً؟`)) {
      archiveStudent(id)
        .then(() => void loadStudents())
        .catch((err) => console.error('Archive student error:', err));
      setStudents(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, status: 'archived' as Student['status'] };
        }
        return s;
      }));
      alert('✓ تم تغيير حالة تمثيل الطالب لتكون مؤرشفة مع حمايته ضد المسح التام لإبقائه بكشوفات الصادر.');
    }
  };

  return (
    <div className="space-y-6 container mx-auto px-4 text-right font-sans" dir="rtl" id="student-management-root">
      
      {/* MAIN NAVIGATION TAB SWITCHER */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainView('assessment')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeMainView === 'assessment'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Target className="h-4 w-4 text-amber-400" />
            <span>مركز قياس الطلاب والمنهج</span>
          </button>

          <button
            onClick={() => setActiveMainView('os')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeMainView === 'os'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="h-4 w-4 text-emerald-400" />
            <span>سجلات وتنفيذ شؤون الطلاب (Student OS)</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-400 px-3">
          {activeMainView === 'assessment' ? 'العرض: وحدة قياس الأداء والمناهج الموحدة' : 'العرض: محرك التشغيل والسجلات التفصيلية'}
        </div>
      </div>

      {activeMainView === 'assessment' ? (
        <StudentMeasurementCenter />
      ) : (
        <>
          {/* HEADER ROW */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-1 px-3.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            نظام تشغيل الطالب المتكامل (Student OS Engine)
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display text-white">إشراف وإدارة شؤون الحفاظ والمخاطر الذكية</h2>
          <p className="text-slate-300 text-xs font-semibold leading-relaxed max-w-4xl">
            بوابة الإدارة الشاملة لقيادة المسيرة التعليمية للطلاب المعزز بحوسبة أهداف الحفظ الفردية، قرارات الحلقات، وسجلات الدعم والتحسين النفسي والسلوكي فور انطلاق التنبيهات.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 z-10 w-full lg:w-auto justify-end">
          <button 
            type="button"
            onClick={() => setShowAddStudentModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-3 px-6 font-black text-xs transition-all tracking-wide flex items-center gap-2 cursor-pointer shadow-sm w-full lg:w-auto justify-center"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-10 bottom-0 top-0 opacity-10 flex items-center pointer-events-none">
          <Users className="h-40 w-40 text-slate-400 stroke-1" />
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE STATS CARDS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { id: 'total', label: 'إجمالي الحفاظ', count: statsTotal, icon: Users, color: 'border-slate-200 bg-white text-slate-900' },
          { id: 'active', label: 'الطلاب النشطون', count: statsActive, icon: UserCheck, color: 'border-emerald-250 bg-emerald-50/40 text-emerald-950' },
          { id: 'inactive', label: 'الطلاب المنقطعون', count: statsInactive, icon: AlertCircle, color: 'border-rose-200 bg-rose-50/50 text-rose-950' },
          { id: 'graduate', label: 'الطلاب الخريجون', count: statsGraduate, icon: Award, color: 'border-indigo-200 bg-indigo-50/50 text-indigo-950' },
          { id: 'ahead', label: 'متقدم على الخطة', count: statsAhead, icon: TrendingUp, color: 'border-teal-200 bg-teal-50/40 text-teal-950' },
          { id: 'behind', label: 'متأخر ومعرض للتعثر', count: statsBehind, icon: TrendingDown, color: 'border-amber-250 bg-amber-50/50 text-amber-950' }
        ].map(card => {
          const isSelected = selectedStatCard === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setSelectedStatCard(selectedStatCard === card.id ? null : card.id)}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-3 cursor-pointer outline-hidden relative grow ${card.color} ${
                isSelected ? 'ring-2 ring-indigo-900 border-indigo-900 scale-98 shadow-sm font-black' : 'hover:scale-98 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-[11px] font-black text-slate-500">{card.label}</span>
                <card.icon className="h-4 w-4 opacity-75 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl sm:text-2xl font-black font-mono">{card.count}</span>
                <span className="text-[10px] text-slate-400 font-bold">طالب</span>
              </div>
              {isSelected && (
                <span className="absolute top-2 left-2 bg-indigo-950 text-white text-[8px] font-mono px-1 rounded">نشط</span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 2 & 3: COMPREHENSIVE SEARCH & DROPDOWN FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-850 text-xs sm:text-sm font-display flex items-center gap-1.5">
          <Filter className="h-4.5 w-4.5 text-indigo-950" />
          <span>مصفاة التدقيق والفرز المتقدم لملفات الحفاظ</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Main search bar */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 right-0 p-3 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، كود الطالب ST، رقم الحافظ، الهاتف، الحلقة، المدرسة..."
              className="w-full text-xs font-semibold p-3.5 pr-9.5 pl-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-950"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs font-bold p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="all">الأحوال الإدارية (الكل)</option>
              <option value="active">حالة: نشط ومثمر</option>
              <option value="inactive">حالة: منقطع/متغيب</option>
              <option value="graduate">حالة: خريج متم ومجاز</option>
              <option value="archived">حالة: مؤرشف بسجلات الوجوب</option>
            </select>
          </div>

          {/* Indicator Dropdown */}
          <div>
            <select
              value={filterIndicator}
              onChange={(e) => setFilterIndicator(e.target.value)}
              className="w-full text-xs font-bold p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="all">المؤشر التعليمي الكاشف (الكل)</option>
              <option value="green">🟢 متقدم على الخطة المقررة (+10%)</option>
              <option value="yellow">🟡 ضمن مجداف الخطة المستقرة (±10%)</option>
              <option value="red">🔴 متأخر بمسار خطة التسميع (-10% فما فوق)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Halaqat selection list */}
          <div>
            <select
              value={filterHalaqa}
              onChange={(e) => setFilterHalaqa(e.target.value)}
              className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="all">فرز الحلقات المسجلة (الكل)</option>
              {halaqatList.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* SMART FILTERS (متأخر في الحفظ فقطّ etc.) */}
          <div className="md:col-span-2">
            <select
              value={filterSmart}
              onChange={(e) => setFilterSmart(e.target.value)}
              className="w-full text-xs font-black p-3 bg-amber-500/10 border border-amber-500/30 text-amber-950 rounded-xl focus:outline-hidden"
            >
              <option value="all">🎯 تصفية فرعية ذكية لمكافحة المخاطر وتحديد التعثر (الكل)</option>
              <option value="only_hifz_delay">تنبيه الحفظ فقط: الطلاب الأقل من 60% في سرعة التسميع</option>
              <option value="only_muraajaa_delay">تنبيه المراجعة فقط: الطلاب الأقل من 70% في تثبيت التراكمي</option>
              <option value="no_progress_30_days">توقف التقدم والمراجير الميدانية: بلا زيادة منذ 30 يوماً</option>
              <option value="negative_trend">تطور سلبي: اتجاه تراجع الأداء العام (↓)</option>
              <option value="low_plan_fidelity">انخفاض الصدق والخطة الكلية: كفاءة التزام أقل من 60%</option>
            </select>
          </div>
        </div>

        {/* Filters status feedback */}
        {(searchQuery || filterStatus !== 'all' || filterIndicator !== 'all' || filterHalaqa !== 'all' || filterSmart !== 'all' || selectedStatCard) && (
          <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg text-[10px] sm:text-xs">
            <span className="font-bold text-slate-750">
              العثور على <span className="font-mono text-indigo-950 text-sm">{filteredStudents.length}</span> طلاب مطابقين لشروط التصفية النشطة حاليًا.
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterIndicator('all');
                setFilterHalaqa('all');
                setFilterSmart('all');
                setSelectedStatCard(null);
              }}
              className="text-indigo-950 hover:underline font-black flex items-center gap-1 cursor-pointer"
            >
              إلغاء وتفخيخ كل شروط الفلترة
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4, 5, 6: CORE GRID TABLE OF STUDENTS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-850 text-sm font-display">قائمة الطلاب والسجلات الأساسية</h3>
          <span className="text-[11px] font-bold text-slate-400">محدثة بشكل ديناميكي من أنظمة الحلقات والخطط والملاحظات</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] sm:text-[11px] font-black text-slate-500 bg-slate-50/50">
                <th className="p-3 text-center">الرمز التنظيمي والدائم</th>
                <th className="p-3">اسم الطالب الكامل والرمز</th>
                <th className="p-3">حلقة الطالب</th>
                <th className="p-3">الشيخ المدرس</th>
                <th className="p-3 text-center">المؤشر التعليمي</th>
                <th className="p-3">حالة الانتساب</th>
                <th className="p-3 text-center">مؤشر المخاطر (Risk Flag)</th>
                <th className="p-3 text-center rounded-l-lg">إجراءات المراقبة والتحكم</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-450 font-bold text-xs">
                    لا يوجد أي طلاب يطابقون محددات الفلترة والبحث الحالية. الرجاء تعديل شروط التصفية أعلاه.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const numbered = assignStudentToCircle(student, student.circle, idx + 1);
                  return (
                    <tr 
                      key={student.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all font-semibold text-[11px] sm:text-xs text-slate-800 ${
                        student.status === 'archived' ? 'opacity-55' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-black font-mono">
                        <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs block font-bold shadow-2xs">
                          {numbered.organizationalId}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">
                          ثابت: {numbered.permanentId}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-900 leading-normal block">
                            {student.name} | <span className="text-indigo-700 font-mono text-xs">{numbered.organizationalId}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">المعرف الثابت: {numbered.permanentId} | المدرسة: {student.school}</span>
                        </div>
                      </td>

                      <td className="p-3 max-w-[150px] truncate">{student.circle}</td>
                      <td className="p-3">{student.teacher}</td>

                      <td className="p-3 text-center">
                        {student.academicIndicator === 'green' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-1 px-3.5 rounded-full font-black text-[10px] inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            متقدم (+10%)
                          </span>
                        )}
                        {student.academicIndicator === 'yellow' && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-250 p-1 px-3 rounded-full font-black text-[10px] inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            ضمن الخطة (±10%)
                          </span>
                        )}
                        {student.academicIndicator === 'red' && (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 p-1 px-2.5 rounded-full font-black text-[10px] inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            متأخر عن الخطة
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {student.status === 'active' && <span className="bg-emerald-900/10 text-emerald-950 p-1 px-2.5 rounded font-black text-[10px]">نشط جداً</span>}
                        {student.status === 'inactive' && <span className="bg-rose-900/10 text-rose-950 p-1 px-2.5 rounded font-black text-[10px]">منقطع مؤقتًا</span>}
                        {student.status === 'graduate' && <span className="bg-indigo-900/10 text-indigo-950 p-1 px-2.5 rounded font-black text-[10px]">خريج مكرم</span>}
                        {student.status === 'archived' && <span className="bg-stone-55 text-stone-105 p-1 px-2.5 rounded font-black text-[10px]">مؤرشف بالنظام</span>}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {student.riskFlags.length === 0 ? (
                            <span className="text-slate-400 text-[10px] font-bold">آمن (لا توجد مخاطر)</span>
                          ) : (
                            student.riskFlags.map(rf => (
                              <span key={rf} className="bg-rose-50 border border-rose-200 text-rose-800 p-0.5 px-2 rounded font-black text-[9px] inline-flex items-center gap-0.5" title="تنبيه مخاطر سلوكية">
                                <AlertCircle className="h-2.5 w-2.5 text-rose-600" />
                                {rf}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setShowFullProfile(false); // reset to split screen overview first
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 p-1.5 px-3 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 cursor-pointer transition-all border border-indigo-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>معاينة سريعة</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setShowFullProfile(true);
                              setFullProfileTab('timeline');
                            }}
                            className="bg-stone-900 hover:bg-stone-850 text-white p-1.5 px-3 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>الملف الكامل</span>
                          </button>

                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-rose-400 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                            title="أرشفة الملف"
                          >
                            <Trash className="h-4 w-4" />
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
      </div>

      {/* SECTION 7: QUICK STUDENT PREVIEW DETAIL CARD DRAWER / MODAL */}
      <AnimatePresence>
        {selectedStudentId && !showFullProfile && selectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-50 border-2 border-indigo-950 rounded-3xl p-5 md:p-6 shadow-xl relative"
          >
            {/* Close visual x */}
            <button
              onClick={() => setSelectedStudentId(null)}
              className="absolute top-4 left-4 bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full text-slate-700 cursor-pointer transition-all"
            >
              <Check className="h-4 w-4" />
            </button>

            <span className="bg-indigo-950 text-white p-1 px-3 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              نافذة معاينة سريعة مستقلة للطالب
            </span>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-start">
              
              {/* Box 1 (Left 4 columns) */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-3xs flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-base shadow-inner">
                      {selectedStudent.name.slice(0, 2)}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight font-display">{selectedStudent.name}</h4>
                      <p className="text-[10px] text-slate-400 font-black">الترميز الشخصي: {selectedStudent.id}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-600 font-semibold border-t border-slate-100 pt-3">
                    <p className="flex justify-between"><span>العمر الحالي:</span> <span className="text-slate-900 font-black">{selectedStudent.age} سنة</span></p>
                    <p className="flex justify-between"><span>الحلقة الحالية:</span> <span className="text-slate-900 font-black">{selectedStudent.circle}</span></p>
                    <p className="flex justify-between"><span>الشيخ المعلم:</span> <span className="text-slate-900 font-black">{selectedStudent.teacher}</span></p>
                    <p className="flex justify-between"><span>رقم التواصل لولي الأمر:</span> <span className="text-slate-900 font-black font-mono">{selectedStudent.parentPhone} ({selectedStudent.parentName})</span></p>
                    <p className="flex justify-between"><span>تاريخ الالتحاق بالمنبثق:</span> <span className="text-slate-900 font-black">{selectedStudent.joinDate}</span></p>
                  </div>
                </div>

                {/* Profile actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowFullProfile(true);
                      setFullProfileTab('timeline');
                    }}
                    className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg p-2 text-[10px] font-black text-center"
                  >
                    فتح الملف الشامل
                  </button>
                  <button
                    onClick={() => {
                      setTransferTarget({
                        circle: selectedStudent.circle,
                        teacher: selectedStudent.teacher,
                        reason: ''
                      });
                      setShowTransferModal(true);
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg p-2 text-[10px] font-black text-center"
                  >
                    نقل حلقة الطالب
                  </button>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="bg-white hover:bg-slate-100 border border-slate-300 rounded-lg p-2 text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1"
                  >
                    <Printer className="h-3 w-3" />
                    <span>طباعة بطاقة الهوية</span>
                  </button>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-2 text-[10px] font-black text-center"
                  >
                    + ملاحظة سريعة
                  </button>
                </div>
              </div>

              {/* Box 2 (8 columns) Metric values bar */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                
                {/* Visual score indicators */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-3xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-900 block border-b border-slate-100 pb-1.5">معدلات الأداء في الحلقات</span>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>معدل الحفظ والإنتاج:</span>
                        <span className="font-mono">{selectedStudent.hifzRate}%</span>
                      </div>
                      <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedStudent.hifzRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>معدل المراجعة والضبط:</span>
                        <span className="font-mono">{selectedStudent.muraajaaRate}%</span>
                      </div>
                      <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedStudent.muraajaaRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>نسبة الالتزام بالخطة اليومية:</span>
                        <span className="font-mono">{selectedStudent.commitmentScore}%</span>
                      </div>
                      <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${selectedStudent.commitmentScore}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-bold leading-normal">
                    * يتم جلب هذه المعطيات بنظام التجسير التلقائي من وحدة المتابعة والتدقيق التربوي.
                  </div>
                </div>

                {/* Last exam score & warnings */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-3xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-indigo-900 block border-b border-slate-100 pb-1.5">آخر اختبار في اللجنة</span>
                    <div className="text-center pt-2 space-y-1">
                      <span className="text-2xl font-black font-mono text-indigo-950">{selectedStudent.lastExamScore} <span className="text-xs font-bold text-slate-400">/100</span></span>
                      <p className="text-[11px] font-black text-slate-700 leading-snug">{selectedStudent.lastExamName}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-[10px] text-indigo-950 font-bold flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg">
                    <span>نسبة حضور المسجد الكلية:</span>
                    <span className="font-mono font-black text-xs text-indigo-900">{selectedStudent.attendanceRate}%</span>
                  </div>
                </div>

                {/* Mini Timeline and latest decision */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-3xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-900 block border-b border-slate-100 pb-1.5">موجز السجل الزمني (Mini Timeline)</span>
                  
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pt-1">
                    {selectedStudent.timeline.slice(0, 2).map((tl, i) => (
                      <div key={i} className="border-r-2 border-indigo-950 pr-2 pl-1 space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-400 font-bold block">{tl.date}</span>
                        <h5 className="text-[11px] font-black text-slate-800 leading-tight">{tl.title}</h5>
                        <p className="text-[10px] text-slate-500 leading-normal font-semibold max-w-[190px] truncate">{tl.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-[10px] font-black text-amber-900 flex justify-between items-center bg-amber-500/10 p-1.5 rounded">
                    <span>الحالة: {selectedStudent.trend === 'up' ? 'نمو متميز 📈' : 'أداء مستقر وعالي 📊'}</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 8 to 20: FULL STUDENT PROFILE DYNAMIC SCREEN (البوابة الشاملة للملف والتنقيب) */}
      <AnimatePresence>
        {selectedStudentId && showFullProfile && selectedStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border-2 border-indigo-950 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            {/* Nav and Close in profile page header code */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-250 pb-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFullProfile(false)}
                  className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-700 cursor-pointer transition-all flex items-center justify-center"
                  title="العودة"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-950 text-white font-mono text-xs font-black p-1 px-3 rounded-lg">{selectedStudent.id}</span>
                    <h3 className="text-lg md:text-xl font-black text-slate-850 font-display">{selectedStudent.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    ملف تتبع المسار التعليمي الشامل وعقد القرارات | تاريخ الالتحاق: {selectedStudent.joinDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="bg-indigo-950 hover:bg-indigo-900 text-white p-2.5 px-5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>تعديل/إضافة هدف فردي</span>
                </button>

                <button
                  onClick={() => setShowInterventionModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white p-2.5 px-5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Milestone className="h-4 w-4" />
                  <span>طرح قرار تدخل عاجل</span>
                </button>

                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 px-5 rounded-xl text-xs font-black cursor-pointer"
                >
                  إغلاق الملف والترميم
                </button>
              </div>
            </div>

            {/* Sub headers Info cards under student name */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">الحلقة المسار والمعلم الحالي</span>
                <p className="text-xs font-black text-slate-800">{selectedStudent.circle}</p>
                <p className="text-[10px] text-slate-500 font-bold">بإشراف المحفض: الشيخ {selectedStudent.teacher}</p>
              </div>

              <div className="space-y-1 border-r border-slate-200 pr-4">
                <span className="text-[10px] font-bold text-slate-400 block">العلاقة الأسرية والقرابة</span>
                <p className="text-xs font-black text-slate-800">{selectedStudent.parentName} ({selectedStudent.relationship})</p>
                <p className="text-[10px] text-slate-500 font-bold font-mono">هاتف الاتصال: {selectedStudent.parentPhone}</p>
              </div>

              <div className="space-y-1 border-r border-slate-200 pr-4">
                <span className="text-[10px] font-bold text-slate-400 block">الاتجاه العام للأداء التراكمي</span>
                <div className="flex items-center gap-1 pt-0.5">
                  {selectedStudent.trend === 'up' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] p-0.5 px-2 rounded-sm font-black flex items-center gap-0.5">
                      <ArrowUp className="h-3 w-3 inline" /> تصاعدي ومثمر (↑)
                    </span>
                  )}
                  {selectedStudent.trend === 'stable' && (
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] p-0.5 px-2 rounded-sm font-black flex items-center gap-0.5">
                      مستقر ومثالي (→)
                    </span>
                  )}
                  {selectedStudent.trend === 'down' && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] p-0.5 px-2 rounded-sm font-black flex items-center gap-0.5">
                      <ArrowDown className="h-3 w-3 inline animate-bounce" /> هبوط بالسرعات (↓)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 border-r border-slate-200 pr-4">
                <span className="text-[10px] font-bold text-slate-400 block">مخاطر التعثر والتسرب</span>
                <div className="flex items-center gap-1">
                  {selectedStudent.riskFlags.length === 0 ? (
                    <span className="text-emerald-800 text-xs font-black">🟢 ملف آمن ومعزز معنوياً</span>
                  ) : (
                    <span className="text-rose-800 text-xs font-black flex items-center gap-0.5 animate-pulse">
                      🔴 ملحوظة كشوف {selectedStudent.riskFlags.length} مؤشر تعثر خطر
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TAB SELECTORS Row */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {[
                { id: 'timeline', label: 'السجل الزمني والأرشيفي', icon: Calendar },
                { id: 'performance', label: 'الأداء والتقييمات التفصيلية', icon: BookOpen },
                { id: 'goals', label: 'الأهداف الفردية (Goals Layer)', icon: Target },
                { id: 'interventions', label: 'التدخلات الإدارية والقرارات', icon: Milestone },
                { id: 'notes', label: 'الملاحظات وسجل الاتصال بالمنزل', icon: ClipboardList },
                { id: 'achievements', label: 'الأوسمة والإنجازات الفردية', icon: Award },
                { id: 'map', label: 'خريطة مالك البيانات لسلامة النواة', icon: HelpCircle }
              ].map(tb => (
                <button
                  key={tb.id}
                  onClick={() => setFullProfileTab(tb.id as any)}
                  className={`p-2.5 px-5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    fullProfileTab === tb.id ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-950 hover:bg-slate-50'
                  }`}
                >
                  <tb.icon className="h-3.5 w-3.5" />
                  <span>{tb.label}</span>
                </button>
              ))}
            </div>

            {/* ACTIVE TAB CONTENT WINDOW */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 min-h-[300px]">
              
              {/* TAB 1: GENERAL TIMELINE (السجل التاريخي) */}
              {fullProfileTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">السجل الزمني وجريدة حركات الحافظ (Chronological General Timeline)</h4>
                    <span className="text-[10px] text-slate-400">يرصد تلقائياً التغيرات كالنقل بين الحلقات كمسار تدقيق غير معلق</span>
                  </div>

                  <div className="relative border-r-2 border-slate-300 pr-5 mr-3 py-2 space-y-6">
                    {selectedStudent.timeline.map((item, index) => (
                      <div key={index} className="relative">
                        {/* Dot */}
                        <div className="absolute top-1.5 -right-[27px] w-3 h-3 rounded-full bg-indigo-950 ring-4 ring-white" />
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-200/90 py-0.5 px-2 rounded inline-block">{item.date}</span>
                          <h5 className="text-xs sm:text-sm font-black text-slate-800 inline-block mr-2">{item.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold max-w-4xl">{item.desc}</p>
                          <span className="text-[10px] text-indigo-950 font-black block">صادر عن الجهة: {item.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: DETAILED PERFORMANCE & COMPARISON ENGINE (الأداء التعليمي) */}
              {fullProfileTab === 'performance' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">التحليل الإحصائي لتطور مهارات الحفظ والمراجعة</h4>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-200 p-0.5 px-2.5 rounded font-bold text-indigo-950">مؤشر التحصيل الفعلي الحالي</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Progress meters */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4">
                      <h5 className="font-bold text-xs text-slate-800">المؤشرات المفاهيمية الأساسية</h5>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>نسبة التلاوة والأداء بالتسميع الحركي:</span>
                            <span>{selectedStudent.hifzRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedStudent.hifzRate}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>جودة المراجعة العميقة (سبر علامات التراكمي):</span>
                            <span>{selectedStudent.muraajaaRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedStudent.muraajaaRate}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>معدل ضبط وتحقيق الخطة الفردية المقترحة:</span>
                            <span>{selectedStudent.commitmentScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${selectedStudent.commitmentScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compare against average */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4">
                      <h5 className="font-bold text-xs text-slate-800">محرك المقارنة المعياري (Benchmarking Engine)</h5>
                      <p className="text-[10px] text-slate-400">تقييم تطور الطالب بالمقارنة مع المتوسط العام لكامل الكادر والحلقات في الملتقى.</p>
                      
                      <div className="space-y-2 text-[11px] font-semibold text-slate-700">
                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                          <span>أداء الطالب التراكمي الشامل:</span>
                          <span className="font-black text-indigo-950 font-monotext-xs">{((selectedStudent.hifzRate + selectedStudent.muraajaaRate) / 2).toFixed(1)}%</span>
                        </div>

                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                          <span>سياق المقارنة مع متوسط الحلقة:</span>
                          <span className="font-black text-indigo-900 font-mono text-xs">85.0% (الفرق: {(((selectedStudent.hifzRate + selectedStudent.muraajaaRate) / 2) - 85).toFixed(1)}%)</span>
                        </div>

                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                          <span>سياق المقارنة مع كفاءة المنظومة ككل:</span>
                          <span className="font-black text-indigo-900 font-mono text-xs">81.0% (الفرق: {(((selectedStudent.hifzRate + selectedStudent.muraajaaRate) / 2) - 81).toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: PERSONAL GOALS ENGINE (الأهداف الفردية والخطة) */}
              {fullProfileTab === 'goals' && (() => {
                const storedPlans = getStoredPlans();
                const studentPlan = storedPlans[selectedStudent.id] || storedPlans['ST-000001'];

                return (
                <div className="space-y-4">
                  {/* 📜 بطاقة الخطة الدراسية وتفهيم الآيات للطالب */}
                  {studentPlan && (
                    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-md border border-emerald-700 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            الخطة القرآنية المعتمدة للطالب
                          </span>
                          <h5 className="text-xs font-bold text-white">
                            مقرر {studentPlan.studentName}
                          </h5>
                        </div>
                        <span className="text-[10px] text-emerald-200 font-mono">
                          آخر تحديث: {studentPlan.updatedAt}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-700">
                          <span className="text-amber-300 font-bold block mb-1">مقرر الحفظ (من وإلى):</span>
                          <p className="text-emerald-100">من: <span className="font-bold text-white">{studentPlan.hifzFrom}</span></p>
                          <p className="text-emerald-100">إلى: <span className="font-bold text-white">{studentPlan.hifzTo}</span></p>
                        </div>

                        <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-700">
                          <span className="text-amber-300 font-bold block mb-1">مقرر المراجعة (من وإلى):</span>
                          <p className="text-emerald-100">من: <span className="font-bold text-white">{studentPlan.muraajaaFrom}</span></p>
                          <p className="text-emerald-100">إلى: <span className="font-bold text-white">{studentPlan.muraajaaTo}</span></p>
                        </div>
                      </div>

                      <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/30 text-xs space-y-1">
                        <span className="text-amber-300 font-bold block">قسم تفهيم وتدبر الآيات المقررة:</span>
                        <p className="text-emerald-50 leading-relaxed font-medium">
                          {studentPlan.tafheemVerses}
                        </p>
                      </div>

                      {/* 🏆 قسم إنجاز الخطة وسجل الحضور والغياب الشهري باليوم */}
                      <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/70 text-xs space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-emerald-800 pb-1">
                          <span className="text-amber-300 font-bold">
                            قسم إنجاز الخطة وسجل الحضور والغياب الشهري ({studentPlan.attendanceMonth || 'أغسطس 2026'}):
                          </span>
                          <span className="bg-emerald-800 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            نسبة الالتزام: {Math.round(((studentPlan.attendedDays || 0) / (studentPlan.totalStudyDays || 1)) * 100)}%
                          </span>
                        </div>

                        {/* Plan Achievement metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          <div className="bg-emerald-900/60 p-1.5 rounded border border-emerald-700">
                            <span className="text-[9px] text-emerald-200 block">إنجاز الحفظ</span>
                            <span className="font-bold text-amber-300">{studentPlan.hifzAchievementPercent ?? 95}%</span>
                          </div>
                          <div className="bg-emerald-900/60 p-1.5 rounded border border-emerald-700">
                            <span className="text-[9px] text-emerald-200 block">إنجاز المراجعة</span>
                            <span className="font-bold text-amber-300">{studentPlan.muraajaaAchievementPercent ?? 90}%</span>
                          </div>
                          <div className="bg-emerald-900/60 p-1.5 rounded border border-emerald-700">
                            <span className="text-[9px] text-emerald-200 block">التقدير العام</span>
                            <span className="font-bold text-white text-[10px]">{studentPlan.achievementGrade || 'ممتاز مرتفع'}</span>
                          </div>
                        </div>

                        {/* Attendance breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                          <div className="bg-emerald-900/40 p-1.5 rounded border border-emerald-800">
                            <span className="text-[9px] text-emerald-200 block">إجمالي الأيام</span>
                            <span className="font-bold text-white">{studentPlan.totalStudyDays || 25} يوم</span>
                          </div>
                          <div className="bg-emerald-900/40 p-1.5 rounded border border-emerald-800">
                            <span className="text-[9px] text-amber-300 block">أيام الحضور</span>
                            <span className="font-bold text-amber-300">{studentPlan.attendedDays || 0} يوم</span>
                          </div>
                          <div className="bg-emerald-900/40 p-1.5 rounded border border-emerald-800">
                            <span className="text-[9px] text-amber-200 block">غياب بعذر</span>
                            <span className="font-bold text-amber-200">{studentPlan.absentExcusedDays || 0} يوم</span>
                          </div>
                          <div className="bg-emerald-900/40 p-1.5 rounded border border-emerald-800">
                            <span className="text-[9px] text-rose-300 block">غياب بدون عذر</span>
                            <span className="font-bold text-rose-300">{studentPlan.absentUnexcusedDays || 0} يوم</span>
                          </div>
                        </div>

                        {studentPlan.achievementNotes && (
                          <p className="text-[10px] text-emerald-100 bg-emerald-900/50 p-1.5 rounded border border-emerald-800">
                            <span className="font-bold text-amber-300">ملاحظات إنجاز الخطة:</span> {studentPlan.achievementNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">طبقة إدارة الأهداف الفردية المخصصة (Student Personal Goals)</h4>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="bg-indigo-950 hover:bg-slate-900 text-white rounded p-1 px-3 text-[10px] font-black cursor-pointer"
                    >
                      + تعيين هدف مشخصن جديد
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                    * على عكس الخطط المنهجية العامة للملتقى، يتم هنا صياغة وتحفيز غايات خاصة تفرد لكل طالب (أهداف حفظ، سرعة تسميع، كفاءة مخارج) لتحويل المتابعة إلى تدقيق قيادي متين.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedStudent.goals.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 font-bold font-mono text-xs">لم يتم صياغة أي غايات فردية للطالب حالياً.</p>
                    ) : (
                      selectedStudent.goals.map((g, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 relative flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <span className="p-0.5 px-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-bold text-[9px] uppercase tracking-wide inline-block">
                              {g.type === 'hifz' ? 'هدف الحفظ المقرن' : g.type === 'revision' ? 'هدف تثبيت المراجعة ومجراف التسميع' : 'هدف الحضور الميداني'}
                            </span>
                            <h5 className="font-mono text-xs text-slate-800 font-black">{g.title}</h5>
                          </div>

                          <div className="flex justify-between items-baseline pt-1 text-xs">
                            <span className="text-slate-400">الحالة والمعدل الفعلي:</span>
                            <span className="font-black font-mono text-indigo-950">{g.actual} / {g.target} {g.unit}</span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400">آخر تحديث: {g.lastUpdated}</span>
                            <span className={`p-0.5 px-2 rounded text-[9px] font-bold ${
                              g.status === 'achieved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {g.status === 'achieved' ? 'تحقق تماماً' : 'قيد المتابعة والسبر'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                );
              })()}

              {/* TAB 4: INTERVENTIONS AND DECISIONS (التدخلات الإدارية وسجل القرارات) */}
              {fullProfileTab === 'interventions' && (
                <div className="space-y-5">
                  
                  {/* Top Actions form info */}
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">نظام التدخل السلوكي الإداري ما بعد إرسال التنبيهات (Student Intervention Layer)</h4>
                    <button
                      onClick={() => setShowInterventionModal(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded p-1 px-3 text-[10px] font-black cursor-pointer"
                    >
                      + عقد جلسة أو تفعيل خطة إسناد ودعم
                    </button>
                  </div>

                  {/* Active support plans list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-indigo-900 block uppercase tracking-wide">دراسة الإحالات الفردية النشطة حالياً:</span>
                    {selectedStudent.interventions.length === 0 ? (
                      <p className="bg-white border border-slate-200 p-4 rounded-xl text-center text-xs text-slate-400 font-bold">
                        🟢 لا توجد أي تدخلات تربوية أو خطط تحسين سلوكي سارية المفعول لهذا الطالب.
                      </p>
                    ) : (
                      selectedStudent.interventions.map((int, i) => (
                        <div key={i} className="bg-amber-50/50 border border-amber-300 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="bg-amber-600 text-white font-bold p-0.5 px-2 rounded text-[10px]">خطة قرار الدعم</span>
                            <span className="font-mono text-slate-400">{int.date}</span>
                          </div>
                          <h5 className="font-black text-xs text-slate-800">{int.title}</h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">مسبب التدخل والربط: {int.reason}</p>
                          <div className="flex justify-between items-center pt-2 text-[10px] font-semibold text-slate-450">
                            <span>الجهة المنفذة المصدقة: {int.authority}</span>
                            <span className="text-amber-800 font-black">الحالة: {int.status === 'active' ? 'نشطة وتحت سبر المعلم' : 'مكتملة الأثر'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* High level educational decision roll */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-black text-indigo-900 block uppercase tracking-wide">أرشيف القرارات التربوية الموثقة (Educational Decisions Log):</span>
                    {selectedStudent.decisions.length === 0 ? (
                      <p className="bg-white border border-slate-100 p-4 rounded-xl text-center text-xs text-slate-400 font-bold">
                        لم يتم تدوين قرارات استباقية رفيعة المستوى بملف الطالب الإداري.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedStudent.decisions.map((dec, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>صادر القرار: {dec.auth}</span>
                                <span className="font-mono">{dec.date}</span>
                              </div>
                              <h5 className="font-black text-xs text-slate-800 leading-snug">{dec.title}</h5>
                              <p className="text-[10px] text-slate-500 leading-normal font-semibold">مسبب القرار: {dec.reason}</p>
                            </div>
                            <span className="text-[8px] tracking-wider uppercase font-black text-emerald-800 block text-left">شفاف ومحفوظ بالأرشيف الإداري للوزارات</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: NOTES & COMMUNICATION (الملاحظات وسجل الاتصال) */}
              {fullProfileTab === 'notes' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">نظام الملاحظات وسندات التواصل مع أولياء الأمور</h4>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded p-1 px-3 text-[10px] font-black cursor-pointer"
                    >
                      + تدوين ملاحظة سريعة
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Multilayer notes board */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-indigo-900 block uppercase tracking-wide">الملاحظات التربوية والسلوكية المصنفة:</span>
                      {selectedStudent.notes.length === 0 ? (
                        <p className="bg-white border border-slate-200 p-4 rounded-xl text-center text-xs text-slate-400 font-bold">لا توجد أي ملحوظات مرصودة حالياً.</p>
                      ) : (
                        selectedStudent.notes.map((nt, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                              <span className="p-0.5 px-2 bg-indigo-55 text-white rounded">
                                {nt.category === 'educational' ? 'تعليمي' : nt.category === 'behavioral' ? 'سلوكي' : nt.category === 'administrative' ? 'إداري' : 'عرضي'}
                              </span>
                              <span className="font-mono">{nt.date}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{nt.text}</p>
                            <span className="text-[9px] text-indigo-950 font-black block text-left">الكاتب: {nt.author}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Parents communication logs */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-indigo-900 block uppercase tracking-wide">سجل التواصل ومسودات رسائل ولي الأمر (Communication Log):</span>
                      {selectedStudent.communicationLog.length === 0 ? (
                        <p className="bg-white border border-slate-250 p-4 rounded-xl text-center text-xs text-slate-450 font-bold">
                          لم يتم توثيق أي حفل اتصال هاتفي أو إرسال تقرير صادر للمنزل حالياً.
                        </p>
                      ) : (
                        selectedStudent.communicationLog.map((log, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 scroll-m-1 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>قناة: {log.method}</span>
                              <span className="font-mono">{log.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-semibold">{log.note}</p>
                            <div className="flex items-center justify-between text-[8px] font-bold pt-1.5 text-indigo-950">
                              <span>ولي الأمر: {selectedStudent.parentName}</span>
                              <span>برابط موثق: {log.officer}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 6: ACHIEVEMENTS & BADGES (الأوسمة والإنجازات) */}
              {fullProfileTab === 'achievements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800 font-display">الأوسمة التشجيعية الحافزة والإنجازات الجماعية</h4>
                    <span className="text-[10px] text-slate-450">نظام محفزات الطلاب</span>
                  </div>

                  {/* List of achievements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Hifz crown */}
                    <div className="bg-indigo-950 text-white rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute -top-5 -left-5 opacity-10">
                        <Award className="h-24 w-24" />
                      </div>
                      <div className="space-y-1">
                        <span className="bg-indigo-500/35 text-indigo-200 p-0.5 px-2 rounded-md font-bold text-[9px] uppercase tracking-wide">مستقر ومعلن</span>
                        <h5 className="font-black text-xs">تاج السند الذهبي الصاعد</h5>
                        <p className="text-[10px] text-slate-300 leading-normal">يمنح للطلاب المنخرطين في سبر الأجزاء ومطابقة مخارج تلاوة القرأن بلا كلفة.</p>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-indigo-900 text-[10px]">
                        <span>منحه: إدارة الكفاءة</span>
                        <span className="bg-indigo-500 text-white text-[9px] py-0.5 px-2 rounded">استباقي معزّز</span>
                      </div>
                    </div>

                    {/* Default achievements listing */}
                    {selectedStudent.achievements.map((ach, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="p-0.5 px-2 bg-emerald-50 text-emerald-800 rounded font-bold text-[9px]">{ach.category}</span>
                          <h5 className="font-black text-xs text-indigo-950 font-display">{ach.title}</h5>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[9px] text-slate-400">
                          <span>تاريخ منحه: {ach.date}</span>
                          <span className="text-emerald-700 font-black font-mono">درجة الامتياز</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: DATA OWNERSHIP MAP (خريطة ملك العام) */}
              {fullProfileTab === 'map' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <h4 className="font-black text-xs sm:text-sm text-slate-800 font-display">خريطة ومخطط مرجعية مصادر البيانات لملف الطالب (Data Ownership Map)</h4>
                    <span className="text-[9px] font-black bg-stone-200 text-stone-800 p-1 px-3 rounded-full">تصميم معماري صارم (Section 5)</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    وفقاً لمبادئ هندسة البيانات البرمجية في ملتقى القرآن والذكاء الإداري، يمنع منعاً باتاً استنساخ أو خزن قيم الأداء اللحظي المفتوح يدوياً داخل ملف الطالب لضمان تماسك النواة. توضح التبيينات التالية المرجع الأوحد الموثوق لكل حقل إحصائي معروض:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { component: 'نسب تسجيل الحفظ والتسميع اليومي', owner: 'وحدة الحفظ والمسجلات عبر تطبيقات المعلمين', logic: 'رصد فوري تراكمي يطبع الكلمة والصفحة على الرسم (0-100)' },
                      { component: 'أوزان نقاط التقييم الدينامي', owner: 'محرك المعايير اللابرمجي (Dynamic Criteria Engine)', logic: 'مجموع ضرب قيم الكيان في الوزن المقترح والمصادق للحفاظ' },
                      { component: 'جدولة السنوات والأفواج المدرسية', owner: 'وحدة جدولة مصلحة السنوات الدورية بمصفوفة العقد', logic: 'أوتوماتيكي على حسب التقويم والسنة المعمول بها في المملكة' },
                      { component: 'مؤشرات الغياب والحضور المتكرر', owner: 'نظام الحضور الميداني المعتمد برمز الباركود ومداخل المساجد', logic: 'حساب نسبة أيام المواظبة ÷ إجمالي الجلسات المنهجية لملف الحافظ' }
                    ].map((m, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-3xs hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-indigo-950 font-display">{m.component}</span>
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[8px] p-0.5 px-2 rounded">مالك الحقل البرمجي</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-normal font-semibold font-mono">الجهة المالكة للبيانات: {m.owner}</p>
                        <p className="text-[10px] text-slate-450 leading-relaxed">{m.logic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD NEW STUDENT - ENTERPRISE TABBED ARCHITECTURE */}
      <NewStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSave={handleSaveStudentFromModal}
        nextStudentId={`ST-${String(students.length + 1).padStart(6, '0')}`}
        availableHalaqas={availableHalaqas}
      />

      {/* MODAL 2: TRANSFER STUDENT (نقل الطالب بين الحلقات مع سبب إلزامي) */}
      {showTransferModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-md p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-black text-sm text-slate-800">نقل الطالب المعرف: {selectedStudent.id}</h4>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleApplyTransfer} className="space-y-4">
              <p className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg leading-relaxed font-semibold">
                ⚠️ بمجرد نقله للحلقة المرشحة، سيتم ترحيل سجل أهدافه وجدولة تسميعه المنهجي وتوثيقه بسجل تتبع المدرسين.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اختيار الحلقة المرشحة الجديّدة:</label>
                <select
                  value={transferTarget.circle}
                  onChange={(e) => {
                    const selVal = e.target.value;
                    const teacherMap: Record<string, string> = {
                      'حقة حفظ الطليعة (خاتمين)': 'عبد الرحمن السعيد',
                      'حقة حفص للإتقان (متقدم)': 'أ. حازم عمر الحركي',
                      'شعبة الفقه والعقيدة (متوسط)': 'يونس الدوسري',
                      'حقة الأشبال الصغار (أ)': 'محمد معوض النخيلي'
                    };
                    setTransferTarget({ 
                      ...transferTarget, 
                      circle: selVal,
                      teacher: teacherMap[selVal] || 'عبد الرحمن السعيد'
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="حقة حفظ الطليعة (خاتمين)">حقة حفظ الطليعة (خاتمين)</option>
                  <option value="حقة حفص للإتقان (متقدم)">حقة حفص للإتقان (متقدم)</option>
                  <option value="شعبة الفقه والعقيدة (متوسط)">شعبة الفقه والعقيدة (متوسط)</option>
                  <option value="حقة الأشبال الصغار (أ)">حقة الأشبال الصغار (أ)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">المدرس المرتبط المستحضر:</label>
                <input 
                  type="text" 
                  value={transferTarget.teacher} 
                  className="w-full p-2.5 bg-slate-100 rounded-lg font-bold" 
                  disabled 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">مبرر النقل وتغيير المسار (م سبب إجباري للقبول):</label>
                <textarea
                  value={transferTarget.reason}
                  onChange={(e) => setTransferTarget({ ...transferTarget, reason: e.target.value })}
                  placeholder="مثال: بناءً على تفوقه في نصف المقرر وإتمام عشرة أجزاء أو رغبة الأب في الانضمام لطليعة الختم"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24 text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTransferModal(false)} className="bg-slate-100 p-2.5 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-indigo-950 text-white p-2.5 px-5 rounded-lg font-black">إمضاء قرار النقل</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: ADD QUICK NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-sm p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-xs sm:text-sm text-slate-800">إضافة ملاحظة سلوكية / تعليمية سريعة</h4>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 text-lg">×</button>
            </div>

            <form onSubmit={handleAddQuickNote} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">تصنيف الملاحظة المرجعي:</label>
                <select
                  value={quickNoteForm.category}
                  onChange={(e) => setQuickNoteForm({ ...quickNoteForm, category: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="educational">تربوي تعليمي (حفظ وتراكمي)</option>
                  <option value="behavioral">سلوكي أخلاقي وانضباط ميداني</option>
                  <option value="administrative">إداري توثيقي</option>
                  <option value="instructional">مخارج حروف وصوتيات</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">نص ومضمون التقييم السريع:</label>
                <textarea
                  value={quickNoteForm.text}
                  onChange={(e) => setQuickNoteForm({ ...quickNoteForm, text: e.target.value })}
                  placeholder="اكتب ملاحظتك برصانة هنا..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-4">
                <button type="button" onClick={() => setShowNoteModal(false)} className="bg-slate-100 p-2 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-emerald-600 text-white p-2 px-4 rounded-lg font-black">حفظ الملحوظة</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: ADD PERSONAL GOAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-sm p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-sm text-slate-850">تعيين أهداف فردية صاعدة (Personal Target Form)</h4>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400">×</button>
            </div>

            <form onSubmit={handleAddPersonalGoal} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">نوع ومغرز الهدف:</label>
                <select
                  value={newGoalForm.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    const u = val === 'hifz' ? 'صفحة' : val === 'revision' ? 'صفحة' : '%';
                    setNewGoalForm({ ...newGoalForm, type: val, unit: u });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="hifz">هدف منجز الحفظ للتلاوة</option>
                  <option value="revision">هدف الضبط والمراجعة التراكمية اليومية</option>
                  <option value="attendance">هدف مواظبة الحضور الجسدي بالمسجد</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">مسمى وعنوان الهدف الواضح:</label>
                <input 
                  type="text" 
                  value={newGoalForm.title}
                  onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                  placeholder="مثال: إتقان سبر آل عمران هذا الشهر"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">القيمة العددية للهدف:</label>
                  <input 
                    type="number" 
                    value={newGoalForm.target}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, target: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">وحدة المقياس المرئي:</label>
                  <input 
                    type="text" 
                    value={newGoalForm.unit}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 rounded-lg text-slate-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowGoalModal(false)} className="bg-slate-100 p-2 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-indigo-950 text-white p-2 px-5 rounded-lg font-black">تعيين الهدف الصاعد</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 5: ADMINISTRATIVE INTERVENTION FORMS (التدخل الإداري بعد التنبيه) */}
      {showInterventionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-md p-5 shadow-2xl text-right text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-black text-sm text-slate-800">تطبيق خطة تدخل ومؤازرة الطالب تربوياً</h4>
              <button onClick={() => setShowInterventionModal(false)} className="text-slate-400">×</button>
            </div>

            <form onSubmit={handleAddInterventionAndDecision} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">نموذج التدخل المطلوب تفعيله:</label>
                <select
                  value={newInterventionForm.type}
                  onChange={(e) => setNewInterventionForm({ ...newInterventionForm, type: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="support_plan">خطة دعم إضافية مكللة برعاية ثنائية</option>
                  <option value="redistribute">إعادة توزيع على حلقة أخرى أو معلم مناسب نفسياً</option>
                  <option value="counseling">تحويله للمستشار التربوي السلوكي للمؤسسة</option>
                  <option value="supervisor">عقد جلسة تقويمية مستقلة مع ولي الأمر</option>
                  <option value="improvement">تأخير الخطة المنهجية العامة ريثما تتم المراجعة</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">عنوان التدخل أو التشخيص المترتب:</label>
                <input 
                  type="text" 
                  value={newInterventionForm.title}
                  onChange={(e) => setNewInterventionForm({ ...newInterventionForm, title: e.target.value })}
                  placeholder="مثال: دمج باسل في خطة تفريع متشابهات البقرة والنساء"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">الأسباب وخلاصة التحليل وتفاصيل التقويم:</label>
                <textarea
                  value={newInterventionForm.reason}
                  onChange={(e) => setNewInterventionForm({ ...newInterventionForm, reason: e.target.value })}
                  placeholder="تضمين تقرير التشخيص هنا للمصادقة وتفادي تكرار الخلل..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowInterventionModal(false)} className="bg-slate-100 p-2.5 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-amber-600 text-white p-2.5 px-5 rounded-lg font-black">إصدار خطة الدعم والقرار</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 6: DIGITAL STUDENT CARD PRINT PREVIEW */}
      {showPrintModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border rounded-2xl w-full max-w-sm p-6 shadow-2xl text-right text-xs text-slate-800 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800">جاهز للطباعة (تصدير البطاقة الذكية)</h4>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 font-bold">×</button>
            </div>

            {/* Printable Frame wrapper */}
            <div className="border-4 border-double border-indigo-950 p-4 rounded-xl bg-slate-50 text-center space-y-3">
              <span className="text-[8px] bg-indigo-950 text-white font-mono p-0.5 px-2 rounded">الهوية التعريفية للملتقى</span>
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-black mx-auto">
                Q
              </div>
              <div className="space-y-0.5">
                <h5 className="font-black text-xs text-slate-900">{selectedStudent.name}</h5>
                <span className="font-mono text-[9px] font-bold text-slate-500">رقم السجل: {selectedStudent.id}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[10px] text-right space-y-1">
                <p>الحلقة: {selectedStudent.circle}</p>
                <p>المعلم: {selectedStudent.teacher}</p>
                <p>تاريخ الانتساب: {selectedStudent.joinDate}</p>
                <p className="font-mono">اتصال الأب: {selectedStudent.parentPhone}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              بإمكانك استخراج ملف PDF للبطاقة المعتمدة وتعليقها على حقيبة الحافظ.
            </p>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => {
                  window.print();
                }} 
                className="bg-indigo-950 text-white p-2 px-4 rounded-lg font-bold w-full"
              >
                طباعة البطاقة وتصدير PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}

        </>
      )}

    </div>
  );
}
