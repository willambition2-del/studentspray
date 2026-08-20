import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/core/utils/api_parsing.dart';
import 'package:quran_forum/features/teacher/models/teacher_models.dart';
import 'package:quran_forum/features/activities_shelf/models/activity_models.dart';
import 'package:quran_forum/features/student/models/student_models.dart';
import 'package:quran_forum/features/parent/models/parent_models.dart';
import 'package:quran_forum/features/supervisor/models/supervisor_models.dart';

void main() {
  group('ApiParsing Helper Unit Tests', () {
    test('parseInt handles num, string numeric, and nulls', () {
      expect(ApiParsing.parseInt(42), 42);
      expect(ApiParsing.parseInt('42'), 42);
      expect(ApiParsing.parseInt(' 42 '), 42);
      expect(ApiParsing.parseInt(42.8), 42);
      expect(ApiParsing.parseInt('42.8'), 42);
      expect(ApiParsing.parseInt(null, 10), 10);
      expect(ApiParsing.parseInt('invalid', 5), 5);
    });

    test('parseDouble handles num, string numeric, and nulls', () {
      expect(ApiParsing.parseDouble(42), 42.0);
      expect(ApiParsing.parseDouble(42.5), 42.5);
      expect(ApiParsing.parseDouble('60'), 60.0);
      expect(ApiParsing.parseDouble(' 60.5 '), 60.5);
      expect(ApiParsing.parseDouble(null, 100.0), 100.0);
      expect(ApiParsing.parseDouble('invalid', 0.0), 0.0);
    });

    test('extractList handles direct list, Map with items/data/plans, and nulls', () {
      expect(ApiParsing.extractList([1, 2, 3]), [1, 2, 3]);
      expect(ApiParsing.extractList({'items': ['a', 'b']}), ['a', 'b']);
      expect(ApiParsing.extractList({'data': [10, 20]}), [10, 20]);
      expect(ApiParsing.extractList({'plans': ['p1']}), ['p1']);
      expect(ApiParsing.extractList(null), isEmpty);
      expect(ApiParsing.extractList({}), isEmpty);
    });
  });

  group('ERROR 1: Exam & Criterion String Score Parsing Tests', () {
    test('TeacherExamItem parses criteria with String maxScore ("60") correctly', () {
      final json = {
        'id': 'exam-1',
        'title': 'اختبار الحفظ الشهري الأول',
        'maxScore': 100,
        'passScore': 60,
        'criteria': [
          {
            'id': 'crit-1',
            'name': 'جودة الحفظ وسلامة الأداء',
            'maxScore': '60', // Prisma Decimal returned as String!
            'order': 1,
          },
          {
            'id': 'crit-2',
            'name': 'أحكام التجويد ومخارج الحروف',
            'maxScore': '40', // Prisma Decimal returned as String!
            'order': 2,
          }
        ]
      };

      final exam = TeacherExamItem.fromJson(json);
      expect(exam.id, 'exam-1');
      expect(exam.maxScore, 100.0);
      expect(exam.passScore, 60.0);
      expect(exam.criteria.length, 2);
      expect(exam.criteria[0].maxScore, 60.0);
      expect(exam.criteria[1].maxScore, 40.0);
    });

    test('TeacherExamResultItem parses score and percentage from string or num', () {
      final json = {
        'id': 'res-1',
        'examId': 'exam-1',
        'studentId': 'stu-1',
        'studentName': 'الطالب أحمد',
        'score': '98.5',
        'percentage': '98.5',
      };

      final res = TeacherExamResultItem.fromJson(json);
      expect(res.score, 98.5);
      expect(res.percentage, 98.5);
    });
  });

  group('ERROR 2: Educational Plans Paginated Object Parsing Tests', () {
    test('TeacherEducationalPlan parses items when API returns paginated wrapper', () {
      final apiResponse = {
        'items': [
          {
            'id': 'plan-1',
            'name': 'خطة حفظ جزء عم',
            'type': 'HIFZ',
            'status': 'ACTIVE',
            'items': [
              {
                'id': 'item-1',
                'type': 'MEMORIZATION',
                'surahNumber': '114',
                'fromAyah': '1',
                'toAyah': '6',
                'order': 1,
              }
            ]
          }
        ],
        'meta': {
          'page': 1,
          'limit': 20,
          'total': 1,
          'totalPages': 1
        }
      };

      final plans = ApiParsing.parseList(apiResponse, TeacherEducationalPlan.fromJson);
      expect(plans.length, 1);
      expect(plans.first.name, 'خطة حفظ جزء عم');
      expect(plans.first.items.length, 1);
      expect(plans.first.items.first.surahNumber, 114);
      expect(plans.first.items.first.fromAyah, 1);
      expect(plans.first.items.first.toAyah, 6);
    });

    test('TeacherEducationalPlan parses empty list cleanly', () {
      final emptyResponse = {
        'items': [],
        'meta': {'page': 1, 'limit': 20, 'total': 0, 'totalPages': 0}
      };
      final plans = ApiParsing.parseList(emptyResponse, TeacherEducationalPlan.fromJson);
      expect(plans, isEmpty);
    });
  });

  group('ERROR 3: Activities & Competitions Model & Pagination Tests', () {
    test('ActivityItem parses cleanly from paginated response', () {
      final apiResponse = {
        'items': [
          {
            'id': 'act-1',
            'title': 'رحلة مجمع النور',
            'type': 'TRIP',
            'status': 'PUBLISHED',
            'startsAt': '2026-08-25T10:00:00.000Z',
            'capacity': '30',
          }
        ],
        'meta': {'page': 1, 'limit': 20, 'total': 1}
      };

      final list = ApiParsing.parseList(apiResponse, ActivityItem.fromJson);
      expect(list.length, 1);
      expect(list.first.title, 'رحلة مجمع النور');
      expect(list.first.capacity, 30);
      expect(list.first.typeLabel, 'رحلة');
    });

    test('CompetitionItem parses decimal maxScore and rank string cleanly', () {
      final apiResponse = {
        'items': [
          {
            'id': 'comp-1',
            'title': 'مسابقة مزامير داوود',
            'category': 'RECITATION',
            'maxScore': '100',
            'myResult': {
              'score': '95.5',
              'rank': '1',
              'notes': 'تلاوة خاشعة ومتميزة'
            }
          }
        ]
      };

      final list = ApiParsing.parseList(apiResponse, CompetitionItem.fromJson);
      expect(list.length, 1);
      expect(list.first.maxScore, 100.0);
      expect(list.first.myScore, 95.5);
      expect(list.first.myRank, 1);
      expect(list.first.categoryLabel, 'حسن التلاوة والصوت');
    });
  });

  group('Cross-Role Immunity Verification', () {
    test('Student models parse cleanly with mixed string/num types', () {
      final json = {
        'student': {'id': 'stu-1', 'name': 'علي'},
        'attendance': {
          'totalSessions': '20',
          'presentCount': '18',
          'absentCount': '2',
          'attendanceRate': '90.0'
        },
        'upcomingExams': [
          {
            'id': 'ex-1',
            'title': 'اختبار البقرة',
            'maxScore': '100',
            'passScore': '60'
          }
        ]
      };

      final dash = StudentDashboardModel.fromJson(json);
      expect(dash.student.name, 'علي');
      expect(dash.attendance.totalSessions, 20);
      expect(dash.attendance.attendanceRate, 90.0);
      expect(dash.upcomingExams.first.maxScore, 100.0);
      expect(dash.upcomingExams.first.passScore, 60.0);
    });

    test('Supervisor models parse cleanly with decimal scores', () {
      final json = {
        'totalHalaqas': '12',
        'totalTeachers': '8',
        'averageEvaluationScore': '94.6'
      };

      final metrics = SupervisorDashboardMetrics.fromJson(json);
      expect(metrics.totalHalaqas, 12);
      expect(metrics.totalTeachers, 8);
      expect(metrics.averageEvaluationScore, 94.6);
    });

    test('Parent models parse cleanly with mixed string/num types', () {
      final json = {
        'id': 'child-1',
        'name': 'عبدالرحمن',
        'relationship': 'ابن',
        'isPrimary': 'true',
        'attendanceRate': '95.5',
        'lastExamScore': '88.0',
        'lastExamTitle': 'اختبار التجويد',
        'latestRating': 'EXCELLENT',
      };

      final child = ParentChildSummary.fromJson(json);
      expect(child.id, 'child-1');
      expect(child.name, 'عبدالرحمن');
      expect(child.isPrimary, true);
      expect(child.attendanceRate, 95.5);
      expect(child.lastExamScore, 88.0);
    });
  });
}
