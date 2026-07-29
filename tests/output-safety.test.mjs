import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  escapeHtml,
  escapeHtmlAttribute,
  escapeInlineJsString,
  safeHttpUrl,
  safeTelephone,
  safeEnum
} from '../src/output-safety.mjs';

test('HTML文字与属性编码阻止标签和属性逃逸', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtmlAttribute('" autofocus onfocus="alert(1)'), '&quot; autofocus onfocus=&quot;alert(1)');
});

test('内联事件字符串同时阻止JS字符串、HTML属性及script标签逃逸', () => {
  const payload = `x');alert(1);//\"</script><img onerror=alert(2)>\n`;
  const encoded = escapeInlineJsString(payload);
  assert.doesNotMatch(encoded, /['"<>\n\r]/);
  assert.match(encoded, /\\x27/);
  assert.match(encoded, /\\x22/);
  assert.match(encoded, /\\x3C/);
});

test('URL只接受http/https，电话只接受号码字符，枚举只接受白名单', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeHttpUrl('https://example.com/a?q=1'), 'https://example.com/a?q=1');
  assert.equal(safeTelephone('+852 2345-6789'), '+852 2345-6789');
  assert.equal(safeTelephone('123" onclick="alert(1)'), '');
  assert.equal(safeTelephone('javascript:alert(1)'), '');
  assert.equal(safeEnum('已合作', ['未接触', '已合作'], '未接触'), '已合作');
  assert.equal(safeEnum('<img onerror=1>', ['未接触', '已合作'], '未接触'), '未接触');
});

test('页面接入输出安全模块并消除已知的未编码动态HTML路径', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
  assert.match(html, /window\.BDMapOutputSafety\s*=\s*api/);
  assert.doesNotMatch(app, /\$\{v\.date\}/);
  assert.doesNotMatch(app, /\$\{m\.no \? m\.no/);
  assert.doesNotMatch(app, /\+ selectedDistrictName \+ '<\/div>'/);
  assert.doesNotMatch(app, /function jsStr\(s\) \{ return String\(s \|\| ''\)\.replace/);
  assert.doesNotMatch(app, /href=\"tel:\$\{esc\(/);
  assert.doesNotMatch(app, /changeOwnerAvatar\('\$\{escAttr\(/);
  assert.doesNotMatch(app, /deleteOwnerData\('\$\{escAttr\(/);
  assert.match(app, /function safeTelephone\(s\)/);
});

test('搜索结果添加按钮不得把第三方数据写进内联onclick', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const app = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
  const body = app.match(/function renderSearchResults\(allResults, hasMore\) \{([\s\S]*?)\n\}\n\nfunction addFromSearch/)?.[1] || '';
  assert.ok(body, '找不到 renderSearchResults');
  assert.doesNotMatch(body, /onclick=['"]addFromSearch/);
  assert.doesNotMatch(body, /JSON\.stringify\(\{[\s\S]*?name:\s*r\.name/);
  assert.match(body, /data-search-add-index/);
  assert.match(body, /addEventListener\('click'/);
});

test('组合覆盖模式同步不会递归调用自身', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const app = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
  const body = app.match(/function syncComboResultMode\(tab\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.ok(body, '找不到 syncComboResultMode');
  assert.doesNotMatch(body, /syncComboResultMode\(tab\)/);
});
