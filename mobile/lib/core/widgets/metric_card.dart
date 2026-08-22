import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_typography.dart';
import 'modern_card.dart';

/// A modern KPI metric card displaying an icon, numerical value, and label.
class MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBgColor;
  final String? subtitle;
  final VoidCallback? onTap;

  const MetricCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.iconColor,
    this.iconBgColor,
    this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? AppColors.primary;
    final effectiveIconBgColor = iconBgColor ?? AppColors.primarySoft;

    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: effectiveIconBgColor,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  icon,
                  color: effectiveIconColor,
                  size: 20,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: AppTypography.label.copyWith(color: AppColors.textMuted),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTypography.kpiNumber,
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: AppTypography.secondaryMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
