import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/activities_shelf_provider.dart';

class ParentChildActivitiesAwardsScreen extends ConsumerWidget {
  final String studentId;
  final String studentName;

  const ParentChildActivitiesAwardsScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: Text('الأنشطة والجوائز: $studentName'),
          centerTitle: true,
          bottom: const TabBar(
            tabs: [
              Tab(text: 'الأنشطة', icon: Icon(Icons.event)),
              Tab(text: 'المسابقات', icon: Icon(Icons.emoji_events)),
              Tab(text: 'الأوسمة', icon: Icon(Icons.military_tech)),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ChildActivitiesTab(studentId: studentId),
            _ChildCompetitionsTab(studentId: studentId),
            _ChildAwardsTab(studentId: studentId),
          ],
        ),
      ),
    );
  }
}

class _ChildActivitiesTab extends ConsumerWidget {
  final String studentId;

  const _ChildActivitiesTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(parentChildActivitiesProvider(studentId));
    final dateFormat = DateFormat('yyyy/MM/dd', 'ar');

    return activitiesAsync.when(
      data: (activities) {
        if (activities.isEmpty) {
          return const Center(child: Text('لا توجد أنشطة مسجلة للابن حالياً'));
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(parentChildActivitiesProvider(studentId).future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: activities.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final act = activities[index];
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
                          Text(
                            act.title,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              act.typeLabel,
                              style: TextStyle(fontSize: 11, color: Colors.blue.shade900),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (act.description != null)
                        Text(act.description!, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 13, color: Colors.grey.shade500),
                          const SizedBox(width: 4),
                          Text(
                            dateFormat.format(act.startsAt),
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                          if (act.location != null) ...[
                            const Spacer(),
                            Icon(Icons.location_on, size: 13, color: Colors.grey.shade500),
                            const SizedBox(width: 4),
                            Text(act.location!, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('حدث خطأ: $err')),
    );
  }
}

class _ChildCompetitionsTab extends ConsumerWidget {
  final String studentId;

  const _ChildCompetitionsTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compsAsync = ref.watch(parentChildCompetitionsProvider(studentId));
    final dateFormat = DateFormat('yyyy/MM/dd', 'ar');

    return compsAsync.when(
      data: (comps) {
        if (comps.isEmpty) {
          return const Center(child: Text('لا توجد مسابقات مسجلة للابن'));
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(parentChildCompetitionsProvider(studentId).future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: comps.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final comp = comps[index];
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
                          Text(
                            comp.title,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          if (comp.myRank != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.purple.shade50,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'المركز ${comp.myRank}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.purple.shade900,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (comp.myScore != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('درجة الابن:', style: TextStyle(fontSize: 13)),
                              Text(
                                '${comp.myScore} / ${comp.maxScore}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green.shade800,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 13, color: Colors.grey.shade500),
                          const SizedBox(width: 4),
                          Text(
                            dateFormat.format(comp.startsAt),
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('حدث خطأ: $err')),
    );
  }
}

class _ChildAwardsTab extends ConsumerWidget {
  final String studentId;

  const _ChildAwardsTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final awardsAsync = ref.watch(parentChildAwardsProvider(studentId));
    final dateFormat = DateFormat('yyyy/MM/dd', 'ar');

    return awardsAsync.when(
      data: (awards) {
        if (awards.isEmpty) {
          return const Center(child: Text('لا توجد أوسمة ممنوحة'));
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(parentChildAwardsProvider(studentId).future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: awards.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final award = awards[index];
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.amber.shade100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.military_tech, color: Colors.amber.shade800),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              award.name,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              award.reason,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              dateFormat.format(award.awardedAt),
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('حدث خطأ: $err')),
    );
  }
}
