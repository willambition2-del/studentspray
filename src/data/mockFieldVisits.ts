import { FieldVisitRecord } from '../types/fieldVisits';

export const INITIAL_MOCK_FIELD_VISITS: FieldVisitRecord[] = [];

let inMemoryFieldVisits: FieldVisitRecord[] = [];

export function getStoredFieldVisits(): FieldVisitRecord[] {
  return inMemoryFieldVisits;
}

export function saveStoredFieldVisits(visits: FieldVisitRecord[]): void {
  inMemoryFieldVisits = visits;
}
