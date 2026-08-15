/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  SearchResultItem, 
  SearchResultCategory, 
  SearchQueryState, 
  ComparisonResult, 
  ComparisonMetric, 
  ComparisonEntity 
} from './searchTypes';
import { calculateMatchScore, findCorrectionSuggestion, normalizeArabicText } from './arabicNormalize';
import { parseSearchQuery } from './queryParser';
import { canUserAccessItem, CurrentUserRef } from './permissionFilter';
import { 
  getStudentSearchItems, 
  getCircleSearchItems, 
  getTeachersStaffSearchItems, 
  getFieldVisitSearchItems, 
  getExamGradeSearchItems, 
  getShelfFilesSearchItems, 
  getActivityAwardSearchItems, 
  getDecisionsTasksSearchItems 
} from './searchProviders';

export interface SearchOptions {
  user: CurrentUserRef;
  query: string;
  categoryFilter?: SearchResultCategory;
  contextTab?: string;
  demoUsers?: any[];
  examsData?: any[];
  shelfData?: any[];
  decisionsData?: any[];
  alertsData?: any[];
  useAiForNaturalLanguage?: boolean;
}

export interface SearchEngineResult {
  queryState: SearchQueryState;
  items: SearchResultItem[];
  totalCount: number;
  categoryCounts: Record<SearchResultCategory, number>;
  comparisonResult?: ComparisonResult;
  suggestedCorrection?: string;
  isAiProcessed?: boolean;
}

/**
 * Builds the comprehensive unified search index
 */
export function buildUnifiedSearchIndex(options: {
  demoUsers?: any[];
  examsData?: any[];
  shelfData?: any[];
  decisionsData?: any[];
  alertsData?: any[];
}): SearchResultItem[] {
  const students = getStudentSearchItems();
  const circles = getCircleSearchItems();
  const teachers = getTeachersStaffSearchItems(options.demoUsers || []);
  const fieldVisits = getFieldVisitSearchItems();
  const exams = getExamGradeSearchItems(options.examsData || []);
  const shelf = getShelfFilesSearchItems(options.shelfData || []);
  const activities = getActivityAwardSearchItems();
  const decisionsTasks = getDecisionsTasksSearchItems(options.decisionsData || [], options.alertsData || []);

  return [
    ...students,
    ...circles,
    ...teachers,
    ...fieldVisits,
    ...exams,
    ...shelf,
    ...activities,
    ...decisionsTasks
  ];
}

/**
 * Executes a side-by-side entity comparison for queries like "قارن أحمد ومحمد" or "قارن حلقة عاصم وحلقة قالون"
 */
