import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'app_database.g.dart';

class PendingMutations extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientMutationId => text()();
  TextColumn get userId => text()();
  TextColumn get type => text()(); // ATTENDANCE, MEMORIZATION, REVISION
  TextColumn get payloadJson => text()();
  DateTimeColumn get createdAt => dateTime()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('PENDING'))(); // PENDING, IN_PROGRESS, FAILED
}

class CachedHalaqas extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get name => text()();
  TextColumn get code => text()();
  TextColumn get branchName => text()();
  IntColumn get studentsCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id, userId};
}

@DriftDatabase(tables: [PendingMutations, CachedHalaqas])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 1;

  // Pending Mutations queries
  Future<int> insertMutation(PendingMutationsCompanion mutation) =>
      into(pendingMutations).insert(mutation);

  Future<List<PendingMutation>> getPendingMutationsForUser(String userId) =>
      (select(pendingMutations)
            ..where((t) => t.userId.equals(userId) & t.status.isNotValue('FAILED'))
            ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
          .get();

  Future<int> countPendingMutationsForUser(String userId) async {
    final countExp = pendingMutations.id.count();
    final query = selectOnly(pendingMutations)
      ..addColumns([countExp])
      ..where(pendingMutations.userId.equals(userId) &
          pendingMutations.status.isNotValue('FAILED'));
    final result = await query.getSingle();
    return result.read(countExp) ?? 0;
  }

  Future<void> updateMutationStatus(int id, String status, {String? error}) =>
      (update(pendingMutations)..where((t) => t.id.equals(id))).write(
        PendingMutationsCompanion(
          status: Value(status),
          lastError: Value(error),
          retryCount: Value(1),
        ),
      );

  Future<int> deleteMutation(int id) =>
      (delete(pendingMutations)..where((t) => t.id.equals(id))).go();

  Future<int> deleteMutationsForUser(String userId) =>
      (delete(pendingMutations)..where((t) => t.userId.equals(userId))).go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'quran_forum_local.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
