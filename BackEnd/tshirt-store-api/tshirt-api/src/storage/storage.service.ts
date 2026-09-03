import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('AWS_S3_ENDPOINT');
    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: this.getCredentials(),
    });
  }

  async createProductImageUploadUrl(
    productId: number,
    filename: string,
    contentType: string,
  ) {
    const bucket = this.getBucket();
    const storageKey = this.buildProductImageKey(productId, filename);
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        ContentType: contentType,
      }),
      { expiresIn: 15 * 60 },
    );

    return {
      storageKey,
      publicUrl: this.buildPublicUrl(bucket, storageKey),
      uploadUrl,
      expiresInSeconds: 15 * 60,
    };
  }

  private getBucket() {
    const bucket = this.config.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new BadRequestException('AWS S3 storage is not configured');
    }
    return bucket;
  }

  private getCredentials() {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) return undefined;

    return { accessKeyId, secretAccessKey };
  }

  private buildProductImageKey(productId: number, filename: string) {
    const sanitizedFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `products/${productId}/${randomUUID()}-${sanitizedFilename || 'image'}`;
  }

  private buildPublicUrl(bucket: string, storageKey: string) {
    const publicBaseUrl = this.config.get<string>('AWS_S3_PUBLIC_BASE_URL');
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${storageKey}`;
    }

    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    return `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
  }
}
