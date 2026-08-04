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

test('正式底池有12516条永久唯一机构代码，格式为L1+L2+六位流水', () => {
  const rows = pool();
  assert.equal(rows.length, 12516);
  assert.equal(new Set(rows.map(x => x.id)).size, rows.length);
  for (const row of rows) {
    assert.match(row.id, /^[A-Z]+\d{2}\d{6}$/);
    assert.ok(row.id.startsWith(String(row.primary_l2_code).replace(/[^A-Z0-9]/g, '')));
  }
});

test('已确认的5组重复旧码已归并并映射到指定保留机构', () => {
  const rows = pool();
  const byId = new Map(rows.map(row => [row.id, row]));
  const confirmed = [
    ['TCM06000262','BEA01000168'],
    ['TCM06000237','BEA04000445'],
    ['TCM01000891','MED01002574'],
    ['TCM01000542','TCM01000135'],
    ['TCM01002317','TCM01000572']
  ];
  for (const [keeperId, removedId] of confirmed) {
    assert.ok(byId.has(keeperId), keeperId);
    assert.equal(byId.has(removedId), false, removedId);
    assert.ok(byId.get(keeperId).legacyInstitutionIds.includes(removedId), `${removedId} → ${keeperId}`);
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

test('Excel报错回传为基础机构建立运营记录时仍沿用canonical id', () => {
  const fn = body(app(), 'makeImportEditableRecord', 'handleBatchErrorImport');
  assert.match(fn, /canonicalClinicId\(match\)/);
  assert.match(fn, /canonicalWriteSeed\(match, existing/);
  assert.doesNotMatch(fn, /id:\s*match\.isBaseClinic\s*\?\s*['"]place_['"]\s*\+/);
});

test('随机机构ID不能冒充canonical clinic_id，点位仍可使用原始ID', () => {
  assert.equal(canonicalClinicId({ id:'random-institution', entryKind:'institution', name:'机构' }), '');
  assert.equal(canonicalClinicId({ id:'random-point', entryKind:'point', type:'商场' }), 'random-point');
  const exportFn = body(app(), 'clinicExportRow', 'exportComboCoverageXlsx');
  assert.match(exportFn, /clinic_id:\s*canonicalClinicId\(p\)/);
});

test('allocator兼容stale counter并事务内检查places冲突', () => {
  const alloc = body(app(), 'allocateCanonicalInstitutionId', 'savePlace');
  assert.match(alloc, /institutionCodeCountersCollection\.doc\(prefix\)/);
  assert.match(alloc, /transaction\.get\(placesQuery\)/);
  assert.match(alloc, /transaction\.get\(candidateRef\)/);
  assert.match(alloc, /for\s*\(let attempts\s*=\s*0;\s*attempts\s*<\s*1000/);
});

test('批量店铺和普通JSON新增机构均使用canonical allocator，点位才使用genId', () => {
  const source = app();
  const batch = body(source, 'confirmBatchShopImport', 'exportBatchShopReviewXlsx');
  assert.match(batch, /await allocateCanonicalInstitutionId\(data\)/);
  assert.doesNotMatch(batch, /makeBatchShopId/);
  const jsonImport = body(source, 'importData', 'syncImportedToFirestore');
  assert.match(jsonImport, /entryKind === 'point'\s*\?\s*genId\(\)\s*:\s*await allocateCanonicalInstitutionId\(row\)/);
});

test('已有记录禁止在点位和机构之间转换', () => {
  const save = body(app(), 'savePlace', 'getDataSafety');
  assert.match(save, /禁止将已有点位与机构互相转换/);
  assert.match(save, /isPointEntry\(oldPlace\)\s*!==\s*\(entryKind === 'point'\)/);
});

test('编辑legacy place机构通过原子事务迁移到canonical doc并替换本地副记录', () => {
  const save = body(app(), 'savePlace', 'getDataSafety');
  assert.match(save, /const targetChanged = !!\(editId && data\.id !== editId\)/);
  assert.match(save, /runCanonicalInstitutionMutation\(data\.id, oldPlace, editBaseRevision/);
  assert.match(save, /replaceLocalCanonicalRecord\(savedData, targetChanged \? editId : ''\)/);
  const migration = body(app(), 'runCanonicalInstitutionMutation', 'replaceLocalCanonicalRecord');
  assert.match(migration, /assertExpectedRevision\(legacyCurrent, expectedRevision\)/);
  assert.match(migration, /transaction\.set\(canonicalRef, revisioned\)/);
  assert.match(migration, /transaction\.delete\(legacyRef\)/);
});

test('认领和报错路径也使用canonical原子迁移', () => {
  const source = app();
  for (const [name,next] of [['claimLead','reportLeadError'],['reportLeadError','resolveLeadError'],['resolveLeadError','locateLeadOnMap']]) {
    const fn = body(source, name, next);
    assert.match(fn, /runCanonicalInstitutionMutation/);
    assert.match(fn, /replaceLocalCanonicalRecord/);
  }
});

test('报错回传提供强ID但未命中时失败关闭且弱匹配必须唯一', () => {
  const finder = body(app(), 'findClinicForImport', 'makeImportEditableRecord');
  assert.match(finder, /if \(id\) return resolveStrongClinicId\(id, name, address\)/);
  assert.match(finder, /if \(baseId\) return resolveStrongClinicId\(baseId, name, address\)/);
  assert.match(finder, /matches\.length === 1 \? matches\[0\] : null/);
});

test('canonical identity存在时不以名称地址误配另一机构，legacy写入迁移到canonical doc', () => {
  const source = app();
  const finder = body(source, 'findOperationalPlaceForRecord', 'getEditableLeadPlace');
  assert.match(finder, /if \(canonicalId\)/);
  assert.match(finder, /return null/);
  assert.ok(finder.indexOf('if (canonicalId)') < finder.indexOf('clinicMatchKey'));
  for (const [name,next] of [['claimLead','reportLeadError'],['reportLeadError','resolveLeadError'],['resolveLeadError','locateLeadOnMap']]) {
    const fn = body(source, name, next);
    assert.match(fn, /canonicalClinicId\(p\)/);
    assert.doesNotMatch(fn, /runRevisionedMutation\(existing\.id/);
  }
  const importEditable = body(source, 'makeImportEditableRecord', 'handleBatchErrorImport');
  assert.match(importEditable, /canonicalClinicId\(match\)/);
  assert.doesNotMatch(importEditable, /id:match\.id/);
});

test('base promoted lookup有canonical identity时不使用名称地址fallback', () => {
  const fn = body(app(), 'getPromotedPlaceForBaseClinic', 'mergeBaseClinicOwner');
  assert.match(fn, /findOperationalPlaceForRecord\(base\)/);
  assert.doesNotMatch(fn, /clinicMatchKey/);
});

test('app.inline.js与index.html内嵌脚本精确同步', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const embedded = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(x => x[1]).find(x => x.includes('// ============ FIREBASE ============'));
  assert.ok(embedded);
  assert.equal(embedded.replace(/^\n/, '').replace(/\n$/, ''), app().replace(/^\n/, '').replace(/\n$/, ''));
});
