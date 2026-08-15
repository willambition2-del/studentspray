/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SearchResultCategory = 
  | 'all'
  | 'students'
  | 'teachers_staff'
  | 'circles'
  | 'exams_grades'
  | 'field_visits'
  | 'shelf_files'
  | 'activities_awards'
  | 'decisions_tasks'
  | 'approvals_audits';

export interface SearchCategoryMeta {
  id: SearchResultCategory;
  label: string;
  iconName: string;
  count: number;
}

export interface MetricPair {
  label: string;
  value: string | number;
  color?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchResultCategory;
  categoryLabel: string;
  badge: string;
  badgeColor: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'sky' | 'purple' | 'blue';
  keyMetrics: MetricPair[];
  snippet?: string;
  relevanceScore: number;
  matchReason?: string;
  actionTab: string; // The navigation tab ID to trigger on click
  actionParams?: {
    entityId?: string;
    subTab?: string;
    filterText?: string;
    circleId?: string;
  };
  rawEntity?: any;
  allowedUserTypes?: string[]; // Allowed user types ('admin', 'branch_manager', 'supervisor', 'teacher', 'parent', 'student')
  confidentialityLevel?: 'public' | 'internal' | 'restricted' | 'confidential';
}

export interface ComparisonMetric {
  key: string;
  label: string;
  value1: string | number;
  value2: string | number;
  numericValue1?: number;
  numericValue2?: number;
  unit?: string;
  isHigherBetter?: boolean;
}

export interface ComparisonEntity {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  type: 'student' | 'circle' | 'teacher' | 'timeframe';
  avatar?: string;
}

export interface ComparisonResult {
  isComparison: boolean;
  comparisonType: 'student' | 'circle' | 'teacher' | 'timeframe';
  title: string;
  description: string;
  entity1: ComparisonEntity;
  entity2: ComparisonEntity;
  metrics: ComparisonMetric[];
  aiSummary?: string;
}

export interface StructuredFilters {
  category?: SearchResultCategory;
  circleId?: string;
  branchName?: string;
  status?: string;
  timeframe?: string;
  minAttendance?: number;
  maxAttendance?: number;
  minScore?: number;
  maxScore?: number;
  teacherId?: string;
  grade?: string;
  priority?: string;
}

export interface SearchQueryState {
  rawQuery: string;
  normalizedQuery: string;
  categoryFilter: SearchResultCategory;
  filters: StructuredFilters;
  isComparison: boolean;
  comparisonTerms?: [string, string];
  suggestedCorrection?: string;
  timeframeText?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  category?: string;
}
