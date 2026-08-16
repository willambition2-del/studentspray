import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/app_database.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/sync/sync_service.dart';
import '../models/user_profile.dart';

// Providers for core singletons
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

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;
  final SyncService syncService;

  AuthNotifier({
    required this.apiClient,
    required this.tokenStorage,
    required this.syncService,
  }) : super(const AuthState()) {
    apiClient.onSessionExpired = handleSessionExpired;
    bootstrapSession();
  }

  Future<void> bootstrapSession() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken == null) {
        state = const AuthState(status: AuthStatus.unauthenticated);
        return;
      }

      // Perform refresh
      final refreshRes = await apiClient.post(
        '/auth/mobile/refresh',
        data: {'refreshToken': refreshToken},
      );

      final accessToken = refreshRes.data['accessToken'] as String?;
      final newRefreshToken = refreshRes.data['refreshToken'] as String?;

      if (accessToken == null) {
        await tokenStorage.clearAll();
        state = const AuthState(status: AuthStatus.unauthenticated);
        return;
      }

      tokenStorage.setAccessToken(accessToken);
      if (newRefreshToken != null) {
        await tokenStorage.saveRefreshToken(newRefreshToken);
      }

      // Fetch user profile
      final meRes = await apiClient.get('/auth/me');
      final user = UserProfile.fromJson(meRes.data as Map<String, dynamic>);

      await tokenStorage.saveLastUserId(user.id);
      syncService.setCurrentUserId(user.id);

      state = AuthState(
        status: AuthStatus.authenticated,
        user: user,
      );
    } catch (_) {
      await tokenStorage.clearAll();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({
    required String forumSlug,
    required String identifier,
    required String password,
  }) async {
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

      final accessToken = loginRes.data['accessToken'] as String?;
      final refreshToken = loginRes.data['refreshToken'] as String?;

      if (accessToken == null || refreshToken == null) {
        throw const AppException(message: 'فشل في استلام بيانات الاعتماد');
      }

      tokenStorage.setAccessToken(accessToken);
      await tokenStorage.saveRefreshToken(refreshToken);

      // Fetch authenticated user profile
      final meRes = await apiClient.get('/auth/me');
      final user = UserProfile.fromJson(meRes.data as Map<String, dynamic>);

      await tokenStorage.saveLastUserId(user.id);
      syncService.setCurrentUserId(user.id);

      state = AuthState(
        status: AuthStatus.authenticated,
        user: user,
      );
    } on AppException catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: e.message,
      );
      rethrow;
    } catch (e) {
      const msg = 'تعذر تسجيل الدخول، يرجى التأكد من صحة البيانات والاتصال';
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: msg,
      );
      throw const AppException(message: msg);
    }
  }

  Future<void> logout() async {
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

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void handleSessionExpired() {
    syncService.setCurrentUserId(null);
    tokenStorage.clearAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final syncService = ref.watch(syncServiceProvider);

  return AuthNotifier(
    apiClient: apiClient,
    tokenStorage: tokenStorage,
    syncService: syncService,
  );
});
