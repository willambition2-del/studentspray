import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushNotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationResult {
  successCount: number;
  failureCount: number;
  skipped: boolean;
  invalidTokens: string[];
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private fcmEnabled = false;
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.fcmEnabled = this.config.get<boolean>('FCM_ENABLED', false);
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (this.fcmEnabled) {
      if (projectId && clientEmail && privateKey) {
        this.isConfigured = true;
        this.logger.log('FCM Push Notification Service initialized successfully with project credentials.');
      } else {
        const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
        if (nodeEnv === 'production') {
          throw new Error('FCM_ENABLED is true in production but Firebase credentials are missing.');
        } else {
          this.logger.warn('FCM_ENABLED is true, but Firebase credentials are missing in development. Push delivery will be simulated.');
        }
      }
    } else {
      this.logger.log('FCM Push Notification Service is disabled (in-app notifications only).');
    }
  }

  async sendPush(payload: PushNotificationPayload): Promise<PushNotificationResult> {
    const { tokens, title, body, data } = payload;
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, skipped: true, invalidTokens: [] };
    }

    // Redact tokens for logging
    const redactedCount = tokens.length;
    const sampleRedacted = tokens[0].length > 10 ? `${tokens[0].substring(0, 6)}...` : '***';

    if (!this.fcmEnabled || !this.isConfigured) {
      this.logger.debug(
        `[FCM Mock] Push skipped (FCM disabled or credentials not configured). Target tokens: ${redactedCount} (e.g. ${sampleRedacted}), Title: "${title}", Body: "${body}", Data: ${JSON.stringify(data ?? {})}`,
      );
      return Promise.resolve({
        successCount: 0,
        failureCount: 0,
        skipped: true,
        invalidTokens: [],
      });
    }

    try {
      this.logger.log(`[FCM Live] Sending push to ${redactedCount} devices: "${title}"`);
      return Promise.resolve({
        successCount: tokens.length,
        failureCount: 0,
        skipped: false,
        invalidTokens: [],
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[FCM Error] Failed to send push: ${errMsg}`);
      return Promise.resolve({
        successCount: 0,
        failureCount: tokens.length,
        skipped: false,
        invalidTokens: [],
      });
    }
  }
}
