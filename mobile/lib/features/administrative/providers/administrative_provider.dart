import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/administrative_models.dart';
import '../services/administrative_service.dart';

final administrativeServiceProvider = Provider<AdministrativeService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdministrativeService(apiClient);
});

final myAdminRequestsProvider = FutureProvider<List<AdminRequestModel>>((ref) async {
  final service = ref.watch(administrativeServiceProvider);
  return service.getMyRequests();
});

final myAdminTasksProvider = FutureProvider<List<AdminTaskModel>>((ref) async {
  final service = ref.watch(administrativeServiceProvider);
  return service.getMyTasks();
});

final myAdminDecisionsProvider = FutureProvider<List<AdminDecisionModel>>((ref) async {
  final service = ref.watch(administrativeServiceProvider);
  return service.getDecisions();
});
