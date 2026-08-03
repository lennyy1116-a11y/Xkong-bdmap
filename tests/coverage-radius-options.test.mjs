import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('single coverage panel exposes 1km and 4km radius options', () => {
  assert.match(html, /id="coverageRadiusFilters"[\s\S]*data-radius="1"[^>]*>1km<[\s\S]*data-radius="4"[^>]*>4km</);
  assert.match(app, /let singleCoverageKm = COVERAGE_KM;/);
  assert.match(app, /function setCoverageRadius\(km\)/);
  assert.match(app, /\[1, 4\]\.includes\(next\)/);
});

test('single coverage rendering and export use selected radius without changing combo default', () => {
  assert.match(app, /getMallClinics\(selected, singleCoverageKm\)/);
  assert.match(app, /radius:singleCoverageKm\*1000/);
  assert.match(app, /coverage_mode: `single_\$\{singleCoverageKm\}km`/);
  assert.match(app, /getMallClinics\(c\);/);
});

test('coverage cache separates 1km and 4km results', () => {
  assert.match(app, /function coverageCacheKey\(center, radiusKm = COVERAGE_KM\)/);
  assert.match(app, /Number\(radiusKm\)\.toFixed\(2\)/);
  assert.match(app, /function getMallClinics\(mall, radiusKm = COVERAGE_KM\)/);
});
