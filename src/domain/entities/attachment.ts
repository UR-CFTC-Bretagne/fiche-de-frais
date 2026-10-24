export type AttachmentKind = 'CONVOCATION' | 'ATTENDANCE' | 'RECEIPT' | 'ITINERARY' | 'OTHER';
export interface Attachment {
  id: string;
  reportId: string;
  lineId: string | null;
  kind: AttachmentKind;
  privateFileRef: string;
  sha256: string;
  mediaType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number;
  uploadedAt: string;
}
