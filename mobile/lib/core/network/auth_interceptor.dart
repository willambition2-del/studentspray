import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../config/env.dart';
import '../storage/token_storage.dart';

class AuthInterceptor extends QueuedInterceptor {
  final TokenStorage tokenStorage;
  VoidCallback? onSessionExpired;
  Completer<String?>? _refreshCompleter;

  AuthInterceptor({
    required this.tokenStorage,
    this.onSessionExpired,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokenStorage.getAccessToken();
    if (token != null && !options.headers.containsKey('Authorization')) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final is401 = err.response?.statusCode == 401;
    final path = err.requestOptions.path;
    final isAuthRoute = path.contains('/auth/mobile/login') ||
        path.contains('/auth/mobile/refresh') ||
        path.contains('/auth/mobile/logout');

    if (!is401 || isAuthRoute) {
      return handler.next(err);
    }

    // Attempt single-flight token refresh
    try {
      final newAccessToken = await _performSingleFlightRefresh();
      if (newAccessToken != null) {
        // Retry original request with new access token
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final client = Dio(
          BaseOptions(
            baseUrl: Env.apiBaseUrl,
            connectTimeout: const Duration(milliseconds: Env.connectTimeoutMs),
            receiveTimeout: const Duration(milliseconds: Env.receiveTimeoutMs),
          ),
        );

        final response = await client.fetch(retryOptions);
        return handler.resolve(response);
      } else {
        onSessionExpired?.call();
        return handler.next(err);
      }
    } catch (_) {
      onSessionExpired?.call();
      return handler.next(err);
    }
  }

  Future<String?> _performSingleFlightRefresh() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<String?>();

    try {
      final currentRefreshToken = await tokenStorage.getRefreshToken();
      if (currentRefreshToken == null) {
        _refreshCompleter!.complete(null);
        return null;
      }

      final refreshDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(milliseconds: Env.connectTimeoutMs),
          receiveTimeout: const Duration(milliseconds: Env.receiveTimeoutMs),
        ),
      );

      final response = await refreshDio.post(
        '/auth/mobile/refresh',
        data: {'refreshToken': currentRefreshToken},
      );

      if (response.statusCode == 200 && response.data is Map) {
        final newAccessToken = response.data['accessToken'] as String?;
        final newRefreshToken = response.data['refreshToken'] as String?;

        if (newAccessToken != null) {
          tokenStorage.setAccessToken(newAccessToken);
          if (newRefreshToken != null) {
            await tokenStorage.saveRefreshToken(newRefreshToken);
          }
          _refreshCompleter!.complete(newAccessToken);
          return newAccessToken;
        }
      }

      await tokenStorage.clearAll();
      _refreshCompleter!.complete(null);
      return null;
    } catch (_) {
      await tokenStorage.clearAll();
      _refreshCompleter!.complete(null);
      return null;
    } finally {
      _refreshCompleter = null;
    }
  }
}
