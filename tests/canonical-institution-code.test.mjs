import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  canonicalClinicId,
  canonicalIdentityKeys,
  dedupeCanonicalClinics,
  makeCanonicalOperationalRecord,
  preserveCanonicalIdOnEdit,
  snapshotRecord
} from '../src/canonical-institution-code.mjs';

const root = path.resolve(import.meta.dirname, '..');
const pool = () => JSON.parse(fs.readFileSync(path.join(root, 'tcm-base-clinics.json'), 'utf8'));
const app = () => fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
function body(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}

test('正式底池有13311条永久唯一机构代码，格式为L1+L2+六位流水', () => {
  const rows = pool();
  assert.equal(rows.length, 13311);
  assert.equal(new Set(rows.map(x => x.id)).size, rows.length);
  for (const row of rows) {
    assert.match(row.id, /^[A-Z]+\d{2}\d{6}$/);
    assert.ok(row.id.startsWith(String(row.primary_l2_code).replace(/[^A-Z0-9]/g, '')));
  }
});

test('primary_l2_code是共享类目代码，不是机构唯一代码', () => {
  const rows = pool();
  assert.ok(new Set(rows.map(x => x.primary_l2_code)).size < rows.length);
  const repeated = rows.filter(x => x.primary_l2_code === rows[0].primary_l2_code);
  assert.ok(repeated.length > 1);
  assert.equal(new Set(repeated.map(x => x.id)).size, repeated.length);
});

test('canonical导出对基础池和运营记录输出同一个clinic_id', () => {
  const base = { id:'MED08000001', isBaseClinic:true };
  const operational = { id:'MED08000001', sourceBaseId:'TCM000001' };
  const legacy = { id:'place_MED08000001', sourceBaseId:'MED08000001' };
  assert.equal(canonicalClinicId(base), 'MED08000001');
  assert.equal(canonicalClinicId(operational), 'MED08000001');
  assert.equal(canonicalClinicId(legacy), 'MED08000001');
});

test('snapshot以doc.id为权威并强制内外id一致', () => {
  assert.deepEqual(snapshotRecord({ id:'MED08000001', data:() => ({ id:'evil', name:'A' }) }), { id:'MED08000001', name:'A' });
});

test('同名同址但canonical id不同，线索池和覆盖池最终去重仍保留两家', () => {
  const rows = [
    { id:'MED08000001', name:'同名', address:'同址' },
    { id:'MED08000002', name:'同名', address:'同址' }
  ];
  assert.equal(dedupeCanonicalClinics(rows).length, 2);
  assert.notDeepEqual([...canonicalIdentityKeys(rows[0])], [...canonicalIdentityKeys(rows[1])]);
});

test('基础池晋升/认领/报错沿用canonical id，不生成place_副ID', () => {
  const base = { id:'MED08000001', name:'A', isBaseClinic:true };
  const promoted = makeCanonicalOperationalRecord(base, { createdAt:'now' });
  assert.equal(promoted.id, base.id);
  assert.equal(promoted.sourceBaseId, undefined);
  const source = app();
  for (const [name,next] of [['claimLead','reportLeadError'],['reportLeadError','resolveLeadError'],['promoteBaseClinic','resetMallCache']]) {
    const fn = body(source, name, next);
    assert.doesNotMatch(fn, /['"]place_['"]\s*\+/);
  }
});

test('机构分类改变绝不修改永久id，点位仍走随机ID', () => {
  const before = { id:'MED08000001', entryKind:'institution', primary_l2_code:'MED-08' };
  const edited = preserveCanonicalIdOnEdit(before, { ...before, id:'BEA01000099', primary_l2_code:'BEA-01' });
  assert.equal(edited.id, 'MED08000001');
  const save = body(app(), 'savePlace', 'getDataSafety');
  assert.match(save, /entryKind === 'point'\s*\?\s*genId\(\)\s*:\s*await allocateCanonicalInstitutionId/);
});

test('新增机构使用按首次L2分桶的Firestore事务计数器，写入始终doc.id/data.id一致', () => {
  const source = app();
  assert.match(source, /collection\('institutionCodeCounters'\)/);
  const alloc = body(source, 'allocateCanonicalInstitutionId', 'savePlace');
  assert.match(alloc, /db\.runTransaction/);
  assert.match(alloc, /primary_l2_code/);
  assert.match(alloc, /padStart\(6,'0'\)/);
  const mutation = body(source, 'runRevisionedMutation', 'saveToFirestore');
  assert.match(mutation, /const canonicalId = String\(id\)/);
  assert.match(mutation, /id:canonicalId/);
});

test('普通外部JSON导入仍不信任外部id', () => {
  const source = fs.readFileSync(path.join(root, 'src/import-safety.mjs'), 'utf8');
  assert.match(source, /record\.id\s*=\s*text\(options\.id\)/);
  assert.doesNotMatch(source, /record\.id\s*=\s*text\(incoming\.id\)/);
});


test('app.inline.js与index.html内嵌脚本精确同步', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const embedded = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(x => x[1]).find(x => x.includes('// ============ FIREBASE ============'));
  assert.ok(embedded);
  assert.equal(embedded.replace(/^\n/, '').replace(/\n$/, ''), app().replace(/^\n/, '').replace(/\n$/, ''));
});
