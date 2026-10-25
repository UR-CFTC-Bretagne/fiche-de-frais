import type { SubmissionStateStore } from './durable-form-submission-registry';

/**
 * Prototype de persistance ScriptProperties ; quota et sécurité de
 * configuration à contrôler avant tout déclencheur réel.
 */
export class AppsScriptSubmissionStateStore implements SubmissionStateStore {
  withLock<T>(operation: () => T): T {
    const lock = LockService.getScriptLock();
    lock.waitLock(20_000);
    try { return operation(); }
    finally { lock.releaseLock(); }
  }
  get(key: string): string | null {
    return PropertiesService.getScriptProperties().getProperty(key);
  }
  set(key: string, value: string): void {
    PropertiesService.getScriptProperties().setProperty(key, value);
  }
}
