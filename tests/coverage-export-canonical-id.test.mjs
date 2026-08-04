import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.inline.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function body(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}

test('4km覆盖导出必须在下载前拒绝空白或旧版clinic_id', () => {
  const exportFn = body(app, 'exportCurrentCoverageCsv', 'exportCurrentCoverageErrorTemplate');
  assert.match(exportFn, /assertCanonicalClinicExportRows\(rows\)/);
  const guard = body(app, 'assertCanonicalClinicExportRows', 'exportCurrentCoverageCsv');
  assert.match(guard, /CANONICAL_INSTITUTION_ID_RE/);
  assert.match(guard, /throw new Error/);
  assert.match(exportFn, /请刷新页面后重新导出/);
});

test('4km业务下载只输出统一clinic_id，不暴露历史source_base_id', () => {
  const headers = body(app, 'clinicExportRow', 'exportErrorUploadTemplate');
  const declaration = app.slice(app.indexOf('const CLINIC_EXPORT_HEADERS'), app.indexOf('const ERROR_UPLOAD_ACTIONS'));
  assert.doesNotMatch(declaration, /source_base_id/);
  assert.doesNotMatch(headers, /source_base_id/);
  assert.match(headers, /clinic_id:\s*canonicalClinicId\(p\)/);
});

test('加载基础池时只接受全部使用永久统一识别码的数据', () => {
  const load = body(app, 'loadBaseClinics', 'promoteBaseClinic');
  assert.match(load, /loaded\.filter\([^\n]*normalizeCanonicalInstitutionId/);
  assert.match(load, /基础机构池识别码版本不一致/);
});

test('重复归并后的旧永久码仍可命中保留机构', () => {
  const identity = body(app, 'clinicIdentityKeys', 'hasClinicIdentity');
  assert.match(identity, /legacyInstitutionIds/);
  const resolver = body(app, 'resolveStrongClinicId', 'findClinicForImport');
  assert.match(resolver, /legacyInstitutionIds/);
});

test('碰撞迁移旧码必须结合名称地址唯一匹配，不得静默命中占用旧码的另一机构', () => {
  const resolver = body(app, 'resolveStrongClinicId', 'findClinicForImport');
  assert.match(resolver, /previousCanonicalId/);
  assert.match(resolver, /clinicMatchKey/);
  assert.match(resolver, /matches\.length === 1 \? matches\[0\] : null/);
  const finder = body(app, 'findClinicForImport', 'makeImportEditableRecord');
  assert.match(finder, /resolveStrongClinicId\(id, name, address\)/);
  assert.match(finder, /resolveStrongClinicId\(baseId, name, address\)/);
});

test('页面和基础池都禁用浏览器陈旧缓存', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const values = vercel.headers.flatMap(rule => rule.headers.map(h => `${rule.source}|${h.key}|${h.value}`));
  assert.ok(values.some(v => v.includes('/index.html|Cache-Control|no-store')));
  assert.ok(values.some(v => v.includes('/tcm-base-clinics.json|Cache-Control|no-store')));
  assert.match(html, /clinic_id/);
});
