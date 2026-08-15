/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types for Quranic Center Management System - General Manager Module

export type UserType = 'admin' | 'branch_manager' | 'supervisor' | 'teacher' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  type: UserType;
  roleId: string | null; // Null means default permissions of type
  roleName?: string;
  status: 'active' | 'inactive' | 'archived';
  branchId: string | null; // e.g. "الغربية", "الشرقية" or null for GM
  branchName?: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  category: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  userCount?: number;
}

export type ApprovalType = 
  | 'student_plan' 
  | 'circle_plan' 
  | 'activity' 
  | 'annual_report' 
  | 'student_transfer' 
  | 'admin_decision'
  | 'financial_budget'
  | 'curriculum_change'
  | 'quality_audit'
  | 'parent_appeal'
  | 'teacher_nomination';

export type UrgencyLevel = 'normal' | 'high' | 'urgent';

export interface ClarificationRequest {
  id: string;
  requestedBy: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  timestamp: string;
}

export interface ApprovalAuditEntry {
  id: string;
  author: string;
  role: string;
  action: string;
  notes?: string;
  timestamp: string;
}

export interface ApprovalAttachment {
  name: string;
  size?: string;
  type?: string;
  url?: string;
}

export interface ApprovalRequest {
  id: string;
  decisionNumber?: string;
  title: string;
  type: ApprovalType;
  requesterName: string;
  requesterRole?: string;
  department: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision' | 'conditional_approved';
  notes?: string;
  createdAt: string;
  urgency?: UrgencyLevel;
  targetBranch?: string;
  targetCircle?: string;
  affectedEntityCount?: number;
  estimatedBudget?: number;
  approvedBudget?: number;
  assignedCommittee?: string;
  approvalConditions?: string;
  decisionReason?: string;
  decisionDate?: string;
  decisionMaker?: string;
  attachments?: ApprovalAttachment[];
  clarificationRequests?: ClarificationRequest[];
  auditTrail?: ApprovalAuditEntry[];
  editableData?: {
    customPlanDays?: number;
    targetCircleName?: string;
    allocatedBudget?: number;
    eventDateRange?: string;
    extraInstructions?: string;
  };
}

export interface VisualIdentity {
  centerName: string;
  logo: string; // SVG path or descriptor index
  textLogo: string;
  phone: string;
  email: string;
  website: string;
  affiliate: string; // الجهة التابعة (e.g. الجمعية الخيرية لتحفيظ القرآن الكربم)
  
  // Custom new configuration fields
  primaryColor?: string;
  secondaryColor?: string;
  uiStylePattern?: 'formal' | 'educational' | 'interactive';
  genderMode?: 'boys' | 'girls' | 'mixed';
  genderModeLocked?: boolean;
  autoBackupInterval?: 'daily' | 'weekly' | 'monthly' | 'disabled';
  defaultLanguage?: 'ar' | 'en';
  timezone?: string;
  studentIdFormat?: string;
  enableEduIndicators?: boolean;
  enableSmartAlerts?: boolean;
  enableAutoReports?: boolean;
  interfaceDetailLevel?: 'brief' | 'detailed';
  defaultFontSize?: 'small' | 'medium' | 'large';
  tableDensity?: 'dense' | 'comfortable';
  showQuickIndicators?: boolean;
  enableInteractiveCards?: boolean;
  viewLayoutStyle?: 'table' | 'cards';
  
  // Configuration history for rollback
  configHistory?: Array<{
    id: string;
    timestamp: string;
    operator: string;
    changesSummary: string;
    snapshot: any;
  }>;
}

export interface SchoolYear {
  id: string;
  yearCode: string; // e.g. 1447-1448 هـ
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  copiedFromYearId?: string;
  settingsCopied?: {
    plans: boolean;
    curricula: boolean;
    kpis: boolean;
    evalSettings: boolean;
  };
}

export interface BackupStats {
  students: number;
  circles: number;
  teachers: number;
  supervisors: number;
  plans: number;
  activities: number;
  achievements: number;
  graduates: number;
  reports: number;
}

