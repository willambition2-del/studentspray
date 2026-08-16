import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  REDIS_ALLOW_MEMORY_FALLBACK: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
  CORS_ORIGINS: Joi.string().required(),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  TRUST_PROXY: Joi.boolean().truthy('true').falsy('false').default(false),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().pattern(/^\d+[smhd]$/).default('15m'),
  JWT_ISSUER: Joi.string().min(3).max(100).default('quran-forum-api'),
  JWT_AUDIENCE: Joi.string().min(3).max(100).default('quran-forum-clients'),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  REFRESH_TOKEN_HASH_SECRET: Joi.string().min(32).required(),
  ARGON2_MEMORY_COST: Joi.number().integer().min(19456).max(262144).default(65536),
  ARGON2_TIME_COST: Joi.number().integer().min(2).max(10).default(3),
  ARGON2_PARALLELISM: Joi.number().integer().min(1).max(4).default(1),
  AUTH_MAX_FAILED_ATTEMPTS: Joi.number().integer().min(3).max(20).default(5),
  AUTH_LOCK_MINUTES: Joi.number().integer().min(1).max(1440).default(15),
  AUTH_RATE_LIMIT_ATTEMPTS: Joi.number().integer().min(3).max(100).default(10),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: Joi.number().integer().min(10).max(3600).default(60),
  AUTH_COOKIE_NAME: Joi.string().pattern(/^[A-Za-z0-9_-]+$/).default('qf_refresh'),
  AUTH_COOKIE_SAME_SITE: Joi.string().valid('strict', 'lax', 'none').default('strict'),
  FCM_ENABLED: Joi.boolean().truthy('true', '1').falsy('false', '0').default(false),
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').optional(),
});

export function parseCorsOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}
