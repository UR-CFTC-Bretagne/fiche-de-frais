import { describe, expect, it } from 'vitest';
import {
  PrivateDriveAttachmentReader,
  type PrivateDriveGateway,
  type PrivateFileBindingDirectory,
} from '../../src/infrastructure/google/drive/private-drive-attachment-reader';
const folder = 'test-folder-private-00001';
const fileId = 'file-fictif-prive-00001';
const bytes = new TextEncoder().encode('%PDF-1.4');
function scenario(owner = 'fictif-a', folderId = folder) {
  let calls = 0;
  const bindings: PrivateFileBindingDirectory = {
    resolve: async id => id === fileId ? { fileId, ownerId: owner, folderId } : null,
  };
  const drive: PrivateDriveGateway = {
    readFromFolder: async () => { calls++; return { bytes, mediaType: 'application/pdf' }; },
  };
  return { reader: new PrivateDriveAttachmentReader(bindings, drive, folder), calls: () => calls };
}
describe('lecture privée Drive, sans accès externe', () => {
  it('autorise une correspondance explicite et clone les octets', async () => {
    const { reader } = scenario();
    const found = await reader.readForOwner(fileId, 'fictif-a');
    expect(found?.bytes).toEqual(bytes);
    expect(found?.bytes).not.toBe(bytes);
  });
  it('refuse un propriétaire différent sans interroger Drive', async () => {
    const fixture = scenario();
    expect(await fixture.reader.readForOwner(fileId, 'fictif-b')).toBeNull();
    expect(fixture.calls()).toBe(0);
  });
  it('refuse une liaison vers un autre dossier', async () => {
    const fixture = scenario('fictif-a', 'autre-dossier-prive-00001');
    expect(await fixture.reader.readForOwner(fileId, 'fictif-a')).toBeNull();
    expect(fixture.calls()).toBe(0);
  });
  it('refuse une référence malformée', async () => {
    const fixture = scenario();
    expect(await fixture.reader.readForOwner('../un-fichier', 'fictif-a')).toBeNull();
    expect(fixture.calls()).toBe(0);
  });
  it('refuse une pièce dépassant le plafond', async () => {
    const bindings: PrivateFileBindingDirectory = {
      resolve: async () => ({ fileId, ownerId: 'fictif-a', folderId: folder }),
    };
    const drive: PrivateDriveGateway = {
      readFromFolder: async () => ({ bytes: new Uint8Array(10 * 1024 * 1024 + 1), mediaType: 'application/pdf' }),
    };
    const reader = new PrivateDriveAttachmentReader(bindings, drive, folder);
    expect(await reader.readForOwner(fileId, 'fictif-a')).toBeNull();
  });
});
