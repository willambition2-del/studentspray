import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/activity_models.dart';
import '../services/activities_shelf_service.dart';

final activitiesShelfServiceProvider = Provider<ActivitiesShelfService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ActivitiesShelfService(apiClient);
});

// Student Providers
final studentActivitiesProvider = FutureProvider.autoDispose<List<ActivityItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getStudentActivities();
});

final studentCompetitionsProvider = FutureProvider.autoDispose<List<CompetitionItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getStudentCompetitions();
});

final studentAwardsProvider = FutureProvider.autoDispose<List<AwardItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getStudentAwards();
});

// Parent Providers
final parentChildActivitiesProvider = FutureProvider.family.autoDispose<List<ActivityItem>, String>((ref, studentId) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getChildActivities(studentId);
});

final parentChildCompetitionsProvider = FutureProvider.family.autoDispose<List<CompetitionItem>, String>((ref, studentId) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getChildCompetitions(studentId);
});

final parentChildAwardsProvider = FutureProvider.family.autoDispose<List<AwardItem>, String>((ref, studentId) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getChildAwards(studentId);
});

// General Shelf Providers
final shelfSectionsProvider = FutureProvider.autoDispose<List<ShelfSectionItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  return service.getShelfSections();
});

final selectedShelfSectionIdProvider = StateProvider.autoDispose<String?>((ref) => null);

final shelfItemsProvider = FutureProvider.autoDispose<List<ShelfPostItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  final sectionId = ref.watch(selectedShelfSectionIdProvider);
  return service.getShelfItems(sectionId: sectionId);
});
