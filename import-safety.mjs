const HK_BOUNDS = { minLat: 22.10, maxLat: 22.60, minLng: 113.80, maxLng: 114.55 };

function text(value) { return String(value ?? '').trim(); }
function phone(value) { return text(value).replace(/[^0-9+]/g, ''); }
function norm(value) { return text(value).toLowerCase().replace(/[\s,，.。()（）\-_/]/g, ''); }
function clone(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }

export function isValidHongKongCoordinate(lat, lng, options = {}) {
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a < HK_BOUNDS.minLat || a > HK_BOUNDS.maxLat || b < HK_BOUNDS.minLng || b > HK_BOUNDS.maxLng) return false;
  return !(options.forbidden || []).some(point => Math.abs(a - Number(point.lat)) < 1e-7 && Math.abs(b - Number(point.lng)) < 1e-7);
}

export function potentialDuplicates(draft, records = []) {
  const nameKey = norm(draft.name), addrKey = norm(draft.address), phoneKey = phone(draft.phone);
  if (!nameKey && !phoneKey) return [];
  return records.filter(record => {
    const rn = norm(record.name), ra = norm(record.address), rp = phone(record.phone || record.contact);
    if (phoneKey.length >= 6 && rp === phoneKey) return true;
    if (nameKey && addrKey && rn === nameKey && (ra === addrKey || ra.includes(addrKey) || addrKey.includes(ra))) return true;
    return false;
  }).slice(0, 5);
}

export function reviewImportRow(raw = {}, existing = [], options = {}) {
  const row = clone(raw);
  row.messages = Array.isArray(row.messages) ? [...row.messages] : [];
  row.name = text(row.name);
  row.address = text(row.address);
  if (!row.name) row.messages.push('缺店铺名称');
  const validCoord = isValidHongKongCoordinate(row.lat, row.lng, { forbidden: options.forbiddenCoordinates || [] });
  row.coordStatus = validCoord ? 'verified' : 'pending';
  if (!validCoord) row.messages.push('坐标待核，未写入地图');
  row.duplicateMatches = potentialDuplicates(row, existing);
  if (row.duplicateMatches.length) row.messages.push('疑似重复，默认拦截');
  row.importable = !!row.name && validCoord && row.duplicateMatches.length === 0;
  row.reviewStatus = row.importable ? 'ready' : 'blocked';
  return row;
}

export function reviewImportRows(rawRows = [], existing = [], options = {}) {
  const acceptedWithinFile = [];
  const rows = rawRows.map(raw => {
    const reviewed = reviewImportRow(raw, [...existing, ...acceptedWithinFile], options);
    if (reviewed.importable) acceptedWithinFile.push(reviewed);
    return reviewed;
  });
  return {
    rows,
    summary: {
      total: rows.length,
      ready: rows.filter(r => r.importable).length,
      blocked: rows.filter(r => !r.importable).length,
      duplicates: rows.filter(r => r.duplicateMatches.length).length,
      coordinatePending: rows.filter(r => r.coordStatus === 'pending').length
    }
  };
}

export function mergeImportedRecord(existing, incoming, options = {}) {
  const now = options.now || new Date().toISOString();
  if (!existing) return { ...clone(incoming), revision: Number(incoming.revision || 0) + 1, updatedAt: now, updatedBy: options.actor || '匿名' };
  const merged = { ...clone(existing), ...clone(incoming) };
  for (const key of ['ownerId','ownerName','ownerAvatar','visits','createdAt','createdBy','createdByAvatar']) {
    if (Object.hasOwn(existing, key)) merged[key] = clone(existing[key]);
  }
  merged.id = existing.id;
  merged.revision = Number(existing.revision || 0) + 1;
  merged.updatedAt = now;
  merged.updatedBy = options.actor || '匿名';
  return merged;
}

export async function runSafeImport(rows = [], options = {}) {
  if (typeof options.persist !== 'function') throw new Error('缺少持久化函数');
  const ready = rows.filter(row => row && row.importable);
  const blocked = rows.filter(row => !row || !row.importable);
  const succeeded = [], failed = [];
  for (const row of ready) {
    try { await options.persist(row); succeeded.push(row); }
    catch (error) { failed.push({ row, error: error instanceof Error ? error : new Error(String(error)) }); }
  }
  return { successCount:succeeded.length, failureCount:failed.length, blockedCount:blocked.length, succeeded, failed, blocked };
}

const api = { isValidHongKongCoordinate, potentialDuplicates, reviewImportRow, reviewImportRows, mergeImportedRecord, runSafeImport };
if (typeof window !== 'undefined') window.BDMapImportSafety = api;
export default api;
