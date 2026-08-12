const AfricasTalking = require('africastalking')({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});
const sms = AfricasTalking.SMS;
const pool = require('../config/db');

function buildVoucherHtml({ familyId, headName, itemName, quantity, unit, distributedAt }) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Distribution Voucher - Family #${familyId}</title></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 500px; margin: auto; border: 1px solid #ccc;">
  <h1>Mahama Refugee Camp</h1>
  <h2>Distribution Voucher</h2>
  <p><strong>Family:</strong> #${familyId} (${headName})</p>
  <p><strong>Item:</strong> ${itemName}</p>
  <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
  <p><strong>Distributed at:</strong> ${distributedAt}</p>
  <hr>
  <p>No phone number was on record for this family, so this voucher was generated
  as a printable proof of distribution instead of an SMS.</p>
</body>
</html>`;
}

// Attempts a real Africa's Talking sandbox call and stores the real response (success or failure).
// Falls back to a voucher record only when the family has no phone number on record.
async function notifyFamily({ familyId, headName, headPhone, itemName, quantity, unit, distributedAt }) {
  if (headPhone) {
    const message = `Dear ${headName}, your family (#${familyId}) has received ${quantity} ${unit} of ${itemName} on ${distributedAt}. - Mahama Camp`;
    let status;
    let externalResponse;
    try {
      const response = await sms.send({ to: [headPhone], message });
      status = 'sent';
      externalResponse = JSON.stringify(response);
    } catch (err) {
      status = 'failed';
      // err from the AT SDK / underlying HTTP client can carry circular refs (req/res) —
      // pull out only the safe, serializable parts of the real response.
      externalResponse = JSON.stringify({
        error: err.message,
        code: err.code,
        response: err.response ? { status: err.response.status, data: err.response.data } : undefined,
      });
    }

    const [result] = await pool.query(
      'INSERT INTO notifications (family_id, channel, message, status, external_response) VALUES (?, ?, ?, ?, ?)',
      [familyId, 'sms', message, status, externalResponse]
    );
    return { id: result.insertId, channel: 'sms', status, message, external_response: externalResponse };
  }

  const voucherHtml = buildVoucherHtml({ familyId, headName, itemName, quantity, unit, distributedAt });
  const [result] = await pool.query(
    'INSERT INTO notifications (family_id, channel, message, status, external_response) VALUES (?, ?, ?, ?, NULL)',
    [familyId, 'voucher', voucherHtml, 'logged']
  );
  return { id: result.insertId, channel: 'voucher', status: 'logged', message: voucherHtml };
}

module.exports = { notifyFamily };
