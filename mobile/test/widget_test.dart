import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/core/theme/app_theme.dart';
import 'package:quran_forum/features/auth/screens/login_screen.dart';
import 'package:quran_forum/features/auth/screens/splash_screen.dart';
import 'package:quran_forum/features/placeholders/unsupported_role_screen.dart';

Widget createTestApp(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      theme: AppTheme.lightTheme,
      locale: const Locale('ar'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Directionality(
        textDirection: TextDirection.rtl,
        child: child,
      ),
    ),
  );
}

void main() {
  testWidgets('SplashScreen renders title and branding', (WidgetTester tester) async {
    await tester.pumpWidget(createTestApp(const SplashScreen()));

    expect(find.text('الملتقى القرآني'), findsOneWidget);
    expect(find.text('بوابة المعلم وحلقات التحفيظ'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('LoginScreen renders inputs and action button', (WidgetTester tester) async {
    await tester.pumpWidget(createTestApp(const LoginScreen()));

    expect(find.text('الملتقى القرآني'), findsOneWidget);
    expect(find.text('تسجيل الدخول إلى حساب المعلم'), findsOneWidget);
    expect(find.text('معرف الملتقى (Slug)'), findsOneWidget);
    expect(find.text('دخول'), findsOneWidget);
  });

  testWidgets('UnsupportedRoleScreen renders courteous message and role prompt', (WidgetTester tester) async {
    await tester.pumpWidget(createTestApp(const UnsupportedRoleScreen()));

    expect(find.text('الملتقى القرآني'), findsOneWidget);
    expect(find.textContaining('بوابة الجوال'), findsOneWidget);
  });
}
