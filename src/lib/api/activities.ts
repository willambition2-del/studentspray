import { buildQuery, request } from './client';

export interface ActivityParticipant {
  id: string;
  activityId: string;
  studentId: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { id: string; displayName?: string; username: string };
  };
  nominationStatus: 'NOMINATED' | 'APPROVED' | 'REJECTED';
  parentApprovalStatus: string;
  attendanceStatus: 'NOT_RECORDED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  score?: number;
  notes?: string;
  registeredAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: 'CONTEST' | 'TRIP' | 'PROGRAM' | 'COURSE' | 'MEETING' | 'SPORTS' | 'ENTERTAINMENT' | 'EDUCATIONAL' | 'QURANIC' | 'INITIATIVE' | 'CAMPAIGN' | 'CEREMONY' | 'CAMP' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  startsAt: string;
  endsAt?: string;
  location?: string;
  capacity?: number;
  branchId?: string;
  branch?: { id: string; name: string };
  halaqaId?: string;
  halaqa?: { id: string; name: string };
  participants?: ActivityParticipant[];
  _count?: { participants: number; awards: number };
  createdAt: string;
}

export async function getActivities(params?: {
  status?: string;
  type?: string;
  branchId?: string;
  halaqaId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Activity[]; total: number }> {
  const query = buildQuery(params);
  return request(`/activities${query}`);
}

export async function getActivity(id: string): Promise<Activity> {
  return request(`/activities/${id}`);
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  return request('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
  return request(`/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function nominateActivityParticipant(
  activityId: string,
  data: { studentId: string; notes?: string },
): Promise<ActivityParticipant> {
  return request(`/activities/${activityId}/participants`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActivityParticipantStatus(
  activityId: string,
  studentId: string,
  data: {
    nominationStatus?: string;
    attendanceStatus?: string;
    parentApprovalStatus?: string;
    notes?: string;
  },
): Promise<ActivityParticipant> {
  return request(`/activities/${activityId}/participants/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
