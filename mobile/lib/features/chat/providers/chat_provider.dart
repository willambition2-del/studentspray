import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/chat_model.dart';
import '../services/chat_service.dart';

final chatTotalUnreadCountStateProvider = StateProvider<int>((ref) => 0);

final Provider<ChatService> chatServiceProvider = Provider<ChatService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final service = ChatService(apiClient: apiClient, tokenStorage: tokenStorage);

  // Connect socket if authenticated and patch unread count in-memory (0 HTTP calls)
  final authState = ref.watch(authProvider);
  if (authState.isAuthenticated) {
    service.connect();
    // Load initial unread count once per session
    service.getTotalUnreadCount().then((count) {
      ref.read(chatTotalUnreadCountStateProvider.notifier).state = count;
    }).catchError((_) {});

    final msgSub = service.onMessage.listen((_) {
      ref.read(chatTotalUnreadCountStateProvider.notifier).update((count) => count + 1);
    });
    final readSub = service.onRead.listen((_) {
      ref.read(chatTotalUnreadCountStateProvider.notifier).update((count) => count > 0 ? count - 1 : 0);
    });
    ref.onDispose(() {
      msgSub.cancel();
      readSub.cancel();
    });
  } else {
    service.disconnect();
  }

  ref.onDispose(() => service.dispose());
  return service;
});

final FutureProvider<List<ChatConversation>> chatConversationsProvider =
    FutureProvider<List<ChatConversation>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<ChatConversation>>('chat_conversations');
  if (cached != null) return cached;

  final service = ref.watch(chatServiceProvider);
  final items = await service.getConversations();
  sessionCache.setFeature<List<ChatConversation>>('chat_conversations', items);
  return items;
});

final AutoDisposeFutureProviderFamily<List<ChatMessage>, String> chatMessagesProvider =
    FutureProvider.family.autoDispose<List<ChatMessage>, String>((ref, conversationId) async {
  final service = ref.watch(chatServiceProvider);
  return service.getMessages(conversationId);
});

final Provider<AsyncValue<int>> chatTotalUnreadCountProvider = Provider<AsyncValue<int>>((ref) {
  final count = ref.watch(chatTotalUnreadCountStateProvider);
  return AsyncValue.data(count);
});
