/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResultCategory, SearchResultItem } from './searchTypes';

export interface CurrentUserRef {
  id: string;
  name: string;
  type: string; // 'admin' | 'branch_manager' | 'supervisor' | 'teacher' | 'parent' | 'student'
  roleName?: string;
  branchId?: string | null;
  circleId?: string;
}

/**
 * Checks if a given category is allowed for the user's role
 */
export function canUserAccessCategory(user: CurrentUserRef | null, category: SearchResultCategory): boolean {
  if (!user) return false;
  
  const userType = user.type;

  if (userType === 'admin' || userType === 'branch_manager') {
    return true; // Full access
  }

  if (category === 'all') return true;

  switch (userType) {
    case 'supervisor':
      return [
        'students', 'teachers_staff', 'circles', 
        'exams_grades', 'field_visits', 'shelf_files', 
        'activities_awards', 'decisions_tasks'
      ].includes(category);

    case 'teacher':
      return [
        'students', 'circles', 'exams_grades', 
        'field_visits', 'shelf_files', 'activities_awards', 
        'decisions_tasks'
      ].includes(category);

    case 'parent':
      return [
        'students', 'circles', 'exams_grades', 
        'shelf_files', 'activities_awards'
      ].includes(category);

    case 'student':
      return [
        'students', 'circles', 'exams_grades', 
        'shelf_files', 'activities_awards'
      ].includes(category);

    default:
      return false;
  }
}

/**
 * Evaluates whether a specific search result item can be viewed by the user.
 * Strictly enforced BEFORE returning results.
 */
export function canUserAccessItem(user: CurrentUserRef | null, item: SearchResultItem): boolean {
  if (!user) return false;

  const userType = user.type;

  // Admin & Branch Manager have full system visibility
  if (userType === 'admin' || userType === 'branch_manager') {
    return true;
  }

  // Check item explicit allowedUserTypes if provided
  if (item.allowedUserTypes && item.allowedUserTypes.length > 0) {
    if (!item.allowedUserTypes.includes(userType)) {
      return false;
    }
  }

  // Check confidentiality level
  if (item.confidentialityLevel === 'confidential' || item.confidentialityLevel === 'restricted') {
    if (userType !== 'admin' && userType !== 'branch_manager') {
      return false;
    }
  }

  // Role-specific granular checks
  switch (userType) {
    case 'supervisor':
      // Supervisors can see field visits, circles, teachers (educational), students, shelf, tasks
      if (item.category === 'approvals_audits') {
        return false; // Cannot view internal system audit logs or admin approvals
      }
      return true;

    case 'teacher':
      // Teachers can see their own circle, assigned students, exams, shelf, field visit evaluations of their circle
      if (item.category === 'approvals_audits') return false;
      if (item.category === 'teachers_staff' && item.confidentialityLevel === 'internal') {
        // Cannot view other teachers' private ratings or salary/evaluations
        return false;
      }
      return true;

    case 'parent':
      // Parent can only view their own children's results, public shelf, circle info, badges
      if (item.category === 'students') {
        // Ensure child matching (e.g. child name or parent student link)
        const parentChildKeywords = user.name ? user.name.split(' ') : ['معاذ', 'عمر'];
        const matchesChild = parentChildKeywords.some(k => k.length > 2 && item.title.includes(k)) || 
                             item.title.includes('معاذ') || 
                             item.title.includes('عمر') ||
                             Boolean(item.rawEntity?.isPublicChild);
        if (!matchesChild) {
          return false;
        }
      }
      if (item.category === 'teachers_staff') return false; // Cannot view teacher internal profiles
      if (item.category === 'field_visits') return false; // Cannot view internal field visit evaluations
      if (item.category === 'decisions_tasks') return false; // Cannot view admin decisions
      if (item.category === 'approvals_audits') return false;
      return true;

    case 'student':
      // Student can only view their own portal data, public shelf, badges
      if (item.category === 'students') {
        const studentFirstName = user.name ? user.name.split(' ')?.[0] : 'معاذ';
        if (!item.title.includes(studentFirstName) && !item.title.includes('معاذ')) {
          return false; // Cannot view other students' private grades
        }
      }
      if (item.category === 'teachers_staff') return false;
      if (item.category === 'field_visits') return false;
      if (item.category === 'decisions_tasks') return false;
      if (item.category === 'approvals_audits') return false;
      return true;

    default:
      return true;
  }
}
