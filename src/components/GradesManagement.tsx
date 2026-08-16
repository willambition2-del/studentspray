import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, FileText, CheckCircle, Save, Download, Plus, Search, Filter, 
  Settings, AlertCircle, Sparkles, Printer, Lock, Unlock, Users, ChevronDown, 
  Trash2, Edit3, Eye, RefreshCw, Check, X, ShieldCheck, History, BookOpen,
  PieChart, BarChart3, TrendingUp, TrendingDown, HelpCircle, Archive, FolderArchive,
  ArrowRight, UserX, AlertTriangle, FileCheck, Layers, ChevronLeft, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EvaluationPeriod, Exam, StudentGradeRecord, GradeAuditEntry, StudentExamStatus,
  getStoredPeriods, saveStoredPeriods, getStoredExams, saveStoredExams,
  getStoredAllGrades, saveStoredAllGrades, getStoredAuditLogs, saveStoredAuditLogs,
  syncGradesToStudents, DEFAULT_MASTER_STUDENTS
} from '../lib/gradesStorage';
import { getExams as apiGetExams, createExam as apiCreateExam, publishExam as apiPublishExam, bulkGradeExam as apiBulkGradeExam } from '../lib/api/exams';
import { Student, User } from '../types';

interface GradesManagementProps {
  currentUser: User | any;
  studentsList?: Student[];
  circlesList?: any[];
  onNavigateToPrint?: (doc: any) => void;
}

