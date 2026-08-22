import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_shadows.dart';

/// A modern, clean surface card with subtle border and gentle shadow.
class ModernCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Color? borderColor;
  final double? borderRadius;
  final bool hasBorder;
  final bool hasShadow;

  const ModernCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.onTap,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius,
    this.hasBorder = true,
    this.hasShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius ?? AppRadius.lg);

    Widget content = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: radius,
        border: hasBorder
            ? Border.all(
                color: borderColor ?? AppColors.border,
                width: 0.8,
              )
            : null,
        boxShadow: hasShadow ? AppShadows.card : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );

    return content;
  }
}
