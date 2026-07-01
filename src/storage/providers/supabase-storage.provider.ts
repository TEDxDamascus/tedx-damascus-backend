import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '../../common/config/app.config';
import { StorageProvider, StorageUploadArgs } from './storage-provider.interface';

@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  readonly driver = 'supabase' as const;

  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    const url = this.config.supabaseProjectUrl;
    const key = this.config.supabaseAnonKey;
    const bucket = this.config.supabaseStorageName;

    if (!url || !key || !bucket) {
      throw new Error(
        'Missing Supabase config: SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, and SUPABASE_STORAGE_NAME must be set',
      );
    }

    this.supabase = createClient(url, key);
    this.bucket = bucket;
  }

  async upload_object(args: StorageUploadArgs): Promise<{ key: string }> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(args.key, args.body, {
        contentType: args.content_type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return { key: args.key };
  }

  async ensure_prefix(_prefix: string): Promise<void> {
    return;
  }

  get_public_url(key: string): string {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }
}