export interface BackupInfo {
  id: string;
  fileName: string;
  version: string;
  stats: BackupStats;
  createdAt: string;
  backedUpBy: string;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'low_attendance' | 'delayed_eval' | 'stopped_plans' | 'struggling_students' | 'backup_failed' | 'overdue_approvals';

export interface CriticalAlert {
  id: string;
  title: string;
  type: AlertType;
  severity: AlertSeverity;
  status: 'active' | 'assigned' | 'resolved' | 'archived';
  details: string;
  assignedTo?: string; // e.g., "أبو أحمد (مشرف الفرع)"
  createdAt: string;
}

export type DecisionType = 
  | 'hire_teacher' 
  | 'transfer_teacher' 
  | 'hire_supervisor' 
  | 'open_circle' 
  | 'close_circle' 
  | 'merge_circles' 
  | 'transfer_student' 
  | 'approve_project' 
  | 'approve_activity' 
  | 'general';

export interface AdminDecision {
  id: string;
  decisionNumber: string; // e.g. Q-1447-042
  title: string;
  type: DecisionType;
  targetEntity: string; // الجهة المعنية
  date: string;
  content: string;
  status: 'draft' | 'approved' | 'ongoing' | 'archived';
  attachments: string[]; // Mock file names
  createdAt: string;
}

export interface AuditLog {
  id: string;
  username: string;
  operationType: 'create' | 'update' | 'delete' | 'approve' | 'auth' | 'restore' | 'decision' | 'backup';
  affectedEntity: string; // e.g. "المستخدم: أحمد محمد"
  details: string;
  timestamp: string;
}

export interface GeneralDashboardStats {
  totalStudents: number;
  totalCircles: number;
  totalTeachers: number;
  totalSupervisors: number;
  attendanceRate: number; // e.g. 92
  planComplianceRate: number; // e.g. 84
  graduatesCount: number;
  activitiesCount: number;
  achievementsCount: number;
  criticalAlertsCount: number;
  pendingRequestsCount: number;
  adminDecisionsCount: number;
}

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
  type: string;
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
  
  academicIndicator: 'green' | 'yellow' | 'red';
  riskFlags: string[];
  hifzRate: number;
  muraajaaRate: number;
  commitmentScore: number;
  lastExamScore: number;
  lastExamName: string;
  attendanceRate: number;
  trend: 'up' | 'down' | 'stable';
  
  timeline: Array<{ date: string; title: string; desc: string; author: string }>;
  goals: StudentGoal[];
  interventions: StudentIntervention[];
  decisions: EducationalDecision[];
  notes: StudentNote[];
  communicationLog: Array<{ date: string; method: string; note: string; officer: string }>;
  achievements: Array<{ date: string; title: string; category: string }>;
}

// --- PUBLIC SHELF (الرف العام) TYPES ---
export type ShelfCategory = 'general' | 'benefit' | 'announcement' | 'warning' | 'guidance' | 'reflection';

export interface ShelfPost {
  id: string;
  title: string;
  content: string;
  category: ShelfCategory;
  authorName: string;
  authorRole: string;
  authorId?: string;
  date: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isPinned?: boolean;
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
}

export interface ShelfResource {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'book' | 'doc' | 'media' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  date: string;
  addedBy: string;
  downloadCount: number;
}

export interface ShelfAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
  isUrgent?: boolean;
}

export interface ShelfReflection {
  id: string;
  verseOrTitle: string;
  reflectionText: string;
  authorName: string;
  date: string;
  category: 'قرآني' | 'تربوي' | 'تزكوي' | 'تعليمي';
}

// --- CHAT SYSTEM (المحادثات) TYPES ---
export type ConversationType = 'circle' | 'staff' | 'parent_teacher' | 'private';

export interface ChatMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  username?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  circleId?: string;
  teacherId?: string;
  parentId?: string;
  studentId?: string;
  allowedRoles?: string[];
  allowedUserIds?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: Record<string, number>;
  members: ChatMember[];
  isCustomPrivate?: boolean;
  createdById?: string;
  createdByName?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
}

// --- GRADES SYSTEM (درجات الطلاب) TYPES ---

