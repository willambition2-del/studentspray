/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, Calendar, CheckCircle2, Clock, AlertTriangle, Search, Filter, 
  Plus, Eye, FileText, Send, UserCheck, ChevronLeft, ShieldAlert, Award, TrendingUp, 
  BookOpen, Star, RefreshCw, Upload, Lock, Check, X, Shield, ArrowUpRight, 
  Sliders, MessageSquare, Printer, CheckCircle, FilePlus, Sparkles, HelpCircle, Layers, ArrowRight,
  Trash2, Edit3, Scale, RotateCcw, Calculator, Save, Zap, Users, History, ChevronDown, ChevronUp
} from 'lucide-react';

import { User } from '../types';
import { 
  FieldVisitRecord, VisitType, VisitStatus, NoteVisibility, 
  RecommendationPriority, RecommendationStatus, EvidenceConfidenceLevel, 
  EvaluationAxis, Recommendation, VisitNote, EvidenceAttachment,
  DEFAULT_EVALUATION_LEVELS, DEFAULT_EVALUATION_AXES_CONFIG, EvaluationLevel
} from '../types/fieldVisits';
import { getStoredFieldVisits, saveStoredFieldVisits } from '../data/mockFieldVisits';
import { mockCircles, mockTeachers, mockStudents } from './dashboard/dashboardData';

interface FieldVisitsManagementProps {
  currentUser: User | null;
  onNavigateToPrint?: (docData: any) => void;
}

