import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = () => fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('生产页面内嵌安全模块，不依赖容易漏传的src目录', () => {
  const page = html();
  assert.doesNotMatch(page, /<script[^>]+src=["']\.\/src\/(?:data|import|output|runtime)-safety\.mjs/);
  for (const globalName of ['BDMapDataSafety', 'BDMapImportSafety', 'BDMapOutputSafety', 'BDMapRuntimeSafety']) {
    assert.match(page, new RegExp(`window\\.${globalName}\\s*=`));
  }
});

test('基础池加载将下载解析错误与渲染错误分开报告', () => {
  const page = html();
  const body = page.match(/async function loadBaseClinics\(\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(body, /if\s*\(!res\.ok\)/);
  assert.match(body, /基础诊所池文件加载失败/);
  assert.match(body, /基础诊所池已加载，但地图渲染失败/);
});