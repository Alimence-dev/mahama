// Normalizes Rwandan local-format numbers (07XXXXXXXX) to E.164 (+2507XXXXXXXX).
// Numbers already starting with '+' are passed through unchanged.
function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/[\s-]/g, '');
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) return trimmed;
  if (/^0\d{9}$/.test(trimmed)) return '+250' + trimmed.slice(1);
  return trimmed;
}

function isValidE164(value) {
  return /^\+\d{9,15}$/.test(value);
}

module.exports = { normalizePhoneNumber, isValidE164 };
