import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { assertExpectedRevision } from '../src/runtime-safety.mjs';
import { prepareNewImportedRecord, reviewImportRow } from '../src/import-safety.mjs';

const root = path.resolve(import.meta.dirname, '..');
const appText = () => fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length;
  return source.slice(start, end >= 0 ? end : source.length);
}

test('revision 语义区分新增与已有记录，新增遇到同ID必须冲突', () => {
  assert.doesNotThrow(() => assertExpectedRevision(null, null));
  assert.throws(() => assertExpectedRevision({ revision: 1 }, null), /记录ID已存在/);
  assert.doesNotThrow(() => assertExpectedRevision({ revision: 2 }, 2));
  assert.throws(() => assertExpectedRevision({ revision: 3 }, 2), /记录已被其他人更新/);
});

test('普通JSON导入丢弃外部ID、删除元数据和revision', () => {
  const prepared = prepareNewImportedRecord({
    id: 'victim', name: '新店', address: '中环', lat: 22.28, lng: 114.16,
    revision: 999, deletedAt: '2026-01-01', deletedBy: 'attacker', ownerId: 'attacker'
  }, { id: 'generated-safe-id', actor: 'Lenny', now: '2026-07-29T12:00:00Z' });
  assert.equal(prepared.id, 'generated-safe-id');
  assert.equal(prepared.revision, 0);
  assert.equal(prepared.deletedAt, undefined);
  assert.equal(prepared.deletedBy, undefined);
  assert.equal(prepared.ownerId, undefined);
  assert.equal(prepared.name, '新店');
});

test('导入预审会拦截命中活动或回收站的外部ID', () => {
  const active = reviewImportRow({ id:'same', name:'不同名', address:'不同址', lat:22.3, lng:114.2 }, [{ id:'same', name:'旧店' }]);
  assert.equal(active.importable, false);
  assert.match(active.messages.join('|'), /ID/);
  const deleted = reviewImportRow({ id:'deleted-id', name:'新店', address:'中环', lat:22.3, lng:114.2 }, [{ id:'deleted-id', name:'旧店', deletedAt:'2026-01-01' }]);
  assert.equal(deleted.importable, false);
  assert.match(deleted.messages.join('|'), /回收站/);
});

test('列表状态经过HTML编码', () => {
  assert.match(appText(), /\$\{esc\(displayStatus\)\}<\/span>/);
});

test('主编辑不再保存前乐观覆盖本地，也不以旧快照回滚新snapshot', () => {
  const body = functionBody(appText(), 'savePlace', 'getDataSafety');
  const beforeCloud = body.slice(0, body.indexOf('await saveToFirestore'));
  assert.doesNotMatch(beforeCloud, /places\[existIdx\]\s*=\s*data/);
  assert.doesNotMatch(beforeCloud, /places\.push\(data\)/);
  assert.doesNotMatch(body, /places\[rollbackIdx\]\s*=\s*localBeforeSave/);
});

test('删除恢复与运营写入均通过事务并携带expected revision', () => {
  const app = appText();
  assert.match(functionBody(app, 'persistSoftDelete', 'deletePlace'), /runRevisionedMutation/);
  assert.match(functionBody(app, 'restoreDeletedPlace', 'renderList'), /runRevisionedMutation/);
  assert.match(functionBody(app, 'claimLead', 'reportLeadError'), /runRevisionedMutation/);
  assert.match(functionBody(app, 'reportLeadError', 'resolveLeadError'), /runRevisionedMutation/);
  assert.match(functionBody(app, 'resolveLeadError', 'locateLeadOnMap'), /runRevisionedMutation/);
});

test('JSON和Excel新增导入都使用create-only revision事务', () => {
  const app = appText();
  const jsonImport = functionBody(app, 'importData', 'syncImportedToFirestore');
  assert.match(jsonImport, /prepareNewImportedRecord/);
  assert.match(jsonImport, /saveToFirestore\(record, null\)/);
  const batch = functionBody(app, 'confirmBatchShopImport', 'exportBatchShopReviewXlsx');
  assert.match(batch, /saveToFirestore\(data, null\)/);
  assert.doesNotMatch(batch, /mergeImportedRecord/);
});

test('Excel导入在最终确认前重新查重，阻止预览后出现的同名同址记录', () => {
  const batch = functionBody(appText(), 'confirmBatchShopImport', 'exportBatchShopReviewXlsx');
  assert.match(batch, /findPotentialDuplicatesForShop\(r\)/);
  assert.ok(batch.indexOf('findPotentialDuplicatesForShop(r)') < batch.indexOf('saveToFirestore(data, null)'), '必须在云端写入前再次查重');
});

test('审计日志可在主数据事务中原子写入', () => {
  const body = functionBody(appText(), 'runRevisionedMutation', 'saveToFirestore');
  assert.match(body, /transaction\.set\(auditRef/);
});

test('基础诊所晋升必须先云端事务成功再更新本地，且新增采用create-only revision', () => {
  const fn = functionBody(appText(), 'promoteBaseClinic', 'resetMallCache');
  assert.match(fn, /await saveToFirestore\(data, null\)/);
  assert.ok(fn.indexOf('await saveToFirestore') < fn.indexOf('places.push(saved)'), '应先云端成功，再更新本地');
  assert.doesNotMatch(fn, /places\[existIdx\]\s*=|places\.push\(data\)/, '不得在云端成功前乐观覆盖本地');
});

test('主表单保存以事务返回记录更新或追加本地状态', () => {
  const fn = functionBody(appText(), 'savePlace', 'getDataSafety');
  assert.match(fn, /if \(savedIdx >= 0\) places\[savedIdx\] = savedData; else places\.push\(savedData\)/);
  assert.doesNotMatch(fn, /places\[savedIdx\] = data/);
});

test('管理员改头像逐条走revision事务并在成功后更新本地', () => {
  const fn = functionBody(appText(), 'changeOwnerAvatar', 'deleteOwnerData');
  assert.match(fn, /runRevisionedMutation\(original\.id, Number\(original\.revision\) \|\| 0/);
  assert.doesNotMatch(fn, /placesCollection\.doc\(p\.id\)\.set/);
  assert.ok(fn.indexOf('await runRevisionedMutation') < fn.indexOf('places[idx] = saved'), '应云端成功后才更新本地');
});

test('批量报错使用拷贝，失败不得污染places原对象', () => {
  const maker = functionBody(appText(), 'makeImportEditableRecord', 'handleBatchErrorImport');
  assert.match(maker, /return \{ \.\.\.existing \}/);
  assert.doesNotMatch(maker, /return data/);
});

test('所有测试使用的内联脚本仍与index完全同步', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).filter(code => code.includes('// ============ FIREBASE ============'));
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].replace(/^\n/, '').replace(/\n$/, ''), appText().replace(/\n$/, ''));
});
