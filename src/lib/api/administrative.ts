import { buildQuery, request } from './client';

// ==========================================
// Types
// ==========================================
export type AdminRequestType =
  | 'LEAVE'
  | 'TRANSFER'
  | 'EXCEPTION'
  | 'CURRICULUM_MODIFICATION'
  | 'ACTIVITY_PROPOSAL'
  | 'BUDGET_REQUEST'
  | 'GENERAL';

export type AdminRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type AdminPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ApprovalActionType =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'CANCELLED';

export type AdminDecisionType =
  | 'HIRE_TEACHER'
  | 'TRANSFER_TEACHER'
  | 'HIRE_SUPERVISOR'
  | 'OPEN_HALAQA'
  | 'CLOSE_HALAQA'
  | 'MERGE_HALAQAT'
  | 'TRANSFER_STUDENT'
  | 'APPROVE_PROJECT'
  | 'APPROVE_ACTIVITY'
  | 'GENERAL_DIRECTIVE';

export type AdminDecisionStatus = 'DRAFT' | 'ISSUED' | 'ACTIVE' | 'CANCELLED' | 'ARCHIVED';

export type DecisionTargetType = 'ALL_FORUM' | 'BRANCH' | 'ROLE' | 'HALAQA' | 'USER';

export type AdminAlertType =
  | 'TASK_OVERDUE'
  | 'REQUEST_PENDING'
  | 'RECOMMENDATION_OVERDUE'
  | 'ATTENDANCE_CRITICAL'
  | 'EXAM_REVIEW_NEEDED'
  | 'CUSTOM';

export type AdminAlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AdminAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export type AdminTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ApprovalActionItem {
  id: string;
  requestId: string;
  actorId: string;
  action: ApprovalActionType;
  comment?: string | null;
  createdAt: string;
  actor?: { id: string; displayName?: string | null; username: string };
}

export interface AdministrativeRequestItem {
  id: string;
  forumId: string;
  branchId?: string | null;
  type: AdminRequestType;
  title: string;
  description: string;
  requestedById: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  status: AdminRequestStatus;
  priority: AdminPriority;
  submittedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy?: { id: string; displayName?: string | null; username: string };
  branch?: { id: string; name: string } | null;
  approvalActions?: ApprovalActionItem[];
  decisions?: Array<{ id: string; decisionNumber: string; title: string; status: string }>;
  tasks?: Array<{ id: string; title: string; status: string }>;
}

export interface DecisionAudienceItem {
  id: string;
  decisionId: string;
  targetType: DecisionTargetType;
  targetId?: string | null;
}

export interface AdminDecisionItem {
  id: string;
  forumId: string;
  branchId?: string | null;
  decisionNumber: string;
  title: string;
  content: string;
  type: AdminDecisionType;
  status: AdminDecisionStatus;
  issuedById: string;
  issuedAt: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  relatedRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
  issuedBy?: { id: string; displayName?: string | null; username: string };
  branch?: { id: string; name: string } | null;
  audiences?: DecisionAudienceItem[];
  relatedRequest?: { id: string; title: string; type?: string; status?: string } | null;
  tasks?: Array<{ id: string; title: string; status: string }>;
}

export interface AdminAlertItem {
  id: string;
  forumId: string;
  branchId?: string | null;
  type: AdminAlertType;
  severity: AdminAlertSeverity;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  assignedToId?: string | null;
  status: AdminAlertStatus;
  dueAt?: string | null;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; displayName?: string | null; username: string } | null;
  resolvedBy?: { id: string; displayName?: string | null; username: string } | null;
  branch?: { id: string; name: string } | null;
}

export interface TaskFollowUpItem {
  id: string;
  taskId: string;
  actorId: string;
  status?: AdminTaskStatus | null;
  note: string;
  createdAt: string;
  actor?: { id: string; displayName?: string | null; username: string };
}

export interface AdminTaskItem {
  id: string;
  forumId: string;
  branchId?: string | null;
  title: string;
  description?: string | null;
  assignedToId: string;
  createdById: string;
  relatedDecisionId?: string | null;
  relatedRequestId?: string | null;
  relatedAlertId?: string | null;
  priority: AdminPriority;
  status: AdminTaskStatus;
  dueAt?: string | null;
  completedAt?: string | null;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; displayName?: string | null; username: string };
  createdBy?: { id: string; displayName?: string | null; username: string };
  branch?: { id: string; name: string } | null;
  relatedDecision?: { id: string; decisionNumber: string; title: string; status?: string } | null;
  relatedRequest?: { id: string; title: string; status?: string } | null;
  relatedAlert?: { id: string; title: string; severity?: string } | null;
  followUps?: TaskFollowUpItem[];
}

// ==========================================
// 1. REQUESTS API
// ==========================================
export async function getAdminRequests(params?: {
  page?: number;
  limit?: number;
  status?: AdminRequestStatus;
  type?: AdminRequestType;
  priority?: AdminPriority;
  branchId?: string;
  search?: string;
  myOnly?: boolean;
}): Promise<{ items: AdministrativeRequestItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-requests${query}`);
}

export async function getMyAdminRequests(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: AdministrativeRequestItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-requests/my${query}`);
}

export async function getAdminRequest(id: string): Promise<AdministrativeRequestItem> {
  return request(`/admin-requests/${id}`);
}

