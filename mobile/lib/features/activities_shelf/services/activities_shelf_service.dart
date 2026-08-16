import '../../../core/network/api_client.dart';
import '../models/activity_models.dart';

class ActivitiesShelfService {
  final ApiClient _apiClient;

  ActivitiesShelfService(this._apiClient);

  // Student Endpoints
  Future<List<ActivityItem>> getStudentActivities() async {
    final res = await _apiClient.get('/student/me/activities');
    final list = res.data as List? ?? [];
    return list.map((json) => ActivityItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<CompetitionItem>> getStudentCompetitions() async {
    final res = await _apiClient.get('/student/me/competitions');
    final list = res.data as List? ?? [];
    return list.map((json) => CompetitionItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<AwardItem>> getStudentAwards() async {
    final res = await _apiClient.get('/student/me/awards');
    final list = res.data as List? ?? [];
    return list.map((json) => AwardItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Parent Endpoints
  Future<List<ActivityItem>> getChildActivities(String studentId) async {
    final res = await _apiClient.get('/parent/me/children/$studentId/activities');
    final list = res.data as List? ?? [];
    return list.map((json) => ActivityItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<CompetitionItem>> getChildCompetitions(String studentId) async {
    final res = await _apiClient.get('/parent/me/children/$studentId/competitions');
    final list = res.data as List? ?? [];
    return list.map((json) => CompetitionItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<AwardItem>> getChildAwards(String studentId) async {
    final res = await _apiClient.get('/parent/me/children/$studentId/awards');
    final list = res.data as List? ?? [];
    return list.map((json) => AwardItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  // General Shelf Endpoints
  Future<List<ShelfSectionItem>> getShelfSections() async {
    final res = await _apiClient.get('/shelf/sections');
    final list = res.data as List? ?? [];
    return list.map((json) => ShelfSectionItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<ShelfPostItem>> getShelfItems({String? sectionId, String? search}) async {
    final queryParams = <String, dynamic>{};
    if (sectionId != null && sectionId.isNotEmpty) {
      queryParams['sectionId'] = sectionId;
    }
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }

    final res = await _apiClient.get('/shelf/items', queryParameters: queryParams);
    final data = res.data;
    final list = data is Map ? (data['items'] as List? ?? []) : (data as List? ?? []);
    return list.map((json) => ShelfPostItem.fromJson(json as Map<String, dynamic>)).toList();
  }
}
