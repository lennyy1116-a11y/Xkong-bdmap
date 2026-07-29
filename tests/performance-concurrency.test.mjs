import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  coordinateGroupPlan,
  nextRevision,
  assertExpectedRevision,
  prepareRevisionedWrite
} from '../src/runtime-safety.mjs';

const root = path.resolve(import.meta.dirname, '..');

 test('coordinateGroupPlan 一次建立同坐标索引并给出稳定序号', () => {
  const rows = [
    { id:'a', lat:22.3, lng:114.1 },
    { id:'b', lat:22.3, lng:114.1 },
    { id:'c', lat:22.31, lng:114.11 },
    { id:'bad', lat:'', lng:null }
  ];
  const plan = coordinateGroupPlan(rows);
  assert.deepEqual(plan.get('a'), { index:0, total:2 });
  assert.deepEqual(plan.get('b'), { index:1, total:2 });
  assert.deepEqual(plan.get('c'), { index:0, total:1 });
  assert.equal(plan.has('bad'), false);
});

test('revision helpers 对新增递增，对陈旧编辑拒绝覆盖', () => {
  assert.equal(nextRevision(undefined), 1);
  assert.equal(nextRevision({ revision:4 }), 5);
  assert.doesNotThrow(() => assertExpectedRevision({ revision:4 }, 4));
  assert.throws(() => assertExpectedRevision({ revision:5 }, 4), /记录已被其他人更新/);
  const prepared = prepareRevisionedWrite({ id:'p1', revision:4, name:'新名称' }, { revision:4 });
  assert.equal(prepared.revision, 5);
});

test('页面接入性能索引与事务式 revision 冲突保护', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
  assert.match(html, /window\.BDMapRuntimeSafety\s*=\s*api/);
  assert.match(app, /coordinateGroupPlan\(renderPool\)/);
  assert.doesNotMatch(app, /renderPool\.filter\(x =>[^\n]*coordKey/);
  assert.match(app, /db\.runTransaction/);
  assert.match(app, /expectedRevision/);
  assert.match(app, /prepareRevisionedWrite/);
  const saveStart = app.indexOf('async function savePlace() {');
  const saveEnd = app.indexOf('\nfunction getDataSafety()', saveStart);
  const saveBody = saveStart >= 0 && saveEnd > saveStart ? app.slice(saveStart, saveEnd) : '';
  const beforeCloud = saveBody.slice(0, saveBody.indexOf('await saveToFirestore'));
  assert.doesNotMatch(beforeCloud, /places\[existIdx\]\s*=|places\.push\(data\)/);
  assert.doesNotMatch(saveBody, /localBeforeSave|rollbackIdx/);
  assert.match(saveBody, /latest = await placesCollection\.doc\(editId\)\.get\(\)/);
});
