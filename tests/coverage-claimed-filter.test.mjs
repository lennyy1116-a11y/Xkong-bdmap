import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('coverage ownership filters expose claimed and unclaimed clinics instead of contact availability', () => {
  const start = html.indexOf('id="coverageOwnershipFilters"');
  const filters = start >= 0 ? html.slice(start, html.indexOf('</div>', start)) : '';
  assert.match(filters, /data-owner="claimed"[^>]*>已认领/);
  assert.match(filters, /data-owner="unclaimed"[^>]*>未认领/);
  assert.doesNotMatch(filters, /data-owner="phone"|有联系方式/);
});

test('claimed coverage filter uses ownership and summary reports claimed count', () => {
  const passBody = app.match(/function passSingleCoverageFilter\(p\)[\s\S]*?\n}/)?.[0] || '';
  assert.match(passBody, /coverageOwnership === 'claimed'/);
  assert.match(passBody, /!isUnclaimedOwnerId\(getOwnerId\(p\)\)/);

  const renderBody = app.match(/function renderCoverageClinicPage\(\)[\s\S]*?\n}\n\n/)?.[0] || '';
  assert.match(renderBody, /const claimedCount = hits\.filter/);
  assert.match(renderBody, /已认领 \$\{claimedCount\}/);
  assert.doesNotMatch(renderBody, /有联系方式/);
});
