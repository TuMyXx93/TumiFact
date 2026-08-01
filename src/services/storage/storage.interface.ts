export interface StorageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
}

export interface StorageUploadResult {
  key: string;
  url: string;
  provider: 'local' | 's3' | 'r2';
}

export interface IStorageService {
  uploadFile(file: StorageFile, folder?: string): Promise<StorageUploadResult>;
  getFile(key: string): Promise<Buffer | null>;
  deleteFile(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
