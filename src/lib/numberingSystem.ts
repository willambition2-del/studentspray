/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified Numbering System Engine (نظام الترقيم الموحد)
 * Managed centrally with persistent configuration, counters, circle mappings, and transfer history.
 */

export interface NumberingPrefixSettings {
  circlePrefix: string;           // C
  teacherPrefix: string;          // T
  studentPrefix: string;          // S
  permanentStudentPrefix: string; // STD
  permanentStaffPrefix: string;   // STF
  parentPrefix: string;          // P
  activityPrefix: string;        // A
  examPrefix: string;            // E
  reportPrefix: string;          // R
  badgePrefix: string;           // B
  taskPrefix: string;            // TSK
  filePrefix: string;            // F
}

export interface NumberingCounters {
  nextCircleIndex: number;
  nextPermanentStudentIndex: number;
  nextPermanentStaffIndex: number;
  nextParentIndex: number;
  nextActivityIndex: number;
  nextExamIndex: number;
  nextReportIndex: number;
  nextBadgeIndex: number;
  nextTaskIndex: number;
  nextFileIndex: number;
}

export interface CircleCodeRecord {
  circleId: string;
  circleName: string;
  circleCode: string;       // e.g. "C-01", "C-02"
  nextStudentOrder: number; // e.g. 1 => S01
  nextTeacherOrder: number; // e.g. 1 => T01
  createdAt: string;
}

export interface CircleTransferHistoryEntry {
  id: string;
  circleCode: string;
  circleName: string;
  organizationalId: string; // e.g. "C-03-S07" or "C-03-T01"
  orderInCircle: number;
  startDate: string;
  endDate?: string;
  reason?: string;
}

export interface NumberedStudent {
  id: string;
  name: string;
  permanentId: string;        // e.g. STD-0024
  circleCode: string;         // e.g. C-03
  circleName: string;
  orderInCircle: number;      // e.g. 7
  organizationalId: string;   // e.g. C-03-S07
  circleHistory?: CircleTransferHistoryEntry[];
  parentPermanentId?: string; // e.g. P-015
  [key: string]: any;
}

export interface NumberedStaff {
  id: string;
  name: string;
  role: string;
  permanentId: string;        // e.g. STF-0027
  circleCode?: string;        // e.g. C-03
  circleName?: string;
  orderInCircle?: number;     // e.g. 1
  organizationalId?: string;  // e.g. C-03-T01
  circleHistory?: CircleTransferHistoryEntry[];
  [key: string]: any;
}

export interface NumberedParent {
  id: string;
  name: string;
  permanentId: string;        // e.g. P-015
  childrenPermanentIds: string[];
  phone?: string;
  [key: string]: any;
}

const STORAGE_KEYS = {
  SETTINGS: 'alhudacenter_numbering_settings',
  COUNTERS: 'alhudacenter_numbering_counters',
  CIRCLE_MAPS: 'alhudacenter_numbering_circles',
  STUDENTS_REGISTRY: 'alhudacenter_numbering_students',
  STAFF_REGISTRY: 'alhudacenter_numbering_staff',
  PARENTS_REGISTRY: 'alhudacenter_numbering_parents',
  HISTORY: 'alhudacenter_numbering_transfer_history',
};

export const DEFAULT_PREFIX_SETTINGS: NumberingPrefixSettings = {
  circlePrefix: 'C',
  teacherPrefix: 'T',
  studentPrefix: 'S',
  permanentStudentPrefix: 'STD',
  permanentStaffPrefix: 'STF',
  parentPrefix: 'P',
  activityPrefix: 'A',
  examPrefix: 'E',
  reportPrefix: 'R',
  badgePrefix: 'B',
  taskPrefix: 'TSK',
  filePrefix: 'F',
};

export const DEFAULT_COUNTERS: NumberingCounters = {
  nextCircleIndex: 1,
  nextPermanentStudentIndex: 1,
  nextPermanentStaffIndex: 1,
  nextParentIndex: 1,
  nextActivityIndex: 1,
  nextExamIndex: 1,
  nextReportIndex: 1,
  nextBadgeIndex: 1,
  nextTaskIndex: 1,
  nextFileIndex: 1,
};

