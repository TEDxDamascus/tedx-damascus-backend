import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Client } from 'minio';
import { appConfig } from '../../common/config/app.config';
import { StorageProvider, StorageUploadArgs } from './storage-provider.interface';

function join_url(base: string, ...parts: string[]): string {
  const normalized_base = base.replace(/\/+$/, '');
  const normalized_parts = parts
    .filter(Boolean)
    .map((p) => p.replace(/^\/+/, '').replace(/\/+$/, ''));
  return [normalized_base, ...normalized_parts].join('/');
}

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  readonly driver = 'minio' as const;

  private readonly client: Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    const endpoint = this.config.minioEndpoint;
    const username = this.config.minioUsername;
    const password = this.config.minioPassword;
    const bucket = this.config.minioBucket;

    if (!endpoint || !username || !password || !bucket) {
      throw new Error(
        'Missing MinIO config: MINIO_ENDPOINT, MINIO_USERNAME, MINIO_PASSWORD, and MINIO_BUCKET must be set',
      );
    }

    const url = new URL(endpoint);

    this.client = new Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
      useSSL: url.protocol === 'https:',
      accessKey: username,
      secretKey: password,
    });

    this.bucket = bucket;
    this.endpoint = endpoint;
  }

  async upload_object(args: StorageUploadArgs): Promise<{ key: string }> {
    const meta = {
      'Content-Type': args.content_type,
    };

    await this.client.putObject(
      this.bucket,
      args.key,
      args.body,
      args.body.length,
      meta,
    );

    return { key: args.key };
  }

  async ensure_prefix(prefix: string): Promise<void> {
    const key = prefix.endsWith('/') ? prefix : `${prefix}/`;

    // Create a 0-byte placeholder object so UIs can show the folder.
    // If the bucket is public, this also makes the prefix discoverable.
    await this.client.putObject(this.bucket, key, Buffer.from(''), 0);
  }

  get_public_url(key: string): string {
    return join_url(this.endpoint, this.bucket, key);
  }
}

