import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppTheme.primaryDark,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.menu_book_rounded,
              size: 72,
              color: AppTheme.accentGold,
            ),
            SizedBox(height: 24),
            Text(
              'الملتقى القرآني',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'بوابة المعلم وحلقات التحفيظ',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.accentGoldLight,
              ),
            ),
            SizedBox(height: 36),
            CircularProgressIndicator(
              color: AppTheme.accentGold,
              strokeWidth: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}
