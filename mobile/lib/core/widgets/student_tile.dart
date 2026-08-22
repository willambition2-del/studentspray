import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_typography.dart';
import 'modern_card.dart';

/// Modern Student Row Tile
class StudentTile extends StatelessWidget {
  final String name;
  final String? studentNumber;
  final String? halaqaName;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? avatarBgColor;
  final Color? avatarTextColor;

  const StudentTile({
    super.key,
    required this.name,
    this.studentNumber,
    this.halaqaName,
    this.trailing,
    this.onTap,
    this.avatarBgColor,
    this.avatarTextColor,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0] : 'ط';

    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: avatarBgColor ?? AppColors.primarySoft,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: AppTypography.sectionTitle.copyWith(
                color: avatarTextColor ?? AppColors.primaryDark,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Student Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: AppTypography.bodyMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    if (studentNumber != null) ...[
                      Text(
                        studentNumber!,
                        style: AppTypography.label,
                      ),
                      if (halaqaName != null) ...[
                        const SizedBox(width: 6),
                        const Text('•', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                        const SizedBox(width: 6),
                      ],
                    ],
                    if (halaqaName != null)
                      Flexible(
                        child: Text(
                          halaqaName!,
                          style: AppTypography.label.copyWith(color: AppColors.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Action / Trailing
          if (trailing != null) ...[
            const SizedBox(width: 8),
            trailing!,
          ] else if (onTap != null) ...[
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_back_ios,
              size: 14,
              color: AppColors.textMuted,
            ),
          ],
        ],
      ),
    );
  }
}
