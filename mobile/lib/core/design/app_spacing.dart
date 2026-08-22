import 'package:flutter/material.dart';

/// Centralized Spacing Tokens for Consistent Layout Rhythm
class AppSpacing {
  AppSpacing._();

  static const double xxxs = 2.0;
  static const double xxs = 4.0;
  static const double xs = 6.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;

  // Insets
  static const EdgeInsets pagePadding = EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0);
  static const EdgeInsets cardPadding = EdgeInsets.all(16.0);
  static const EdgeInsets compactCardPadding = EdgeInsets.symmetric(horizontal: 12.0, vertical: 10.0);
  static const EdgeInsets sectionMargin = EdgeInsets.only(bottom: 20.0);
}