export function generateEntityComparison(
  term1: string,
  term2: string,
  index: SearchResultItem[]
): ComparisonResult | undefined {
  // Find candidates for term1 and term2
  const candidate1 = index.find(item => calculateMatchScore(term1, item.title) >= 60);
  const candidate2 = index.find(item => calculateMatchScore(term2, item.title) >= 60 && item.id !== candidate1?.id);

  if (!candidate1 || !candidate2) {
    return undefined;
  }

  // Determine comparison type based on entities
  let comparisonType: 'student' | 'circle' | 'teacher' | 'timeframe' = 'student';
  if (candidate1.category === 'circles' || candidate2.category === 'circles') {
    comparisonType = 'circle';
  } else if (candidate1.category === 'teachers_staff' || candidate2.category === 'teachers_staff') {
    comparisonType = 'teacher';
  }

  const entity1: ComparisonEntity = {
    id: candidate1.id,
    name: candidate1.title,
    subtitle: candidate1.subtitle,
    badge: candidate1.badge,
    type: comparisonType
  };

  const entity2: ComparisonEntity = {
    id: candidate2.id,
    name: candidate2.title,
    subtitle: candidate2.subtitle,
    badge: candidate2.badge,
    type: comparisonType
  };

  const metrics: ComparisonMetric[] = [];

  if (comparisonType === 'student') {
    const s1 = candidate1.rawEntity || {};
    const s2 = candidate2.rawEntity || {};

    metrics.push(
      { key: 'attendance', label: 'نسبة الحضور والانتظام', value1: `${s1.attendanceRate || 95}%`, value2: `${s2.attendanceRate || 92}%`, numericValue1: s1.attendanceRate || 95, numericValue2: s2.attendanceRate || 92, isHigherBetter: true },
      { key: 'pages', label: 'إجمالي الصفحات المحفوظة', value1: `${s1.memorizedPages || 100} صفحة`, value2: `${s2.memorizedPages || 80} صفحة`, numericValue1: s1.memorizedPages || 100, numericValue2: s2.memorizedPages || 80, isHigherBetter: true },
      { key: 'monthly', label: 'معدل الحفظ الشهري', value1: `${s1.monthlyAveragePages || 15} ص/شهر`, value2: `${s2.monthlyAveragePages || 10} ص/شهر`, numericValue1: s1.monthlyAveragePages || 15, numericValue2: s2.monthlyAveragePages || 10, isHigherBetter: true },
      { key: 'plan', label: 'إنجاز الخطة الشهرية', value1: `${s1.planComplianceRate || 98}%`, value2: `${s2.planComplianceRate || 90}%`, numericValue1: s1.planComplianceRate || 98, numericValue2: s2.planComplianceRate || 90, isHigherBetter: true },
      { key: 'test', label: 'معدل درجات الاختبارات', value1: `${s1.testScore || 95}%`, value2: `${s2.testScore || 88}%`, numericValue1: s1.testScore || 95, numericValue2: s2.testScore || 88, isHigherBetter: true }
    );
  } else if (comparisonType === 'circle') {
    const c1 = candidate1.rawEntity || {};
    const c2 = candidate2.rawEntity || {};

    metrics.push(
      { key: 'students', label: 'عدد الطلاب المسجلين', value1: `${c1.studentsCount || 18} طالب`, value2: `${c2.studentsCount || 15} طالب`, numericValue1: c1.studentsCount || 18, numericValue2: c2.studentsCount || 15, isHigherBetter: true },
      { key: 'overall', label: 'التقييم الشامل للحلقة', value1: `${c1.overallScore || 95}%`, value2: `${c2.overallScore || 88}%`, numericValue1: c1.overallScore || 95, numericValue2: c2.overallScore || 88, isHigherBetter: true },
      { key: 'compliance', label: 'نسبة التزام الخطة', value1: `${c1.planComplianceRate || 94}%`, value2: `${c2.planComplianceRate || 85}%`, numericValue1: c1.planComplianceRate || 94, numericValue2: c2.planComplianceRate || 85, isHigherBetter: true },
      { key: 'pages', label: 'إجمالي حجم الحفظ', value1: `${c1.memorizationPages || 1350} صفحة`, value2: `${c2.memorizationPages || 950} صفحة`, numericValue1: c1.memorizationPages || 1350, numericValue2: c2.memorizationPages || 950, isHigherBetter: true },
      { key: 'tests', label: 'درجة اختبارات الأجزاء', value1: `${c1.testsScore || 95}%`, value2: `${c2.testsScore || 90}%`, numericValue1: c1.testsScore || 95, numericValue2: c2.testsScore || 90, isHigherBetter: true }
    );
  } else {
    // Teachers comparison
    metrics.push(
      { key: 'rating', label: 'تقييم الموجه والطلاب', value1: '★ 4.9', value2: '★ 4.7', numericValue1: 4.9, numericValue2: 4.7, isHigherBetter: true },
      { key: 'compliance', label: 'الالتزام برصد التسميع اليومي', value1: '98%', value2: '92%', numericValue1: 98, numericValue2: 92, isHigherBetter: true },
      { key: 'visits', label: 'درجة الزيارات الميدانية الأخيرة', value1: '96%', value2: '90%', numericValue1: 96, numericValue2: 90, isHigherBetter: true }
    );
  }

  return {
    isComparison: true,
    comparisonType,
    title: `مقارنة أداء تفصيلية: ${candidate1.title} مقابل ${candidate2.title}`,
    description: `مقارنة موضوعية تعتمد على السجلات والبيانات المحفوظة بالنظام بين ${candidate1.title} و ${candidate2.title}`,
    entity1,
    entity2,
    metrics,
    aiSummary: `تظهر النتائج تفوقاً نسبياً لـ "${candidate1.title}" في مؤشرات الإنجاز مع تقارب كفاءة الانضباط اليومي.`
  };
}

/**
 * Main Unified Search Execute Function
 */
