import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('P10 uses five primary navigation destinations', () => {
  for (const [tab, label] of [
    ['leads', '线索'], ['map', '地图'], ['resources', '资源'], ['dashboard', '看板'], ['my', '我的']
  ]) {
    assert.match(html, new RegExp(`data-tab="${tab}"[^>]*>[\\s\\S]*?${label}`));
  }
  assert.doesNotMatch(html, /data-tab="institutions"/);
});

test('resource center exposes institution point and mall tabs without changing the data model', () => {
  assert.match(html, /id="resourceTabs"/);
  assert.match(html, /data-resource-kind="institution"[^>]*>机构/);
  assert.match(html, /data-resource-kind="point"[^>]*>点位/);
  assert.match(html, /data-resource-kind="mall"[^>]*>商场/);
  assert.match(html, /function\s+setResourceTab\s*\(/);
  assert.match(html, /function\s+getResourceRows\s*\(/);
});

test('My page groups profile status management and hides dangerous tools in admin details', () => {
  assert.match(html, /<h2>我的<\/h2>/);
  assert.match(html, /id="myProfileSection"/);
  assert.match(html, /id="mySystemStatusSection"/);
  assert.match(html, /id="mySystemManagementSection"/);
  assert.match(html, /<details[^>]*id="adminArea"/);
  assert.match(html, /function\s+refreshMySystemStatus\s*\(/);
});

test('full data import and export have one management surface', () => {
  assert.equal((html.match(/id="importFile"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="importFile2"/);
  const listPanel = html.match(/<div class="list-panel" id="listPanel">([\s\S]*?)<\/div>\s*<!-- Recycle bin/);
  assert.ok(listPanel);
  assert.doesNotMatch(listPanel[1], /exportData\(|exportPointsXlsx\(|importData\(/);
});

test('P10 removes obsolete version branding from primary headers', () => {
  assert.doesNotMatch(html, /<h1>📍 BDmap-v3\.7\.0-hardening-p9<\/h1>/);
  assert.doesNotMatch(html, /<h2>v3\.3\.2 数据看板<\/h2>/);
  assert.match(html, /<h1>BD工作台<\/h1>/);
  assert.match(html, /<h2>BD运营看板<\/h2>/);
});

test('top bar duplicate mall and settings controls are not visible', () => {
  assert.match(html, /#btnMall\s*,\s*#btnSettings\s*\{\s*display:\s*none/);
});

test('P10 navigation functions close competing primary panels', () => {
  assert.match(html, /function\s+closePrimaryPanels\s*\(/);
  assert.match(html, /function\s+openResourceCenter\s*\(/);
  assert.match(html, /function\s+openMyFromNav\s*\(/);
});

test('system management accurately describes Firebase-backed data', () => {
  assert.doesNotMatch(html, /数据保存在浏览器本地存储中/);
  assert.match(html, /Firebase/);
});
