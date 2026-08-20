import '../../../core/network/api_client.dart';
import '../../../core/utils/api_parsing.dart';
import '../models/activity_models.dart';

class ActivitiesShelfService {
  final ApiClient _apiClient;

  ActivitiesShelfService(this._apiClient);

  // General / Teacher / Supervisor Endpoints
  Future<List<ActivityItem>> getActivities({String? search, String? status, String? type}) async {
    final query = <String, dynamic>{};
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (type != null && type.isNotEmpty) query['type'] = type;

    final res = await _apiClient.get('/activities', queryParameters: query);
    return ApiParsing.parseList(res.data, ActivityItem.fromJson);
  }

  Future<List<CompetitionItem>> getCompetitions({String? search, String? status}) async {
    final query = <String, dynamic>{};
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (status != null && status.isNotEmpty) query['status'] = status;

    final res = await _apiClient.get('/competitions', queryParameters: query);
    return ApiParsing.parseList(res.data, CompetitionItem.fromJson);
  }

  Future<List<AwardItem>> getAwards({String? search, String? type}) async {
    final query = <String, dynamic>{};
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (type != null && type.isNotEmpty) query['type'] = type;

    final res = await _apiClient.get('/awards', queryParameters: query);
    return ApiParsing.parseList(res.data, AwardItem.fromJson);
  }

  // Student Endpoints
  Future<List<ActivityItem>> getStudentActivities() async {
    try {
      final res = await _apiClient.get('/student/me/activities');
      return ApiParsing.parseList(res.data, ActivityItem.fromJson);
    } catch (_) {
      return getActivities();
    }
  }

  Future<List<CompetitionItem>> getStudentCompetitions() async {
    try {
      final res = await _apiClient.get('/student/me/competitions');
      return ApiParsing.parseList(res.data, CompetitionItem.fromJson);
    } catch (_) {
      return getCompetitions();
    }
  }

  Future<List<AwardItem>> getStudentAwards() async {
    try {
      final res = await _apiClient.get('/student/me/awards');
      return ApiParsing.parseList(res.data, AwardItem.fromJson);
    } catch (_) {
      return getAwards();
    }
  }

  // Parent Endpoints
  Future<List<ActivityItem>> getChildActivities(String studentId) async {
    try {
      final res = await _apiClient.get('/parent/me/children/$studentId/activities');
      return ApiParsing.parseList(res.data, ActivityItem.fromJson);
    } catch (_) {
      return [];
    }
  }

  Future<List<CompetitionItem>> getChildCompetitions(String studentId) async {
    try {
      final res = await _apiClient.get('/parent/me/children/$studentId/competitions');
      return ApiParsing.parseList(res.data, CompetitionItem.fromJson);
    } catch (_) {
      return [];
    }
  }

  Future<List<AwardItem>> getChildAwards(String studentId) async {
    try {
      final res = await _apiClient.get('/parent/me/children/$studentId/awards');
      return ApiParsing.parseList(res.data, AwardItem.fromJson);
    } catch (_) {
      return [];
    }
  }

  // General Shelf Endpoints
  Future<List<ShelfSectionItem>> getShelfSections() async {
    final res = await _apiClient.get('/shelf/sections');
    return ApiParsing.parseList(res.data, ShelfSectionItem.fromJson);
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
    return ApiParsing.parseList(res.data, ShelfPostItem.fromJson);
  }
}
