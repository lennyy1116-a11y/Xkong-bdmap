import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('P12 primary navigation has four daily-work destinations and no dashboard tab', () => {
  for (const [tab, label] of [
    ['leads', '线索'], ['map', '地图'], ['resources', '资源'], ['my', '我的']
  ]) {
    assert.match(html, new RegExp(`data-tab="${tab}"[^>]*>[\\s\\S]*?${label}`));
  }
  assert.doesNotMatch(html, /data-tab="dashboard"/);
});

test('P12 removes administrator import actions from the lead home header', () => {
  const leadHome = html.match(/<div class="lead-home" id="leadHome">([\s\S]*?)<!-- Batch shop import modal -->/);
  assert.ok(leadHome);
  assert.doesNotMatch(leadHome[1], /上传报错|批量导入店铺|triggerBatchErrorImport\(|openBatchShopImport\(/);
});

test('P12 lead card keeps only the primary action and navigation action visible', () => {
  const card = script.match(/function leadCardHtml\(p\) \{([\s\S]*?)\n\}/);
  assert.ok(card);
  assert.doesNotMatch(card[1], /phoneBtn/);
  assert.doesNotMatch(card[1], /reportLeadError/);
  assert.match(card[1], /查看详情/);
  assert.match(card[1], /导航/);
});

test('P12 moves dashboard access into My instead of deleting it', () => {
  const myPanel = html.match(/<div class="settings-panel" id="settingsPanel">([\s\S]*?)<\/div>\s*<!--/);
  assert.ok(myPanel);
  assert.match(myPanel[1], /团队统计/);
  assert.match(html, /onclick="openDashboardFromMy\(\)"/);
  assert.match(script, /function\s+openDashboardFromMy\s*\(/);
});

test('P12 presents a shorter lead summary', () => {
  assert.match(script, /summary\.textContent = `当前 \$\{rows\.length\} 条 · 已认领 \$\{claimed\} · 有联系方式 \$\{phone\}`/);
  assert.doesNotMatch(script, /默认按距离近到远/);
});
