import { describe, expect, it } from 'vitest';
import { assertProductionRuntimeRequirements } from '@/lib/runtime-requirements';

describe('Phase 1 production runtime requirements', () => {
  it('permits local storage outside production', () => {
    expect(() => assertProductionRuntimeRequirements({
      nodeEnv: 'development',
      nextAuthUrlExplicit: undefined,
      storageDriver: 'local'
    })).not.toThrow();
  });

  it('requires an explicit NEXTAUTH_URL in production', () => {
    expect(() => assertProductionRuntimeRequirements({
      nodeEnv: 'production',
      nextAuthUrlExplicit: undefined,
      storageDriver: 's3',
      objectStorageBucket: 'media',
      objectStoragePublicUrl: 'https://media.example.test'
    })).toThrow(/NEXTAUTH_URL/);
  });

  it('rejects local production storage and incomplete object storage configuration', () => {
    expect(() => assertProductionRuntimeRequirements({
      nodeEnv: 'production',
      nextAuthUrlExplicit: 'https://example.test',
      storageDriver: 'local',
      objectStorageBucket: 'media',
      objectStoragePublicUrl: 'https://media.example.test'
    })).toThrow(/STORAGE_DRIVER=s3/);

    expect(() => assertProductionRuntimeRequirements({
      nodeEnv: 'production',
      nextAuthUrlExplicit: 'https://example.test',
      storageDriver: 's3'
    })).toThrow(/OBJECT_STORAGE_BUCKET/);
  });

  it('accepts explicit object storage in production', () => {
    expect(() => assertProductionRuntimeRequirements({
      nodeEnv: 'production',
      nextAuthUrlExplicit: 'https://example.test',
      storageDriver: 's3',
      objectStorageBucket: 'media',
      objectStoragePublicUrl: 'https://media.example.test'
    })).not.toThrow();
  });
});
