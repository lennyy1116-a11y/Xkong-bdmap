import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  activeRecords,
  deletedRecords,
  createBackupPayload,
  softDeleteRecord,
  restoreRecord,
  runBulkSoftDelete
} from '../src/data-safety.mjs';

const FIXED_NOW = '2026-07-29T10:00:00.000Z';
const actor = { id: 'alice', name: 'Alice' };
const place = { id: 'p1', name: '仁心堂', revision: 2, ownerId: 'sales' };

test('activeRecords 默认排除软删除记录，deletedRecords 只返回回收站记录', () => {
  const deleted = { ...place, id: 'p2', deletedAt: FIXED_NOW };
  assert.deepEqual(activeRecords([place, deleted]).map(x => x.id), ['p1']);
  assert.deepEqual(deletedRecords([place, deleted]).map(x => x.id), ['p2']);
});

test('createBackupPayload 包含记录、时间、操作人和 schema 版本，且不改写原记录', () => {
  const payload = createBackupPayload([place], { now: FIXED_NOW, actor, operation: 'soft-delete' });
  assert.equal(payload.schemaVersion, 'bdmap-delete-backup/v1');
  assert.equal(payload.createdAt, FIXED_NOW);
  assert.deepEqual(payload.actor, actor);
  assert.equal(payload.operation, 'soft-delete');
  assert.equal(payload.count, 1);
  assert.deepEqual(payload.records, [place]);
  assert.notEqual(payload.records[0], place);
});

test('softDeleteRecord 写入删除元数据并递增 revision', () => {
  const result = softDeleteRecord(place, { now: FIXED_NOW, actor, reason: '重复机构' });
  assert.equal(result.deletedAt, FIXED_NOW);
  assert.equal(result.deletedBy, 'alice');
  assert.equal(result.deletedByName, 'Alice');
  assert.equal(result.deleteReason, '重复机构');
  assert.equal(result.revision, 3);
  assert.equal(place.deletedAt, undefined);
});

test('restoreRecord 清除删除字段并递增 revision', () => {
  const deleted = softDeleteRecord(place, { now: FIXED_NOW, actor, reason: '误删' });
  const restored = restoreRecord(deleted, { now: '2026-07-29T11:00:00.000Z', actor });
  for (const key of ['deletedAt', 'deletedBy', 'deletedByName', 'deleteReason']) {
    assert.equal(Object.hasOwn(restored, key), false);
  }
  assert.equal(restored.restoredAt, '2026-07-29T11:00:00.000Z');
  assert.equal(restored.restoredBy, 'alice');
  assert.equal(restored.revision, 4);
});

test('runBulkSoftDelete 汇总成功、失败及失败项，不因单项失败中断', async () => {
  const records = [place, { ...place, id: 'p2', name: '失败机构' }];
  const result = await runBulkSoftDelete(records, {
    now: FIXED_NOW,
    actor,
    reason: '批量清理',
    persist: async record => {
      if (record.id === 'p2') throw new Error('network denied');
    }
  });
  assert.equal(result.successCount, 1);
  assert.equal(result.failureCount, 1);
  assert.equal(result.succeeded[0].deletedAt, FIXED_NOW);
  assert.deepEqual(result.failed.map(x => ({ id: x.record.id, message: x.error.message })), [
    { id: 'p2', message: 'network denied' }
  ]);
});

test('index.html 接入安全删除模块、回收站、备份、软删除与审计，不开放永久清除', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /window\.BDMapDataSafety\s*=\s*api/);
  assert.match(html, /id="recycleBinPanel"/);
  assert.match(html, /id="recycleBinCount"/);
  assert.match(html, /function openRecycleBin\(/);
  assert.match(html, /async function restoreDeletedPlace\(/);
  assert.match(html, /downloadDeletionBackup/);
  assert.match(html, /runRevisionedMutation\(record\.id,\s*Number\(record\.revision\)\s*\|\|\s*0/);
  assert.match(html, /softDeleteRecord\(current/);
  assert.match(html, /persistSoftDelete\(record, reason, action = 'soft-delete'\)/);
  assert.match(html, /auditLogs/);
  assert.doesNotMatch(html, /placesCollection\.doc\(id\)\.delete\(\)/);
  assert.match(html, /id="adminPanel"/);
});

test('新版首页提供可见的资源中心入口，用户可由管理员区域进入回收站', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<button[^>]+data-tab="resources"[^>]+onclick="navigateTo\('resources'\)"[^>]*>资源库<\/button>/);
  assert.match(html, /id="adminPanel"[\s\S]*onclick="openRecycleBin\(\)"/);
});

test('app.inline.js 与 index.html 内联脚本完全同步', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(code => code.includes('// ============ FIREBASE ============'));
  assert.equal(scripts.length, 1);
  const extracted = scripts[0].replace(/^\n/, '').replace(/\n$/, '');
  const inline = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8').replace(/^\n/, '').replace(/\n$/, '');
  assert.equal(extracted, inline);
});
