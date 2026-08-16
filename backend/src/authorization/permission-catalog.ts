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
  'academic_years.read': 'View academic years and terms within authorized scope',
  'academic_years.manage': 'Create and manage academic years and terms',
  'educational_plans.read': 'View educational plans within authorized scope',
  'educational_plans.manage': 'Create and manage educational plans',
  'attendance.read': 'View attendance within authorized scope',
  'attendance.write': 'Record attendance within authorized scope',
  'memorization.read': 'View memorization within authorized scope',
  'memorization.write': 'Record memorization within authorized scope',
  'revision.read': 'View revision records within authorized scope',
  'revision.write': 'Record revision records within authorized scope',
  'student_progress.read': 'View student progress and indicators within authorized scope',
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
    'academic_years.read', 'educational_plans.read', 'educational_plans.manage',
    'attendance.read', 'memorization.read', 'revision.read', 'student_progress.read',
    'grades.read', 'field_visits.read', 'field_visits.write', 'reports.read', 'audit.read',
  ],
  TEACHER: [
    'students.read', 'halaqas.read', 'educational_plans.read',
    'attendance.read', 'attendance.write', 'memorization.read', 'memorization.write', 'revision.read', 'revision.write',
    'student_progress.read', 'grades.read', 'grades.write'
  ],
  TECHNICAL_SUPERVISOR: [
    'students.read', 'halaqas.read', 'academic_years.read', 'educational_plans.read',
    'attendance.read', 'memorization.read', 'revision.read', 'student_progress.read',
    'grades.read', 'field_visits.read', 'field_visits.write', 'reports.read'
  ],
  STUDENT: ['educational_plans.read', 'attendance.read', 'memorization.read', 'revision.read', 'student_progress.read', 'grades.read'],
  PARENT: ['students.read', 'educational_plans.read', 'attendance.read', 'memorization.read', 'revision.read', 'student_progress.read', 'grades.read'],
};
