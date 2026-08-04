export const CANONICAL_INSTITUTION_ID_RE = /^[A-Z]+\d{8}$/;

export function normalizeCanonicalInstitutionId(value) {
  const raw = String(value || '').trim();
  if (CANONICAL_INSTITUTION_ID_RE.test(raw)) return raw;
  if (raw.startsWith('place_')) {
    const unwrapped = raw.slice(6);
    if (CANONICAL_INSTITUTION_ID_RE.test(unwrapped)) return unwrapped;
  }
  return '';
}

export function canonicalClinicId(record) {
  if (!record) return '';
  return normalizeCanonicalInstitutionId(record.id)
    || normalizeCanonicalInstitutionId(record.sourceBaseId)
    || String(record.id || '').trim();
}

export function canonicalIdentityKeys(record) {
  const keys = new Set();
  if (!record) return keys;
  const canonical = canonicalClinicId(record);
  if (canonical) keys.add(canonical);
  const rawId = String(record.id || '').trim();
  const sourceBaseId = String(record.sourceBaseId || '').trim();
  if (rawId) keys.add(rawId);
  if (sourceBaseId) keys.add(sourceBaseId);
  if (rawId.startsWith('place_')) keys.add(rawId.slice(6));
  if (sourceBaseId.startsWith('place_')) keys.add(sourceBaseId.slice(6));
  return keys;
}

export function dedupeCanonicalClinics(records, prefer = (a) => a) {
  const rows = [];
  const indexByKey = new Map();
  for (const record of records || []) {
    const keys = [...canonicalIdentityKeys(record)];
    const existingIndex = keys.map(key => indexByKey.get(key)).find(index => index !== undefined);
    if (existingIndex === undefined) {
      const index = rows.push(record) - 1;
      keys.forEach(key => indexByKey.set(key, index));
    } else {
      rows[existingIndex] = prefer(rows[existingIndex], record);
      keys.forEach(key => indexByKey.set(key, existingIndex));
    }
  }
  return rows;
}

export function makeCanonicalOperationalRecord(base, extra = {}) {
  if (!base) throw new Error('缺少基础机构记录');
  const id = canonicalClinicId(base);
  if (!id) throw new Error('基础机构缺少永久唯一代码');
  const record = { ...base, ...extra, id, isBaseClinic:false };
  delete record.sourceBaseId;
  return record;
}

export function preserveCanonicalIdOnEdit(existing, proposed) {
  if (!existing) return { ...proposed };
  return { ...proposed, id:existing.id };
}

export function snapshotRecord(doc) {
  return { ...(doc && typeof doc.data === 'function' ? doc.data() : {}), id:String(doc && doc.id || '') };
}
