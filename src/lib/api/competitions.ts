import { buildQuery, request } from './client';

export interface CompetitionParticipant {
  id: string;
  competitionId: string;
  studentId: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { id: string; displayName?: string; username: string };
  };
  registeredAt: string;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  studentId: string;
  student?: {
    id: string;
    studentNumber?: string;
    user?: { id: string; displayName?: string; username: string };
  };
  score: number;
  rank?: number;
  notes?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Competition {
  id: string;
  title: string;
  description?: string;
  category: 'MEMORIZATION' | 'TAJWEED' | 'RECITATION' | 'INTERPRETATION' | 'GENERAL_KNOWLEDGE' | 'HADITH' | 'CALLIGRAPHY' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESULTS_PUBLISHED' | 'CANCELLED';
  startsAt: string;
  endsAt?: string;
  maxScore: number;
  criteria?: any;
  branchId?: string;
  branch?: { id: string; name: string };
  participants?: CompetitionParticipant[];
  results?: CompetitionResult[];
  _count?: { participants: number; results: number; awards: number };
  createdAt: string;
}

export async function getCompetitions(params?: {
  status?: string;
  category?: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Competition[]; total: number }> {
  const query = buildQuery(params);
  return request(`/competitions${query}`);
}

export async function getCompetition(id: string): Promise<Competition> {
  return request(`/competitions/${id}`);
}

export async function createCompetition(data: Partial<Competition>): Promise<Competition> {
  return request('/competitions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompetition(id: string, data: Partial<Competition>): Promise<Competition> {
  return request(`/competitions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function registerCompetitionParticipant(
  competitionId: string,
  data: { studentId: string },
): Promise<CompetitionParticipant> {
  return request(`/competitions/${competitionId}/participants`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recordCompetitionResults(
  competitionId: string,
  data: { results: Array<{ studentId: string; score: number; rank?: number; notes?: string }> },
): Promise<CompetitionResult[]> {
  return request(`/competitions/${competitionId}/results`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
