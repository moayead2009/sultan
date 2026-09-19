export type ProductionRuntimeConfig = {
  nodeEnv: string | undefined;
  nextAuthUrlExplicit: string | undefined;
  storageDriver: 'local' | 's3';
  objectStorageBucket?: string;
  objectStoragePublicUrl?: string;
};

export function assertProductionRuntimeRequirements(config: ProductionRuntimeConfig) {
  if (config.nodeEnv !== 'production') return;

  if (!config.nextAuthUrlExplicit?.trim()) {
    throw new Error('NEXTAUTH_URL must be explicitly configured in production.');
  }

  if (config.storageDriver === 's3') {
    if (!config.objectStorageBucket?.trim()) {
      throw new Error('OBJECT_STORAGE_BUCKET must be configured when STORAGE_DRIVER=s3.');
    }
    if (!config.objectStoragePublicUrl?.trim()) {
      throw new Error('OBJECT_STORAGE_PUBLIC_URL must be configured when STORAGE_DRIVER=s3.');
    }
  }
}
