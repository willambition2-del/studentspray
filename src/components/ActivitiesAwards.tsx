/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, Star, Users, ClipboardList, CheckCircle, RefreshCw, Plus, 
  Calendar, AlertTriangle, TrendingUp, Printer, Download, Eye, 
  Trash2, Play, Settings, ShieldAlert, Check, X, FileText, Sparkles,
  Bell, Send, CheckCircle2, Clock, UserCheck, XCircle, Filter, 
  Building2, MapPin, DollarSign, User, ShieldCheck, Lock, Unlock, Zap, Edit3, Sliders, ChevronDown, Trophy,
  ArrowRight, Share2, Layers, Tag, Target, MessageSquare, CheckSquare, Paperclip, BarChart3, AlertCircle,
  ThumbsUp, ThumbsDown, HelpCircle, Activity, Search, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STAFF_DIRECTORY, PersonItem } from './TrackingAlertsHub';
import {
  getActivities,
  createActivity,
  updateActivity,
  getAwards,
  createAward,
  grantAward,
  getCompetitions,
  createCompetition,
  updateCompetition,
  recordCompetitionResults,
} from '../lib/api';

// === ACTIVITY LIFECYCLE TYPES ===
export type ActivityTypeCategory = 
  | 'contest' | 'trip' | 'program' | 'course' | 'meeting' | 'sports' 
  | 'entertainment' | 'educational' | 'quranic' | 'initiative' | 'campaign' 
  | 'ceremony' | 'camp' | 'other';

