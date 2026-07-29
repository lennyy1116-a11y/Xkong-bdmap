const BACKUP_SCHEMA = 'bdmap-delete-backup/v1';

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function actorFields(actor = {}) {
  const id = String(actor.id || actor.name || 'anonymous');
  const name = String(actor.name || actor.id || '匿名');
  return { id, name };
}

export function activeRecords(records = []) {
  return records.filter(record => record && !record.deletedAt);
}

export function deletedRecords(records = []) {
  return records.filter(record => record && !!record.deletedAt);
}

export function createBackupPayload(records = [], options = {}) {
  const actor = actorFields(options.actor);
  return {
    schemaVersion: BACKUP_SCHEMA,
    createdAt: options.now || new Date().toISOString(),
    actor: clone(options.actor || actor),
    operation: options.operation || 'soft-delete',
    count: records.length,
    records: clone(records)
  };
}

export function softDeleteRecord(record, options = {}) {
  if (!record || !record.id) throw new Error('缺少待删除记录或记录ID');
  const actor = actorFields(options.actor);
  const now = options.now || new Date().toISOString();
  return {
    ...clone(record),
    deletedAt: now,
    deletedBy: actor.id,
    deletedByName: actor.name,
    deleteReason: String(options.reason || '用户删除'),
    revision: Number(record.revision || 0) + 1,
    updatedAt: now,
    updatedBy: actor.name
  };
}

export function restoreRecord(record, options = {}) {
  if (!record || !record.id) throw new Error('缺少待恢复记录或记录ID');
  const actor = actorFields(options.actor);
  const now = options.now || new Date().toISOString();
  const restored = clone(record);
  delete restored.deletedAt;
  delete restored.deletedBy;
  delete restored.deletedByName;
  delete restored.deleteReason;
  restored.restoredAt = now;
  restored.restoredBy = actor.id;
  restored.restoredByName = actor.name;
  restored.revision = Number(record.revision || 0) + 1;
  restored.updatedAt = now;
  restored.updatedBy = actor.name;
  return restored;
}

export async function runBulkSoftDelete(records = [], options = {}) {
  if (typeof options.persist !== 'function') throw new Error('缺少持久化函数');
  const succeeded = [];
  const failed = [];
  for (const record of records) {
    try {
      const deleted = softDeleteRecord(record, options);
      await options.persist(deleted, record);
      succeeded.push(deleted);
    } catch (error) {
      failed.push({ record, error: error instanceof Error ? error : new Error(String(error)) });
    }
  }
  return {
    successCount: succeeded.length,
    failureCount: failed.length,
    succeeded,
    failed
  };
}

const api = {
  BACKUP_SCHEMA,
  activeRecords,
  deletedRecords,
  createBackupPayload,
  softDeleteRecord,
  restoreRecord,
  runBulkSoftDelete
};

if (typeof window !== 'undefined') {
  window.BDMapDataSafety = api;
  window.dispatchEvent(new CustomEvent('bdmap-data-safety-ready'));
}
export default api;
