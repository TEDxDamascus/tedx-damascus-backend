import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

const envSchema = Joi.object({
  MONGODB_URI: Joi.string().uri().required(),
  SUPABASE_PROJECT_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().min(1).required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(1).required(),
  SUPABASE_STORAGE_NAME: Joi.string().min(1).required(),
  JWT_SECRET: Joi.string().min(8).default('dev-secret-key'),
  JWT_EXPIRES_IN: Joi.string().min(2).default('7d'),
  PORT: Joi.number().port().default(3000),
})
  .prefs({ abortEarly: false, convert: true })
  .unknown(true);

function validateEnv(config: NodeJS.ProcessEnv) {
  const { value, error } = envSchema.validate(config);

  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return value as {
    MONGODB_URI: string;
    SUPABASE_PROJECT_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_STORAGE_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    PORT: number;
  };
}

export const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);

  return {
    mongodbUri: env.MONGODB_URI,
    supabaseProjectUrl: env.SUPABASE_PROJECT_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseStorageName: env.SUPABASE_STORAGE_NAME,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    port: env.PORT,
  };
});
