import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('resource mall panel remembers its source and back returns to resource center', () => {
  assert.match(app, /let mallPanelSource = 'map'/);
  assert.match(app, /function openMallPanel\(source\)[\s\S]*mallPanelSource = source === 'resources' \? 'resources' : 'map'/);
  assert.match(app, /function closeMallPanel\(\)[\s\S]*if \(returnTarget === 'resources'\)[\s\S]*openResourceCenter\('institution'\)/);
  assert.match(app, /function hideMallPanel\(\)/);
});

test('owner deletion uses one confirmation path and can remove current local profile', () => {
  const body = app.match(/async function deleteOwnerData[\s\S]*?\n}\nasync function cleanupLegacyTcmImport/)?.[0] || '';
  assert.ok(body);
  assert.match(body, /bulkDeleteIds\(ids, \{ confirmed:true/);
  assert.doesNotMatch(body, /await bulkDeleteIds\(ids\);/);
  assert.match(body, /localStorage\.removeItem\(USERNAME_KEY\)/);
});

test('bulk delete supports a preconfirmed admin flow without a second prompt', () => {
  assert.match(app, /async function bulkDeleteIds\(ids, options = \{\}\)/);
  assert.match(app, /if \(!options\.confirmed\)/);
});

test('20 plus owners use compact selectors instead of rendering every owner as a chip', () => {
  assert.match(html, /id="mapOwnerSelect"/);
  assert.match(html, /id="ownerSelect"/);
  const mapBody = app.match(/function updateMapFilterBar\(\)[\s\S]*?\n}\nfunction getFilteredPlaces/)?.[0] || '';
  const listBody = app.match(/function renderOwnerFilters\(\)[\s\S]*?\n}\nfunction savePlaces/)?.[0] || '';
  assert.match(mapBody, /renderOwnerSelectOptions/);
  assert.match(listBody, /renderOwnerSelectOptions/);
  assert.doesNotMatch(mapBody, /owners\.map\(o =>/);
  assert.match(listBody, /<option value=/);
  assert.doesNotMatch(listBody, /owner-chip/);
});
