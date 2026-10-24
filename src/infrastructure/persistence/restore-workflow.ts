import type { BackupArchive } from './backup-port';
import type { BackupCodec, BackupContent, DigestService } from './backup-archive';
import { verifyBackup } from './backup-archive';
import type { RestoreTarget } from './restore-target';

export interface RestoreApproval {
  readonly approved: boolean;
  readonly actorId: string;
  readonly changeTicket: string;
}

/**
 * Vérifie l'archive avant écriture. L'absence de données en cible
 * doit toujours être recontrôlée atomiquement par RestoreTarget.
 * Usage actuel : tests sur données fictives seulement.
 */
export class RestoreWorkflow {
  constructor(
    private readonly codec: BackupCodec,
    private readonly digest: DigestService,
    private readonly target: RestoreTarget,
  ) {}

  async execute(
    archive: BackupArchive,
    expectedSchema: number,
    approval: RestoreApproval,
  ): Promise<BackupContent> {
    if (!approval.approved || !approval.actorId.trim() || !approval.changeTicket.trim()) {
      throw new Error('Restauration non autorisée');
    }
    const content = await verifyBackup(
      archive, expectedSchema,
      { ...approval, targetIsEmpty: true },
      this.codec, this.digest,
    );
    await this.target.restoreIfEmpty(content);
    return content;
  }
}
