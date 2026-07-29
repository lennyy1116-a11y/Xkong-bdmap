function stringValue(value) {
  return String(value ?? '');
}

export function escapeHtml(value) {
  return stringValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function escapeInlineJsString(value) {
  return stringValue(value)
    .replace(/\\/g, '\\x5C')
    .replace(/'/g, '\\x27')
    .replace(/"/g, '\\x22')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E')
    .replace(/&/g, '\\x26')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function safeHttpUrl(value) {
  const raw = stringValue(value).trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, 'https://bdmap.invalid/');
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return raw;
  } catch {
    return '';
  }
}

export function safeTelephone(value) {
  const raw = stringValue(value).trim();
  if (!raw) return '';
  return /^[+0-9()\-\s.]{3,40}$/.test(raw) ? raw : '';
}

export function safeEnum(value, allowed = [], fallback = '') {
  const raw = stringValue(value);
  return allowed.includes(raw) ? raw : fallback;
}

const api = { escapeHtml, escapeHtmlAttribute, escapeInlineJsString, safeHttpUrl, safeTelephone, safeEnum };
if (typeof window !== 'undefined') window.BDMapOutputSafety = api;
export default api;
