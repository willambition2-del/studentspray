import '../../../core/network/api_client.dart';
import '../models/administrative_models.dart';

class AdministrativeService {
  final ApiClient _apiClient;

  AdministrativeService(this._apiClient);

  // Requests
  Future<List<AdminRequestModel>> getMyRequests() async {
    final res = await _apiClient.get('/admin-requests/my');
    final data = res.data;
    final list = (data is Map && data['items'] is List)
        ? data['items'] as List
        : (data is List ? data : []);
    return list.map((json) => AdminRequestModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<AdminRequestModel> createRequest({
    required String title,
    required String description,
    required String type,
    String priority = 'NORMAL',
    bool submitNow = true,
  }) async {
    final res = await _apiClient.post('/admin-requests', data: {
      'title': title,
      'description': description,
      'type': type,
      'priority': priority,
      'submitNow': submitNow,
    });
    return AdminRequestModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> cancelRequest(String id) async {
    await _apiClient.post('/admin-requests/$id/cancel');
  }

  // Tasks
  Future<List<AdminTaskModel>> getMyTasks() async {
    final res = await _apiClient.get('/admin-tasks/my');
    final data = res.data;
    final list = (data is Map && data['items'] is List)
        ? data['items'] as List
        : (data is List ? data : []);
    return list.map((json) => AdminTaskModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<void> addTaskFollowUp(String taskId, {required String note, String? status}) async {
    await _apiClient.post('/admin-tasks/$taskId/follow-ups', data: {
      'note': note,
      if (status != null) 'status': status,
    });
  }

  // Decisions
  Future<List<AdminDecisionModel>> getDecisions() async {
    final res = await _apiClient.get('/admin-decisions');
    final data = res.data;
    final list = (data is Map && data['items'] is List)
        ? data['items'] as List
        : (data is List ? data : []);
    return list.map((json) => AdminDecisionModel.fromJson(json as Map<String, dynamic>)).toList();
  }
}
