import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');
const pool = JSON.parse(readFileSync(new URL('../tcm-base-clinics.json', import.meta.url), 'utf8'));
const taxonomySource = app.match(/const LEAD_CATEGORY_TAXONOMY = \{[\s\S]*?\n\};/)?.[0];
const codeMapSource = app.match(/const LEAD_CATEGORY_CODE_TO_NAME = \{[\s\S]*?\n\};/)?.[0];
const nameToCodeSource = app.match(/const LEAD_CATEGORY_NAME_TO_CODE = [^;]+;/)?.[0];
const secondaryMapSource = app.match(/const LEAD_SECONDARY_NAME_TO_CODE = Object\.fromEntries\([\s\S]*?\n\}\)\.flatMap\([\s\S]*?\)\);/)?.[0];
const hasValidSource = app.match(/function hasValidTaxonomy\(row\) \{[\s\S]*?\n\}/)?.[0];
const categorySource = app.match(/function getLeadCategory\(row\) \{[\s\S]*?\n\}/)?.[0];

const ctx = runInNewContext(`${taxonomySource};${codeMapSource};${nameToCodeSource};${secondaryMapSource};${hasValidSource};${categorySource}; ({LEAD_CATEGORY_TAXONOMY, LEAD_SECONDARY_NAME_TO_CODE, getLeadCategory, hasValidTaxonomy})`);

test('production pool uses only canonical 9x76 taxonomy and contains no legacy category fields', () => {
  assert.equal(pool.length, 12516);
  assert.equal(Object.keys(ctx.LEAD_CATEGORY_TAXONOMY).length, 9);
  assert.equal(Object.values(ctx.LEAD_CATEGORY_TAXONOMY).flat().length, 76);
  for (const [code, name] of [
    ['TCM-03','中医针灸专科地点'], ['TCM-04','中医流动／外展服务'], ['TCM-05','中药房／中药材零售'],
    ['AHP-07','义肢矫形／辅助器具中心'], ['CARE-01','上门护理／家居护理'], ['CARE-06','暂托／喘息服务'],
    ['CARE-09','产后／母婴护理中心'], ['FIT-02','私人教练工作室'], ['FIT-04','普拉提馆'],
    ['FIT-05','舞蹈／团体健身工作室'], ['FIT-06','拳击／武术训练馆'], ['FIT-07','游泳／水中运动中心'],
    ['FIT-08','体育会／综合运动中心'], ['NUT-03','药房／药店'], ['NUT-05','医疗设备／康复用品店'],
    ['NUT-06','有机／健康食品零售'], ['FNB-04','素食／纯素餐厅'], ['FNB-05','低糖／低碳／控卡餐饮'],
    ['FNB-06','健康烘焙／健康甜品'], ['FNB-07','营养餐制作／配送']
  ]) {
    assert.equal(ctx.LEAD_SECONDARY_NAME_TO_CODE[name], code, `${code} ${name}`);
    assert.ok(Object.values(ctx.LEAD_CATEGORY_TAXONOMY).flat().includes(name), name);
  }
  for (const row of pool) {
    assert.equal(ctx.hasValidTaxonomy(row), true, row.id);
    for (const key of ['type','primaryCategory','secondaryCategory','legacyPrimaryCategory','legacySecondaryCategory']) {
      assert.equal(Object.hasOwn(row, key), false, `${row.id} still has ${key}`);
    }
  }
});

test('BDmap reads canonical code/name fields only and never guesses institution taxonomy from legacy type or keywords', () => {
  assert.deepEqual({ ...ctx.getLeadCategory({ primary_l1_code:'TCM', primary_l1_name:'中医与传统医学', primary_l2_code:'TCM-01', primary_l2_name:'中医综合诊所' }) }, { primary:'中医与传统医学', secondary:'中医综合诊所' });
  assert.deepEqual({ ...ctx.getLeadCategory({ name:'某中医诊所', type:'中医诊所', primaryCategory:'中医与传统医学', secondaryCategory:'中医综合诊所' }) }, { primary:'待复核', secondary:'待复核' });
  assert.doesNotMatch(categorySource, /row\.type|primaryCategory|secondaryCategory|const rules/);
});

test('all BDmap category controls and exports use the new taxonomy', () => {
  for (const category of Object.keys(ctx.LEAD_CATEGORY_TAXONOMY)) {
    assert.match(html, new RegExp(`data-category="${category}"`));
    assert.match(app, new RegExp(`LEAD_CATEGORY_TAXONOMY[\\s\\S]*['"]${category}['"]`));
  }
  assert.match(app, /Object\.keys\(LEAD_CATEGORY_TAXONOMY\)/);
  assert.doesNotMatch(html, /data-category="待分类"|data-filter="推拿按摩"|data-filter="健康养生"|data-filter="美容美体"|data-filter="餐饮"/);
  assert.match(app, /CLINIC_EXPORT_HEADERS = \['clinic_id'[\s\S]*'primary_l1_code'[\s\S]*'primary_l2_name'/);
  assert.match(app, /BATCH_SHOP_HEADERS = \['店铺名称','一级类目','二级类目'/);
  assert.doesNotMatch(app, /BATCH_SHOP_HEADERS = \['店铺名称','类型'/);
});

test('institution save requires complete canonical taxonomy and keeps type point-only', () => {
  const body = app.match(/async function savePlace\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(body, /type: entryKind === 'point' \? selectedType : ''/);
  assert.match(body, /请选择完整的一级和二级类目/);
  assert.match(body, /Object\.assign\(data, getTaxonomyFields\(primary, secondary\)\)/);
  assert.doesNotMatch(body, /primaryCategory:/);
  assert.doesNotMatch(body, /secondaryCategory:/);
});
