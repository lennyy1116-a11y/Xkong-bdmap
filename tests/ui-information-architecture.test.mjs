import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

function pos(token) {
  const index = html.indexOf(token);
  assert.notEqual(index, -1, `missing ${token}`);
  return index;
}

test('workbench prioritizes my claims before search and removes the today action shortcut', () => {
  assert.ok(!html.includes('id="leadTodayActions"'));
  assert.ok(!html.includes('leadTodayActionsSummary'));
  assert.ok(pos('id="leadMyClaimedSummary"') < pos('id="leadSearchInput"'));
  assert.match(html, /id="leadMyClaimedSummary"[^>]*onclick="openMyClaims\(\)"/);
  assert.match(html, /id="leadFilterPanel"[^>]*class="[^"]*collapsed/);
  assert.match(html, /id="leadFilterCondition"/);
  assert.match(html, /onclick="toggleLeadFilters\(\)"/);
  assert.match(html, /onclick="clearLeadFilters\(\)"/);
});

test('my profile supports role setup and refreshes claim identity after saving', () => {
  assert.match(html, /id="userRoleInput"/);
  assert.match(html, /<option value="BD拓展">BD拓展<\/option>/);
  assert.match(app, /const USER_ROLE_KEY = 'bd_map_user_role'/);
  assert.match(app, /function openMyClaims\(\)/);
  assert.match(app, /openMyFromNav\(\)/);
  assert.match(app, /currentRole = document\.getElementById\('userRoleInput'\)\.value/);
  assert.match(app, /scheduleLeadHomeRender\(\)/);
});

test('claim identity cards use the unified blue slate visual system', () => {
  assert.match(html, /\.lead-priority-card\s*\{[^}]*--claim-accent:#4a90d9/s);
  assert.match(html, /\.identity-notice\s*\{[^}]*background:rgba\(74,144,217,/s);
  assert.doesNotMatch(html, /\.identity-notice\s*\{[^}]*241,196,15/s);
});

test('resource and my navigation use business-facing names and isolated admin surface', () => {
  assert.match(html, /data-tab="resources"[^>]*>资源库</);
  assert.match(html, /id="adminPanel"/);
  assert.match(html, /onclick="openAdminPanel\(\)"/);
  assert.ok(!html.includes('id="adminArea"'));
  assert.ok(!html.includes('如何获取API Key'));
  assert.ok(!html.includes('快捷搜索关键词'));
  assert.ok(!html.includes('P10 UI预览'));
});

test('legacy hidden navigation and blocking first-run identity prompt are removed', () => {
  assert.ok(!html.includes('id="btnMall"'));
  assert.ok(!html.includes('id="btnSettings"'));
  assert.ok(!html.includes('id="homeHint"'));
  assert.doesNotMatch(app, /prompt\(['"]请输入你的名字/);
  assert.match(html, /id="identityNotice"/);
  assert.match(app, /function ensureUserIdentity\(/);
});

test('coverage analysis has one workspace entry and a compact combo status bar', () => {
  assert.match(html, /id="btnCoverageWorkspace"/);
  assert.match(app, /function openCoverageWorkspace\(/);
  assert.ok(!html.includes('id="comboPanel"'));
  assert.doesNotMatch(app, /function openComboPanel\(/);
  assert.match(html, /id="mapComboPrimaryAction"/);
});

test('navigation only activates one of the four primary tabs', () => {
  assert.match(app, /const PRIMARY_APP_TABS\s*=\s*\[[^\]]*'leads'[^\]]*'map'[^\]]*'resources'[^\]]*'my'/s);
  assert.doesNotMatch(app, /setAppTab\(['"]dashboard['"]\)/);
  assert.match(app, /function navigateTo\(/);
});

test('shared app dialog replaces routine browser-native prompt surfaces', () => {
  assert.match(html, /id="appDialog"/);
  assert.match(app, /function showAppDialog\(/);
  assert.match(app, /function showAppConfirm\(/);
  assert.match(app, /function showAppPrompt\(/);
  assert.equal((app.match(/\bprompt\s*\(/g) || []).length, 0);
  assert.equal((app.match(/\balert\s*\(/g) || []).length, 0);
});

test('institution display paths do not fall back to legacy type classification', () => {
  assert.doesNotMatch(app, /p\.address\s*\|\|\s*p\.type/);
  assert.doesNotMatch(app, /p\.type\s*\?\s*['"`]\s*·/);
});
