import type { PrivateAttachmentFile } from '../../../application/ports/private-attachment-file';
import type { PrivateDriveGateway } from './private-drive-attachment-reader';

/**
 * Prototype non déployé. Vérification du rattachement direct au dossier privé.
 * La preuve d'appartenance au mandaté relève du registre de liaison serveur.
 */
export class AppsScriptPrivateAttachmentGateway implements PrivateDriveGateway {
  async readFromFolder(fileId: string, folderId: string): Promise<PrivateAttachmentFile | null> {
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(fileId) ||
        !/^[A-Za-z0-9_-]{20,200}$/.test(folderId)) return null;
    const folder = DriveApp.getFolderById(folderId);
    if (folder.isTrashed()) return null;
    const file = DriveApp.getFileById(fileId);
    if (file.isTrashed()) return null;
    const parents = file.getParents();
    let matches = 0;
    while (parents.hasNext()) {
      if (parents.next().getId() === folderId) matches += 1;
    }
    if (matches !== 1 || file.getSize() < 1 || file.getSize() > 10 * 1024 * 1024) return null;
    const mime = file.getMimeType();
    if (mime !== 'application/pdf' && mime !== 'image/jpeg' && mime !== 'image/png') return null;
    const bytes = Uint8Array.from(file.getBlob().getBytes().map(value => value & 255));
    if (bytes.length < 1 || bytes.length > 10 * 1024 * 1024) return null;
    return { bytes, mediaType: mime };
  }
}
