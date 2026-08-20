import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/activity_models.dart';
import '../services/activities_shelf_service.dart';

final activitiesShelfServiceProvider = Provider<ActivitiesShelfService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ActivitiesShelfService(apiClient);
});

// General / Teacher Providers
final generalActivitiesProvider = FutureProvider<List<ActivityItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<ActivityItem>>('general_activities');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getActivities();
  sessionCache.setFeature<List<ActivityItem>>('general_activities', items);
  return items;
});

final generalCompetitionsProvider = FutureProvider<List<CompetitionItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<CompetitionItem>>('general_competitions');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getCompetitions();
  sessionCache.setFeature<List<CompetitionItem>>('general_competitions', items);
  return items;
});

final generalAwardsProvider = FutureProvider<List<AwardItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<AwardItem>>('general_awards');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getAwards();
  sessionCache.setFeature<List<AwardItem>>('general_awards', items);
  return items;
});

// Student Providers
final studentActivitiesProvider = FutureProvider<List<ActivityItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<ActivityItem>>('student_activities');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getStudentActivities();
  sessionCache.setFeature<List<ActivityItem>>('student_activities', items);
  return items;
});

final studentCompetitionsProvider = FutureProvider<List<CompetitionItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<CompetitionItem>>('student_competitions');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getStudentCompetitions();
  sessionCache.setFeature<List<CompetitionItem>>('student_competitions', items);
  return items;
});

final studentAwardsProvider = FutureProvider<List<AwardItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<AwardItem>>('student_awards');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getStudentAwards();
  sessionCache.setFeature<List<AwardItem>>('student_awards', items);
  return items;
});

// Parent Providers
final parentChildActivitiesProvider = FutureProvider.family<List<ActivityItem>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_activities_$studentId';
  final cached = sessionCache.getFeature<List<ActivityItem>>(cacheKey);
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getChildActivities(studentId);
  sessionCache.setFeature<List<ActivityItem>>(cacheKey, items);
  return items;
});

final parentChildCompetitionsProvider = FutureProvider.family<List<CompetitionItem>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_competitions_$studentId';
  final cached = sessionCache.getFeature<List<CompetitionItem>>(cacheKey);
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getChildCompetitions(studentId);
  sessionCache.setFeature<List<CompetitionItem>>(cacheKey, items);
  return items;
});

final parentChildAwardsProvider = FutureProvider.family<List<AwardItem>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_awards_$studentId';
  final cached = sessionCache.getFeature<List<AwardItem>>(cacheKey);
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getChildAwards(studentId);
  sessionCache.setFeature<List<AwardItem>>(cacheKey, items);
  return items;
});

// General Shelf Providers
final shelfSectionsProvider = FutureProvider<List<ShelfSectionItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<ShelfSectionItem>>('shelf_sections');
  if (cached != null) return cached;

  final service = ref.watch(activitiesShelfServiceProvider);
  final items = await service.getShelfSections();
  sessionCache.setFeature<List<ShelfSectionItem>>('shelf_sections', items);
  return items;
});

final selectedShelfSectionIdProvider = StateProvider.autoDispose<String?>((ref) => null);

final shelfItemsProvider = FutureProvider<List<ShelfPostItem>>((ref) async {
  final service = ref.watch(activitiesShelfServiceProvider);
  final sectionId = ref.watch(selectedShelfSectionIdProvider);
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'shelf_items_${sectionId ?? "all"}';
  final cached = sessionCache.getFeature<List<ShelfPostItem>>(cacheKey);
  if (cached != null) return cached;

  final items = await service.getShelfItems(sectionId: sectionId);
  sessionCache.setFeature<List<ShelfPostItem>>(cacheKey, items);
  return items;
});
