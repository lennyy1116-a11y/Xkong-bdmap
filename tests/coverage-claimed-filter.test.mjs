import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('1km coverage filters expose claimed clinics instead of contact availability', () => {
  const filters = html.match(/<div class="coverage-source-filters" id="coverageSourceFilters"[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(filters, /data-filter="claimed"[^>]*>已认领/);
  assert.doesNotMatch(filters, /data-filter="phone"|有联系方式/);
});

test('claimed coverage filter uses ownership and summary reports claimed count', () => {
  const passBody = app.match(/function passCoverageFilter\(p\)[\s\S]*?\n}/)?.[0] || '';
  assert.match(passBody, /f === 'claimed'/);
  assert.match(passBody, /!isUnclaimedOwnerId\(getOwnerId\(p\)\)/);

  const renderBody = app.match(/function renderCoverageClinicPage\(\)[\s\S]*?\n}\n\n/)?.[0] || '';
  assert.match(renderBody, /const claimedCount = allHits\.filter/);
  assert.match(renderBody, /已认领 \$\{claimedCount\} 家/);
  assert.doesNotMatch(renderBody, /有联系方式/);
});
