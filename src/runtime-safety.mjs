function numericCoordinate(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function coordinateKey(row) {
  const lat = numericCoordinate(row && row.lat);
  const lng = numericCoordinate(row && row.lng);
  if (lat === null || lng === null) return '';
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function coordinateGroupPlan(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const key = coordinateKey(row);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const plan = new Map();
  for (const group of groups.values()) {
    group.forEach((row, index) => plan.set(row.id, { index, total: group.length }));
  }
  return plan;
}

export function nextRevision(record) {
  const revision = Number(record && record.revision);
  return (Number.isFinite(revision) && revision >= 0 ? revision : 0) + 1;
}

export function assertExpectedRevision(current, expectedRevision) {
  if (expectedRevision === undefined) return;
  if (expectedRevision === null) {
    if (current) {
      const error = new Error('记录ID已存在，已阻止覆盖');
      error.code = 'record-already-exists';
      throw error;
    }
    return;
  }
  const currentRevision = Number(current && current.revision) || 0;
  if (currentRevision !== Number(expectedRevision)) {
    const error = new Error('记录已被其他人更新，请重新打开后再保存');
    error.code = 'revision-conflict';
    error.currentRevision = currentRevision;
    error.expectedRevision = Number(expectedRevision);
    throw error;
  }
}

export function prepareRevisionedWrite(data, current) {
  return { ...data, revision: nextRevision(current) };
}

const api = { coordinateKey, coordinateGroupPlan, nextRevision, assertExpectedRevision, prepareRevisionedWrite };
if (typeof window !== 'undefined') window.BDMapRuntimeSafety = api;
export default api;