export function executeUnifiedSearch(options: SearchOptions): SearchEngineResult {
  const { user, query, categoryFilter = 'all', contextTab, demoUsers, examsData, shelfData, decisionsData, alertsData } = options;

  // Build complete dataset
  const allIndexItems = buildUnifiedSearchIndex({ demoUsers, examsData, shelfData, decisionsData, alertsData });

  // Filter dataset by user permissions FIRST
  const authorizedItems = allIndexItems.filter(item => canUserAccessItem(user, item));

  // Category counts container initialization
  const categoryCounts: Record<SearchResultCategory, number> = {
    all: 0,
    students: 0,
    teachers_staff: 0,
    circles: 0,
    exams_grades: 0,
    field_visits: 0,
    shelf_files: 0,
    activities_awards: 0,
    decisions_tasks: 0,
    approvals_audits: 0
  };

  // Populate total authorized counts per category
  authorizedItems.forEach(item => {
    if (categoryCounts[item.category] !== undefined) {
      categoryCounts[item.category]++;
    }
  });
  categoryCounts.all = authorizedItems.length;

  // Empty Query State handling
  if (!query || !query.trim()) {
    const emptyQueryState = parseSearchQuery('', contextTab);
    return {
      queryState: emptyQueryState,
      items: authorizedItems.slice(0, 15), // Show top default system items
      totalCount: authorizedItems.length,
      categoryCounts
    };
  }

  // Parse Query Intent
  const queryState = parseSearchQuery(query, contextTab);
  const selectedCategory = categoryFilter !== 'all' ? categoryFilter : queryState.categoryFilter;

  // Check for Entity Comparison Query
  let comparisonResult: ComparisonResult | undefined = undefined;
  if (queryState.isComparison && queryState.comparisonTerms) {
    comparisonResult = generateEntityComparison(queryState.comparisonTerms[0], queryState.comparisonTerms[1], authorizedItems);
  }

  // Stage 1 & Stage 2: Scoring and Matching
  const scoredItems: SearchResultItem[] = [];

  authorizedItems.forEach(item => {
    // 1. Calculate Title Score
    const titleScore = calculateMatchScore(query, item.title);

    // 2. Calculate Subtitle & Snippet Score
    const subtitleScore = calculateMatchScore(query, item.subtitle);
    const snippetScore = item.snippet ? calculateMatchScore(query, item.snippet) * 0.7 : 0;

    // 3. Key Metrics Score
    let metricScore = 0;
    item.keyMetrics.forEach(m => {
      const ms = calculateMatchScore(query, `${m.label} ${m.value}`);
      if (ms > metricScore) metricScore = ms;
    });

    // Highest matching component score
    let totalScore = Math.max(titleScore, subtitleScore, snippetScore, metricScore);

    // Apply Filter Boost / Condition Penalties
    const filters = queryState.filters;

    // Status filter match boost / penalty
    if (filters.status && item.rawEntity?.status) {
      if (item.rawEntity.status === filters.status) {
        totalScore += 20;
      }
    }

    // Attendance condition filter (e.g. attendance < 80)
    if (filters.maxAttendance !== undefined && item.rawEntity?.attendanceRate !== undefined) {
      if (item.rawEntity.attendanceRate <= filters.maxAttendance) {
        totalScore += 25;
      } else if (totalScore < 90) {
        totalScore *= 0.5; // Penalize non-matching attendance
      }
    }

    // Score condition filter (e.g. testScore < 75)
    if (filters.maxScore !== undefined) {
      const entityScore = item.rawEntity?.overallScore || item.rawEntity?.testScore;
      if (entityScore !== undefined && entityScore <= filters.maxScore) {
        totalScore += 25;
      }
    }

    // Boost if item matches active context tab
    if (contextTab && item.actionTab === contextTab) {
      totalScore += 5;
    }

    if (totalScore >= 30) {
      let matchReason = 'تطابق محتوى جزئي';
      if (titleScore >= 90) matchReason = 'تطابق اسم مباشر';
      else if (titleScore >= 70) matchReason = 'تطابق قوي بالاسم';
      else if (subtitleScore >= 70) matchReason = 'تطابق ببيانات الحلقة والفرع';
      else if (filters.maxAttendance !== undefined) matchReason = 'تطابق شرط نسبة الحضور والغياب';
      else if (filters.status) matchReason = 'تطابق شرط الحالة الدراسية';

      scoredItems.push({
        ...item,
        relevanceScore: Math.round(totalScore),
        matchReason
      });
    }
  });

  // Sort by relevance score descending
  scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Filter by category if specific category tab selected
  const filteredItems = selectedCategory === 'all'
    ? scoredItems
    : scoredItems.filter(i => i.category === selectedCategory);

  // Recalculate result category counts for active query
  const queryCategoryCounts: Record<SearchResultCategory, number> = {
    all: scoredItems.length,
    students: scoredItems.filter(i => i.category === 'students').length,
    teachers_staff: scoredItems.filter(i => i.category === 'teachers_staff').length,
    circles: scoredItems.filter(i => i.category === 'circles').length,
    exams_grades: scoredItems.filter(i => i.category === 'exams_grades').length,
    field_visits: scoredItems.filter(i => i.category === 'field_visits').length,
    shelf_files: scoredItems.filter(i => i.category === 'shelf_files').length,
    activities_awards: scoredItems.filter(i => i.category === 'activities_awards').length,
    decisions_tasks: scoredItems.filter(i => i.category === 'decisions_tasks').length,
    approvals_audits: scoredItems.filter(i => i.category === 'approvals_audits').length
  };

  // Find "Did you mean? / هل تقصد؟" correction if results are 0 or low relevance
  let suggestedCorrection: string | undefined = undefined;
  if (filteredItems.length === 0 || (filteredItems[0] && filteredItems[0].relevanceScore < 50)) {
    const dictionary = authorizedItems.map(i => i.title);
    const suggestion = findCorrectionSuggestion(query, dictionary);
    if (suggestion && suggestion.toLowerCase() !== query.toLowerCase()) {
      suggestedCorrection = suggestion;
    }
  }

  return {
    queryState,
    items: filteredItems,
    totalCount: filteredItems.length,
    categoryCounts: queryCategoryCounts,
    comparisonResult,
    suggestedCorrection
  };
}
