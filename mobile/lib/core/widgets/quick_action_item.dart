import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_typography.dart';

/// Modern Quick Action Item (Supports compact and card layouts)
class QuickActionItem extends StatelessWidget {
  final String? label;
  final String? title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;
  final Color? bgColor;
  final Color? iconColor;
  final Color? iconBgColor;
  final String? badge;

  const QuickActionItem({
    super.key,
    this.label,
    this.title,
    this.subtitle,
    required this.icon,
    required this.onTap,
    this.color,
    this.bgColor,
    this.iconColor,
    this.iconBgColor,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = iconColor ?? color ?? AppColors.primary;
    final effectiveBgColor = iconBgColor ?? bgColor ?? AppColors.primarySoft;

    // Card style (with title + subtitle)
    if (title != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.border, width: 0.8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: effectiveBgColor,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(
                    icon,
                    color: effectiveColor,
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  title!,
                  style: AppTypography.bodyMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: AppTypography.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    // Compact style (with label)
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.border, width: 0.8),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: effectiveBgColor,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Icon(
                      icon,
                      color: effectiveColor,
                      size: 22,
                    ),
                  ),
                  if (badge != null)
                    Positioned(
                      top: -4,
                      left: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          badge!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                label ?? '',
                style: AppTypography.secondaryMedium.copyWith(
                  color: AppColors.textPrimary,
                  fontSize: 12.5,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
