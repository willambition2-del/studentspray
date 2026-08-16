import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/activities_shelf_provider.dart';

class GeneralShelfScreen extends ConsumerWidget {
  const GeneralShelfScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sectionsAsync = ref.watch(shelfSectionsProvider);
    final itemsAsync = ref.watch(shelfItemsProvider);
    final selectedSectionId = ref.watch(selectedShelfSectionIdProvider);

    final dateFormat = DateFormat('yyyy/MM/dd', 'ar');

    return Scaffold(
      appBar: AppBar(
        title: const Text('الرف العام والمنشورات'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Horizontal Section Selector
          sectionsAsync.when(
            data: (sections) {
              if (sections.isEmpty) return const SizedBox.shrink();
              return Container(
                height: 50,
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: FilterChip(
                        label: const Text('الكل'),
                        selected: selectedSectionId == null,
                        onSelected: (_) {
                          ref.read(selectedShelfSectionIdProvider.notifier).state = null;
                        },
                      ),
                    ),
                    ...sections.map(
                      (sec) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: FilterChip(
                          label: Text('${sec.name} (${sec.itemsCount})'),
                          selected: selectedSectionId == sec.id,
                          onSelected: (_) {
                            ref.read(selectedShelfSectionIdProvider.notifier).state =
                                selectedSectionId == sec.id ? null : sec.id;
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
            loading: () => const SizedBox(height: 50),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Items List
          Expanded(
            child: itemsAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.menu_book,
                            size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text(
                          'لا توجد منشورات متاحة حالياً',
                          style:
                              TextStyle(fontSize: 16, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.refresh(shelfItemsProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      return Card(
                        elevation: item.isPinned ? 3 : 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: item.isPinned
                              ? BorderSide(color: Colors.amber.shade400, width: 1.5)
                              : BorderSide.none,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      item.typeLabel,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      ),
                                    ),
                                  ),
                                  if (item.isPinned)
                                    Row(
                                      children: [
                                        Icon(Icons.push_pin,
                                            size: 15,
                                            color: Colors.amber.shade800),
                                        const SizedBox(width: 4),
                                        Text(
                                          'مثبت',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.amber.shade800,
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                item.title,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                item.content,
                                style: TextStyle(
                                  fontSize: 13,
                                  height: 1.4,
                                  color: Colors.grey.shade800,
                                ),
                              ),
                              if (item.attachmentName != null) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border:
                                        Border.all(color: Colors.blue.shade200),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.attach_file,
                                          size: 16,
                                          color: Colors.blue.shade800),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          item.attachmentName!,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue.shade900,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              const Divider(height: 1),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (item.authorName != null) ...[
                                    Icon(Icons.person_outline,
                                        size: 13, color: Colors.grey.shade500),
                                    const SizedBox(width: 4),
                                    Text(
                                      item.authorName!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                  const Spacer(),
                                  Icon(Icons.access_time,
                                      size: 13, color: Colors.grey.shade500),
                                  const SizedBox(width: 4),
                                  Text(
                                    dateFormat.format(item.publishedAt),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey.shade600,
                                    ),
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
              error: (err, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('حدث خطأ أثناء تحميل المنشورات: $err'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.refresh(shelfItemsProvider),
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
