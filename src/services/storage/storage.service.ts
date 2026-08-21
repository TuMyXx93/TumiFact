import fs from 'fs';
import path from 'path';
import type { IStorageService, StorageFile, StorageUploadResult } from './storage.interface';

export class LocalStorageService implements IStorageService {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir?: string, baseUrl?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = baseUrl || '/static/uploads';
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async uploadFile(file: StorageFile, folder: string = ''): Promise<StorageUploadResult> {
    const targetDir = folder ? path.join(this.baseDir, folder) : this.baseDir;
    this.ensureDirectoryExists(targetDir);

    const fileExtension = path.extname(file.filename) || `.${file.mimetype.split('/')[1] || 'bin'}`;
    const cleanFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExtension}`;
    const filePath = path.join(targetDir, cleanFilename);

    await fs.promises.writeFile(filePath, file.buffer);

    const relativeKey = folder ? `${folder}/${cleanFilename}` : cleanFilename;

    return {
      key: relativeKey,
      url: `${this.baseUrl}/${relativeKey}`,
      provider: 'local',
    };
  }

  async getFile(key: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseDir, key);
      if (!fs.existsSync(filePath)) return null;
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

export class MockS3StorageService implements IStorageService {
  private inMemoryBucket = new Map<string, Buffer>();
  private bucketName: string;

  constructor(bucketName: string = 'tumifact-dev-bucket') {
    this.bucketName = bucketName;
  }

  async uploadFile(file: StorageFile, folder: string = ''): Promise<StorageUploadResult> {
    const key = folder
      ? `${folder}/${Date.now()}-${file.filename}`
      : `${Date.now()}-${file.filename}`;
    this.inMemoryBucket.set(key, file.buffer);

    return {
      key,
      url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      provider: 's3',
    };
  }

  async getFile(key: string): Promise<Buffer | null> {
    return this.inMemoryBucket.get(key) || null;
  }

  async deleteFile(key: string): Promise<boolean> {
    return this.inMemoryBucket.delete(key);
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