export default function GradesManagement({ 
  currentUser, 
  studentsList = [], 
  circlesList = [],
  onNavigateToPrint
}: GradesManagementProps) {
  
  // USER PERMISSIONS
  const userType = currentUser?.type || 'admin';
  const isGeneralDirector = userType === 'admin';
  const isExecutiveDirector = userType === 'branch_manager';
  const isSupervisor = userType === 'supervisor';
  const isTeacher = userType === 'teacher';

  const canManagePeriods = isGeneralDirector || isExecutiveDirector;
  const canSelectCircle = isGeneralDirector || isExecutiveDirector || isSupervisor;
  const canViewCrossComparison = isGeneralDirector || isExecutiveDirector || isSupervisor;
  const canInputGrades = isGeneralDirector || isExecutiveDirector;
  const canApprove = isGeneralDirector || isExecutiveDirector;

  // PERSISTED DATA STATES
  const [periods, setPeriods] = useState<EvaluationPeriod[]>(() => getStoredPeriods());
  const [exams, setExams] = useState<Exam[]>(() => getStoredExams());
  const [allGrades, setAllGrades] = useState<Record<string, Record<string, StudentGradeRecord>>>(() => getStoredAllGrades());
  const [auditLogs, setAuditLogs] = useState<GradeAuditEntry[]>(() => getStoredAuditLogs());

  // ACTIVE NAVIGATION TAB
  // 'periods' | 'circle_entry' | 'circle_analysis' | 'cross_comparison' | 'curriculum_index' | 'period_report' | 'archive' | 'audit_log'
  const [activeTab, setActiveTab] = useState<
    'periods' | 'circle_entry' | 'circle_analysis' | 'cross_comparison' | 'curriculum_index' | 'period_report' | 'archive' | 'audit_log'
  >('circle_entry');

  // SELECTION & FILTER STATES
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedCircleId, setSelectedCircleId] = useState<string>('c1');
  const [compareCircle1Id, setCompareCircle1Id] = useState<string>('c1');
  const [compareCircle2Id, setCompareCircle2Id] = useState<string>('c2');
  
  // VIEW SCOPE TOGGLE: 'single_circle' (طلاب الحلقة الحالية) OR 'all_circles' (جميع الطلاب - الترتيب الإجمالي العام)
  const [studentScope, setStudentScope] = useState<'single_circle' | 'all_circles'>('single_circle');

  // ROSTER SEARCH & FILTERS
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterFilter, setRosterFilter] = useState<string>('all'); // 'all' | 'entered' | 'unentered' | 'passed' | 'failed' | 'absent' | 'not_tested' | 'postponed'
  const [rosterSort, setRosterSort] = useState<'name' | 'score_desc' | 'score_asc' | 'status' | 'rank'>('name');

  // MESSAGES & TOASTS
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // MODAL STATES
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showExamFilePreviewModal, setShowExamFilePreviewModal] = useState(false);
  const [showCriteriaManagerModal, setShowCriteriaManagerModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<{ id: string; name: string; maxScore: number } | null>(null);
  const [newCritForm, setNewCritForm] = useState<{ name: string; maxScore: number }>({ name: '', maxScore: 10 });
  const [expandedPeriodReportId, setExpandedPeriodReportId] = useState<string | null>(null);

  const [selectedStudentHistory, setSelectedStudentHistory] = useState<Student | null>(null);
  const [editReasonModal, setEditReasonModal] = useState<{ studentId: string; criterionId: string; oldVal: number; newVal: number } | null>(null);
  const [editReasonText, setEditReasonText] = useState('');

  // AUDIT LOG FILTERS inside Modal/Tab
  const [auditPeriodFilter, setAuditPeriodFilter] = useState<string>('all');
  const [auditExamFilter, setAuditExamFilter] = useState<string>('all');

  // FORM STATES
  const [newPeriodForm, setNewPeriodForm] = useState<Partial<EvaluationPeriod>>({
    name: '',
    curriculum: 'منهج الحفظ والمراجعة المكثف',
    examType: 'شهري',
    startDate: '1447/01/01',
    endDate: '1447/02/30',
    targetCategory: 'جميع طلاب الحلقات',
    maxScore: 100,
    passScore: 60,
    responsible: currentUser?.name || 'إدارة الحلقات',
    description: '',
    targetCircles: ['c1', 'c2', 'c3']
  });

  const [newExamForm, setNewExamForm] = useState<Partial<Exam> & { examFileName?: string; examFileContent?: string }>({
    title: '',
    curriculum: 'منهج الحفظ والمراجعة المكثف',
    examType: 'شهري',
    maxTotalScore: 100,
    passScore: 60,
    date: new Date().toLocaleDateString('ar-SA'),
    circleIds: ['c1', 'c2', 'c3'],
    criteria: [
      { id: 'crit-1', name: 'الحفظ والتسميع', maxScore: 40 },
      { id: 'crit-2', name: 'حسن التلاوة والترتيل', maxScore: 20 },
      { id: 'crit-3', name: 'أحكام التجويد والنطق', maxScore: 20 },
      { id: 'crit-4', name: 'الانضباط والحضور', maxScore: 10 },
      { id: 'crit-5', name: 'السلوك والتميز التربوي', maxScore: 10 }
    ],
    responsibleName: currentUser?.name || 'مشرف الاختبارات',
    examFileName: 'جدول_أسئلة_ومعايير_الاختبار.pdf',
    examFileContent: 'نماذج ورقة أسئلة الاختبار:\n1. التسميع المباشر لسورة البقرة والنساء.\n2. تطبيق أحكام تجويد النون الساكنة والتنوين.\n3. أداء الترتيل وحسن الصوت والنطق.'
  });

  // CURRICULUM DYNAMIC FORMULA COMPONENTS
  const [formulaComponents, setFormulaComponents] = useState<Array<{ id: string; name: string; weight: number }>>([
    { id: 'fc-1', name: 'نسبة النجاح المباشرة بالحلقات', weight: 50 },
    { id: 'fc-2', name: 'متوسط درجات الطلاب الكلي', weight: 30 },
    { id: 'fc-3', name: 'نسبة حضور وتأدية الاختبارات', weight: 20 }
  ]);

  // AVAILABLE CIRCLES MAPPING
  const availableCircles = useMemo(() => {
    if (circlesList && circlesList.length > 0) return circlesList;
    return [
      { id: 'c1', name: 'حلقة الطليعة (خاتمين)', teacherName: 'الشيخ عبدالرحمن بن محمد السعيد' },
      { id: 'c2', name: 'حلقة الفردوس (متقدمين)', teacherName: 'أ. حازم عمر الحركي' },
      { id: 'c3', name: 'حلقة الفرقان (ناشئة)', teacherName: 'أ. محمد بن فهد الدوسري' }
    ];
  }, [circlesList]);

  // LOAD EXAMS FROM BACKEND NESTJS API
  useEffect(() => {
    let isMounted = true;
    apiGetExams()
      .then(apiExams => {
        if (!isMounted || !apiExams || apiExams.length === 0) return;
        const mapped: Exam[] = apiExams.map(ae => ({
          id: ae.id,
          periodId: ae.termId || ae.academicYearId || 'p-1',
          title: ae.title,
          curriculum: ae.curriculum || 'منهج الحفظ والمراجعة المكثف',
          periodName: 'فترة التقييم',
          examType: ae.examType === 'MONTHLY' ? 'شهري' : ae.examType === 'MIDTERM' ? 'فصلي' : ae.examType === 'FINAL' ? 'نهائي' : 'تقييم مستمر',
          maxTotalScore: ae.maxScore || 100,
          passScore: ae.passScore || 60,
          date: ae.scheduledDate ? new Date(ae.scheduledDate).toLocaleDateString('ar-SA') : new Date(ae.createdAt).toLocaleDateString('ar-SA'),
          circleIds: ae.halaqaId ? [ae.halaqaId] : ['c1', 'c2', 'c3'],
          circleName: ae.halaqa?.name || availableCircles.map(c => c.name).join('، '),
          criteria: (ae.criteria && ae.criteria.length > 0)
            ? ae.criteria.map(c => ({ id: c.id || c.name, name: c.name, maxScore: c.maxScore }))
            : [
                { id: 'crit-1', name: 'الحفظ والتسميع', maxScore: 40 },
                { id: 'crit-2', name: 'حسن التلاوة والترتيل', maxScore: 20 },
                { id: 'crit-3', name: 'أحكام التجويد والنطق', maxScore: 20 },
                { id: 'crit-4', name: 'الانضباط والحضور', maxScore: 10 },
                { id: 'crit-5', name: 'السلوك والتميز التربوي', maxScore: 10 }
              ],
          responsibleName: 'إدارة الاختبارات والتقييم',
          status: ae.isPublished ? 'approved' : ae.status === 'ARCHIVED' ? 'archived' : 'in_progress',
        }));
        setExams(prev => {
          const merged = [...mapped, ...prev.filter(p => !mapped.some(m => m.id === p.id))];
          saveStoredExams(merged);
          return merged;
        });
      })
      .catch(() => {
        // Fallback to local storage
      });
    return () => { isMounted = false; };
  }, [availableCircles]);

  // SYNC DEFAULT SELECTIONS
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || periods[0];
  }, [periods, selectedPeriodId]);

  const periodExams = useMemo(() => {
    if (!activePeriod) return exams;
    return exams.filter(e => e.periodId === activePeriod.id || e.periodName?.includes(activePeriod.name));
  }, [exams, activePeriod]);

  useEffect(() => {
    if (periodExams.length > 0 && !periodExams.some(e => e.id === selectedExamId)) {
      setSelectedExamId(periodExams[0].id);
    } else if (periodExams.length === 0 && exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
  }, [periodExams, selectedExamId, exams]);

  const activeExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || periodExams[0] || exams[0];
  }, [exams, periodExams, selectedExamId]);

  // ACTIVE CIRCLE OBJECT
  const activeCircleObj = useMemo(() => {
    return availableCircles.find(c => c.id === selectedCircleId) || availableCircles[0];
  }, [availableCircles, selectedCircleId]);

  // PULL AUTOMATIC CIRCLE STUDENTS (No manual student adding!)
  const masterStudentsList = useMemo(() => {
    return (studentsList && studentsList.length > 0) ? studentsList : DEFAULT_MASTER_STUDENTS;
  }, [studentsList]);

  // AUTO-PERSIST ALL GRADES & SYNC DIRECTLY TO PROFILES & BACKEND API
  useEffect(() => {
    saveStoredAllGrades(allGrades);
    if (activeExam) {
      const examRecords = Object.values(allGrades[activeExam.id] || {}) as StudentGradeRecord[];
      if (examRecords.length > 0) {
        syncGradesToStudents(activeExam, examRecords, currentUser?.name || 'الإدارة', masterStudentsList);
        
        // Sync to backend if UUID format exam
        if (activeExam.id.length > 20) {
          const payload = examRecords.map(r => ({
            studentId: r.studentId,
            score: r.totalScore,
            status: r.status === 'passed' ? 'PASSED' : r.status === 'failed' ? 'FAILED' : r.status === 'absent' ? 'ABSENT' : 'ENTERED',
            notes: r.notes,
            criterionScores: r.scores
          }));
          apiBulkGradeExam(activeExam.id, payload).catch(() => {});
        }
      }
    }
  }, [allGrades, activeExam, currentUser?.name, masterStudentsList]);

  const rawCircleStudents = useMemo(() => {
    if (!selectedCircleId) return masterStudentsList;
    return masterStudentsList.filter(s => {
      if ((s as any).circleId === selectedCircleId) return true;
      if (activeCircleObj && s.circle && (s.circle.includes(activeCircleObj.name.split(' ')[0]) || s.circle === activeCircleObj.name)) return true;
      if (selectedCircleId === 'c1' && (s.circle.includes('الطليعة') || s.circle.includes('خاتمين'))) return true;
      if (selectedCircleId === 'c2' && (s.circle.includes('الفردوس') || s.circle.includes('متقدمين'))) return true;
      if (selectedCircleId === 'c3' && (s.circle.includes('الفرقان') || s.circle.includes('ناشئة'))) return true;
      return false;
    });
  }, [masterStudentsList, selectedCircleId, activeCircleObj]);

  // AUTOMATIC ALL-STUDENTS ROSTER WITH OVERALL RANKING ACROSS ALL CIRCLES
  const allStudentsRoster = useMemo(() => {
    if (!activeExam) return [];

    const list = masterStudentsList.map(student => {
      const existingRecord = (allGrades[activeExam.id] || {})[student.id];
      const scores = existingRecord?.scores || {};
      
      let total = 0;
      activeExam.criteria.forEach(crit => {
        total += Number(scores[crit.id]) || 0;
      });

      const maxTotal = activeExam.maxTotalScore || 100;
      const passScore = activeExam.passScore || 60;
      const percentage = Math.round((total / maxTotal) * 1000) / 10;

      let status: StudentExamStatus = existingRecord?.status || 'unentered';
      if (Object.keys(scores).length > 0 && status === 'unentered') {
        status = total >= passScore ? 'passed' : 'failed';
      }

      // Find student's circle
      const circleObj = availableCircles.find(c => {
        if ((student as any).circleId === c.id) return true;
        if (student.circle && student.circle.includes(c.name.split(' ')[0])) return true;
        if (c.id === 'c1' && student.circle.includes('الطليعة')) return true;
        if (c.id === 'c2' && student.circle.includes('الفردوس')) return true;
        if (c.id === 'c3' && student.circle.includes('الفرقان')) return true;
        return false;
      }) || availableCircles[0];

      return {
        student,
        studentId: student.id,
        studentName: student.name,
        nationalId: student.nationalId || (student as any).academicId || '10' + Math.floor(100000000 + Math.random() * 900000000),
        circleId: circleObj.id,
        circleName: circleObj.name,
        teacherName: circleObj.teacherName,
        scores,
        totalScore: total,
        percentage,
        passScore,
        maxScore: maxTotal,
        status,
        notes: existingRecord?.notes || ''
      };
    });

    // Sort by totalScore / percentage descending to determine overall rank across all circles
    list.sort((a, b) => b.totalScore - a.totalScore || b.percentage - a.percentage);

    return list.map((item, idx) => ({
      ...item,
      overallRank: idx + 1
    }));
  }, [masterStudentsList, activeExam, allGrades, availableCircles]);

  // CURRENT EXAM GRADES MAP FOR SELECTED EXAM
  const currentExamGrades = useMemo(() => {
    if (!activeExam) return {};
    return allGrades[activeExam.id] || {};
  }, [allGrades, activeExam]);

  // COMPUTED ROSTER WITH COMPLETE SCORE DETAILS
  const computedRoster = useMemo(() => {
    if (!activeExam) return [];

    return rawCircleStudents.map(student => {
      const existingRecord = currentExamGrades[student.id];
      const scores = existingRecord?.scores || {};
      
      let total = 0;
      activeExam.criteria.forEach(crit => {
        total += Number(scores[crit.id]) || 0;
      });

      const maxTotal = activeExam.maxTotalScore || 100;
      const passScore = activeExam.passScore || 60;
      const percentage = Math.round((total / maxTotal) * 1000) / 10;

      // Determine outcome status
      let status: StudentExamStatus = existingRecord?.status || 'unentered';
      if (Object.keys(scores).length > 0 && status === 'unentered') {
        status = total >= passScore ? 'passed' : 'failed';
      }

      return {
        student,
        studentId: student.id,
        studentName: student.name,
        nationalId: student.nationalId || (student as any).academicId || '10' + Math.floor(100000000 + Math.random() * 900000000),
        scores,
        totalScore: total,
        percentage,
        passScore,
        maxScore: maxTotal,
        status,
        notes: existingRecord?.notes || ''
      };
    });
  }, [rawCircleStudents, activeExam, currentExamGrades]);

  // FILTERED & SORTED ROSTER (SUPPORTING SINGLE CIRCLE OR ALL-CIRCLES OVERALL RANKING)
  const filteredRoster = useMemo(() => {
    let list = studentScope === 'all_circles' 
      ? [...allStudentsRoster] 
      : [...computedRoster];

    // Search filter
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(item => 
        item.studentName.toLowerCase().includes(q) || 
        (item.nationalId && item.nationalId.includes(q)) ||
        ((item as any).circleName && (item as any).circleName.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (rosterFilter !== 'all') {
      if (rosterFilter === 'entered') list = list.filter(i => i.status !== 'unentered');
      else if (rosterFilter === 'unentered') list = list.filter(i => i.status === 'unentered');
      else if (rosterFilter === 'passed') list = list.filter(i => i.status === 'passed');
      else if (rosterFilter === 'failed') list = list.filter(i => i.status === 'failed');
      else if (rosterFilter === 'absent') list = list.filter(i => i.status === 'absent');
      else if (rosterFilter === 'not_tested') list = list.filter(i => i.status === 'not_tested');
      else if (rosterFilter === 'postponed') list = list.filter(i => i.status === 'postponed');
      else if (rosterFilter === 'exempt') list = list.filter(i => i.status === 'exempt');
    }

    // Sort
    list.sort((a, b) => {
      if (rosterSort === 'rank' && (a as any).overallRank && (b as any).overallRank) {
        return (a as any).overallRank - (b as any).overallRank;
      }
      if (rosterSort === 'name') return a.studentName.localeCompare(b.studentName, 'ar');
      if (rosterSort === 'score_desc') return b.totalScore - a.totalScore;
      if (rosterSort === 'score_asc') return a.totalScore - b.totalScore;
      if (rosterSort === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    return list;
  }, [computedRoster, allStudentsRoster, studentScope, rosterSearch, rosterFilter, rosterSort]);

  // LIVE CIRCLE SUMMARY METRICS
  const liveCircleMetrics = useMemo(() => {
    const total = computedRoster.length;
    const entered = computedRoster.filter(r => r.status !== 'unentered').length;
    const unentered = total - entered;
    const attended = computedRoster.filter(r => r.status === 'passed' || r.status === 'failed').length;
    const absent = computedRoster.filter(r => r.status === 'absent').length;
    const passed = computedRoster.filter(r => r.status === 'passed').length;
    const failed = computedRoster.filter(r => r.status === 'failed').length;
    
    const sumScores = computedRoster
      .filter(r => r.status === 'passed' || r.status === 'failed')
      .reduce((a, b) => a + b.totalScore, 0);
    const avgScore = attended > 0 ? Math.round((sumScores / attended) * 10) / 10 : 0;
    const passRate = attended > 0 ? Math.round((passed / attended) * 100) : 0;
    const completionPercent = total > 0 ? Math.round((entered / total) * 100) : 0;

    return {
      total,
      entered,
      unentered,
      attended,
      absent,
      passed,
      failed,
      avgScore,
      passRate,
      completionPercent
    };
  }, [computedRoster]);

  // AT-RISK STUDENTS LIST ("طلاب يحتاجون متابعة")
  const atRiskStudents = useMemo(() => {
    return computedRoster.filter(r => 
      r.status === 'failed' || 
      r.status === 'absent' || 
      (r.status === 'passed' && r.percentage < (activeExam?.passScore || 60))
    );
  }, [computedRoster, activeExam]);

  // CROSS-CIRCLE COMPARISON STATS
  const crossCircleStats = useMemo(() => {
    if (!activeExam) return [];

    return availableCircles.map(circle => {
      // Find students in this circle
      const circleSts = masterStudentsList.filter(s => {
        if ((s as any).circleId === circle.id) return true;
        if (s.circle && s.circle.includes(circle.name.split(' ')[0])) return true;
        if (circle.id === 'c1' && s.circle.includes('الطليعة')) return true;
        if (circle.id === 'c2' && s.circle.includes('الفردوس')) return true;
        if (circle.id === 'c3' && s.circle.includes('الفرقان')) return true;
        return false;
      });

      const gradesMap = allGrades[activeExam.id] || {};
      const records = circleSts.map(s => gradesMap[s.id]).filter(Boolean);

      const total = circleSts.length;
      const tested = records.filter(r => r.status === 'passed' || r.status === 'failed').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const passed = records.filter(r => r.status === 'passed').length;
      const failed = records.filter(r => r.status === 'failed').length;

      const sumScores = records.filter(r => r.status === 'passed' || r.status === 'failed').reduce((a, b) => a + b.totalScore, 0);
      const avgScore = tested > 0 ? Math.round((sumScores / tested) * 10) / 10 : 0;
      const passRate = tested > 0 ? Math.round((passed / tested) * 100) : 0;

      let entryState: 'completed' | 'in_progress' | 'not_started' = 'not_started';
      if (records.length === total && total > 0) entryState = 'completed';
      else if (records.length > 0) entryState = 'in_progress';

      return {
        circleId: circle.id,
        circleName: circle.name,
        teacherName: circle.teacherName,
        totalStudents: total,
        testedCount: tested,
        absentCount: absent,
        passedCount: passed,
        failedCount: failed,
        avgScore,
        passRate,
        entryState
      };
    });
  }, [availableCircles, masterStudentsList, allGrades, activeExam]);

  // BEST / LOWEST CIRCLE HIGHLIGHTS
  const bestCircle = useMemo(() => {
    if (crossCircleStats.length === 0) return null;
    return [...crossCircleStats].sort((a, b) => b.passRate - a.passRate)[0];
  }, [crossCircleStats]);

  const lowestCircle = useMemo(() => {
    if (crossCircleStats.length === 0) return null;
    return [...crossCircleStats].sort((a, b) => a.passRate - b.passRate)[0];
  }, [crossCircleStats]);

  // OVERALL CURRICULUM SUCCESS INDEX SCORE
  const curriculumSuccessIndex = useMemo(() => {
    const totalTested = crossCircleStats.reduce((a, b) => a + b.testedCount, 0);
    const totalStudents = crossCircleStats.reduce((a, b) => a + b.totalStudents, 0);
    const avgPassRate = crossCircleStats.length > 0 ? Math.round(crossCircleStats.reduce((a, b) => a + b.passRate, 0) / crossCircleStats.length) : 0;
    const avgScoreOverall = crossCircleStats.length > 0 ? Math.round(crossCircleStats.reduce((a, b) => a + b.avgScore, 0) / crossCircleStats.length) : 0;
    const attendanceRate = totalStudents > 0 ? Math.round((totalTested / totalStudents) * 100) : 0;

    let weightedScore = 0;
    formulaComponents.forEach(comp => {
      const weightFraction = (Number(comp.weight) || 0) / 100;
      if (comp.name.includes('نجاح')) {
        weightedScore += avgPassRate * weightFraction;
      } else if (comp.name.includes('متوسط') || comp.name.includes('درجات')) {
        weightedScore += avgScoreOverall * weightFraction;
      } else if (comp.name.includes('حضور') || comp.name.includes('تأدية')) {
        weightedScore += attendanceRate * weightFraction;
      } else {
        // Generic fallback for custom added formula criteria
        weightedScore += ((avgPassRate + attendanceRate) / 2) * weightFraction;
      }
    });

    return {
      avgPassRate,
      avgScoreOverall,
      attendanceRate,
      weightedScore: Math.round(weightedScore)
    };
  }, [crossCircleStats, formulaComponents]);

  // INLINE SCORE INPUT CHANGE HANDLER WITH STRICT VALIDATION
  const handleScoreInputChange = (
    studentId: string, 
    criterionId: string, 
    maxScore: number, 
    valStr: string
  ) => {
    if (activePeriod?.status === 'closed' || activePeriod?.status === 'archived') {
      if (!isGeneralDirector) {
        setErrorMessage('الفترة مغلقة أو مؤرشفة ولا يمكن تعديل الدرجات إلا بصلاحية المدير العام.');
        return;
      }
    }

    if (valStr === '') {
      setAllGrades(prev => {
        const examMap = { ...(prev[activeExam.id] || {}) };
        const studentRec = examMap[studentId] ? { ...examMap[studentId] } : null;
        if (studentRec) {
          const updatedScores = { ...(studentRec.scores || {}) };
          delete updatedScores[criterionId];
          studentRec.scores = updatedScores;
          
          // recalculate total
          let newTot = 0;
          Object.values(updatedScores).forEach(v => newTot += Number(v) || 0);
          studentRec.totalScore = newTot;
          studentRec.percentage = Math.round((newTot / activeExam.maxTotalScore) * 1000) / 10;
          
          if (Object.keys(updatedScores).length === 0) {
            studentRec.status = 'unentered';
          } else {
            studentRec.status = newTot >= activeExam.passScore ? 'passed' : 'failed';
          }

          examMap[studentId] = studentRec;
        }
        return { ...prev, [activeExam.id]: examMap };
      });
      return;
    }

    const num = parseFloat(valStr);

    if (isNaN(num)) {
      setErrorMessage('يرجى إدخال قيمة رقمية صحيحة.');
      return;
    }

    if (num < 0) {
      setErrorMessage('لا يُسمح بإدخال قيم سالبة للدرجات.');
      return;
    }

    if (num > maxScore) {
      setErrorMessage(`الدرجة القصوى لهذا البند هي ${maxScore} فقط.`);
      return;
    }

    setErrorMessage(null);

    setAllGrades(prev => {
      const examMap = { ...(prev[activeExam.id] || {}) };
      const currentStudent = rawCircleStudents.find(s => s.id === studentId);
      const studentRec: StudentGradeRecord = examMap[studentId] ? { ...examMap[studentId] } : {
        studentId,
        studentName: currentStudent?.name || 'طالب',
        nationalId: currentStudent?.nationalId,
        circleId: selectedCircleId,
        scores: {},
        totalScore: 0,
        percentage: 0,
        passScore: activeExam.passScore,
        maxScore: activeExam.maxTotalScore,
        status: 'passed',
        lastUpdated: new Date().toLocaleDateString('ar-SA'),
        updatedBy: currentUser?.name || 'مسؤول الدرجات'
      };

      const oldScores = { ...(studentRec.scores || {}) };
      const oldVal = oldScores[criterionId] || 0;
      oldScores[criterionId] = num;
      studentRec.scores = oldScores;

      let newTot = 0;
      activeExam.criteria.forEach(c => {
        newTot += Number(oldScores[c.id]) || 0;
      });

      studentRec.totalScore = newTot;
      studentRec.percentage = Math.round((newTot / activeExam.maxTotalScore) * 1000) / 10;
      if (studentRec.status === 'unentered' || studentRec.status === 'passed' || studentRec.status === 'failed') {
        studentRec.status = newTot >= activeExam.passScore ? 'passed' : 'failed';
      }
      studentRec.lastUpdated = new Date().toLocaleDateString('ar-SA');
      studentRec.updatedBy = currentUser?.name || 'مسؤول الدرجات';

      examMap[studentId] = studentRec;

      // Log edit in audit if replacing an existing score
      if (oldVal !== undefined && oldVal !== num) {
        const auditItem: GradeAuditEntry = {
          id: 'aud-' + Date.now(),
          studentId,
          studentName: studentRec.studentName,
          examId: activeExam.id,
          examTitle: activeExam.title,
          periodId: activePeriod?.id,
          periodName: activePeriod?.name,
          curriculumName: activeExam.curriculum,
          previousScore: oldVal,
          newScore: num,
          modifiedBy: currentUser?.name || 'مسؤول التعديل',
          timestamp: new Date().toLocaleString('ar-SA'),
          reason: 'تعديل درجة البند أثناء التقييم المباشر'
        };
        saveStoredAuditLogs([auditItem, ...auditLogs]);
        setAuditLogs(prev => [auditItem, ...prev]);
      }

      return { ...prev, [activeExam.id]: examMap };
    });
  };

  // STUDENT OUTCOME STATUS CHANGE HANDLER
  const handleStatusChange = (studentId: string, newStatus: StudentExamStatus) => {
    setAllGrades(prev => {
      const examMap = { ...(prev[activeExam.id] || {}) };
      const currentStudent = rawCircleStudents.find(s => s.id === studentId);
      const studentRec: StudentGradeRecord = examMap[studentId] ? { ...examMap[studentId] } : {
        studentId,
        studentName: currentStudent?.name || 'طالب',
        nationalId: currentStudent?.nationalId,
        circleId: selectedCircleId,
        scores: {},
        totalScore: 0,
        percentage: 0,
        passScore: activeExam.passScore,
        maxScore: activeExam.maxTotalScore,
        status: newStatus,
        lastUpdated: new Date().toLocaleDateString('ar-SA'),
        updatedBy: currentUser?.name || 'مسؤول الدرجات'
      };

      studentRec.status = newStatus;
      studentRec.lastUpdated = new Date().toLocaleDateString('ar-SA');
      studentRec.updatedBy = currentUser?.name || 'مسؤول الدرجات';

      examMap[studentId] = studentRec;
      return { ...prev, [activeExam.id]: examMap };
    });
  };

  // ACTION: SAVE GRADES & SYNC TO CENTRAL STUDENT PROFILES
  const handleSaveAllGrades = () => {
    if (!activeExam) return;

    saveStoredAllGrades(allGrades);

    // Sync records for this exam directly to student central profiles
    const examRecords = Object.values(allGrades[activeExam.id] || {}) as StudentGradeRecord[];
    syncGradesToStudents(activeExam, examRecords, currentUser?.name || 'مسؤول التقييم', masterStudentsList);

    setSuccessMessage(`تم حفظ درجات حلقة "${activeCircleObj.name}" بنجاح وربطها تلقائياً بملفات الطلاب والتقارير.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: CREATE NEW EVALUATION PERIOD
  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodForm.name?.trim()) {
      setErrorMessage('يرجى كتابة اسم فترة التقييم.');
      return;
    }

    const created: EvaluationPeriod = {
      id: 'p-' + Date.now(),
      name: newPeriodForm.name,
      curriculum: newPeriodForm.curriculum || 'منهج الحفظ والمراجعة المكثف',
      examType: newPeriodForm.examType || 'شهري',
      startDate: newPeriodForm.startDate || '1447/01/01',
      endDate: newPeriodForm.endDate || '1447/02/30',
      targetCategory: newPeriodForm.targetCategory || 'جميع الطلاب',
      targetCircles: newPeriodForm.targetCircles || ['c1', 'c2', 'c3'],
      maxScore: Number(newPeriodForm.maxScore) || 100,
      passScore: Number(newPeriodForm.passScore) || 60,
      responsible: newPeriodForm.responsible || currentUser?.name || 'مدير الحلقات',
      description: newPeriodForm.description || '',
      status: 'open',
      requiredFiles: [
        { id: 'rf-1', name: 'نموذج الأسئلة الموحد', status: 'not_uploaded' },
        { id: 'rf-2', name: 'كشف الطلاب المتقدمين', status: 'completed' },
        { id: 'rf-3', name: 'نموذج إجابة وتصحيح التجويد', status: 'not_uploaded' },
        { id: 'rf-4', name: 'تقرير النتائج والتوصيات', status: 'missing' }
      ],
      createdAt: new Date().toLocaleDateString('ar-SA')
    };

    const updated = [created, ...periods];
    setPeriods(updated);
    saveStoredPeriods(updated);
    setSelectedPeriodId(created.id);
    setShowNewPeriodModal(false);
    setSuccessMessage('تم إنشاء فترة التقييم الجديدة بنجاح.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: CREATE NEW EXAM
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamForm.title?.trim()) {
      setErrorMessage('يرجى كتابة عنوان الاختبار.');
      return;
    }

    const created: Exam = {
      id: 'exam-' + Date.now(),
      periodId: selectedPeriodId || periods[0]?.id || 'p-1',
      title: newExamForm.title,
      curriculum: newExamForm.curriculum || activePeriod?.curriculum || 'منهج القرآن',
      periodName: activePeriod?.name || 'فترة التقييم',
      examType: newExamForm.examType || 'شهري',
      maxTotalScore: Number(newExamForm.maxTotalScore) || 100,
      passScore: Number(newExamForm.passScore) || 60,
      date: newExamForm.date || new Date().toLocaleDateString('ar-SA'),
      circleIds: newExamForm.circleIds || ['c1', 'c2', 'c3'],
      circleName: availableCircles.map(c => c.name).join('، '),
      criteria: newExamForm.criteria || [
        { id: 'crit-1', name: 'الحفظ والتسميع', maxScore: 40 },
        { id: 'crit-2', name: 'حسن التلاوة والترتيل', maxScore: 20 },
        { id: 'crit-3', name: 'أحكام التجويد والنطق', maxScore: 20 },
        { id: 'crit-4', name: 'الانضباط والحضور', maxScore: 10 },
        { id: 'crit-5', name: 'السلوك والتميز التربوي', maxScore: 10 }
      ],
      responsibleName: newExamForm.responsibleName || currentUser?.name || 'المشرف',
      status: 'in_progress',
      examFileAttachment: {
        name: newExamForm.examFileName || 'جدول_أسئلة_ومعايير_الاختبار.pdf',
        size: '2.1 MB',
        type: 'PDF',
        uploadDate: new Date().toLocaleDateString('ar-SA'),
        contentPreview: newExamForm.examFileContent || 'نماذج أسئلة وتوجيهات هذا الاختبار المعتمدة من المجمع.'
      }
    };

    const updated = [created, ...exams];
    setExams(updated);
    saveStoredExams(updated);
    setSelectedExamId(created.id);
    setShowNewExamModal(false);

    // Call backend API
    apiCreateExam({
      title: created.title,
      description: created.curriculum,
      curriculum: created.curriculum,
      examType: 'MONTHLY',
      maxScore: created.maxTotalScore,
      passScore: created.passScore,
      criteria: created.criteria.map((c, idx) => ({ name: c.name, maxScore: c.maxScore, order: idx }))
    }).then(backendExam => {
      if (backendExam?.id) {
        setExams(currentExams => currentExams.map(e => e.id === created.id ? { ...e, id: backendExam.id } : e));
      }
    }).catch(() => {});

    setSuccessMessage('تم إنشاء الاختبار وتجهيز استعراض الحلقات بنجاح.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: CLOSE PERIOD ("إغلاق الفترة")
  const handleClosePeriod = (periodId: string) => {
    const updated = periods.map(p => {
      if (p.id === periodId) return { ...p, status: 'closed' as const };
      return p;
    });
    setPeriods(updated);
    saveStoredPeriods(updated);
    setSuccessMessage('تم إغلاق الفترة بنجاح وقفل تعديل النتائج إلا بالصلاحية الاستثنائية.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: ARCHIVE PERIOD ("أرشفة الفترة")
  const handleArchivePeriod = (periodId: string) => {
    const updated = periods.map(p => {
      if (p.id === periodId) return { ...p, status: 'archived' as const };
      return p;
    });
    setPeriods(updated);
    saveStoredPeriods(updated);
    setSuccessMessage('تم نقل فترة التقييم إلى الأرشيف الشامل.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: APPROVE PERIOD & CURRICULUM REPORT ("اعتماد تقرير المنهج")
  const handleApprovePeriodReport = (periodId: string) => {
    const updated = periods.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'approved' as const,
          isApproved: true,
          approvedBy: currentUser?.name || 'مدير الحلقات المعتمد',
          approvedAt: new Date().toLocaleDateString('ar-SA') + ' - ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return p;
    });
    setPeriods(updated);
    saveStoredPeriods(updated);

    // Publish all exams under this period
    exams.forEach(ex => {
      if (ex.periodId === periodId && ex.id.length > 20) {
        apiPublishExam(ex.id, true).catch(() => {});
      }
    });

    setSuccessMessage('تم اعتماد تقرير هذا المنهج رسمياً وإصدار ختم التوثيق القيادي.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ACTION: EDIT CRITERION IN ACTIVE EXAM
  const handleSaveCriterionEdit = (criterionId: string, newName: string, newMaxScore: number) => {
    if (!activeExam) return;
    if (!newName.trim()) {
      setErrorMessage('يرجى كتابة اسم المعيار البند.');
      return;
    }
    if (newMaxScore <= 0) {
      setErrorMessage('يرجى تحديد درجة قصوى صحيحة أكبر من صفر.');
      return;
    }

    const updatedCriteria = activeExam.criteria.map(c => {
      if (c.id === criterionId) {
        return { ...c, name: newName.trim(), maxScore: newMaxScore };
      }
      return c;
    });

    const newTotalMax = updatedCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

    const updatedExams = exams.map(ex => {
      if (ex.id === activeExam.id) {
        return {
          ...ex,
          criteria: updatedCriteria,
          maxTotalScore: newTotalMax
        };
      }
      return ex;
    });

    setExams(updatedExams);
    saveStoredExams(updatedExams);

    // Recalculate totals for activeExam in allGrades
    setAllGrades(prev => {
      const examMap = { ...(prev[activeExam.id] || {}) };
      Object.keys(examMap).forEach(stId => {
        const rec = { ...examMap[stId] };
        rec.maxScore = newTotalMax;
        let tot = 0;
        updatedCriteria.forEach(c => {
          tot += Number(rec.scores?.[c.id]) || 0;
        });
        rec.totalScore = tot;
        rec.percentage = newTotalMax > 0 ? Math.round((tot / newTotalMax) * 1000) / 10 : 0;
        examMap[stId] = rec;
      });
      return { ...prev, [activeExam.id]: examMap };
    });

    setEditingCriterion(null);
    setSuccessMessage(`تم تعديل بند "${newName}" وتحديث المجموع التراكمي إلى ${newTotalMax} درجة.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // ACTION: DELETE CRITERION FROM ACTIVE EXAM
  const handleDeleteCriterion = (criterionId: string) => {
    if (!activeExam) return;
    if (activeExam.criteria.length <= 1) {
      setErrorMessage('يجب أن يتبقى بند اختباري واحد على الأقل.');
      return;
    }

    const critToDelete = activeExam.criteria.find(c => c.id === criterionId);
    const updatedCriteria = activeExam.criteria.filter(c => c.id !== criterionId);
    const newTotalMax = updatedCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

    const updatedExams = exams.map(ex => {
      if (ex.id === activeExam.id) {
        return {
          ...ex,
          criteria: updatedCriteria,
          maxTotalScore: newTotalMax
        };
      }
      return ex;
    });

    setExams(updatedExams);
    saveStoredExams(updatedExams);

    // Remove deleted criterion from scores
    setAllGrades(prev => {
      const examMap = { ...(prev[activeExam.id] || {}) };
      Object.keys(examMap).forEach(stId => {
        const rec = { ...examMap[stId] };
        const newScores = { ...(rec.scores || {}) };
        delete newScores[criterionId];
        rec.scores = newScores;
        rec.maxScore = newTotalMax;
        let tot = 0;
        updatedCriteria.forEach(c => {
          tot += Number(newScores[c.id]) || 0;
        });
        rec.totalScore = tot;
        rec.percentage = newTotalMax > 0 ? Math.round((tot / newTotalMax) * 1000) / 10 : 0;
        examMap[stId] = rec;
      });
      return { ...prev, [activeExam.id]: examMap };
    });

    setSuccessMessage(`تم حذف بند "${critToDelete?.name || ''}" وتحديث المجموع إلى ${newTotalMax} درجة.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // ACTION: ADD NEW CRITERION TO ACTIVE EXAM
  const handleAddNewCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    if (!newCritForm.name.trim()) {
      setErrorMessage('يرجى كتابة اسم البند جديد.');
      return;
    }
    if (newCritForm.maxScore <= 0) {
      setErrorMessage('يرجى كتابة درجة قصوى أكبر من صفر.');
      return;
    }

    const newCrit = { id: 'crit-' + Date.now(), name: newCritForm.name.trim(), maxScore: Number(newCritForm.maxScore) };
    const updatedCriteria = [...activeExam.criteria, newCrit];
    const newTotalMax = updatedCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

    const updatedExams = exams.map(ex => {
      if (ex.id === activeExam.id) {
        return {
          ...ex,
          criteria: updatedCriteria,
          maxTotalScore: newTotalMax
        };
      }
      return ex;
    });

    setExams(updatedExams);
    saveStoredExams(updatedExams);

    // Update grades
    setAllGrades(prev => {
      const examMap = { ...(prev[activeExam.id] || {}) };
      Object.keys(examMap).forEach(stId => {
        const rec = { ...examMap[stId] };
        rec.maxScore = newTotalMax;
        let tot = 0;
        updatedCriteria.forEach(c => {
          tot += Number(rec.scores?.[c.id]) || 0;
        });
        rec.totalScore = tot;
        rec.percentage = newTotalMax > 0 ? Math.round((tot / newTotalMax) * 1000) / 10 : 0;
        examMap[stId] = rec;
      });
      return { ...prev, [activeExam.id]: examMap };
    });

    setNewCritForm({ name: '', maxScore: 10 });
    setSuccessMessage(`تم إضافة البند الجديد "${newCrit.name}" وتحديث سعة الاختبار إلى ${newTotalMax} درجة.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // EXPORT EXCEL CSV WITH UTF-8 BOM
  const handleExportExcel = () => {
    if (!activeExam || computedRoster.length === 0) {
      alert('لا توجد بيانات درجات للتصدير.');
      return;
    }

    let csv = '\uFEFF';
    csv += `مركز الهدى لتعليم القرآن الكريم - كشف درجات الحلقة\n`;
    csv += `الاختبار:,${activeExam.title}\n`;
    csv += `المنهج:,${activeExam.curriculum}\n`;
    csv += `الحلقة:,${activeCircleObj.name}\n`;
    csv += `المعلم:,${activeCircleObj.teacherName}\n`;
    csv += `الفترة:,${activePeriod?.name || activeExam.periodName}\n`;
    csv += `تاريخ الاستخراج:,${new Date().toLocaleDateString('ar-SA')}\n\n`;

    const headers = ['#', 'اسم الطالب', 'رقم الهوية / الأكاديمي'];
    activeExam.criteria.forEach(c => headers.push(`${c.name} (${c.maxScore})`));
    headers.push(`المجموع (${activeExam.maxTotalScore})`, 'النسبة %', 'حالة الاختبار', 'ملاحظات');
    csv += headers.join(',') + '\n';

    computedRoster.forEach((r, idx) => {
      const row = [idx + 1, `"${r.studentName}"`, r.nationalId];
      activeExam.criteria.forEach(c => row.push(r.scores[c.id] !== undefined ? r.scores[c.id] : ''));
      row.push(r.totalScore, `${r.percentage}%`, `"${r.status}"`, `"${r.notes}"`);
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_درجات_${activeCircleObj.name.replace(/\s+/g, '_')}_${activeExam.title.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // EXPORT PRINTABLE PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-right font-sans print:p-0 print:m-0">
      
      {/* TOAST ALERTS */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-3.5 rounded-2xl flex items-center justify-between shadow-md print:hidden"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700 font-bold text-sm cursor-pointer">✕</button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-3.5 rounded-2xl flex items-center justify-between shadow-md print:hidden"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-700 font-bold text-sm cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER TITLE BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-0.5 rounded-full">
              لوحة الاختبارات والمنهج الموحدة
            </span>
            {activePeriod?.status === 'closed' ? (
              <span className="bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="h-3 w-3" /> فترة مغلقة
              </span>
            ) : activePeriod?.status === 'archived' ? (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Archive className="h-3 w-3" /> فترة مؤرشفة
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> فترة نشطة
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Award className="h-7 w-7 text-emerald-700" />
            <span>نظام إدارة المناهج والاختبارات وإدخال درجات الحلقات</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            ربط متكامل بين الفترات، المناهج، الاختبارات، الحلقات، درجات الطلاب، التقارير التنفيذية، والأرشيف
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManagePeriods && (
            <button
              onClick={() => setShowNewPeriodModal(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>منهج جديد</span>
            </button>
          )}

          {canManagePeriods && (
            <button
              onClick={() => setShowNewExamModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>إنشاء اختبار جديد</span>
            </button>
          )}

          <button
            onClick={() => setShowAuditModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="سجل تعديلات الدرجات"
          >
            <History className="h-4 w-4 text-slate-600" />
            <span>سجل التعديلات ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS & NAVIGATION BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        
        {/* TOP SELECTORS: PERIOD, EXAM, CIRCLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. PERIOD SELECTOR */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">1. اختر المنهج</label>
            <select
              value={selectedPeriodId}
              onChange={e => setSelectedPeriodId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.status === 'closed' ? 'مغلقة' : p.status === 'archived' ? 'مؤرشفة' : 'مفتوحة'}]
                </option>
              ))}
            </select>
          </div>

          {/* 2. EXAM SELECTOR */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">2. الاختبار الفرعي والمنهج</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {periodExams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.curriculum})
                </option>
              ))}
            </select>
          </div>

          {/* 3. CIRCLE SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 block">3. اختيار الحلقة القرآنية</label>
              {!canSelectCircle && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  مخصصة لحلقتك فقط
                </span>
              )}
            </div>
            <select
              value={selectedCircleId}
              onChange={e => setSelectedCircleId(e.target.value)}
              disabled={!canSelectCircle}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {availableCircles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — ({c.teacherName})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* NAVIGATION TABS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            
            <button
              onClick={() => setActiveTab('circle_entry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'circle_entry'
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>استعراض نتائج الحلقة</span>
            </button>

            {canManagePeriods && (
              <button
                onClick={() => setActiveTab('periods')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'periods'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>فترات التقييم</span>
              </button>
            )}

            {canManagePeriods && (
              <button
                onClick={() => setActiveTab('circle_analysis')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'circle_analysis'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>تحليل الحلقة والتعثر ({atRiskStudents.length})</span>
              </button>
            )}

            {canViewCrossComparison && (
              <button
                onClick={() => setActiveTab('cross_comparison')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cross_comparison'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>المقارنة بين الحلقات</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('curriculum_index')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'curriculum_index'
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>مؤشر المنهج</span>
            </button>

            {canManagePeriods && (
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'archive'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>الأرشيف الشامل</span>
              </button>
            )}

          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>طباعة PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* TAB 1: CIRCLE STUDENT ROSTER & DIRECT INLINE GRADE ENTRY */}
      {activeTab === 'circle_entry' && activeExam && (
        <div className="space-y-5">
          
          {/* LIVE CIRCLE METRICS & COMPLETION INDICATOR BAR */}
          <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-emerald-500/30 text-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    {activeCircleObj.name}
                  </span>
                  <span className="text-emerald-200 text-xs font-medium">المعلم: {activeCircleObj.teacherName}</span>
                </div>
                <h2 className="text-xl font-black text-white">{activeExam.title}</h2>
                <p className="text-xs text-emerald-100 font-light">
                  المنهج: <strong className="text-white font-bold">{activeExam.curriculum}</strong> — الدرجة القصوى: <strong className="text-emerald-300 font-mono font-bold">{activeExam.maxTotalScore}</strong> — درجة النجاح: <strong className="text-emerald-300 font-mono font-bold">{activeExam.passScore}</strong>
                </p>
              </div>

              {/* TOP ACTION BUTTONS: FILE PREVIEW & PERMISSION BADGE */}
              <div className="flex flex-wrap items-center gap-2">
                {activeExam.examFileAttachment && (
                  <button
                    onClick={() => setShowExamFilePreviewModal(true)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-amber-300" />
                    <span>استعراض ورقة ومرفق الاختبار ({activeExam.examFileAttachment.type || 'PDF'})</span>
                  </button>
                )}

                {canInputGrades ? (
                  <div className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>صلاحية التعبئة والتعديل (المدير العام والتنفيذي)</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Lock className="h-4 w-4 text-amber-300" />
                    <span>الدرجات مغلقة ومقيدة للإدارة (استعراض فقط لمدرس الحلقة)</span>
                  </div>
                )}
              </div>
            </div>

            {/* SCOPE SELECTION TOGGLE BAR (حلقة واحدة vs جميع الحلقات والترتيب الإجمالي) */}
            <div className="bg-white/10 p-2 rounded-xl border border-white/15 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-300" />
                <span>نطاق استعراض وتقييم الطلاب:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setStudentScope('single_circle')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    studentScope === 'single_circle'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'bg-black/30 text-emerald-100 hover:bg-black/40'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>طلاب الحلقة الحالية ({activeCircleObj.name})</span>
                </button>

                {canManagePeriods && (
                  <button
                    onClick={() => setStudentScope('all_circles')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      studentScope === 'all_circles'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-black/30 text-amber-100 hover:bg-black/40'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>جميع طلاب الحلقات (الترتيب الإجمالي العام)</span>
                  </button>
                )}
              </div>
            </div>

            {/* LIVE METRICS TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-white/10 p-3 rounded-xl border border-white/15 text-center text-xs">
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">إجمالي الطلاب</span>
                <span className="text-lg font-black font-mono">{liveCircleMetrics.total}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">تم إدخالهم</span>
                <span className="text-lg font-black font-mono text-emerald-300">{liveCircleMetrics.entered}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">لم تُدخل الدرجة</span>
                <span className="text-lg font-black font-mono text-amber-300">{liveCircleMetrics.unentered}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">حضر الاختبار</span>
                <span className="text-lg font-black font-mono text-blue-200">{liveCircleMetrics.attended}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">غائب</span>
                <span className="text-lg font-black font-mono text-rose-300">{liveCircleMetrics.absent}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">ناجح</span>
                <span className="text-lg font-black font-mono text-emerald-400">{liveCircleMetrics.passed}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">راسب</span>
                <span className="text-lg font-black font-mono text-rose-400">{liveCircleMetrics.failed}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">متوسط الحلقة</span>
                <span className="text-lg font-black font-mono text-amber-200">{liveCircleMetrics.avgScore}</span>
              </div>
            </div>

            {/* COMPLETION PROGRESS INDICATOR */}
            <div className="bg-black/30 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="text-xs font-bold text-emerald-200">
                  مؤشر اكتمال الدرجات: <span className="font-mono text-white text-sm font-black">{liveCircleMetrics.entered} / {liveCircleMetrics.total}</span> ({liveCircleMetrics.completionPercent}%)
                </div>
                {liveCircleMetrics.completionPercent === 100 ? (
                  <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> اكتمل إدخال درجات الحلقة كاملاً
                  </span>
                ) : (
                  <button
                    onClick={() => setRosterFilter('unentered')}
                    className="bg-amber-500/30 text-amber-200 hover:bg-amber-500/50 border border-amber-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> {liveCircleMetrics.unentered} طلاب لم تكتمل نتائجهم (اضغط للتصفية)
                  </button>
                )}
              </div>

              {/* VISUAL PROGRESS BAR */}
              <div className="w-full sm:w-64 bg-white/20 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500" 
                  style={{ width: `${liveCircleMetrics.completionPercent}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* ROSTER TOOLBAR (SEARCH, FILTER PILLS, SORT) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                placeholder="بحث داخل طلاب الحلقة بالاسم أو الهوية..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setRosterFilter('all')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${rosterFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                الجميع ({computedRoster.length})
              </button>
              <button
                onClick={() => setRosterFilter('unentered')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${rosterFilter === 'unentered' ? 'bg-amber-800 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
              >
                لم تدخل الدرجة ({liveCircleMetrics.unentered})
              </button>
              <button
                onClick={() => setRosterFilter('passed')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${rosterFilter === 'passed' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
              >
                ناجح ({liveCircleMetrics.passed})
              </button>
              <button
                onClick={() => setRosterFilter('failed')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${rosterFilter === 'failed' ? 'bg-rose-800 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}`}
              >
                راسب ({liveCircleMetrics.failed})
              </button>
              <button
                onClick={() => setRosterFilter('absent')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${rosterFilter === 'absent' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                غائب ({liveCircleMetrics.absent})
              </button>
            </div>

            {/* SORT SELECTOR & CRITERIA MANAGEMENT BUTTON */}
            <div className="flex items-center gap-2 flex-wrap">
              {canManagePeriods && (
                <button
                  onClick={() => setShowCriteriaManagerModal(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="إضافة وتعديل وحذف بنود ومعايير الدرجات"
                >
                  <Settings className="h-3.5 w-3.5 text-amber-700" />
                  <span>تعديل/إضافة بنود الاختبار ({activeExam.criteria.length})</span>
                </button>
              )}

              <span className="text-xs font-bold text-slate-500">الترتيب:</span>
              <select
                value={rosterSort}
                onChange={e => setRosterSort(e.target.value as any)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="name">اسم الطالب</option>
                <option value="score_desc">الدرجة من الأعلى</option>
                <option value="score_asc">الدرجة من الأقل</option>
                <option value="status">حالة الاختبار</option>
              </select>
            </div>

          </div>

          {/* MAIN ROSTER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:shadow-none print:border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs font-bold">
                    <th className="p-3 border-b border-slate-700 text-center w-10">#</th>
                    {studentScope === 'all_circles' && (
                      <th className="p-3 border-b border-slate-700 text-center min-w-[80px] bg-amber-900/60 text-amber-200">
                        الترتيب العام
                      </th>
                    )}
                    <th className="p-3 border-b border-slate-700 min-w-[180px]">اسم الطالب (من النظام)</th>
                    {studentScope === 'all_circles' && (
                      <th className="p-3 border-b border-slate-700 min-w-[150px]">الحلقة والمعلم</th>
                    )}
                    
                    {/* CRITERIA COLUMNS WITH EDIT & DELETE CONTROLS */}
                    {activeExam.criteria.map(crit => (
                      <th key={crit.id} className="p-2.5 border-b border-slate-700 text-center min-w-[100px] group relative bg-slate-800 hover:bg-slate-750 transition-all">
                        <div className="flex items-center justify-center gap-1 font-black text-emerald-300">
                          <span>{crit.name}</span>
                          {canManagePeriods && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 print:hidden">
                              <button
                                onClick={() => setEditingCriterion({ id: crit.id, name: crit.name, maxScore: crit.maxScore })}
                                className="p-0.5 text-amber-300 hover:text-white hover:bg-amber-900/60 rounded transition-all cursor-pointer"
                                title="تعديل المسمى والدرجة"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              {activeExam.criteria.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت أؤكد حذف بند "${crit.name}"؟`)) {
                                      handleDeleteCriterion(crit.id);
                                    }
                                  }}
                                  className="p-0.5 text-rose-300 hover:text-white hover:bg-rose-900/60 rounded transition-all cursor-pointer"
                                  title="حذف هذا البند"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-300 font-normal mt-0.5">
                          أقصى: <strong className="font-mono text-emerald-200 font-bold">{crit.maxScore}</strong>
                        </div>
                      </th>
                    ))}

                    {/* ADD NEW CRITERION COLUMN BUTTON */}
                    {canManagePeriods && (
                      <th className="p-2 border-b border-slate-700 text-center w-10 bg-slate-800/80 print:hidden">
                        <button
                          onClick={() => setShowCriteriaManagerModal(true)}
                          className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white rounded-lg border border-emerald-400/30 transition-all cursor-pointer mx-auto flex items-center justify-center"
                          title="إدارة وإضافة بنود ودرجات جديدة"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </th>
                    )}

                    <th className="p-3 border-b border-slate-700 text-center bg-slate-900 min-w-[80px]">
                      المجموع ({activeExam.maxTotalScore})
                    </th>
                    <th className="p-3 border-b border-slate-700 text-center min-w-[70px]">النسبة %</th>
                    <th className="p-3 border-b border-slate-700 text-center min-w-[130px]">حالة الطالب</th>
                    <th className="p-3 border-b border-slate-700 text-center min-w-[130px]">ملاحظات</th>
                    <th className="p-3 border-b border-slate-700 text-center w-12 print:hidden">سجل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={activeExam.criteria.length + (studentScope === 'all_circles' ? 8 : 6) + (canManagePeriods ? 1 : 0)} className="p-12 text-center text-slate-400 font-bold">
                        لا يوجد طلاب مطبق عليهم خيار التصفية الحالي بهذه الحلقة.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((item, idx) => {
                      const isLocked = activePeriod?.status === 'closed' || activePeriod?.status === 'archived';

                      return (
                        <tr key={item.studentId} className="hover:bg-slate-50 transition-all">
                          <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          {studentScope === 'all_circles' && (
                            <td className="p-3 text-center font-black font-mono bg-amber-50 text-amber-900">
                              {(item as any).overallRank === 1 ? '🥇 الأول' : (item as any).overallRank === 2 ? '🥈 الثاني' : (item as any).overallRank === 3 ? '🥉 الثالث' : `#${(item as any).overallRank}`}
                            </td>
                          )}
                          <td className="p-3 font-bold text-slate-900">
                            <div>{item.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">معرف: {item.studentId}</div>
                          </td>
                          {studentScope === 'all_circles' && (
                            <td className="p-3 text-xs text-slate-700 font-medium">
                              <div className="font-bold text-slate-900">{(item as any).circleName}</div>
                              <div className="text-[10px] text-slate-500">{(item as any).teacherName}</div>
                            </td>
                          )}

                          {/* INLINE SCORE DISPLAY / INPUT FIELDS */}
                          {activeExam.criteria.map(crit => {
                            const currentVal = item.scores[crit.id] !== undefined ? item.scores[crit.id] : '';

                            return (
                              <td key={crit.id} className="p-2 text-center">
                                {canInputGrades ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={crit.maxScore}
                                    step="0.5"
                                    disabled={isLocked && !isGeneralDirector}
                                    value={currentVal}
                                    onChange={e => handleScoreInputChange(item.studentId, crit.id, crit.maxScore, e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const inputs = document.querySelectorAll<HTMLInputElement>(`input[data-crit="${crit.id}"]`);
                                        const currIndex = Array.from(inputs).indexOf(e.currentTarget);
                                        if (currIndex >= 0 && currIndex < inputs.length - 1) {
                                          inputs[currIndex + 1].focus();
                                        }
                                      }
                                    }}
                                    data-crit={crit.id}
                                    placeholder="—"
                                    className="w-16 p-2 text-center bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                ) : (
                                  <span className="font-mono font-bold text-slate-900 text-xs px-2 py-1 bg-slate-100 rounded-lg inline-block min-w-[36px]">
                                    {currentVal !== '' ? currentVal : '—'}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* TOTAL SCORE */}
                          <td className="p-3 text-center font-black text-sm text-emerald-950 bg-slate-50 font-mono">
                            {item.totalScore}
                          </td>

                          {/* PERCENTAGE */}
                          <td className="p-3 text-center font-bold text-slate-800 font-mono">
                            {item.percentage}%
                          </td>

                          {/* OUTCOME / ATTENDANCE STATUS DROPDOWN OR BADGE */}
                          <td className="p-2 text-center">
                            {canInputGrades ? (
                              <select
                                value={item.status}
                                disabled={isLocked && !isGeneralDirector}
                                onChange={e => handleStatusChange(item.studentId, e.target.value as StudentExamStatus)}
                                className={`p-1.5 text-center border rounded-lg font-bold text-xs ${
                                  item.status === 'passed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                  item.status === 'failed' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                                  item.status === 'absent' ? 'bg-slate-200 text-slate-800 border-slate-400' :
                                  item.status === 'not_tested' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <option value="unentered">لم تدخل الدرجة</option>
                                <option value="passed">ناجح</option>
                                <option value="failed">راسب</option>
                                <option value="not_tested">لم يختبر</option>
                                <option value="absent">غائب</option>
                                <option value="postponed">مؤجل</option>
                                <option value="exempt">مستثنى</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-1 text-center rounded-lg font-bold text-xs inline-block ${
                                item.status === 'passed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                item.status === 'failed' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                                item.status === 'absent' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                                item.status === 'not_tested' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {item.status === 'passed' ? 'ناجح' :
                                 item.status === 'failed' ? 'راسب' :
                                 item.status === 'absent' ? 'غائب' :
                                 item.status === 'not_tested' ? 'لم يختبر' :
                                 item.status === 'postponed' ? 'مؤجل' :
                                 item.status === 'exempt' ? 'مستثنى' : 'لم تدخل الدرجة'}
                              </span>
                            )}
                          </td>

                          {/* NOTES INPUT OR VIEW */}
                          <td className="p-2 text-center">
                            {canInputGrades ? (
                              <input
                                type="text"
                                value={item.notes}
                                onChange={e => {
                                  const newNotes = e.target.value;
                                  setAllGrades(prev => {
                                    const examMap = { ...(prev[activeExam.id] || {}) };
                                    if (examMap[item.studentId]) {
                                      examMap[item.studentId].notes = newNotes;
                                    }
                                    return { ...prev, [activeExam.id]: examMap };
                                  });
                                }}
                                placeholder="ملاحظات..."
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            ) : (
                              <span className="text-xs text-slate-600 font-medium px-2 py-1 block truncate max-w-[150px] mx-auto">
                                {item.notes || '—'}
                              </span>
                            )}
                          </td>

                          {/* STUDENT HISTORY MODAL TRIGGER */}
                          <td className="p-3 text-center print:hidden">
                            <button
                              onClick={() => setSelectedStudentHistory(item.student)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                              title="عرض سجل اختبارات الطالب"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER ACTION BAR */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs font-bold text-slate-700">
                إجمالي طلاب الحلقة المقيدين: <span className="font-mono text-emerald-900 font-black">{computedRoster.length}</span> — ملخص النتائج النهائية المعتمدة للمنهج وتفاصيل الأداء.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: EVALUATION PERIODS LIST, INTEGRATED REPORTS & APPROVAL */}
      {activeTab === 'periods' && canManagePeriods && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-5">
            {periods.map(period => {
              const isExpanded = expandedPeriodReportId === period.id;

              return (
                <div key={period.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-right transition-all">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {period.examType}
                        </span>
                        {(period.isApproved || period.status === 'approved') && (
                          <span className="bg-emerald-800 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-300" />
                            معتمد رسمياً
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{period.name}</h3>
                      <p className="text-xs text-slate-500 font-bold">المنهج: <span className="text-emerald-800">{period.curriculum}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        period.status === 'approved' || period.isApproved ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        period.status === 'closed' ? 'bg-slate-200 text-slate-800' :
                        period.status === 'archived' ? 'bg-amber-100 text-amber-900' :
                        'bg-blue-100 text-blue-900'
                      }`}>
                        {period.status === 'approved' || period.isApproved ? 'معتمد رسمياً' : period.status === 'closed' ? 'مغلقة' : period.status === 'archived' ? 'مؤرشفة' : 'مفتوحة للتقييم'}
                      </span>
                    </div>
                  </div>

                  {/* OFFICIAL STAMP SEAL BADGE IF APPROVED */}
                  {(period.isApproved || period.status === 'approved') && (
                    <div className="p-3 bg-emerald-50 border-2 border-emerald-500/80 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-emerald-700" />
                        <div>
                          <div className="font-black text-emerald-950 text-xs">تم توثيق واعتماد تقرير هذا المنهج رسمياً من الإدارة</div>
                          <div className="text-[10px] text-emerald-800 font-medium">اعتمد بواسطة: {period.approvedBy || 'الإدارة العامة'} — {period.approvedAt || 'مؤرخ بالحفظ'}</div>
                        </div>
                      </div>
                      <span className="bg-emerald-700 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-2xs">ختم الاعتماد القيادي ✓</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {period.description || 'لا يوجد وصف مضاف لفترة التقييم والمنهج الحالي.'}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><span className="text-slate-400 block">التاريخ:</span> <strong className="text-slate-800 font-mono">{period.startDate} - {period.endDate}</strong></div>
                    <div><span className="text-slate-400 block">المسؤول:</span> <strong className="text-slate-800">{period.responsible}</strong></div>
                    <div><span className="text-slate-400 block">الدرجة النهائية / النجاح:</span> <strong className="text-emerald-800 font-mono">{period.maxScore} / {period.passScore}</strong></div>
                    <div><span className="text-slate-400 block">الفئة المستهدفة:</span> <strong className="text-slate-800">{period.targetCategory}</strong></div>
                  </div>



                  {/* ACTIONS */}
                  <div className="flex justify-end items-center gap-2 pt-3 border-t">
                    {period.status !== 'closed' && period.status !== 'archived' && canManagePeriods && (
                      <button
                        onClick={() => handleClosePeriod(period.id)}
                        className="bg-slate-800 text-white hover:bg-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        إغلاق الفترة
                      </button>
                    )}
                    {period.status !== 'archived' && canManagePeriods && (
                      <button
                        onClick={() => handleArchivePeriod(period.id)}
                        className="bg-amber-700 text-white hover:bg-amber-800 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        أرشفة الفترة
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CIRCLE ANALYTICS & AT-RISK STUDENTS */}
      {activeTab === 'circle_analysis' && canManagePeriods && (
        <div className="space-y-6">
          
          {/* STATS TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">متوسط درجات الحلقة</span>
              <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">{liveCircleMetrics.avgScore} / {activeExam?.maxTotalScore}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">نسبة النجاح بالحلقة</span>
              <span className="text-2xl font-black text-blue-800 font-mono mt-1 block">{liveCircleMetrics.passRate}%</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">عدد الطلاب الناجحين</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{liveCircleMetrics.passed}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">الطلاب المتعثرون / الغائبون</span>
              <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">{atRiskStudents.length}</span>
            </div>
          </div>

          {/* AT-RISK STUDENTS TABLE ("طلاب يحتاجون متابعة") */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">قائمة الطلاب الذين يحتاجون متابعة وتدخل تعليمي</h3>
              </div>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                {atRiskStudents.length} طالب متعثر أو غائب
              </span>
            </div>

            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <th className="p-3">#</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الدرجة المحصلة</th>
                  <th className="p-3">النسبة</th>
                  <th className="p-3">سبب التعثر</th>
                  <th className="p-3">الإجراء المطلوبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-emerald-800 font-bold">
                      لا يوجد طلاب متعثرون بهذه الحلقة حالياً — جميع نتائج الطلاب متميزة بفضل الله!
                    </td>
                  </tr>
                ) : (
                  atRiskStudents.map((st, idx) => (
                    <tr key={st.studentId} className="hover:bg-rose-50/50">
                      <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{st.studentName}</td>
                      <td className="p-3 font-mono font-bold text-rose-700">{st.totalScore} / {st.maxScore}</td>
                      <td className="p-3 font-mono font-bold">{st.percentage}%</td>
                      <td className="p-3">
                        <span className="bg-rose-100 text-rose-900 font-bold px-2.5 py-0.5 rounded-full">
                          {st.status === 'failed' ? 'رسوب بالدرجة' : st.status === 'absent' ? 'غياب عن الاختبار' : 'درجة منخفضة'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => alert(`تم إرسال تنبيه لمعلم الحلقة ولولي أمر الطالب ${st.studentName} لإدراج خطة إسناد فردية.`)}
                          className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          إطلاق خطة دعم
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: CROSS-CIRCLE COMPARISON */}
      {activeTab === 'cross_comparison' && canViewCrossComparison && (
        <div className="space-y-6">
          
          {/* EXECUTIVE HIGHLIGHT BADGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestCircle && (
              <div className="bg-gradient-to-l from-emerald-800 to-teal-800 text-white p-5 rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-emerald-200 font-bold">🏆 أفضل حلقة أداءً بالاختبار</span>
                <h3 className="text-xl font-black">{bestCircle.circleName}</h3>
                <p className="text-xs text-emerald-100">المعلم: {bestCircle.teacherName} — نسبة النجاح: <strong className="font-mono text-white text-sm">{bestCircle.passRate}%</strong> — المتوسط: <strong className="font-mono text-white text-sm">{bestCircle.avgScore}</strong></p>
              </div>
            )}

            {lowestCircle && (
              <div className="bg-gradient-to-l from-rose-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-rose-200 font-bold">⚠️ أكثر حلقة تحتاج متابعة وإسناد</span>
                <h3 className="text-xl font-black">{lowestCircle.circleName}</h3>
                <p className="text-xs text-rose-100">المعلم: {lowestCircle.teacherName} — نسبة النجاح: <strong className="font-mono text-white text-sm">{lowestCircle.passRate}%</strong> — المتوسط: <strong className="font-mono text-white text-sm">{lowestCircle.avgScore}</strong></p>
              </div>
            )}
          </div>

          {/* 2-CIRCLE DIRECT COMPARISON TOOL */}
          {(() => {
            const c1Obj = crossCircleStats.find(c => c.circleId === compareCircle1Id) || crossCircleStats[0];
            const c2Obj = crossCircleStats.find(c => c.circleId === compareCircle2Id) || crossCircleStats[1] || crossCircleStats[0];

            return (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-5 border border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Layers className="h-4 w-4" />
                      <span>أداة المقارنة المباشرة بين حلقتين (خاص بالموجه الفني والإدارة)</span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">مقارنة أداء ونسب نتائج حلقتين محددتين</h3>
                  </div>
                </div>

                {/* CIRCLE SELECTORS FOR COMPARISON */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                    <label className="text-xs font-bold text-emerald-300 block">اختر الحلقة الأولى:</label>
                    <select
                      value={compareCircle1Id}
                      onChange={e => setCompareCircle1Id(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableCircles.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — ({c.teacherName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                    <label className="text-xs font-bold text-blue-300 block">اختر الحلقة الثانية للمقارنة:</label>
                    <select
                      value={compareCircle2Id}
                      onChange={e => setCompareCircle2Id(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {availableCircles.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — ({c.teacherName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SIDE BY SIDE COMPARISON CARDS */}
                {c1Obj && c2Obj && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* CIRCLE 1 CARD */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-emerald-500/40 space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-700/80 pb-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">الحلقة الأولى</span>
                          <h4 className="text-base font-black text-white mt-1">{c1Obj.circleName}</h4>
                          <p className="text-xs text-slate-300">المعلم: {c1Obj.teacherName}</p>
                        </div>
                        {c1Obj.avgScore > c2Obj.avgScore && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            🏆 أعلى متوسط
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">إجمالي الطلاب</span>
                          <span className="font-mono font-bold text-white text-sm">{c1Obj.totalStudents} طالب</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">حضروا الاختبار</span>
                          <span className="font-mono font-bold text-white text-sm">{c1Obj.testedCount} طالب</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">نسبة النجاح</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">{c1Obj.passRate}%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">متوسط الدرجة</span>
                          <span className="font-mono font-bold text-blue-300 text-sm">{c1Obj.avgScore} / 100</span>
                        </div>
                      </div>
                    </div>

                    {/* CIRCLE 2 CARD */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-blue-500/40 space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-700/80 pb-2">
                        <div>
                          <span className="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">الحلقة الثانية</span>
                          <h4 className="text-base font-black text-white mt-1">{c2Obj.circleName}</h4>
                          <p className="text-xs text-slate-300">المعلم: {c2Obj.teacherName}</p>
                        </div>
                        {c2Obj.avgScore > c1Obj.avgScore && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            🏆 أعلى متوسط
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">إجمالي الطلاب</span>
                          <span className="font-mono font-bold text-white text-sm">{c2Obj.totalStudents} طالب</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">حضروا الاختبار</span>
                          <span className="font-mono font-bold text-white text-sm">{c2Obj.testedCount} طالب</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">نسبة النجاح</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">{c2Obj.passRate}%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] block font-bold">متوسط الدرجة</span>
                          <span className="font-mono font-bold text-blue-300 text-sm">{c2Obj.avgScore} / 100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* COMPARISON TABLE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-base">جدول المقارنة الموحد بين الحلقات المشمولة بالاختبار</h3>

            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-3">الحلقة القرآنية</th>
                  <th className="p-3">المعلم المسؤول</th>
                  <th className="p-3 text-center">عدد الطلاب</th>
                  <th className="p-3 text-center">حضر الاختبار</th>
                  <th className="p-3 text-center">نسبة النجاح %</th>
                  <th className="p-3 text-center">متوسط الدرجات</th>
                  <th className="p-3 text-center">حالة إدخال الدرجات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {crossCircleStats.map(item => (
                  <tr key={item.circleId} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-slate-900">{item.circleName}</td>
                    <td className="p-3 text-slate-700">{item.teacherName}</td>
                    <td className="p-3 text-center font-mono font-bold">{item.totalStudents}</td>
                    <td className="p-3 text-center font-mono font-bold">{item.testedCount}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">{item.passRate}%</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-900">{item.avgScore}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        item.entryState === 'completed' ? 'bg-emerald-100 text-emerald-900' :
                        item.entryState === 'in_progress' ? 'bg-amber-100 text-amber-900' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {item.entryState === 'completed' ? 'مكتمل' : item.entryState === 'in_progress' ? 'قيد التنفيذ' : 'غير مبدوء'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 5: OVERALL CURRICULUM SUCCESS INDICATOR */}
      {activeTab === 'curriculum_index' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">المؤشر العام لنجاح المنهج القرآني</h3>
                <p className="text-xs text-slate-500 mt-1">احتساب دقيق لدرجة كفاءة المنهج بناءً على أوزان النجاح والمتوسط والحضور</p>
              </div>
              {canManagePeriods && (
                <button
                  onClick={() => setShowFormulaModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span>تعديل معادلة الحساب</span>
                </button>
              )}
            </div>

            {/* CURRICULUM SCORE GAUGE */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-5 bg-gradient-to-b from-emerald-900 to-teal-900 text-white rounded-2xl shadow-md col-span-1 md:col-span-1 flex flex-col justify-center items-center">
                <span className="text-xs font-bold text-emerald-200 block mb-1">درجة مؤشر نجاح المنهج</span>
                <span className="text-4xl font-black font-mono text-white">{curriculumSuccessIndex.weightedScore}%</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-3 py-0.5 rounded-full mt-2 font-bold">
                  أداء متميز وجيد جداً
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 block">نسبة النجاح المباشرة</span>
                <span className="text-2xl font-black text-emerald-800 font-mono mt-1">{curriculumSuccessIndex.avgPassRate}%</span>
                <span className="text-[10px] text-slate-400 mt-1">الوزن بالمعادلة: {formulaComponents.find(c => c.name.includes('نجاح'))?.weight || 40}%</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 block">متوسط الدرجات الكلي</span>
                <span className="text-2xl font-black text-blue-900 font-mono mt-1">{curriculumSuccessIndex.avgScoreOverall}</span>
                <span className="text-[10px] text-slate-400 mt-1">الوزن بالمعادلة: {formulaComponents.find(c => c.name.includes('متوسط'))?.weight || 40}%</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 block">نسبة حضور وتأدية الاختبارات</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1">{curriculumSuccessIndex.attendanceRate}%</span>
                <span className="text-[10px] text-slate-400 mt-1">الوزن بالمعادلة: {formulaComponents.find(c => c.name.includes('حضور'))?.weight || 20}%</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 7: FULL SEARCHABLE ARCHIVE */}
      {activeTab === 'archive' && canManagePeriods && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2">
              <Archive className="h-6 w-6 text-amber-700" />
              <h3 className="font-black text-slate-900 text-lg">الأرشيف الشامل للفترات والاختبارات</h3>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
              {periods.filter(p => p.status === 'archived').length} فترة مؤرشفة
            </span>
          </div>

          <p className="text-xs text-slate-600">
            يمكنك البحث في جميع السجلات والأرشيفات السابقة بحسب السنة، الفترة، المنهج، الاختبار، أو الحلقة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {periods.filter(p => p.status === 'archived').length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                لا توجد فترات تقييم نقلت للأرشيف حتى الآن.
              </div>
            ) : (
              periods.filter(p => p.status === 'archived').map(arch => (
                <div key={arch.id} className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                  <h4 className="font-black text-slate-900 text-sm">{arch.name}</h4>
                  <p className="text-xs text-slate-500">المنهج: {arch.curriculum}</p>
                  <div className="text-[11px] text-slate-400 font-mono">تاريخ الأرشفة: {arch.createdAt}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW PERIOD */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">إنشاء فترة تقييم جديدة</h3>
              <button onClick={() => setShowNewPeriodModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الفترة *</label>
                <input
                  type="text"
                  value={newPeriodForm.name}
                  onChange={e => setNewPeriodForm({ ...newPeriodForm, name: e.target.value })}
                  placeholder="مثال: الفصل الأول 1447هـ - الفترة الثالثة"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم المنهج</label>
                  <input
                    type="text"
                    value={newPeriodForm.curriculum}
                    onChange={e => setNewPeriodForm({ ...newPeriodForm, curriculum: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الاختبار</label>
                  <select
                    value={newPeriodForm.examType}
                    onChange={e => setNewPeriodForm({ ...newPeriodForm, examType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="شهري">شهري</option>
                    <option value="فصلي">فصلي</option>
                    <option value="نهائي">نهائي</option>
                    <option value="تقييم مستمر">تقييم مستمر</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الدرجة النهائية</label>
                  <input
                    type="number"
                    value={newPeriodForm.maxScore}
                    onChange={e => setNewPeriodForm({ ...newPeriodForm, maxScore: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">درجة النجاح</label>
                  <input
                    type="number"
                    value={newPeriodForm.passScore}
                    onChange={e => setNewPeriodForm({ ...newPeriodForm, passScore: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف فترة التقييم</label>
                <textarea
                  rows={2}
                  value={newPeriodForm.description}
                  onChange={e => setNewPeriodForm({ ...newPeriodForm, description: e.target.value })}
                  placeholder="وصف وتوجيهات الفترة..."
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewPeriodModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-900 cursor-pointer"
                >
                  حفظ وتجهيز الفترة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW EXAM WITH ATTACHMENT */}
      {showNewExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">إنشاء اختبار فرعي جديد وإرفاق نموذج الأسئلة</h3>
              <button onClick={() => setShowNewExamModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان الاختبار *</label>
                <input
                  type="text"
                  value={newExamForm.title}
                  onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  placeholder="مثال: اختبار شهر ربيع الأول - سورة النساء"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المنهج التابع</label>
                  <select
                    value={selectedPeriodId}
                    onChange={e => setSelectedPeriodId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الاختبار</label>
                  <input
                    type="text"
                    value={newExamForm.date}
                    onChange={e => setNewExamForm({ ...newExamForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* FILE ATTACHMENT SECTION */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-black text-amber-900 block flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <span>إرفاق نموذج ورقة الأسئلة والتوجيهات (PDF / Docx)</span>
                  </label>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    اختياري
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الملف المرفق</label>
                  <input
                    type="text"
                    value={newExamForm.examFileName}
                    onChange={e => setNewExamForm({ ...newExamForm, examFileName: e.target.value })}
                    placeholder="مثال: نموذج_أسئلة_سورة_البقرة_الفصل2.pdf"
                    className="w-full p-2 bg-white border rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نص أسئلة وملاحظات الاختبار للمصححين</label>
                  <textarea
                    rows={3}
                    value={newExamForm.examFileContent}
                    onChange={e => setNewExamForm({ ...newExamForm, examFileContent: e.target.value })}
                    placeholder="اكتب الأسئلة أو التعليمات الموجهة للمشرفين هنا..."
                    className="w-full p-2 bg-white border rounded-lg text-xs"
                  />
                </div>

                {/* PRESETS BUTTONS */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">نماذج جاهزة:</span>
                  <button
                    type="button"
                    onClick={() => setNewExamForm({
                      ...newExamForm,
                      examFileName: 'جدول_أسئلة_سورة_البقرة.pdf',
                      examFileContent: 'س1: اتلُ من قوله تعالى: (وَإِذِ ابْتَلَى إِبْرَاهِيمَ رَبُّهُ بِكَلِمَاتٍ...)\nس2: اتلُ من قوله تعالى: (سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ...)\nس3: اتلُ من قوله تعالى: (يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ...)'
                    })}
                    className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-1 rounded-md cursor-pointer"
                  >
                    أسئلة سورة البقرة
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExamForm({
                      ...newExamForm,
                      examFileName: 'نموذج_الأجزاء_الثلاثة_الأولى.pdf',
                      examFileContent: 'س1: اتلُ من بداية الجزء الثاني.\nس2: اتلُ من بداية الجزء الثالث.\nس3: استخرج أحكام الإخفاء الحقيقي والإظهار الحلقي في الآيات المرتلة.'
                    })}
                    className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-1 rounded-md cursor-pointer"
                  >
                    أسئلة الأجزاء الثلاثة
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-teal-800 text-white px-5 py-2 rounded-xl font-bold hover:bg-teal-900 cursor-pointer"
                >
                  إنشاء الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: EXAM FILE PREVIEW MODAL */}
      {showExamFilePreviewModal && activeExam?.examFileAttachment && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-amber-700" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">استعراض مرفق ورقة الاختبار الرسمية</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeExam.examFileAttachment.name}</p>
                </div>
              </div>
              <button onClick={() => setShowExamFilePreviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            {/* PREVIEW SHEET CONTENT */}
            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200/80 space-y-4 text-xs font-sans">
              <div className="flex justify-between items-center border-b border-amber-200 pb-3 font-bold text-slate-800">
                <div>نوع المستند: <span className="font-mono text-amber-900">{activeExam.examFileAttachment.type}</span></div>
                <div>حجم الملف: <span className="font-mono text-amber-900">{activeExam.examFileAttachment.size}</span></div>
                <div>تاريخ الرفع: <span className="font-mono text-amber-900">{activeExam.examFileAttachment.uploadDate}</span></div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">نص وتوجيهات أوراق الأسئلة المعتمدة:</h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                  {activeExam.examFileAttachment.contentPreview || 'لا تتوفر معاينة نصية سريعة لهذا الملف.'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <h5 className="font-bold text-amber-950 text-xs">معايير الدرجات المقررة لهذه الورقة:</h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeExam.criteria.map(c => (
                    <span key={c.id} className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                      {c.name}: <strong className="font-mono text-amber-950">{c.maxScore} درجة</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={handlePrintPDF}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-400" />
                <span>طباعة ورقة الاختبار</span>
              </button>

              <button
                onClick={() => setShowExamFilePreviewModal(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FILTERABLE AUDIT TRAIL MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">سجل التدقيق والتغييرات في الدرجات</h3>
                <p className="text-xs text-slate-500">متابعة كافة تعديلات المصححين بحسب الفترة والمنهج والاختبار</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            {/* AUDIT FILTER BAR */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">تصفية بحسب الفترة:</label>
                <select
                  value={auditPeriodFilter}
                  onChange={e => setAuditPeriodFilter(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  <option value="all">جميع فترات التقييم</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تصفية بحسب الاختبار:</label>
                <select
                  value={auditExamFilter}
                  onChange={e => setAuditExamFilter(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  <option value="all">جميع الاختبارات</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LOGS LIST */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLogs.filter(log => {
                if (auditPeriodFilter !== 'all' && log.periodId && log.periodId !== auditPeriodFilter) return false;
                if (auditExamFilter !== 'all' && log.examId && log.examId !== auditExamFilter) return false;
                return true;
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">لا توجد تعديلات مسجلة تطابق التصفية الحالية.</div>
              ) : (
                auditLogs.filter(log => {
                  if (auditPeriodFilter !== 'all' && log.periodId && log.periodId !== auditPeriodFilter) return false;
                  if (auditExamFilter !== 'all' && log.examId && log.examId !== auditExamFilter) return false;
                  return true;
                }).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {log.studentName}
                        </span>
                        <span>— {log.examTitle}</span>
                        {log.periodName && <span className="text-[10px] text-slate-500 font-normal">({log.periodName})</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-600">
                      الدرجة السابقة: <strong className="text-rose-700 font-mono">{log.previousScore}</strong> ← الدرجة الجديدة: <strong className="text-emerald-700 font-mono">{log.newScore}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">بواسطة: {log.modifiedBy} | السبب: {log.reason}</div>
                  </div>
                ))
              )}
            </div>

            <div className="text-left pt-2 border-t">
              <button
                onClick={() => setShowAuditModal(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CURRICULUM FORMULA WEIGHTS WITH DYNAMIC COMPONENT ADJUSTMENT */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">تعديل أوزان ومعايير معادلة نجاح المنهج</h3>
                <p className="text-xs text-slate-500">يمكنك إضافة أو حذف أو تعديل نسبة كل معيار ديناميكياً</p>
              </div>
              <button onClick={() => setShowFormulaModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
              {formulaComponents.map((comp, idx) => (
                <div key={comp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="font-bold text-slate-700 block mb-1 text-[10px]">اسم المعيار #{idx + 1}</label>
                    <input
                      type="text"
                      value={comp.name}
                      onChange={e => {
                        const newName = e.target.value;
                        setFormulaComponents(prev => prev.map(item => item.id === comp.id ? { ...item, name: newName } : item));
                      }}
                      className="w-full p-1.5 bg-white border rounded-lg font-bold text-slate-900 text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <label className="font-bold text-slate-700 block mb-1 text-[10px]">الوزن (%)</label>
                    <input
                      type="number"
                      value={comp.weight}
                      onChange={e => {
                        const newW = Number(e.target.value) || 0;
                        setFormulaComponents(prev => prev.map(item => item.id === comp.id ? { ...item, weight: newW } : item));
                      }}
                      className="w-full p-1.5 bg-white border rounded-lg font-mono font-bold text-slate-900 text-center text-xs"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (formulaComponents.length <= 1) return;
                      setFormulaComponents(prev => prev.filter(item => item.id !== comp.id));
                    }}
                    className="mt-4 p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="حذف هذا المعيار"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setFormulaComponents(prev => [
                    ...prev,
                    { id: 'f-' + Date.now(), name: 'معيار تقييم جديد', weight: 10 }
                  ]);
                }}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-dashed border-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة معيار جديد للمعادلة</span>
              </button>

              {/* TOTAL WEIGHT BADGE */}
              <div className="p-2.5 bg-slate-100 rounded-xl border flex justify-between items-center text-xs font-bold">
                <span>مجموع أوزان المعادلة الحالي:</span>
                <span className={`font-mono text-sm ${
                  formulaComponents.reduce((a, b) => a + Number(b.weight || 0), 0) === 100 ? 'text-emerald-800 font-black' : 'text-rose-700 font-black'
                }`}>
                  {formulaComponents.reduce((a, b) => a + Number(b.weight || 0), 0)}%
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer"
              >
                حفظ ومعايرة المعادلة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: STUDENT TEST HISTORY */}
      {selectedStudentHistory && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">سجل نتائج واختبارات الطالب</h3>
                <p className="text-xs text-emerald-800 font-bold">{selectedStudentHistory.name} ({selectedStudentHistory.id})</p>
              </div>
              <button onClick={() => setSelectedStudentHistory(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto text-xs">
              {exams.map(ex => {
                const rec = (allGrades[ex.id] || {})[selectedStudentHistory.id];
                return (
                  <div key={ex.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{ex.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${rec?.status === 'passed' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                        {rec?.status === 'passed' ? 'ناجح' : rec?.status === 'failed' ? 'راسب' : 'لم تُدخل'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      الدرجة: <strong className="text-slate-900 font-mono">{rec?.totalScore || '—'} / {ex.maxTotalScore}</strong> ({rec?.percentage || 0}%)
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-left pt-2 border-t">
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CRITERIA MANAGER MODAL */}
      {showCriteriaManagerModal && activeExam && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">إدارة وتعديل بنود ومعايير الدرجات</h3>
                  <p className="text-xs text-slate-500">{activeExam.title} — المجموع الحسابي الأقصى: <strong className="text-emerald-800 font-mono font-bold">{activeExam.maxTotalScore} درجة</strong></p>
                </div>
              </div>
              <button onClick={() => setShowCriteriaManagerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            {/* EXISTING CRITERIA LIST */}
            <div className="space-y-2 max-h-64 overflow-y-auto p-1">
              <h4 className="font-black text-slate-900 text-xs">بنود التقييم الحالية للاختبار:</h4>
              {activeExam.criteria.map((crit, idx) => (
                <div key={crit.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                    <input
                      type="text"
                      defaultValue={crit.name}
                      onBlur={e => {
                        if (e.target.value !== crit.name) {
                          handleSaveCriterionEdit(crit.id, e.target.value, crit.maxScore);
                        }
                      }}
                      className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div className="w-28 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0">أقصى:</span>
                    <input
                      type="number"
                      defaultValue={crit.maxScore}
                      onBlur={e => {
                        const val = Number(e.target.value);
                        if (val !== crit.maxScore && val > 0) {
                          handleSaveCriterionEdit(crit.id, crit.name, val);
                        }
                      }}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-center"
                    />
                  </div>

                  {activeExam.criteria.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت أؤكد حذف بند "${crit.name}"؟`)) {
                          handleDeleteCriterion(crit.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="حذف هذا المعيار"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ADD NEW CRITERION FORM */}
            <form onSubmit={handleAddNewCriterion} className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <h4 className="font-black text-emerald-950 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-emerald-700" />
                <span>إضافة بند اختباري جديد للمجموع:</span>
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCritForm.name}
                  onChange={e => setNewCritForm({ ...newCritForm, name: e.target.value })}
                  placeholder="مثال: التفسير وحفظ أسباب النزول"
                  className="flex-1 p-2 bg-white border border-emerald-300 rounded-lg text-slate-900 font-bold"
                  required
                />
                <div className="w-28 flex items-center gap-1">
                  <span className="text-[10px] text-slate-600 font-bold shrink-0">أقصى:</span>
                  <input
                    type="number"
                    value={newCritForm.maxScore}
                    onChange={e => setNewCritForm({ ...newCritForm, maxScore: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900 font-mono font-bold text-center"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-lg cursor-pointer shrink-0"
                >
                  إضافة البند
                </button>
              </div>
            </form>

            {/* TOTAL CAPACITY BAR */}
            <div className="p-3 bg-slate-100 rounded-xl border flex justify-between items-center text-xs font-bold">
              <span>المجموع الإجمالي الأقصى للاختبار حالياً:</span>
              <span className="font-mono text-emerald-900 font-black text-sm">{activeExam.maxTotalScore} درجة</span>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowCriteriaManagerModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق وتطبيق المعايير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: SINGLE CRITERION QUICK EDIT */}
      {editingCriterion && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">تعديل بند التقييم والدرجة القصوى</h3>
              <button onClick={() => setEditingCriterion(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم البند / المعيار</label>
                <input
                  type="text"
                  value={editingCriterion.name}
                  onChange={e => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الدرجة القصوى للبند</label>
                <input
                  type="number"
                  value={editingCriterion.maxScore}
                  onChange={e => setEditingCriterion({ ...editingCriterion, maxScore: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t text-xs font-bold">
              <button
                onClick={() => setEditingCriterion(null)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveCriterionEdit(editingCriterion.id, editingCriterion.name, editingCriterion.maxScore)}
                className="bg-emerald-800 text-white px-5 py-2 rounded-xl hover:bg-emerald-900 cursor-pointer"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
