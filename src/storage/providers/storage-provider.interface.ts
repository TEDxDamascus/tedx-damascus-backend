export type StorageUploadArgs = {
  key: string;
  body: Buffer;
  content_type: string;
};

export interface StorageProvider {
  readonly driver: 'supabase' | 'minio';

  upload_object(args: StorageUploadArgs): Promise<{ key: string }>;

  /**
   * S3-like stores don't have real folders. This can be a no-op or create
   * a placeholder object like `prefix/` if you want explicit folder creation.
   */
  ensure_prefix(prefix: string): Promise<void>;

  get_public_url(key: string): string;
}

