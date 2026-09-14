import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(16),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(16),
  JWT_REFRESH_EXPIRATION: Joi.string().default('24h'),
  ALLOWED_ORIGINS: Joi.string().default('*'),
});
