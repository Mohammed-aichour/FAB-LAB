import crypto from 'crypto';
import { readEntity, writeEntity } from './json-store';
import type { AuthenticatedUser } from '../types/auth';

export interface AuditEntry {
  id: string;
  date: string;
  userId: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  entityId: string | number | null;
  oldValue: unknown;
  newValue: unknown;
  requestId: string;
}

export function appendAudit(
  user: AuthenticatedUser,
  action: string,
  entity: string,
  entityId: string | number | null,
  oldValue: unknown,
  newValue: unknown,
  requestId = crypto.randomUUID(),
) {
  const logs = readEntity<AuditEntry[]>('audit_logs');
  const entry: AuditEntry = {
    id: `audit_${crypto.randomUUID()}`,
    date: new Date().toISOString(),
    userId: String(user.id),
    user: user.name,
    role: user.role,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    requestId,
  };
  writeEntity('audit_logs', [entry, ...logs]);
  return entry;
}
