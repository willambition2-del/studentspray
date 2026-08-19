import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/chat_model.dart';

class ChatService {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;

  io.Socket? _socket;
  final _messageController = StreamController<ChatMessage>.broadcast();
  final _readController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStateController = StreamController<bool>.broadcast();

  bool _isConnected = false;

  ChatService({
    required this.apiClient,
    required this.tokenStorage,
  });

  Stream<ChatMessage> get onMessage => _messageController.stream;
  Stream<Map<String, dynamic>> get onRead => _readController.stream;
  Stream<bool> get onConnectionChanged => _connectionStateController.stream;
  bool get isConnected => _isConnected;

  String get _socketBaseUrl {
    final base = Env.apiBaseUrl;
    final uri = Uri.parse(base);
    final portPart = uri.hasPort ? ':${uri.port}' : '';
    return '${uri.scheme}://${uri.host}$portPart';
  }

  Future<void> connect() async {
    final token = tokenStorage.getAccessToken();
    if (token == null) return;

    disconnect(); // Clean up any previous socket instance

    try {
      final socketUrl = '$_socketBaseUrl/chat';
      _socket = io.io(
        socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setAuth({'token': 'Bearer $token'})
            .setExtraHeaders({'authorization': 'Bearer $token'})
            .enableReconnection()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(2000)
            .build(),
      );

      _socket!.onConnect((_) {
        debugPrint('[Socket.IO] Connected to /chat');
        _isConnected = true;
        _connectionStateController.add(true);
      });

      _socket!.onDisconnect((_) {
        debugPrint('[Socket.IO] Disconnected from /chat');
        _isConnected = false;
        _connectionStateController.add(false);
      });

      _socket!.onConnectError((err) {
        debugPrint('[Socket.IO] Connect error: $err');
        _isConnected = false;
        _connectionStateController.add(false);
      });

      _socket!.on('chat:message', (data) {
        if (data is Map<String, dynamic>) {
          try {
            final msg = ChatMessage.fromJson(data);
            _messageController.add(msg);
          } catch (e) {
            debugPrint('[Socket.IO] Error parsing chat:message: $e');
          }
        }
      });

      _socket!.on('chat:read', (data) {
        if (data is Map<String, dynamic>) {
          _readController.add(data);
        }
      });

      _socket!.connect();
    } catch (e) {
      debugPrint('[Socket.IO] Socket init exception: $e');
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.off('chat:message');
      _socket!.off('chat:read');
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
    _connectionStateController.add(false);
  }

  void joinConversation(String conversationId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join_conversation', {'conversationId': conversationId});
    }
  }

  void leaveConversation(String conversationId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('leave_conversation', {'conversationId': conversationId});
    }
  }

  Future<void> sendSocketMessage(
    String conversationId,
    String text, {
    String? clientMessageId,
  }) async {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('send_message', {
        'conversationId': conversationId,
        'text': text,
        'clientMessageId': clientMessageId,
      });
    } else {
      // REST fallback if socket is reconnecting
      await sendRestMessage(conversationId, text, clientMessageId: clientMessageId);
    }
  }

  void markSocketRead(String conversationId, {String? messageId}) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('mark_read', {
        'conversationId': conversationId,
        'messageId': messageId,
      });
    }
    // Also trigger REST endpoint for durability
    markRestRead(conversationId, messageId: messageId).catchError((_) {});
  }

  // REST API Methods
  Future<List<ChatConversation>> getConversations() async {
    final response = await apiClient.get('/chat/conversations');
    final dynamic data = response.data;
    if (data is List) {
      return data
          .map((item) => ChatConversation.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<ChatMessage>> getMessages(String conversationId, {int page = 1, int limit = 50}) async {
    final response = await apiClient.get(
      '/chat/conversations/$conversationId/messages',
      queryParameters: {'page': page, 'limit': limit},
    );
    final dynamic data = response.data;
    if (data is Map<String, dynamic> && data['items'] is List) {
      return (data['items'] as List)
          .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<ChatMessage> sendRestMessage(
    String conversationId,
    String text, {
    String? clientMessageId,
  }) async {
    final response = await apiClient.post(
      '/chat/conversations/$conversationId/messages',
      data: {
        'text': text,
        if (clientMessageId != null) 'clientMessageId': clientMessageId,
      },
    );
    return ChatMessage.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> markRestRead(String conversationId, {String? messageId}) async {
    await apiClient.post(
      '/chat/conversations/$conversationId/read',
      data: {
        if (messageId != null) 'messageId': messageId,
      },
    );
  }

  Future<int> getTotalUnreadCount() async {
    try {
      final response = await apiClient.get('/chat/unread-count');
      final dynamic data = response.data;
      if (data is Map<String, dynamic> && data['unreadCount'] is num) {
        return (data['unreadCount'] as num).toInt();
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _readController.close();
    _connectionStateController.close();
  }
}
