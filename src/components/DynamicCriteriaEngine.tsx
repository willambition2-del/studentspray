/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, Plus, Trash2, Edit3, Check, X, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Layers, Award, Users, BookOpen, Sparkles, 
  TrendingUp, BarChart2, Info, CheckCircle2, Layout, HelpCircle, Save, 
  ChevronRight, ArrowLeftRight, Heart, Star, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for our Dynamic Evaluation Criteria System
export interface Criterion {
  id: string;
  name: string;
  description: string;
  type: 'numeric' | 'percentage' | 'yes_no' | 'average';
  unit: 'teacher' | 'student' | 'circle' | 'general';
  weight: number; // Percentage (e.g. 25 for 25%)
  calculationMethod: string; // Dynamic text describing the formula
  isDefault?: boolean;
}

// Representing entities to evaluate using criteria
export interface SimEntity {
  id: string;
  name: string;
  category: 'teacher' | 'student' | 'circle';
  // Standard base metric values normalized on a 0-100 scale
  values: Record<string, number>; 
  subLabel: string;
}

export default function DynamicCriteriaEngine() {
  // --- STATE FOR CURRENT SYSTEM CRITERIA ---
  const [criteria, setCriteria] = useState<Criterion[]>([
    // Teachers (المدرسون) criteria
    { 
      id: 'tch-attendance', 
      name: 'نسبة قياس الحضور والانضباط الميداني', 
      description: 'حساب نسبة الالتزام بالحضور الصباحي والمسائي وتجنب التأكيدات الفردية المتأخرة.', 
      type: 'percentage', 
      unit: 'teacher', 
      weight: 20, 
      calculationMethod: 'عدد أيام الحضور الفعلي ÷ عدد أيام التكليف الإجمالية × 100',
      isDefault: true 
    },
    { 
      id: 'tch-plans', 
      name: 'نسبة إنجاز الخطط والمقررات للطلاب', 
      description: 'مدى مطابقة التحفيظ الفعلي في الحلقة مع الخطة المحددة مسبقاً في بداية الفصل.', 
      type: 'percentage', 
      unit: 'teacher', 
      weight: 30, 
      calculationMethod: 'مجموع الأجزاء والأسطر المحفوظة فعلياً ÷ المستهدف المرحلي المخطط × 100',
      isDefault: true 
    },
    { 
      id: 'tch-quality', 
      name: 'جودة التدريس والمخارج والتقييم الصوتي', 
      description: 'رصد الجودة العميقة للمدرس في مخارج الحروف، أحكام التجويد والتمكن العلمي كأثر مستدام.', 
      type: 'numeric', 
      unit: 'teacher', 
      weight: 25, 
      calculationMethod: 'تقييم زيارة موجه الحلقات واللجنة العلمية مستنبط من استمارة الضبط (0 - 100)',
      isDefault: true 
    },
    { 
      id: 'tch-reports', 
      name: 'التفاعل مع التقارير والانضباط الإداري', 
      description: 'معدل قيام المعلم بتسليم كشوفات الحفظ اليومي ورفع كشوف العلامات عبر التطبيق.', 
      type: 'numeric', 
      unit: 'teacher', 
      weight: 25, 
      calculationMethod: 'عدد التقارير الأسبوعية المرفوعة في وقتها المحدد ÷ إجمالي التقارير المطلوبة × 100',
      isDefault: true 
    },

    // Students (الطلاب) criteria
    { 
      id: 'std-attendance', 
      name: 'نسبة حضور الطالب وحلقات التسميع', 
      description: 'انضباط الحافظ في الحضور اليومي وتفادي الغياب بدون أعذار رسمية مصادقة.', 
      type: 'percentage', 
      unit: 'student', 
      weight: 25, 
      calculationMethod: 'عدد أيام الحضور والجلوس للحفظ ÷ أيام الحلقة الكلية × 100',
      isDefault: true 
    },
    { 
      id: 'std-memorization', 
      name: 'مستوى جودة الحفظ والتدقيق بالرسم', 
      description: 'تقييم المعلم لسلامة تلاوة الطالب ومدى سرعة التسميع بدقة متناهية ودون تلعثم.', 
      type: 'numeric', 
      unit: 'student', 
      weight: 30, 
      calculationMethod: 'متوسط علامات تسميع المقاطع اليومية والأسبوعية مقيساً بمؤشر الخطأ اللفظي (0 - 100)',
      isDefault: true 
    },
    { 
      id: 'std-exams', 
      name: 'نتائج الاختبارات والمسابقات الدورية', 
      description: 'تحصيل الطالب في الاختبارات المنهجية التي تعقدها لجنة الاختبارات المستقلة بالملتقى.', 
      type: 'numeric', 
      unit: 'student', 
      weight: 25, 
      calculationMethod: 'العلامة المتحصلة في الاختبار النصف فصلي لتقييم ثبات جودة الحفظ التراكمي (0 - 100)',
      isDefault: true 
    },
    { 
      id: 'std-compliance', 
      name: 'الالتزام والسرعة في إنهاء الخطة اليومية', 
      description: 'معدل التزام الطالب بورد اليوم المحدد بصفحة الحفظ والمراجعة المقررة.', 
      type: 'percentage', 
      unit: 'student', 
      weight: 20, 
      calculationMethod: 'عدد مواضع الأوراد المنجزة فعلياً ÷ مجموع مواضع الأوراد المنهجية المقررة × 100',
      isDefault: true 
    },

    // Circles (الحلقات) criteria
    { 
      id: 'cir-student-avg', 
      name: 'متوسط الكفاءة العام لطلاب الحلقة', 
      description: 'الأداء والتقييم المشترك لعموم طلاب الحلقة في الاختبارات التراكمية وسبر الأجزاء.', 
      type: 'average', 
      unit: 'circle', 
      weight: 35, 
      calculationMethod: 'متوسط درجات جميع طلاب الحلقة الفعليين المسجلين تحت المعلم (0 - 100)',
      isDefault: true 
    },
    { 
      id: 'cir-plan-compliance', 
      name: 'الالتزام الجماعي بالخطة المنهجية للحلقة', 
      description: 'معدل سير مجمل الحلقة نحو تحقيق الأهداف الفصلية الكبرى ككتلة تعليمية واحدة.', 
      type: 'percentage', 
      unit: 'circle', 
      weight: 25, 
      calculationMethod: 'نسبة الحلقات التمكينية المنجزة وفقاً لجدولة السنة الأكاديمية للملتقى',
      isDefault: true 
    },
    { 
      id: 'cir-attendance', 
      name: 'نسبة الحضور الجماعية لأفراد الحلقة', 
      description: 'متوسط نسب الغياب العام وتأثير ذلك على الفصول والتحفيظ الجماعي الصوتي.', 
      type: 'percentage', 
      unit: 'circle', 
      weight: 20, 
      calculationMethod: 'إجمالي حضور الطلاب المسجلين بالحلَقة ÷ (عدد الطلاب × عدد أيام الدراسة في الشهر)',
      isDefault: true 
    },
    { 
      id: 'cir-execution', 
      name: 'جودة التنفيذ المنهجي والأنشطة للحلقة', 
      description: 'تقييم جودة مخرجات حلقة التحفيظ ومستوى انخراط الطلاب بالأنشطة السلوكية والتثقيفية المنبثقة.', 
      type: 'numeric', 
      unit: 'circle', 
      weight: 20, 
      calculationMethod: 'نقاط تميز السلوك والتفاعل التطوعي للملتقى مرصوداً باستمارة الأنشطة (0 - 100)',
      isDefault: true 
    }
  ]);

  // --- STATE FOR SIMULATING ENTITIES ---
  // Simple database of entities with predefined value records (0 to 100) to apply weights against
  const [teachersDb, setTeachersDb] = useState<SimEntity[]>([
    {
      id: 'TCH-001',
      name: 'فضيلة الشيخ عبد الرحمن بن صالح السعيد',
      category: 'teacher',
      subLabel: 'حلقة حفظ الطليعة (خاتمين)',
      values: {
        'tch-attendance': 98,
        'tch-plans': 95,
        'tch-quality': 98, // rating 4.9 out of 5 -> 98%
        'tch-reports': 90
      }
    },
    {
      id: 'TCH-002',
      name: 'أستاذ حازم عمر الحركي',
      category: 'teacher',
      subLabel: 'حلقة حفص للإتقان (متقدم)',
      values: {
        'tch-attendance': 94,
        'tch-plans': 92,
        'tch-quality': 92, // rating 4.6 -> 92
        'tch-reports': 85
      }
    },
    {
      id: 'TCH-003',
      name: 'الشيخ محمد معوض النخيلي',
      category: 'teacher',
      subLabel: 'حلقة الأشبال الصغار (مبتدئ)',
      values: {
        'tch-attendance': 89,
        'tch-plans': 85,
        'tch-quality': 84, // rating 4.2 -> 84
        'tch-reports': 55
      }
    },
    {
      id: 'TCH-004',
      name: 'الشيخ يونس بن ناصر الدوسري',
      category: 'teacher',
      subLabel: 'شعبة الفقه والعقيدة (متوسط)',
      values: {
        'tch-attendance': 96,
        'tch-plans': 98,
        'tch-quality': 96, // rating 4.8 -> 96
        'tch-reports': 95
      }
    },
    {
      id: 'TCH-005',
      name: 'أستاذ فهد بن محمد الشمري',
      category: 'teacher',
      subLabel: 'اللجنة التنظيمية والدعم الإداري',
      values: {
        'tch-attendance': 85,
        'tch-plans': 80,
        'tch-quality': 82, // rating 4.1 -> 82
        'tch-reports': 70
      }
    },
    {
      id: 'TCH-006',
      name: 'الشيخ تركي بن عائض القحطاني',
      category: 'teacher',
      subLabel: 'حلقة الصغار الموهوبين',
      values: {
        'tch-attendance': 99,
        'tch-plans': 90,
        'tch-quality': 94,
        'tch-reports': 88
      }
    },
    {
      id: 'TCH-007',
      name: 'الشيخ سلمان بن راشد الدوسري',
      category: 'teacher',
      subLabel: 'حلقة الكبار التخصصية',
      values: {
        'tch-attendance': 91,
        'tch-plans': 88,
        'tch-quality': 88,
        'tch-reports': 92
      }
    },
    {
      id: 'TCH-008',
      name: 'الأستاذ عماد الدين بن رشاد',
      category: 'teacher',
      subLabel: 'حلقة التلقين والصغار',
      values: {
        'tch-attendance': 88,
        'tch-plans': 70,
        'tch-quality': 80,
        'tch-reports': 75
      }
    }
  ]);

  const [studentsDb] = useState<SimEntity[]>([
    {
      id: 'STD-101',
      name: 'بدر بن خالد الرشيد',
      category: 'student',
      subLabel: 'حلقة حفظ الطليعة',
      values: {
        'std-attendance': 98,
        'std-memorization': 96,
        'std-exams': 95,
        'std-compliance': 94
      }
    },
    {
      id: 'STD-102',
      name: 'سليمان بن أحمد الوهيبي',
      category: 'student',
      subLabel: 'حلقة حفص للإتقان',
      values: {
        'std-attendance': 92,
        'std-memorization': 90,
        'std-exams': 88,
        'std-compliance': 85
      }
    },
    {
      id: 'STD-103',
      name: 'عبدالمحسن بن مبارك الهاجري',
      category: 'student',
      subLabel: 'حلقة حفظ الطليعة',
      values: {
        'std-attendance': 96,
        'std-memorization': 98,
        'std-exams': 99,
        'std-compliance': 96
      }
    },
    {
      id: 'STD-104',
      name: 'معاذ بن يوسف الدوسري',
      category: 'student',
      subLabel: 'حلقة الأشبال الصغار (أ)',
      values: {
        'std-attendance': 85,
        'std-memorization': 78,
        'std-exams': 80,
        'std-compliance': 72
      }
    }
  ]);

  const [circlesDb] = useState<SimEntity[]>([
    {
      id: 'CIR-001',
      name: 'حلقة حفظ الطليعة النموذجية',
      category: 'circle',
      subLabel: 'المدرس: الشيخ عبد الرحمن السعيد',
      values: {
        'cir-student-avg': 96,
        'cir-plan-compliance': 95,
        'cir-attendance': 98,
        'cir-execution': 95
      }
    },
    {
      id: 'CIR-002',
      name: 'حلقة حفص للإتقان الشامل',
      category: 'circle',
      subLabel: 'المدرس: أ. حازم عمر الحركي',
      values: {
        'cir-student-avg': 89,
        'cir-plan-compliance': 90,
        'cir-attendance': 94,
        'cir-execution': 88
      }
    },
    {
      id: 'CIR-003',
      name: 'حلقة البراعم المبتدئين الأمل',
      category: 'circle',
      subLabel: 'المدرس: الشيخ محمد معوض النخيلي',
      values: {
        'cir-student-avg': 81,
        'cir-plan-compliance': 85,
        'cir-attendance': 89,
        'cir-execution': 80
      }
    }
  ]);

  // --- STATE FOR LIVE WORKSPACE WORKINGS ---
  const [selectedUnit, setSelectedUnit] = useState<'teacher' | 'student' | 'circle'>('teacher');
  const [simulationWeights, setSimulationWeights] = useState<Record<string, number>>({});
  
  // Flag showing if current modifications differ from confirmed criteria
  const [isModified, setIsModified] = useState(false);

  // Add / Edit form of custom Criterion state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [criterionForm, setCriterionForm] = useState<{
    id?: string;
    name: string;
    description: string;
    type: Criterion['type'];
    unit: Criterion['unit'];
    weight: number;
    calculationMethod: string;
  }>({
    name: '',
    description: '',
    type: 'percentage',
    unit: 'teacher',
    weight: 25,
    calculationMethod: ''
  });

  // Simulator Details interactive target to view formula calculations step by step
  const [simulationDetailsTargetId, setSimulationDetailsTargetId] = useState<string | null>(null);

  // Audit Logs inside engine
  const [engineLogs, setEngineLogs] = useState<Array<{
    timestamp: string;
    action: string;
    category: string;
    details: string;
  }>>([
    { timestamp: '2026-06-22T14:40:00', action: 'تأسيس النظام', category: 'تهيئة المعايير', details: 'تأسيس المعايير الافتراضية للنظام بناءً على السياسة الحالية للملتقى.' },
    { timestamp: '2026-06-22T14:52:00', action: 'موازنة عادلة', category: 'محرك التقييم', details: 'تحويل درجات زيارات تفتيش المحفظين تلقائياً لمعامل معياري (0-100).' }
  ]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync simulation working weights state with confirmed criteria on load or selection shift
  useEffect(() => {
    const currentUnitCriteria = criteria.filter(c => c.unit === selectedUnit);
    const weightsMap: Record<string, number> = {};
    currentUnitCriteria.forEach(c => {
      weightsMap[c.id] = c.weight;
    });
    setSimulationWeights(weightsMap);
    setIsModified(false);
    setSimulationDetailsTargetId(null);
  }, [selectedUnit, criteria]);

  // Adjust one criteria weight and check if we are out of sync
  const updateWeight = (id: string, value: number) => {
    const nextWeights = { ...simulationWeights, [id]: Number(value) };
    setSimulationWeights(nextWeights);
    
    // Check if truly modified compared to confirmed persistent array
    let modified = false;
    criteria.filter(c => c.unit === selectedUnit).forEach(c => {
      if (nextWeights[c.id] !== c.weight) {
        modified = true;
      }
    });
    setIsModified(modified);
  };

  // Calculate sum of weights for current unit in simulation mode
  const currentSimulationSum = (Object.values(simulationWeights) as number[]).reduce((a, b) => a + b, 0);

  // Auto-fill or normalize weights uniformly for the selected unit
  const handleAutoEqualize = () => {
    const unitCriteria = criteria.filter(c => c.unit === selectedUnit);
    if (unitCriteria.length === 0) return;
    
    const count = unitCriteria.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 % count;
    
    const nextWeights: Record<string, number> = {};
    unitCriteria.forEach((c, idx) => {
      nextWeights[c.id] = baseWeight + (idx < remainder ? 1 : 0);
    });
    
    setSimulationWeights(nextWeights);
    setIsModified(true);
    showToast('✓ تم موازنة وتقسيم الأوزان بالتساوي بنجاح (المجموع الإجمالي 100%).');
  };

  // Commit simulation weights to the permanent database (Save Criteria Weight updates)
  const handleSaveWeights = () => {
    if (currentSimulationSum !== 100) {
      showToast('⚠️ لا يمكن حفظ الإعدادات! يجب أن يكون مجموع الأوزان مساوياً تماماً لـ 100%.');
      return;
    }

    const updatedCriteria = criteria.map(c => {
      if (c.unit === selectedUnit && simulationWeights[c.id] !== undefined) {
        return { ...c, weight: simulationWeights[c.id] };
      }
      return c;
    });

    setCriteria(updatedCriteria);
    setIsModified(false);
    showToast('✓ تم حفظ واعتماد أوزان المعايير وتحديث مستودع التقييمات في النظام بنجاح!');
    
    // Record log which is displayed inside the auditing system
    const newLog = {
      timestamp: new Date().toISOString().replace('Z', ''),
      action: 'تحديث أوزان',
      category: selectedUnit === 'teacher' ? 'المعلمين' : selectedUnit === 'student' ? 'الطلاب' : 'الحلقات',
      details: `إعادة جدولة نسب الأوزان للمعايير لتصبح: ${Object.entries(simulationWeights).map(([k, v]) => `${k}:${v}%`).join(', ')}`
    };
    setEngineLogs([newLog, ...engineLogs]);
  };

  // Create new criterion handler
  const handleAddCriterionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criterionForm.name.trim()) {
      showToast('يرجى تقديم اسم واضح ومعبر للمعيار المراد تضمينه.');
      return;
    }

    // Basic auto weight optimization: to prevent breaking 100%, we deduct from others or take 0 and let user distribute
    const newId = `${selectedUnit}-${Date.now()}`;
    const newCriterion: Criterion = {
      id: newId,
      name: criterionForm.name,
      description: criterionForm.description || 'لم يتم كتابة وصف إيضاحي للمعيار.',
      type: criterionForm.type,
      unit: criterionForm.unit,
      weight: 0, // start with 0% weight to not violate 100% rule
      calculationMethod: criterionForm.calculationMethod || 'رصد تقييم مباشر متواتر',
      isDefault: false
    };

    setCriteria([...criteria, newCriterion]);
    setShowAddModal(false);
    showToast(`✓ تم إدراج المعيار الجديد "${criterionForm.name}". يرجى موازنة الأوزان ليحظى بنسبة من المجموع.`);
    
    // Reset form
    setCriterionForm({
      name: '',
      description: '',
      type: 'percentage',
      unit: selectedUnit,
      weight: 0,
      calculationMethod: ''
    });
  };

  // Delete criterion handler
  const handleDeleteCriterion = (id: string, unitName: string) => {
    const targetC = criteria.find(c => c.id === id);
    if (targetC?.isDefault) {
      showToast('❌ عذراً! المعايير الدستورية الافتراضية محصنة ضد الحذف لضمان سلامة النواة البرمجية.');
      return;
    }

    const doubleCheck = window.confirm(`هل أنت متأكد من رغبتك الفعلية في إقصاء المعيار "${targetC?.name}" نهائياً من قاعدة البيانات؟`);
    if (!doubleCheck) return;

    const remaining = criteria.filter(c => c.id !== id);
    setCriteria(remaining);

    // Filter simulationWeights
    const nextWeights = { ...simulationWeights };
    delete nextWeights[id];
    
    // Auto re-equalize weights of the remaining criteria
    const currentUnitCriteria = remaining.filter(c => c.unit === selectedUnit);
    if (currentUnitCriteria.length > 0) {
      const count = currentUnitCriteria.length;
      const baseW = Math.floor(100 / count);
      const rem = 100 % count;
      currentUnitCriteria.forEach((c, idx) => {
        nextWeights[c.id] = baseW + (idx < rem ? 1 : 0);
      });
    }

    setSimulationWeights(nextWeights);
    setIsModified(true);
    showToast(`✓ تم حذف المعيار، وإعادة تدوير أوزان البقية تلقائياً لتضمن بقاء المجموع 100%.`);
  };

  // --- STATS COMPUTATION & SIMULATOR ALGORITHMS ---
  const currentActiveEntities = selectedUnit === 'teacher' ? teachersDb 
    : selectedUnit === 'student' ? studentsDb 
    : circlesDb;

  // Function to calculate scores for a given database and criteria set
  const calculateEntityScore = (entity: SimEntity, criteriaSet: Criterion[], weightsToUse: Record<string, number>): number => {
    let weightedSum = 0;
    
    // Fetch relevant criteria for context
    const relativeCriteria = criteriaSet.filter(c => c.unit === selectedUnit);
    
    relativeCriteria.forEach(c => {
      const baseMetricVal = entity.values[c.id] !== undefined ? entity.values[c.id] : 80; // default to 80 if missing
      const criteriaWeight = weightsToUse[c.id] !== undefined ? weightsToUse[c.id] : 0;
      weightedSum += (baseMetricVal * (criteriaWeight / 100));
    });

    return Number(weightedSum.toFixed(1));
  };

  // Generate complete table of currently computed vs. simulated statistics
  const simulationResults = currentActiveEntities.map(entity => {
    // Current Persisted Score (using static criteria weights)
    const weightsPersisted: Record<string, number> = {};
    criteria.filter(c => c.unit === selectedUnit).forEach(c => {
      weightsPersisted[c.id] = c.weight;
    });
    
    const currentScore = calculateEntityScore(entity, criteria, weightsPersisted);
    
    // Simulated Score (using simulationWeights)
    const simulatedScore = calculateEntityScore(entity, criteria, simulationWeights);
    const scoreDiff = Number((simulatedScore - currentScore).toFixed(1));

    return {
      entity,
      currentScore,
      simulatedScore,
      scoreDiff
    };
  });

  // Calculate Ranks & Rank Changes
  // 1. Sort by current criteria score to find original rank
  const originalSorted = [...simulationResults].sort((a, b) => b.currentScore - a.currentScore);
  // 2. Sort by proposed simulated score to find simulated rank
  const simulatedSorted = [...simulationResults].sort((a, b) => b.simulatedScore - a.simulatedScore);

  const finalRankedResults = simulationResults.map(item => {
    const currentRank = originalSorted.findIndex(x => x.entity.id === item.entity.id) + 1;
    const simulatedRank = simulatedSorted.findIndex(x => x.entity.id === item.entity.id) + 1;
    const rankDiff = currentRank - simulatedRank; // positive if rank improved (e.g. from 3 to 1 -> +2)

    return {
      ...item,
      currentRank,
      simulatedRank,
      rankDiff
    };
  });

  // Simulator Meta Statistics (Section 7: "سيؤدي ذلك إلى تغيير ترتيب X مدرسًا")
  const totalRankChangesCount = finalRankedResults.filter(r => r.rankDiff !== 0).length;
  const scoreUpwardsCount = finalRankedResults.filter(r => r.scoreDiff > 0).length;
  const scoreDownwardsCount = finalRankedResults.filter(r => r.scoreDiff < 0).length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="dynamic-criteria-engine-root">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-5 left-5 bg-emerald-950 border-2 border-emerald-500 text-emerald-100 p-4 rounded-xl text-xs sm:text-sm font-bold shadow-2xl z-50 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR AND META DESCRIPTON */}
      <div className="bg-gradient-to-l from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10 max-w-3xl">
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 p-1 px-3.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
            <Sliders className="h-3 w-3" />
            محرك التقييم الذكي اللابرمجي
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display tracking-tight">نظام محرك المعايير التراكمي الديناميكي (Dynamic Weight Engine)</h2>
          <p className="text-slate-350 text-xs md:text-sm font-medium leading-relaxed">
            ابتكار يتيح للمدير العام إدارة وتعديل معايير النقاط، رصد الأوزان وترميزها بنسب مئوية تجمع تلقائياً لتساوي 100%. نظام محاكاة فوري للأثر المترتب لمعرفة تقييمات المدرسين ومراكزهم التنافسية قبل الحفظ والاعتماد.
          </p>
        </div>

        <div className="shrink-0 z-10 bg-slate-800/40 border border-slate-700/50 p-4.5 rounded-2xl space-y-2 text-center w-full md:w-auto">
          <p className="text-[10px] text-slate-400 font-bold">الحالة التشغيلية للمحرك</p>
          <div className="flex items-center justify-center gap-1.5 bg-emerald-900/40 border border-emerald-500/30 p-1 px-3.5 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300">نشط ومعزز بـ WebAssembly</span>
          </div>
        </div>

        {/* Decorative Grid SVG background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* THREE-WAY SEGMENT CONTROL (TEACHERS vs STUDENTS vs CIRCLES) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedUnit('teacher')}
            className={`flex-1 sm:flex-initial p-2.5 px-6 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${selectedUnit === 'teacher' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="h-4 w-4" />
            <span>معايير أداء المدرسين</span>
          </button>
          
          <button
            onClick={() => setSelectedUnit('student')}
            className={`flex-1 sm:flex-initial p-2.5 px-6 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${selectedUnit === 'student' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Award className="h-4 w-4" />
            <span>معايير الطلاب</span>
          </button>

          <button
            onClick={() => setSelectedUnit('circle')}
            className={`flex-1 sm:flex-initial p-2.5 px-6 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${selectedUnit === 'circle' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Layers className="h-4 w-4" />
            <span>معايير قياس الحلقة ككل</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
          <span className="text-slate-400">الوحدة المرتبطة المختارة:</span>
          <span className="p-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg">
            {selectedUnit === 'teacher' ? 'كادر التدريس وسلوك المعلم' 
              : selectedUnit === 'student' ? 'الحفاظ وطلاب المسابقات' 
              : 'الحلقات ومعاهد التحفيظ الفرعية'}
          </span>
        </div>

      </div>

      {/* CORE WEIGHT CONTROL SIDEBAR & CRITERIA LIST PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Simulation Config, Adjust weight sliders (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm font-display">لوحة معايرة الموازين (Proposed Weight Calibration)</h3>
                <p className="text-[11px] text-slate-400">تعديل وزن كل معيار للحصول على المجموع الكلي 100%.</p>
              </div>
              <button
                type="button"
                onClick={handleAutoEqualize}
                className="bg-indigo-50 text-indigo-800 hover:bg-indigo-100 p-1.5 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer border border-indigo-150"
              >
                تقسيم بالتساوي (100%)
              </button>
            </div>

            {/* WEIGHT SLIDER LISTING */}
            <div className="space-y-4 pt-2">
              {criteria.filter(c => c.unit === selectedUnit).map(c => {
                const draftVal = simulationWeights[c.id] || 0;
                return (
                  <div key={c.id} className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 max-w-[240px] truncate">{c.name}</span>
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="bg-indigo-950 text-white font-bold px-1.5 py-0.5 rounded-md min-w-[32px] text-center">
                          {draftVal}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">0%</span>
                      <input 
                        type="range" 
                        min="0"
                        max="100"
                        step="5"
                        value={draftVal}
                        onChange={(e) => updateWeight(c.id, Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-400">100%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ERROR OR SUCCESS SUMMARY OF TOTAL SUM */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center p-3 rounded-xl border font-bold text-xs"
                style={{
                  backgroundColor: currentSimulationSum === 100 ? '#f0fdf4' : '#fef2f2',
                  borderColor: currentSimulationSum === 100 ? '#bbf7d0' : '#fecaca',
                  color: currentSimulationSum === 100 ? '#15803d' : '#b91c1c'
                }}
              >
                <div className="flex items-center gap-1.5">
                  {currentSimulationSum === 100 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600 animate-bounce" />
                  )}
                  <span>إجمالي أوزان النماذج المختارة:</span>
                </div>
                <span className="text-sm font-black font-mono">{currentSimulationSum}%</span>
              </div>

              {currentSimulationSum !== 100 && (
                <p className="text-[10px] text-rose-700 font-bold mt-2 text-center leading-relaxed">
                  ⚠️ المجموع الحالي هو {currentSimulationSum}%. يرجى التعديل بزيادة أو إنقاص الأوزان لتصبح 100% لتتمكن من الاعتماد والحفظ.
                </p>
              )}
            </div>
          </div>

          {/* SIMULATION COMMIT ACTION BOX */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              disabled={currentSimulationSum !== 100 || !isModified}
              onClick={handleSaveWeights}
              className={`w-full py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                currentSimulationSum === 100 && isModified 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:scale-98' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>اعتماد وحفظ موازين المعايير للمنظومة</span>
            </button>
            <p className="text-[9px] text-slate-400 font-medium text-center">
              * بمجرد الحفظ والاعتماد، سيتم ترحيل وتغيير نقاط الحساب ديناميكياً لعموم صفحات المقارنة والتقارير.
            </p>
          </div>

        </div>

        {/* Right Side: Criteria Detailed Cards List (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-800 text-sm font-display">تفاصيل بطاقات المعايير المعتمدة</h3>
              <p className="text-[11px] text-slate-400">المعايير التي تسري داخل هذا الفصل وكيفية احتسابها اللابرمجي.</p>
            </div>
            
            <button
              onClick={() => {
                setCriterionForm({
                  name: '',
                  description: '',
                  type: 'percentage',
                  unit: selectedUnit,
                  weight: 0,
                  calculationMethod: ''
                });
                setShowAddModal(true);
              }}
              className="bg-indigo-950 hover:bg-indigo-900 text-white p-1.5 px-4 rounded-xl text-[11px] font-black tracking-wide flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إدراج معيار مخصص</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteria.filter(c => c.unit === selectedUnit).map((c, idx) => {
              const activeW = c.weight;
              const runningW = simulationWeights[c.id] || 0;
              const hasDiff = activeW !== runningW;

              return (
                <div 
                  key={c.id} 
                  className={`border border-slate-150 rounded-2xl p-4 hover:shadow-2xs transition-all relative flex flex-col justify-between space-y-4 ${
                    hasDiff ? 'border-amber-400 bg-amber-50/10' : 'bg-slate-50/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs text-slate-800 leading-relaxed font-display block">
                        {idx + 1}. {c.name}
                      </span>
                      <span className="p-1 px-2 rounded-md bg-stone-100 text-stone-700 text-[9px] font-black shrink-0">
                        {c.type === 'percentage' ? 'نسبة مئوية %' 
                          : c.type === 'numeric' ? 'رقمي (0-100)' 
                          : c.type === 'average' ? 'متوسط أداء' 
                          : 'منطقي نعم-لا'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal font-medium">{c.description}</p>
                    
                    <div className="bg-white rounded-lg p-2 border border-slate-100 space-y-1">
                      <span className="text-[8px] font-black text-indigo-900 tracking-wide block uppercase">طريقة الحساب:</span>
                      <p className="text-[10px] text-slate-500 font-semibold">{c.calculationMethod}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100/70 text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-400">الوزن المعتمد:</span>
                      <span className="bg-slate-100 text-slate-800 p-0.5 px-2 rounded font-mono text-xs">{activeW}%</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!c.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCriterion(c.id, selectedUnit)}
                          className="text-stone-400 hover:text-rose-600 p-1 hover:bg-rose-50 transition-all rounded"
                          title="حذف المعيار المضاف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 bg-slate-100/50 p-1 px-2.5 rounded font-bold shrink-0">معيار أساسي</span>
                      )}
                    </div>
                  </div>

                  {/* Indicator to show if edited under simulation weights */}
                  {hasDiff && (
                    <div className="absolute -top-2.5 -left-1.5 bg-amber-500 text-white font-bold text-[9px] p-0.5 px-2 rounded-full shadow-3xs flex items-center gap-1 animate-pulse">
                      <span>وزن مستهدف: {runningW}%</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-950 block">آلية التطبيع التلقائي للأوزان والمقاييس (Normalizer Engine)</span>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                جميع المعايير يتم توجيه كاشف النقاط بها لتتبنى مقياس موحد يتراوح من 0 لـ 100. على سبيل المثال، التقييم السلوكي الحلقي للطلاب من فئة نجوم (1-5 نجوم) يُقاس برمجياً كالتالي: (النجوم ÷ 5) × 100 لتفادي حدوث خلل في ضرب المعامل والوزن النسبي المعتمد.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 7: INTERACTIVE SMART SIMULATION PANEL (محرك المحاكاة الفوري) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-6">
        
        {/* Sim Head Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-150">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-yellow-500 rounded-lg text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-sm font-black text-slate-800 font-display">محاكاة الأثر التفاعلي لترتيب المدرسين والطلاب (Evaluation Simulator Engine)</h3>
            </div>
            <p className="text-slate-450 text-[11px] font-semibold">
              شاشة المحاكاة تدرس تأثر الرتب وتتحقق من الترتيب العام في حال اعتماد ومصادقة الأوزان المقترحة حالياً.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-center">
              <p className="text-[9px] text-stone-500 font-bold">تأثر المراكز والترتيب</p>
              <h4 className="text-sm font-black font-mono text-indigo-900 mt-0.5">
                {totalRankChangesCount === 0 ? 'مستقر تماماً (0)' : `تغيير ترتيب ${totalRankChangesCount} سجلات`}
              </h4>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
              <p className="text-[9px] text-emerald-800 font-bold">تدرج بالارتفاع (+)</p>
              <h4 className="text-sm font-black font-mono text-emerald-900 mt-0.5">+{scoreUpwardsCount} كادر</h4>
            </div>

            <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-center">
              <p className="text-[9px] text-red-800 font-bold">تدرج بالانخفاض (-)</p>
              <h4 className="text-sm font-black font-mono text-red-950 mt-0.5">-{scoreDownwardsCount} كادر</h4>
            </div>
          </div>
        </div>

        {/* Live Simulator Table Comparison */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[11px] font-bold text-slate-500 bg-slate-50/50">
                <th className="p-3 text-center w-12 rounded-r-lg">الرتبة الحالية</th>
                <th className="p-3">الكيان الخاضع للمحاكاة</th>
                <th className="p-3 text-center">المقاييس المسجلة حالياً</th>
                <th className="p-3 text-center">التقييم المعياري الحالي (%)</th>
                <th className="p-3 text-center bg-indigo-50/30 text-indigo-950">التقييم المقترح والمحاكى (%)</th>
                <th className="p-3 text-center">الفارق والزيادة</th>
                <th className="p-3 text-center bg-violet-50/40 text-violet-900">المركز المقترح بعد الدمج</th>
                <th className="p-3 text-center rounded-l-lg">أثر الترتيب العام</th>
              </tr>
            </thead>
            <tbody>
              {finalRankedResults.map((item, index) => {
                const criteriaForUnit = criteria.filter(c => c.unit === selectedUnit);
                const rankDelta = item.currentRank - item.simulatedRank; // e.g. 5 - 3 = +2 (improved rank)

                return (
                  <tr 
                    key={item.entity.id} 
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-all font-semibold text-xs text-slate-800"
                  >
                    <td className="p-3 text-center font-black font-mono text-slate-400">
                      #{item.currentRank}
                    </td>
                    
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-800 leading-normal block">{item.entity.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-450">{item.entity.subLabel}</span>
                          <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 rounded font-mono">{item.entity.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="inline-flex flex-wrap gap-1 items-center justify-center max-w-[200px]">
                        {criteriaForUnit.map(cu => {
                          const val = item.entity.values[cu.id] !== undefined ? item.entity.values[cu.id] : 80;
                          return (
                            <span key={cu.id} className="text-[9px] bg-slate-100 text-slate-600 p-0.5 px-2 rounded-md font-mono" title={cu.name}>
                              {val}%
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-3 text-center font-bold font-mono">
                      {item.currentScore}%
                    </td>

                    <td className="p-3 text-center font-bold font-mono bg-indigo-50/20 text-indigo-950 text-sm">
                      {item.simulatedScore}%
                    </td>

                    <td className="p-3 text-center font-mono text-[11px]">
                      {item.scoreDiff > 0 ? (
                        <span className="text-emerald-700 font-black flex items-center justify-center gap-0.5">
                          <ArrowUpRight className="h-3 w-3 inline" />
                          <span>+{item.scoreDiff}%</span>
                        </span>
                      ) : item.scoreDiff < 0 ? (
                        <span className="text-rose-700 font-black flex items-center justify-center gap-0.5">
                          <ArrowDownRight className="h-3 w-3 inline" />
                          <span>{item.scoreDiff}%</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0.0 (مستقر)</span>
                      )}
                    </td>

                    <td className={`p-3 text-center font-black font-mono text-sm bg-violet-50/20 text-violet-900 ${rankDelta !== 0 && 'animate-pulse'}`}>
                      #{item.simulatedRank}
                    </td>

                    <td className="p-3 text-center">
                      {rankDelta > 0 ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                          🔺 ارتفع بقوة (+{rankDelta}) مـركز
                        </span>
                      ) : rankDelta < 0 ? (
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                          🔻 تراجع للخلف ({rankDelta}) مركز
                        </span>
                      ) : (
                        <span className="bg-slate-105 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                          ➖ نمو وتصنيف مستقر
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Computational Breakdown Module Example (Section 4: Mathematical Example clearly stated on screen) */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-500 animate-spin" />
              <span className="text-xs sm:text-sm font-black font-display text-amber-400">مفسر محرك الحساب الرياضي (Scoring Formula Parser & Engine)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">أنموذج توضيحي رياضي للمدير</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold leading-relaxed">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-500 block">1. المدخلات الأولية</span>
              <p className="text-slate-400 text-[11px]">
                يتم قراءة قيم المعايير المغذية لهذا المدرس:
              </p>
              <ul className="list-disc list-inside text-slate-350 text-[10px] pr-2 space-y-0.5">
                <li>الالتزام بالحضور = 90%</li>
                <li>إنجاز الخطة = 80%</li>
                <li>الجودة والضبط = 70%</li>
                <li>التفاعل والتقارير = 100%</li>
              </ul>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 block">2. الأوزان المحافظة المقترحة</span>
              <p className="text-slate-400 text-[11px]">
                تطبيق الوزن النسبي المحدد لكل معيار:
              </p>
              <ul className="list-disc list-inside text-slate-350 text-[10px] pr-2 space-y-0.5">
                <li>وزن الحضور لـ 20%</li>
                <li>وزن إنجاز الخطط لـ 30%</li>
                <li>وزن الجودة والضبط لـ 25%</li>
                <li>وزن التقدير الإداري لـ 25%</li>
              </ul>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 block">3. عملية دمج الأثر التراكمي</span>
              <p className="text-slate-400 text-[11px]">
                حساب كل معيار × وزنه النسبي:
              </p>
              <ul className="list-decimal list-inside text-slate-350 text-[10px] pr-2 space-y-0.5">
                <li>الحضور: 90 × 20% = 18</li>
                <li>الخطة: 80 × 30% = 24</li>
                <li>الجودة: 70 × 25% = 17.5</li>
                <li>التقارير: 100 × 25% = 25</li>
              </ul>
            </div>

            <div className="space-y-1 bg-slate-800/70 p-3 rounded-xl border border-slate-700 justify-between flex flex-col">
              <div>
                <span className="text-[10px] text-pink-400 block">4. النتيجة والتقييم النهائي التراكمي</span>
                <p className="text-pink-300 font-bold text-xs mt-1">
                  التقييم = 18 + 24 + 17.5 + 25 = 84.5%
                </p>
              </div>
              <span className="text-[8px] text-slate-400 mt-2 block leading-normal">
                * يتم رصف وتصنيف المدرس تلقائياً في الترتيب بناء على المجموع الكلي المستجد للنزاهة الشاملة.
              </span>
            </div>
          </div>
        </div>

      </div>



      {/* MODAL 1: ADD NEW CRITERION */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-right space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-950 rounded-lg">
                    <Sliders className="h-5 w-5" />
                  </span>
                  <span className="font-bold text-slate-900 font-display text-sm sm:text-base">تأسيس معيار تقييم جديد بالمنظومة</span>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddCriterionSubmit} className="space-y-4 text-xs sm:text-sm">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم معيار التقييم المقترح (دقيق ولغوي):</label>
                  <input 
                    type="text" 
                    required
                    value={criterionForm.name}
                    onChange={(e) => setCriterionForm({ ...criterionForm, name: e.target.value })}
                    placeholder="مثل: نسبة الالتزام بالقراءة الغيبية دون تلقين"
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-600 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الوصف التعريفي المفصل (للآباء والمشرفين):</label>
                  <textarea 
                    rows={2}
                    value={criterionForm.description}
                    onChange={(e) => setCriterionForm({ ...criterionForm, description: e.target.value })}
                    placeholder="اشرح أهمية هذا التقييم وكيفية حساب أثره في حلقة الطالب والمدرس."
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-600 text-xs text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">نوع وهيكل القيمة:</label>
                    <select
                      value={criterionForm.type}
                      onChange={(e) => setCriterionForm({ ...criterionForm, type: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none bg-white font-bold"
                    >
                      <option value="percentage">نسبة مئوية %</option>
                      <option value="numeric">مقياس عددي (0-100)</option>
                      <option value="yes_no">منطقي (نعم / لا)</option>
                      <option value="average">متوسط تراكمي عام</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">الوحدة الإدارية للارتباط:</label>
                    <select
                      value={criterionForm.unit}
                      onChange={(e) => setCriterionForm({ ...criterionForm, unit: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none bg-white font-bold"
                    >
                      <option value="teacher">المحفظون والمعلمون</option>
                      <option value="student">الطلاب والحفظة</option>
                      <option value="circle">الحلقات والمنارات</option>
                      <option value="general">عام للنظام الكلي</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">المعادلة الحسابية اللابرمجية المقترحة:</label>
                  <input 
                    type="text" 
                    value={criterionForm.calculationMethod}
                    onChange={(e) => setCriterionForm({ ...criterionForm, calculationMethod: e.target.value })}
                    placeholder="مثل: (عدد الأسطر الصحيحة ÷ 15) × 100"
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-600 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    إلغاء التراجع
                  </button>
                  <button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>تأكيد المطلب وحفظ المعيار</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
