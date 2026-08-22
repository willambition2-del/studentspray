import 'dart:io';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import '../network/api_client.dart';

class PickedAttachmentFile {
  final String name;
  final String? path;
  final List<int>? bytes;
  final int size;
  final String extension;

  PickedAttachmentFile({
    required this.name,
    this.path,
    this.bytes,
    required this.size,
    required this.extension,
  });
}

class AttachmentMetadata {
  final String url;
  final String fileName;
  final int fileSize;
  final String mimeType;

  AttachmentMetadata({
    required this.url,
    required this.fileName,
    required this.fileSize,
    required this.mimeType,
  });

  factory AttachmentMetadata.fromJson(Map<String, dynamic> json) {
    return AttachmentMetadata(
      url: json['url'] as String? ?? '',
      fileName: json['fileName'] as String? ?? json['filename'] as String? ?? '',
      fileSize: (json['fileSize'] as num?)?.toInt() ?? (json['size'] as num?)?.toInt() ?? 0,
      mimeType: json['mimeType'] as String? ?? json['mimetype'] as String? ?? 'application/octet-stream',
    );
  }

  Map<String, dynamic> toJson() => {
        'url': url,
        'fileName': fileName,
        'fileSize': fileSize,
        'mimeType': mimeType,
      };
}

class AttachmentPickerService {
  static const int maxFileSizeBytes = 15 * 1024 * 1024; // 15MB
  static const List<String> defaultAllowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'txt',
  ];

  /// Opens native Android/iOS system file picker
  static Future<PickedAttachmentFile?> pickAttachment({
    List<String>? allowedExtensions,
  }) async {
    try {
      final extensions = allowedExtensions ?? defaultAllowedExtensions;
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: extensions,
        allowMultiple: false,
        withData: true,
      );

      if (result == null || result.files.isEmpty) {
        return null;
      }

      final file = result.files.first;
      final ext = file.extension?.toLowerCase() ?? '';
      final size = file.size;

      if (size <= 0) {
        throw Exception('الملف المختار فارغ (0 بايت)');
      }

      if (size > maxFileSizeBytes) {
        throw Exception('حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميجابايت)');
      }

      return PickedAttachmentFile(
        name: file.name,
        path: file.path,
        bytes: file.bytes,
        size: size,
        extension: ext,
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Uploads picked attachment to backend POST /api/v1/attachments/upload
  static Future<AttachmentMetadata> uploadAttachment({
    required PickedAttachmentFile file,
    required ApiClient apiClient,
  }) async {
    MultipartFile multipartFile;

    if (file.path != null && file.path!.isNotEmpty && File(file.path!).existsSync()) {
      multipartFile = await MultipartFile.fromFile(
        file.path!,
        filename: file.name,
      );
    } else if (file.bytes != null) {
      multipartFile = MultipartFile.fromBytes(
        file.bytes!,
        filename: file.name,
      );
    } else {
      throw Exception('تعذر قراءة محتوى الملف المختار');
    }

    final formData = FormData.fromMap({
      'file': multipartFile,
    });

    final response = await apiClient.post(
      '/attachments/upload',
      data: formData,
      options: Options(
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      ),
    );

    if (response.data is Map<String, dynamic>) {
      return AttachmentMetadata.fromJson(response.data as Map<String, dynamic>);
    } else if (response.data is Map) {
      return AttachmentMetadata.fromJson((response.data as Map).cast<String, dynamic>());
    } else {
      throw Exception('استجابة غير متوقعة من خادم المرفقات');
    }
  }
}
