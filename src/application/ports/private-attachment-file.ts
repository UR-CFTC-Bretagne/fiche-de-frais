/** Lecture de fichier privé depuis un contexte serveur uniquement. */
export interface PrivateAttachmentFile {
  readonly bytes: Uint8Array;
  readonly mediaType: 'application/pdf' | 'image/jpeg' | 'image/png';
}

/**
 * Résolution privée d'une pièce déjà déposée et associée au demandeur.
 * Une référence fournie par le navigateur ne constitue PAS une autorisation.
 */
export interface PrivateAttachmentReader {
  readForOwner(fileRef: string, ownerId: string): Promise<PrivateAttachmentFile | null>;
}

export interface AttachmentDigest {
  sha256(bytes: Uint8Array): Promise<string>;
}
