import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supervisor_provider.dart';

class SupervisorHalaqasScreen extends ConsumerWidget {
  const SupervisorHalaqasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final halaqasAsync = ref.watch(supervisorHalaqasProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الحلقات الموكلة للإشراف'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(supervisorHalaqasProvider),
          ),
        ],
      ),
      body: halaqasAsync.when(
        data: (halaqas) {
          if (halaqas.isEmpty) {
            return const Center(
              child: Text('لا توجد حلقات مسندة إلى إشرافك حاليًا'),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: halaqas.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final h = halaqas[index];
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              h.name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Chip(
                            label: Text(h.code),
                            backgroundColor: Colors.blue.shade50,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('الفرع: ${h.branchName}', style: TextStyle(color: Colors.grey.shade700)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.person, size: 16, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text('عدد الطلاب: ${h.studentsCount}'),
                          const SizedBox(width: 16),
                          Icon(Icons.assignment, size: 16, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text('الزيارات: ${h.visitsCount}'),
                        ],
                      ),
                      if (h.teachers.isNotEmpty) ...[
                        const Divider(height: 20),
                        Text(
                          'المعلمون:',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                        ),
                        const SizedBox(height: 4),
                        ...h.teachers.map((t) => Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Row(
                                children: [
                                  const Icon(Icons.school, size: 14, color: Colors.teal),
                                  const SizedBox(width: 6),
                                  Text(t['name'] as String? ?? 'معلم'),
                                ],
                              ),
                            )),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          FilledButton.icon(
                            onPressed: () {
                              context.push('/supervisor/visits/new?halaqaId=${h.id}');
                            },
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('جدولة زيارة'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('حدث خطأ: $err')),
      ),
    );
  }
}
