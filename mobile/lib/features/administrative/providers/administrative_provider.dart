import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/administrative_models.dart';
import '../services/administrative_service.dart';

final administrativeServiceProvider = Provider<AdministrativeService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdministrativeService(apiClient);
});

final myAdminRequestsProvider = FutureProvider<List<AdminRequestModel>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<AdminRequestModel>>('admin_requests');
  if (cached != null) return cached;

  final service = ref.watch(administrativeServiceProvider);
  final items = await service.getMyRequests();
  sessionCache.setFeature<List<AdminRequestModel>>('admin_requests', items);
  return items;
});

final myAdminTasksProvider = FutureProvider<List<AdminTaskModel>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<AdminTaskModel>>('admin_tasks');
  if (cached != null) return cached;

  final service = ref.watch(administrativeServiceProvider);
  final items = await service.getMyTasks();
  sessionCache.setFeature<List<AdminTaskModel>>('admin_tasks', items);
  return items;
});

final myAdminDecisionsProvider = FutureProvider<List<AdminDecisionModel>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<AdminDecisionModel>>('admin_decisions');
  if (cached != null) return cached;

  final service = ref.watch(administrativeServiceProvider);
  final items = await service.getDecisions();
  sessionCache.setFeature<List<AdminDecisionModel>>('admin_decisions', items);
  return items;
});
