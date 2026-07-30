import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../link-hk-retail-properties.json', import.meta.url), 'utf8'));

test('My page scroll body leaves room for the fixed five-tab bottom navigation', () => {
  assert.match(html, /\.settings-body\s*\{[^}]*padding-bottom:\s*max\(calc\(\s*96px\s*\+\s*env\(safe-area-inset-bottom\)\s*\),\s*96px\)/s);
});

test('place editor modal stays above bottom navigation and keeps its actions clear of the safe area', () => {
  const navZ = Number(html.match(/\.app-nav\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);
  const overlayZ = Number(html.match(/\.sheet-overlay\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);
  const sheetZ = Number(html.match(/\.sheet\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);

  assert.ok(overlayZ > navZ, `sheet overlay z-index ${overlayZ} must exceed app nav ${navZ}`);
  assert.ok(sheetZ > overlayZ, `sheet z-index ${sheetZ} must exceed overlay ${overlayZ}`);
  assert.match(html, /\.sheet\s*\{[^}]*padding-bottom:\s*max\(calc\(\s*20px\s*\+\s*env\(safe-area-inset-bottom\)\s*\),\s*20px\)/s);
  assert.match(app, /function openSheet\(\)\s*\{[\s\S]*sheetOverlay[^\n]*classList\.add\('active'\)[\s\S]*sheet[^\n]*classList\.add\('active'\)/);
  assert.match(app, /function closeSheet\(\)\s*\{[\s\S]*sheetOverlay[^\n]*classList\.remove\('active'\)[\s\S]*sheet[^\n]*classList\.remove\('active'\)/);
});

test('admin and dangerous operations stay locked until the configured password is accepted', () => {
  assert.match(html, /id="adminGate"/);
  assert.match(html, /<input[^>]*type="password"[^>]*id="adminPasswordInput"/);
  assert.match(html, /id="adminControls"[^>]*hidden/);
  assert.match(app, /const ADMIN_PASSWORD_SHA256 = '[a-f0-9]{64}'/);
  assert.doesNotMatch(app, /const ADMIN_PASSWORD\s*=\s*['"]/);
  assert.doesNotMatch(app, /xkong666/);
  assert.match(app, /async function unlockAdminArea\(\)/);
  assert.match(app, /crypto\.subtle\.digest\('SHA-256'/);
  assert.match(app, /function lockAdminArea\(\)/);
  assert.match(app, /function openSettings\(\)[\s\S]*lockAdminArea\(\)/);
});

test('Link Hong Kong retail dataset is versioned, official-source-backed and excludes pure car parks', () => {
  assert.match(data.version, /^link-hk-retail-\d{4}-\d{2}-\d{2}-v\d+$/);
  assert.equal(data.count, data.properties.length);
  assert.ok(data.properties.length >= 70, `expected broad Link HK retail portfolio, got ${data.properties.length}`);
  assert.equal(new Set(data.properties.map(item => item.id)).size, data.properties.length);
  for (const item of data.properties) {
    assert.equal(item.developer, '領展');
    assert.match(item.officialUrl, /^https:\/\/www\.linkreit\.com\/en\/business\/properties\//);
    assert.match(item.assetTypeEN, /retail/i);
    assert.ok(Number.isFinite(item.lat) && item.lat > 22.1 && item.lat < 22.6, `${item.name} latitude invalid`);
    assert.ok(Number.isFinite(item.lng) && item.lng > 113.8 && item.lng < 114.5, `${item.name} longitude invalid`);
    assert.ok(item.nameZH && item.addressZH && item.districtZH);
    assert.notEqual(item.assetTypeEN.trim().toLowerCase(), 'car park');
  }
});

test('mall loader uses the new dataset version to discard legacy built-ins while preserving user-created malls', () => {
  assert.match(app, /const MALL_DATA_VERSION = 'link-hk-retail-2026-07-30-v1'/);
  assert.match(app, /const MALL_DATA_VERSION_KEY = 'bd_map_malls_version'/);
  assert.match(app, /const BUILTIN_LINK_MALLS = /);
  assert.doesNotMatch(app, /BUILTIN_MALLS_116/);
  assert.match(app, /localStorage\.getItem\(MALL_DATA_VERSION_KEY\) !== MALL_DATA_VERSION/);
  assert.match(app, /source !== 'builtin'/);
  assert.match(app, /localStorage\.setItem\(MALL_DATA_VERSION_KEY, MALL_DATA_VERSION\)/);
});
