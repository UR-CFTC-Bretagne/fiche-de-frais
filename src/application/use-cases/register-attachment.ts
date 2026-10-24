import type { Attachment, AttachmentKind } from '../../domain/entities/attachment';
import { validateAttachmentOwnership } from '../../domain/services/attachments';
import { hasRole, type Actor } from '../ports/actor';
import type { ExpenseReportRepository } from '../ports/expense-report-repository';
import type { ExpenseLineRepository } from '../ports/expense-line-repository';
import type { AttachmentRepository } from '../ports/attachment-repository';
import type { IdGenerator } from '../ports/id-generator';
import type { Clock } from '../ports/clock';
import type { StoredAttachmentVerifier } from '../ports/stored-attachment-verifier';

export interface RegisterAttachmentInput {
  reportId: string;
  lineId: string | null;
  kind: AttachmentKind;
  privateFileRef: string;
  sha256: string;
  mediaType: Attachment['mediaType'];
  sizeBytes: number;
}

/**
 * Référence uniquement des métadonnées après contrôle du propriétaire.
 * La preuve de dépôt, la lecture réelle, l'antivirus et les droits Drive
 * devront être garantis par une infrastructure serveur distincte.
 */
export class RegisterAttachment {
  constructor(
    private readonly reports: ExpenseReportRepository,
    private readonly lines: ExpenseLineRepository,
    private readonly attachments: AttachmentRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly verifier: StoredAttachmentVerifier,
  ) {}

  async execute(actor: Actor, input: RegisterAttachmentInput): Promise<Attachment> {
    if (!hasRole(actor, 'CLAIMANT') || !actor.id.trim()) throw new Error('Accès refusé');
    const report = await this.reports.findById(input.reportId);
    if (!report || report.claimantId !== actor.id) throw new Error('Accès refusé');
    if (report.status !== 'DRAFT') throw new Error('Note non modifiable');
    const lines = await this.lines.findByReportId(report.id);
    const verified = await this.verifier.verify(input.privateFileRef);
    if (!verified || verified.privateFileRef !== input.privateFileRef ||
        verified.reportId !== report.id || verified.uploadedByActorId !== actor.id ||
        verified.sha256 !== input.sha256 || verified.mediaType !== input.mediaType ||
        verified.sizeBytes !== input.sizeBytes) {
      throw new Error('Justificatif non vérifié dans le stockage privé');
    }
    const attachment: Attachment = {
      id: this.ids.nextId(),
      reportId: report.id,
      lineId: input.lineId,
      kind: input.kind,
      privateFileRef: input.privateFileRef,
      sha256: verified.sha256,
      mediaType: verified.mediaType,
      sizeBytes: verified.sizeBytes,
      uploadedAt: this.clock.nowIso(),
    };
    validateAttachmentOwnership(attachment, report.id, lines.map(line => line.id));
    await this.attachments.saveIfAbsent(attachment);
    return { ...attachment };
  }
}
