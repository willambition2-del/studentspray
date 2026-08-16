import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  final FlutterSecureStorage _secureStorage;

  // In-memory access token
  String? _accessToken;

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
    await _secureStorage.write(key: _kRefreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _kRefreshTokenKey);
  }

  Future<void> saveLastUserId(String userId) async {
    await _secureStorage.write(key: _kLastUserIdKey, value: userId);
  }

  Future<String?> getLastUserId() async {
    return await _secureStorage.read(key: _kLastUserIdKey);
  }

  Future<void> clearAll() async {
    _accessToken = null;
    await _secureStorage.delete(key: _kRefreshTokenKey);
  }
}
