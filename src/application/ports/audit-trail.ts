export interface AuditRecord {
  eventId: string;
  actorId: string;
  entityId: string;
  action: string;
  occurredAt: string;
}

export interface AuditTrail { append(record: AuditRecord): Promise<void>; }
