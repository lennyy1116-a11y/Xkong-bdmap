import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

function body(name, nextName) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} 应存在`);
  const end = app.indexOf(`function ${nextName}(`, start);
  assert.notEqual(end, -1, `${nextName} 应位于 ${name} 之后`);
  return app.slice(start, end);
}

test('手机我的页面可以打开管理员面板并聚焦密码框', () => {
  const fn = body('openAdminPanel', 'closeAdminPanel');
  assert.match(fn, /closePrimaryPanels\(\)/);
  assert.match(fn, /getElementById\('adminPanel'\)\.classList\.add\('active'\)/);
  assert.match(fn, /getElementById\('adminPasswordInput'\).*focus/);
});

test('关闭管理员面板时自动锁定并返回我的页面', () => {
  const fn = body('closeAdminPanel', 'refreshMySystemStatus');
  assert.match(fn, /lockAdminArea\(\)/);
  assert.match(fn, /getElementById\('adminPanel'\)\.classList\.remove\('active'\)/);
  assert.match(fn, /getElementById\('settingsPanel'\)\.classList\.add\('active'\)/);
});
