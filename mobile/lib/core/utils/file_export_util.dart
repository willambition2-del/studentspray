import 'dart:convert';
import 'dart:io';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import '../../features/teacher/models/teacher_models.dart';
import '../../features/supervisor/models/supervisor_models.dart';
import '../../features/student/models/student_models.dart';

class ExportResult {
  final String filePath;
  final String fileName;
  final int fileSizeBytes;
  final String fileType;

  const ExportResult({
    required this.filePath,
    required this.fileName,
    required this.fileSizeBytes,
    required this.fileType,
  });

  String get formattedSize {
    if (fileSizeBytes < 1024) return '$fileSizeBytes B';
    if (fileSizeBytes < 1024 * 1024) return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class FileExportUtil {
  /// 1. Export Student Roster to CSV
  static Future<ExportResult> exportStudentRosterCsv(List<WorkspaceStudent> students) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'student_roster_$timestamp.csv';
    final file = File('${dir.path}/$fileName');

    final buffer = StringBuffer();
    // UTF-8 BOM for Arabic Excel compatibility
    buffer.write('\uFEFF');
    buffer.writeln('الرقم,اسم الطالب,الرقم التعريفي,اسم المستخدم,رقم الهاتف,الحالة اليوم');

    for (int i = 0; i < students.length; i++) {
      final s = students[i];
      final name = _escapeCsv(s.displayName);
      final num = _escapeCsv(s.studentNumber ?? '');
      final username = _escapeCsv(s.username);
      final phone = _escapeCsv(s.phone ?? '');
      final status = _escapeCsv(s.todayAttendanceStatus ?? 'غير محدد');

      buffer.writeln('${i + 1},$name,$num,$username,$phone,$status');
    }

    await file.writeAsString(buffer.toString());
    final bytes = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytes,
      fileType: 'CSV',
    );
  }

  /// 2. Export Session Attendance Sheet to CSV
  static Future<ExportResult> exportAttendanceSheetCsv({
    required String halaqaName,
    required String sessionDate,
    required List<dynamic> students,
    required Map<String, String> statuses,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'attendance_${sessionDate}_$timestamp.csv';
    final file = File('${dir.path}/$fileName');

    final buffer = StringBuffer();
    buffer.write('\uFEFF');
    buffer.writeln('كشف التحضير والانضباط الرسمي - $halaqaName');
    buffer.writeln('التاريخ: $sessionDate');
    buffer.writeln('الرقم,اسم الطالب,الرقم التعريفي,حالة الحضور,الدرجة/الملاحظة');

    for (int i = 0; i < students.length; i++) {
      final s = students[i];
      final statusRaw = statuses[s.studentId] ?? 'PRESENT';
      final statusArabic = _formatAttendanceStatus(statusRaw);
      buffer.writeln('${i + 1},${_escapeCsv(s.displayName)},${_escapeCsv(s.studentNumber ?? '')},$statusArabic,معتمد');
    }

    await file.writeAsString(buffer.toString());
    final bytes = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytes,
      fileType: 'CSV',
    );
  }

  /// 3. Export Exam Grade Sheet to CSV
  static Future<ExportResult> exportGradeSheetCsv({
    required String examTitle,
    required double maxScore,
    required List<TeacherExamResultItem> results,
    required List<WorkspaceStudent> students,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'exam_grades_$timestamp.csv';
    final file = File('${dir.path}/$fileName');

    final buffer = StringBuffer();
    buffer.write('\uFEFF');
    buffer.writeln('كشف درجات اختبار: ${_escapeCsv(examTitle)}');
    buffer.writeln('الدرجة العظمى: $maxScore');
    buffer.writeln('الرقم,اسم الطالب,الدرجة المحرزة,النسبة المئوية,حالة الاجتياز,ملاحظات المعلم');

    for (int i = 0; i < results.length; i++) {
      final r = results[i];
      final passedText = r.isPassed ? 'ناجح' : 'راسب';
      buffer.writeln('${i + 1},${_escapeCsv(r.studentName)},${r.score},${r.percentage.toStringAsFixed(1)}%,$passedText,${_escapeCsv(r.notes ?? '')}');
    }

    await file.writeAsString(buffer.toString());
    final bytes = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytes,
      fileType: 'CSV',
    );
  }

  /// 4. Export Field Visit Evaluation Report to Authentic Binary PDF
  static Future<ExportResult> exportVisitReportPdf(FieldVisitItem visit) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'visit_report_${visit.visitNumber}_$timestamp.pdf';
    final file = File('${dir.path}/$fileName');

