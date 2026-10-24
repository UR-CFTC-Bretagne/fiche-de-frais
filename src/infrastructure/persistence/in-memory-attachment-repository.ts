import type { Attachment } from '../../domain/entities/attachment';
import type { AttachmentRepository } from '../../application/ports/attachment-repository';

/** Stockage de simulation ; ne conserve pas les documents binaires. */
export class InMemoryAttachmentRepository implements AttachmentRepository {
  private readonly records = new Map<string, Attachment>();
  async findByReportId(reportId: string): Promise<Attachment[]> {
    return [...this.records.values()].filter(item => item.reportId === reportId)
      .map(item => ({ ...item }));
  }
  async saveIfAbsent(item: Attachment): Promise<void> {
    if (this.records.has(item.id)) throw new Error('Justificatif déjà référencé');
    this.records.set(item.id, { ...item });
  }
}
