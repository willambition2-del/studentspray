import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/core/utils/quran_data.dart';

void main() {
  group('QuranData Unit Tests', () {
    test('contains all 114 Surahs', () {
      expect(QuranData.surahs.length, equals(114));
    });

    test('correctly retrieves Surah by number', () {
      final fatihah = QuranData.getByNumber(1);
      expect(fatihah.name, equals('الفاتحة'));
      expect(fatihah.ayahCount, equals(7));

      final baqarah = QuranData.getByNumber(2);
      expect(baqarah.name, equals('البقرة'));
      expect(baqarah.ayahCount, equals(286));

      final nas = QuranData.getByNumber(114);
      expect(nas.name, equals('الناس'));
      expect(nas.ayahCount, equals(6));
    });

    test('returns Arabic name helper', () {
      expect(QuranData.getSurahName(36), equals('يس'));
      expect(QuranData.getSurahName(67), equals('الملك'));
      expect(QuranData.getSurahName(null), equals('غير محدد'));
    });
  });
}
