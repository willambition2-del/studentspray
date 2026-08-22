import 'package:flutter/material.dart';
import '../design/app_colors.dart';
import '../design/app_radius.dart';
import '../design/app_typography.dart';

/// Modern, integrated header with User Greeting, Role Badge, and Action Buttons.
class AppHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? avatarInitials;
  final int unreadNotificationsCount;
  final int unreadChatCount;
  final VoidCallback? onNotificationsTap;
  final VoidCallback? onChatTap;
  final VoidCallback? onProfileTap;

  const AppHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.avatarInitials,
    this.unreadNotificationsCount = 0,
    this.unreadChatCount = 0,
    this.onNotificationsTap,
    this.onChatTap,
    this.onProfileTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // User Avatar & Greeting
          Expanded(
            child: Row(
              children: [
                GestureDetector(
                  onTap: onProfileTap,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: AppColors.border, width: 0.8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      avatarInitials ?? (title.isNotEmpty ? title[0] : 'ق'),
                      style: AppTypography.sectionTitle.copyWith(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: AppTypography.heroGreeting,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: AppTypography.secondary,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Actions (Chat & Notifications)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (onChatTap != null)
                _HeaderIconButton(
                  icon: Icons.chat_bubble_outline,
                  badgeCount: unreadChatCount,
                  onTap: onChatTap!,
                ),
              if (onNotificationsTap != null) ...[
                const SizedBox(width: 8),
                _HeaderIconButton(
                  icon: Icons.notifications_outlined,
                  badgeCount: unreadNotificationsCount,
                  onTap: onNotificationsTap!,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final int badgeCount;
  final VoidCallback onTap;

  const _HeaderIconButton({
    required this.icon,
    required this.badgeCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border, width: 0.8),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(icon, size: 20, color: AppColors.textPrimary),
              if (badgeCount > 0)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                    child: badgeCount > 1
                        ? Text(
                            badgeCount > 9 ? '+9' : '$badgeCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
