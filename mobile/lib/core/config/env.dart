class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );

  static const String defaultForumSlug = String.fromEnvironment(
    'DEFAULT_FORUM_SLUG',
    defaultValue: 'full-demo-quran-forum',
  );

  static const int connectTimeoutMs = 15000;
  static const int receiveTimeoutMs = 15000;
}
