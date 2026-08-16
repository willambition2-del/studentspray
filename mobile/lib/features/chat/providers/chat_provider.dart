import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/chat_model.dart';
import '../services/chat_service.dart';

final chatServiceProvider = Provider<ChatService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final service = ChatService(apiClient: apiClient, tokenStorage: tokenStorage);

  // Connect socket if authenticated
  final authState = ref.watch(authProvider);
  if (authState.isAuthenticated) {
    service.connect();
  }

  ref.onDispose(() => service.dispose());
  return service;
});

final chatConversationsProvider =
    FutureProvider.autoDispose<List<ChatConversation>>((ref) async {
  final service = ref.watch(chatServiceProvider);
  return service.getConversations();
});

final chatMessagesProvider =
    FutureProvider.family.autoDispose<List<ChatMessage>, String>((ref, conversationId) async {
  final service = ref.watch(chatServiceProvider);
  return service.getMessages(conversationId);
});

final chatTotalUnreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final service = ref.watch(chatServiceProvider);
  return service.getTotalUnreadCount();
});
