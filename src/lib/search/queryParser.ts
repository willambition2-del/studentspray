/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchQueryState, SearchResultCategory, StructuredFilters } from './searchTypes';
import { normalizeArabicText } from './arabicNormalize';

/**
 * Parses a raw Arabic search query into intent, comparison, categories, and conditions
 */
export function parseSearchQuery(rawQuery: string, contextTab?: string): SearchQueryState {
  const normalized = normalizeArabicText(rawQuery);
  
  const state: SearchQueryState = {
    rawQuery,
    normalizedQuery: normalized,
    categoryFilter: 'all',
    filters: {},
    isComparison: false
  };

  if (!rawQuery || !rawQuery.trim()) {
    return state;
  }

  // 1. Detect Entity Comparison Request
  // e.g., "قارن بين احمد ومحمد", "قارن حلقة عاصم وحلقة نافع", "مقارنة الطالب خالد والطالب سعيد"
  const comparePatterns = [
    /^(?:قارن|مقارنة|مقارنه)(?:\s+بين)?\s+(.+?)\s+(?:و|مع|ضد)\s+(.+)$/i,
    /^(.+?)\s+(?:مقابل|مقارنة بـ|مقارنة ب)\s+(.+)$/i
  ];

  for (const pattern of comparePatterns) {
    const match = rawQuery.trim().match(pattern);
    if (match && match[1] && match[2]) {
      const term1 = match[1].replace(/^(?:الطالب|الحلقة|المدرس|الاستاذ)\s+/, '').trim();
      const term2 = match[2].replace(/^(?:الطالب|الحلقة|المدرس|الاستاذ)\s+/, '').trim();
      state.isComparison = true;
      state.comparisonTerms = [term1, term2];
      break;
    }
  }

  // 2. Detect Category Terms in query
  const filters: StructuredFilters = {};

  if (normalized.includes('طالب') || normalized.includes('طلاب') || normalized.includes('الطلاب')) {
    state.categoryFilter = 'students';
  } else if (normalized.includes('مدرس') || normalized.includes('معلم') || normalized.includes('كادر') || normalized.includes('استاذ') || normalized.includes('اداري')) {
    state.categoryFilter = 'teachers_staff';
  } else if (normalized.includes('حلقة') || normalized.includes('حلقات') || normalized.includes('الحلقة')) {
    state.categoryFilter = 'circles';
  } else if (normalized.includes('زيارة') || normalized.includes('زيارات') || normalized.includes('تقييم ميداني') || normalized.includes('موجه')) {
    state.categoryFilter = 'field_visits';
  } else if (normalized.includes('اختبار') || normalized.includes('درجة') || normalized.includes('درجات') || normalized.includes('امتحان')) {
    state.categoryFilter = 'exams_grades';
  } else if (normalized.includes('ملف') || normalized.includes('مصدر') || normalized.includes('رف') || normalized.includes('منشور') || normalized.includes('اعلان') || normalized.includes('كتاب')) {
    state.categoryFilter = 'shelf_files';
  } else if (normalized.includes('وسام') || normalized.includes('جائزة') || normalized.includes('نشاط') || normalized.includes('أنشطة')) {
    state.categoryFilter = 'activities_awards';
  } else if (normalized.includes('قرار') || normalized.includes('مهمة') || normalized.includes('مهام') || normalized.includes('تنبيه')) {
    state.categoryFilter = 'decisions_tasks';
  } else if (normalized.includes('اعتماد') || normalized.includes('سجل') || normalized.includes('حوكمة')) {
    state.categoryFilter = 'approvals_audits';
  }

  // 3. Detect Temporal Expressions
  if (normalized.includes('هذا الاسبوع') || normalized.includes('الاسبوع الحالي')) {
    filters.timeframe = 'this_week';
    state.timeframeText = 'هذا الأسبوع';
  } else if (normalized.includes('هذا الشهر') || normalized.includes('الشهر الحالي')) {
    filters.timeframe = 'this_month';
    state.timeframeText = 'هذا الشهر';
  } else if (normalized.includes('الشهر الماضي') || normalized.includes('الشهر السابق')) {
    filters.timeframe = 'last_month';
    state.timeframeText = 'الشهر الماضي';
  } else if (normalized.includes('هذا العام') || normalized.includes('هذه السنة')) {
    filters.timeframe = 'this_year';
    state.timeframeText = 'هذا العام';
  } else if (normalized.includes('30 يوما') || normalized.includes('30 يوم')) {
    filters.timeframe = 'last_30_days';
    state.timeframeText = 'آخر 30 يوماً';
  }

  // 4. Detect Condition Metrics & Thresholds
  // Attendance conditions (e.g. "حضورهم اقل من 80%", "الطلاب الغائبين")
  if (normalized.includes('غائبين') || normalized.includes('غياب') || normalized.includes('ضعيف الحضور')) {
    filters.maxAttendance = 85;
  }
  const lessAttendanceMatch = normalized.match(/(?:حضور|حضورهم)\s+(?:اقل|ادنى)\s+من\s+(\d+)/);
  if (lessAttendanceMatch && lessAttendanceMatch[1]) {
    filters.maxAttendance = parseInt(lessAttendanceMatch[1], 10);
  }

  // Performance & Status conditions
  if (normalized.includes('متفوقين') || normalized.includes('متميزين') || normalized.includes('الاوائل')) {
    filters.status = 'exceeding';
    filters.minScore = 90;
  } else if (normalized.includes('متعثرين') || normalized.includes('متراجعين') || normalized.includes('ضعاف')) {
    filters.status = 'lagging';
    filters.maxScore = 75;
  } else if (normalized.includes('منتظمين') || normalized.includes('ملتزمين')) {
    filters.status = 'committed';
    filters.minScore = 80;
  }

  // Late/Pending tasks
  if (normalized.includes('متأخرة') || normalized.includes('متأخرين') || normalized.includes('معلقة')) {
    filters.status = 'late_or_pending';
  }

  // Circle assessment score threshold
  const lessScoreMatch = normalized.match(/(?:تقييمها|درجتها|تقييم|درجة)\s+(?:اقل|ادنى)\s+من\s+(\d+)/);
  if (lessScoreMatch && lessScoreMatch[1]) {
    filters.maxScore = parseInt(lessScoreMatch[1], 10);
  }

  state.filters = filters;

  return state;
}