// Pad number helper
export function padZero(num: number, size = 2): string {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

// In-memory runtime state store (No localStorage business state)
let inMemorySettings: NumberingPrefixSettings = { ...DEFAULT_PREFIX_SETTINGS };
let inMemoryCounters: NumberingCounters = { ...DEFAULT_COUNTERS };
let inMemoryCircleMaps: Record<string, CircleCodeRecord> = {};

// 1. Settings & Storage Loaders
export function getStoredPrefixSettings(): NumberingPrefixSettings {
  return inMemorySettings;
}

export function savePrefixSettings(settings: NumberingPrefixSettings): void {
  inMemorySettings = settings;
}

export function getStoredCounters(): NumberingCounters {
  return inMemoryCounters;
}

export function saveCounters(counters: NumberingCounters): void {
  inMemoryCounters = counters;
}

export function getStoredCircleCodeMaps(): Record<string, CircleCodeRecord> {
  return inMemoryCircleMaps;
}

export function saveCircleCodeMaps(maps: Record<string, CircleCodeRecord>): void {
  inMemoryCircleMaps = maps;
}

// 2. Circle Mapping & Code Generation
export function getOrCreateCircleCodeRecord(circleIdOrName: string, displayCircleName?: string): CircleCodeRecord {
  const maps = getStoredCircleCodeMaps();
  const normalizedKey = (circleIdOrName || 'general').trim().toLowerCase();
  
  // Search if map exists by key or circleName
  const existingKey = Object.keys(maps).find(k => 
    k === normalizedKey || 
    maps[k].circleId === circleIdOrName || 
    maps[k].circleName.trim().toLowerCase() === (displayCircleName || circleIdOrName).trim().toLowerCase()
  );

  if (existingKey && maps[existingKey]) {
    return maps[existingKey];
  }

  // Generate new fixed circle code C-01, C-02...
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const codeNum = counters.nextCircleIndex;
  const circleCode = `${settings.circlePrefix}-${padZero(codeNum, 2)}`;

  // Update counters
  counters.nextCircleIndex += 1;
  saveCounters(counters);

  const record: CircleCodeRecord = {
    circleId: circleIdOrName,
    circleName: displayCircleName || circleIdOrName,
    circleCode,
    nextStudentOrder: 1,
    nextTeacherOrder: 1,
    createdAt: new Date().toISOString(),
  };

  maps[normalizedKey] = record;
  saveCircleCodeMaps(maps);

  return record;
}

// 3. Generator Functions for Permanent IDs
export function generatePermanentStudentId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.permanentStudentPrefix}-${padZero(counters.nextPermanentStudentIndex, 4)}`;
  counters.nextPermanentStudentIndex += 1;
  saveCounters(counters);
  return id;
}

export function generatePermanentStaffId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.permanentStaffPrefix}-${padZero(counters.nextPermanentStaffIndex, 4)}`;
  counters.nextPermanentStaffIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateParentPermanentId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.parentPrefix}-${padZero(counters.nextParentIndex, 3)}`;
  counters.nextParentIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateActivityId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.activityPrefix}-${padZero(counters.nextActivityIndex, 3)}`;
  counters.nextActivityIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateExamId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.examPrefix}-${padZero(counters.nextExamIndex, 3)}`;
  counters.nextExamIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateReportId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.reportPrefix}-${padZero(counters.nextReportIndex, 3)}`;
  counters.nextReportIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateBadgeId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.badgePrefix}-${padZero(counters.nextBadgeIndex, 3)}`;
  counters.nextBadgeIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateTaskId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.taskPrefix}-${padZero(counters.nextTaskIndex, 3)}`;
  counters.nextTaskIndex += 1;
  saveCounters(counters);
  return id;
}

export function generateFileId(): string {
  const settings = getStoredPrefixSettings();
  const counters = getStoredCounters();
  const id = `${settings.filePrefix}-${padZero(counters.nextFileIndex, 3)}`;
  counters.nextFileIndex += 1;
  saveCounters(counters);
  return id;
}

// 4. Assigning Students to Circle with Transfer History
export function assignStudentToCircle(
  student: any,
  circleNameOrId: string,
  orderOverride?: number
): NumberedStudent {
  const settings = getStoredPrefixSettings();
  const circleRecord = getOrCreateCircleCodeRecord(circleNameOrId, circleNameOrId);
  const maps = getStoredCircleCodeMaps();

  // Ensure student permanent ID
  let permanentId = student.permanentId;
  if (!permanentId || !permanentId.startsWith(settings.permanentStudentPrefix)) {
    permanentId = generatePermanentStudentId();
  }

  // Determine order in circle
  let order = orderOverride;
  if (!order) {
    order = circleRecord.nextStudentOrder;
    circleRecord.nextStudentOrder += 1;
    // Save updated circle map
    const key = Object.keys(maps).find(k => maps[k].circleCode === circleRecord.circleCode) || circleNameOrId.trim().toLowerCase();
    maps[key] = circleRecord;
    saveCircleCodeMaps(maps);
  }

  const organizationalId = `${circleRecord.circleCode}-${settings.studentPrefix}${padZero(order, 2)}`;

  // History tracking
  const now = new Date().toISOString().split('T')[0];
  const history: CircleTransferHistoryEntry[] = student.circleHistory ? [...student.circleHistory] : [];

  // If student was in a previous circle that is different
  if (history.length > 0 && history[history.length - 1].circleCode !== circleRecord.circleCode) {
    history[history.length - 1].endDate = now;
  }

  // If current active history entry is different
  const currentActive = history.find(h => !h.endDate);
  if (!currentActive || currentActive.circleCode !== circleRecord.circleCode) {
    history.push({
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      circleCode: circleRecord.circleCode,
      circleName: circleRecord.circleName,
      organizationalId,
      orderInCircle: order,
      startDate: now,
    });
  }

  return {
    ...student,
    permanentId,
    circleCode: circleRecord.circleCode,
    circleName: circleRecord.circleName,
    orderInCircle: order,
    organizationalId,
    circleHistory: history,
  };
}

