import type { PrivateAttachmentFile, PrivateAttachmentReader } from '../../../application/ports/private-attachment-file';

export interface PrivateFileBinding {
  readonly fileId: string;
  readonly ownerId: string;
  readonly folderId: string;
}

/** Registre privé alimenté par le serveur, jamais depuis les paramètres client. */
export interface PrivateFileBindingDirectory {
  resolve(fileId: string): Promise<PrivateFileBinding | null>;
}
export interface PrivateDriveGateway {
  readFromFolder(fileId: string, folderId: string): Promise<PrivateAttachmentFile | null>;
}

const idPattern = /^[A-Za-z0-9_-]{20,200}$/;

/** Autorise la lecture uniquement si le registre ET le dossier Drive concordent. */
export class PrivateDriveAttachmentReader implements PrivateAttachmentReader {
  constructor(
    private readonly bindings: PrivateFileBindingDirectory,
    private readonly drive: PrivateDriveGateway,
    private readonly allowedFolderId: string,
  ) {
    if (!idPattern.test(allowedFolderId)) throw new Error('Dossier privé non configuré');
  }

  async readForOwner(fileRef: string, ownerId: string): Promise<PrivateAttachmentFile | null> {
    if (!idPattern.test(fileRef) || !ownerId.trim()) return null;
    const binding = await this.bindings.resolve(fileRef);
    if (!binding || binding.fileId !== fileRef || binding.ownerId !== ownerId ||
        binding.folderId !== this.allowedFolderId) return null;
    const file = await this.drive.readFromFolder(fileRef, binding.folderId);
    if (!file || file.bytes.length < 1 || file.bytes.length > 10 * 1024 * 1024) return null;
    return { bytes: Uint8Array.from(file.bytes), mediaType: file.mediaType };
  }
}
