import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_typography.dart';

/// Semantic, soft-toned Status Chip
class StatusChip extends StatelessWidget {
  final String label;
  final Color textColor;
  final Color backgroundColor;
  final IconData? icon;
  final EdgeInsetsGeometry padding;

  const StatusChip({
    super.key,
    required this.label,
    required this.textColor,
    required this.backgroundColor,
    this.icon,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  });

  factory StatusChip.present({String label = 'حاضر'}) {
    return StatusChip(
      label: label,
      textColor: AppColors.statusPresent,
      backgroundColor: AppColors.statusPresentBg,
      icon: Icons.check_circle,
    );
  }

  factory StatusChip.absent({String label = 'غائب'}) {
    return StatusChip(
      label: label,
      textColor: AppColors.statusAbsent,
      backgroundColor: AppColors.statusAbsentBg,
      icon: Icons.cancel,
    );
  }

  factory StatusChip.late({String label = 'متأخر'}) {
    return StatusChip(
      label: label,
      textColor: AppColors.statusLate,
      backgroundColor: AppColors.statusLateBg,
      icon: Icons.access_time,
    );
  }

  factory StatusChip.excused({String label = 'بعذر'}) {
    return StatusChip(
      label: label,
      textColor: AppColors.statusExcused,
      backgroundColor: AppColors.statusExcusedBg,
      icon: Icons.info_outline,
    );
  }

  factory StatusChip.success({required String label, IconData? icon}) {
    return StatusChip(
      label: label,
      textColor: AppColors.success,
      backgroundColor: AppColors.successSoft,
      icon: icon,
    );
  }

  factory StatusChip.warning({required String label, IconData? icon}) {
    return StatusChip(
      label: label,
      textColor: AppColors.warning,
      backgroundColor: AppColors.warningSoft,
      icon: icon,
    );
  }

  factory StatusChip.info({required String label, IconData? icon}) {
    return StatusChip(
      label: label,
      textColor: AppColors.info,
      backgroundColor: AppColors.infoSoft,
      icon: icon,
    );
  }

  factory StatusChip.neutral({required String label, IconData? icon}) {
    return StatusChip(
      label: label,
      textColor: AppColors.textSecondary,
      backgroundColor: AppColors.surfaceMuted,
      icon: icon,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: AppTypography.fontFamily,
              color: textColor,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
