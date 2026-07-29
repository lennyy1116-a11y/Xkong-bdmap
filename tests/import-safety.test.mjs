import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isValidHongKongCoordinate,
  reviewImportRow,
  reviewImportRows,
  mergeImportedRecord,
  runSafeImport
} from '../src/import-safety.mjs';

const existing = [{ id:'p1', name:'仁心堂', address:'观塘开源道1号', phone:'91234567', ownerId:'alice', ownerName:'Alice', visits:[{note:'旧交流'}], createdAt:'2026-01-01', createdBy:'Alice', revision:4 }];

test('香港坐标校验拒绝空值、默认当前位置及香港范围外坐标', () => {
  assert.equal(isValidHongKongCoordinate(undefined, undefined), false);
  assert.equal(isValidHongKongCoordinate(22.3193, 114.1694, { forbidden:[{lat:22.3193,lng:114.1694}] }), false);
  assert.equal(isValidHongKongCoordinate(31.23, 121.47), false);
  assert.equal(isValidHongKongCoordinate(22.31, 114.22), true);
});

test('预审默认拦截缺名称、疑似重复及坐标待核记录', () => {
  const missing = reviewImportRow({ address:'九龙' }, existing);
  assert.equal(missing.importable, false);
  assert.equal(missing.reviewStatus, 'blocked');
  const duplicate = reviewImportRow({ name:'仁心堂', address:'观塘开源道1号', phone:'91234567', lat:22.31, lng:114.22 }, existing);
  assert.equal(duplicate.importable, false);
  assert.equal(duplicate.duplicateMatches.length, 1);
  const pending = reviewImportRow({ name:'新机构', address:'观塘', lat:null, lng:null }, existing);
  assert.equal(pending.importable, false);
  assert.equal(pending.coordStatus, 'pending');
});

test('同一导入文件内部重复也会被拦截并给出汇总', () => {
  const result = reviewImportRows([
    { name:'新店', address:'旺角弥敦道1号', phone:'23334444', lat:22.319, lng:114.17 },
    { name:'新店', address:'旺角弥敦道1号', phone:'23334444', lat:22.319, lng:114.17 }
  ], []);
  assert.equal(result.summary.total, 2);
  assert.equal(result.summary.ready, 1);
  assert.equal(result.summary.duplicates, 1);
  assert.equal(result.rows[1].importable, false);
});

test('显式覆盖时保留旧Owner、交流记录、创建信息并递增revision', () => {
  const merged = mergeImportedRecord(existing[0], { id:'p1', name:'仁心堂更新', ownerId:'hacker', visits:[], createdAt:'bad', note:'新备注' }, { now:'2026-07-29T12:00:00Z', actor:'Lenny' });
  assert.equal(merged.name, '仁心堂更新');
  assert.equal(merged.ownerId, 'alice');
  assert.deepEqual(merged.visits, [{note:'旧交流'}]);
  assert.equal(merged.createdAt, '2026-01-01');
  assert.equal(merged.createdBy, 'Alice');
  assert.equal(merged.revision, 5);
});

test('安全导入只提交ready行，云端失败不进入本地成功集并返回失败清单', async () => {
  const rows = [
    { rowNumber:2, name:'成功店', address:'中环皇后大道1号', lat:22.282, lng:114.158, importable:true },
    { rowNumber:3, name:'失败店', address:'湾仔轩尼诗道1号', lat:22.278, lng:114.175, importable:true },
    { rowNumber:4, name:'待核店', importable:false }
  ];
  const result = await runSafeImport(rows, { persist: async row => { if(row.name==='失败店') throw new Error('network denied'); } });
  assert.equal(result.successCount, 1);
  assert.equal(result.failureCount, 1);
  assert.equal(result.blockedCount, 1);
  assert.deepEqual(result.succeeded.map(x=>x.name), ['成功店']);
  assert.equal(result.failed[0].row.rowNumber, 3);
});

test('index接入导入安全模块且不再用当前位置填充失败坐标', () => {
  const root=path.resolve(import.meta.dirname,'..');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/window\.BDMapImportSafety\s*=\s*api/);
  assert.doesNotMatch(html,/row\.lat=currentPos\.lat/);
  assert.doesNotMatch(html,/lat:r\.lat\|\|currentPos\.lat/);
  assert.match(html,/疑似重复和坐标待核默认不会写入/);
  assert.match(html,/importFailureRows/);
  assert.match(html,/findPotentialDuplicatesForShop\(item,\s*rows\)/, 'Excel预审应检测同一文件内前序行重复');
  assert.match(html,/r\.importStatus='已导入'/, '成功行应标记已导入，避免再次提交');
  assert.match(html,/r\.failureMessage=/, '失败行应保留可导出的失败原因');
  assert.match(html,/\.\.\.batchShopPreviewRows,\s*\.\.\.importFailureRows/, '待核失败表应合并预审拦截和云端失败行');
  const jsonImport=html.match(/function importData\(event\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(jsonImport,/reviewImportRows/);
  assert.doesNotMatch(jsonImport,/syncImportedToFirestore/);
  assert.ok(jsonImport.indexOf('await saveToFirestore(record, null)') < jsonImport.indexOf('places.push(saved)'), '应先云端成功，再更新本地数组');
});
