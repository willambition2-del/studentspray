class ForumRef {
  final String id;
  final String name;
  final String slug;

  const ForumRef({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory ForumRef.fromJson(Map<String, dynamic> json) {
    return ForumRef(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
    );
  }
}

class BranchRef {
  final String id;
  final String name;
  final String code;

  const BranchRef({
    required this.id,
    required this.name,
    required this.code,
  });

  factory BranchRef.fromJson(Map<String, dynamic> json) {
    return BranchRef(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
    );
  }
}

class RoleRef {
  final String id;
  final String name;
  final String displayName;

  const RoleRef({
    required this.id,
    required this.name,
    required this.displayName,
  });

  factory RoleRef.fromJson(Map<String, dynamic> json) {
    return RoleRef(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      displayName: json['displayName'] as String? ?? (json['name'] as String? ?? ''),
    );
  }
}

class UserProfile {
  final String id;
  final String username;
  final String displayName;
  final String? email;
  final String? phone;
  final bool mustChangePassword;
  final ForumRef? forum;
  final BranchRef? branch;
  final List<RoleRef> roles;
  final List<String> permissions;

  const UserProfile({
    required this.id,
    required this.username,
    required this.displayName,
    this.email,
    this.phone,
    this.mustChangePassword = false,
    this.forum,
    this.branch,
    this.roles = const [],
    this.permissions = const [],
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final rolesList = <RoleRef>[];
    if (json['roles'] is List) {
      for (final r in json['roles']) {
        if (r is Map<String, dynamic>) {
          rolesList.add(RoleRef.fromJson(r));
        } else if (r is String) {
          rolesList.add(RoleRef(id: r, name: r, displayName: r));
        }
      }
    }

    final permissionsList = <String>[];
    if (json['permissions'] is List) {
      for (final p in json['permissions']) {
        if (p is String) {
          permissionsList.add(p);
        } else if (p is Map && p['code'] is String) {
          permissionsList.add(p['code'] as String);
        }
      }
    }

    return UserProfile(
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      mustChangePassword: json['mustChangePassword'] as bool? ?? false,
      forum: json['forum'] is Map<String, dynamic>
          ? ForumRef.fromJson(json['forum'] as Map<String, dynamic>)
          : null,
      branch: json['branch'] is Map<String, dynamic>
          ? BranchRef.fromJson(json['branch'] as Map<String, dynamic>)
          : null,
      roles: rolesList,
      permissions: permissionsList,
    );
  }

  bool get isTeacher => roles.any((r) => r.name.toUpperCase() == 'TEACHER');
  bool get isTechnicalSupervisor =>
      roles.any((r) => r.name.toUpperCase() == 'TECHNICAL_SUPERVISOR');
  bool get isStudent => roles.any((r) => r.name.toUpperCase() == 'STUDENT');
  bool get isParent => roles.any((r) => r.name.toUpperCase() == 'PARENT');
  bool get isGeneralManager =>
      roles.any((r) => r.name.toUpperCase() == 'GENERAL_MANAGER');
  bool get isExecutiveManager =>
      roles.any((r) => r.name.toUpperCase() == 'EXECUTIVE_MANAGER');

  String get primaryRoleTitle {
    if (roles.isNotEmpty) {
      return roles.first.displayName;
    }
    return 'مستخدم';
  }
}
