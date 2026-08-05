import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('管理员打开回收站时先关闭管理员面板，避免层级遮挡', () => {
  assert.match(app, /function openRecycleBin\(\)\s*\{[\s\S]*?adminPanel[\s\S]*?classList\.remove\('active'\)[\s\S]*?recycleBinPanel[\s\S]*?classList\.add\('active'\)/);
});

test('地址定位只允许当前输入对应的最新请求回填坐标', () => {
  assert.match(app, /let sheetAddressRelocateRequest = 0/);
  assert.match(app, /const requestId = \+\+sheetAddressRelocateRequest/);
  assert.match(app, /requestId === sheetAddressRelocateRequest && addrEl\.value\.trim\(\) === raw/);
  assert.match(app, /isNaN\(lat\) \|\| isNaN\(lng\) \|\| !isCurrentRequest\(\)/);
});

test('商场核心编辑字段会写入云端并允许云端回读', () => {
  assert.match(app, /saveMallMetaToCloud\(m\)[\s\S]*?name: m\.name[\s\S]*?lat: m\.lat[\s\S]*?lng: m\.lng[\s\S]*?address: m\.address/);
  assert.doesNotMatch(app, /\.\.\.meta\[m\.id\][\s\S]{0,120}lat: m\.lat[\s\S]{0,80}lng: m\.lng[\s\S]{0,80}address: m\.address[\s\S]{0,80}name: m\.name/);
});

test('跨页面导航会取消延迟新增，避免五秒后误弹表单', () => {
  assert.match(app, /let tapModeTimer = null/);
  assert.match(app, /function cancelPendingMapAdd\(\)/);
  assert.match(app, /function navigateTo\(tab\)[\s\S]*?cancelPendingMapAdd\(\)/);
  assert.match(app, /function closePrimaryPanels\(\)[\s\S]*?cancelPendingMapAdd\(\)/);
});

test('误导性的永久清除入口改为明确的本地缓存重置', () => {
  assert.match(html, /重置本地缓存并重新加载/);
  assert.doesNotMatch(html, />🗑 清除所有数据</);
  assert.match(app, /localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(app, /不会删除云端数据/);
});
