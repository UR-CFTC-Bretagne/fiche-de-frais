import type { Actor } from '../ports/actor';
import type { Attachment, AttachmentKind } from '../../domain/entities/attachment';
import type { PrivateAttachmentReader, AttachmentDigest } from '../ports/private-attachment-file';
import type { RegisterAttachment } from './register-attachment';

export interface RegisterVerifiedAttachmentInput {
  reportId: string;
  lineId: string | null;
  kind: AttachmentKind;
  privateFileRef: string;
}

function signatureMatches(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'application/pdf') {
    return bytes.length >= 5 && bytes[0] === 37 && bytes[1] === 80 &&
      bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45;
  }
  if (mime === 'image/png') {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    return bytes.length >= 8 && signature.every((value, index) => bytes[index] === value);
  }
  if (mime === 'image/jpeg') {
    return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 &&
      bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  }
  return false;
}

/**
 * Contrôle les octets lus depuis l'espace privé avant d'enregistrer les métadonnées.
 * La vérification de propriété et les droits du stockage restent de la responsabilité
 * de PrivateAttachmentReader ; un adaptateur non fiable invalide cette garantie.
 */
export class RegisterVerifiedAttachment {
  constructor(
    private readonly reader: PrivateAttachmentReader,
    private readonly digest: AttachmentDigest,
    private readonly registrar: RegisterAttachment,
  ) {}

  async execute(actor: Actor, input: RegisterVerifiedAttachmentInput): Promise<Attachment> {
    if (!actor.active || !actor.id.trim() || !actor.roles.includes('CLAIMANT')) {
      throw new Error('Accès refusé');
    }
    const file = await this.reader.readForOwner(input.privateFileRef, actor.id);
    if (!file) throw new Error('Justificatif privé introuvable ou accès refusé');
    if (file.bytes.length < 1 || file.bytes.length > 10 * 1024 * 1024 ||
        !signatureMatches(file.bytes, file.mediaType)) {
      throw new Error('Contenu ou format de justificatif invalide');
    }
    const sha256 = await this.digest.sha256(file.bytes);
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Empreinte calculée invalide');
    return this.registrar.execute(actor, {
      ...input, sha256, mediaType: file.mediaType, sizeBytes: file.bytes.length,
    });
  }
}
