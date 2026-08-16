import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// In-Memory Demo State Providers (Zero production persistence)
final selectedDemoChildIndexProvider = StateProvider<int>((ref) => 0);

final demoThemeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

final demoTeacherAttendanceFilterProvider = StateProvider<String>((ref) => 'ALL');
