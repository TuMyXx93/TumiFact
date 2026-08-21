export * from './storage.interface';
export * from './storage.service';

import type { IStorageService } from './storage.interface';
import { LocalStorageService, MockS3StorageService } from './storage.service';

const provider = process.env.STORAGE_PROVIDER || 'local';

export const storageService: IStorageService =
  provider === 's3'
    ? new MockS3StorageService(process.env.STORAGE_BUCKET || 'tumifact-bucket')
    : new LocalStorageService();
