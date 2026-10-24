import type { Attachment, AttachmentKind } from '../entities/attachment';

const types: readonly AttachmentKind[] = ['CONVOCATION', 'ATTENDANCE', 'RECEIPT', 'ITINERARY', 'OTHER'];
const idPattern = /^[a-zA-Z0-9_-]{1,100}$/;

export function validateAttachment(item: Attachment): void {
  if (!idPattern.test(item.id) || !idPattern.test(item.reportId) ||
      (item.lineId !== null && !idPattern.test(item.lineId)) ||
      !types.includes(item.kind)) throw new Error('Rattachement ou type de justificatif invalide');
  if (!/^[a-zA-Z0-9_-]{20,200}$/.test(item.privateFileRef)) throw new Error('Référence privée invalide');
  if (!/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error('Empreinte SHA-256 invalide');
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(item.mediaType)) {
    throw new Error('Format de justificatif non admis');
  }
  if (!Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 1 || item.sizeBytes > 10 * 1024 * 1024) {
    throw new Error('Taille de justificatif invalide');
  }
  if (!Number.isFinite(Date.parse(item.uploadedAt))) throw new Error('Date de dépôt invalide');
}

/** Ne vérifie que les métadonnées, jamais l'existence du document externe. */
export function validateAttachmentOwnership(
  item: Attachment,
  reportId: string,
  linkedLineIds: readonly string[],
): void {
  validateAttachment(item);
  if (item.reportId !== reportId ||
      (item.lineId !== null && !linkedLineIds.includes(item.lineId))) {
    throw new Error('Justificatif rattaché à une autre note ou ligne');
  }
}
