import { buildQuery, request } from './client';

export interface DeviceTokenDto {
  token: string;
  platform?: 'ANDROID' | 'IOS' | 'WEB';
  deviceId?: string;
  appVersion?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function registerDeviceToken(dto: DeviceTokenDto): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function unregisterDeviceToken(token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/notifications/devices/${token}`, {
    method: 'DELETE',
  });
}

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  type?: string;
  unreadOnly?: boolean;
}): Promise<PaginatedNotifications> {
  return request<PaginatedNotifications>(`/notifications${buildQuery(params as any)}`);
}

export async function getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return request<{ unreadCount: number }>('/notifications/unread-count');
}

export async function markNotificationAsRead(id: string): Promise<AppNotification> {
  return request<AppNotification>(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
  return request<{ success: boolean; count: number }>('/notifications/read-all', {
    method: 'POST',
  });
}