// 5. Assigning Teacher/Staff to Circle with Transfer History
export function assignStaffToCircle(
  staff: any,
  circleNameOrId?: string,
  orderOverride?: number
): NumberedStaff {
  const settings = getStoredPrefixSettings();
  
  // Ensure staff permanent ID
  let permanentId = staff.permanentId;
  if (!permanentId || !permanentId.startsWith(settings.permanentStaffPrefix)) {
    permanentId = generatePermanentStaffId();
  }

  if (!circleNameOrId) {
    return {
      ...staff,
      permanentId,
    };
  }

  const circleRecord = getOrCreateCircleCodeRecord(circleNameOrId, circleNameOrId);
  const maps = getStoredCircleCodeMaps();

  let order = orderOverride;
  if (!order) {
    order = circleRecord.nextTeacherOrder;
    circleRecord.nextTeacherOrder += 1;
    const key = Object.keys(maps).find(k => maps[k].circleCode === circleRecord.circleCode) || circleNameOrId.trim().toLowerCase();
    maps[key] = circleRecord;
    saveCircleCodeMaps(maps);
  }

  const organizationalId = `${circleRecord.circleCode}-${settings.teacherPrefix}${padZero(order, 2)}`;

  const now = new Date().toISOString().split('T')[0];
  const history: CircleTransferHistoryEntry[] = staff.circleHistory ? [...staff.circleHistory] : [];

  if (history.length > 0 && history[history.length - 1].circleCode !== circleRecord.circleCode) {
    history[history.length - 1].endDate = now;
  }

  const currentActive = history.find(h => !h.endDate);
  if (!currentActive || currentActive.circleCode !== circleRecord.circleCode) {
    history.push({
      id: `sth-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      circleCode: circleRecord.circleCode,
      circleName: circleRecord.circleName,
      organizationalId,
      orderInCircle: order,
      startDate: now,
    });
  }

  return {
    ...staff,
    permanentId,
    circleCode: circleRecord.circleCode,
    circleName: circleRecord.circleName,
    orderInCircle: order,
    organizationalId,
    circleHistory: history,
  };
}

// 6. Formatting Helpers
export function formatStudentDisplayId(student: Partial<NumberedStudent>): { primary: string; secondary: string; fullLabel: string } {
  const name = student.name || 'طالب';
  const orgId = student.organizationalId || `${student.circleCode || 'C-01'}-S${padZero(student.orderInCircle || 1, 2)}`;
  const permId = student.permanentId || 'STD-0000';

  return {
    primary: `${name} | ${orgId}`,
    secondary: `الرقم الداخلي الثابت: ${permId}`,
    fullLabel: `${name} | ${orgId} (${permId})`,
  };
}

export function formatStaffDisplayId(staff: Partial<NumberedStaff>): { primary: string; secondary: string; fullLabel: string } {
  const name = staff.name || 'عضو الكادر';
  const orgId = staff.organizationalId || (staff.circleCode ? `${staff.circleCode}-T${padZero(staff.orderInCircle || 1, 2)}` : '');
  const permId = staff.permanentId || 'STF-0000';

  return {
    primary: orgId ? `${name} | ${orgId}` : `${name} | ${permId}`,
    secondary: `المعرف الداخلي الثابت: ${permId}`,
    fullLabel: orgId ? `${name} | ${orgId} (${permId})` : `${name} | ${permId}`,
  };
}

export function formatParentDisplayId(parent: Partial<NumberedParent>): { primary: string; fullLabel: string } {
  const name = parent.name || 'ولي الأمر';
  const permId = parent.permanentId || 'P-001';

  return {
    primary: `${name} | ${permId}`,
    fullLabel: `${name} | ${permId}`,
  };
}
