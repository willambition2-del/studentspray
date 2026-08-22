import 'package:flutter/material.dart';

/// Centralized Design System Color Tokens for STUDENTSPRAY
class AppColors {
  AppColors._();

  // Primary Palette — Deep Emerald / Teal-Green
  static const Color primary = Color(0xFF0F6E50);
  static const Color primaryDark = Color(0xFF0A4D38);
  static const Color primaryLight = Color(0xFF1E8A68);
  static const Color primarySoft = Color(0xFFE8F5F0);
  static const Color primarySubtle = Color(0xFFF0FAF6);

  // Secondary & Accents
  static const Color secondary = Color(0xFF148A72);
  static const Color secondarySoft = Color(0xFFE6F5F2);
  static const Color accentGold = Color(0xFFD4AF37);
  static const Color accentGoldDark = Color(0xFFB38F24);
  static const Color accentGoldSoft = Color(0xFFFDF8E8);

  // Background & Surfaces
  static const Color background = Color(0xFFF6F8F7);
  static const Color surface = Colors.white;
  static const Color surfaceElevated = Colors.white;
  static const Color surfaceMuted = Color(0xFFEFF3F1);

  // Neutral & Text Hierarchy
  static const Color textPrimary = Color(0xFF192420);
  static const Color textSecondary = Color(0xFF566961);
  static const Color textMuted = Color(0xFF8A9C94);
  static const Color textDisabled = Color(0xFFB5C2BC);

  // Borders & Dividers
  static const Color border = Color(0xFFE5ECE8);
  static const Color borderLight = Color(0xFFEEF3F0);
  static const Color divider = Color(0xFFEAEFEA);

  // Semantic Status Colors
  static const Color success = Color(0xFF168053);
  static const Color successSoft = Color(0xFFE7F7EF);
  static const Color warning = Color(0xFFD97706);
  static const Color warningSoft = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFDC2626);
  static const Color errorSoft = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF0284C7);
  static const Color infoSoft = Color(0xFFE0F2FE);

  // Attendance Statuses
  static const Color statusPresent = Color(0xFF168053);
  static const Color statusPresentBg = Color(0xFFE7F7EF);
  static const Color statusAbsent = Color(0xFFDC2626);
  static const Color statusAbsentBg = Color(0xFFFEE2E2);
  static const Color statusLate = Color(0xFFD97706);
  static const Color statusLateBg = Color(0xFFFEF3C7);
  static const Color statusExcused = Color(0xFF0284C7);
  static const Color statusExcusedBg = Color(0xFFE0F2FE);
}
