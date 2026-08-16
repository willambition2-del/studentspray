import { buildQuery, request } from './client';

export interface Award {
  id: string;
  name: string;
  description?: string;
  iconKey?: string;
  type: 'MEDAL' | 'BADGE' | 'SHIELD' | 'CERTIFICATE' | 'POINTS' | 'HONORARY';
  points: number;
  isActive: boolean;
  _count?: { studentAwards: number };
  createdAt: string;
}

export interface StudentAward {
  id: string;
  awardId: string;
  award?: Award;
  studentId: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { id: string; displayName?: string; username: string };
  };
  reason: string;
  activityId?: string;
  activity?: { id: string; title: string };
  competitionId?: string;
  competition?: { id: string; title: string };
  awardedById?: string;
  awardedBy?: { id: string; displayName?: string };
  awardedAt: string;
  createdAt: string;
}

export async function getAwards(params?: {
  type?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Award[]; total: number }> {
  const query = buildQuery(params);
  return request(`/awards${query}`);
}

export async function getAward(id: string): Promise<Award> {
  return request(`/awards/${id}`);
}

export async function createAward(data: Partial<Award>): Promise<Award> {
  return request('/awards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAward(id: string, data: Partial<Award>): Promise<Award> {
  return request(`/awards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function grantAward(data: {
  awardId: string;
  studentId: string;
  reason: string;
  activityId?: string;
  competitionId?: string;
}): Promise<StudentAward> {
  return request('/awards/grant', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStudentAwards(studentId: string): Promise<StudentAward[]> {
  return request(`/awards/students/${studentId}`);
}
