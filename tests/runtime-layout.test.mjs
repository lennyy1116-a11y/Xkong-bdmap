import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('base clinic load completion always leaves the workbench loading state', () => {
  const body = app.match(/async function loadBaseClinics\(\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(body, /await\s+renderLeadHomeList\(\)|renderLeadHomeList\(\)/, 'base pool load must render the workbench directly');
  assert.match(body, /leadHomeSummary/, 'base pool failure must replace the indefinite loading copy');
});

test('removed legacy controls cannot abort initialization before init runs', () => {
  for (const id of ['btnMall', 'btnSettings', 'btnSearch']) {
    assert.doesNotMatch(app, new RegExp(`document\\.getElementById\\(['\"]${id}['\"]\\)\\.on\\w+\\s*=`), `${id} is optional after information-architecture cleanup`);
  }
  assert.match(app, /optionalEventBindings/);
  assert.match(app, /if\s*\(element\)\s*element\[eventName\]\s*=\s*handler/);
  assert.ok(app.lastIndexOf('init();') > app.indexOf('optionalEventBindings'), 'init must remain reachable after optional bindings');
});

test('primary workbench keeps a usable mobile list viewport', () => {
  assert.match(html, /\.lead-home-header\s*\{[^}]*max-height\s*:/s, 'header must be capped on small screens');
  assert.match(html, /\.lead-home-header\s*\{[^}]*overflow-y\s*:\s*auto/s, 'oversized filters must scroll inside the header');
  assert.match(html, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.identity-notice\s*\{[^}]*display\s*:\s*none/s, 'mobile should not spend permanent first-screen space on identity guidance');
});

test('off-canvas panels are non-interactive while closed', () => {
  for (const selector of ['.list-panel', '.settings-panel', '.dashboard-panel', '.mall-panel', '.admin-panel', '.search-panel', '.sheet']) {
    const escaped = selector.replace('.', '\\.');
    assert.match(html, new RegExp(`${escaped}\\s*\\{[^}]*pointer-events\\s*:\\s*none`, 's'), `${selector} must ignore pointer events while closed`);
    assert.match(html, new RegExp(`${escaped}\\.active\\s*\\{[^}]*pointer-events\\s*:\\s*auto`, 's'), `${selector}.active must restore pointer events`);
  }
});
