import type { OpaqueObjectGateway } from './drive-encrypted-record-repository';

/**
 * Prototype DriveApp non déployé.
 * Autorisations Drive et emplacement de sauvegarde à valider avant intégration.
 *
 * Attention : le verrou est propre au projet Apps Script. Un écrivain externe
 * au projet ou un accès direct au dossier peuvent contourner l'unicité.
 */
export class AppsScriptOpaqueObjectGateway implements OpaqueObjectGateway {
  constructor(private readonly folderId: string) {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(folderId)) {
      throw new Error('Identifiant du dossier d’archives invalide');
    }
  }

  private folder(): GoogleAppsScript.Drive.Folder {
    const folder = DriveApp.getFolderById(this.folderId);
    if (folder.isTrashed()) throw new Error('Dossier Drive indisponible');
    return folder;
  }

  putIfAbsent(objectKey: string, bytes: Uint8Array): void {
    if (!/^backup_[A-Za-z0-9_-]{8,100}\.bin$/.test(objectKey)) {
      throw new Error('Nom d’archive invalide');
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(20_000);
    try {
      const folder = this.folder();
      if (folder.getFilesByName(objectKey).hasNext()) {
        throw new Error('Archive déjà existante');
      }
      const signed = Array.from(bytes, b => b > 127 ? b - 256 : b);
      folder.createFile(Utilities.newBlob(signed, 'application/octet-stream', objectKey));
    } finally {
      lock.releaseLock();
    }
  }

  get(objectKey: string): Uint8Array | null {
    if (!/^backup_[A-Za-z0-9_-]{8,100}\.bin$/.test(objectKey)) {
      throw new Error('Nom d’archive invalide');
    }
    const matches = this.folder().getFilesByName(objectKey);
    if (!matches.hasNext()) return null;
    const file = matches.next();
    if (matches.hasNext()) throw new Error('Archives Drive en doublon');
    return Uint8Array.from(file.getBlob().getBytes().map(b => b & 0xff));
  }
}
