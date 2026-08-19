import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationService(apiClient: apiClient);
});

final unreadNotificationsCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  return service.getUnreadCount();
});

class NotificationFilter {
  final bool unreadOnly;
  final String? type;

  const NotificationFilter({this.unreadOnly = false, this.type});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationFilter &&
          runtimeType == other.runtimeType &&
          unreadOnly == other.unreadOnly &&
          type == other.type;

  @override
  int get hashCode => unreadOnly.hashCode ^ type.hashCode;
}

final notificationsListProvider =
    FutureProvider.family.autoDispose<List<AppNotification>, NotificationFilter>((ref, filter) async {
  final service = ref.watch(notificationServiceProvider);
  return service.getNotifications(
    unreadOnly: filter.unreadOnly,
    type: filter.type,
  );
});
