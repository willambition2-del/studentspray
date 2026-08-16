import '../../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiClient apiClient;

  NotificationService({required this.apiClient});

  Future<List<AppNotification>> getNotifications({
    int page = 1,
    int limit = 20,
    String? type,
    bool unreadOnly = false,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (type != null) query['type'] = type;
    if (unreadOnly) query['unreadOnly'] = 'true';

    final response = await apiClient.get(
      '/notifications',
      queryParameters: query,
    );

    final dynamic data = response.data;
    if (data is Map<String, dynamic> && data['items'] is List) {
      return (data['items'] as List)
          .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await apiClient.get('/notifications/unread-count');
      final dynamic data = response.data;
      if (data is Map<String, dynamic> && data['unreadCount'] is num) {
        return (data['unreadCount'] as num).toInt();
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> markAsRead(String id) async {
    await apiClient.post('/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await apiClient.post('/notifications/read-all');
  }

  Future<void> registerDeviceToken({
    required String token,
    String platform = 'ANDROID',
    String? deviceId,
    String? appVersion,
  }) async {
    try {
      await apiClient.post(
        '/notifications/devices',
        data: {
          'token': token,
          'platform': platform,
          'deviceId': deviceId,
          'appVersion': appVersion,
        },
      );
    } catch (_) {
      // Non-blocking device token registration
    }
  }
}
