import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COVERAGE_MODES,
  getCoverageMode,
  prefilterCoverageCandidates,
  applyWalkingMatrixResults,
  walkingCacheKey,
  walkingSharedCacheDocId,
  walkingUsageDocId,
  canReserveWalkingElements,
  sha256Hex
} from '../src/coverage-routing.mjs';

const root = path.resolve(import.meta.dirname, '..');
const appText = () => fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
const htmlText = () => fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('提供直线1公里、步行1公里、步行4公里三种明确口径', () => {
  assert.deepEqual(Object.keys(COVERAGE_MODES), ['straight_1', 'walking_1', 'walking_4']);
  assert.equal(getCoverageMode('straight_1').limitKm, 1);
  assert.equal(getCoverageMode('walking_1').travelMode, 'WALKING');
  assert.equal(getCoverageMode('walking_4').limitKm, 4);
});

test('步行模式先按较宽直线半径预筛，避免全量路线请求', () => {
  const center = { lat: 22.3383244, lng: 114.1872329 };
  const rows = [
    { id: 'near', lat: 22.34, lng: 114.19 },
    { id: 'candidate', lat: 22.37, lng: 114.18 },
    { id: 'far', lat: 22.50, lng: 114.13 }
  ];
  assert.deepEqual(prefilterCoverageCandidates(center, rows, 'walking_1').map(x => x.id), ['near']);
  assert.deepEqual(prefilterCoverageCandidates(center, rows, 'walking_4').map(x => x.id), ['near', 'candidate']);
});

test('步行结果仅纳入真实步行距离不超过阈值者，失败项不冒充直线距离', () => {
  const candidates = [{ id:'a' }, { id:'b' }, { id:'c' }];
  const matrix = [
    { status:'OK', distanceMeters:900, durationSeconds:720 },
    { status:'OK', distanceMeters:4300, durationSeconds:3600 },
    { status:'ZERO_RESULTS' }
  ];
  const result = applyWalkingMatrixResults(candidates, matrix, 'walking_4');
  assert.deepEqual(result.included.map(x => x.id), ['a']);
  assert.equal(result.included[0]._walkingDistanceKm, 0.9);
  assert.equal(result.pending.length, 1);
  assert.equal(result.excluded.length, 1);
});

test('步行缓存键包含起终点坐标和步行模式', () => {
  const key = walkingCacheKey({lat:22.3,lng:114.2}, {lat:22.31,lng:114.21});
  assert.match(key, /^walking\|22\.30000,114\.20000\|22\.31000,114\.21000$/);
});

test('覆盖面板提供三个口径按钮并显示真实步行计算状态', () => {
  const html = htmlText();
  assert.match(html, /data-coverage-mode="straight_1"/);
  assert.match(html, /data-coverage-mode="walking_1"/);
  assert.match(html, /data-coverage-mode="walking_4"/);
  const app = appText();
  assert.match(app, /google\.maps\.DistanceMatrixService/);
  assert.match(app, /TravelMode\.WALKING/);
  assert.match(app, /步行距离待计算|步行距离不可用/);
});

test('路线API失败不得静默回退并标成步行结果', () => {
  const app = appText();
  assert.doesNotMatch(app, /catch[\s\S]{0,300}_walkingDistanceKm\s*=\s*_distanceKm/);
  assert.match(app, /walkingStatus/);
});

test('步行路线必须经过密码授权且不会在切换按钮后自动调用', () => {
  const app = appText();
  assert.match(app, /authorizeWalkingRun/);
  assert.match(app, /sha256Hex\(password\)/);
  assert.match(htmlText(), /开始计算/);
  assert.doesNotMatch(app, /function setCoverageMode\([^)]*\)[^{]*\{[^}]*refreshActiveCoverage\(\)/);
});

test('共享缓存使用稳定文档ID，避免不同设备重复调用', async () => {
  const key = walkingCacheKey({lat:22.3,lng:114.2}, {lat:22.31,lng:114.21});
  assert.equal(await walkingSharedCacheDocId(key), await walkingSharedCacheDocId(key));
  assert.match(await walkingSharedCacheDocId(key), /^[a-f0-9]{64}$/);
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('每日元素硬上限在预留前阻止超额请求', () => {
  assert.equal(canReserveWalkingElements(9000, 1000, 10000), true);
  assert.equal(canReserveWalkingElements(9000, 1001, 10000), false);
  assert.equal(canReserveWalkingElements(0, 250, 0), false);
  assert.match(walkingUsageDocId(new Date('2026-08-12T02:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('应用包含Firestore共享缓存及每日用量事务保护', () => {
  const app = appText();
  assert.match(app, /walkingRouteCache/);
  assert.match(app, /walkingRouteUsage/);
  assert.match(app, /runTransaction/);
  assert.match(app, /DAILY_WALKING_ELEMENT_LIMIT/);
});
