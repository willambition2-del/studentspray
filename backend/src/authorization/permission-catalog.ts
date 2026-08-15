export const PERMISSION_CATALOG = {
  'branches.read': 'View branches within authorized scope',
  'branches.manage': 'Create and manage branches within authorized scope',
  'users.read': 'View user accounts',
  'users.manage': 'Create and manage user accounts',
  'roles.read': 'View roles and permissions',
  'roles.manage': 'Manage roles and permissions',
  'students.read': 'View students within authorized scope',
  'students.manage': 'Manage students within authorized scope',
  'halaqas.read': 'View halaqas within authorized scope',
  'halaqas.manage': 'Manage halaqas within authorized scope',
  'attendance.read': 'View attendance within authorized scope',
  'attendance.write': 'Record attendance within authorized scope',
  'memorization.read': 'View memorization within authorized scope',
  'memorization.write': 'Record memorization within authorized scope',
  'grades.read': 'View grades within authorized scope',
  'grades.write': 'Record grades within authorized scope',
  'field_visits.read': 'View field visits within authorized scope',
  'field_visits.write': 'Manage field visits within authorized scope',
  'reports.read': 'View authorized reports',
  'settings.manage': 'Manage forum settings',
  'audit.read': 'View audit records',
} as const;

export type PermissionCode = keyof typeof PERMISSION_CATALOG;

export const ROLE_PERMISSION_DEFAULTS: Record<string, readonly PermissionCode[]> = {
  GENERAL_MANAGER: Object.keys(PERMISSION_CATALOG) as PermissionCode[],
  EXECUTIVE_MANAGER: [
    'branches.read', 'users.read', 'roles.read', 'students.read', 'students.manage', 'halaqas.read', 'halaqas.manage',
    'attendance.read', 'memorization.read', 'grades.read', 'field_visits.read', 'field_visits.write', 'reports.read', 'audit.read',
  ],
  TEACHER: ['students.read', 'halaqas.read', 'attendance.read', 'attendance.write', 'memorization.read', 'memorization.write', 'grades.read', 'grades.write'],
  TECHNICAL_SUPERVISOR: ['students.read', 'halaqas.read', 'attendance.read', 'memorization.read', 'grades.read', 'field_visits.read', 'field_visits.write', 'reports.read'],
  STUDENT: ['attendance.read', 'memorization.read', 'grades.read'],
  PARENT: ['students.read', 'attendance.read', 'memorization.read', 'grades.read'],
};
