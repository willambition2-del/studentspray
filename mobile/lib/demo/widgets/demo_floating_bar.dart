import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class DemoFloatingReturnButton extends StatelessWidget {
  const DemoFloatingReturnButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 24,
      left: 20,
      child: Material(
        elevation: 6,
        borderRadius: BorderRadius.circular(30),
        shadowColor: Colors.black.withAlpha(50),
        color: AppTheme.primaryDark,
        child: InkWell(
          borderRadius: BorderRadius.circular(30),
          onTap: () {
            context.go('/demo');
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: AppTheme.accentGold.withAlpha(120), width: 1.5),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.dashboard_customize_rounded, color: AppTheme.accentGold, size: 20),
                SizedBox(width: 8),
                Text(
                  'الوضع التجريبي',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
