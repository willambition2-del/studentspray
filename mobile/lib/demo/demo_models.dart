// Isolated Demo Models for UI/UX Preview & Design Review
// These models exist ONLY in mobile/lib/demo/ and are not part of production domain models.

class DemoPersona {
  final String id;
  final String title;
  final String subtitle;
  final String icon;
  final String route;

  const DemoPersona({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.route,
  });
}

class DemoTeacherData {
  final String name;
  final String roleTitle;
  final String centerName;
  final String halaqaName;
  final int totalStudents;
  final int presentToday;
  final String targetSurah;
  final int pendingTasks;
  final int unreadMessages;
  final int notificationsCount;
  final List<DemoStudentListItem> students;
  final List<DemoTask> tasks;

  const DemoTeacherData({
    required this.name,
    required this.roleTitle,
    required this.centerName,
    required this.halaqaName,
    required this.totalStudents,
    required this.presentToday,
    required this.targetSurah,
    required this.pendingTasks,
    required this.unreadMessages,
    required this.notificationsCount,
    required this.students,
    required this.tasks,
  });
}

class DemoSupervisorData {
  final String name;
  final String roleTitle;
  final String centerName;
  final int assignedHalaqasCount;
  final int assignedTeachersCount;
  final int visitsThisMonth;
  final int completedEvaluations;
  final int openRecommendations;
  final List<DemoHalaqaSummary> halaqas;
  final List<DemoTeacherSummary> teachers;
  final List<DemoVisitSummary> recentVisits;

  const DemoSupervisorData({
    required this.name,
    required this.roleTitle,
    required this.centerName,
    required this.assignedHalaqasCount,
    required this.assignedTeachersCount,
    required this.visitsThisMonth,
    required this.completedEvaluations,
    required this.openRecommendations,
    required this.halaqas,
    required this.teachers,
    required this.recentVisits,
  });
}

class DemoStudentData {
  final String name;
  final String roleTitle;
  final String halaqaName;
  final String teacherName;
  final String centerName;
  final int attendanceRate;
  final int planProgress;
  final String lastMemorization;
  final String lastRevision;
  final String lastEvaluationRating;
  final int lastExamScore;
  final int totalAwards;
  final List<DemoPlanItem> planItems;
  final List<DemoAttendanceItem> recentAttendance;
  final List<DemoExamItem> exams;
  final List<DemoAwardItem> awards;

  const DemoStudentData({
    required this.name,
    required this.roleTitle,
    required this.halaqaName,
    required this.teacherName,
    required this.centerName,
    required this.attendanceRate,
    required this.planProgress,
    required this.lastMemorization,
    required this.lastRevision,
    required this.lastEvaluationRating,
    required this.lastExamScore,
    required this.totalAwards,
    required this.planItems,
    required this.recentAttendance,
    required this.exams,
    required this.awards,
  });
}

class DemoChildData {
  final String id;
  final String name;
  final String ageGrade;
  final String halaqaName;
  final String teacherName;
  final int attendanceRate;
  final int planProgress;
  final String lastMemorization;
  final String lastRevision;
  final String lastEvaluationRating;
  final int lastExamScore;
  final int awardsCount;
  final List<DemoPlanItem> planItems;
  final List<DemoAttendanceItem> recentAttendance;
  final List<DemoExamItem> exams;
  final List<DemoAwardItem> awards;

  const DemoChildData({
    required this.id,
    required this.name,
    required this.ageGrade,
    required this.halaqaName,
    required this.teacherName,
    required this.attendanceRate,
    required this.planProgress,
    required this.lastMemorization,
    required this.lastRevision,
    required this.lastEvaluationRating,
    required this.lastExamScore,
    required this.awardsCount,
    required this.planItems,
    required this.recentAttendance,
    required this.exams,
    required this.awards,
  });
}

class DemoParentData {
  final String guardianName;
  final String roleTitle;
  final List<DemoChildData> children;

  const DemoParentData({
    required this.guardianName,
    required this.roleTitle,
    required this.children,
  });
}

class DemoStudentListItem {
  final String id;
  final String name;
  final String currentSurah;
  final String attendanceStatus; // 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'
  final int score;
  final String evaluationRating;

  const DemoStudentListItem({
    required this.id,
    required this.name,
    required this.currentSurah,
    required this.attendanceStatus,
    required this.score,
    required this.evaluationRating,
  });
}

class DemoTask {
  final String id;
  final String title;
  final String deadline;
  final String priority; // 'HIGH', 'NORMAL', 'URGENT'
  final bool isCompleted;

  const DemoTask({
    required this.id,
    required this.title,
    required this.deadline,
    required this.priority,
    required this.isCompleted,
  });
}

class DemoHalaqaSummary {
  final String id;
  final String name;
  final String teacherName;
  final int studentsCount;
  final String time;

  const DemoHalaqaSummary({
    required this.id,
    required this.name,
    required this.teacherName,
    required this.studentsCount,
    required this.time,
  });
}

class DemoTeacherSummary {
  final String id;
  final String name;
  final String phone;
  final String halaqaName;
  final int performanceRating;

  const DemoTeacherSummary({
    required this.id,
    required this.name,
    required this.phone,
    required this.halaqaName,
    required this.performanceRating,
  });
}

class DemoVisitSummary {
  final String id;
  final String halaqaName;
  final String teacherName;
  final String date;
  final int scorePercentage;
  final String status;

  const DemoVisitSummary({
    required this.id,
    required this.halaqaName,
    required this.teacherName,
    required this.date,
    required this.scorePercentage,
    required this.status,
  });
}

class DemoPlanItem {
  final String surah;
  final String verses;
  final String type; // 'HIFZ', 'MURAJAAH'
  final bool isDone;
  final int targetPages;

  const DemoPlanItem({
    required this.surah,
    required this.verses,
    required this.type,
    required this.isDone,
    required this.targetPages,
  });
}

class DemoAttendanceItem {
  final String date;
  final String dayName;
  final String status; // 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'

  const DemoAttendanceItem({
    required this.date,
    required this.dayName,
    required this.status,
  });
}

class DemoExamItem {
  final String title;
  final String date;
  final String scope;
  final int maxScore;
  final int? score;
  final String status; // 'PUBLISHED', 'UPCOMING'

  const DemoExamItem({
    required this.title,
    required this.date,
    required this.scope,
    required this.maxScore,
    this.score,
    required this.status,
  });
}

class DemoAwardItem {
  final String title;
  final String reason;
  final String date;
  final String icon;

  const DemoAwardItem({
    required this.title,
    required this.reason,
    required this.date,
    required this.icon,
  });
}
