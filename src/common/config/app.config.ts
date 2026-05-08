import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

const envSchema = Joi.object({
  MONGODB_URI: Joi.string().uri().required(),
  STORAGE_DRIVER: Joi.string().valid('supabase', 'minio').default('minio'),
  SUPABASE_PROJECT_URL: Joi.string()
    .uri()
    .when('STORAGE_DRIVER', { is: 'supabase', then: Joi.required() }),
  SUPABASE_ANON_KEY: Joi.string()
    .min(1)
    .when('STORAGE_DRIVER', { is: 'supabase', then: Joi.required() }),
  SUPABASE_STORAGE_NAME: Joi.string()
    .min(1)
    .when('STORAGE_DRIVER', { is: 'supabase', then: Joi.required() }),
  MINIO_ENDPOINT: Joi.string()
    .uri()
    .when('STORAGE_DRIVER', { is: 'minio', then: Joi.required() }),
  MINIO_USERNAME: Joi.string()
    .min(1)
    .when('STORAGE_DRIVER', { is: 'minio', then: Joi.required() }),
  MINIO_PASSWORD: Joi.string()
    .min(1)
    .when('STORAGE_DRIVER', { is: 'minio', then: Joi.required() }),
  MINIO_BUCKET: Joi.string()
    .min(1)
    .when('STORAGE_DRIVER', { is: 'minio', then: Joi.required() }),
  JWT_SECRET: Joi.string().min(8).default('dev-secret-key'),
  JWT_EXPIRES_IN: Joi.string().min(2).default('7d'),
  PORT: Joi.number().port().default(3000),
  PUBLIC_SITE_URL: Joi.string().uri().default('http://localhost:3000'),
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
    STORAGE_DRIVER: 'supabase' | 'minio';
    SUPABASE_PROJECT_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_STORAGE_NAME: string;
    MINIO_ENDPOINT: string;
    MINIO_USERNAME: string;
    MINIO_PASSWORD: string;
    MINIO_BUCKET: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    PORT: number;
    PUBLIC_SITE_URL: string;
  };
}

export const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);

  return {
    mongodbUri: env.MONGODB_URI,
    storageDriver: env.STORAGE_DRIVER,
    supabaseProjectUrl: env.SUPABASE_PROJECT_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseStorageName: env.SUPABASE_STORAGE_NAME,
    minioEndpoint: env.MINIO_ENDPOINT,
    minioUsername: env.MINIO_USERNAME,
    minioPassword: env.MINIO_PASSWORD,
    minioBucket: env.MINIO_BUCKET,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    port: env.PORT,
    publicSiteUrl: env.PUBLIC_SITE_URL.replace(/\/$/, ''),
  };
});
