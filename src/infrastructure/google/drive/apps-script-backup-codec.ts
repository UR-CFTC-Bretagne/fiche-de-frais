import type { BackupCodec, DigestService } from '../../persistence/backup-archive';

/** Services de conversion et de hachage seulement. Aucun appel Drive ni archive non chiffrée stockée. */
export class AppsScriptBackupCodec implements BackupCodec {
  encode(text: string): Uint8Array {
    const bytes = Utilities.newBlob(text, 'application/json').getBytes();
    return Uint8Array.from(bytes.map(byte => byte & 0xff));
  }
  decode(bytes: Uint8Array): string {
    const blob = Utilities.newBlob(Array.from(bytes, byte => byte > 127 ? byte - 256 : byte));
    return blob.getDataAsString('UTF-8');
  }
}

export class AppsScriptSha256 implements DigestService {
  async sha256(bytes: Uint8Array): Promise<string> {
    const signed = Array.from(bytes, byte => byte > 127 ? byte - 256 : byte);
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, signed);
    return hash.map(byte => (byte & 0xff).toString(16).padStart(2, '0')).join('');
  }
}
