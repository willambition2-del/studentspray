import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  final FlutterSecureStorage _secureStorage;

  // In-memory access token & refresh token cache
  String? _accessToken;
  String? _inMemoryRefreshToken;

  static const String _kRefreshTokenKey = 'qf_mobile_refresh_token';
  static const String _kLastUserIdKey = 'qf_last_user_id';

  TokenStorage({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  String? getAccessToken() => _accessToken;

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<void> saveRefreshToken(String token) async {
    _inMemoryRefreshToken = token;
    try {
      await _secureStorage.write(key: _kRefreshTokenKey, value: token);
    } catch (_) {
      // In-memory token preserved even if disk write fails
    }
  }

  Future<String?> getRefreshToken() async {
    if (_inMemoryRefreshToken != null) return _inMemoryRefreshToken;
    try {
      final token = await _secureStorage.read(key: _kRefreshTokenKey);
      if (token != null) _inMemoryRefreshToken = token;
      return token;
    } catch (_) {
      return _inMemoryRefreshToken;
    }
  }

  Future<void> saveLastUserId(String userId) async {
    try {
      await _secureStorage.write(key: _kLastUserIdKey, value: userId);
    } catch (_) {}
  }

  Future<String?> getLastUserId() async {
    try {
      return await _secureStorage.read(key: _kLastUserIdKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearAll() async {
    _accessToken = null;
    _inMemoryRefreshToken = null;
    try {
      await _secureStorage.delete(key: _kRefreshTokenKey);
    } catch (_) {}
  }
}
