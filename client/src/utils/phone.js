// Normalizes Rwandan local-format numbers (07XXXXXXXX) to E.164 (+2507XXXXXXXX) as the
// volunteer tabs off the field, so what reaches the API (and the SMS gateway) is already dialable.
export function normalizePhoneNumber(raw) {
  if (!raw) return raw;
  const trimmed = String(raw).trim().replace(/[\s-]/g, '');
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('+')) return trimmed;
  if (/^0\d{9}$/.test(trimmed)) return '+250' + trimmed.slice(1);
  return trimmed;
}
