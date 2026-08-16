import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supervisor_provider.dart';

class SupervisorTeachersScreen extends ConsumerWidget {
  const SupervisorTeachersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teachersAsync = ref.watch(supervisorTeachersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('المعلمون الخاضعون للإشراف'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(supervisorTeachersProvider),
          ),
        ],
      ),
      body: teachersAsync.when(
        data: (teachers) {
          if (teachers.isEmpty) {
            return const Center(child: Text('لا يوجد معلمون في نطاق إشرافك حاليًا'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: teachers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final t = teachers[index];
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: InkWell(
                  onTap: () => context.push('/supervisor/teachers/${t.id}'),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.teal.shade100,
                              child: Text(
                                t.displayName.isNotEmpty ? t.displayName[0] : 'م',
                                style: TextStyle(color: Colors.teal.shade900, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t.displayName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  if (t.specialization != null)
                                    Text(
                                      t.specialization!,
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                                    ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios, size: 16),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: t.halaqas
                              .map((h) => Chip(
                                    label: Text(h['name'] as String? ?? 'حلقة', style: const TextStyle(fontSize: 11)),
                                    padding: EdgeInsets.zero,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ))
                              .toList(),
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              t.lastVisit != null
                                  ? 'آخر تقييم: ${t.lastVisit!['score'] ?? '—'}%'
                                  : 'لم تتم زيارته بعد',
                              style: TextStyle(
                                fontSize: 13,
                                color: t.lastVisit != null ? Colors.green.shade800 : Colors.grey.shade600,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (t.openRecommendationsCount > 0)
                              Badge(
                                label: Text('${t.openRecommendationsCount} توصيات'),
                                backgroundColor: Colors.orange,
                              ),
                          ],
                        ),
                      ],
                    ),
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
