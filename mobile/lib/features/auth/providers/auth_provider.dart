import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/cache/session_cache_service.dart';
import '../../../core/database/app_database.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/sync/sync_service.dart';
import '../models/user_profile.dart';

// Providers for core singletons
final sessionCacheServiceProvider = Provider<SessionCacheService>((ref) {
  return SessionCacheService();
});

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return ApiClient(tokenStorage: tokenStorage);
});

final syncServiceProvider = Provider<SyncService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final db = ref.watch(appDatabaseProvider);
  final service = SyncService(apiClient: apiClient, db: db);
  ref.onDispose(() => service.dispose());
  return service;
});

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
}

class AuthState {
  final AuthStatus status;
  final UserProfile? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;

  AuthState copyWith({
    AuthStatus? status,
    UserProfile? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

typedef SessionResetCallback = void Function();

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;
  final SyncService syncService;
  final SessionCacheService sessionCacheService;
  final List<SessionResetCallback> _resetCallbacks = [];
  int _sessionGeneration = 0;

  AuthNotifier({
    required this.apiClient,
    required this.tokenStorage,
    required this.syncService,
    required this.sessionCacheService,
  }) : super(const AuthState()) {
    apiClient.onSessionExpired = handleSessionExpired;
    bootstrapSession();
  }

  void addResetCallback(SessionResetCallback callback) {
    _resetCallbacks.add(callback);
  }

  Future<void> bootstrapSession() async {
    final gen = ++_sessionGeneration;
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final refreshToken = await tokenStorage.getRefreshToken();
      if (gen != _sessionGeneration) return;

      if (refreshToken == null) {
        if (gen == _sessionGeneration && state.status != AuthStatus.authenticated) {
          state = const AuthState(status: AuthStatus.unauthenticated);
        }
        return;
      }

      // Perform refresh
      final refreshRes = await apiClient.post(
        '/auth/mobile/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (gen != _sessionGeneration) return;

      final accessToken = refreshRes.data['accessToken'] as String?;
      final newRefreshToken = refreshRes.data['refreshToken'] as String?;

      if (accessToken == null) {
        if (gen == _sessionGeneration && state.status != AuthStatus.authenticated) {
          await tokenStorage.clearAll();
          sessionCacheService.clearAll();
          state = const AuthState(status: AuthStatus.unauthenticated);
        }
        return;
      }

      tokenStorage.setAccessToken(accessToken);
      if (newRefreshToken != null) {
        await tokenStorage.saveRefreshToken(newRefreshToken);
      }

      // Fetch user profile
      final meRes = await apiClient.get('/auth/me');
      if (gen != _sessionGeneration) return;

      final user = UserProfile.fromJson(meRes.data as Map<String, dynamic>);

      await tokenStorage.saveLastUserId(user.id);
      syncService.setCurrentUserId(user.id);

      if (gen == _sessionGeneration) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
      }
    } catch (_) {
      if (gen == _sessionGeneration && state.status != AuthStatus.authenticated) {
        await tokenStorage.clearAll();
        sessionCacheService.clearAll();
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    }
  }

  Future<void> login({
    required String forumSlug,
    required String identifier,
    required String password,
  }) async {
    final gen = ++_sessionGeneration;
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);

    try {
      final loginRes = await apiClient.post(
        '/auth/mobile/login',
        data: {
          'forumSlug': forumSlug.trim(),
          'identifier': identifier.trim(),
          'password': password,
        },
      );

      if (gen != _sessionGeneration) return;

      final accessToken = loginRes.data['accessToken'] as String?;
      final refreshToken = loginRes.data['refreshToken'] as String?;

      if (accessToken == null || refreshToken == null) {
        throw const AppException(message: 'فشل في استلام بيانات الاعتماد');
      }

      // Reset cache for fresh session
      sessionCacheService.clearAll();

      tokenStorage.setAccessToken(accessToken);
      await tokenStorage.saveRefreshToken(refreshToken);

      // Fetch authenticated user profile
      final meRes = await apiClient.get('/auth/me');
      if (gen != _sessionGeneration) return;

      final user = UserProfile.fromJson(meRes.data as Map<String, dynamic>);

      await tokenStorage.saveLastUserId(user.id);
      syncService.setCurrentUserId(user.id);

      if (gen == _sessionGeneration) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
      }
    } on AppException catch (e) {
      if (gen == _sessionGeneration) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: e.message,
        );
      }
      rethrow;
    } catch (e) {
      if (gen == _sessionGeneration) {
        const msg = 'تعذر تسجيل الدخول، يرجى التأكد من صحة البيانات والاتصال';
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: msg,
        );
      }
      throw const AppException(message: 'تعذر تسجيل الدخول، يرجى التأكد من صحة البيانات والاتصال');
    }
  }

  Future<void> logout() async {
    ++_sessionGeneration;
    final refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken != null) {
      try {
        await apiClient.post(
          '/auth/mobile/logout',
          data: {'refreshToken': refreshToken},
        );
      } catch (_) {
        // Ignore network failure on logout
      }
    }

    syncService.setCurrentUserId(null);
    await tokenStorage.clearAll();
    sessionCacheService.clearAll();
    _triggerResetCallbacks();

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void handleSessionExpired() {
    if (!state.isAuthenticated) return;
    ++_sessionGeneration;
    syncService.setCurrentUserId(null);
    tokenStorage.clearAll();
    sessionCacheService.clearAll();
    _triggerResetCallbacks();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void _triggerResetCallbacks() {
    for (final cb in _resetCallbacks) {
      try {
        cb();
      } catch (_) {}
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final syncService = ref.watch(syncServiceProvider);
  final sessionCacheService = ref.watch(sessionCacheServiceProvider);

  return AuthNotifier(
    apiClient: apiClient,
    tokenStorage: tokenStorage,
    syncService: syncService,
    sessionCacheService: sessionCacheService,
  );
});
