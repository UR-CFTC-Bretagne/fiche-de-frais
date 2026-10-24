import type { Attachment } from '../../domain/entities/attachment';
export interface AttachmentRepository {
  findByReportId(reportId: string): Promise<Attachment[]>;
  saveIfAbsent(item: Attachment): Promise<void>;
}