    final lines = [
      '============================================================',
      'Field Visit Evaluation Official Report',
      'Quran Forum Platform - Supervisory Quality Dept',
      '============================================================',
      'Visit Number: ${visit.visitNumber}',
      'Visit Type: ${visit.visitType}',
      'Target Halaqa: ${visit.halaqaName}',
      'Target Teacher: ${visit.teacherName}',
      'Visit Date: ${visit.scheduledDate ?? "Not specified"}',
      'Visit Status: ${visit.status}',
      'Evaluation Score: ${visit.evaluationScore != null ? "${visit.evaluationScore}%" : "Under Evaluation"}',
      '------------------------------------------------------------',
      'Visit Summary & Objectives:',
      visit.summary ?? 'Supervisory field visit to verify memorization and educational quality.',
      'General Supervisory Notes:',
      visit.generalNotes ?? 'Visit completed. Recitation notebooks and attendance reviewed.',
      '============================================================',
      'Issued At: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}',
      'Educational Supervisor Official Endorsement',
    ];

    final pdfBytes = _buildStandardPdf('Field Visit Evaluation Report', lines);
    await file.writeAsBytes(pdfBytes);
    final bytesCount = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytesCount,
      fileType: 'PDF',
    );
  }

  /// 5. Export Student Passed Exam Certificate to Authentic Binary PDF
  static Future<ExportResult> exportStudentCertificatePdf({
    required String studentName,
    required String examTitle,
    required double score,
    required double maxScore,
    required double percentage,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'certificate_$timestamp.pdf';
    final file = File('${dir.path}/$fileName');

    final lines = [
      '============================================================',
      '       Official Quran Exam Completion Certificate',
      '                 Quran Forum Academy',
      '============================================================',
      '',
      'This is to certify that student: $studentName',
      'Has successfully passed the formal examination:',
      'Exam: $examTitle',
      'Achieved Score: $score / $maxScore (${percentage.toStringAsFixed(1)}%)',
      'Appreciation Rating: ${_getGradeAppreciation(percentage)}',
      '',
      'Wishing the student continuous success and steadfastness in the Holy Quran.',
      '------------------------------------------------------------',
      'Issued On: ${DateFormat('yyyy-MM-dd').format(DateTime.now())}',
      'Official Endorsement: Academic Affairs Directorate',
      '============================================================',
    ];

    final pdfBytes = _buildStandardPdf('Official Quran Exam Certificate', lines);
    await file.writeAsBytes(pdfBytes);
    final bytesCount = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytesCount,
      fileType: 'PDF',
    );
  }

  /// 6. Export Parent Child Scorecard to Authentic Binary PDF
  static Future<ExportResult> exportParentScorecardPdf({
    required String childName,
    required List<ExamResultModel> results,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'scorecard_${childName}_$timestamp.pdf';
    final file = File('${dir.path}/$fileName');

    final lines = [
      '============================================================',
      '           Student Academic Progress Scorecard',
      '                 Quran Forum Academy',
      '============================================================',
      'Student Name: $childName',
      'Report Date: ${DateFormat('yyyy-MM-dd').format(DateTime.now())}',
      'Total Recorded Exams: ${results.length}',
      '------------------------------------------------------------',
      'Exam Details & Performance Breakdown:',
    ];

    for (int i = 0; i < results.length; i++) {
      final r = results[i];
      final status = r.isPassed ? 'PASSED [OK]' : 'FAILED [RETRY]';
      lines.add('${i + 1}. ${r.examTitle} - Score: ${r.score}/${r.maxScore} (${r.percentage.toStringAsFixed(1)}%) - Status: $status');
      if (r.notes != null && r.notes!.isNotEmpty) {
        lines.add('   Teacher Remarks: ${r.notes}');
      }
    }

    lines.add('============================================================');
    lines.add('Quran Forum Academic Directorate');

    final pdfBytes = _buildStandardPdf('Student Academic Scorecard', lines);
    await file.writeAsBytes(pdfBytes);
    final bytesCount = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytesCount,
      fileType: 'PDF',
    );
  }

  /// 7. Export Teacher Evaluation Report to Authentic Binary PDF
  static Future<ExportResult> exportTeacherEvaluationPdf(TeacherEvaluationItem eval) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final fileName = 'evaluation_${eval.studentName}_$timestamp.pdf';
    final file = File('${dir.path}/$fileName');

    final lines = [
      '============================================================',
      '             Student Periodic Evaluation Report',
      '============================================================',
      'Student Name: ${eval.studentName}',
      'Halaqa: ${eval.halaqaName ?? "Main Quranic Halaqa"}',
      'Evaluation Date: ${eval.evaluationDate.toIso8601String().substring(0, 10)}',
      'Overall Rating: ${eval.rating}',
      'Overall Score: ${eval.overallScore.toStringAsFixed(1)}%',
      'Behavior & Discipline Score: ${eval.behaviorScore.toStringAsFixed(1)}%',
      'Teacher Notes & Directives:',
      eval.teacherNotes ?? 'Outstanding performance and complete dedication to memorization.',
      '============================================================',
      'Issued By: Quran Forum Academic Dept',
    ];

    final pdfBytes = _buildStandardPdf('Student Evaluation Report', lines);
    await file.writeAsBytes(pdfBytes);
    final bytesCount = await file.length();

    return ExportResult(
      filePath: file.path,
      fileName: fileName,
      fileSizeBytes: bytesCount,
      fileType: 'PDF',
    );
  }

  /// Generates a valid %PDF-1.4 binary byte stream
  static List<int> _buildStandardPdf(String title, List<String> lines) {
    final streamContent = StringBuffer();
    streamContent.writeln('BT');
    streamContent.writeln('/F1 16 Tf');
    streamContent.writeln('50 780 Td');
    streamContent.writeln('(${_escapePdf(title)}) Tj');
    streamContent.writeln('/F1 10 Tf');

    double y = 745;
    for (final line in lines) {
      y -= 15;
      if (y < 40) break;
      streamContent.writeln('1 0 0 1 50 ${y.toStringAsFixed(1)} Tm');
      streamContent.writeln('(${_escapePdf(line)}) Tj');
    }
    streamContent.writeln('ET');

    final contentBytes = utf8.encode(streamContent.toString());
    final contentLength = contentBytes.length;

    const header = '%PDF-1.4\n%âãÏÓ\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    final obj4Header = '4 0 obj\n<< /Length $contentLength >>\nstream\n';
    const obj4Footer = '\nendstream\nendobj\n';
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    final part1 = utf8.encode(header);
    final offset1 = part1.length;
    final partObj1 = utf8.encode(obj1);
    final offset2 = offset1 + partObj1.length;
    final partObj2 = utf8.encode(obj2);
    final offset3 = offset2 + partObj2.length;
    final partObj3 = utf8.encode(obj3);
    final offset4 = offset3 + partObj3.length;
    final partObj4Header = utf8.encode(obj4Header);
    final partObj4Footer = utf8.encode(obj4Footer);
    final partObj4 = [...partObj4Header, ...contentBytes, ...partObj4Footer];
    final offset5 = offset4 + partObj4.length;
    final partObj5 = utf8.encode(obj5);
    final offsetXref = offset5 + partObj5.length;

    final xref = StringBuffer();
    xref.writeln('xref');
    xref.writeln('0 6');
    xref.writeln('0000000000 65535 f ');
    xref.writeln('${offset1.toString().padLeft(10, '0')} 00000 n ');
    xref.writeln('${offset2.toString().padLeft(10, '0')} 00000 n ');
    xref.writeln('${offset3.toString().padLeft(10, '0')} 00000 n ');
    xref.writeln('${offset4.toString().padLeft(10, '0')} 00000 n ');
    xref.writeln('${offset5.toString().padLeft(10, '0')} 00000 n ');
    xref.writeln('trailer');
    xref.writeln('<< /Size 6 /Root 1 0 R >>');
    xref.writeln('startxref');
    xref.writeln('$offsetXref');
    xref.writeln('%%EOF');

    final partXref = utf8.encode(xref.toString());

    return [
      ...part1,
      ...partObj1,
      ...partObj2,
      ...partObj3,
      ...partObj4,
      ...partObj5,
      ...partXref,
    ];
  }

  static String _escapePdf(String text) {
    return text
        .replaceAll('\\', '\\\\')
        .replaceAll('(', '\\(')
        .replaceAll(')', '\\)')
        .replaceAll('\r', '')
        .replaceAll('\n', ' ');
  }

  static String _escapeCsv(String val) {
    if (val.contains(',') || val.contains('"') || val.contains('\n')) {
      return '"${val.replaceAll('"', '""')}"';
    }
    return val;
  }

  static String _formatAttendanceStatus(String s) {
    switch (s) {
      case 'PRESENT':
        return 'حاضر';
      case 'ABSENT':
        return 'غائب';
      case 'LATE':
        return 'متأخر';
      case 'EXCUSED':
        return 'معذور';
      default:
        return s;
    }
  }

  static String _getGradeAppreciation(double pct) {
    if (pct >= 95) return 'Excellent with Honors (A+)';
    if (pct >= 90) return 'Excellent (A)';
    if (pct >= 80) return 'Very Good (B)';
    if (pct >= 70) return 'Good (C)';
    if (pct >= 60) return 'Acceptable (D)';
    return 'Failed';
  }
}
