import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.inline.js', import.meta.url), 'utf8');

test('1km coverage rows open the promoted claimed record and reveal its details', () => {
  const renderBody = app.match(/function renderCoverageClinicPage\(\)[\s\S]*?\n}\n\n/)?.[0] || '';
  assert.match(renderBody, /onclick="openCoverageClinicDetails\('/);

  const openBody = app.match(/function openCoverageClinicDetails\(id\)[\s\S]*?\n}\nfunction renderCoverageClinicPage/)?.[0] || '';
  assert.ok(openBody, 'coverage detail opener should exist');
  assert.match(openBody, /_promotedPlaceId/);
  assert.match(openBody, /getPromotedPlaceForBaseClinic/);
  assert.match(openBody, /closeCoveragePanel\(\)/);
  assert.match(openBody, /goToPlace\(targetId\)/);
});

test('coverage detail opener falls back to the visible coverage record for unclaimed clinics', () => {
  const openBody = app.match(/function openCoverageClinicDetails\(id\)[\s\S]*?\n}\nfunction renderCoverageClinicPage/)?.[0] || '';
  assert.match(openBody, /const targetId = .*\|\| row\.id/);
});
