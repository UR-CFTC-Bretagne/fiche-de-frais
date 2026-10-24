import type { Attachment } from '../../domain/entities/attachment';

/**
 * Attestation de stockage renvoyée UNIQUEMENT par une infrastructure serveur.
 * Le client ne peut ni émettre ni modifier une telle attestation.
 */
export interface VerifiedStoredAttachment {
  readonly privateFileRef: string;
  readonly reportId: string;
  readonly uploadedByActorId: string;
  readonly sha256: string;
  readonly mediaType: Attachment['mediaType'];
  readonly sizeBytes: number;
}

/**
 * Port de confiance : vérifie existence, origine, accès, octets et empreinte.
 * Une implémentation réelle doit valider le contenu avant toute attestation.
 */
export interface StoredAttachmentVerifier {
  verify(privateFileRef: string): Promise<VerifiedStoredAttachment | null>;
}
