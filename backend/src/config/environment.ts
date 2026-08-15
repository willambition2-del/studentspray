import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  CORS_ORIGINS: Joi.string().required(),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  TRUST_PROXY: Joi.boolean().truthy('true').falsy('false').default(false),
});

export function parseCorsOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}
