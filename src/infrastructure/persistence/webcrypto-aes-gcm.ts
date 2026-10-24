import type { AuthenticatedCipher, EncryptedRecord } from './encrypted-backup-store';

function exactBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Prototype AES-256-GCM pour tests Node/Web Crypto.
 * La clé reste fournie par un gestionnaire externe et n'est jamais versionnée.
 * Ne constitue pas une intégration Google Apps Script.
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
      name: 'AES-GCM', iv: exactBuffer(nonce),
      additionalData: exactBuffer(associatedData), tagLength: 128,
    }, this.key, exactBuffer(plaintext));
    return { version: 1, nonce, ciphertext: new Uint8Array(ciphertext) };
  }

  async decrypt(record: EncryptedRecord, associatedData: Uint8Array): Promise<Uint8Array> {
    if (record.version !== 1 || record.nonce.length !== 12 || record.ciphertext.length < 16) {
      throw new Error('Format chiffré invalide');
    }
    const plaintext = await this.provider.subtle.decrypt({
      name: 'AES-GCM', iv: exactBuffer(record.nonce),
      additionalData: exactBuffer(associatedData), tagLength: 128,
    }, this.key, exactBuffer(record.ciphertext));
    return new Uint8Array(plaintext);
  }
}
