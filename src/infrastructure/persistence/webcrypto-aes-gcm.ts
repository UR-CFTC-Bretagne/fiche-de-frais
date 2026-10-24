import type { AuthenticatedCipher, EncryptedRecord } from './encrypted-backup-store';

/**
 * Implémentation Web Crypto AES-256-GCM.
 * La clé doit être fournie par un gestionnaire de clés extérieur à ce module.
 * Utilisable en tests Node, pas encore intégrée à Apps Script.
 */
export class WebCryptoAesGcm implements AuthenticatedCipher {
  constructor(private readonly key: CryptoKey, private readonly provider: Crypto = crypto) {
    if (key.algorithm.name !== 'AES-GCM' || !key.usages.includes('encrypt') || !key.usages.includes('decrypt')) {
      throw new Error('Clé AES-GCM non autorisée');
    }
  }

  async encrypt(plaintext: Uint8Array, associatedData: Uint8Array): Promise<EncryptedRecord> {
    const nonce = this.provider.getRandomValues(new Uint8Array(12));
    const ciphertext = await this.provider.subtle.encrypt({
      name: 'AES-GCM', iv: nonce, additionalData: associatedData, tagLength: 128,
    }, this.key, plaintext);
    return { version: 1, nonce, ciphertext: new Uint8Array(ciphertext) };
  }

  async decrypt(record: EncryptedRecord, associatedData: Uint8Array): Promise<Uint8Array> {
    if (record.version !== 1 || record.nonce.length !== 12 || record.ciphertext.length < 16) {
      throw new Error('Format chiffré invalide');
    }
    const plaintext = await this.provider.subtle.decrypt({
      name: 'AES-GCM', iv: record.nonce, additionalData: associatedData, tagLength: 128,
    }, this.key, record.ciphertext);
    return new Uint8Array(plaintext);
  }
}
