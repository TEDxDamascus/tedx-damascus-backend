/**
 * Central env key names so all modules use the same keys and avoid magic strings.
 * ConfigService.get() is still used; this only defines what keys to read.
 */
export const CONFIG_KEYS = {
  SUPABASE_PROJECT_URL: 'SUPABASE_PROJECT_URL',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
  SUPABASE_STORAGE_NAME: 'SUPABASE_STORAGE_NAME',
} as const;

export type ConfigKeys = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
