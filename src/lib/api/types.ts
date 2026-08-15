export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ForumDto {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchDto {
  id: string;
  forumId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PermissionDto {
  id: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermissionItemDto {
  roleId: string;
  permissionId: string;
  permission: PermissionDto;
}

export interface RoleDto {
  id: string;
  forumId: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermissionItemDto[];
  _count?: {
    users: number;
  };
}

export interface UserRoleAssignmentDto {
  id: string;
  userId: string;
  roleId: string;
  branchId: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface UserDto {
  id: string;
  forumId: string;
  branchId: string | null;
  username: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
  roles: UserRoleAssignmentDto[];
  studentProfile?: { id: string } | null;
  parentProfile?: { id: string } | null;
  teacherProfile?: { id: string } | null;
  supervisorProfile?: { id: string } | null;
}

export interface StudentProfileDto {
  id: string;
  userId: string;
  studentNumber: string | null;
  dateOfBirth: string | null;
  enrollmentDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    branchId: string | null;
    isActive: boolean;
    branch?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  guardians?: Array<{
    id: string;
    relationship: 'FATHER' | 'MOTHER' | 'BROTHER' | 'UNCLE' | 'GUARDIAN' | 'OTHER';
    isPrimary: boolean;
    canReceiveNotifications: boolean;
    parent: {
      id: string;
      user: {
        id: string;
        displayName: string | null;
        username: string;
        phone?: string | null;
      };
    };
  }>;
  halaqaMemberships?: Array<{
    id: string;
    halaqaId: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'WITHDRAWN';
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    halaqa: {
      id: string;
      name: string;
      code: string;
      branchId: string;
    };
  }>;
}

export interface ParentProfileDto {
  id: string;
  userId: string;
  occupation: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    branchId: string | null;
    isActive: boolean;
  };
  students?: Array<{
    id: string;
    studentId: string;
    parentId: string;
    relationship: 'FATHER' | 'MOTHER' | 'BROTHER' | 'UNCLE' | 'GUARDIAN' | 'OTHER';
    isPrimary: boolean;
    canReceiveNotifications: boolean;
    student: {
      id: string;
      studentNumber: string | null;
      user: {
        id: string;
        displayName: string | null;
        username: string;
      };
    };
  }>;
}

export interface TeacherProfileDto {
  id: string;
  userId: string;
  employeeNumber: string | null;
  specialization: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    branchId: string | null;
    isActive: boolean;
    branch?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  assignments?: Array<{
    id: string;
    halaqaId: string;
    teacherId: string;
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    halaqa?: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface SupervisorProfileDto {
  id: string;
  userId: string;
  employeeNumber: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    branchId: string | null;
    isActive: boolean;
    branch?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  assignments?: Array<{
    id: string;
    halaqaId: string;
    supervisorId: string;
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    halaqa?: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface HalaqaDto {
  id: string;
  forumId: string;
  branchId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  members?: Array<{
    id: string;
    halaqaId: string;
    studentId: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'WITHDRAWN';
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    student: {
      id: string;
      studentNumber: string | null;
      user: {
        id: string;
        displayName: string | null;
        username: string;
      };
    };
  }>;
  teachers?: Array<{
    id: string;
    halaqaId: string;
    teacherId: string;
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    teacher: {
      id: string;
      employeeNumber: string | null;
      user: {
        id: string;
        displayName: string | null;
        username: string;
      };
    };
  }>;
  supervisors?: Array<{
    id: string;
    halaqaId: string;
    supervisorId: string;
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
    supervisor: {
      id: string;
      employeeNumber: string | null;
      user: {
        id: string;
        displayName: string | null;
        username: string;
      };
    };
  }>;
  _count?: {
    members: number;
    teachers: number;
    supervisors: number;
  };
}
