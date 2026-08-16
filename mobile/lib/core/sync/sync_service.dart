import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../errors/app_exception.dart';
import '../network/api_client.dart';

enum MutationType {
  attendance,
  memorization,
  revision,
}

class SyncService {
  final ApiClient apiClient;
  final AppDatabase db;
  final Connectivity connectivity;
  final _uuid = const Uuid();

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isSyncing = false;
  String? _currentUserId;

  SyncService({
    required this.apiClient,
    required this.db,
    Connectivity? connectivity,
  }) : connectivity = connectivity ?? Connectivity() {
    _initConnectivityListener();
  }

  void setCurrentUserId(String? userId) {
    _currentUserId = userId;
    if (userId != null) {
      syncPendingMutations();
    }
  }

  void _initConnectivityListener() {
    _connectivitySubscription = connectivity.onConnectivityChanged.listen((results) {
      final isConnected = results.any((r) => r != ConnectivityResult.none);
      if (isConnected && _currentUserId != null) {
        syncPendingMutations();
      }
    });
  }

  Future<bool> isOnline() async {
    final results = await connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  String generateMutationId() => _uuid.v4();

  Future<dynamic> executeOrQueue({
    required String userId,
    required MutationType type,
    required String path,
    required Map<String, dynamic> payload,
    String? clientMutationId,
  }) async {
    final mutationId = clientMutationId ?? generateMutationId();
    final enrichedPayload = Map<String, dynamic>.from(payload);
    enrichedPayload['clientMutationId'] = mutationId;

    final online = await isOnline();

    if (online) {
      try {
        final response = await apiClient.post(path, data: enrichedPayload);
        return {
          'synced': true,
          'data': response.data,
          'clientMutationId': mutationId,
        };
      } on AppException catch (e) {
        // If it's a client error (validation 400 or forbidden 403), do not queue
        if (e.statusCode != null && e.statusCode! >= 400 && e.statusCode! < 500) {
          rethrow;
        }
        // Otherwise, fall back to offline queue
      } catch (_) {
        // Fall back to offline queue
      }
    }

    // Save to Drift local database
    await db.insertMutation(
      PendingMutationsCompanion(
        clientMutationId: Value(mutationId),
        userId: Value(userId),
        type: Value(type.name.toUpperCase()),
        payloadJson: Value(jsonEncode({'path': path, 'data': enrichedPayload})),
        createdAt: Value(DateTime.now()),
        status: const Value('PENDING'),
      ),
    );

    return {
      'synced': false,
      'isOffline': true,
      'clientMutationId': mutationId,
      'message': 'تم الحفظ محليًا — سيتم الإرسال تلقائيًا عند توفر الاتصال',
    };
  }

  Future<int> getPendingCount(String userId) async {
    return await db.countPendingMutationsForUser(userId);
  }

  Future<void> syncPendingMutations() async {
    if (_isSyncing || _currentUserId == null) return;
    final online = await isOnline();
    if (!online) return;

    _isSyncing = true;
    final userId = _currentUserId!;

    try {
      final pendingList = await db.getPendingMutationsForUser(userId);

      for (final mutation in pendingList) {
        try {
          final decoded = jsonDecode(mutation.payloadJson) as Map<String, dynamic>;
          final path = decoded['path'] as String;
          final data = decoded['data'] as Map<String, dynamic>;

          await apiClient.post(path, data: data);
          // Synced successfully - delete from pending queue
          await db.deleteMutation(mutation.id);
        } on AppException catch (e) {
          // If already recorded (idempotency 409 or conflict), safely delete
          if (e.statusCode == 409) {
            await db.deleteMutation(mutation.id);
          } else if (e.statusCode != null && e.statusCode! >= 400 && e.statusCode! < 500) {
            // Validation or permanent error - mark failed
            await db.updateMutationStatus(mutation.id, 'FAILED', error: e.message);
          } else {
            // Transient error - keep pending for next retry
            await db.updateMutationStatus(mutation.id, 'PENDING', error: e.message);
            break; // Stop loop if connection issue
          }
        } catch (e) {
          await db.updateMutationStatus(mutation.id, 'PENDING', error: e.toString());
          break;
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }
}
