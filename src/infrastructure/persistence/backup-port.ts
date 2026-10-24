import type { BackupManifest } from './backup-manifest';

export interface BackupArchive {
  readonly manifest: BackupManifest;
  readonly payload: Uint8Array;
}

/**
 * Port de stockage : aucune API Google dépendante.
 * L'implémentation devra imposer chiffrement, accès limité et rétention.
 */
export interface BackupStore {
  write(archive: BackupArchive): Promise<void>;
  read(backupId: string): Promise<BackupArchive | null>;
}
