class AppException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final String? requestId;

  const AppException({
    required this.message,
    this.statusCode,
    this.code,
    this.requestId,
  });

  @override
  String toString() => message;

  factory AppException.fromDioError(dynamic error) {
    if (error is AppException) return error;

    String msg = 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
    int? status;
    String? errorCode;
    String? reqId;

    if (error != null && error.toString().contains('DioException')) {
      final response = (error as dynamic).response;
      if (response != null) {
        status = response.statusCode;
        final data = response.data;
        if (data is Map<String, dynamic>) {
          errorCode = data['code'] as String?;
          reqId = data['requestId'] as String?;
          final rawMsg = data['message'];
          if (rawMsg is List) {
            msg = rawMsg.join(', ');
          } else if (rawMsg is String) {
            msg = rawMsg;
          }
        }

        if (status == 401) {
          msg = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا';
        } else if (status == 403) {
          msg = 'ليس لديك صلاحية لتنفيذ هذه العملية';
        } else if (status == 404) {
          msg = 'العنصر المطلوب غير موجود';
        } else if (status == 409) {
          msg = 'يوجد تعارض في البيانات أو تكرار لنفس العملية';
        }
      }
    }

    return AppException(
      message: msg,
      statusCode: status,
      code: errorCode,
      requestId: reqId,
    );
  }
}