export async function createAdminRequest(data: {
  type: AdminRequestType;
  title: string;
  description: string;
  branchId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority?: AdminPriority;
  submitNow?: boolean;
}): Promise<AdministrativeRequestItem> {
  return request('/admin-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminRequest(
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: AdminPriority;
  },
): Promise<AdministrativeRequestItem> {
  return request(`/admin-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function submitAdminRequest(id: string): Promise<AdministrativeRequestItem> {
  return request(`/admin-requests/${id}/submit`, {
    method: 'POST',
  });
}

export async function reviewAdminRequest(
  id: string,
  data: {
    action: 'APPROVED' | 'REJECTED' | 'RETURNED';
    comment?: string;
  },
): Promise<AdministrativeRequestItem> {
  return request(`/admin-requests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelAdminRequest(id: string): Promise<AdministrativeRequestItem> {
  return request(`/admin-requests/${id}/cancel`, {
    method: 'POST',
  });
}

// ==========================================
// 2. DECISIONS API
// ==========================================
export async function getAdminDecisions(params?: {
  page?: number;
  limit?: number;
  status?: AdminDecisionStatus;
  type?: AdminDecisionType;
  branchId?: string;
  search?: string;
}): Promise<{ items: AdminDecisionItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-decisions${query}`);
}

export async function getAdminDecision(id: string): Promise<AdminDecisionItem> {
  return request(`/admin-decisions/${id}`);
}

export async function createAdminDecision(data: {
  title: string;
  content: string;
  type: AdminDecisionType;
  branchId?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  relatedRequestId?: string;
  audiences?: Array<{ targetType: DecisionTargetType; targetId?: string }>;
  issueNow?: boolean;
}): Promise<AdminDecisionItem> {
  return request('/admin-decisions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminDecision(
  id: string,
  data: {
    title?: string;
    content?: string;
    status?: AdminDecisionStatus;
    effectiveFrom?: string;
    effectiveUntil?: string;
  },
): Promise<AdminDecisionItem> {
  return request(`/admin-decisions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function issueAdminDecision(id: string): Promise<AdminDecisionItem> {
  return request(`/admin-decisions/${id}/issue`, {
    method: 'POST',
  });
}

export async function cancelAdminDecision(id: string): Promise<AdminDecisionItem> {
  return request(`/admin-decisions/${id}/cancel`, {
    method: 'POST',
  });
}

// ==========================================
// 3. ALERTS API
// ==========================================
export async function getAdminAlerts(params?: {
  page?: number;
  limit?: number;
  status?: AdminAlertStatus;
  severity?: AdminAlertSeverity;
  type?: AdminAlertType;
  branchId?: string;
  assignedToId?: string;
  search?: string;
}): Promise<{ items: AdminAlertItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-alerts${query}`);
}

export async function getAdminAlert(id: string): Promise<AdminAlertItem> {
  return request(`/admin-alerts/${id}`);
}

export async function createAdminAlert(data: {
  type: AdminAlertType;
  severity: AdminAlertSeverity;
  title: string;
  message: string;
  branchId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  assignedToId?: string;
  dueAt?: string;
}): Promise<AdminAlertItem> {
  return request('/admin-alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acknowledgeAdminAlert(id: string): Promise<AdminAlertItem> {
  return request(`/admin-alerts/${id}/acknowledge`, {
    method: 'POST',
  });
}

export async function resolveAdminAlert(
  id: string,
  data?: {
    resolutionNote?: string;
    status?: AdminAlertStatus;
  },
): Promise<AdminAlertItem> {
  return request(`/admin-alerts/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
}

// ==========================================
// 4. TASKS API
// ==========================================
export async function getAdminTasks(params?: {
  page?: number;
  limit?: number;
  status?: AdminTaskStatus;
  priority?: AdminPriority;
  branchId?: string;
  assignedToId?: string;
  search?: string;
  myOnly?: boolean;
}): Promise<{ items: AdminTaskItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-tasks${query}`);
}

export async function getMyAdminTasks(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: AdminTaskItem[]; total: number }> {
  const query = buildQuery(params);
  return request(`/admin-tasks/my${query}`);
}

export async function getAdminTask(id: string): Promise<AdminTaskItem> {
  return request(`/admin-tasks/${id}`);
}

export async function createAdminTask(data: {
  title: string;
  description?: string;
  assignedToId: string;
  branchId?: string;
  relatedDecisionId?: string;
  relatedRequestId?: string;
  relatedAlertId?: string;
  priority?: AdminPriority;
  dueAt?: string;
}): Promise<AdminTaskItem> {
  return request('/admin-tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminTask(
  id: string,
  data: {
    status?: AdminTaskStatus;
    priority?: AdminPriority;
    dueAt?: string;
  },
): Promise<AdminTaskItem> {
  return request(`/admin-tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addTaskFollowUp(
  id: string,
  data: {
    status?: AdminTaskStatus;
    note: string;
  },
): Promise<TaskFollowUpItem> {
  return request(`/admin-tasks/${id}/follow-ups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function checkOverdueTasks(): Promise<{ checkedTotal: number; alertsGenerated: number }> {
  return request('/admin-tasks/check-overdue', {
    method: 'POST',
  });
}