export default function FieldVisitsManagement({ currentUser, onNavigateToPrint }: FieldVisitsManagementProps) {
  // State for visits data
  const [visits, setVisits] = useState<FieldVisitRecord[]>(() => getStoredFieldVisits());
  
  // Custom Axes Weights configuration
  const [axesConfig, setAxesConfig] = useState<Array<{ id: string; name: string; description: string; defaultWeight: number }>>(DEFAULT_EVALUATION_AXES_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // States for adding/editing criteria in modal
  const [showAddAxisForm, setShowAddAxisForm] = useState(false);
  const [newAxisName, setNewAxisName] = useState('');
  const [newAxisDesc, setNewAxisDesc] = useState('');
  const [newAxisWeight, setNewAxisWeight] = useState(10);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  // Helper to persist axesConfig
  const handleSaveAxesConfig = (newCfg: typeof axesConfig) => {
    setAxesConfig(newCfg);
  };

  // Auto-balance weights to equal 100%
  const handleAutoBalanceWeights = () => {
    if (axesConfig.length === 0) return;
    const baseShare = Math.floor(100 / axesConfig.length);
    const remainder = 100 - (baseShare * axesConfig.length);
    const balanced = axesConfig.map((axis, index) => ({
      ...axis,
      defaultWeight: baseShare + (index === 0 ? remainder : 0)
    }));
    handleSaveAxesConfig(balanced);
    setConfigSuccessMsg('تم إعادة توزيع الأوزان النسبية بالتساوي (المجموع = 100%).');
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  // Reset to Default Configuration
  const handleResetDefaultAxes = () => {
    handleSaveAxesConfig(DEFAULT_EVALUATION_AXES_CONFIG);
    setConfigSuccessMsg('تم إعادة ضبط معايير وأوزان التقييم الافتراضية.');
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  // Add a new Axis/Criterion
  const handleAddNewAxis = () => {
    if (!newAxisName.trim()) return;
    const newAxis = {
      id: `custom_axis_${Date.now()}`,
      name: newAxisName.trim(),
      description: newAxisDesc.trim() || 'معيار تقييم ميداني جديد مخصص',
      defaultWeight: Math.max(1, Math.min(100, newAxisWeight || 10))
    };
    const updated = [...axesConfig, newAxis];
    handleSaveAxesConfig(updated);
    setNewAxisName('');
    setNewAxisDesc('');
    setNewAxisWeight(10);
    setShowAddAxisForm(false);
    setConfigSuccessMsg(`تمت إضافة معيار "${newAxis.name}" بنجاح.`);
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  // Update existing Axis field
  const handleUpdateAxisField = (index: number, field: 'name' | 'description' | 'defaultWeight', value: any) => {
    const updated = [...axesConfig];
    updated[index] = {
      ...updated[index],
      [field]: field === 'defaultWeight' ? (parseInt(value) || 0) : value
    };
    handleSaveAxesConfig(updated);
  };

  // Delete an Axis
  const handleDeleteAxis = (index: number) => {
    if (axesConfig.length <= 1) {
      alert('يجب الإبقاء على معيار تقييم واحد على الأقل.');
      return;
    }
    const updated = axesConfig.filter((_, idx) => idx !== index);
    handleSaveAxesConfig(updated);
    setConfigSuccessMsg('تم حذف معيار التقييم بنجاح.');
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  // Active View Tab / Modal states
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedCircleProfileId, setSelectedCircleProfileId] = useState<string | null>(null);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editRequestReason, setEditRequestReason] = useState('');

  // Technical Supervisor Exclusive Panel States
  const [activeSupervisorTab, setActiveSupervisorTab] = useState<'visits' | 'circles'>('visits');
  const [supervisorCircleSearch, setSupervisorCircleSearch] = useState('');
  const [expandedCircleId, setExpandedCircleId] = useState<string | null>(null);
  const [studentsModalCircleId, setStudentsModalCircleId] = useState<string | null>(null);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircleFilter, setSelectedCircleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  // Role Checks
  const isSupervisor = currentUser?.type === 'supervisor' || currentUser?.roleName?.includes('وجه') || currentUser?.roleName?.includes('مشرف');
  const isTeacher = currentUser?.type === 'teacher';
  const isExecutive = currentUser?.type === 'branch_manager' || currentUser?.roleName?.includes('تنفيذي');
  const isGeneralManager = currentUser?.type === 'admin' || currentUser?.roleName?.includes('عام');

  // Helpers to persist visits
  const updateAndSaveVisits = (newVisits: FieldVisitRecord[]) => {
    setVisits(newVisits);
    saveStoredFieldVisits(newVisits);
  };

  // Selected Visit object
  const selectedVisit = useMemo(() => {
    return visits.find(v => v.id === selectedVisitId) || null;
  }, [visits, selectedVisitId]);

  // Filters logic
  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      // Teacher scope restriction: strictly restrict to teacher's circle/name/id
      if (isTeacher) {
        const isMatched = 
          (currentUser?.id && visit.teacherId === currentUser.id) || 
          (currentUser?.name && visit.teacherName === currentUser.name) ||
          (currentUser?.name && visit.teacherName?.includes(currentUser.name.split(' ')?.[1] || currentUser.name.split(' ')?.[0] || '')) ||
          (currentUser?.roleName && currentUser.roleName.includes(visit.circleName));
        if (!isMatched) {
          return false;
        }
      }

      const matchesSearch = 
        visit.circleName.includes(searchTerm) || 
        visit.teacherName.includes(searchTerm) || 
        visit.supervisorName.includes(searchTerm) ||
        visit.visitNumber.includes(searchTerm);

      const matchesCircle = selectedCircleFilter === 'all' || visit.circleId === selectedCircleFilter;
      const matchesStatus = selectedStatusFilter === 'all' || visit.status === selectedStatusFilter;
      const matchesLevel = selectedLevelFilter === 'all' || visit.level === selectedLevelFilter;
      const matchesType = selectedTypeFilter === 'all' || visit.visitType === selectedTypeFilter;

      return matchesSearch && matchesCircle && matchesStatus && matchesLevel && matchesType;
    });
  }, [visits, searchTerm, selectedCircleFilter, selectedStatusFilter, selectedLevelFilter, selectedTypeFilter, isTeacher, currentUser]);

  // Overall statistics calculation
  const stats = useMemo(() => {
    const total = filteredVisits.length;
    const approved = filteredVisits.filter(v => v.status === 'approved').length;
    const pending = filteredVisits.filter(v => v.status === 'pending_approval').length;
    const drafts = filteredVisits.filter(v => v.status === 'draft').length;

    const allRecommendations = filteredVisits.flatMap(v => v.recommendations);
    const openRecommendations = allRecommendations.filter(r => r.status === 'in_progress' || r.status === 'not_started').length;
    const overdueRecommendations = allRecommendations.filter(r => r.status === 'overdue').length;

    const avgScore = total > 0 ? (filteredVisits.reduce((acc, v) => acc + v.totalScore, 0) / total).toFixed(1) : '0';
    
    const criticalCircles = filteredVisits.filter(v => v.level === 'needs_intervention' || v.level === 'needs_improvement').length;

    return {
      total,
      approved,
      pending,
      drafts,
      openRecommendations,
      overdueRecommendations,
      avgScore,
      criticalCircles
    };
  }, [filteredVisits]);

  // Helper: Compute dynamic system-based suggested evaluation axes for a circle
  const calculateSuggestedAxesForCircle = (circle: any, cfgList: typeof axesConfig): EvaluationAxis[] => {
    const attendance = circle?.attendanceRate || 90;
    const hifz = circle?.planComplianceRate || 88;
    const revision = circle?.revisionRate || 85;
    const exam = circle?.avgTestScore || 89;
    const circleStudents = mockStudents.filter(s => s.circleId === circle?.id);
    const laggingCount = circleStudents.filter(s => s.status === 'lagging').length;

    return cfgList.map(cfg => {
      const nameLower = (cfg.name || '').toLowerCase();
      let suggestedScore = 85;
      let suggestedNotes = '';
      let suggestedStrengths: string[] = [];
      let suggestedImprovements: string[] = [];

      if (nameLower.includes('حضور') || nameLower.includes('انتظام') || nameLower.includes('سجل') || nameLower.includes('التزام')) {
        suggestedScore = attendance;
        suggestedNotes = `محتسب تلقائياً بناءً على سجلات الحضور بالنظام (نسبة الحضور: ${attendance}%).`;
        if (attendance >= 90) suggestedStrengths.push('انضباط ممتاز ونسبة حضور عالية للطلاب بالنظام');
        if (attendance < 85) suggestedImprovements.push('معالجة حالات الغياب والتأخر لدى بعض الطلاب');
      } else if (nameLower.includes('حفظ') || nameLower.includes('تسميع') || nameLower.includes('خطة') || nameLower.includes('تعليم')) {
        suggestedScore = hifz;
        suggestedNotes = `محتسب تلقائياً بناءً على نسبة إنجاز الخطة المقررة للحفظ والتسميع (نسبة الخطة: ${hifz}%).`;
        if (hifz >= 85) suggestedStrengths.push('الالتزام التام بالخطة المقررة للحفظ اليومي');
        if (hifz < 80) suggestedImprovements.push('تنشيط متابعة التسميع اليومي للطلاب المتأخرين عن المقرر');
      } else if (nameLower.includes('مراجعة') || nameLower.includes('تكرار') || nameLower.includes('ثبات')) {
        suggestedScore = revision;
        suggestedNotes = `محتسب تلقائياً بناءً على جدول المراجعة اليومية بالنظام (نسبة المراجعة: ${revision}%).`;
        if (revision >= 85) suggestedStrengths.push('انتظام جدول المراجعة الصغرى والكبرى للطلاب');
        if (revision < 80) suggestedImprovements.push('تكثيف جولات التكرار والمراجعة قبل البدء بحفظ جديد');
      } else if (nameLower.includes('تجويد') || nameLower.includes('تلاوة') || nameLower.includes('اختبار') || nameLower.includes('درجة')) {
        suggestedScore = exam;
        suggestedNotes = `محتسب تلقائياً بناءً على متوسط درجات الاختبارات القرآنية (المتوسط: ${exam}%).`;
        if (exam >= 88) suggestedStrengths.push('جودة عالية في أداء التلاوة وتطبيق أحكام التجويد');
        if (exam < 80) suggestedImprovements.push('التركيز على تصحيح المخارج وتطبيقات قواعد التجويد');
      } else if (nameLower.includes('تربوي') || nameLower.includes('سلوك') || nameLower.includes('تحفيز') || nameLower.includes('بيئة')) {
        suggestedScore = Math.round((attendance * 0.4) + (exam * 0.6));
        suggestedNotes = `مؤشر بيئة الحلقة والجانب التربوي بناءً على تفاعل ودرجات الطلاب بالنظام.`;
        suggestedStrengths.push('بيئة حلقة محفزة وتفاعل إيجابي مع الطلاب');
      } else {
        suggestedScore = Math.round((attendance + hifz + exam) / 3);
        suggestedNotes = `درجة مقترحة تلقائياً بمتوسط المؤشرات العامة للحلقة (${suggestedScore}%).`;
      }

      if (laggingCount > 0 && suggestedImprovements.length === 0) {
        suggestedImprovements.push(`متابعة ${laggingCount} طلاب متعثرين بحسب سجلات النظام`);
      }

      return {
        id: cfg.id,
        name: cfg.name,
        description: cfg.description,
        weight: cfg.defaultWeight,
        score: Math.min(100, Math.max(0, suggestedScore)),
        notes: suggestedNotes,
        strengths: suggestedStrengths,
        improvements: suggestedImprovements,
        evidences: []
      };
    });
  };

  // Helper: Compute live total weighted score (0 to 100)
  const calculateTotalWeightedScore = (axesList: EvaluationAxis[]): number => {
    const totalWeight = axesList.reduce((acc, a) => acc + (a.weight || 0), 0);
    if (totalWeight <= 0) return 0;
    const weightedSum = axesList.reduce((acc, a) => acc + ((a.score || 0) * (a.weight || 0)), 0);
    return Math.round(weightedSum / totalWeight);
  };

  // Helper: Derive Evaluation Level
  const getEvaluationLevelFromScore = (score: number): EvaluationLevel => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very_good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'needs_improvement';
    return 'needs_intervention';
  };

  // --- INTERACTIVE VISIT FILLING & EDITING STATE ---
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillVisitRecord, setFillVisitRecord] = useState<FieldVisitRecord | null>(null);

  // Auxiliary state for adding recommendations or tags inside Fill Modal
  const [fillRecTitle, setFillRecTitle] = useState('');
  const [fillRecDomain, setFillRecDomain] = useState('الجانب التعليمي');
  const [fillRecPriority, setFillRecPriority] = useState<RecommendationPriority>('medium');
  const [fillRecAssignedRole, setFillRecAssignedRole] = useState<'teacher' | 'supervisor' | 'management'>('teacher');
  const [fillRecDueDate, setFillRecDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [axisTagInputs, setAxisTagInputs] = useState<{ [key: string]: { strength: string; improvement: string } }>({});

  // --- NEW VISIT CREATION FORM STATE ---
  const [newVisitForm, setNewVisitForm] = useState({
    circleId: mockCircles[0]?.id || 'c1',
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '16:30',
    endTime: '18:00',
    visitType: 'periodic' as VisitType,
    reason: 'زيارة ميدانية تقويمية لتتبع جودة التسميع وانتظام السجلات',
    initialNotes: ''
  });

  // Quick action handlers for Technical Supervisor circles panel
  const handleStartVisitForCircle = (circleId: string) => {
    setNewVisitForm(prev => ({
      ...prev,
      circleId: circleId
    }));
    setShowNewVisitModal(true);
  };

  const handleStartImmediateFillForCircle = (circleId: string) => {
    const circle = mockCircles.find(c => c.id === circleId) || mockCircles[0];
    const circleTeacher = mockTeachers.find(t => t.id === circle.teacherId) || { id: 't1', name: circle.teacherName };
    const initialAxes = calculateSuggestedAxesForCircle(circle, axesConfig);
    const totalScore = calculateTotalWeightedScore(initialAxes);
    const level = getEvaluationLevelFromScore(totalScore);

    const laggingCount = mockStudents.filter(s => s.circleId === circle.id && s.status === 'lagging').length;
    const totalStudentsInCircle = mockStudents.filter(s => s.circleId === circle.id).length || circle.studentsCount;

    const newRecord: FieldVisitRecord = {
      id: `vis-${Date.now()}`,
      visitNumber: `VIS-1447-${Math.floor(100 + Math.random() * 900)}`,
      circleId: circle.id,
      circleName: circle.name,
      teacherId: circleTeacher.id,
      teacherName: circleTeacher.name,
      supervisorId: currentUser?.id || 'u-3',
      supervisorName: currentUser?.name || 'الأستاذ محمد بن فهد الدوسري',
      visitDate: new Date().toISOString().split('T')[0],
      startTime: '16:30',
      endTime: '18:00',
      visitType: 'periodic',
      reason: 'تقويم فوري ومتابعة ميدانية حية للحلقة',
      initialNotes: 'زيارة ميدانية وتقويم فوري مباشر من قبل الموجه الفني',
      axes: initialAxes,
      totalScore: totalScore,
      level: level,
      evidenceConfidence: 'high',
      confidenceScorePercentage: 95,
      globalStrengths: ['انضباط الطلاب بالحضور والتسميع', 'تمكن المعلم من المنهجية'],
      globalImprovements: ['تعزيز مراجعة الأجزاء السابقة'],
      improvementPlan: {
        id: `imp-${Date.now()}`,
        title: 'خطة التحسين والتطوير المستهدف',
        targetCompletionRate: 95,
        currentCompletionRate: 85,
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      appeals: [],
      reportAccessRequests: [],
      auditTrail: [],
      systemDataSnapshot: {
        attendanceRate: circle.attendanceRate || 90,
        hifzRate: circle.planComplianceRate || 88,
        revisionRate: circle.revisionRate || 88,
        examAvgScore: circle.avgTestScore || 89,
        laggingStudentsCount: laggingCount,
        distinguishedStudentsCount: Math.max(1, Math.floor(totalStudentsInCircle * 0.2)),
        totalStudents: totalStudentsInCircle,
        activitiesCount: circle.activitiesCount || 2,
        badgesCount: 5,
        previousVisitScore: circle.supervisorRating || 88,
      },
      notes: [],
      recommendations: [],
      teacherResponse: { isAcknowledged: false } as any,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFillVisitRecord(newRecord);
    setShowFillModal(true);
  };

  const handleCreateNewVisit = () => {
    const circle = mockCircles.find(c => c.id === newVisitForm.circleId) || mockCircles[0];
    const circleTeacher = mockTeachers.find(t => t.id === circle.teacherId) || { id: 't1', name: circle.teacherName };

    const totalStudentsInCircle = mockStudents.filter(s => s.circleId === circle.id).length || circle.studentsCount;
    const laggingStudentsCount = mockStudents.filter(s => s.circleId === circle.id && s.status === 'lagging').length;

    // Calculate dynamic suggested axes based on real circle data
    const initialAxes = calculateSuggestedAxesForCircle(circle, axesConfig);
    const totalScore = calculateTotalWeightedScore(initialAxes);
    const level = getEvaluationLevelFromScore(totalScore);

    const newRecord: FieldVisitRecord = {
      id: `vis-${Date.now()}`,
      visitNumber: `VIS-1447-${Math.floor(100 + Math.random() * 900)}`,
      circleId: circle.id,
      circleName: circle.name,
      teacherId: circleTeacher.id,
      teacherName: circleTeacher.name,
      supervisorId: currentUser?.id || 'u-3',
      supervisorName: currentUser?.name || 'الأستاذ محمد بن فهد الدوسري',
      visitDate: newVisitForm.visitDate,
      startTime: newVisitForm.startTime,
      endTime: newVisitForm.endTime,
      visitType: newVisitForm.visitType,
      reason: newVisitForm.reason,
      initialNotes: newVisitForm.initialNotes,
      axes: initialAxes,
      totalScore: totalScore,
      level: level,
      systemDataSnapshot: {
        attendanceRate: circle.attendanceRate || 90,
        hifzRate: circle.planComplianceRate || 88,
        revisionRate: circle.revisionRate || 88,
        examAvgScore: circle.avgTestScore || 89,
        laggingStudentsCount: laggingStudentsCount,
        distinguishedStudentsCount: Math.max(1, Math.floor(totalStudentsInCircle * 0.2)),
        totalStudents: totalStudentsInCircle,
        activitiesCount: circle.activitiesCount || 2,
        badgesCount: 5,
        previousVisitScore: circle.supervisorRating || 88,
        previousVisitDate: '2026-05-15',
        previousRecommendationsCount: 1,
        previousRecommendationsImplementedRate: 100
      },
      discrepancyAlert: {
        hasDiscrepancy: false,
        differencePercentage: 0,
        message: 'تم احتساب الدرجات المقترحة آلياً استناداً لبيانات النظام، ويمكنك تعديل أي درجة أو ملاحظة بحرية.'
      },
      evidenceConfidence: 'high',
      confidenceScorePercentage: 90,
      notes: newVisitForm.initialNotes ? [
        {
          id: `n-${Date.now()}`,
          text: newVisitForm.initialNotes,
          visibility: 'shared_with_teacher',
          authorName: currentUser?.name || 'الموجه الفني',
          authorRole: 'الموجه الفني',
          createdAt: newVisitForm.visitDate
        }
      ] : [],
      globalStrengths: ['انضباط الحلقة والالتزام بجدول التسميع'],
      globalImprovements: laggingStudentsCount > 0 ? [`متابعة ${laggingStudentsCount} طلاب متعثرين بحسب النظام`] : [],
      recommendations: laggingStudentsCount > 0 ? [
        {
          id: `rec-${Date.now()}`,
          title: `وضع خطة علاجية فردية لـ ${laggingStudentsCount} طلاب متعثرين بالحلقة`,
          domain: 'الجانب التعليمي',
          assignedToRole: 'teacher',
          assignedToName: circleTeacher.name,
          startDate: newVisitForm.visitDate,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          priority: 'high',
          status: 'in_progress',
          notes: 'متابعة تنفيذ الخطة العلاجية'
        }
      ] : [],
      improvementPlan: {
        id: `plan-${Date.now()}`,
        title: `خطة التحسين الميداني - ${circle.name}`,
        targetCompletionRate: 100,
        currentCompletionRate: 0,
        recommendations: [],
        lastUpdated: newVisitForm.visitDate
      },
      status: 'draft',
      appeals: [],
      reportAccessRequests: [],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          authorName: currentUser?.name || 'الموجه الفني',
          authorRole: 'الموجه الفني',
          action: 'بدء الزيارة الميدانية وتعبئة التقييم آلياً استناداً لبيانات النظام',
          timestamp: `${newVisitForm.visitDate} ${newVisitForm.startTime}`
        }
      ],
      createdAt: newVisitForm.visitDate,
      updatedAt: newVisitForm.visitDate
    };

    updateAndSaveVisits([newRecord, ...visits]);
    setShowNewVisitModal(false);

    // Launch interactive filling screen immediately!
    setFillVisitRecord(newRecord);
    setShowFillModal(true);
  };

  // --- ACTIONS FOR VISITS ---
  const handleSaveVisitDraft = (updatedRecord: FieldVisitRecord) => {
    const updated = visits.map(v => v.id === updatedRecord.id ? { ...updatedRecord, updatedAt: new Date().toISOString().split('T')[0] } : v);
    updateAndSaveVisits(updated);
  };

  const handleApproveVisit = (visitId: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'approved' as VisitStatus,
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'الموجه الفني',
              authorRole: currentUser?.roleName || 'الموجه الفني',
              action: 'اعتماد التقرير الميداني رسمياً وإرسال الملخص المعلم',
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ],
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  const handleTeacherTaskStatusUpdate = (visitId: string, recId: string, newStatus: RecommendationStatus, proofNote?: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const updatedRecs = v.recommendations.map(r => {
          if (r.id === recId) {
            return {
              ...r,
              status: newStatus,
              completionProofNote: proofNote || r.completionProofNote,
              completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : r.completedAt
            };
          }
          return r;
        });

        const completedCount = updatedRecs.filter(r => r.status === 'completed').length;
        const totalCount = updatedRecs.length;
        const newRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          ...v,
          recommendations: updatedRecs,
          improvementPlan: {
            ...v.improvementPlan,
            currentCompletionRate: newRate,
            lastUpdated: new Date().toISOString().split('T')[0]
          },
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'مدرس الحلقة',
              authorRole: 'مدرس الحلقة',
              action: `تحديث حالة التوصية (${recId}) إلى: ${newStatus}`,
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  const handleTeacherResponseSubmit = (visitId: string, responseText: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          teacherResponse: {
            id: `tr-${Date.now()}`,
            teacherId: currentUser?.id || 't1',
            teacherName: currentUser?.name || 'مدرس الحلقة',
            notes: responseText,
            submittedAt: new Date().toISOString().split('T')[0]
          },
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'مدرس الحلقة',
              authorRole: 'مدرس الحلقة',
              action: 'تدوين رد المعلم المباشر على التقرير',
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  const handleTeacherAppealSubmit = (visitId: string, appealData: { axisOrItem: string; reason: string; explanation: string }) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const newAppeal = {
          id: `app-${Date.now()}`,
          teacherId: currentUser?.id || 't1',
          teacherName: currentUser?.name || 'مدرس الحلقة',
          axisOrItem: appealData.axisOrItem,
          reason: appealData.reason,
          explanation: appealData.explanation,
          status: 'pending' as const,
          submittedAt: new Date().toISOString().split('T')[0]
        };
        return {
          ...v,
          appeals: [...v.appeals, newAppeal],
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'مدرس الحلقة',
              authorRole: 'مدرس الحلقة',
              action: `تقديم طلب مراجعة تقييم للبند: ${appealData.axisOrItem}`,
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  const handleTeacherReportRequestSubmit = (visitId: string, reason: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const newReq = {
          id: `req-${Date.now()}`,
          teacherId: currentUser?.id || 't1',
          teacherName: currentUser?.name || 'مدرس الحلقة',
          visitId: visitId,
          visitDate: v.visitDate,
          reason: reason,
          status: 'pending' as const,
          requestedAt: new Date().toISOString().split('T')[0]
        };
        return {
          ...v,
          reportAccessRequests: [...v.reportAccessRequests, newReq],
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'مدرس الحلقة',
              authorRole: 'مدرس الحلقة',
              action: 'تقديم طلب رسميا للحصول على النسخة الكاملة من التقرير الإداري',
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  const handleExecutiveDecideReportRequest = (visitId: string, reqId: string, status: 'approved' | 'rejected', decisionNotes?: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const updatedRequests = v.reportAccessRequests.map(r => {
          if (r.id === reqId) {
            return {
              ...r,
              status,
              decisionNotes,
              decidedBy: currentUser?.name || 'المدير التنفيذي'
            };
          }
          return r;
        });

        return {
          ...v,
          reportAccessRequests: updatedRequests,
          auditTrail: [
            ...v.auditTrail,
            {
              id: `aud-${Date.now()}`,
              authorName: currentUser?.name || 'المدير التنفيذي',
              authorRole: 'المدير التنفيذي',
              action: `البت في طلب المعلم للحصول على التقرير: ${status === 'approved' ? 'قبول الطلب' : 'رفض الطلب'}`,
              timestamp: new Date().toLocaleString('ar-SA')
            }
          ]
        };
      }
      return v;
    });
    updateAndSaveVisits(updated);
  };

  // Printable Document Bridge
  const handlePrintReport = (visitRecord: FieldVisitRecord, docScope: 'teacher' | 'supervisor' | 'executive') => {
    const printableData = {
      id: `DOC-VIS-${visitRecord.visitNumber}`,
      serialNumber: visitRecord.visitNumber,
      title: `تقرير التقييم الميداني والزيارة (${visitRecord.circleName})`,
      docType: 'report',
      dataScope: docScope === 'teacher' ? 'my_circle' : 'system_wide',
      circleName: visitRecord.circleName,
      date: visitRecord.visitDate,
      contentData: {
        visit: visitRecord,
        scope: docScope,
        generatedBy: currentUser?.name || 'النظام'
      }
    };

    if (onNavigateToPrint) {
      onNavigateToPrint(printableData);
    } else {
      window.print();
    }
  };

  // Determine view header title based on role
  const pageTitle = isSupervisor ? 'لوحة الزيارات والتقييم الميداني للحلقات' :
                    isTeacher ? 'سجل التقييم الميداني والمهام الموجهة' :
                    isExecutive ? 'متابعة الحلقات والتقييم الميداني الإداري' :
                    'منظومة الرقابة والتميز الميداني للحلقات القرآنية';

  return (
    <div className="space-y-6 text-right font-sans text-slate-900 pb-12" dir="rtl">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              نظام جودة التعليم القرآني
            </span>
            <span className="text-slate-400 text-xs font-mono">DORAH-VIS-2026</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
            منظومة مترابطة لإدارة دورة الزيارة الميدانية كاملة من التقييم، التوثيق بالأدلة، خطط التحسين، وتتبع الاستجابة بين الموجه والمدرس والإدارة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Supervisor Action */}
          {isSupervisor && (
            <>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>أوزان المعايير</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNewVisitModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ زيارة ميدانية جديدة</span>
              </button>
            </>
          )}

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => setVisits(getStoredFieldVisits())}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW PANELS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500">إجمالي الزيارات</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{stats.total}</p>
          <span className="text-[9px] text-slate-400 font-medium">سجلات موثقة</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700">المعتمدة</span>
          <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{stats.approved}</p>
          <span className="text-[9px] text-emerald-700 font-medium">جاهزة ومكتملة</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-700">قيد الاعتماد</span>
          <p className="text-xl font-black text-amber-600 mt-1 font-mono">{stats.pending}</p>
          <span className="text-[9px] text-amber-700 font-medium">بانتظام المراجعة</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-600">المسودات</span>
          <p className="text-xl font-black text-slate-700 mt-1 font-mono">{stats.drafts}</p>
          <span className="text-[9px] text-slate-400 font-medium">قيد الإعداد</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-700">توصيات مفتوحة</span>
          <p className="text-xl font-black text-indigo-600 mt-1 font-mono">{stats.openRecommendations}</p>
          <span className="text-[9px] text-indigo-700 font-medium">خطط جارية</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-700">توصيات متأخرة</span>
          <p className="text-xl font-black text-rose-600 mt-1 font-mono">{stats.overdueRecommendations}</p>
          <span className="text-[9px] text-rose-700 font-medium">تحتاج إنذار</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-800">متوسط التقييم</span>
          <p className="text-xl font-black text-indigo-900 mt-1 font-mono">{stats.avgScore}%</p>
          <span className="text-[9px] text-indigo-700 font-medium">مؤشر الجودة الكلي</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-800">حلقات حرجة</span>
          <p className="text-xl font-black text-rose-700 mt-1 font-mono">{stats.criticalCircles}</p>
          <span className="text-[9px] text-rose-700 font-medium">تحتاج مساندة عاجلة</span>
        </div>
      </div>

      {/* SUPERVISOR SPECIAL TABS BAR (Shown ONLY for Technical Supervisors) */}
      {isSupervisor && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              لوحة الموجه الفني المخصص
            </span>
            <span className="text-slate-300 text-xs font-bold hidden md:inline">
              اختر التبويب المطلوب للعرض:
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveSupervisorTab('visits')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSupervisorTab === 'visits'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-300" />
              <span>سجلات الزيارات الميدانية ({filteredVisits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSupervisorTab('circles')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSupervisorTab === 'circles'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>نافذة الحلقات والمعلومات الأساسية ({mockCircles.length})</span>
              <span className="bg-amber-500/30 text-amber-200 text-[9px] px-1.5 py-0.5 rounded border border-amber-400/30 font-bold">
                خاص بالموجه
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SUPERVISED CIRCLES PANEL (Exclusive to Technical Supervisor when 'circles' tab is active) */}
      {isSupervisor && activeSupervisorTab === 'circles' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl border border-emerald-900/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-300" />
                  نافذة الحلقات والمعلومات الأساسية
                </span>
                <span className="text-slate-400 text-xs font-mono font-bold">EXCLUSIVE-SUPERVISOR</span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                استعراض الحلقات الميدانية ومؤشرات النظام الحية
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-3xl">
                نافذة متكاملة مخصصة للموجه الفني تعرض اسم الحلقة، المدرس، الطلاب وقيدهم، الزيارات الميدانية السابقة، والتقييم الشهري العام المتصل بمؤشرات النظام الحية.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={supervisorCircleSearch}
                  onChange={(e) => setSupervisorCircleSearch(e.target.value)}
                  placeholder="ابحث بالحلقة، المحفظ، أو الحالة..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>الحلقات تحت الإشراف</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{mockCircles.length}</p>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">موزعة على كافة الفروع</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي الطلاب المسجلين</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                {mockCircles.reduce((acc, c) => acc + c.studentsCount, 0)}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">متابعون ميدانياً</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>متوسط التقييم العام</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2 font-mono">
                {(mockCircles.reduce((acc, c) => acc + c.overallScore, 0) / mockCircles.length).toFixed(1)}%
              </p>
              <span className="text-[10px] text-amber-700 font-bold mt-1 block">مؤشر الجودة التراكمي</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>حلقات تحتاج توجيه</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2 font-mono">
                {mockCircles.filter(c => c.status === 'lagging').length}
              </p>
              <span className="text-[10px] text-rose-700 font-bold mt-1 block">حلقة بوضع حرش</span>
            </div>
          </div>

          {/* CIRCLES CARDS LIST */}
          <div className="space-y-4">
            {mockCircles
              .filter(c => 
                c.name.includes(supervisorCircleSearch) || 
                c.teacherName.includes(supervisorCircleSearch) ||
                c.priorityLabel.includes(supervisorCircleSearch)
              )
              .map((circle) => {
                const teacher = mockTeachers.find(t => t.id === circle.teacherId) || { name: circle.teacherName, rating: 4.5, supervisorRating: circle.supervisorRating, status: 'stable' };
                const circleStudents = mockStudents.filter(s => s.circleId === circle.id);
                const laggingStudents = circleStudents.filter(s => s.status === 'lagging');
                const exceedingStudents = circleStudents.filter(s => s.status === 'exceeding');
                const circleVisitsList = visits.filter(v => v.circleId === circle.id || v.circleName === circle.name);
                const isExpanded = expandedCircleId === circle.id;

                const openRecs = circleVisitsList
                  .flatMap(v => v.recommendations)
                  .filter(r => r.status === 'in_progress' || r.status === 'not_started' || r.status === 'overdue');

                return (
                  <div 
                    key={circle.id} 
                    className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${
                      circle.status === 'lagging' ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg">
                            {circle.id.toUpperCase()}
                          </span>
                          <h3 className="text-base md:text-lg font-black text-slate-900">
                            {circle.name}
                          </h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            circle.status === 'excellent' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            circle.status === 'good' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                            'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {circle.priorityLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-3">
                          <span>المدرس: <strong className="text-slate-800">{circle.teacherName}</strong></span>
                          <span>•</span>
                          <span>الطلاب المسجلون: <strong className="text-slate-800">{circle.studentsCount} طالب</strong></span>
                        </p>
                      </div>

                      {/* Overall Monthly Score Badge */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-indigo-900 text-white p-3 rounded-2xl flex items-center gap-3 border border-indigo-800 shadow-sm">
                          <div className="text-center">
                            <span className="text-[10px] text-indigo-200 block font-bold">التقييم العام للشهر</span>
                            <strong className="text-lg font-black font-mono text-emerald-300">{circle.overallScore}%</strong>
                          </div>
                          <div className="w-12 bg-indigo-950 h-2 rounded-full overflow-hidden border border-indigo-700">
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full" style={{ width: `${circle.overallScore}%` }}></div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartVisitForCircle(circle.id)}
                          className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ بدء زيارة ميدانية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentsModalCircleId(circle.id)}
                          className="px-3.5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md border border-indigo-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-indigo-300" />
                          <span>استعراض طلاب الحلقة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedCircleId(isExpanded ? null : circle.id)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'طي التفاصيل' : 'استعراض التفاصيل'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* MAIN 6 ESSENTIAL ITEMS GRID */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-white text-xs font-medium">
                      
                      {/* 1. اسم بالحلقة والمدرس */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          1. المدرس والكادر
                        </span>
                        <div className="font-bold text-slate-900 text-xs">{circle.teacherName}</div>
                        <div className="text-[10px] text-slate-500">الأداء: <strong className="text-amber-600">★ {teacher.rating || 4.5}</strong></div>
                        <div className="text-[10px] text-emerald-700 font-bold">تقييم الموجه: {circle.supervisorRating}%</div>
                      </div>

                      {/* 2. الطلاب والقيد */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          2. الطلاب والقيد
                        </span>
                        <div className="font-bold text-slate-900 text-xs">{circle.studentsCount} طالب مسجل</div>
                        <div className="text-[10px] text-slate-600">منتظمون: <strong className="text-emerald-700">{circle.activeStudentsCount}</strong></div>
                        {laggingStudents.length > 0 ? (
                          <div className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            متعثرون: {laggingStudents.length} طلاب
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-bold">لا يوجد متعثرون</div>
                        )}
                      </div>

                      {/* 3. التقييم الشهري الآلي */}
                      <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-1">
                        <span className="text-[10px] text-indigo-800 font-bold block flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          3. التقييم الشهري الآلي
                        </span>
                        <div className="font-black text-indigo-900 text-sm font-mono">{circle.overallScore}%</div>
                        <div className="text-[10px] text-indigo-700 font-bold">الحضور: {circle.attendanceRate}%</div>
                        <div className="text-[10px] text-indigo-700 font-bold">التزام الخطة: {circle.planComplianceRate}%</div>
                      </div>

                      {/* 4. الزيارات السابقة */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-indigo-600" />
                          4. الزيارات السابقة
                        </span>
                        <div className="font-bold text-slate-900 text-xs">{circleVisitsList.length} زيارات موثقة</div>
                        {circleVisitsList.length > 0 ? (
                          <>
                            <div className="text-[10px] text-slate-600">آخر زيارة: {circleVisitsList[0].visitDate}</div>
                            <div className="text-[10px] text-emerald-700 font-bold">الدرجة: {circleVisitsList[0].totalScore}%</div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400">لا توجد زيارات سابقة</div>
                        )}
                      </div>

                      {/* 5. مؤشرات التحصيل والمراجعة */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          5. التحصيل والمراجعة
                        </span>
                        <div className="font-bold text-slate-900 text-xs">الاختبارات: {circle.avgTestScore}%</div>
                        <div className="text-[10px] text-slate-600">المراجعة: {circle.revisionRate}%</div>
                        <div className="text-[10px] text-slate-600">الصفحات: {circle.memorizationPages} ص</div>
                      </div>

                      {/* 6. التوصيات والأنشطة */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          6. التوصيات والأنشطة
                        </span>
                        <div className="font-bold text-slate-900 text-xs">أنشطة وأوسمة: {circle.activitiesCount}</div>
                        <div className={`text-[10px] font-bold ${openRecs.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          توصيات نشطة: {openRecs.length}
                        </div>
                        <div className="text-[10px] text-slate-500">حالة الفرع: انتظام ممتاز</div>
                      </div>

                    </div>

                    {/* EXPANDABLE PROFILE DRAWER */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-6">
                        
                        {/* PREVIOUS VISITS TABLE FOR THIS CIRCLE */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                              <History className="w-4 h-4 text-emerald-600" />
                              سجل الزيارات الميدانية السابقة للحلقة ({circleVisitsList.length})
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleStartVisitForCircle(circle.id)}
                              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              إضافة زيارة جديدة
                            </button>
                          </div>

                          {circleVisitsList.length === 0 ? (
                            <p className="text-xs text-slate-500 py-3 text-center">لا توجد زيارات ميدانية سابقة مسجلة لهذه الحلقة بالنظام.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-bold">
                                  <tr>
                                    <th className="p-2.5">رقم الزيارة</th>
                                    <th className="p-2.5">التاريخ والنوع</th>
                                    <th className="p-2.5">الموجه الفني</th>
                                    <th className="p-2.5 text-center">الدرجة والمستوى</th>
                                    <th className="p-2.5 text-center">الحالة</th>
                                    <th className="p-2.5 text-center">الإجراءات</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {circleVisitsList.map(visit => {
                                    const levelCfg = DEFAULT_EVALUATION_LEVELS.find(l => l.level === visit.level) || DEFAULT_EVALUATION_LEVELS[0];
                                    return (
                                      <tr key={visit.id} className="hover:bg-slate-50">
                                        <td className="p-2.5 font-mono font-bold text-indigo-900">{visit.visitNumber}</td>
                                        <td className="p-2.5">
                                          <div className="font-bold text-slate-800">{visit.visitDate}</div>
                                          <span className="text-[10px] text-slate-500">{visit.visitType === 'periodic' ? 'دورية' : visit.visitType === 'therapeutic' ? 'علاجية' : 'متابعة'}</span>
                                        </td>
                                        <td className="p-2.5 font-bold text-slate-700">{visit.supervisorName}</td>
                                        <td className="p-2.5 text-center">
                                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${levelCfg.badgeColor}`}>
                                            {visit.totalScore}% — {levelCfg.label}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-center font-bold">
                                          {visit.status === 'approved' ? (
                                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ معتمدة</span>
                                          ) : (
                                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">● قيد الاعتماد</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setSelectedVisitId(visit.id)}
                                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              عرض
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handlePrintReport(visit, 'supervisor')}
                                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                            >
                                              <Printer className="w-3.5 h-3.5" />
                                              طباعة
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* STUDENTS ROSTER TABLE */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-600" />
                              سجل طلاب الحلقة ومعلوماتهم الأساسية والخطة الشهرية ({circleStudents.length})
                            </h4>
                            <button
                              type="button"
                              onClick={() => setStudentsModalCircleId(circle.id)}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                            >
                              <Users className="w-3.5 h-3.5" />
                              فتح القائمة التفصيلية للطلاب
                            </button>
                          </div>

                          {circleStudents.length === 0 ? (
                            <p className="text-xs text-slate-500 py-3 text-center">لا توجد بيانات طلاب مسجلة لهذه الحلقة حالياً.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-bold">
                                  <tr>
                                    <th className="p-2.5">اسم الطالب</th>
                                    <th className="p-2.5">الصف الدراسي</th>
                                    <th className="p-2.5 text-center">مقدار الحفظ</th>
                                    <th className="p-2.5 text-center">المعدل الشهري</th>
                                    <th className="p-2.5 text-center">إنجاز الخطة الشهرية</th>
                                    <th className="p-2.5">الخطة الشهرية</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {circleStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50 font-medium">
                                      <td className="p-2.5">
                                        <div className="font-bold text-slate-900">{student.name}</div>
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                          student.status === 'exceeding' ? 'bg-emerald-100 text-emerald-800' :
                                          student.status === 'committed' ? 'bg-indigo-100 text-indigo-800' :
                                          'bg-rose-100 text-rose-800'
                                        }`}>
                                          {student.status === 'exceeding' ? '★ متفوق' : student.status === 'committed' ? '✓ منتظم' : '⚠️ متعثر'}
                                        </span>
                                      </td>
                                      <td className="p-2.5 font-bold text-slate-700">
                                        {student.grade || 'الصف الخامس الابتدائي'}
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-indigo-900">
                                        {student.memorizedPages} صفحة
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                                        {student.monthlyAveragePages} ص/شهر
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                                        {student.planComplianceRate || student.attendanceRate}%
                                      </td>
                                      <td className="p-2.5 text-slate-800 text-[11px]">
                                        <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 block">
                                          {student.monthlyPlan || 'حفظ المقرر المعتمد + مراجعة أجزاء القرآن'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* ACTIVE RECOMMENDATIONS FOR THIS CIRCLE */}
                        {openRecs.length > 0 && (
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                            <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              التوصيات والخطط الإجرائية النشطة بالحلقة ({openRecs.length})
                            </h4>
                            <ul className="space-y-1.5 divide-y divide-amber-100 text-xs">
                              {openRecs.map((rec, i) => (
                                <li key={i} className="pt-1.5 flex items-center justify-between font-medium">
                                  <span className="text-slate-800 font-bold">• {rec.text}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded font-bold">
                                      تاريخ الإنجاز: {rec.dueDate}
                                    </span>
                                    <span className="text-[10px] text-slate-600">المكلف: {rec.assignedTo === 'teacher' ? 'المعلم' : 'الموجه'}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      {(!isSupervisor || activeSupervisorTab === 'visits') && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالحلقة، المدرس، الموجه، أو رقم الزيارة..."
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-bold">
                <select
                  value={selectedCircleFilter}
                  onChange={(e) => setSelectedCircleFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل الحلقات</option>
                  {mockCircles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل الحالات</option>
                  <option value="approved">معتمدة</option>
                  <option value="pending_approval">قيد الاعتماد</option>
                  <option value="draft">مسودة</option>
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل أنواع الزيارات</option>
                  <option value="periodic">دورية</option>
                  <option value="followup">متابعة</option>
                  <option value="therapeutic">علاجية</option>
                  <option value="surprise">مفاجئة</option>
                  <option value="comprehensive">تقييم شامل</option>
                </select>

                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل مستويات التقييم</option>
                  <option value="excellent">ممتاز (90%+)</option>
                  <option value="very_good">جيد جداً (80-89%)</option>
                  <option value="good">جيد (70-79%)</option>
                  <option value="needs_improvement">يحتاج تحسين (60-69%)</option>
                  <option value="needs_intervention">يحتاج تدخل (&lt;60%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN VISITS TABLE & LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                سجلات الزيارات الميدانية والتقييم ({filteredVisits.length})
              </h2>
              <span className="text-[10px] text-slate-500 font-bold">
                انقر على أي زيارة لاستعراض الملف الميداني والتفاصيل كاملة
              </span>
            </div>

            {filteredVisits.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">لا توجد زيارات ميدانية تطابق معايير البحث الحالية</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  تأكد من إزالة الفلاتر المحددة أو قم بإنشاء زيارة ميدانية جديدة من الأزرار العلوية.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">رقم الزيارة</th>
                      <th className="p-3">الحلقة القرآنية</th>
                      <th className="p-3">مدرس الحلقة</th>
                      <th className="p-3">الموجه الفني</th>
                      <th className="p-3">التاريخ والنوع</th>
                      <th className="p-3 text-center">الدرجة والمستوى</th>
                      <th className="p-3 text-center">التوصيات والإنجاز</th>
                      <th className="p-3 text-center">الحالة والتصنيف</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredVisits.map((visit) => {
                      const levelCfg = DEFAULT_EVALUATION_LEVELS.find(l => l.level === visit.level) || DEFAULT_EVALUATION_LEVELS[0];
                      const completedRecs = visit.recommendations.filter(r => r.status === 'completed').length;
                      const totalRecs = visit.recommendations.length;
                      const recPercentage = totalRecs > 0 ? Math.round((completedRecs / totalRecs) * 100) : 100;

                      return (
                        <tr 
                          key={visit.id} 
                          className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                          onClick={() => setSelectedVisitId(visit.id)}
                        >
                          <td className="p-3 font-mono font-bold text-indigo-900 group-hover:underline">
                            {visit.visitNumber}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 text-xs">{visit.circleName}</div>
                            <span className="text-[10px] text-slate-500">حلقة مجمعة بالمسجد</span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{visit.teacherName}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-700 font-bold">{visit.supervisorName}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{visit.visitDate}</div>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              {visit.visitType === 'periodic' ? 'دورية' :
                               visit.visitType === 'followup' ? 'متابعة' :
                               visit.visitType === 'therapeutic' ? 'علاجية' :
                               visit.visitType === 'surprise' ? 'مفاجئة' : 'تقييم شامل'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-black text-sm text-slate-900 font-mono">{visit.totalScore}%</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${levelCfg.badgeBg}`}>
                                {levelCfg.label}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold text-xs text-slate-800">
                                {completedRecs} / {totalRecs} تم تنفيذها
                              </span>
                              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full ${recPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                  style={{ width: `${recPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                              visit.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              visit.status === 'pending_approval' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {visit.status === 'approved' ? '✓ معتمدة' :
                               visit.status === 'pending_approval' ? '● قيد الاعتماد' : 'مسودة'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedVisitId(visit.id); }}
                                className="w-full px-2.5 py-1 bg-slate-900 hover:bg-indigo-900 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>فتح التقرير</span>
                              </button>

                              {(isSupervisor || isGeneralManager || isExecutive) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFillVisitRecord(JSON.parse(JSON.stringify(visit)));
                                    setShowFillModal(true);
                                  }}
                                  className="w-full px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>تعبئة وتعديل</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* PRE-VISIT CIRCLE PROFILE DRAWER / MODAL */}
      {selectedCircleProfileId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-black text-lg text-slate-900">ملف الحلقة قبل الزيارة الميدانية</h3>
                  <p className="text-xs text-slate-500 font-bold">مراجعة تلقائية مستخرجة مباشرة من مؤشرات وسجلات النظام الفعليه</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedCircleProfileId(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circle Live Data Content */}
            {(() => {
              const circle = mockCircles.find(c => c.id === selectedCircleProfileId) || mockCircles[0];
              const teacher = mockTeachers.find(t => t.id === circle.teacherId) || { name: circle.teacherName };
              const circleStudents = mockStudents.filter(s => s.circleId === circle.id);
              const lagging = circleStudents.filter(s => s.status === 'lagging');
              const exceeding = circleStudents.filter(s => s.status === 'exceeding');

              return (
                <div className="space-y-6 text-xs font-semibold">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">اسم الحلقة:</span>
                      <strong className="text-slate-900 text-sm font-black">{circle.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">المدرس:</span>
                      <strong className="text-slate-800 text-xs font-bold">{teacher.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">عدد الطلاب:</span>
                      <strong className="text-indigo-900 text-xs font-bold">{circle.studentsCount} طلاب</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">آخر تقييم موجه:</span>
                      <strong className="text-emerald-700 text-xs font-bold">{circle.supervisorRating}%</strong>
                    </div>
                  </div>

                  {/* Indicators provenance grid */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      مؤشرات النظام الآلية وقوانين المصدر
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">معدل الحضور والغياب:</span>
                        <div className="font-black text-sm text-slate-900 mt-0.5">{circle.attendanceRate}%</div>
                        <span className="text-[9px] text-emerald-700 font-bold block mt-1">المصدر: سجل الحضور الإلكتروني</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">نسبة التزام الخطة الحفظ:</span>
                        <div className="font-black text-sm text-slate-900 mt-0.5">{circle.planComplianceRate}%</div>
                        <span className="text-[9px] text-emerald-700 font-bold block mt-1">المصدر: سجلات الحفظ المقررة</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">متوسط درجة الاختبارات:</span>
                        <div className="font-black text-sm text-slate-900 mt-0.5">{circle.avgTestScore}%</div>
                        <span className="text-[9px] text-emerald-700 font-bold block mt-1">المصدر: نظام الدرجات والامتحانات</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">الأنشطة والأوسمة المكتسبة:</span>
                        <div className="font-black text-sm text-slate-900 mt-0.5">{circle.activitiesCount} أنشطة</div>
                        <span className="text-[9px] text-emerald-700 font-bold block mt-1">المصدر: نظام الأنشطة والجوائز</span>
                      </div>
                    </div>
                  </div>

                  {/* Struggling & Exceeding lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2">
                      <h5 className="font-bold text-rose-900 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        الطلاب المتعثرون ({lagging.length})
                      </h5>
                      {lagging.length === 0 ? (
                        <p className="text-[10px] text-rose-700">لا يوجد طلاب متعثرون حالياً بالحلقة.</p>
                      ) : (
                        <ul className="space-y-1 divide-y divide-rose-100">
                          {lagging.map(s => (
                            <li key={s.id} className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{s.name}</span>
                              <span className="text-rose-700 font-mono font-bold">اختبار: {s.testScore}%</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                      <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        الطلاب المتميزون والمتفوقون ({exceeding.length})
                      </h5>
                      {exceeding.length === 0 ? (
                        <p className="text-[10px] text-emerald-700">جميع الطلاب بمستوى متوازن.</p>
                      ) : (
                        <ul className="space-y-1 divide-y divide-emerald-100">
                          {exceeding.map(s => (
                            <li key={s.id} className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{s.name}</span>
                              <span className="text-emerald-700 font-mono font-bold">اختبار: {s.testScore}%</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedCircleProfileId(null)}
                      className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      إغلاق ملف الحلقة
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FULL VISIT DETAIL & EDIT MODAL / VIEW */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl my-auto rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6 max-h-[92vh] overflow-y-auto text-right">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                    {selectedVisit.visitNumber}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    selectedVisit.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {selectedVisit.status === 'approved' ? '✓ معتمدة' : '● قيد المراجعة / مسودة'}
                  </span>
                </div>
                <h3 className="font-black text-xl text-slate-900 mt-1">
                  تقرير الزيارة الميدانية — {selectedVisit.circleName}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  المدرس المعني: {selectedVisit.teacherName} — الموجه: {selectedVisit.supervisorName} ({selectedVisit.visitDate})
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(isSupervisor || isGeneralManager || isExecutive) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFillVisitRecord(JSON.parse(JSON.stringify(selectedVisit)));
                      setShowFillModal(true);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-emerald-400/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل وتعبئة التقييم</span>
                  </button>
                )}

                {/* Print Options */}
                <button
                  type="button"
                  onClick={() => handlePrintReport(selectedVisit, isTeacher ? 'teacher' : isExecutive ? 'executive' : 'supervisor')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  <span>طباعة / PDF</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setSelectedVisitId(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* PREVIOUS VISIT FOLLOW-UP SNAPSHOT */}
            {selectedVisit.previousVisitFollowup && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-600" />
                    متابعة نتائج وتوصيات الزيارة الميدانية السابقة
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded">
                    {selectedVisit.previousVisitFollowup.werePreviousRecommendationsResolved === 'fully' ? '✓ تمت المعالجة الكلية' :
                     selectedVisit.previousVisitFollowup.werePreviousRecommendationsResolved === 'partially' ? '⚠️ معالجة جزئية' :
                     '❌ لم تتعالج التوصيات السابقة'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {selectedVisit.previousVisitFollowup.notes}
                </p>
              </div>
            )}

            {/* SYSTEM PROVENANCE COMPARISON & DISCREPANCY */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                  مقارنة التقييم الميداني ببيانات النظام الآلية (Data Audit Lineage)
                </span>
                <span className="text-xs font-bold text-slate-300">
                  قوة الأدلة المرفقة: <b className="text-emerald-400 font-mono">{selectedVisit.evidenceConfidence === 'high' ? 'عالية (90%+)' : 'متوسطة'}</b>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-1">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] block">درجة الموجه الميداني:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{selectedVisit.totalScore}%</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] block">حضور نظام الحضور:</span>
                  <span className="text-lg font-black text-blue-400 font-mono">{selectedVisit.systemDataSnapshot?.attendanceRate ?? 0}%</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] block">التزام سجلات الحفظ:</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{selectedVisit.systemDataSnapshot?.hifzRate ?? 0}%</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] block">معدل درجات الامتحانات:</span>
                  <span className="text-lg font-black text-indigo-400 font-mono">{selectedVisit.systemDataSnapshot?.examAvgScore ?? 0}%</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] block">الطلاب المتعثرون:</span>
                  <span className="text-lg font-black text-rose-400 font-mono">{selectedVisit.systemDataSnapshot?.laggingStudentsCount ?? 0} طالب</span>
                </div>
              </div>

              {selectedVisit.discrepancyAlert?.hasDiscrepancy && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>تنبيه تدقيق: {selectedVisit.discrepancyAlert.message}</span>
                </div>
              )}
            </div>

            {/* EVALUATION AXES BREAKDOWN */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                تقييم المحاور الرئيسية والدرجات (الوزن الكلي 100%)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(selectedVisit.axes || []).map((axis) => (
                  <div key={axis.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{axis.name}</h5>
                        <span className="text-[10px] text-slate-500 font-medium">وزن المحور: %{axis.weight}</span>
                      </div>
                      <div className="text-left font-mono font-black text-sm text-indigo-900">
                        {axis.score} / 100
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{axis.notes}</p>

                    {axis.strengths && axis.strengths.length > 0 && (
                      <div className="text-[10px] text-emerald-800 font-bold">
                        <b>نقاط القوة:</b> {axis.strengths.join(' ، ')}
                      </div>
                    )}

                    {axis.improvements && axis.improvements.length > 0 && (
                      <div className="text-[10px] text-amber-800 font-bold">
                        <b>جوانب التحسين:</b> {axis.improvements.join(' ، ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORIZED NOTES & VISIBILITY */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                الملاحظات الميدانية وتصنيفات ظهورها
              </h4>

              <div className="space-y-2">
                {(selectedVisit.notes || [])
                  .filter(n => {
                    if (isTeacher) return n.visibility === 'shared_with_teacher';
                    if (isSupervisor || isExecutive || isGeneralManager) return true;
                    return false;
                  })
                  .map(note => (
                    <div key={note.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">{note.text}</p>
                        <span className="text-[10px] text-slate-400 font-bold">المحرر: {note.authorName} ({note.authorRole})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                        note.visibility === 'shared_with_teacher' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        note.visibility === 'admin_only' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {note.visibility === 'shared_with_teacher' ? 'مشاركة مع المدرس' :
                         note.visibility === 'admin_only' ? 'إدارية فقط' : 'سرية للإدارة المخولة'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* RECOMMENDATIONS & IMPROVEMENT PLAN */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  التوصيات وخطة التحسين الميداني ({(selectedVisit.recommendations || []).length})
                </h4>
                <span className="text-xs font-mono font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                  نسبة إنجاز الخطة: {selectedVisit.improvementPlan?.currentCompletionRate ?? 0}%
                </span>
              </div>

              <div className="space-y-2.5">
                {(selectedVisit.recommendations || []).map(rec => (
                  <div key={rec.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{rec.title}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                            {rec.domain}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          المسؤول: <b>{rec.assignedToName}</b> — الموعد النهائي: <b>{rec.dueDate}</b>
                        </p>
                      </div>

                      {/* Status badge or teacher task control */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                          rec.status === 'completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          rec.status === 'in_progress' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          rec.status === 'overdue' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {rec.status === 'completed' ? '✓ مكتملة' :
                           rec.status === 'in_progress' ? '● قيد التنفيذ' :
                           rec.status === 'overdue' ? '⚠️ متأخرة' : 'لم تبدأ'}
                        </span>

                        {/* Teacher task status change allowed */}
                        {isTeacher && rec.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleTeacherTaskStatusUpdate(selectedVisit.id, rec.id, 'completed', 'تم استكمال التوصية بالميدان وحسب التوجيه.')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            إكمال المهمة
                          </button>
                        )}
                      </div>
                    </div>

                    {rec.completionProofNote && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[10px]">
                        <b>إثبات وملاحظة التنفيذ:</b> {rec.completionProofNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TEACHER RESPONSE & APPEALS SECTION */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                تفاعل المدرس (الرد، طلب المراجعة والاعتراض، طلب التقرير الكامل)
              </h4>

              {/* Display existing response */}
              {selectedVisit.teacherResponse ? (
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-indigo-900 text-[11px] block">رد وملاحظات المدرس الحالية:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">{selectedVisit.teacherResponse.notes}</p>
                  <span className="text-[9px] text-indigo-700 block mt-1">تاريخ الرد: {selectedVisit.teacherResponse.submittedAt}</span>
                </div>
              ) : isTeacher ? (
                <TeacherResponseForm visitId={selectedVisit.id} onSubmit={handleTeacherResponseSubmit} />
              ) : null}

              {/* Teacher Appeals & Access Requests */}
              {isTeacher && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <TeacherAppealForm visitId={selectedVisit.id} onSubmit={handleTeacherAppealSubmit} />
                  <TeacherReportRequestForm visitId={selectedVisit.id} onSubmit={handleTeacherReportRequestSubmit} />
                </div>
              )}

              {/* Executive Manager Approve Teacher Report Requests */}
              {(isExecutive || isGeneralManager) && (selectedVisit.reportAccessRequests || []).length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <h5 className="font-bold text-amber-900">طلبات المدرس للاطلاع على التقرير الإداري الكامل:</h5>
                  {(selectedVisit.reportAccessRequests || []).map(req => (
                    <div key={req.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block">{req.teacherName}</span>
                        <p className="text-[10px] text-slate-500">السبب: {req.reason}</p>
                      </div>

                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExecutiveDecideReportRequest(selectedVisit.id, req.id, 'approved', 'تمت الموافقة من الإدارة التنفيذية')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExecutiveDecideReportRequest(selectedVisit.id, req.id, 'rejected', 'التقرير السري مخصص للإدارة')}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {req.status === 'approved' ? '✓ تم القبول' : '❌ تم الرفض'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AUDIT TRAIL LOG */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <h5 className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                سجل الاعتماد والتغييرات التدقيقي (Audit Trail)
              </h5>
              <div className="space-y-1">
                {(selectedVisit.auditTrail || []).map(aud => (
                  <div key={aud.id} className="text-[10px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span><b>{aud.authorName}</b> ({aud.authorRole}): {aud.action}</span>
                    <span className="font-mono text-[9px] text-slate-400">{aud.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Supervisor / Admin */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedVisitId(null)}
                className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
              >
                إغلاق التقرير
              </button>

              {isSupervisor && selectedVisit.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    handleApproveVisit(selectedVisit.id);
                    setSelectedVisitId(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>اعتماد التقرير الميداني رسمياً</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW VISIT MODAL */}
      {showNewVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-emerald-600" />
                إنشاء زيارة ميدانية جديدة
              </h3>
              <button 
                type="button" 
                onClick={() => setShowNewVisitModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">اختر الحلقة القرآنية المعنية:</label>
                <select
                  value={newVisitForm.circleId}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, circleId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {mockCircles.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — (المدرس: {c.teacherName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">تاريخ الزيارة:</label>
                  <input
                    type="date"
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">نوع الزيارة:</label>
                  <select
                    value={newVisitForm.visitType}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitType: e.target.value as VisitType })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="periodic">دورية</option>
                    <option value="followup">متابعة</option>
                    <option value="therapeutic">علاجية</option>
                    <option value="surprise">مفاجئة</option>
                    <option value="comprehensive">تقييم شامل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">وقت البداية:</label>
                  <input
                    type="time"
                    value={newVisitForm.startTime}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">وقت النهاية:</label>
                  <input
                    type="time"
                    value={newVisitForm.endTime}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">سبب الزيارة والهدف الرئيسي:</label>
                <input
                  type="text"
                  value={newVisitForm.reason}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, reason: e.target.value })}
                  placeholder="اكتب الهدف الرئيسي من الزيارة..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ملاحظات واسترشادات أولية:</label>
                <textarea
                  rows={2}
                  value={newVisitForm.initialNotes}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, initialNotes: e.target.value })}
                  placeholder="تدوين ملاحظات أولية قبل فتح المحاور..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none font-normal"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateNewVisit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                بدء وتعبئة الزيارة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AXES & CRITERIA WEIGHTS CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-auto rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-right max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  إدارة وتعديل أوزان معايير التقييم الميداني
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  تعديل أسماء المحاور المعيارية، أوزانها النسبية، وإضافة معايير جديدة للزيارات الميدانية
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification / Success Banner */}
            {configSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between">
                <span>{configSuccessMsg}</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            )}

            {/* Total Weight Status Indicator */}
            {(() => {
              const totalWeightSum = axesConfig.reduce((acc, a) => acc + (a.defaultWeight || 0), 0);
              const isBalanced = totalWeightSum === 100;

              return (
                <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold ${
                  isBalanced ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="block font-black text-sm">
                        إجمالي الأوزان الحالية: <span className="font-mono">{totalWeightSum}%</span>
                      </span>
                      <span className="text-[10px] opacity-80">
                        {isBalanced ? 'توزيع متوازن ومطابق لمعايير الجودة (100%)' : 'تنبيه: يجب أن يساوي مجموع الأوزان 100% لتطبيق نتائج دقيقة.'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleAutoBalanceWeights}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-[11px] font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="إعادة توزيع الأوزان بالتساوي على كافة المعايير"
                    >
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      <span>توزيع متساوي</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetDefaultAxes}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="استعادة المعايير الافتراضية"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>إعادة الضبط</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Toolbar to Add New Criterion */}
            <div className="flex items-center justify-between pt-1">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                قائمة المعايير والمحاور المعتمدة ({axesConfig.length}):
              </h4>

              <button
                type="button"
                onClick={() => setShowAddAxisForm(!showAddAxisForm)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold border border-emerald-400/30 flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة معيار جديد</span>
              </button>
            </div>

            {/* Form to Add New Criterion */}
            {showAddAxisForm && (
              <div className="p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl space-y-3 text-xs font-bold shadow-xs">
                <h5 className="text-indigo-900 font-black text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  إضافة معيار تقييم ميداني جديد:
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700 text-[11px]">اسم المعيار / المحور الجديد:</label>
                    <input
                      type="text"
                      value={newAxisName}
                      onChange={(e) => setNewAxisName(e.target.value)}
                      placeholder="مثال: استخدام الأساليب والتقنيات التفاعلية"
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 text-[11px]">الوزن النسبي (%):</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newAxisWeight}
                      onChange={(e) => setNewAxisWeight(parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 text-[11px]">وصف المعيار وآلية التقييم:</label>
                  <input
                    type="text"
                    value={newAxisDesc}
                    onChange={(e) => setNewAxisDesc(e.target.value)}
                    placeholder="شرح مختصر لكيفية تقييم هذا البند أثناء الزيارة الميدانية..."
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs font-normal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAxisForm(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={!newAxisName.trim()}
                    onClick={handleAddNewAxis}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    تأكيد وإضافة المعيار
                  </button>
                </div>
              </div>
            )}

            {/* Editable Criteria List */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {axesConfig.map((axis, idx) => (
                <div 
                  key={axis.id} 
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors space-y-2 text-xs font-bold"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center text-[11px] font-mono font-black shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={axis.name}
                        onChange={(e) => handleUpdateAxisField(idx, 'name', e.target.value)}
                        className="w-full sm:w-64 p-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs font-bold text-slate-900"
                        placeholder="اسم المعيار..."
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold">الوزن:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={axis.defaultWeight}
                          onChange={(e) => handleUpdateAxisField(idx, 'defaultWeight', e.target.value)}
                          className="w-14 p-0.5 border border-slate-200 rounded-lg text-center font-mono font-black text-xs text-indigo-900 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-500 text-xs">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAxis(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="حذف المعيار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pr-8">
                    <input
                      type="text"
                      value={axis.description}
                      onChange={(e) => handleUpdateAxisField(idx, 'description', e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-[11px] text-slate-600 font-normal"
                      placeholder="وصف المعيار وآلية قياسه..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold">
                * جميع التعديلات تُحفظ آلياً ويستند إليها الموجهون عند إنشاء الزيارات الميدانية.
              </span>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE VISIT FILLING & EDITING MODAL */}
      {showFillModal && fillVisitRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl my-auto rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6 max-h-[94vh] overflow-y-auto text-right font-sans">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    شاشة تعبئة وتقويم الزيارة الميدانية
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {fillVisitRecord.visitNumber}
                  </span>
                </div>
                <h3 className="font-black text-lg md:text-xl text-white">
                  تعبئة التقييم الميداني — {fillVisitRecord.circleName}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  المدرس: <b>{fillVisitRecord.teacherName}</b> | الموجه: <b>{fillVisitRecord.supervisorName}</b> | تاريخ الزيارة: <b>{fillVisitRecord.visitDate}</b>
                </p>
              </div>

              {/* Total Score & Auto Recalculate */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">الدرجة الكلية المحتسبة</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {fillVisitRecord.totalScore}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const circle = mockCircles.find(c => c.id === fillVisitRecord.circleId) || mockCircles[0];
                    const refreshedAxes = calculateSuggestedAxesForCircle(circle, axesConfig);
                    const newTotal = calculateTotalWeightedScore(refreshedAxes);
                    const newLevel = getEvaluationLevelFromScore(newTotal);
                    setFillVisitRecord({
                      ...fillVisitRecord,
                      axes: refreshedAxes,
                      totalScore: newTotal,
                      level: newLevel
                    });
                  }}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="إعادة احتساب المقترحات استناداً لأحدث مؤشرات النظام"
                >
                  <Calculator className="w-4 h-4 text-indigo-200" />
                  <span>تحديث المقترحات الآلية</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowFillModal(false); setFillVisitRecord(null); }}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LIVE SYSTEM DATA SNAPSHOT BAR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <Zap className="w-4 h-4 text-amber-500" />
                  مؤشرات النظام الحالية التي يتم عليها الاقتراح التلقائي (قابلة للعديل والتغيير الكامل):
                </span>
                <span className="text-[11px] text-slate-500 font-normal">المصدر: سجلات وتطبيقات الحلقات الحية</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">الحضور والغياب</span>
                  <span className="text-sm font-black text-blue-600 font-mono">{fillVisitRecord.systemDataSnapshot?.attendanceRate ?? 90}%</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">إنجاز الخطة</span>
                  <span className="text-sm font-black text-indigo-600 font-mono">{fillVisitRecord.systemDataSnapshot?.hifzRate ?? 88}%</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">متوسط الاختبارات</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">{fillVisitRecord.systemDataSnapshot?.examAvgScore ?? 89}%</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">نسبة المراجعة</span>
                  <span className="text-sm font-black text-amber-600 font-mono">{fillVisitRecord.systemDataSnapshot?.revisionRate ?? 85}%</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">الطلاب المتعثرون</span>
                  <span className="text-sm font-black text-rose-600 font-mono">{fillVisitRecord.systemDataSnapshot?.laggingStudentsCount ?? 0} طالب</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold">الزيارة السابقة</span>
                  <span className="text-sm font-black text-slate-700 font-mono">{fillVisitRecord.systemDataSnapshot?.previousVisitScore ?? 88}%</span>
                </div>
              </div>
            </div>

            {/* EVALUATION AXES FORM (PER-AXIS SCORES & NOTES) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  بنود ومحاور التقييم الميداني ({fillVisitRecord.axes.length} بنود)
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  يمكنك تعديل الدرجة، تدوين ملاحظة البند، وإضافة نقاط القوة والتحسين لكل محور
                </span>
              </div>

              <div className="space-y-4">
                {fillVisitRecord.axes.map((axis, axisIdx) => (
                  <div key={axis.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                    
                    {/* Axis Title & Weight */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{axis.name}</span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-lg border border-indigo-200">
                            الوزن: {axis.weight}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{axis.description}</p>
                      </div>

                      {/* Score Input & Quick Adjustment */}
                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-600">الدرجة:</span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newAxes = [...fillVisitRecord.axes];
                            newAxes[axisIdx].score = Math.max(0, newAxes[axisIdx].score - 5);
                            const newTotal = calculateTotalWeightedScore(newAxes);
                            setFillVisitRecord({ ...fillVisitRecord, axes: newAxes, totalScore: newTotal, level: getEvaluationLevelFromScore(newTotal) });
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs"
                        >
                          -5
                        </button>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={axis.score}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const clamped = Math.min(100, Math.max(0, val));
                            const newAxes = [...fillVisitRecord.axes];
                            newAxes[axisIdx].score = clamped;
                            const newTotal = calculateTotalWeightedScore(newAxes);
                            setFillVisitRecord({ ...fillVisitRecord, axes: newAxes, totalScore: newTotal, level: getEvaluationLevelFromScore(newTotal) });
                          }}
                          className="w-16 p-1.5 text-center font-mono font-black text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg text-sm focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const newAxes = [...fillVisitRecord.axes];
                            newAxes[axisIdx].score = Math.min(100, newAxes[axisIdx].score + 5);
                            const newTotal = calculateTotalWeightedScore(newAxes);
                            setFillVisitRecord({ ...fillVisitRecord, axes: newAxes, totalScore: newTotal, level: getEvaluationLevelFromScore(newTotal) });
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs"
                        >
                          +5
                        </button>

                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </div>
                    </div>

                    {/* Notes Textarea for this Axis */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ملاحظات وتوجيهات هذا المحور (تلقائية بحسب بيانات النظام ويمكنك تعديلها بحرية):
                      </label>
                      <textarea
                        rows={2}
                        value={axis.notes}
                        onChange={(e) => {
                          const newAxes = [...fillVisitRecord.axes];
                          newAxes[axisIdx].notes = e.target.value;
                          setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                        }}
                        placeholder="تدوين ملاحظات وتوجيهات الموجه الفني لتقييم هذا المحور..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    {/* Strengths & Improvements Tag Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                      {/* Strengths */}
                      <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                        <span className="text-emerald-900 font-bold block text-[11px]">نقاط القوة الملموسة لهذا البند:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(axis.strengths || []).map((st, sIdx) => (
                            <span key={sIdx} className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                              {st}
                              <button
                                type="button"
                                onClick={() => {
                                  const newAxes = [...fillVisitRecord.axes];
                                  newAxes[axisIdx].strengths = newAxes[axisIdx].strengths.filter((_, idx) => idx !== sIdx);
                                  setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                }}
                                className="hover:text-rose-600 cursor-pointer"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <input
                            type="text"
                            placeholder="+ إضافة نقطة قوة..."
                            value={axisTagInputs[axis.id]?.strength || ''}
                            onChange={(e) => {
                              setAxisTagInputs({
                                ...axisTagInputs,
                                [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), strength: e.target.value }
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (axisTagInputs[axis.id]?.strength || '').trim();
                                if (val) {
                                  const newAxes = [...fillVisitRecord.axes];
                                  newAxes[axisIdx].strengths = [...(newAxes[axisIdx].strengths || []), val];
                                  setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                  setAxisTagInputs({
                                    ...axisTagInputs,
                                    [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), strength: '' }
                                  });
                                }
                              }
                            }}
                            className="flex-1 p-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-normal focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = (axisTagInputs[axis.id]?.strength || '').trim();
                              if (val) {
                                const newAxes = [...fillVisitRecord.axes];
                                newAxes[axisIdx].strengths = [...(newAxes[axisIdx].strengths || []), val];
                                setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                setAxisTagInputs({
                                  ...axisTagInputs,
                                  [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), strength: '' }
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            إضافة
                          </button>
                        </div>
                      </div>

                      {/* Improvements */}
                      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                        <span className="text-amber-900 font-bold block text-[11px]">جوانب التحسين المطلوبة لهذا البند:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(axis.improvements || []).map((imp, iIdx) => (
                            <span key={iIdx} className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                              {imp}
                              <button
                                type="button"
                                onClick={() => {
                                  const newAxes = [...fillVisitRecord.axes];
                                  newAxes[axisIdx].improvements = newAxes[axisIdx].improvements.filter((_, idx) => idx !== iIdx);
                                  setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                }}
                                className="hover:text-rose-600 cursor-pointer"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <input
                            type="text"
                            placeholder="+ إضافة جانب تحسين..."
                            value={axisTagInputs[axis.id]?.improvement || ''}
                            onChange={(e) => {
                              setAxisTagInputs({
                                ...axisTagInputs,
                                [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), improvement: e.target.value }
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (axisTagInputs[axis.id]?.improvement || '').trim();
                                if (val) {
                                  const newAxes = [...fillVisitRecord.axes];
                                  newAxes[axisIdx].improvements = [...(newAxes[axisIdx].improvements || []), val];
                                  setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                  setAxisTagInputs({
                                    ...axisTagInputs,
                                    [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), improvement: '' }
                                  });
                                }
                              }
                            }}
                            className="flex-1 p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-normal focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = (axisTagInputs[axis.id]?.improvement || '').trim();
                              if (val) {
                                const newAxes = [...fillVisitRecord.axes];
                                newAxes[axisIdx].improvements = [...(newAxes[axisIdx].improvements || []), val];
                                setFillVisitRecord({ ...fillVisitRecord, axes: newAxes });
                                setAxisTagInputs({
                                  ...axisTagInputs,
                                  [axis.id]: { ...(axisTagInputs[axis.id] || { strength: '', improvement: '' }), improvement: '' }
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                          >
                            إضافة
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMMENDATIONS & IMPROVEMENT PLAN FORM */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  التوصيات والمهام الميدانية الموجهة ({fillVisitRecord.recommendations.length})
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  إضافة توصيات وخطوات إجرائية لتكليف المدرس أو الإدارة بمتابعتها
                </span>
              </div>

              {/* Recommendation Items */}
              <div className="space-y-2">
                {fillVisitRecord.recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rec.title}</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">{rec.domain}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                          rec.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          أولوية: {rec.priority === 'urgent' ? 'عاجلة' : rec.priority === 'high' ? 'مرتفعة' : 'متوسطة'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        المكلف بالمتابعة: <b>{rec.assignedToName}</b> ({rec.assignedToRole === 'teacher' ? 'مدرس الحلقة' : 'الموجه'}) | تاريخ الإنجاز المطلوب: <b>{rec.dueDate}</b>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updatedRecs = fillVisitRecord.recommendations.filter(r => r.id !== rec.id);
                        setFillVisitRecord({
                          ...fillVisitRecord,
                          recommendations: updatedRecs,
                          improvementPlan: { ...fillVisitRecord.improvementPlan, recommendations: updatedRecs }
                        });
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-start sm:self-center"
                      title="حذف التوصية"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Recommendation Form */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2 text-xs font-bold">
                <span className="text-indigo-900 block text-[11px]">+ إضافة توصية أو مهمة إجرائية جديدة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="عنوان التوصية أو الخطة الميدانية..."
                    value={fillRecTitle}
                    onChange={(e) => setFillRecTitle(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 sm:col-span-2"
                  />
                  <select
                    value={fillRecDomain}
                    onChange={(e) => setFillRecDomain(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="الجانب التعليمي">الجانب التعليمي</option>
                    <option value="إدارة السجلات">إدارة السجلات</option>
                    <option value="المتابعة والتحفيز">المتابعة والتحفيز</option>
                    <option value="جودة التلاوة والتجويد">جودة التلاوة والتجويد</option>
                  </select>

                  <select
                    value={fillRecPriority}
                    onChange={(e) => setFillRecPriority(e.target.value as RecommendationPriority)}
                    className="p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="low">أولوية عادية</option>
                    <option value="medium">أولوية متوسطة</option>
                    <option value="high">أولوية مرتفعة</option>
                    <option value="urgent">أولوية عاجلة جداً</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[11px] text-slate-600">المكلف بالمهام:</span>
                    <select
                      value={fillRecAssignedRole}
                      onChange={(e) => setFillRecAssignedRole(e.target.value as any)}
                      className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="teacher">مدرس الحلقة ({fillVisitRecord.teacherName})</option>
                      <option value="supervisor">الموجه الفني ({fillVisitRecord.supervisorName})</option>
                      <option value="management">الإدارة التنفيذية</option>
                    </select>

                    <span className="text-[11px] text-slate-600 mr-2">تاريخ الاستحقاق:</span>
                    <input
                      type="date"
                      value={fillRecDueDate}
                      onChange={(e) => setFillRecDueDate(e.target.value)}
                      className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!fillRecTitle.trim()) return;
                      const newRec: Recommendation = {
                        id: `rec-${Date.now()}`,
                        title: fillRecTitle.trim(),
                        domain: fillRecDomain,
                        assignedToRole: fillRecAssignedRole,
                        assignedToName: fillRecAssignedRole === 'teacher' ? fillVisitRecord.teacherName : fillRecAssignedRole === 'supervisor' ? fillVisitRecord.supervisorName : 'الإدارة التنفيذية',
                        startDate: fillVisitRecord.visitDate,
                        dueDate: fillRecDueDate,
                        priority: fillRecPriority,
                        status: 'in_progress',
                        notes: 'توصية ميدانية مضافة أثناء التقييم'
                      };
                      const updatedRecs = [...fillVisitRecord.recommendations, newRec];
                      setFillVisitRecord({
                        ...fillVisitRecord,
                        recommendations: updatedRecs,
                        improvementPlan: { ...fillVisitRecord.improvementPlan, recommendations: updatedRecs }
                      });
                      setFillRecTitle('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    + إضافة التوصية
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER BUTTONS */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>حالة التقرير الحالية:</span>
                <span className="font-mono text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {fillVisitRecord.status === 'approved' ? 'معتمد رسمياً' : 'مسودة قيد التعبئة'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => { setShowFillModal(false); setFillVisitRecord(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء التغييرات
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updatedRecord = { ...fillVisitRecord, status: 'draft' as VisitStatus, updatedAt: new Date().toISOString().split('T')[0] };
                    const updatedList = visits.map(v => v.id === updatedRecord.id ? updatedRecord : v);
                    if (!visits.some(v => v.id === updatedRecord.id)) updatedList.unshift(updatedRecord);
                    updateAndSaveVisits(updatedList);
                    setShowFillModal(false);
                    setFillVisitRecord(null);
                    setSelectedVisitId(updatedRecord.id);
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-300" />
                  <span>حفظ كمسودة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const auditEntry = {
                      id: `aud-${Date.now()}`,
                      authorName: currentUser?.name || 'الموجه الفني',
                      authorRole: currentUser?.roleName || 'الموجه الفني',
                      action: 'إكمال وتعبئة التقييم الميداني واعتمد التقرير رسمياً',
                      timestamp: new Date().toLocaleString('ar-SA')
                    };
                    const updatedRecord = {
                      ...fillVisitRecord,
                      status: 'approved' as VisitStatus,
                      auditTrail: [...(fillVisitRecord.auditTrail || []), auditEntry],
                      updatedAt: new Date().toISOString().split('T')[0]
                    };
                    const updatedList = visits.map(v => v.id === updatedRecord.id ? updatedRecord : v);
                    if (!visits.some(v => v.id === updatedRecord.id)) updatedList.unshift(updatedRecord);
                    updateAndSaveVisits(updatedList);
                    setShowFillModal(false);
                    setFillVisitRecord(null);
                    setSelectedVisitId(updatedRecord.id);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/30"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد واعتماد التقرير الميداني رسمياً</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CIRCLE STUDENTS DETAILS MODAL */}
      {studentsModalCircleId && (() => {
        const targetCircle = mockCircles.find(c => c.id === studentsModalCircleId);
        if (!targetCircle) return null;
        const targetStudents = mockStudents.filter(s => s.circleId === targetCircle.id);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-indigo-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-800/60 rounded-2xl flex items-center justify-center border border-indigo-700 shadow-inner">
                    <Users className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-800/80 text-indigo-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border border-indigo-700">
                        {targetCircle.id.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-black text-white">{targetCircle.name}</h3>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {targetCircle.priorityLabel}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200/80 font-bold mt-1">
                      المدرس: <strong className="text-white">{targetCircle.teacherName}</strong> • عدد الطلاب: <strong className="text-white">{targetStudents.length} طلاب مسجلين</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStudentsModalCircleId(null)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold block text-[11px]">إجمالي الطلاب المسجلين</span>
                    <strong className="text-xl font-black text-slate-900 font-mono mt-1 block">{targetStudents.length} طلاب</strong>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-emerald-800 font-bold block text-[11px]">المتماشيون مع الخطة</span>
                    <strong className="text-xl font-black text-emerald-800 font-mono mt-1 block">
                      {targetStudents.filter(s => s.status !== 'lagging').length} طلاب
                    </strong>
                  </div>
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-indigo-800 font-bold block text-[11px]">إنجاز الخطة الشهرية للحلقة</span>
                    <strong className="text-xl font-black text-indigo-900 font-mono mt-1 block">
                      {targetCircle.planComplianceRate}%
                    </strong>
                  </div>
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-amber-800 font-bold block text-[11px]">إجمالي صفحات الحفظ للحلقة</span>
                    <strong className="text-xl font-black text-amber-900 font-mono mt-1 block">
                      {targetCircle.memorizationPages} صفحة
                    </strong>
                  </div>
                </div>

                {/* Detailed Students Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      استعراض قائمة الطلاب والمعلومات الأساسية والخطة الشهرية
                    </h4>
                    <span className="text-xs text-slate-500 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">
                      إجمالي المقيدين: {targetStudents.length}
                    </span>
                  </div>

                  {targetStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center font-bold">لا يوجد طلاب مسجلون في هذه الحلقة حالياً.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">اسم الطالب</th>
                            <th className="p-3">الصف الدراسي</th>
                            <th className="p-3 text-center">مقدار الحفظ</th>
                            <th className="p-3 text-center">المعدل الشهري</th>
                            <th className="p-3 text-center">إنجاز الخطة الشهرية (%)</th>
                            <th className="p-3">تفاصيل الخطة الشهرية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {targetStudents.map(student => (
                            <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-900 text-xs">{student.name}</div>
                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                                  student.status === 'exceeding' ? 'bg-emerald-100 text-emerald-800' :
                                  student.status === 'committed' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {student.status === 'exceeding' ? '★ متفوق ومتميز' : student.status === 'committed' ? '✓ منتظم بالخطة' : '⚠️ متعثر بالخطة'}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-800">
                                {student.grade || 'الصف الخامس الابتدائي'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-indigo-900 text-xs">
                                {student.memorizedPages} صفحة
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800 text-xs">
                                {student.monthlyAveragePages} ص / شهرياً
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono font-black text-emerald-700 text-xs">
                                    {student.planComplianceRate || student.attendanceRate}%
                                  </span>
                                  <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full" 
                                      style={{ width: `${student.planComplianceRate || student.attendanceRate}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-800 font-medium leading-relaxed">
                                  {student.monthlyPlan || 'حفظ المقرر المعتمد + مراجعة أجزاء القرآن'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">
                  مركز الهدى القرآني — نافذة الموجه الفني لاستعراض الطلاب
                </span>
                <button
                  type="button"
                  onClick={() => setStudentsModalCircleId(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

// Subcomponents for Teacher Responses
function TeacherResponseForm({ visitId, onSubmit }: { visitId: string; onSubmit: (visitId: string, text: string) => void }) {
  const [text, setText] = useState('');

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
      <label className="block font-bold text-slate-800">إضافة رد المدرس على التقرير والزيارة الميدانية:</label>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب انطباعك أو توضيحاتك حول نقاط التقرير..."
        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white text-xs resize-none"
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => {
          onSubmit(visitId, text);
          setText('');
        }}
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] disabled:opacity-50 cursor-pointer"
      >
        إرسال رد المدرس
      </button>
    </div>
  );
}

function TeacherAppealForm({ visitId, onSubmit }: { visitId: string; onSubmit: (visitId: string, data: any) => void }) {
  const [item, setItem] = useState('الجانب التعليمي');
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold">
        ✓ تم تقديم طلب مراجعة والاعتراض على البند للإدارة والموجه بنجاح.
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
      <h5 className="font-bold text-amber-900">طلب مراجعة التقييم (اعتراض):</h5>
      <select
        value={item}
        onChange={(e) => setItem(e.target.value)}
        className="w-full p-2 border border-amber-200 rounded-xl bg-white font-bold text-[11px]"
      >
        <option value="الجانب التعليمي">الجانب التعليمي</option>
        <option value="الجانب التربوي">الجانب التربوي</option>
        <option value="أداء الطلاب ونتائجهم">أداء الطلاب ونتائجهم</option>
        <option value="الإدارة والتنظيم">الإدارة والتنظيم</option>
      </select>
      <input
        type="text"
        placeholder="سبب الاعتراض..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full p-2 border border-amber-200 rounded-xl bg-white text-[11px]"
      />
      <textarea
        rows={2}
        placeholder="التوضيح التفصيلي..."
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="w-full p-2 border border-amber-200 rounded-xl bg-white text-[11px] resize-none"
      />
      <button
        type="button"
        disabled={!reason.trim()}
        onClick={() => {
          onSubmit(visitId, { axisOrItem: item, reason, explanation });
          setSubmitted(true);
        }}
        className="px-3 py-1.5 bg-amber-800 text-white rounded-xl font-bold text-[10px] hover:bg-amber-900 disabled:opacity-50 cursor-pointer"
      >
        رفع طلب مراجعة البند
      </button>
    </div>
  );
}

function TeacherReportRequestForm({ visitId, onSubmit }: { visitId: string; onSubmit: (visitId: string, reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs font-bold">
        ✓ تم رفع طلب رسميا للإدارة للحصول على التقرير الإداري الكامل.
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
      <h5 className="font-bold text-blue-900">طلب التقرير الإداري الكامل:</h5>
      <p className="text-[10px] text-blue-800">التقرير الإداري يحتوي على مؤشرات سرية وتفصيلية تتطلب موافقة الإدارة.</p>
      <input
        type="text"
        placeholder="مبرر طلب الحصول على التقرير الكامل..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full p-2 border border-blue-200 rounded-xl bg-white text-[11px]"
      />
      <button
        type="button"
        disabled={!reason.trim()}
        onClick={() => {
          onSubmit(visitId, reason);
          setSubmitted(true);
        }}
        className="px-3 py-1.5 bg-blue-900 text-white rounded-xl font-bold text-[10px] hover:bg-blue-950 disabled:opacity-50 cursor-pointer"
      >
        إرسال طلب التقرير الكامل
      </button>
    </div>
  );
}
