import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/core/storage/token_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TokenStorage Unit Tests', () {
    late TokenStorage storage;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      storage = TokenStorage();
    });

    test('stores and clears access token in memory', () {
      expect(storage.getAccessToken(), isNull);

      storage.setAccessToken('sample_access_token_123');
      expect(storage.getAccessToken(), equals('sample_access_token_123'));

      storage.setAccessToken(null);
      expect(storage.getAccessToken(), isNull);
    });

    test('stores and retrieves refresh token via secure storage', () async {
      await storage.saveRefreshToken('sample_refresh_token_xyz');
      final retrieved = await storage.getRefreshToken();
      expect(retrieved, equals('sample_refresh_token_xyz'));

      await storage.clearAll();
      final afterClear = await storage.getRefreshToken();
      expect(afterClear, isNull);
    });

    test('stores last logged in user id', () async {
      await storage.saveLastUserId('user-uuid-1');
      final userId = await storage.getLastUserId();
      expect(userId, equals('user-uuid-1'));
    });
  });
}