export const ACTIVITY_CATEGORIES_MAP: Record<ActivityTypeCategory, { label: string; icon: string; bg: string; text: string }> = {
  contest: { label: 'مسابقة', icon: '🏆', bg: 'bg-amber-100', text: 'text-amber-800' },
  trip: { label: 'رحلة', icon: '🚌', bg: 'bg-sky-100', text: 'text-sky-800' },
  program: { label: 'برنامج', icon: '📋', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  course: { label: 'دورة', icon: '🎓', bg: 'bg-purple-100', text: 'text-purple-800' },
  meeting: { label: 'لقاء', icon: '🤝', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  sports: { label: 'نشاط رياضي', icon: '⚽', bg: 'bg-green-100', text: 'text-green-800' },
  entertainment: { label: 'نشاط ترفيهي', icon: '🎯', bg: 'bg-orange-100', text: 'text-orange-800' },
  educational: { label: 'نشاط تربوي', icon: '📚', bg: 'bg-blue-100', text: 'text-blue-800' },
  quranic: { label: 'نشاط قرآني', icon: '📖', bg: 'bg-teal-100', text: 'text-teal-800' },
  initiative: { label: 'مبادرة', icon: '💡', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  campaign: { label: 'حملة', icon: '📢', bg: 'bg-rose-100', text: 'text-rose-800' },
  ceremony: { label: 'حفل', icon: '🎉', bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  camp: { label: 'معسكر', icon: '🏕️', bg: 'bg-stone-100', text: 'text-stone-800' },
  other: { label: 'أخرى', icon: '✨', bg: 'bg-slate-100', text: 'text-slate-800' },
};

export type ActivityLifecycleStatus = 
  | 'draft'               // مسودة
  | 'assigned'            // بانتظار قبول المسؤول
  | 'planned'             // مخطط
  | 'nomination'          // ترشيح الطلاب
  | 'pending_approval'    // بانتظار اعتماد المشاركين
  | 'ready'               // جاهز للتنفيذ
  | 'in_progress'         // قيد التنفيذ
  | 'completed'           // منتهٍ
  | 'report_pending'      // بانتظار التقرير
  | 'closed'              // مغلق
  | 'cancelled';          // ملغى

export const ACTIVITY_STATUS_MAP: Record<ActivityLifecycleStatus, { label: string; bg: string; text: string; badgeClass: string }> = {
  draft: { label: 'مسودة', bg: 'bg-slate-100', text: 'text-slate-700', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  assigned: { label: 'بانتظار قبول المسؤول', bg: 'bg-amber-50', text: 'text-amber-800', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  planned: { label: 'مخطط', bg: 'bg-blue-50', text: 'text-blue-800', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  nomination: { label: 'ترشيح الطلاب', bg: 'bg-purple-50', text: 'text-purple-800', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  pending_approval: { label: 'بانتظار اعتماد المشاركين', bg: 'bg-indigo-50', text: 'text-indigo-800', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  ready: { label: 'جاهز للتنفيذ', bg: 'bg-teal-50', text: 'text-teal-800', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300' },
  in_progress: { label: 'قيد التنفيذ', bg: 'bg-emerald-50', text: 'text-emerald-800', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  completed: { label: 'منتهٍ', bg: 'bg-cyan-50', text: 'text-cyan-800', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  report_pending: { label: 'بانتظار التقرير', bg: 'bg-orange-50', text: 'text-orange-800', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  closed: { label: 'مغلق', bg: 'bg-stone-100', text: 'text-stone-700', badgeClass: 'bg-stone-200 text-stone-800 border-stone-300' },
  cancelled: { label: 'ملغى', bg: 'bg-rose-50', text: 'text-rose-800', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export type TaskAssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'reassigned' | 'cancelled';

export interface ActivityBudgetItem {
  id: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  notes?: string;
}

export interface ActivitySubTask {
  id: string;
  title: string;
  assigneeName: string;
  assigneeId: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  description?: string;
}

export interface ActivityParticipantRecord {
  id: string;
  studentId: string;
  studentName: string;
  circleName: string;
  parentName?: string;
  isEligible: boolean;
  nominationStatus: 'nominated' | 'rejected_nomination';
  parentApprovalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  attendanceStatus: 'not_recorded' | 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface ActivityFileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ActivityEvaluation {
  goalAchieved: number; // 1 to 5
  organization: number;
  engagement: number;
  educationalImpact: number;
  overallRating: number;
  achievements: string;
  challenges: string;
  recommendations: string;
  notes?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface ActivityTimelineLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
}

export interface ActivityLifecycleItem {
  id: string;
  name: string;
  typeCategory: ActivityTypeCategory;
  customCategoryName?: string;
  shortDescription: string;
  detailedDescription: string;
  mainGoal: string;
  subGoals: string[];
  targetAudience: string;
  targetCount: number;
  plannedBudget: number;
  actualBudget: number;
  budgetType: 'financial' | 'in_kind' | 'mixed';
  location: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  responsibleStaffId: string;
  responsibleStaffName: string;
  responsibleStaffRole: string;
  taskStatus: TaskAssignmentStatus;
  rejectionReason?: string;
  targetCircles: string[];
  targetAgeGroups?: string;
  requiresParentApproval: boolean;
  requiresAdminApproval: boolean;
  hasRewardsOrPrizes: boolean;
  linkedBadgeTemplateId?: string;
  attachments: ActivityFileAttachment[];
  notes?: string;
  
  status: ActivityLifecycleStatus;
  
  participants: ActivityParticipantRecord[];
  budgetItems: ActivityBudgetItem[];
  subTasks: ActivitySubTask[];
  evaluation?: ActivityEvaluation;
  timeline: ActivityTimelineLog[];
  
  createdAt: string;
  createdBy: string;
}

// === INTERNAL TYPES ===
export interface CompletionReport {
  submittedAt: string;
  actualAttendance: number;
  actualCost: number;
  summaryNotes: string;
  outputs: string;
  impactRatio: number;
  recommendations: string;
  submittedBy: string;
}

export interface ActivityRecord {
  id: string;
  name: string;
  type: 'contest' | 'summer' | 'ramadan' | 'ceremony' | 'cultural' | 'sport';
  brief: string;
  description: string;
  organizer: string;
  executor: string;
  executorId?: string;
  startDate: string;
  endDate: string;
  duration: string;
  location: string;
  estimatedCost: number;
  actualCost?: number;
  targetAudience: 'all' | 'circles' | 'levels' | 'teachers' | 'supervisors';
  targetAudienceDetail: string;
  mainGoal: string;
  expectedResults: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'review_pending' | 'completed' | 'cancelled' | 'archived';
  evaluationPoints?: number;
  evaluationGrade?: string;
  expectedImpact: string;
  actualImpact?: string;
  impactRatio?: number;
  completionReport?: CompletionReport;
  managementNotes?: string;
}

export interface Participant {
  id: string;
  activityId: string;
  name: string;
  circle: string;
  type: 'student' | 'teacher' | 'supervisor';
  registerDate: string;
  status: 'registered' | 'attended' | 'absent' | 'excused';
}

export interface AwardRecord {
  id: string;
  name: string;
  type: 'contest' | 'activity' | 'honor' | 'special' | 'seasonal';
  description: string;
  beneficiary: string;
  beneficiaryType: 'student' | 'teacher' | 'circle' | 'supervisor';
  awardingDate: string;
  donor: string;
}

// === BADGE SYSTEM TYPES (AWARDS & BADGES) ===
export type BadgeTypeCategory = 'auto' | 'director' | 'special';
export type TargetAudienceType = 'students' | 'teachers' | 'admins' | 'supervisors' | 'all';
export type RewardType = 'none' | 'financial' | 'gift' | 'certificate' | 'honor' | 'activity' | 'other';
export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeCondition {
  metric: 'mastered_pages' | 'saved_juz' | 'attendance_rate' | 'avg_score' | 'passed_exams' | 'activities_count' | 'commitment_days';
  metricLabel: string;
  operator: '>=' | '==' | '<=';
  value: number;
}

export interface BadgeLevelConfig {
  level: BadgeLevel;
  name: string;
  conditionValue: number;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  honorificTitle: string; // الاسم الشرفي (e.g., "حافظ متقن")
  description: string;
  icon: string;
  badgeType: BadgeTypeCategory;
  targetAudience: TargetAudienceType;
  grantMethod: string;
  isAuto: boolean;
  requiresApproval: boolean;
  allowRepeat: boolean;
  rewardType: RewardType;
  rewardAmount: number; // المبلغ بالريال
  rewardDescription: string;
  hasLevels: boolean;
  levels?: BadgeLevelConfig[];
  condition?: BadgeCondition;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface GrantedBadge {
  id: string; // e.g., BDG-2026-0814
  badgeTemplateId: string;
  badgeName: string;
  honorificTitle: string;
  recipientId: string;
  recipientName: string;
  recipientRole: 'student' | 'teacher' | 'admin' | 'supervisor';
  recipientCircle?: string;
  recipientParent?: string;
  badgeType: BadgeTypeCategory;
  obtainedHow: string;
  awardDate: string;
  snapshotRewardType: RewardType;
  snapshotRewardAmount: number; // حفظ قيمة المكافأة وقت المنح حتى لا تتغير بالمستقبل
  snapshotRewardDescription: string;
  approvalStatus: 'eligible' | 'pending_approval' | 'approved' | 'rejected' | 'granted';
  grantedBy: string;
  approvedBy?: string;
  level?: BadgeLevel;
  levelName?: string;
}

export interface ActivityNotification {
  id: string;
  recipientId: string;
  recipientName: string;
  activityId?: string;
  activityName?: string;
  title: string;
  message: string;
  type: 'assignment' | 'report_submitted' | 'activity_closed' | 'alert' | 'badge_earned' | 'badge_approved' | 'activity_reminder';
  createdAt: string;
  isRead: boolean;
}

export interface StudentItem {
  id: string;
  name: string;
  circleName: string;
  parentName?: string;
  masteredPages?: number;
  attendanceRate?: number;
  avgScore?: number;
}

// === CIRCLE STUDENTS MOCK DATA ===
const CIRCLE_STUDENTS_MAP: Record<string, StudentItem[]> = {
  'حلقة الإمام عاصم': [
    { id: 'st-1', name: 'عبدالرحمن الغامدي', circleName: 'حلقة الإمام عاصم', parentName: 'خالد الغامدي', masteredPages: 25, attendanceRate: 98, avgScore: 95 },
    { id: 'st-2', name: 'يوسف العتيبي', circleName: 'حلقة الإمام عاصم', parentName: 'محمد العتيبي', masteredPages: 18, attendanceRate: 100, avgScore: 92 },
    { id: 'st-3', name: 'سليمان الحربي', circleName: 'حلقة الإمام عاصم', parentName: 'فهد الحربي', masteredPages: 12, attendanceRate: 90, avgScore: 88 },
    { id: 'st-4', name: 'خالد بن فهد', circleName: 'حلقة الإمام عاصم', parentName: 'فهد السعيد', masteredPages: 30, attendanceRate: 96, avgScore: 97 },
    { id: 'st-5', name: 'عمر الماجد', circleName: 'حلقة الإمام عاصم', parentName: 'ماجد العلي', masteredPages: 8, attendanceRate: 85, avgScore: 82 },
  ],
  'حلقة الإمام البخاري': [
    { id: 'st-6', name: 'معاذ الحارثي', circleName: 'حلقة الإمام البخاري', parentName: 'سلطان الحارثي', masteredPages: 22, attendanceRate: 94, avgScore: 90 },
    { id: 'st-7', name: 'أحمد السعيد', circleName: 'حلقة الإمام البخاري', parentName: 'سعيد القحطاني', masteredPages: 15, attendanceRate: 92, avgScore: 89 },
    { id: 'st-8', name: 'عبدالله بن محمد العتيبي', circleName: 'حلقة الإمام البخاري', parentName: 'محمد العتيبي', masteredPages: 40, attendanceRate: 99, avgScore: 98 },
    { id: 'st-9', name: 'صالح العويد', circleName: 'حلقة الإمام البخاري', parentName: 'عبدالله العويد', masteredPages: 10, attendanceRate: 88, avgScore: 84 },
  ],
  'حلقة الكسائي': [
    { id: 'st-10', name: 'صالح بن ناصر', circleName: 'حلقة الكسائي', parentName: 'ناصر الدوسري', masteredPages: 14, attendanceRate: 89, avgScore: 86 },
    { id: 'st-11', name: 'فيصل الدوسري', circleName: 'حلقة الكسائي', parentName: 'مبارك الدوسري', masteredPages: 28, attendanceRate: 97, avgScore: 94 },
    { id: 'st-12', name: 'بدر الزهراني', circleName: 'حلقة الكسائي', parentName: 'سعيد الزهراني', masteredPages: 19, attendanceRate: 91, avgScore: 88 },
  ],
};

// === INITIAL BADGE BANK TEMPLATES ===
const initialBadgeTemplates: BadgeTemplate[] = [
  {
    id: 'bt-1',
    name: 'وسام الحافظ المتقن',
    honorificTitle: 'حافظ متقن',
    description: 'يمنح للطالب الذي يحقق إتقاناً للأوجه القرآنية المحددة بدون أخطاء مع الحفظ المتقن.',
    icon: '🏅',
    badgeType: 'auto',
    targetAudience: 'students',
    grantMethod: 'تلقائيًا عند إتقان الأوجه القرآنية المشترطة',
    isAuto: true,
    requiresApproval: false,
    allowRepeat: true,
    rewardType: 'financial',
    rewardAmount: 5000,
    rewardDescription: '٥,٠٠٠ ريال سعودي مع درع فاخر',
    hasLevels: true,
    levels: [
      { level: 'bronze', name: 'المستوى الأول (٥ أجزاء)', conditionValue: 100 },
      { level: 'silver', name: 'المستوى الثاني (١٠ أجزاء)', conditionValue: 200 },
      { level: 'gold', name: 'المستوى الثالث (٢٠ جزءاً)', conditionValue: 400 },
      { level: 'diamond', name: 'المستوى الرابع (المصحف كاملاً)', conditionValue: 600 }
    ],
    condition: { metric: 'mastered_pages', metricLabel: 'الأوجه المتقنة', operator: '>=', value: 20 },
    status: 'active',
    createdAt: '2026-01-01'
  },
  {
    id: 'bt-2',
    name: 'وسام الانضباط والحضور الذهبي',
    honorificTitle: 'القدوة الحاضر',
    description: 'يمنح لمنسوبي الحلقات الذين يحققون نسبة حضور عالية جداً طوال الفصل بدون غياب.',
    icon: '🌟',
    badgeType: 'auto',
    targetAudience: 'all',
    grantMethod: 'قياس نسبة الحضور التلقائية من السجل التراكمي',
    isAuto: true,
    requiresApproval: true,
    allowRepeat: false,
    rewardType: 'financial',
    rewardAmount: 1500,
    rewardDescription: '١,٥٠٠ ريال سعودي',
    hasLevels: false,
    condition: { metric: 'attendance_rate', metricLabel: 'نسبة الحضور (%)', operator: '>=', value: 95 },
    status: 'active',
    createdAt: '2026-01-05'
  },
  {
    id: 'bt-3',
    name: 'وسام العطاء القرآني',
    honorificTitle: 'معطاء القرآن',
    description: 'وسام مباشر يمنحه المدير العام للمدرسين والإداريين المتميزين في خدمة الحلقات.',
    icon: '💎',
    badgeType: 'director',
    targetAudience: 'teachers',
    grantMethod: 'منح مباشر بقرار من مدير عام الملتقى',
    isAuto: false,
    requiresApproval: false,
    allowRepeat: true,
    rewardType: 'financial',
    rewardAmount: 3000,
    rewardDescription: '٣,٠٠٠ ريال سعودي مع طقم هدايا فاخر',
    hasLevels: false,
    status: 'active',
    createdAt: '2026-01-10'
  },
  {
    id: 'bt-4',
    name: 'وسام الأثر الخالد (أوسمة خاصة)',
    honorificTitle: 'صاحب الأثر',
    description: 'وسام استثنائي رفيع يمنح بقرار استثنائي للشخصيات المؤثرة والداعمين والكوادر الرائدة.',
    icon: '🏆',
    badgeType: 'special',
    targetAudience: 'all',
    grantMethod: 'قرار تكريم خاص من المشرف العام والمدير التنفيذي',
    isAuto: false,
    requiresApproval: true,
    allowRepeat: false,
    rewardType: 'financial',
    rewardAmount: 10000,
    rewardDescription: '١٠,٠٠٠ ريال سعودي وميدالية الشرف الكبرى',
    hasLevels: false,
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'bt-5',
    name: 'وسام المعلم المتميز',
    honorificTitle: 'المعلم المودع',
    description: 'يُمنح للمعلمين الذين تحقق حلقاتهم أعلى معدلات الإنجاز وتثبيت الحفظ بين طلابهم.',
    icon: '👑',
    badgeType: 'auto',
    targetAudience: 'teachers',
    grantMethod: 'حساب متوسط درجات طلاب الحلقة تلقائيًا',
    isAuto: true,
    requiresApproval: true,
    allowRepeat: true,
    rewardType: 'financial',
    rewardAmount: 4000,
    rewardDescription: '٤,٠٠٠ ريال مكافأة التميز التعليمي',
    hasLevels: false,
    condition: { metric: 'avg_score', metricLabel: 'متوسط درجات طلاب الحلقة', operator: '>=', value: 90 },
    status: 'active',
    createdAt: '2026-02-01'
  }
];

// === INITIAL GRANTED BADGES LOG ===
const initialGrantedBadges: GrantedBadge[] = [
  {
    id: 'BDG-2026-0814',
    badgeTemplateId: 'bt-1',
    badgeName: 'وسام الحافظ المتقن',
    honorificTitle: 'حافظ متقن',
    recipientId: 'st-1',
    recipientName: 'عبدالرحمن الغامدي',
    recipientRole: 'student',
    recipientCircle: 'حلقة الإمام عاصم',
    recipientParent: 'خالد الغامدي',
    badgeType: 'auto',
    obtainedHow: 'إتقان 25 وجهًا قرآنياً بنسبة نجاح 100% في الاختبارات',
    awardDate: '2026-08-10',
    snapshotRewardType: 'financial',
    snapshotRewardAmount: 5000,
    snapshotRewardDescription: '٥,٠٠٠ ريال سعودي مع درع فاخر',
    approvalStatus: 'granted',
    grantedBy: 'النظام التلقائي',
    approvedBy: 'أ.د. عبدالله بن سليمان (المدير العام)',
    level: 'gold',
    levelName: 'المستوى الثالث (٢٠ جزءاً)'
  },
  {
    id: 'BDG-2026-0812',
    badgeTemplateId: 'bt-3',
    badgeName: 'وسام العطاء القرآني',
    honorificTitle: 'معطاء القرآن',
    recipientId: 'p7',
    recipientName: 'الشيخ/ يونس الدوسري',
    recipientRole: 'teacher',
    recipientCircle: 'حلقة الإمام عاصم',
    badgeType: 'director',
    obtainedHow: 'إدارة وتوجيه حلقة عاصم بروح قيادية وتحقيق أرفع معدلات الالتزام',
    awardDate: '2026-08-01',
    snapshotRewardType: 'financial',
    snapshotRewardAmount: 3000,
    snapshotRewardDescription: '٣,٠٠٠ ريال سعودي مع طقم هدايا فاخر',
    approvalStatus: 'granted',
    grantedBy: 'أ.د. عبدالله بن سليمان (المدير العام)',
    approvedBy: 'أ.د. عبدالله بن سليمان (المدير العام)'
  },
  {
    id: 'BDG-2026-0808',
    badgeTemplateId: 'bt-2',
    badgeName: 'وسام الانضباط والحضور الذهبي',
    honorificTitle: 'القدوة الحاضر',
    recipientId: 'st-2',
    recipientName: 'يوسف العتيبي',
    recipientRole: 'student',
    recipientCircle: 'حلقة الإمام عاصم',
    recipientParent: 'محمد العتيبي',
    badgeType: 'auto',
    obtainedHow: 'تحقيق نسبة حضور 100% طوال الأسابيع الثمانية الماضية',
    awardDate: '2026-08-05',
    snapshotRewardType: 'financial',
    snapshotRewardAmount: 1500,
    snapshotRewardDescription: '١,٥٠٠ ريال سعودي',
    approvalStatus: 'pending_approval',
    grantedBy: 'النظام التلقائي',
    level: 'gold'
  },
  {
    id: 'BDG-2026-0720',
    badgeTemplateId: 'bt-4',
    badgeName: 'وسام الأثر الخالد (أوسمة خاصة)',
    honorificTitle: 'صاحب الأثر',
    recipientId: 'p3',
    recipientName: 'أ. طارق بن فهد',
    recipientRole: 'supervisor',
    badgeType: 'special',
    obtainedHow: 'تنفيذ وإشراف الرحلة التعليمية والترفيهية لمركز دار الحديث بمعبر بنجاح باهر',
    awardDate: '2026-07-20',
    snapshotRewardType: 'financial',
    snapshotRewardAmount: 10000,
    snapshotRewardDescription: '١٠,٠٠٠ ريال سعودي وميدالية الشرف الكبرى',
    approvalStatus: 'granted',
    grantedBy: 'المشرف العام',
    approvedBy: 'أ.د. عبدالله بن سليمان (المدير العام)'
  }
];

// === INITIAL ACTIVITIES LIFECYCLE DATA ===
const initialActivitiesLifecycle: ActivityLifecycleItem[] = [
  {
    id: 'act-lc-1',
    name: 'المسابقة السنوية الكبرى لحفظ المصحف الشريف (١٤٤٧هـ)',
    typeCategory: 'contest',
    shortDescription: 'مسابقة الملتقى السنوية لاختبار الطلاب في الحفظ والإتقان برعاية الهيئة العامة.',
    detailedDescription: 'تجرى المسابقة على أربعة فروع: المصحف كاملاً، عشرين جزءاً، عشرة أجزاء، وخمسة أجزاء، مع لجان تحكيم مجازة بالسند وخطة تنظيمية محكمة.',
    mainGoal: 'رفع مستوى ضبط المتشابهات وتثبيت الأجزاء وتكريم الحفاظ المتميزين.',
    subGoals: [
      'اكتشاف المواهب القرآنية الشابة وتأهيلها للمسابقات الوطنية',
      'تعزيز التنافس الإيجابي والإنضباط في الحلقات النموذجية',
      'ربط أولياء الأمور بمسيرة أبنائهم وتكريمهم في احتفال ختم المسابقة'
    ],
    targetAudience: 'جميع طلاب الحلقات المنتظمين',
    targetCount: 40,
    plannedBudget: 15000,
    actualBudget: 12500,
    budgetType: 'financial',
    location: 'القاعة الكبرى — الفرع الرئيسي',
    activityDate: '2026-08-25',
    startTime: '16:00',
    endTime: '20:00',
    responsibleStaffId: 'p7',
    responsibleStaffName: 'الشيخ/ يونس الدوسري',
    responsibleStaffRole: 'مدرس حلقة الإمام عاصم ورئيس لجنة المسابقات',
    taskStatus: 'accepted',
    targetCircles: ['حلقة الإمام عاصم', 'حلقة البخاري', 'حلقة الشاطبي'],
    targetAgeGroups: '١٠ - ١٨ سنة',
    requiresParentApproval: true,
    requiresAdminApproval: true,
    hasRewardsOrPrizes: true,
    linkedBadgeTemplateId: 'bt-1',
    attachments: [
      { id: 'att-1', name: 'خطة_المسابقة_والدليل_التنظيمي.pdf', size: '2.4 MB', type: 'application/pdf', uploadedAt: '2026-08-01', uploadedBy: 'الشيخ/ يونس الدوسري' },
      { id: 'att-2', name: 'جدول_اللجان_والحكام_المجازين.xlsx', size: '480 KB', type: 'application/vnd.ms-excel', uploadedAt: '2026-08-05', uploadedBy: 'أ. طارق بن فهد' }
    ],
    notes: 'تم حجز القاعة وتجهيز أجهزة الصوت وشاشات العرض التفاعلية.',
    status: 'ready',
    participants: [
      { id: 'part-1', studentId: 'st-1', studentName: 'عبدالرحمن الغامدي', circleName: 'حلقة الإمام عاصم', parentName: 'خالد الغامدي', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'not_recorded' },
      { id: 'part-2', studentId: 'st-2', studentName: 'يوسف العتيبي', circleName: 'حلقة الإمام عاصم', parentName: 'محمد العتيبي', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'not_recorded' },
      { id: 'part-3', studentId: 'st-3', studentName: 'أحمد محمد الشريف', circleName: 'حلقة الإمام عاصم', parentName: 'محمد الشريف', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'pending', approvalStatus: 'pending', attendanceStatus: 'not_recorded' },
      { id: 'part-4', studentId: 'st-4', studentName: 'علي حسن الشهري', circleName: 'حلقة البخاري', parentName: 'حسن الشهري', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'not_recorded' },
      { id: 'part-5', studentId: 'st-5', studentName: 'محمد خالد الزهراني', circleName: 'حلقة البخاري', parentName: 'خالد الزهراني', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'not_recorded' },
      { id: 'part-6', studentId: 'st-6', studentName: 'عمر عبدالعزيز القحطاني', circleName: 'حلقة الشاطبي', parentName: 'عبدالعزيز القحطاني', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'not_recorded' }
    ],
    budgetItems: [
      { id: 'b-1', category: 'مواصلات ونقل الحافلات', plannedAmount: 3000, actualAmount: 2800, notes: 'حافلتين لنقل الطلاب من الفروع' },
      { id: 'b-2', category: 'وجبات وضيافة الفعالية', plannedAmount: 4000, actualAmount: 3700, notes: 'عشاء فاخر للحكام والطلاب' },
      { id: 'b-3', category: 'الجوائز والأوسمة والشهادات', plannedAmount: 8000, actualAmount: 6000, notes: 'دروع مذهبة وأوسمة بنك الجوائز' }
    ],
    subTasks: [
      { id: 'st-1', title: 'تجهيز أوراق التحكيم ومعايير التقييم', assigneeName: 'أ. طارق بن فهد', assigneeId: 'p3', dueDate: '2026-08-20', priority: 'high', status: 'completed' },
      { id: 'st-2', title: 'إعداد وتجهيز الدروع والأوسمة من بنك الجوائز', assigneeName: 'الشيخ/ يونس الدوسري', assigneeId: 'p7', dueDate: '2026-08-22', priority: 'high', status: 'completed' },
      { id: 'st-3', title: 'تأكيد موافقة أولياء الأمور وتجهيز الحافلات', assigneeName: 'أ. طارق بن فهد', assigneeId: 'p3', dueDate: '2026-08-24', priority: 'medium', status: 'in_progress' },
      { id: 'st-4', title: 'استقبال المشاركين ورصد الحضور الإلكتروني', assigneeName: 'الشيخ/ يونس الدوسري', assigneeId: 'p7', dueDate: '2026-08-25', priority: 'high', status: 'not_started' }
    ],
    timeline: [
      { id: 'tl-1', timestamp: '2026-08-01 09:00', actor: 'أ.د. عبدالله بن سليمان', action: 'إنشاء مسودة النشاط وتكليف المسؤول', details: 'تم تعيين الشيخ يونس الدوسري مديراً للنشاط' },
      { id: 'tl-2', timestamp: '2026-08-01 10:15', actor: 'الشيخ/ يونس الدوسري', action: 'قبول مهمة إدارة النشاط', details: 'تم قبول المهمة وبدء وضع خطة التنفيذ' },
      { id: 'tl-3', timestamp: '2026-08-05 14:00', actor: 'أ. طارق بن فهد', action: 'ترشيح طلاب حلقات عاصم والبخاري والشاطبي', details: 'تم ترشيح ٦ طلاب مع رفع طلبات موافقة أولياء الأمور' },
      { id: 'tl-4', timestamp: '2026-08-10 11:30', actor: 'إدارة الملتقى', action: 'اعتماد المشاركين الجاهزين واكتمال مرحلة التخطيط', details: 'تحويل حالة النشاط إلى: جاهز للتنفيذ' }
    ],
    createdAt: '2026-08-01',
    createdBy: 'أ.د. عبدالله بن سليمان'
  },
  {
    id: 'act-lc-2',
    name: 'الرحلة التربوية والترفيهية لمركز دار الحديث بمعبر',
    typeCategory: 'trip',
    shortDescription: 'رحلة تربوية وتطبيقية لتعزيز الترابط الأخوي وتطوير مهارات الطلاب.',
    detailedDescription: 'رحلة ميدانية شاملة تشمل زيارة المشايخ والعلماء بمركز دار الحديث مع أنشطة رياضية ومسابقات مائية وثقافية.',
    mainGoal: 'ترسيخ الأخوة الإيمانية وتشجيع الحفاظ على مواصلة مسيرتهم العلمية.',
    subGoals: [
      'تطبيق الأخلاق القرآنية والعمل الجماعي ميدانياً',
      'تجديد نشاط الطلاب بعد موسم اختبارات الأجزاء',
      'زيارة العلماء والتعرف على المناهج والمخطوطات العلمية'
    ],
    targetAudience: 'طلاب الحلقات النموذجية والكوادر',
    targetCount: 30,
    plannedBudget: 200000,
    actualBudget: 195000,
    budgetType: 'financial',
    location: 'مركز دار الحديث بمعبر والموقع الترفيهي المجاور',
    activityDate: '2026-08-12',
    startTime: '07:00',
    endTime: '21:00',
    responsibleStaffId: 'p3',
    responsibleStaffName: 'أ. طارق بن فهد',
    responsibleStaffRole: 'مشرف الأنشطة والرحلات',
    taskStatus: 'accepted',
    targetCircles: ['حلقة الإمام عاصم', 'حلقة البخاري'],
    targetAgeGroups: '١٢ - ٢٠ سنة',
    requiresParentApproval: true,
    requiresAdminApproval: true,
    hasRewardsOrPrizes: true,
    attachments: [],
    status: 'in_progress',
    participants: [
      { id: 'part-201', studentId: 'st-1', studentName: 'عبدالرحمن الغامدي', circleName: 'حلقة الإمام عاصم', parentName: 'خالد الغامدي', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'present' },
      { id: 'part-202', studentId: 'st-2', studentName: 'يوسف العتيبي', circleName: 'حلقة الإمام عاصم', parentName: 'محمد العتيبي', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'present' },
      { id: 'part-203', studentId: 'st-4', studentName: 'علي حسن الشهري', circleName: 'حلقة البخاري', parentName: 'حسن الشهري', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'present' },
      { id: 'part-204', studentId: 'st-5', studentName: 'محمد خالد الزهراني', circleName: 'حلقة البخاري', parentName: 'خالد الزهراني', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'approved', approvalStatus: 'approved', attendanceStatus: 'absent', notes: 'عذر صحي طارئ صباح الرحلة' }
    ],
    budgetItems: [
      { id: 'b-201', category: 'إيجار حافلات حديثة مع سائقين', plannedAmount: 80000, actualAmount: 78000, notes: 'حافلتين VIP مكيفة' },
      { id: 'b-202', category: 'إعاشة ووجبات غذائية وتغذية متكاملة', plannedAmount: 70000, actualAmount: 69000, notes: 'إفطار وغداء وعشاء واستراحات' },
      { id: 'b-203', category: 'رسوم حجز الملاعب والأنشطة الترفيهية', plannedAmount: 50000, actualAmount: 48000, notes: 'مستلزمات رياضية وجوائز الفائزين' }
    ],
    subTasks: [
      { id: 'st-201', title: 'حجز الحافلات وتأكيد التصاريح الأمنية والتربوية', assigneeName: 'أ. طارق بن فهد', assigneeId: 'p3', dueDate: '2026-08-10', priority: 'high', status: 'completed' },
      { id: 'st-202', title: 'تسجيل وتدقيق حضور الطلاب عند الانطلاق', assigneeName: 'أ. طارق بن فهد', assigneeId: 'p3', dueDate: '2026-08-12', priority: 'high', status: 'completed' },
      { id: 'st-203', title: 'إدارة المسابقات والبرنامج العلمي بالمركز', assigneeName: 'الشيخ/ يونس الدوسري', assigneeId: 'p7', dueDate: '2026-08-12', priority: 'high', status: 'in_progress' }
    ],
    timeline: [
      { id: 'tl-201', timestamp: '2026-07-20 10:00', actor: 'أ.د. عبدالله بن سليمان', action: 'اعتماد خطة الرحلة وتعيين أ. طارق مديراً للنشاط', details: 'ميزانية معتمدة قدرها ٢٠٠,٠٠٠ ريال' },
      { id: 'tl-202', timestamp: '2026-08-12 07:15', actor: 'أ. طارق بن فهد', action: 'تسجيل كشف الحضور والانطلاق بنجاح', details: 'تغطية حضور ٣ طلاب وغياب طالب بعذر' }
    ],
    createdAt: '2026-07-20',
    createdBy: 'أ.د. عبدالله بن سليمان'
  },
  {
    id: 'act-lc-3',
    name: 'الدورة التنشيطية لإتقان أحكام التجويد والرسم العثماني',
    typeCategory: 'course',
    shortDescription: 'دورة علمية مكثفة للمدرسين والطلاب المتقدمين في مخارج الحروف والصفات.',
    detailedDescription: 'تهدف الدورة للارتقاء بالأداء الصوتي والتحقيقي لدى طلاب حلقات الإتقان مع أداء اختبار تحريري وشفهي نهاية الدورة.',
    mainGoal: 'تصحيح الأداء وتأهيل الطلاب لاجتياز اختبارات الإجازة بالسند.',
    subGoals: ['شرح الجزرية تفصيلياً', 'تطبيقات عملية على المصحف الشريف'],
    targetAudience: 'المدرسون والطلاب المتقدمون',
    targetCount: 25,
    plannedBudget: 5000,
    actualBudget: 0,
    budgetType: 'financial',
    location: 'قاعة المدارسة بفرع الإيمان',
    activityDate: '2026-09-01',
    startTime: '17:00',
    endTime: '19:30',
    responsibleStaffId: 'p7',
    responsibleStaffName: 'الشيخ/ يونس الدوسري',
    responsibleStaffRole: 'مدرس مقراء',
    taskStatus: 'pending',
    targetCircles: ['حلقة الإمام عاصم', 'حلقة نافع'],
    requiresParentApproval: false,
    requiresAdminApproval: true,
    hasRewardsOrPrizes: true,
    attachments: [],
    status: 'assigned',
    participants: [],
    budgetItems: [
      { id: 'b-301', category: 'طباعة متون ومذكرات التجويد', plannedAmount: 2000, actualAmount: 0 },
      { id: 'b-302', category: 'مكافأة محاضر الدورة والضيافة', plannedAmount: 3000, actualAmount: 0 }
    ],
    subTasks: [],
    timeline: [
      { id: 'tl-301', timestamp: '2026-08-11 08:00', actor: 'المدير العام', action: 'إنشاء طلب النشاط وإرسال تكليف للشيخ يونس الدوسري', details: 'بانتظار قبول المسؤول للتكليف' }
    ],
    createdAt: '2026-08-11',
    createdBy: 'أ.د. عبدالله بن سليمان'
  },
  {
    id: 'act-lc-4',
    name: 'الحفل التكريمي السنوي لخاتمي القرآن الكريم',
    typeCategory: 'ceremony',
    shortDescription: 'حفل التكريم الختامي الأكبر لتتويج الطلاب الخاتمين والأولياء والمعلمين المتميزين.',
    detailedDescription: 'حفل بهيج بحضور شخصيات بارزة وعلماء لتوزيع الدروع الذهبية والأوسمة المالية الكبرى وشهادات الإجازة.',
    mainGoal: 'إبراز ثمرة جهود الملتقى وتكريم الخاتمين وإدخال السرور على قلوبهم.',
    subGoals: ['تكريم ٣٠ خاتماً وخاتمة', 'توزيع جوائز بنك الأوسمة بقيمة تجاوزت ٥٠,٠٠0 ريال'],
    targetAudience: 'الجميع (علماء، طلاب، أولياء أمور، داعمون)',
    targetCount: 200,
    plannedBudget: 50000,
    actualBudget: 48500,
    budgetType: 'financial',
    location: 'مركز المؤتمرات والاحتفالات الكبرى',
    activityDate: '2026-07-28',
    startTime: '20:00',
    endTime: '22:30',
    responsibleStaffId: 'p3',
    responsibleStaffName: 'أ. طارق بن فهد',
    responsibleStaffRole: 'المشرف التنفيذي',
    taskStatus: 'accepted',
    targetCircles: ['جميع الحلقات'],
    requiresParentApproval: false,
    requiresAdminApproval: true,
    hasRewardsOrPrizes: true,
    attachments: [],
    status: 'completed',
    participants: [
      { id: 'part-401', studentId: 'st-1', studentName: 'عبدالرحمن الغامدي', circleName: 'حلقة الإمام عاصم', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'not_required', approvalStatus: 'approved', attendanceStatus: 'present' },
      { id: 'part-402', studentId: 'st-2', studentName: 'يوسف العتيبي', circleName: 'حلقة الإمام عاصم', isEligible: true, nominationStatus: 'nominated', parentApprovalStatus: 'not_required', approvalStatus: 'approved', attendanceStatus: 'present' }
    ],
    budgetItems: [
      { id: 'b-401', category: 'حجز وتجهيز القاعة والصوتيات والمرئيات', plannedAmount: 25000, actualAmount: 24500 },
      { id: 'b-402', category: 'مكافآت الخاتمين والأوسمة الذهبية', plannedAmount: 25000, actualAmount: 24000 }
    ],
    subTasks: [],
    evaluation: {
      goalAchieved: 5,
      organization: 5,
      engagement: 5,
      educationalImpact: 5,
      overallRating: 5,
      achievements: 'تم تكريم ٣٠ طالباً خاتماً وبث الحفل حياً لأكثر من ٥,٠٠٠ متابع.',
      challenges: 'ازدحام القاعة في الجزء الأخير بسبب الإقبال الكبير.',
      recommendations: 'توسعة القاعة وحجز قاعة إضافية لأولياء الأمور بالعام القادم.',
      notes: 'تم اعتماد التقرير وتسليم المكافآت بالكامل.',
      submittedBy: 'أ. طارق بن فهد',
      submittedAt: '2026-07-29'
    },
    timeline: [
      { id: 'tl-401', timestamp: '2026-07-01', actor: 'المدير العام', action: 'إنشاء حفل التكريم', details: 'تم تنفيذ الحفل ورصد التقييم الختامي بنجاح' }
    ],
    createdAt: '2026-07-01',
    createdBy: 'أ.د. عبدالله بن سليمان'
  }
];

// === INITIAL ACTIVITIES DATA ===
const initialActivities: ActivityRecord[] = [

  {
    id: 'act-1',
    name: 'المسابقة السنوية الكبرى لحفظ المصحف الشريف (١٤٤٧هـ)',
    type: 'contest',
    brief: 'مسابقة الملتقى السنوية لاختبار الطلاب في الحفظ والاتقان برعاية الهيئة العامة.',
    description: 'تجرى المسابقة على أربعة فروع: المصحف كاملاً، عشرين جزءاً، عشرة أجزاء، وخمسة أجزاء، مع لجان تحكيم مجازة بالسند.',
    organizer: 'اللجنة التعليمية العليا',
    executor: 'الشيخ/ يونس الدوسري',
    executorId: 'p7',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    duration: 'أسبوعين',
    location: 'المسجد الكبير والفرع الرئيسي',
    estimatedCost: 15000,
    actualCost: 14200,
    targetAudience: 'all',
    targetAudienceDetail: 'جميع مستويات وطلاب الحلقات المنتظمين',
    mainGoal: 'رفع مستوى ضبط المتشابهات وتثبيت الأجزاء وتكريم المتميزين.',
    expectedResults: 'مشاركة أكثر من ١٥٠ طالباً وحصول ٣٠ طالباً على تقييم ممتاز مرتفع.',
    status: 'active',
    expectedImpact: 'رفع نسبة ضبط المراجعة بنسبة ٣٠٪ وتقليص انحراف الأيام لجميع المشاركين.',
    actualImpact: 'تقدم ملحوظ لدى ٩٢٪ من المشاركين في الاختبارات التجريبية اللاحقة.',
    impactRatio: 88
  },
  {
    id: 'act-2',
    name: 'البرنامج الرمضاني التفاعلي (ربيع القلوب)',
    type: 'ramadan',
    brief: 'برنامج تدبري روحي مكثف يقام في شهر رمضان يشمل المدارسة والتثبيت التفاعلي.',
    description: 'دروس تدبر يومية قصيرة بعد صلاة العصر، يليها حلقة تثبيت جماعي لقصار السور والآيات المختارة.',
    organizer: 'إدارة شؤون الحلقات',
    executor: 'أ. طارق بن فهد',
    executorId: 'p3',
    startDate: '2026-03-01',
    endDate: '2026-03-30',
    duration: 'شهر كامل',
    location: 'قاعة المدارسة الالكترونية وغرف الحلقات',
    estimatedCost: 8000,
    actualCost: 7800,
    targetAudience: 'circles',
    targetAudienceDetail: 'حلقات الإمام عاصم وحلقة البخاري والناشئة',
    mainGoal: 'ربط الطلاب بمعاني كتاب الله وتربية النفوس على أخلاق القرآن.',
    expectedResults: 'تخريج أجيال تملك رصيداً معرفياً وتطبيقياً كبيراً وسلوكيات ممتازة.',
    status: 'completed',
    evaluationPoints: 94,
    evaluationGrade: 'ممتاز (أ)',
    expectedImpact: 'زيادة مستوى تدبر الآيات وتقليص غياب الطلاب الرمضاني المعتاد.',
    actualImpact: 'تصفير التسرب والغياب الرمضاني التلقائي ورفع رضا أولياء الأمور إلى ٩٦٪.',
    impactRatio: 95
  },
  {
    id: 'act-4',
    name: 'الرحلة الترفيهيه والتعليميه لمركز دار الحديث بمعبر',
    type: 'cultural',
    brief: 'رحلة تربوية وترفيهية تعليمية لتعزيز الترابط التربوي والعلمي وتنمية مهارات الطلاب والتطبيقات العلمية.',
    description: 'رحلة شاملة تشمل برامج علمية وثقافية ومسابقات رياضية وزيارات ميدانية لمركز دار الحديث بمعبر لتشجيع الحفاظ.',
    organizer: 'اللجنة الرياضية والترفيهية',
    executor: 'أ. طارق بن فهد',
    executorId: 'p3',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    duration: '٥ أيام',
    location: 'المسجد الكبير - مركز دار الحديث بمعبر',
    estimatedCost: 200000,
    actualCost: 195000,
    targetAudience: 'all',
    targetAudienceDetail: 'طلاب الحلقات النموذجية والكوادر التعليمية',
    mainGoal: 'تعزيز الترابط التربوي والعلمي وتطوير مهارات الطلاب والتطبيقات العلمية الحية.',
    expectedResults: 'مشاركة أكثر من ١٥٠ طالباً وتحقيق أهداف الرحلة بنسبة ٩٥٪.',
    status: 'active',
    expectedImpact: 'رفع الروح المعنوية وتعميق المعرفة والالتزام في الحلقات.',
    actualImpact: 'تمت الرحلة بنجاح وتلقينا انطباعات ممتازة من الطلاب والمعلمين.',
    impactRatio: 90
  }
];

const initialParticipants: Participant[] = [
  { id: 'p-1', activityId: 'act-1', name: 'عبدالرحمن الغامدي', circle: 'حلقة الإمام عاصم', type: 'student', registerDate: '2026-06-20', status: 'attended' },
  { id: 'p-2', activityId: 'act-1', name: 'يوسف العتيبي', circle: 'حلقة الإمام عاصم', type: 'student', registerDate: '2026-06-21', status: 'attended' },
  { id: 'p-4', activityId: 'act-1', name: 'أ. طارق بن فهد', circle: 'مشرف الحلقات', type: 'teacher', registerDate: '2026-06-19', status: 'attended' },
  { id: 'p-7', activityId: 'act-4', name: 'عبدالرحمن الغامدي', circle: 'حلقة الإمام عاصم', type: 'student', registerDate: '2026-06-28', status: 'attended' },
  { id: 'p-8', activityId: 'act-4', name: 'يوسف العتيبي', circle: 'حلقة الإمام عاصم', type: 'student', registerDate: '2026-06-28', status: 'attended' }
];

const initialNotifications: ActivityNotification[] = [
  {
    id: 'notif-101',
    recipientId: 'st-1',
    recipientName: 'عبدالرحمن الغامدي',
    title: '🎉 تهانينا! حصولك على وسام الحافظ المتقن',
    message: 'تم منحك "وسام الحافظ المتقن" بنجاح واهداؤك مكافأة مالية بقيمة 5,000 ريال سعودي. يمكنك طباعة شهادتك الآن!',
    type: 'badge_earned',
    createdAt: '2026-08-10 10:00',
    isRead: false
  },
  {
    id: 'notif-102',
    recipientId: 'parent-1',
    recipientName: 'خالد الغامدي (ولي أمر الطالب عبدالرحمن)',
    title: '🏆 إشعار تكريم ابنكم عبدالرحمن الغامدي',
    message: 'يسر إدارة الملتقى إعلامكم بتكريم ابنكم عبدالرحمن بـ "وسام الحافظ المتقن" ومكافأة 5,000 ريال لإتقانه القرآن.',
    type: 'badge_earned',
    createdAt: '2026-08-10 10:05',
    isRead: false
  }
];

export default function ActivitiesAwards({ currentUser, onNavigate }: { currentUser?: any; onNavigate?: (tab: string) => void } = {}) {
  // === MAIN TAB NAVIGATION ===
  const [mainTab, setMainTab] = useState<'activities' | 'awards_badges' | 'printing'>('awards_badges');

  // Subtabs for "الأوسمة والجوائز"
  const [awardsSubTab, setAwardsSubTab] = useState<'my-badges' | 'badge-bank' | 'grant-badge' | 'approval-requests' | 'badge-log' | 'badge-rules'>('my-badges');

  // Roles & View Perspective Switcher (المدير العام / المدير التنفيذي / المدرس / الطالب / ولي الأمر)
  const [currentUserRole, setCurrentUserRole] = useState<'general_manager' | 'executive_director' | 'teacher' | 'student' | 'parent'>('general_manager');
  const [selectedUserIdentity, setSelectedUserIdentity] = useState<string>('أ.د. عبدالله بن سليمان (المدير العام)');

  // Dynamic Data States
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>(initialBadgeTemplates);
  const [grantedBadges, setGrantedBadges] = useState<GrantedBadge[]>(initialGrantedBadges);
  const [notifications, setNotifications] = useState<ActivityNotification[]>(initialNotifications);

  // Activities Data States
  const [activities, setActivities] = useState<ActivityRecord[]>(initialActivities);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  // === ACTIVITIES LIFECYCLE MANAGEMENT STATES ===
  const [activitiesLifecycle, setActivitiesLifecycle] = useState<ActivityLifecycleItem[]>(initialActivitiesLifecycle);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityDetailTab, setActivityDetailTab] = useState<'overview' | 'participants' | 'attendance' | 'budget' | 'subtasks' | 'attachments' | 'report' | 'timeline' | 'print'>('overview');
  
  // Activity Filters
  const [actCategoryFilter, setActCategoryFilter] = useState<string>('all');
  const [actStatusFilter, setActStatusFilter] = useState<string>('all');
  const [actExecutorFilter, setActExecutorFilter] = useState<string>('all');
  const [actSearchQuery, setActSearchQuery] = useState<string>('');
  
  // Create / Edit Activity Modal
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLifecycleItem | null>(null);
  const [activityForm, setActivityForm] = useState<{
    name: string;
    typeCategory: ActivityTypeCategory;
    customCategoryName: string;
    shortDescription: string;
    detailedDescription: string;
    mainGoal: string;
    subGoalsText: string;
    targetAudience: string;
    targetCount: number;
    plannedBudget: number;
    budgetType: 'financial' | 'in_kind' | 'mixed';
    location: string;
    activityDate: string;
    startTime: string;
    endTime: string;
    responsibleStaffId: string;
    targetCircles: string[];
    requiresParentApproval: boolean;
    requiresAdminApproval: boolean;
    hasRewardsOrPrizes: boolean;
    linkedBadgeTemplateId: string;
    notes: string;
  }>({
    name: '',
    typeCategory: 'contest',
    customCategoryName: '',
    shortDescription: '',
    detailedDescription: '',
    mainGoal: '',
    subGoalsText: '',
    targetAudience: 'جميع الحلقات',
    targetCount: 30,
    plannedBudget: 5000,
    budgetType: 'financial',
    location: 'القاعة الكبرى',
    activityDate: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '18:00',
    responsibleStaffId: 'p7',
    targetCircles: ['حلقة الإمام عاصم'],
    requiresParentApproval: true,
    requiresAdminApproval: true,
    hasRewardsOrPrizes: true,
    linkedBadgeTemplateId: 'bt-1',
    notes: ''
  });

  // Task Rejection Modal
  const [rejectingActivityId, setRejectingActivityId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Reassign Modal
  const [reassigningActivityId, setReassigningActivityId] = useState<string | null>(null);
  const [newAssigneeStaffId, setNewAssigneeStaffId] = useState('p3');

  // Subtask Modal
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskAssignee, setNewSubTaskAssignee] = useState('أ. طارق بن فهد');
  const [newSubTaskDueDate, setNewSubTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSubTaskPriority, setNewSubTaskPriority] = useState<'low' | 'medium' | 'high'>('high');

  // Budget Item Modal
  const [isBudgetItemModalOpen, setIsBudgetItemModalOpen] = useState(false);
  const [newBudgetItemCategory, setNewBudgetItemCategory] = useState('');
  const [newBudgetItemPlanned, setNewBudgetItemPlanned] = useState(1000);
  const [newBudgetItemNotes, setNewBudgetItemNotes] = useState('');

  // Badge Bank Modal (Create / Edit)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<BadgeTemplate>>({
    name: '', honorificTitle: '', description: '', icon: '🏅', badgeType: 'auto',
    targetAudience: 'students', grantMethod: '', isAuto: true, requiresApproval: false,
    allowRepeat: false, rewardType: 'financial', rewardAmount: 1000, rewardDescription: '',
    hasLevels: false, status: 'active'
  });

  // Direct Grant Modal (For Director / Manager)
  const [grantForm, setGrantForm] = useState({
    templateId: 'bt-3',
    recipientType: 'student' as 'student' | 'teacher' | 'supervisor' | 'admin',
    recipientName: 'عبدالرحمن الغامدي',
    recipientCircle: 'حلقة الإمام عاصم',
    recipientParent: 'خالد الغامدي',
    reason: 'تميز خلقي واستثنائي في تمثيل الحلقة في المسابقات',
    customRewardAmount: 3000
  });

  // Printing Modal / Certificate Viewer
  const [printingBadge, setPrintingBadge] = useState<GrantedBadge | null>(null);

  // Search & Filter for Badge Log
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');

  // Auto Condition Evaluator Feedback State
  const [testRuleResult, setTestRuleResult] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setApiError(null);
        const [actRes, awardRes] = await Promise.allSettled([
          getActivities(),
          getAwards(),
        ]);

        if (actRes.status === 'fulfilled' && actRes.value.items?.length > 0) {
          const mapped: ActivityLifecycleItem[] = actRes.value.items.map((a: any) => ({
            id: a.id,
            name: a.title,
            typeCategory: (a.type?.toLowerCase() || 'contest') as ActivityTypeCategory,
            shortDescription: a.description || '',
            detailedDescription: a.description || '',
            mainGoal: a.title,
            subGoals: [],
            targetAudience: 'جميع الطلاب',
            targetCount: a.capacity || 30,
            plannedBudget: 0,
            actualBudget: 0,
            budgetType: 'financial',
            location: a.location || 'القاعة الكبرى',
            activityDate: a.startsAt ? a.startsAt.split('T')[0] : new Date().toISOString().split('T')[0],
            startTime: '16:00',
            endTime: '18:00',
            responsibleStaffId: 'p7',
            responsibleStaffName: 'مسؤول النشاط',
            responsibleStaffRole: 'مشرف الأنشطة',
            taskStatus: 'accepted',
            targetCircles: [a.halaqa?.name || 'جميع الحلقات'],
            requiresParentApproval: true,
            requiresAdminApproval: false,
            hasRewardsOrPrizes: true,
            attachments: [],
            status: a.status === 'PUBLISHED' ? 'ready' : a.status === 'IN_PROGRESS' ? 'in_progress' : a.status === 'COMPLETED' ? 'completed' : a.status === 'CANCELLED' ? 'cancelled' : 'draft',
            participants: (a.participants || []).map((p: any) => ({
              id: p.id,
              studentId: p.studentId,
              studentName: p.student?.user?.displayName || p.student?.user?.username || 'طالب',
              circleName: a.halaqa?.name || 'حلقة عامة',
              isEligible: true,
              nominationStatus: p.nominationStatus === 'NOMINATED' ? 'nominated' : 'nominated',
              parentApprovalStatus: p.parentApprovalStatus === 'APPROVED' ? 'approved' : 'pending',
              approvalStatus: p.nominationStatus === 'APPROVED' ? 'approved' : 'pending',
              attendanceStatus: p.attendanceStatus?.toLowerCase() || 'not_recorded',
            })),
            budgetItems: [],
            subTasks: [],
            timeline: [],
            createdAt: a.createdAt,
            createdBy: 'الإدارة',
          }));
          setActivitiesLifecycle(mapped);
        }

        if (awardRes.status === 'fulfilled' && awardRes.value.items?.length > 0) {
          const mappedTemplates: BadgeTemplate[] = awardRes.value.items.map((aw: any) => ({
            id: aw.id,
            name: aw.name,
            honorificTitle: aw.name,
            description: aw.description || '',
            icon: aw.iconKey || '🏅',
            badgeType: 'special',
            targetAudience: 'students',
            grantMethod: 'يدوي',
            isAuto: false,
            requiresApproval: false,
            allowRepeat: true,
            rewardType: 'honor',
            rewardAmount: aw.points || 0,
            rewardDescription: `${aw.points} نقطة`,
            hasLevels: false,
            status: aw.isActive ? 'active' : 'disabled',
            createdAt: aw.createdAt,
            grantedCount: aw._count?.studentAwards || 0,
          }));
          setBadgeTemplates(mappedTemplates);
        }
      } catch (err: any) {
        setApiError(err.message || 'تعذر تحميل بيانات الأنشطة والأوسمة');
      }
    }

    loadData();
  }, []);

  // Helper: Filter Granted Badges based on User Role Perspective
  const visibleBadgesForRole = useMemo(() => {
    if (currentUserRole === 'general_manager' || currentUserRole === 'executive_director') {
      return grantedBadges;
    }
    if (currentUserRole === 'student') {
      return grantedBadges.filter(b => b.recipientName === 'عبدالرحمن الغامدي' || b.recipientId === 'st-1');
    }
    if (currentUserRole === 'parent') {
      return grantedBadges.filter(b => b.recipientParent === 'خالد الغامدي' || b.recipientName === 'عبدالرحمن الغامدي');
    }
    if (currentUserRole === 'teacher') {
      return grantedBadges.filter(b => b.recipientCircle === 'حلقة الإمام عاصم' || b.recipientName === 'الشيخ/ يونس الدوسري');
    }
    return grantedBadges;
  }, [grantedBadges, currentUserRole]);

  // Statistics for "أوسمتي / ملخص الأوسمة"
  const stats = useMemo(() => {
    const list = visibleBadgesForRole.filter(b => b.approvalStatus === 'granted');
    const totalCount = list.length;
    const autoCount = list.filter(b => b.badgeType === 'auto').length;
    const directorCount = list.filter(b => b.badgeType === 'director').length;
    const specialCount = list.filter(b => b.badgeType === 'special').length;
    const totalRewardsSum = list.reduce((acc, b) => acc + (b.snapshotRewardAmount || 0), 0);

    return { totalCount, autoCount, directorCount, specialCount, totalRewardsSum };
  }, [visibleBadgesForRole]);

  // Pending Approval List (for Managers)
  const pendingApprovals = useMemo(() => {
    return grantedBadges.filter(b => b.approvalStatus === 'pending_approval' || b.approvalStatus === 'eligible');
  }, [grantedBadges]);

  // Handle Approve / Reject Badge Request
  const handleApproveBadge = (badgeId: string, isApproved: boolean) => {
    setGrantedBadges(prev => prev.map(b => {
      if (b.id === badgeId) {
        const newStatus = isApproved ? 'granted' : 'rejected';
        
        // Dispatch notifications if approved
        if (isApproved) {
          const newNotif1: ActivityNotification = {
            id: `notif-${Date.now()}-1`,
            recipientId: b.recipientId,
            recipientName: b.recipientName,
            title: `🎉 اعتماد منحك: ${b.badgeName}`,
            message: `اعتمدت الإدارة منحك "${b.badgeName}" (${b.honorificTitle}) بمكافأة قدرها ${b.snapshotRewardAmount.toLocaleString()} ريال!`,
            type: 'badge_approved',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            isRead: false
          };
          setNotifications(n => [newNotif1, ...n]);
        }

        return {
          ...b,
          approvalStatus: newStatus as any,
          approvedBy: selectedUserIdentity
        };
      }
      return b;
    }));
  };

  // Handle Manual Direct Grant
  const handleDirectGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const template = badgeTemplates.find(t => t.id === grantForm.templateId);
    if (!template) return;

    const newBadgeRecord: GrantedBadge = {
      id: `BDG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      badgeTemplateId: template.id,
      badgeName: template.name,
      honorificTitle: template.honorificTitle || template.name,
      recipientId: `usr-${Date.now()}`,
      recipientName: grantForm.recipientName,
      recipientRole: grantForm.recipientType,
      recipientCircle: grantForm.recipientCircle,
      recipientParent: grantForm.recipientParent,
      badgeType: template.badgeType,
      obtainedHow: grantForm.reason,
      awardDate: new Date().toISOString().split('T')[0],
      snapshotRewardType: template.rewardType,
      snapshotRewardAmount: grantForm.customRewardAmount || template.rewardAmount, // Preserve snapshot
      snapshotRewardDescription: template.rewardDescription || `${grantForm.customRewardAmount} ريال سعودي`,
      approvalStatus: 'granted', // Direct grant by manager is immediately granted
      grantedBy: selectedUserIdentity,
      approvedBy: selectedUserIdentity
    };

    setGrantedBadges(prev => [newBadgeRecord, ...prev]);

    // Dispatch notification
    const newNotif: ActivityNotification = {
      id: `notif-${Date.now()}`,
      recipientId: newBadgeRecord.recipientId,
      recipientName: grantForm.recipientName,
      title: `🏆 تكريم خاص: ${template.name}`,
      message: `تم منحكم رسمياً "${template.name}" لقاء جهودكم المتميزة.`,
      type: 'badge_earned',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert(`تم منح "${template.name}" بنجاح للشخص (${grantForm.recipientName}) وحفظ قيمة المكافأة (${grantForm.customRewardAmount} ريال) بنجاح.`);
    setGrantForm(prev => ({ ...prev, reason: '' }));
  };

  // Save / Add Badge Template to Badge Bank
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      // Update
      setBadgeTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...templateForm } as BadgeTemplate : t));
    } else {
      // Add
      const newT: BadgeTemplate = {
        id: `bt-${Date.now()}`,
        name: templateForm.name || 'وسام جديد',
        honorificTitle: templateForm.honorificTitle || 'متميز',
        description: templateForm.description || '',
        icon: templateForm.icon || '🏅',
        badgeType: templateForm.badgeType || 'auto',
        targetAudience: templateForm.targetAudience || 'students',
        grantMethod: templateForm.grantMethod || 'شرط تلقائي',
        isAuto: templateForm.isAuto ?? true,
        requiresApproval: templateForm.requiresApproval ?? false,
        allowRepeat: templateForm.allowRepeat ?? false,
        rewardType: templateForm.rewardType || 'financial',
        rewardAmount: Number(templateForm.rewardAmount) || 0,
        rewardDescription: templateForm.rewardDescription || `${templateForm.rewardAmount} ريال`,
        hasLevels: templateForm.hasLevels ?? false,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setBadgeTemplates(prev => [...prev, newT]);
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  // Toggle Badge Template Status (Active / Disabled)
  const handleToggleTemplateStatus = (id: string) => {
    setBadgeTemplates(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'disabled' : 'active' } : t));
  };

  // Delete Template from Bank (only if no records linked)
  const handleDeleteTemplate = (id: string) => {
    const isLinked = grantedBadges.some(gb => gb.badgeTemplateId === id);
    if (isLinked) {
      alert('لا يمكن حذف هذا الوسام من البنك لوجود سجلات وأوسمة تاريخية ممنوحة مرتبطة به. يمكنك "تعطيل الوسام" بدلاً من الحذف لتجميده.');
      return;
    }
    if (confirm('هل أنت تأكد من حذف هذا الوسام نهائياً؟')) {
      setBadgeTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  // === ACTIVITY LIFECYCLE HELPER FUNCTIONS ===

  // Calculate Readiness Score (0 - 100%)
  const calculateReadinessScore = (act: ActivityLifecycleItem): number => {
    let score = 0;
    if (act.name && act.responsibleStaffId && act.activityDate) score += 20;
    if (act.taskStatus === 'accepted') score += 20;
    if (act.participants && act.participants.length > 0) {
      const approvedRatio = act.participants.filter(p => p.approvalStatus === 'approved').length / act.participants.length;
      score += Math.round(approvedRatio * 20);
    }
    if (act.plannedBudget > 0 && act.budgetItems && act.budgetItems.length > 0) score += 20;
    if (act.subTasks && act.subTasks.length > 0) {
      const doneRatio = act.subTasks.filter(st => st.status === 'completed').length / act.subTasks.length;
      score += Math.round(doneRatio * 20);
    } else {
      score += 10;
    }
    return Math.min(score, 100);
  };

  // Calculate Risk Alerts
  const calculateRiskAlerts = (act: ActivityLifecycleItem): string[] => {
    const alerts: string[] = [];
    if (act.taskStatus === 'pending') {
      alerts.push('⚠️ مسؤول النشاط المكلف لم يستلم/يقبل المهمة بعد.');
    }
    if (act.taskStatus === 'rejected') {
      alerts.push(`🚨 تم رفض التكليف من المسؤول! السبب: ${act.rejectionReason || 'غير محدد'}`);
    }
    if (act.requiresParentApproval) {
      const pendingParents = act.participants.filter(p => p.parentApprovalStatus === 'pending').length;
      if (pendingParents > 0) {
        alerts.push(`⚠️ يوجد ${pendingParents} طالباً بانتظار موافقة أولياء الأمور.`);
      }
    }
    if (act.actualBudget > act.plannedBudget) {
      alerts.push(`🚨 المصروفات الفعلية (${act.actualBudget.toLocaleString()} ريال) تجاوزت الميزانية المخططة (${act.plannedBudget.toLocaleString()} ريال).`);
    }
    if (act.status === 'ready' && act.participants.filter(p => p.approvalStatus === 'approved').length === 0) {
      alerts.push('⚠️ النشاط على وشك الانطلاق دون اعتماد قائمة الطلاب النهائية.');
    }
    return alerts;
  };

  // Open Create/Edit Activity Modal
  const handleOpenCreateActivityModal = (actToEdit?: ActivityLifecycleItem) => {
    if (actToEdit) {
      setEditingActivity(actToEdit);
      setActivityForm({
        name: actToEdit.name,
        typeCategory: actToEdit.typeCategory,
        customCategoryName: actToEdit.customCategoryName || '',
        shortDescription: actToEdit.shortDescription,
        detailedDescription: actToEdit.detailedDescription || '',
        mainGoal: actToEdit.mainGoal,
        subGoalsText: (actToEdit.subGoals || []).join('\n'),
        targetAudience: actToEdit.targetAudience,
        targetCount: actToEdit.targetCount,
        plannedBudget: actToEdit.plannedBudget,
        budgetType: actToEdit.budgetType,
        location: actToEdit.location,
        activityDate: actToEdit.activityDate,
        startTime: actToEdit.startTime,
        endTime: actToEdit.endTime,
        responsibleStaffId: actToEdit.responsibleStaffId,
        targetCircles: actToEdit.targetCircles,
        requiresParentApproval: actToEdit.requiresParentApproval,
        requiresAdminApproval: actToEdit.requiresAdminApproval,
        hasRewardsOrPrizes: actToEdit.hasRewardsOrPrizes,
        linkedBadgeTemplateId: actToEdit.linkedBadgeTemplateId || '',
        notes: actToEdit.notes || ''
      });
    } else {
      setEditingActivity(null);
      setActivityForm({
        name: '',
        typeCategory: 'contest',
        customCategoryName: '',
        shortDescription: '',
        detailedDescription: '',
        mainGoal: '',
        subGoalsText: '',
        targetAudience: 'جميع طلاب الحلقات',
        targetCount: 30,
        plannedBudget: 5000,
        budgetType: 'financial',
        location: 'القاعة الكبرى',
        activityDate: new Date().toISOString().split('T')[0],
        startTime: '16:00',
        endTime: '18:00',
        responsibleStaffId: 'p7',
        targetCircles: ['حلقة الإمام عاصم'],
        requiresParentApproval: true,
        requiresAdminApproval: true,
        hasRewardsOrPrizes: true,
        linkedBadgeTemplateId: 'bt-1',
        notes: ''
      });
    }
    setIsCreateActivityModalOpen(true);
  };

  // Save Activity (Create or Edit)
  const handleSaveActivityModal = (e: React.FormEvent) => {
    e.preventDefault();
    const staffList = [
      { id: 'p7', name: 'الشيخ/ يونس الدوسري', role: 'مدرس حلقة الإمام عاصم ورئيس لجنة المسابقات' },
      { id: 'p3', name: 'أ. طارق بن فهد', role: 'المشرف التنفيذي ومسؤول الرحلات' },
      { id: 'p1', name: 'أ. د. عبدالله بن سليمان', role: 'المدير العام' }
    ];
    const staff = staffList.find(s => s.id === activityForm.responsibleStaffId) || staffList[0];

    const subGoals = activityForm.subGoalsText.split('\n').filter(s => s.trim().length > 0);

    if (editingActivity) {
      setActivitiesLifecycle(prev => prev.map(a => {
        if (a.id === editingActivity.id) {
          const isStaffChanged = a.responsibleStaffId !== activityForm.responsibleStaffId;
          return {
            ...a,
            name: activityForm.name,
            typeCategory: activityForm.typeCategory,
            customCategoryName: activityForm.customCategoryName,
            shortDescription: activityForm.shortDescription,
            detailedDescription: activityForm.detailedDescription,
            mainGoal: activityForm.mainGoal,
            subGoals,
            targetAudience: activityForm.targetAudience,
            targetCount: Number(activityForm.targetCount) || 10,
            plannedBudget: Number(activityForm.plannedBudget) || 0,
            budgetType: activityForm.budgetType,
            location: activityForm.location,
            activityDate: activityForm.activityDate,
            startTime: activityForm.startTime,
            endTime: activityForm.endTime,
            responsibleStaffId: staff.id,
            responsibleStaffName: staff.name,
            responsibleStaffRole: staff.role,
            taskStatus: isStaffChanged ? 'pending' : a.taskStatus,
            targetCircles: activityForm.targetCircles,
            requiresParentApproval: activityForm.requiresParentApproval,
            requiresAdminApproval: activityForm.requiresAdminApproval,
            hasRewardsOrPrizes: activityForm.hasRewardsOrPrizes,
            linkedBadgeTemplateId: activityForm.linkedBadgeTemplateId,
            notes: activityForm.notes,
            timeline: [
              ...a.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                actor: selectedUserIdentity,
                action: 'تحديث بيانات وخطة النشاط',
                details: isStaffChanged ? `تم تغيير المسؤول إلى: ${staff.name}` : 'تعديل التفاصيل والميزانية'
              }
            ]
          };
        }
        return a;
      }));
    } else {
      const newAct: ActivityLifecycleItem = {
        id: `act-lc-${Date.now()}`,
        name: activityForm.name,
        typeCategory: activityForm.typeCategory,
        customCategoryName: activityForm.customCategoryName,
        shortDescription: activityForm.shortDescription,
        detailedDescription: activityForm.detailedDescription,
        mainGoal: activityForm.mainGoal,
        subGoals,
        targetAudience: activityForm.targetAudience,
        targetCount: Number(activityForm.targetCount) || 10,
        plannedBudget: Number(activityForm.plannedBudget) || 0,
        actualBudget: 0,
        budgetType: activityForm.budgetType,
        location: activityForm.location,
        activityDate: activityForm.activityDate,
        startTime: activityForm.startTime,
        endTime: activityForm.endTime,
        responsibleStaffId: staff.id,
        responsibleStaffName: staff.name,
        responsibleStaffRole: staff.role,
        taskStatus: 'pending',
        targetCircles: activityForm.targetCircles,
        requiresParentApproval: activityForm.requiresParentApproval,
        requiresAdminApproval: activityForm.requiresAdminApproval,
        hasRewardsOrPrizes: activityForm.hasRewardsOrPrizes,
        linkedBadgeTemplateId: activityForm.linkedBadgeTemplateId,
        notes: activityForm.notes,
        status: 'draft',
        participants: [],
        budgetItems: [],
        subTasks: [],
        attachments: [],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            actor: selectedUserIdentity,
            action: 'إنشاء مسودة الفعالية وتكليف مسؤول المتابعة',
            details: `تم تكليف ${staff.name} بمهام إدارة وتنفيذ الفعالية`
          }
        ],
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: selectedUserIdentity
      };
      setActivitiesLifecycle(prev => [newAct, ...prev]);

      // Dispatch Notification to responsible staff
      const newNotif: ActivityNotification = {
        id: `notif-act-${Date.now()}`,
        recipientId: staff.id,
        recipientName: staff.name,
        title: `📌 تكليف جديد بفعالية: ${activityForm.name}`,
        message: `تم تكليفك رسمياً بإدارة وتنفيذ فعاليات "${activityForm.name}". يرجى الدخول والموافقة لبدء التخطيط.`,
        type: 'activity_reminder',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    setIsCreateActivityModalOpen(false);
    setEditingActivity(null);
  };

  // Staff Accept Task Assignment
  const handleAcceptTaskAssignment = (actId: string) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          taskStatus: 'accepted',
          status: a.status === 'draft' || a.status === 'assigned' ? 'planned' : a.status,
          timeline: [
            ...a.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actor: selectedUserIdentity,
              action: 'قبول مهمة وتكليف إدارة الفعالية',
              details: 'أكد المسؤول جاهزيته للبدء في الترشيحات والتخطيط التنفيذي'
            }
          ]
        };
      }
      return a;
    }));
  };

  // Staff Reject Task Assignment
  const handleRejectTaskAssignment = (actId: string, reason: string) => {
    if (!reason.trim()) {
      alert('يرجى كتابة سبب الاعتذار/الرفض لتنبيه إدارة الملتقى.');
      return;
    }
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          taskStatus: 'rejected',
          rejectionReason: reason,
          timeline: [
            ...a.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actor: selectedUserIdentity,
              action: 'اعتذار عن قبول مهمة الفعالية',
              details: `سبب الاعتذار: ${reason}`
            }
          ]
        };
      }
      return a;
    }));

    // Alert Admin Notification
    const adminNotif: ActivityNotification = {
      id: `notif-rej-${Date.now()}`,
      recipientId: 'admin',
      recipientName: 'إدارة الملتقى',
      title: '🚨 اعتذار مسند فعالية',
      message: `اعتذر الكادر عن تكليف الفعالية بسبب: "${reason}". يرجى إعادة تعيين كادر آخر.`,
      type: 'activity_reminder',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false
    };
    setNotifications(prev => [adminNotif, ...prev]);
    setRejectingActivityId(null);
    setRejectionReasonInput('');
  };

  // GM Reassign Staff
  const handleReassignTaskAssignment = (actId: string, newStaffId: string) => {
    const staffList = [
      { id: 'p7', name: 'الشيخ/ يونس الدوسري', role: 'مدرس حلقة الإمام عاصم ورئيس لجنة المسابقات' },
      { id: 'p3', name: 'أ. طارق بن فهد', role: 'المشرف التنفيذي ومسؤول الرحلات' },
      { id: 'p1', name: 'أ. د. عبدالله بن سليمان', role: 'المدير العام' }
    ];
    const newStaff = staffList.find(s => s.id === newStaffId) || staffList[0];

    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          responsibleStaffId: newStaff.id,
          responsibleStaffName: newStaff.name,
          responsibleStaffRole: newStaff.role,
          taskStatus: 'pending',
          rejectionReason: undefined,
          timeline: [
            ...a.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actor: selectedUserIdentity,
              action: 'إعادة تعيين المسؤول عن تنفيذ الفعالية',
              details: `تم نقل التكليف إلى: ${newStaff.name}`
            }
          ]
        };
      }
      return a;
    }));
    setReassigningActivityId(null);
  };

  // Student Nomination Toggle
  const handleToggleStudentNomination = (actId: string, studentId: string, studentName: string, circleName: string, parentName?: string) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const existing = a.participants.find(p => p.studentId === studentId);
        let updatedParticipants = [...a.participants];
        if (existing) {
          updatedParticipants = updatedParticipants.filter(p => p.studentId !== studentId);
        } else {
          updatedParticipants.push({
            id: `part-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            studentId,
            studentName,
            circleName,
            parentName: parentName || 'ولي الأمر',
            isEligible: true,
            nominationStatus: 'nominated',
            parentApprovalStatus: a.requiresParentApproval ? 'pending' : 'not_required',
            approvalStatus: 'pending',
            attendanceStatus: 'not_recorded'
          });
        }
        return { ...a, participants: updatedParticipants };
      }
      return a;
    }));
  };

  // Parent Approval Update
  const handleUpdateParentApproval = (actId: string, studentId: string, newStatus: 'approved' | 'rejected') => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const updatedParticipants = a.participants.map(p => {
          if (p.studentId === studentId) {
            return {
              ...p,
              parentApprovalStatus: newStatus,
              approvalStatus: newStatus === 'rejected' ? 'rejected' : p.approvalStatus
            };
          }
          return p;
        });
        return { ...a, participants: updatedParticipants };
      }
      return a;
    }));
  };

  // Final Admin Student Approval
  const handleUpdateFinalStudentApproval = (actId: string, studentId: string, newStatus: 'approved' | 'rejected') => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const updatedParticipants = a.participants.map(p => {
          if (p.studentId === studentId) {
            return { ...p, approvalStatus: newStatus };
          }
          return p;
        });
        return { ...a, participants: updatedParticipants };
      }
      return a;
    }));
  };

  // Batch Select Circle Students
  const handleBatchSelectCircle = (actId: string, circleName: string) => {
    const defaultStudents = [
      { studentId: 'st-1', studentName: 'عبدالرحمن الغامدي', circleName: 'حلقة الإمام عاصم', parentName: 'خالد الغامدي' },
      { studentId: 'st-2', studentName: 'يوسف العتيبي', circleName: 'حلقة الإمام عاصم', parentName: 'محمد العتيبي' },
      { studentId: 'st-3', studentName: 'أحمد محمد الشريف', circleName: 'حلقة الإمام عاصم', parentName: 'محمد الشريف' },
      { studentId: 'st-4', studentName: 'علي حسن الشهري', circleName: 'حلقة البخاري', parentName: 'حسن الشهري' },
      { studentId: 'st-5', studentName: 'محمد خالد الزهراني', circleName: 'حلقة البخاري', parentName: 'خالد الزهراني' },
      { studentId: 'st-6', studentName: 'عمر عبدالعزيز القحطاني', circleName: 'حلقة الشاطبي', parentName: 'عبدالعزيز القحطاني' }
    ];
    const targetStudents = defaultStudents.filter(s => s.circleName === circleName);

    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        let currentP = [...a.participants];
        targetStudents.forEach(st => {
          if (!currentP.some(p => p.studentId === st.studentId)) {
            currentP.push({
              id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              studentId: st.studentId,
              studentName: st.studentName,
              circleName: st.circleName,
              parentName: st.parentName,
              isEligible: true,
              nominationStatus: 'nominated',
              parentApprovalStatus: a.requiresParentApproval ? 'pending' : 'not_required',
              approvalStatus: 'approved',
              attendanceStatus: 'not_recorded'
            });
          }
        });
        return { ...a, participants: currentP };
      }
      return a;
    }));
  };

  // Record Attendance
  const handleRecordAttendance = (actId: string, studentId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const updated = a.participants.map(p => {
          if (p.studentId === studentId) {
            return { ...p, attendanceStatus: status, notes: notes !== undefined ? notes : p.notes };
          }
          return p;
        });
        return { ...a, participants: updated };
      }
      return a;
    }));
  };

  // Add Budget Item
  const handleAddExpenseBudgetItem = (actId: string) => {
    if (!newBudgetItemCategory.trim()) return;
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const newItems = [
          ...(a.budgetItems || []),
          {
            id: `b-${Date.now()}`,
            category: newBudgetItemCategory,
            plannedAmount: Number(newBudgetItemPlanned) || 0,
            actualAmount: 0,
            notes: newBudgetItemNotes
          }
        ];
        const newPlannedTotal = newItems.reduce((acc, curr) => acc + curr.plannedAmount, 0);
        return { ...a, budgetItems: newItems, plannedBudget: newPlannedTotal };
      }
      return a;
    }));
    setNewBudgetItemCategory('');
    setNewBudgetItemPlanned(1000);
    setNewBudgetItemNotes('');
    setIsBudgetItemModalOpen(false);
  };

  // Update Actual Cost for Budget Item
  const handleUpdateActualExpense = (actId: string, itemId: string, actualAmount: number) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const updatedItems = (a.budgetItems || []).map(b => b.id === itemId ? { ...b, actualAmount } : b);
        const newActualTotal = updatedItems.reduce((acc, curr) => acc + curr.actualAmount, 0);
        return { ...a, budgetItems: updatedItems, actualBudget: newActualTotal };
      }
      return a;
    }));
  };

  // Add Subtask
  const handleAddSubTaskItem = (actId: string) => {
    if (!newSubTaskTitle.trim()) return;
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const newTasks = [
          ...(a.subTasks || []),
          {
            id: `st-${Date.now()}`,
            title: newSubTaskTitle,
            assigneeName: newSubTaskAssignee,
            dueDate: newSubTaskDueDate,
            priority: newSubTaskPriority,
            status: 'not_started' as const
          }
        ];
        return { ...a, subTasks: newTasks };
      }
      return a;
    }));
    setNewSubTaskTitle('');
    setIsSubTaskModalOpen(false);
  };

  // Toggle Subtask Completion
  const handleToggleSubTask = (actId: string, subTaskId: string) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        const updatedTasks = (a.subTasks || []).map(st => {
          if (st.id === subTaskId) {
            const nextStatus = st.status === 'completed' ? 'not_started' : 'completed';
            return { ...st, status: nextStatus };
          }
          return st;
        });
        return { ...a, subTasks: updatedTasks };
      }
      return a;
    }));
  };

  // Submit Activity Evaluation Report & Close Activity
  const handleSubmitActivityEvaluation = (actId: string, evalData: ActivityEvaluation) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          evaluation: evalData,
          status: 'completed',
          timeline: [
            ...a.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actor: selectedUserIdentity,
              action: 'اعتماد التقرير الختامي وإغلاق الفعالية بالكامل',
              details: `تقييم الأداء الشامل: ${evalData.overallRating} من ٥ نجوم.`
            }
          ]
        };
      }
      return a;
    }));
    alert('🎉 تم تقديم التقرير الختامي بنجاح وإغلاق الفعالية وأرشفة السجلات!');
  };

  // Change Activity Lifecycle Status directly
  const handleUpdateActivityStatus = (actId: string, newStatus: ActivityLifecycleStatus) => {
    setActivitiesLifecycle(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          status: newStatus,
          timeline: [
            ...a.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actor: selectedUserIdentity,
              action: `تغيير حالة الفعالية إلى: ${ACTIVITY_STATUS_MAP[newStatus]?.label || newStatus}`,
              details: 'تحديث حالة دورة حياة الفعالية'
            }
          ]
        };
      }
      return a;
    }));
  };

  // Evaluate Auto Conditions Engine Test
  const handleRunConditionTest = (templateId: string) => {
    const template = badgeTemplates.find(t => t.id === templateId);
    if (!template || !template.condition) return;

    const { metric, operator, value } = template.condition;
    
    // Evaluate across students
    let eligibleStudents: StudentItem[] = [];
    Object.values(CIRCLE_STUDENTS_MAP).flat().forEach(st => {
      let val = 0;
      if (metric === 'mastered_pages') val = st.masteredPages || 0;
      if (metric === 'attendance_rate') val = st.attendanceRate || 0;
      if (metric === 'avg_score') val = st.avgScore || 0;

      let pass = false;
      if (operator === '>=' && val >= value) pass = true;
      if (operator === '==' && val === value) pass = true;
      if (operator === '<=' && val <= value) pass = true;

      if (pass) eligibleStudents.push(st);
    });

    setTestRuleResult(`نتائج فحص شرط "${template.name}" (${template.condition.metricLabel} ${operator} ${value}):
عدد المستحقين حالياً: ${eligibleStudents.length} طلاب
الأسماء المستحقة: ${eligibleStudents.map(s => s.name + ` (${s.circleName})`).join(' ، ')}`);
  };

  return (
    <div className="w-full space-y-6 pb-20 text-slate-800" dir="rtl">
      
      {/* TOP HEADER & ROLE PERSPECTIVE SWITCHER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">منظومة الأوسمة والجوائز التقديرية</h1>
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  إصدار التميز المؤسسي
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                منظومة شاملة لإدارة الأوسمة والجوائز التلقائية والخاصة، الشروط المتغيرة، الاعتماد والمكافآت والطباعة.
              </p>
            </div>
          </div>

          {/* ROLE SWITCHER */}
          <div className="bg-slate-800/80 backdrop-blur-md p-2 rounded-xl border border-slate-700/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              منظور الرؤية والمنصب:
            </span>
            
            <button
              onClick={() => {
                setCurrentUserRole('general_manager');
                setSelectedUserIdentity('أ.د. عبدالله بن سليمان (المدير العام)');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentUserRole === 'general_manager' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              المدير العام (صلاحيات كاملة)
            </button>

            <button
              onClick={() => {
                setCurrentUserRole('teacher');
                setSelectedUserIdentity('الشيخ/ يونس الدوسري (معلم الحلقة)');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentUserRole === 'teacher' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              معلم الحلقة (متابعة ورصد طلاب الحلقة)
            </button>
          </div>
        </div>

        {/* PRIMARY SYSTEM NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <button
            onClick={() => setMainTab('awards_badges')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mainTab === 'awards_badges' ? 'bg-white text-indigo-950 shadow-lg' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            الأوسمة والجوائز (النظام الجديد)
          </button>

          <button
            onClick={() => setMainTab('activities')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mainTab === 'activities' ? 'bg-white text-indigo-950 shadow-lg' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            الأنشطة والبرامج والفعاليات
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AWARDS & BADGES SUBSYSTEM (THE NEW MODULE) */}
      {/* ========================================================= */}
      {mainTab === 'awards_badges' && (
        <div className="space-y-6">
          
          {/* SUBTAB NAVIGATION BAR */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setAwardsSubTab('my-badges')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                awardsSubTab === 'my-badges' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star className="w-4 h-4" />
              {currentUserRole === 'student' || currentUserRole === 'parent' ? 'أوسمتي وتكريماتي' : 'لوحة الأوسمة والمستفيدين'}
            </button>

            {(currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
              <button
                onClick={() => setAwardsSubTab('badge-bank')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  awardsSubTab === 'badge-bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                بنك الأوسمة (إدارة القوالب)
              </button>
            )}

            {(currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
              <button
                onClick={() => setAwardsSubTab('grant-badge')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  awardsSubTab === 'grant-badge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                منح وسام (منح مباشر من المدير)
              </button>
            )}

            {(currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
              <button
                onClick={() => setAwardsSubTab('approval-requests')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all relative ${
                  awardsSubTab === 'approval-requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                طلبات الاعتماد والتكريم
                {pendingApprovals.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setAwardsSubTab('badge-log')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                awardsSubTab === 'badge-log' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              سجل الأوسمة والتكريم (تراكمي)
            </button>

            {(currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
              <button
                onClick={() => setAwardsSubTab('badge-rules')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  awardsSubTab === 'badge-rules' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-4 h-4" />
                إعدادات وشروط الأوسمة التلقائية
              </button>
            )}
          </div>

          {/* ========================================================= */}
          {/* SUBTAB 1: MY BADGES / RECIPIENT DASHBOARD */}
          {/* ========================================================= */}
          {awardsSubTab === 'my-badges' && (
            <div className="space-y-6">
              
              {/* SUMMARY METRICS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">إجمالي الأوسمة الحاصل عليها</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalCount}</span>
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">معتمدة وموثقة بالسجل</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">أوسمة تلقائية (شروط إتقان)</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-indigo-700 font-mono">{stats.autoCount}</span>
                    <Zap className="w-5 h-5 text-indigo-500" />
                  </div>
                  <span className="text-[10px] text-slate-400">تمنح تلقائياً عند تحقيق الهدف</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">أوسمة المدير والتكريم المباشر</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-700 font-mono">{stats.directorCount}</span>
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400">بقرار مباشر من الإدارة العليا</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">أوسمة خاصة ومميزة</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-amber-700 font-mono">{stats.specialCount}</span>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] text-slate-400">أرفع أوسمة الشرف بالملتقى</span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
                  <span className="text-[11px] text-amber-800 font-bold block">إجمالي المكافآت المالية المكتسبة</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-amber-950 font-mono">{stats.totalRewardsSum.toLocaleString()} ر.س</span>
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold">محفوظة بقيمتها التاريخية الثابتة</span>
                </div>
              </div>

              {/* BADGES DISPLAY GRID */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      قائمة الأوسمة والدروع المكتسبة
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تظهر أدناه الأوسمة الممنوحة بالتفصيل الشرفي الكامل مع إمكانية المعاينة وطباعة الشهادة.
                    </p>
                  </div>
                </div>

                {visibleBadgesForRole.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Award className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">لا توجد أوسمة مرصودة لهذا المنظور حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visibleBadgesForRole.map(badge => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-b from-slate-50 to-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                      >
                        {/* Top Badge Banner */}
                        <div className="flex items-start justify-between">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            badge.badgeType === 'auto' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            badge.badgeType === 'director' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {badge.badgeType === 'auto' ? 'وسام تلقائي' : badge.badgeType === 'director' ? 'وسام المدير' : 'وسام خاص رفيع'}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            badge.approvalStatus === 'granted' ? 'bg-emerald-100 text-emerald-800' :
                            badge.approvalStatus === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {badge.approvalStatus === 'granted' ? 'معتمد وممنوح' : 'بانتظار الاعتماد'}
                          </span>
                        </div>

                        {/* Title & Honorific Title */}
                        <div>
                          <div className="text-xs font-extrabold text-amber-600 font-mono">{badge.honorificTitle}</div>
                          <h4 className="text-base font-black text-slate-900 mt-0.5">{badge.badgeName}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.obtainedHow}</p>
                        </div>

                        {/* Recipient Details */}
                        <div className="bg-slate-100/80 p-2.5 rounded-xl text-xs space-y-1 border border-slate-200/60">
                          <div className="flex justify-between text-slate-600">
                            <span>المستفيد المكرم:</span>
                            <span className="font-bold text-slate-900">{badge.recipientName}</span>
                          </div>
                          {badge.recipientCircle && (
                            <div className="flex justify-between text-slate-500 text-[11px]">
                              <span>الحلقة:</span>
                              <span className="font-bold">{badge.recipientCircle}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>تاريخ المنح:</span>
                            <span className="font-mono">{badge.awardDate}</span>
                          </div>
                        </div>

                        {/* Reward Value Snapshot */}
                        <div className="bg-amber-50/80 p-2.5 rounded-xl text-xs border border-amber-200/60 flex items-center justify-between">
                          <span className="text-amber-900 font-bold text-[11px]">المكافأة المرافقة:</span>
                          <span className="font-black text-amber-950 font-mono">
                            {badge.snapshotRewardAmount > 0 ? `${badge.snapshotRewardAmount.toLocaleString()} ريال سعودي` : 'درع وشهادة شرفية'}
                          </span>
                        </div>

                        {/* Actions: Print & PDF Certificate */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setPrintingBadge(badge)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            طباعة الشهادة الرسمية
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUBTAB 2: BADGE BANK (إدارة وتكوين الأوسمة) */}
          {/* ========================================================= */}
          {awardsSubTab === 'badge-bank' && (currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    بنك الأوسمة والجوائز (المستودع المركزي)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    إضافة، تعديل، تعطيل وتحديد شروط ومكافآت الأوسمة التلقائية وأوسمة المدير والأوسمة الخاصة.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({
                      name: '', honorificTitle: '', description: '', icon: '🏅', badgeType: 'auto',
                      targetAudience: 'students', grantMethod: '', isAuto: true, requiresApproval: false,
                      allowRepeat: false, rewardType: 'financial', rewardAmount: 1000, rewardDescription: '',
                      hasLevels: false, status: 'active'
                    });
                    setIsTemplateModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  إضافة وسام جديد للبنك
                </button>
              </div>

              {/* BADGE TEMPLATES LIST TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">أيقونة واسم الوسام</th>
                      <th className="p-3">الاسم الشرفي</th>
                      <th className="p-3">نوع الوسام</th>
                      <th className="p-3">الفئة المستهدفة</th>
                      <th className="p-3">طريقة الحصول والشروط</th>
                      <th className="p-3">المكافأة التقديرية</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {badgeTemplates.map(template => (
                      <tr key={template.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{template.icon}</span>
                            <div>
                              <h4 className="font-bold text-slate-900">{template.name}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{template.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-indigo-700 font-mono">{template.honorificTitle}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            template.badgeType === 'auto' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            template.badgeType === 'director' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {template.badgeType === 'auto' ? 'تلقائي' : template.badgeType === 'director' ? 'أوسمة المدير' : 'خاص ومميز'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          {template.targetAudience === 'students' ? 'الطلاب' :
                           template.targetAudience === 'teachers' ? 'المدرسون' :
                           template.targetAudience === 'supervisors' ? 'المشرفون' : 'الجميع'}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs leading-relaxed text-[11px]">
                          {template.grantMethod}
                          {template.condition && (
                            <span className="block text-[10px] font-mono text-indigo-600 font-bold mt-0.5">
                              الشرط الحالي: ({template.condition.metricLabel} {template.condition.operator} {template.condition.value})
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-800">
                          {template.rewardAmount.toLocaleString()} ريال
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            template.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {template.status === 'active' ? 'مفعل بالمنظومة' : 'معطل'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateForm(template);
                                setIsTemplateModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleTemplateStatus(template.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                template.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={template.status === 'active' ? 'تعطيل' : 'تفعيل'}
                            >
                              {template.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUBTAB 3: DIRECT GRANT (منح وسام من المدير) */}
          {/* ========================================================= */}
          {awardsSubTab === 'grant-badge' && (currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  منح وسام مباشر (المنح اليدوي من الإدارة)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  يمكن للمدير اختيار وسام من بنك الأوسمة ومنحه يدويًا لأي طالب أو مدرس أو مشرف مع تثبيت قيمة المكافأة.
                </p>
              </div>

              <form onSubmit={handleDirectGrant} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اختر الوسام المراد منحه من البنك:</label>
                  <select
                    value={grantForm.templateId}
                    onChange={e => {
                      const t = badgeTemplates.find(bt => bt.id === e.target.value);
                      setGrantForm({
                        ...grantForm,
                        templateId: e.target.value,
                        customRewardAmount: t ? t.rewardAmount : 1000
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {badgeTemplates.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name} ({t.honorificTitle}) — [{t.badgeType === 'auto' ? 'تلقائي' : t.badgeType === 'director' ? 'وسام المدير' : 'وسام خاص'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">صفة المكرم (نوع المستفيد):</label>
                    <select
                      value={grantForm.recipientType}
                      onChange={e => setGrantForm({ ...grantForm, recipientType: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="student">طالب</option>
                      <option value="teacher">مدرس حلقة</option>
                      <option value="supervisor">مشرف إداري</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم الشخص المستفيد:</label>
                    <input
                      type="text" required
                      value={grantForm.recipientName}
                      onChange={e => setGrantForm({ ...grantForm, recipientName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                      placeholder="اسم الطالب أو المدرس..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الحلقة القرآنية (إن وجد):</label>
                    <input
                      type="text"
                      value={grantForm.recipientCircle}
                      onChange={e => setGrantForm({ ...grantForm, recipientCircle: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                      placeholder="حلقة الإمام عاصم..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ولي الأمر (في حال الطالب):</label>
                    <input
                      type="text"
                      value={grantForm.recipientParent}
                      onChange={e => setGrantForm({ ...grantForm, recipientParent: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                      placeholder="اسم ولي الأمر..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سبب التكريم والمنح المباشر (تفاصيل الانجاز):</label>
                  <textarea
                    rows={3} required
                    value={grantForm.reason}
                    onChange={e => setGrantForm({ ...grantForm, reason: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    placeholder="اذكر حقيقة الإنجاز والسبب الشرفي لمنح الوسام..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تثبيت قيمة المكافأة المالية لهذه المرة (ر.س):</label>
                  <input
                    type="number" required min="0"
                    value={grantForm.customRewardAmount}
                    onChange={e => setGrantForm({ ...grantForm, customRewardAmount: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <span className="text-[10px] text-amber-700 block mt-1">
                    سيتم حفظ هذا المبلغ في السجل التراكمي وتثبيته تاريخيًا لهذا المنح.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-md mt-2"
                >
                  تأكيد منح الوسام وحفظه بالمنظومة وإرسال الإشعارات
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUBTAB 4: APPROVAL REQUESTS (طلبات الاعتماد) */}
          {/* ========================================================= */}
          {awardsSubTab === 'approval-requests' && (currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  طلبات الاعتماد والتكريم المحالة للإدارة
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  مراجعة واستحقاقات الأوسمة التلقائية أو الأوسمة المرفوعة من المدرسين لاعتمادها أو رفضها.
                </p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">لا توجد طلبات أوسمة بانتظار الاعتماد حالياً.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map(req => (
                    <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-indigo-900 text-sm">{req.badgeName}</span>
                          <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded font-mono text-[10px]">
                            {req.honorificTitle}
                          </span>
                        </div>
                        <p className="text-slate-600">{req.obtainedHow}</p>
                        <div className="text-[11px] text-slate-400">
                          المستفيد: <span className="font-bold text-slate-800">{req.recipientName}</span> ({req.recipientCircle}) | التاريخ: {req.awardDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleApproveBadge(req.id, true)}
                          className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          اعتماد ومنح
                        </button>
                        <button
                          onClick={() => handleApproveBadge(req.id, false)}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-bold flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          رفض Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SUBTAB 5: BADGE LOG (سجل الأوسمة والتكريم) */}
          {/* ========================================================= */}
          {awardsSubTab === 'badge-log' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    السجل التراكمي الموحد للأوسمة والتكريم
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    سجل تاريخي كامل لجميع العمليات مع حفظ قيمة المكافآت والحالة الشرفية.
                  </p>
                </div>

                {/* SEARCH & FILTER CONTROLS */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="بحث باسم المكرم أو الوسام..."
                    className="p-2 text-xs border border-slate-300 rounded-xl w-48"
                  />

                  <select
                    value={logRoleFilter}
                    onChange={e => setLogRoleFilter(e.target.value)}
                    className="p-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="all">كل الفئات</option>
                    <option value="student">طلاب</option>
                    <option value="teacher">مدرسون</option>
                    <option value="supervisor">مشرفون</option>
                  </select>
                </div>
              </div>

              {/* AUDIT LOG TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">رقم المرجع</th>
                      <th className="p-3">المكرم (الشخص)</th>
                      <th className="p-3">الصفة</th>
                      <th className="p-3">اسم الوسام واللقب الشرفي</th>
                      <th className="p-3">نوع المنح</th>
                      <th className="p-3">تاريخ المنح</th>
                      <th className="p-3">المكافأة المحفوظة</th>
                      <th className="p-3">حالة الاعتماد</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grantedBadges
                      .filter(b => {
                        const matchSearch = b.recipientName.includes(logSearchQuery) || b.badgeName.includes(logSearchQuery);
                        const matchRole = logRoleFilter === 'all' || b.recipientRole === logRoleFilter;
                        return matchSearch && matchRole;
                      })
                      .map(badge => (
                        <tr key={badge.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3 font-mono text-[11px] font-bold text-slate-500">{badge.id}</td>
                          <td className="p-3 font-bold text-slate-900">{badge.recipientName}</td>
                          <td className="p-3">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {badge.recipientRole === 'student' ? 'طالب' : badge.recipientRole === 'teacher' ? 'مدرس' : 'مشرف'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-indigo-950">
                            {badge.badgeName} <span className="text-amber-600 text-[10px]">({badge.honorificTitle})</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              badge.badgeType === 'auto' ? 'bg-indigo-50 text-indigo-700' :
                              badge.badgeType === 'director' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-amber-50 text-amber-800'
                            }`}>
                              {badge.badgeType === 'auto' ? 'تلقائي' : badge.badgeType === 'director' ? 'مدير' : 'خاص'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{badge.awardDate}</td>
                          <td className="p-3 font-mono font-bold text-amber-800">
                            {badge.snapshotRewardAmount.toLocaleString()} ر.س
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              badge.approvalStatus === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {badge.approvalStatus === 'granted' ? 'معتمد' : 'معلق'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setPrintingBadge(badge)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition-all"
                            >
                              عرض وطباعة
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUBTAB 6: RULES & CONDITIONS ENGINE (إعدادات الأوسمة) */}
          {/* ========================================================= */}
          {awardsSubTab === 'badge-rules' && (currentUserRole === 'general_manager' || currentUserRole === 'executive_director') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  محرك شروط واستحقاق الأوسمة التلقائية (Dynamic Conditions Engine)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تعديل قيم الشروط (مثل زيادة شرط الحفظ من 10 أجزاء إلى 20 جزء) دون تغيير الكود، واختبار الاستحقاق التلقائي للطلاب.
                </p>
              </div>

              {/* RULES EDITOR GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {badgeTemplates.filter(t => t.isAuto && t.condition).map(template => (
                  <div key={template.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{template.icon}</span>
                        <h4 className="font-bold text-slate-900">{template.name}</h4>
                      </div>
                      <span className="font-mono text-indigo-700 font-bold">{template.honorificTitle}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-600 font-bold">تعديل قيمة شرط الاستحقاق الحالي:</label>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700">
                          {template.condition?.metricLabel}
                        </span>

                        <span className="p-2 bg-white border border-slate-300 rounded-xl font-bold font-mono">
                          {template.condition?.operator}
                        </span>

                        <input
                          type="number"
                          value={template.condition?.value}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setBadgeTemplates(prev => prev.map(t => {
                              if (t.id === template.id && t.condition) {
                                return { ...t, condition: { ...t.condition, value: val } };
                              }
                              return t;
                            }));
                          }}
                          className="p-2 bg-white border border-slate-300 rounded-xl font-mono font-black text-indigo-900 text-sm w-24 text-center"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleRunConditionTest(template.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        تشغيل محرك فحص الاستحقاق التلقائي
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* TEST RESULTS DISPLAY */}
              {testRuleResult && (
                <div className="p-4 bg-indigo-950 text-indigo-100 rounded-2xl border border-indigo-800 space-y-2 font-mono text-xs whitespace-pre-line shadow-inner">
                  <div className="flex items-center justify-between border-b border-indigo-800 pb-2 text-amber-400 font-bold">
                    <span>تقرير نتيجة فحص محرك الشروط الديناميكية:</span>
                    <button onClick={() => setTestRuleResult(null)} className="text-slate-400 hover:text-white text-xs">إغلاق</button>
                  </div>
                  <p>{testRuleResult}</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INTEGRATED ACTIVITY LIFECYCLE MANAGEMENT MODULE */}
      {/* ========================================================= */}
      {mainTab === 'activities' && (
        <div className="space-y-6">

          {/* ========================================================= */}
          {/* A. IF AN ACTIVITY IS SELECTED FOR DETAILED LIFECYCLE MANAGEMENT */}
          {/* ========================================================= */}
          {selectedActivityId ? (() => {
            const selectedAct = activitiesLifecycle.find(a => a.id === selectedActivityId);
            if (!selectedAct) return null;

            const categoryInfo = ACTIVITY_CATEGORIES_MAP[selectedAct.typeCategory] || ACTIVITY_CATEGORIES_MAP.other;
            const statusInfo = ACTIVITY_STATUS_MAP[selectedAct.status] || ACTIVITY_STATUS_MAP.draft;
            const readinessScore = calculateReadinessScore(selectedAct);
            const riskAlerts = calculateRiskAlerts(selectedAct);

            return (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
                
                {/* Back Button & Header Summary */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedActivityId(null)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                      العودة لقائمة جميع الأنشطة والفعاليات
                    </button>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                        <span>{categoryInfo.icon}</span>
                        <span>{selectedAct.typeCategory === 'other' ? (selectedAct.customCategoryName || categoryInfo.label) : categoryInfo.label}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>

                      {selectedAct.taskStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" /> بانتظار قبول المسؤول المكلف
                        </span>
                      )}

                      {selectedAct.taskStatus === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5" /> اعتذر المسؤول عن المهمة
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedAct.name}</h2>
                    <p className="text-xs text-slate-500">{selectedAct.shortDescription}</p>
                  </div>

                  {/* Readiness & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] font-bold text-slate-500">نسبة الجاهزية للتنفيذ</div>
                      <div className="text-lg font-black font-mono text-indigo-700">{readinessScore}%</div>
                      <div className="w-28 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all duration-500 ${readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${readinessScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCreateActivityModal(selectedAct)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        تعديل الخطة
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('printing')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          مركز الطباعة
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Risk Alerts (If any) */}
                {riskAlerts.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-900">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      تنبيهات ومخاطر تحتاج للانتباه والتدخل:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-800/90">
                      {riskAlerts.map((alertText, idx) => (
                        <li key={idx}>{alertText}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sub-tab Navigation Menu for Selected Activity */}
                <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
                  {[
                    { id: 'overview', label: 'الخطة العامة والمعلومات', icon: Layers },
                    { id: 'participants', label: `المشاركون وأولياء الأمور (${selectedAct.participants.length})`, icon: Users },
                    { id: 'attendance', label: 'الحُضور الميداني', icon: CheckSquare },
                    { id: 'budget', label: 'الميزانية والمصروفات', icon: DollarSign },
                    { id: 'subtasks', label: `مهام التنفيذ (${(selectedAct.subTasks || []).length})`, icon: Target },
                    { id: 'attachments', label: `المرفقات (${(selectedAct.attachments || []).length})`, icon: Paperclip },
                    { id: 'report', label: 'التقرير والتقييم الختامي', icon: BarChart3 },
                    { id: 'timeline', label: 'سجل الحركة', icon: Clock }
                  ].map(tab => {
                    const IconComponent = tab.icon;
                    const isActive = activityDetailTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActivityDetailTab(tab.id as any)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SUBTAB 1: OVERVIEW & GENERAL PLAN */}
                {activityDetailTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2 Cols) - Basic Details */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                          <Target className="w-4 h-4 text-indigo-600" />
                          الأهداف الاستراتيجية والتنفيذية
                        </h3>
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">الهدف الرئيسي:</span>
                          <p className="text-xs text-slate-800 font-semibold bg-white p-3 rounded-xl border border-slate-200">
                            {selectedAct.mainGoal}
                          </p>
                        </div>
                        {selectedAct.subGoals && selectedAct.subGoals.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-1">الأهداف التفصيلية:</span>
                            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                              {selectedAct.subGoals.map((sg, idx) => (
                                <li key={idx}>{sg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                          <div className="text-slate-500 font-bold flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-500" /> مكان وتحديد الفعالية
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">{selectedAct.location}</div>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                          <div className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-500" /> التاريخ والتوقيت
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {selectedAct.activityDate} ({selectedAct.startTime} - {selectedAct.endTime})
                          </div>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                          <div className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-500" /> الفئة المستهدفة والعدد
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {selectedAct.targetAudience} ({selectedAct.targetCount} مشارك مستهدف)
                          </div>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                          <div className="text-slate-500 font-bold flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-amber-500" /> الميزانية المعتمدة
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {selectedAct.plannedBudget.toLocaleString()} ريال ({selectedAct.budgetType === 'financial' ? 'مالية' : selectedAct.budgetType === 'in_kind' ? 'عينية' : 'مختلطة'})
                          </div>
                        </div>
                      </div>

                      {/* Targeted Circles */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-indigo-600" /> الحلقات والفئات العمرية المستهدفة:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(selectedAct.targetCircles || []).map((circle, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 shadow-2xs">
                              {circle}
                            </span>
                          ))}
                          {selectedAct.targetAgeGroups && (
                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg font-bold text-indigo-800 shadow-2xs">
                              الفئة: {selectedAct.targetAgeGroups}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (1 Col) - Responsible Staff & Workflow Transitions */}
                    <div className="space-y-6">
                      
                      {/* Responsible Staff Card */}
                      <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-4">
                        <div className="text-xs font-bold text-indigo-200 flex items-center gap-1.5 border-b border-indigo-800/80 pb-2">
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          المسؤول والمشرف المكلف
                        </div>

                        <div className="space-y-1">
                          <div className="text-base font-black text-white">{selectedAct.responsibleStaffName}</div>
                          <div className="text-xs text-indigo-200">{selectedAct.responsibleStaffRole}</div>
                        </div>

                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-xs space-y-2 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-200">حالة التكليف:</span>
                            <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                              selectedAct.taskStatus === 'accepted' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                              selectedAct.taskStatus === 'rejected' ? 'bg-rose-500/30 text-rose-300 border border-rose-400/30' :
                              'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                            }`}>
                              {selectedAct.taskStatus === 'accepted' ? 'مقبول وقيد الإدارة' :
                               selectedAct.taskStatus === 'rejected' ? 'اعتذار/مرفوض' : 'بانتظار الموافقة'}
                            </span>
                          </div>

                          {/* Quick Accept/Reject for Assigned Staff */}
                          {selectedAct.taskStatus === 'pending' && (
                            <div className="pt-2 border-t border-white/10 flex gap-2">
                              <button
                                onClick={() => handleAcceptTaskAssignment(selectedAct.id)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all text-center"
                              >
                                قبول التكليف
                              </button>
                              <button
                                onClick={() => setRejectingActivityId(selectedAct.id)}
                                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-all"
                              >
                                اعتذار
                              </button>
                            </div>
                          )}

                          {/* Reassign Button for GM */}
                          {currentUserRole === 'general_manager' && (
                            <button
                              onClick={() => setReassigningActivityId(selectedAct.id)}
                              className="w-full mt-2 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] rounded-lg transition-all text-center"
                            >
                              إعادة تعيين مسؤول آخر
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Workflow State Transitions */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                        <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          الترقية المباشرة لدورة حياة الفعالية:
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { status: 'planned', label: 'تحويل إلى: قيد التخطيط', desc: 'تجهيز اللجان واختيار الطلاب' },
                            { status: 'ready', label: 'تحويل إلى: جاهز للتنفيذ', desc: 'اكتملت الموافقات والحافلات' },
                            { status: 'in_progress', label: 'تحويل إلى: جارية الآن في الميدان', desc: 'انطلاق الفعالية ورصد الحضور' },
                            { status: 'awaiting_report', label: 'تحويل إلى: بانتظار التقرير الختامي', desc: 'انتهاء الفعالية وكتابة التقييم' }
                          ].map(item => (
                            <button
                              key={item.status}
                              disabled={selectedAct.status === item.status}
                              onClick={() => handleUpdateActivityStatus(selectedAct.id, item.status as any)}
                              className={`p-2.5 rounded-xl text-right border transition-all ${
                                selectedAct.status === item.status
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="font-extrabold">{item.label}</div>
                              <div className="text-[10px] text-slate-500">{item.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUBTAB 2: PARTICIPANTS & PARENT APPROVALS */}
                {activityDetailTab === 'participants' && (
                  <div className="space-y-6 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          إدارة ترشيح واعتماد مشاركة الطلاب
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          ترشيح الطلاب من الحلقات، متابعة موافقات أولياء الأمور عبر النظام، والاعتماد النهائي.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBatchSelectCircle(selectedAct.id, 'حلقة الإمام عاصم')}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl transition-all"
                        >
                          + إضافة طلاب حلقة الإمام عاصم
                        </button>
                        <button
                          onClick={() => handleBatchSelectCircle(selectedAct.id, 'حلقة البخاري')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-xl transition-all"
                        >
                          + إضافة طلاب حلقة البخاري
                        </button>
                      </div>
                    </div>

                    {/* Participants List Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold text-[11px] border-b border-slate-200">
                            <th className="p-3">اسم الطالب</th>
                            <th className="p-3">الحلقة</th>
                            <th className="p-3">ولي الأمر</th>
                            <th className="p-3">موافقة ولي الأمر</th>
                            <th className="p-3">الاعتماد النهائي للإدارة</th>
                            <th className="p-3 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedAct.participants.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                لا يوجد مشاركون مرشحون حالياً. استخدم الأزرار أعلاه لترشيح الطلاب.
                              </td>
                            </tr>
                          ) : (
                            selectedAct.participants.map(part => (
                              <tr key={part.id} className="hover:bg-slate-50 transition-all">
                                <td className="p-3 font-extrabold text-slate-900">{part.studentName}</td>
                                <td className="p-3 text-slate-600 font-medium">{part.circleName}</td>
                                <td className="p-3 text-slate-600">{part.parentName || 'خالد الغامدي'}</td>
                                
                                <td className="p-3">
                                  {part.parentApprovalStatus === 'approved' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> موافقة مكتملة
                                    </span>
                                  )}
                                  {part.parentApprovalStatus === 'pending' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                      <Clock className="w-3.5 h-3.5" /> قيد انتظار ولي الأمر
                                    </span>
                                  )}
                                  {part.parentApprovalStatus === 'rejected' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                      <XCircle className="w-3.5 h-3.5" /> اعتذار ولي الأمر
                                    </span>
                                  )}
                                  {part.parentApprovalStatus === 'not_required' && (
                                    <span className="text-[11px] text-slate-400">غير مطلوبة</span>
                                  )}
                                </td>

                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                    part.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                    part.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {part.approvalStatus === 'approved' ? 'معتمد رسمياً' :
                                     part.approvalStatus === 'rejected' ? 'مستبعد' : 'بانتظار التدقيق'}
                                  </span>
                                </td>

                                <td className="p-3 text-center space-x-1 space-x-reverse">
                                  {part.parentApprovalStatus === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateParentApproval(selectedAct.id, part.studentId, 'approved')}
                                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] rounded-lg transition-all"
                                      title="محاكاة موافقة ولي الأمر عبر تطبيق ولي الأمر"
                                    >
                                      محاكاة موافقة ولي الأمر
                                    </button>
                                  )}

                                  {part.approvalStatus !== 'approved' && (
                                    <button
                                      onClick={() => handleUpdateFinalStudentApproval(selectedAct.id, part.studentId, 'approved')}
                                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] rounded-lg transition-all"
                                    >
                                      اعتماد نهائي
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: FIELD ATTENDANCE */}
                {activityDetailTab === 'attendance' && (
                  <div className="space-y-6 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          رصد كشف الحضور والغياب الميداني
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          رصد لحظي لمشاركة الطلاب في الفعالية الميدانية لتزويد التقارير وتحديث سجل الطالب.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            selectedAct.participants.forEach(p => handleRecordAttendance(selectedAct.id, p.studentId, 'present'));
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs transition-all"
                        >
                          تحديد الجميع: حاضر
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedAct.participants.map(part => (
                        <div key={part.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm">{part.studentName}</span>
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {part.circleName}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1 text-[11px] pt-1">
                            {[
                              { id: 'present', label: 'حاضر', color: 'emerald' },
                              { id: 'absent', label: 'غائب', color: 'rose' },
                              { id: 'late', label: 'متأخر', color: 'amber' },
                              { id: 'excused', label: 'بعذر', color: 'sky' }
                            ].map(st => (
                              <button
                                key={st.id}
                                onClick={() => handleRecordAttendance(selectedAct.id, part.studentId, st.id as any)}
                                className={`py-1.5 rounded-lg font-bold border text-center transition-all ${
                                  part.attendanceStatus === st.id
                                    ? st.color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600' :
                                      st.color === 'rose' ? 'bg-rose-600 text-white border-rose-600' :
                                      st.color === 'amber' ? 'bg-amber-500 text-white border-amber-500' :
                                      'bg-sky-600 text-white border-sky-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>

                          {part.notes && (
                            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                              ملاحظة: {part.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: BUDGET & EXPENSES BREAKDOWN */}
                {activityDetailTab === 'budget' && (
                  <div className="space-y-6 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-amber-600" />
                          الميزانية التفصيلية وسجل المصروفات الميدانية
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          متابعة البنود المخططة مقابل المصروف الفعلي ورصد عجز أو فائض الميزانية.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsBudgetItemModalOpen(true)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> إضافة بند ميزانية جديد
                      </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                        <span className="text-[11px] font-bold text-indigo-700">الميزانية المخططة المعتمدة</span>
                        <div className="text-xl font-black text-indigo-900 font-mono">
                          {selectedAct.plannedBudget.toLocaleString()} ريال
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                        <span className="text-[11px] font-bold text-amber-700">المصروفات الفعلية المسجلة</span>
                        <div className="text-xl font-black text-amber-900 font-mono">
                          {selectedAct.actualBudget.toLocaleString()} ريال
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border space-y-1 ${
                        selectedAct.plannedBudget - selectedAct.actualBudget >= 0
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}>
                        <span className="text-[11px] font-bold">الفائض / العجز المالي</span>
                        <div className="text-xl font-black font-mono">
                          {(selectedAct.plannedBudget - selectedAct.actualBudget).toLocaleString()} ريال
                        </div>
                      </div>
                    </div>

                    {/* Budget Items Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold text-[11px] border-b border-slate-200">
                            <th className="p-3">بند النفقة / البيان</th>
                            <th className="p-3">المبلغ المخطط</th>
                            <th className="p-3">المصروف الفعلي</th>
                            <th className="p-3">الفارق</th>
                            <th className="p-3">ملاحظات والتفاصيل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(selectedAct.budgetItems || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">
                                لا توجد بنود ميزانية مفصلة بعد. انقر على "إضافة بند ميزانية" لإضافة التفاصيل.
                              </td>
                            </tr>
                          ) : (
                            selectedAct.budgetItems!.map(bItem => (
                              <tr key={bItem.id} className="hover:bg-slate-50 transition-all">
                                <td className="p-3 font-extrabold text-slate-900">{bItem.category}</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">{bItem.plannedAmount.toLocaleString()} ريال</td>
                                <td className="p-3 font-mono font-bold text-amber-700">
                                  <input
                                    type="number"
                                    value={bItem.actualAmount}
                                    onChange={e => handleUpdateActualExpense(selectedAct.id, bItem.id, Number(e.target.value))}
                                    className="w-28 p-1 text-xs border border-slate-300 rounded-lg text-center font-bold"
                                  />
                                </td>
                                <td className={`p-3 font-mono font-bold ${
                                  bItem.plannedAmount - bItem.actualAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  {(bItem.plannedAmount - bItem.actualAmount).toLocaleString()} ريال
                                </td>
                                <td className="p-3 text-slate-500">{bItem.notes || '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 5: SUBTASKS & WORKFLOW */}
                {activityDetailTab === 'subtasks' && (
                  <div className="space-y-6 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-indigo-600" />
                          مهام فريق العمل والتجهيز التنفيذي
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          توزيع المهام الفرعية على الكادر وتتبع نسبة الإنجاز والجاهزية.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsSubTaskModalOpen(true)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> إضافة مهمة تنفيذية جديدة
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(selectedAct.subTasks || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                          لا توجد مهام فرعية مضافة. أضف مهام تنظيمية كـ (تجهيز الحافلات، طباعة الشهادات، إعداد العشاء).
                        </div>
                      ) : (
                        selectedAct.subTasks!.map(st => (
                          <div
                            key={st.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              st.status === 'completed'
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleSubTask(selectedAct.id, st.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  st.status === 'completed'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white hover:border-indigo-500'
                                }`}
                              >
                                {st.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                              </button>

                              <div>
                                <span className={`font-bold ${st.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {st.title}
                                </span>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>المكلف: <strong>{st.assigneeName}</strong></span>
                                  <span>تاريخ الإنجاز: <strong>{st.dueDate}</strong></span>
                                </div>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              st.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                              st.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {st.priority === 'high' ? 'أولوية قصوى' : st.priority === 'medium' ? 'متوسطة' : 'عادية'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 6: ATTACHMENTS & DOCUMENTS */}
                {activityDetailTab === 'attachments' && (
                  <div className="space-y-6 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-indigo-600" />
                          الملفات والمستندات المرفقة بالفعالية
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          الكتيبات، الخرائط، قوائم التحكيم، والجدول الزمني المعتمد.
                        </p>
                      </div>

                      <label className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-2xs cursor-pointer transition-all flex items-center gap-1.5">
                        <Upload className="w-4 h-4" /> رفع مستند جديد
                        <input type="file" className="hidden" onChange={() => alert('تم رفع وتوثيق الملف في السجل السحابي للفعالية بنجاح!')} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedAct.attachments || []).length === 0 ? (
                        <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                          لا يوجد مستندات مرفقة. استخدم زر "رفع مستند جديد" لرفع خطة أو كشف.
                        </div>
                      ) : (
                        selectedAct.attachments!.map(att => (
                          <div key={att.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{att.name}</div>
                                <div className="text-[10px] text-slate-500">{att.size} • رفع بواسطة {att.uploadedBy}</div>
                              </div>
                            </div>

                            <button
                              onClick={() => alert(`جاري فتح وتحميل مستند: ${att.name}`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 7: FINAL EVALUATION & REPORT */}
                {activityDetailTab === 'report' && (
                  <div className="space-y-6 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        التقرير والتنفيذ الختامي للفعالية
                      </h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        توثيق مخرجات الفعالية، تقييم الأهداف 1-5 نجوم، ورصد التوصيات لأرشفتها نهائياً.
                      </p>
                    </div>

                    {selectedAct.evaluation ? (
                      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <span className="font-black text-slate-900 text-base">حالة التقرير الختامي: معتمد ومكتمل 🎉</span>
                          <span className="text-amber-500 font-bold text-sm flex items-center gap-1">
                            {'★'.repeat(selectedAct.evaluation.overallRating)} ({selectedAct.evaluation.overallRating} / 5)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">تحقيق الأهداف</span>
                            <span className="font-bold text-indigo-700 text-sm">{selectedAct.evaluation.goalAchieved} / 5</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">التنظيم والالتزام</span>
                            <span className="font-bold text-indigo-700 text-sm">{selectedAct.evaluation.organization} / 5</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">تفاعل المشاركين</span>
                            <span className="font-bold text-indigo-700 text-sm">{selectedAct.evaluation.engagement} / 5</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">الأثر التربوي</span>
                            <span className="font-bold text-indigo-700 text-sm">{selectedAct.evaluation.educationalImpact} / 5</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="font-extrabold text-slate-900 block mb-1">أبرز الإنجازات والنتائج:</span>
                            <p className="p-3 bg-slate-50 rounded-xl text-slate-700">{selectedAct.evaluation.achievements}</p>
                          </div>
                          {selectedAct.evaluation.challenges && (
                            <div>
                              <span className="font-extrabold text-slate-900 block mb-1">التحديات والصعوبات:</span>
                              <p className="p-3 bg-slate-50 rounded-xl text-slate-700">{selectedAct.evaluation.challenges}</p>
                            </div>
                          )}
                          {selectedAct.evaluation.recommendations && (
                            <div>
                              <span className="font-extrabold text-slate-900 block mb-1">التوصيات للفعاليات القادمة:</span>
                              <p className="p-3 bg-slate-50 rounded-xl text-slate-700">{selectedAct.evaluation.recommendations}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleSubmitActivityEvaluation(selectedAct.id, {
                            goalAchieved: Number(formData.get('goalAchieved')) || 5,
                            organization: Number(formData.get('organization')) || 5,
                            engagement: Number(formData.get('engagement')) || 5,
                            educationalImpact: Number(formData.get('educationalImpact')) || 5,
                            overallRating: Number(formData.get('overallRating')) || 5,
                            achievements: formData.get('achievements') as string || '',
                            challenges: formData.get('challenges') as string || '',
                            recommendations: formData.get('recommendations') as string || '',
                            submittedBy: selectedUserIdentity,
                            submittedAt: new Date().toISOString().split('T')[0]
                          });
                        }}
                        className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs"
                      >
                        <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                          تعبئة نموذج تقييم وإغلاق الفعالية
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">تقييم تحقيق الأهداف (1 - 5):</label>
                            <input type="number" min="1" max="5" name="goalAchieved" defaultValue="5" className="w-full p-2 border border-slate-300 rounded-xl font-bold" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">تقييم التنظيم والالتزام (1 - 5):</label>
                            <input type="number" min="1" max="5" name="organization" defaultValue="5" className="w-full p-2 border border-slate-300 rounded-xl font-bold" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">تفاعل المشاركين وأولياء الأمور (1 - 5):</label>
                            <input type="number" min="1" max="5" name="engagement" defaultValue="5" className="w-full p-2 border border-slate-300 rounded-xl font-bold" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">الأثر التربوي والسلوكي (1 - 5):</label>
                            <input type="number" min="1" max="5" name="educationalImpact" defaultValue="5" className="w-full p-2 border border-slate-300 rounded-xl font-bold" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">أبرز الإنجازات والنتائج المحققة:</label>
                          <textarea required name="achievements" rows={2} placeholder="مثال: تم إتمام الاختبار لمجمل الطلاب مع تسليم الجوائز..." className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">التحديات والحلول المقترحة:</label>
                          <textarea name="challenges" rows={2} placeholder="أي عقبات ظهرت أثناء التنفيذ..." className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">التوصيات والمقترحات للفعاليات القادمة:</label>
                          <textarea name="recommendations" rows={2} placeholder="توصيات لتطوير النسخة القادمة..." className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center"
                        >
                          اعتماد التقرير وإغلاق الفعالية نهائياً
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* SUBTAB 8: TIMELINE AUDIT TRAIL LOG */}
                {activityDetailTab === 'timeline' && (
                  <div className="space-y-4 text-xs">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      سجل التتبع والتغييرات التاريخية للفعالية
                    </h4>

                    <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:right-3 before:w-0.5 before:bg-slate-200 pr-8">
                      {selectedAct.timeline.map(item => (
                        <div key={item.id} className="relative bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                          <div className="absolute right-[-29px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-slate-900">{item.action}</span>
                            <span className="text-slate-400 font-mono">{item.timestamp}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{item.details}</p>
                          <div className="text-[10px] text-indigo-700 font-bold pt-1">المُنَفِذ: {item.actor}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })() : (

            /* ========================================================= */
            /* B. MAIN ACTIVITIES LIFECYCLE DASHBOARD (CARDS GRID) */
            /* ========================================================= */
            <div className="space-y-6">

              {/* Header Title & Key Metric Cards */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      نظام إدارة دورة حياة الأنشطة والبرامج والفعاليات
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تخطيط تنفيذي متكامل من المسودة والتكليف حتى التنفيذ الميداني والتقييم الختامي.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenCreateActivityModal()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة نشاط / فعالية جديدة
                  </button>
                </div>

                {/* Top 6 KPI Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">إجمالي الفعاليات</span>
                    <div className="text-lg font-black text-slate-900">{activitiesLifecycle.length}</div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700">جارية بالأنشطة</span>
                    <div className="text-lg font-black text-emerald-900">
                      {activitiesLifecycle.filter(a => a.status === 'in_progress' || a.status === 'ready').length}
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-amber-700">بانتظار التقرير</span>
                    <div className="text-lg font-black text-amber-900">
                      {activitiesLifecycle.filter(a => a.status === 'awaiting_report').length}
                    </div>
                  </div>

                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-sky-700">المكتملة والمؤرشفة</span>
                    <div className="text-lg font-black text-sky-900">
                      {activitiesLifecycle.filter(a => a.status === 'completed').length}
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-indigo-700">الميزانية المخططة</span>
                    <div className="text-base font-black text-indigo-900 font-mono">
                      {activitiesLifecycle.reduce((acc, curr) => acc + curr.plannedBudget, 0).toLocaleString()} ريال
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-rose-700">المصروف الفعلي</span>
                    <div className="text-base font-black text-rose-900 font-mono">
                      {activitiesLifecycle.reduce((acc, curr) => acc + curr.actualBudget, 0).toLocaleString()} ريال
                    </div>
                  </div>
                </div>

                {/* Filters & Search Controls */}
                <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث باسم الفعالية، المكان، أو مسؤول التنفيذ..."
                      value={actSearchQuery}
                      onChange={e => setActSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={actCategoryFilter}
                      onChange={e => setActCategoryFilter(e.target.value)}
                      className="p-2 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                    >
                      <option value="all">جميع أنواع الأنشطة</option>
                      <option value="contest">مسابقات قرآنية</option>
                      <option value="trip">رحلات ومخيمات</option>
                      <option value="course">دورات علمية</option>
                      <option value="ceremony">حفلات وتكريم</option>
                      <option value="skill">أنشطة مهارية ورياضية</option>
                    </select>

                    <select
                      value={actStatusFilter}
                      onChange={e => setActStatusFilter(e.target.value)}
                      className="p-2 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                    >
                      <option value="all">جميع حالات التنفيذ</option>
                      <option value="draft">مسودة</option>
                      <option value="assigned">مسندة للمسؤول</option>
                      <option value="planned">قيد التخطيط</option>
                      <option value="ready">جاهز للتنفيذ</option>
                      <option value="in_progress">جارية الآن</option>
                      <option value="awaiting_report">بانتظار التقرير</option>
                      <option value="completed">مكتملة</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pending Task Assignments Banner (If Current Role is Responsible Staff with Pending Tasks) */}
              {activitiesLifecycle.some(a => a.taskStatus === 'pending') && (
                <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <div className="font-extrabold text-sm flex items-center gap-2">
                      <Bell className="w-5 h-5 animate-bounce text-amber-200" />
                      تنبيه هام: لديك تكليفات جديدة بفعالية بانتظار موافقتك!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activitiesLifecycle.filter(a => a.taskStatus === 'pending').map(pendingAct => (
                      <div key={pendingAct.id} className="p-3 bg-white/10 backdrop-blur-md rounded-xl space-y-2 border border-white/20 text-xs">
                        <div className="font-bold text-white text-sm">{pendingAct.name}</div>
                        <div className="text-amber-100 text-[11px]">
                          المسؤول المكلف: <strong>{pendingAct.responsibleStaffName}</strong> • تاريخ الفعالية: {pendingAct.activityDate}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptTaskAssignment(pendingAct.id)}
                            className="flex-1 py-1.5 bg-white text-amber-900 font-extrabold text-xs rounded-lg hover:bg-amber-100 transition-all text-center"
                          >
                            قبول التكليف وبدء التخطيط
                          </button>
                          <button
                            onClick={() => setRejectingActivityId(pendingAct.id)}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition-all"
                          >
                            اعتذار
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid of Activity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {activitiesLifecycle
                  .filter(act => {
                    const matchCategory = actCategoryFilter === 'all' || act.typeCategory === actCategoryFilter;
                    const matchStatus = actStatusFilter === 'all' || act.status === actStatusFilter;
                    const matchSearch = act.name.includes(actSearchQuery) || act.responsibleStaffName.includes(actSearchQuery) || act.location.includes(actSearchQuery);
                    return matchCategory && matchStatus && matchSearch;
                  })
                  .map(act => {
                    const categoryInfo = ACTIVITY_CATEGORIES_MAP[act.typeCategory] || ACTIVITY_CATEGORIES_MAP.other;
                    const statusInfo = ACTIVITY_STATUS_MAP[act.status] || ACTIVITY_STATUS_MAP.draft;
                    const readiness = calculateReadinessScore(act);
                    const riskAlerts = calculateRiskAlerts(act);

                    return (
                      <div
                        key={act.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header Tags */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                              <span>{categoryInfo.icon}</span>
                              <span>{categoryInfo.label}</span>
                            </span>

                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                              <span>{statusInfo.icon}</span>
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>

                          {/* Name & Short Desc */}
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base leading-snug">{act.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{act.shortDescription}</p>
                          </div>

                          {/* Quick Info Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">المسؤول المكلف:</span>
                              <span className="font-bold text-slate-800">{act.responsibleStaffName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">التاريخ والمكان:</span>
                              <span className="font-bold text-slate-800">{act.activityDate} • {act.location}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">المستهدفون:</span>
                              <span className="font-bold text-slate-800">{act.targetAudience} ({act.participants.length} مسجل)</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">الميزانية:</span>
                              <span className="font-mono font-bold text-indigo-700">{act.plannedBudget.toLocaleString()} ريال</span>
                            </div>
                          </div>

                          {/* Readiness Gauge */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span>نسبة التجهيز والجاهزية:</span>
                              <span className="font-mono text-indigo-700">{readiness}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${readiness >= 80 ? 'bg-emerald-500' : readiness >= 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                style={{ width: `${readiness}%` }}
                              />
                            </div>
                          </div>

                          {/* Risk Warning Badge if any */}
                          {riskAlerts.length > 0 && (
                            <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{riskAlerts[0]}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedActivityId(act.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض إدارة الفعالية والتفاصيل
                          </button>

                          <button
                            onClick={() => handleOpenCreateActivityModal(act)}
                            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                            title="تعديل بيانات الخطة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* C. MODALS FOR ACTIVITY LIFECYCLE MANAGEMENT */}
          {/* ========================================================= */}

          {/* 1. CREATE / EDIT ACTIVITY LIFECYCLE ITEM MODAL */}
          {isCreateActivityModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
                <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    {editingActivity ? 'تعديل مسودة وخطة الفعالية' : 'إنشاء وتكليف فعالية جديدة'}
                  </h3>
                  <button onClick={() => setIsCreateActivityModalOpen(false)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveActivityModal} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">عنوان اسم الفعالية / النشاط:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رحلة مركز المعبر / المسابقة الكبرى لحفظ القران..."
                      value={activityForm.name}
                      onChange={e => setActivityForm({ ...activityForm, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">تصنيف الفعالية:</label>
                      <select
                        value={activityForm.typeCategory}
                        onChange={e => setActivityForm({ ...activityForm, typeCategory: e.target.value as any })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="contest">🏆 مسابقة قرآنية / علمية</option>
                        <option value="trip">🚌 رحلة / مخيم تربوي</option>
                        <option value="course">🎓 دورة علمية / مهارية</option>
                        <option value="ceremony">🎉 حفل / تكريم ختامي</option>
                        <option value="skill">⚽ نشاط رياضي / مهاري</option>
                        <option value="cultural">📚 نشاط ثفافي / إعلامي</option>
                        <option value="other">✨ تصنيف مخصص آخر</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">تحديد مسؤول التنفيذ المكلف:</label>
                      <select
                        value={activityForm.responsibleStaffId}
                        onChange={e => setActivityForm({ ...activityForm, responsibleStaffId: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="p7">الشيخ/ يونس الدوسري (مدرس حلقة الإمام عاصم)</option>
                        <option value="p3">أ. طارق بن فهد (المشرف التنفيذي ومسؤول الرحلات)</option>
                        <option value="p1">أ. د. عبدالله بن سليمان (المدير العام)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">وصف مختصر للفعالية:</label>
                    <input
                      type="text"
                      required
                      placeholder="وصف موجز يظهر في البطاقات والمشاركات..."
                      value={activityForm.shortDescription}
                      onChange={e => setActivityForm({ ...activityForm, shortDescription: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الهدف الاستراتيجي الرئيسي:</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="الهدف الأساسي من الفعالية..."
                      value={activityForm.mainGoal}
                      onChange={e => setActivityForm({ ...activityForm, mainGoal: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">مكان الفعالية:</label>
                      <input
                        type="text"
                        required
                        placeholder="القاعة الكبرى / مركز المعبر..."
                        value={activityForm.location}
                        onChange={e => setActivityForm({ ...activityForm, location: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">التاريخ المحدد:</label>
                      <input
                        type="date"
                        required
                        value={activityForm.activityDate}
                        onChange={e => setActivityForm({ ...activityForm, activityDate: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">الميزانية المعتمدة (ريال):</label>
                      <input
                        type="number"
                        required
                        value={activityForm.plannedBudget}
                        onChange={e => setActivityForm({ ...activityForm, plannedBudget: Number(e.target.value) })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={activityForm.requiresParentApproval}
                        onChange={e => setActivityForm({ ...activityForm, requiresParentApproval: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded-md"
                      />
                      <span>يتطلب موافقة أولياء الأمور المسبقة</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={activityForm.hasRewardsOrPrizes}
                        onChange={e => setActivityForm({ ...activityForm, hasRewardsOrPrizes: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded-md"
                      />
                      <span>يتضمن جوائز/أوسمة من بنك الأوسمة</span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateActivityModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs"
                    >
                      {editingActivity ? 'حفظ التعديلات' : 'إنشاء وتكليف الكادر رسمياً'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. REJECT TASK MODAL */}
          {rejectingActivityId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 text-xs animate-fadeIn">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  اعتذار عن قبول تكليف الفعالية
                </h3>
                <p className="text-slate-600">
                  يرجى توضيح سبب الرفض/الاعتذار لإرسال إشعار فوري لإدارة الملتقى لإعادة التعيين.
                </p>

                <textarea
                  required
                  rows={3}
                  placeholder="سبب الاعتذار (مثال: تعارض مع جدول الاختبارات الفصلية)..."
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs"
                />

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setRejectingActivityId(null)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleRejectTaskAssignment(rejectingActivityId, rejectionReasonInput)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                  >
                    تأكيد الاعتذار
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. REASSIGN TASK MODAL */}
          {reassigningActivityId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 text-xs animate-fadeIn">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  إعادة تعيين المسؤول المكلف بالفعالية
                </h3>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اختر الكادر المسؤول الجديد:</label>
                  <select
                    value={newAssigneeStaffId}
                    onChange={e => setNewAssigneeStaffId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="p7">الشيخ/ يونس الدوسري (مدرس حلقة الإمام عاصم)</option>
                    <option value="p3">أ. طارق بن فهد (المشرف التنفيذي ومسؤول الرحلات)</option>
                    <option value="p1">أ. د. عبدالله بن سليمان (المدير العام)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setReassigningActivityId(null)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleReassignTaskAssignment(reassigningActivityId, newAssigneeStaffId)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    تأكيد نقل التكليف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. ADD BUDGET ITEM MODAL */}
          {isBudgetItemModalOpen && selectedActivityId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 text-xs animate-fadeIn">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  إضافة بند نفقة جديد للميزانية
                </h3>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم/بيان البند:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إيجار الحافلات / الضيافة والإعاشة..."
                    value={newBudgetItemCategory}
                    onChange={e => setNewBudgetItemCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">المبلغ المخطط (ريال):</label>
                  <input
                    type="number"
                    required
                    value={newBudgetItemPlanned}
                    onChange={e => setNewBudgetItemPlanned(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ملاحظات إضافية:</label>
                  <input
                    type="text"
                    placeholder="ملاحظات توضيحية..."
                    value={newBudgetItemNotes}
                    onChange={e => setNewBudgetItemNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setIsBudgetItemModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleAddExpenseBudgetItem(selectedActivityId)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    إضافة البند
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. ADD SUBTASK MODAL */}
          {isSubTaskModalOpen && selectedActivityId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 text-xs animate-fadeIn">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  إضافة مهمة تنفيذية فرعية
                </h3>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان المهمة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حجز القاعة وتأكيد الصوتيات..."
                    value={newSubTaskTitle}
                    onChange={e => setNewSubTaskTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الشخص المكلف:</label>
                    <input
                      type="text"
                      value={newSubTaskAssignee}
                      onChange={e => setNewSubTaskAssignee(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الأولوية:</label>
                    <select
                      value={newSubTaskPriority}
                      onChange={e => setNewSubTaskPriority(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                    >
                      <option value="high">قصوى</option>
                      <option value="medium">متوسطة</option>
                      <option value="low">عادية</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setIsSubTaskModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleAddSubTaskItem(selectedActivityId)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    إضافة المهمة
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* PRINTABLE CERTIFICATE MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {printingBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-8 border-amber-400 text-center space-y-6 relative overflow-hidden"
              dir="rtl"
            >
              <button
                onClick={() => setPrintingBadge(null)}
                className="absolute top-3 left-3 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Certificate Header */}
              <div className="space-y-2 border-b-2 border-amber-200 pb-4">
                <div className="text-xs font-bold text-amber-800 tracking-widest uppercase font-mono">
                  الملتقى القرآني النموذجي — إدارة الأوسمة والجوائز
                </div>
                <h2 className="text-2xl font-black text-indigo-950 font-serif">شهادة تكريم ومنح وسام</h2>
                <div className="text-sm font-bold text-amber-600 font-mono">الرقم المرجعي: {printingBadge.id}</div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  تتشرف إدارة الملتقى القرآني بتقديم أعلى آيات التهاني والتقدير للابن / الأستاذ المكرم:
                </p>

                <h3 className="text-2xl font-black text-indigo-900 border-b-2 border-indigo-200 inline-block px-8 py-1">
                  {printingBadge.recipientName}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                  وذلك لقاء استحقاقه الشرفي لـ <strong className="text-amber-800 text-sm">{printingBadge.badgeName}</strong> ({printingBadge.honorificTitle}) لقاء: {printingBadge.obtainedHow}.
                </p>

                {printingBadge.snapshotRewardAmount > 0 && (
                  <div className="inline-block bg-amber-50 border border-amber-300 px-6 py-2 rounded-xl text-xs font-black text-amber-950 font-mono shadow-xs">
                    قيمة المكافأة المرصودة: {printingBadge.snapshotRewardAmount.toLocaleString()} ريال سعودي
                  </div>
                )}
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="text-right">
                  <div className="font-bold">تاريخ التكريم:</div>
                  <div className="font-mono">{printingBadge.awardDate}</div>
                </div>

                <div className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center text-[10px] font-black text-amber-800 rotate-[-12deg] bg-amber-50">
                  ختم التكريم الرسمي
                </div>

                <div className="text-left">
                  <div className="font-bold">مدير عام الملتقى:</div>
                  <div className="font-serif font-bold text-indigo-900 mt-1">أ.د. عبدالله بن سليمان</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الشهادة الرسمية الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* BADGE TEMPLATE CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right overflow-y-auto max-h-[90vh]"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingTemplate ? 'تعديل وسام في البنك' : 'إضافة وسام جديد لبنك الأوسمة'}
                </h3>
                <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم الوسام:</label>
                  <input
                    type="text" required
                    value={templateForm.name}
                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    placeholder="وسام الحافظ المتقن..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الاسم الشرفي:</label>
                    <input
                      type="text" required
                      value={templateForm.honorificTitle}
                      onChange={e => setTemplateForm({ ...templateForm, honorificTitle: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                      placeholder="حافظ متقن..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع الوسام:</label>
                    <select
                      value={templateForm.badgeType}
                      onChange={e => setTemplateForm({ ...templateForm, badgeType: e.target.value as any, isAuto: e.target.value === 'auto' })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    >
                      <option value="auto">تلقائي (بشرط)</option>
                      <option value="director">أوسمة المدير (منح مباشر)</option>
                      <option value="special">خاص ومميز (استثنائي)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الفئة المستهدفة:</label>
                  <select
                    value={templateForm.targetAudience}
                    onChange={e => setTemplateForm({ ...templateForm, targetAudience: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="students">الطلاب</option>
                    <option value="teachers">المدرسون</option>
                    <option value="supervisors">المشرفون</option>
                    <option value="all">الجميع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">طريقة الحصول والشروط:</label>
                  <textarea
                    rows={2} required
                    value={templateForm.grantMethod}
                    onChange={e => setTemplateForm({ ...templateForm, grantMethod: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    placeholder="إتقان عدد الأوجه أوالحضور..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع المكافأة:</label>
                    <select
                      value={templateForm.rewardType}
                      onChange={e => setTemplateForm({ ...templateForm, rewardType: e.target.value as any })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    >
                      <option value="financial">مالية (بالريال)</option>
                      <option value="gift">هدية عينية</option>
                      <option value="certificate">شهادة تقدير</option>
                      <option value="honor">تكريم معنوي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">المبلغ التقديري (ر.س):</label>
                    <input
                      type="number"
                      value={templateForm.rewardAmount}
                      onChange={e => setTemplateForm({ ...templateForm, rewardAmount: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-md mt-2"
                >
                  حفظ الوسام ببنك الأوسمة
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
