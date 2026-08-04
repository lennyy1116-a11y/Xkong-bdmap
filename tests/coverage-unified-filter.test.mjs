import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('single coverage uses one collapsible filter panel for distance, taxonomy and ownership', () => {
  const start = html.indexOf('<div class="coverage-filter-panel collapsed" id="coverageFilterPanel">');
  const end = html.indexOf('<div class="export-row">', start);
  const panel = start >= 0 && end > start ? html.slice(start, end) : '';
  assert.match(panel, /id="coverageFilterToggle"/);
  assert.match(panel, /id="coverageRadiusFilters"[\s\S]*data-radius="1"[\s\S]*data-radius="4"/);
  assert.match(panel, /id="coveragePrimaryFilters"/);
  assert.match(panel, /id="coverageSecondaryFilters"/);
  assert.match(panel, /id="coverageOwnershipFilters"[\s\S]*data-owner="all"[\s\S]*data-owner="unclaimed"[\s\S]*data-owner="claimed"/);
  assert.match(panel, /onclick="clearCoverageFilters\(\)"/);
});

test('coverage taxonomy controls are generated from canonical 9 by 76 taxonomy', () => {
  assert.match(app, /function renderCoverageTaxonomyFilters\(\)/);
  assert.match(app, /Object\.keys\(LEAD_CATEGORY_TAXONOMY\)/);
  assert.match(app, /LEAD_CATEGORY_TAXONOMY\[coveragePrimaryCategory\]/);
  assert.match(app, /function setCoveragePrimaryCategory\(category\)/);
  assert.match(app, /function setCoverageSecondaryCategory\(category\)/);
});

test('single coverage filter is remembered and applied to map, list, summary and export', () => {
  assert.match(app, /const COVERAGE_FILTER_STATE_KEY = 'bd_map_coverage_filter_state'/);
  assert.match(app, /function loadCoverageFilterState\(\)/);
  assert.match(app, /function saveCoverageFilterState\(\)/);
  assert.match(app, /function passSingleCoverageFilter\(p\)/);
  assert.match(app, /renderPool = renderPool\.filter\(passSingleCoverageFilter\)/);
  assert.match(app, /const hits = allHits\.filter\(passSingleCoverageFilter\)/);
  assert.match(app, /getMallClinics\(selected, singleCoverageKm\)\.filter\(passSingleCoverageFilter\)/);
  assert.match(app, /function getCoverageFilterSummaryLabel\(\)/);
});

test('single radius changes rerender all outputs while combo coverage stays fixed at one kilometre', () => {
  const radiusBody = app.match(/function setCoverageRadius\(km\)[\s\S]*?\n}/)?.[0] || '';
  assert.match(radiusBody, /saveCoverageFilterState\(\)/);
  assert.match(radiusBody, /renderMalls\(\)/);
  assert.match(radiusBody, /renderMarkers\(\)/);
  assert.match(radiusBody, /renderCoverageClinicPage\(\)/);
  assert.match(app, /const clinics = getMallClinics\(c\);/);
  assert.match(app, /radius:COVERAGE_KM\*1000/);
});

test('mobile coverage filter defaults collapsed and exposes a compact condition summary', () => {
  assert.match(html, /class="coverage-filter-panel collapsed" id="coverageFilterPanel"/);
  assert.match(html, /id="coverageFilterCondition"/);
  assert.match(html, /@media \(max-width:520px\)[\s\S]*\.coverage-filter-panel:not\(\.collapsed\)/);
});
