import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/supervisor_models.dart';
import '../providers/supervisor_provider.dart';

class SupervisorTeacherDetailScreen extends ConsumerWidget {
  final String teacherId;

  const SupervisorTeacherDetailScreen({super.key, required this.teacherId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(supervisorTeacherDetailProvider(teacherId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملف الإشرافي للمعلم'),
      ),
      body: detailAsync.when(
        data: (data) {
          final teacher = SupervisorTeacher.fromJson(data['teacher'] as Map<String, dynamic>);
          final visits = (data['visitsHistory'] as List? ?? [])
              .map((v) => FieldVisitItem.fromJson(v as Map<String, dynamic>))
              .toList();
          final recommendations = (data['recommendations'] as List? ?? [])
              .map((r) => RecommendationModel.fromJson(r as Map<String, dynamic>))
              .toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Teacher Profile Card
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: Colors.teal.shade700,
                            child: Text(
                              teacher.displayName.isNotEmpty ? teacher.displayName[0] : 'م',
                              style: const TextStyle(color: Colors.white, fontSize: 24),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  teacher.displayName,
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                if (teacher.phone != null)
                                  Text(teacher.phone!, style: TextStyle(color: Colors.grey.shade600)),
                                if (teacher.specialization != null)
                                  Text(
                                    'التخصص: ${teacher.specialization}',
                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('الحلقات المسندة:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        children: teacher.halaqas
                            .map((h) => Chip(
                                  label: Text('${h['name']} (${h['code']})'),
                                  backgroundColor: Colors.blue.shade50,
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Visits History Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'سجل الزيارات الميدانية (${visits.length})',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      final firstHalaqa = teacher.halaqas.isNotEmpty ? teacher.halaqas.first['id'] : null;
                      context.push('/supervisor/visits/new?teacherId=${teacher.id}&halaqaId=$firstHalaqa');
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('زيارة جديدة'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (visits.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: Text('لا توجد زيارات مسجلة لهذا المعلم بعد')),
                  ),
                )
              else
                ...visits.map((v) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        onTap: () => context.push('/supervisor/visits/${v.id}'),
                        title: Text('زيارة ${v.halaqaName} (${v.visitNumber})'),
                        subtitle: Text(
                          'الحالة: ${v.status} | التاريخ: ${v.completedAt ?? v.scheduledDate ?? "—"}',
                        ),
                        trailing: v.evaluationScore != null
                            ? Chip(
                                label: Text('${v.evaluationScore}%'),
                                backgroundColor: Colors.green.shade100,
                              )
                            : const Icon(Icons.arrow_forward_ios, size: 16),
                      ),
                    )),
              const SizedBox(height: 20),

              // Recommendations Section
              Text(
                'التوصيات والمتابعات (${recommendations.length})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              if (recommendations.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: Text('لا توجد توصيات قائمة لهذا المعلم')),
                  ),
                )
              else
                ...recommendations.map((r) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        onTap: () => context.push('/supervisor/recommendations/${r.id}'),
                        title: Text(r.title),
                        subtitle: Text(
                          'الأولوية: ${r.priority} | الحالة: ${r.status}',
                          style: TextStyle(
                            color: r.isOverdue ? Colors.red : Colors.grey.shade700,
                          ),
                        ),
                        trailing: r.isOverdue
                            ? const Icon(Icons.warning, color: Colors.red)
                            : const Icon(Icons.arrow_forward_ios, size: 16),
                      ),
                    )),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('حدث خطأ: $err')),
      ),
    );
  }
}
