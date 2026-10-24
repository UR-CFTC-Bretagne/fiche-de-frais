import type { BackupContent } from './backup-archive';

/**
 * Cible de restauration atomique.
 * L'implémentation doit vérifier et écrire sous une même section critique.
 */
export interface RestoreTarget {
  restoreIfEmpty(content: BackupContent): Promise<void>;
}

/** Cible fictive : remplacement atomique en mémoire, aucune API Google. */
export class InMemoryRestoreTarget implements RestoreTarget {
  private data: BackupContent | null = null;

  async restoreIfEmpty(content: BackupContent): Promise<void> {
    if (this.data !== null) throw new Error('La cible de restauration est déjà occupée');
    const copy: BackupContent = JSON.parse(JSON.stringify(content)) as BackupContent;
    this.data = copy;
  }

  snapshot(): BackupContent | null {
    return this.data ? JSON.parse(JSON.stringify(this.data)) as BackupContent : null;
  }
}
