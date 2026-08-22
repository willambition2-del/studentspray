import 'package:flutter/material.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_typography.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.menu_book_outlined,
              size: 72,
              color: AppColors.accentGold,
            ),
            SizedBox(height: 24),
            Text(
              'الملتقى القرآني',
              style: TextStyle(
                fontFamily: AppTypography.fontFamily,
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
                fontFamily: AppTypography.fontFamily,
                fontSize: 14,
                color: AppColors.accentGoldSoft,
              ),
            ),
            SizedBox(height: 36),
            CircularProgressIndicator(
              color: AppColors.accentGold,
              strokeWidth: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}
