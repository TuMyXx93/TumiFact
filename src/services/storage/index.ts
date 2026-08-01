export * from './storage.interface';
export * from './storage.service';

import { LocalStorageService, MockS3StorageService } from './storage.service';
import { IStorageService } from './storage.interface';

const provider = process.env.STORAGE_PROVIDER || 'local';

export const storageService: IStorageService = provider === 's3' 
  ? new MockS3StorageService(process.env.STORAGE_BUCKET || 'tumifact-bucket') 
  : new LocalStorageService();
