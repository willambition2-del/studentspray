/// Centralized, type-safe parsing utilities for API responses.
/// Prevents runtime type-cast exceptions (e.g. String vs num, Map vs List)
/// across all Flutter models and providers.
class ApiParsing {
  ApiParsing._();

  /// Safely parses an integer from num, String, or null.
  static int? parseInt(dynamic value, [int? fallback]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) {
      final parsed = int.tryParse(value.trim());
      if (parsed != null) return parsed;
      final dbl = double.tryParse(value.trim());
      if (dbl != null) return dbl.toInt();
    }
    return fallback;
  }

  /// Safely parses a double from num, String, or null.
  static double? parseDouble(dynamic value, [double? fallback]) {
    if (value == null) return fallback;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    if (value is String) {
      final parsed = double.tryParse(value.trim());
      if (parsed != null) return parsed;
    }
    return fallback;
  }

  /// Safely parses a num from num, String, or null.
  static num? parseNum(dynamic value, [num? fallback]) {
    if (value == null) return fallback;
    if (value is num) return value;
    if (value is String) {
      final parsed = num.tryParse(value.trim());
      if (parsed != null) return parsed;
    }
    return fallback;
  }

  /// Safely parses a boolean from bool, num, String, or null.
  static bool? parseBool(dynamic value, [bool? fallback]) {
    if (value == null) return fallback;
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final lower = value.trim().toLowerCase();
      if (lower == 'true' || lower == '1' || lower == 'yes') return true;
      if (lower == 'false' || lower == '0' || lower == 'no') return false;
    }
    return fallback;
  }

  /// Safely parses a String from dynamic value.
  static String? parseString(dynamic value, [String? fallback]) {
    if (value == null) return fallback;
    if (value is String) return value;
    return value.toString();
  }

  /// Safely parses a DateTime from String, num, or null.
  static DateTime? parseDateTime(dynamic value, [DateTime? fallback]) {
    if (value == null) return fallback;
    if (value is DateTime) return value;
    if (value is String) {
      final parsed = DateTime.tryParse(value.trim());
      if (parsed != null) return parsed;
    }
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    return fallback;
  }

  /// Safely extracts a List of items from either:
  /// - A direct JSON array: `[...]`
  /// - A paginated JSON object: `{ "items": [...] }` or `{ "data": [...] }` or `{ "plans": [...] }`
  static List<dynamic> extractList(dynamic data) {
    if (data == null) return const [];
    if (data is List) return data;
    if (data is Map) {
      if (data['items'] is List) return data['items'] as List;
      if (data['data'] is List) return data['data'] as List;
      if (data['results'] is List) return data['results'] as List;
      if (data['plans'] is List) return data['plans'] as List;
      if (data['activities'] is List) return data['activities'] as List;
      if (data['competitions'] is List) return data['competitions'] as List;
      if (data['awards'] is List) return data['awards'] as List;
      return const [];
    }
    return const [];
  }

  /// Safely maps any API payload to a strongly-typed `List<T>`.
  static List<T> parseList<T>(dynamic data, T Function(Map<String, dynamic> json) fromJson) {
    final rawList = extractList(data);
    final results = <T>[];
    for (final item in rawList) {
      if (item is Map<String, dynamic>) {
        results.add(fromJson(item));
      } else if (item is Map) {
        results.add(fromJson(item.cast<String, dynamic>()));
      }
    }
    return results;
  }
}