export interface GradeCriterion {
  id: string;
  name: string; // e.g. 'الحفظ', 'التلاوة', 'التجويد', 'الحضور', 'السلوك'
  maxScore: number; // e.g. 40, 20, 20, 10, 10
}

export interface Exam {
  id: string;
  title: string;
  curriculum: string;
  circleId: string;
  circleName: string;
  period: string;
  date: string;
  criteria: GradeCriterion[];
  maxTotalScore: number;
  status: 'draft' | 'approved';
  createdById?: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
}

export interface StudentGradeEntry {
  studentId: string;
  studentName: string;
  nationalId?: string;
  scores: Record<string, number>; // criterion.id -> numeric score
  totalScore: number;
  percentage: number;
  rating: string; // e.g. 'ممتاز'
  notes?: string;
}

export interface ExamGradesRecord {
  id: string;
  examId: string;
  circleId: string;
  curriculum: string;
  period: string;
  teacherName?: string;
  enteredByUserId: string;
  enteredByUserName: string;
  enteredDate: string;
  status: 'draft' | 'approved';
  approvedBy?: string;
  approvedDate?: string;
  studentGrades: StudentGradeEntry[];
}

export interface RatingThresholdSetting {
  minPercentage: number;
  maxPercentage: number;
  label: string;
  color?: string;
}

// --- PRINT CENTER (مركز الطباعة الموحد) TYPES ---

export type PrintDocType = 
  | 'report' 
  | 'award' 
  | 'certificate' 
  | 'grade' 
  | 'attendance' 
  | 'student' 
  | 'circle' 
  | 'resource' 
  | 'publication' 
  | 'shared';

export type DataScope = 
  | 'my_data' 
  | 'my_students' 
  | 'my_circle' 
  | 'my_circles' 
  | 'staff' 
  | 'branch' 
  | 'system_wide';

export type PrintActionPermission = 'view' | 'print' | 'pdf' | 'excel' | 'share' | 'create' | 'edit' | 'delete' | 'approve';

export interface DocumentShareRule {
  id: string;
  docId: string;
  sharedByUserId: string;
  sharedByUserName: string;
  sharedByUserRole?: string;
  targetType: 'user' | 'teacher' | 'teacher_group' | 'circle' | 'circle_group' | 'staff' | 'all_teachers' | 'parents' | 'students' | 'everyone';
  targetId?: string; // userId, circleId, etc.
  targetName: string;
  permissionLevel: 'view' | 'view_print' | 'view_pdf' | 'full';
  sharedAt: string;
  notes?: string;
}

export interface PrintDocument {
  id: string;
  serialNumber: string; // e.g. DOC-1447-001
  title: string;
  docType: PrintDocType;
  dataScope: DataScope;
  ownerId?: string;
  ownerName?: string;
  entityType?: 'student' | 'circle' | 'teacher' | 'staff' | 'general' | 'exam' | 'award' | 'shelf_file' | 'decision';
  entityId?: string;
  entityName?: string;
  circleId?: string;
  circleName?: string;
  studentId?: string;
  studentName?: string;
  templateId?: string;
  templateName?: string;
  description?: string;
  date: string;
  hijriDate?: string;
  allowView: boolean;
  allowPrint: boolean;
  allowPdf: boolean;
  allowExcel: boolean;
  allowShare: boolean;
  contentData?: any; // Dynamic auto-populated payload
  sharedWith?: DocumentShareRule[];
  createdAt: string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  type: PrintDocType;
  headerTitle: string;
  subtitle: string;
  logoPlacement: 'right' | 'center' | 'left';
  primaryColor: string;
  accentColor: string;
  includeWatermark: boolean;
  watermarkText?: string;
  footerText: string;
  signatureTitle1?: string;
  signatureName1?: string;
  signatureTitle2?: string;
  signatureName2?: string;
  includeQrCode: boolean;
  layoutStyle: 'certificate' | 'award_card' | 'formal_table' | 'report_sheet';
  updatedAt: string;
}

export interface PrintAuditRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  docId: string;
  docType: PrintDocType;
  docTitle: string;
  entityName?: string;
  action: 'print' | 'pdf' | 'excel';
  copiesCount?: number;
  timestamp: string;
  ipAddress?: string;
  notes?: string;
}



