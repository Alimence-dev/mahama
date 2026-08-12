const pool = require('../config/db');
const { normalizePhoneNumber, isValidE164 } = require('../utils/phone');

const RELATIONSHIPS = ['self', 'spouse', 'child', 'parent', 'sibling', 'other'];
const GENDERS = ['male', 'female', 'other'];

// Normalizes m.phone_number to E.164 in place (07XXXXXXXX -> +2507XXXXXXXX) so every
// caller (create, add member) stores and sends a number the SMS gateway can dial.
function validateMember(m) {
  if (!m || typeof m !== 'object') return 'each member must be an object';
  if (!m.name) return 'member name is required';
  if (m.age === undefined || m.age === null || Number.isNaN(Number(m.age))) return 'member age is required';
  if (Number(m.age) < 0 || Number(m.age) > 120) return 'member age must be between 0 and 120';
  if (!GENDERS.includes(m.gender)) return `member gender must be one of ${GENDERS.join(', ')}`;
  if (!RELATIONSHIPS.includes(m.relationship_to_head)) {
    return `relationship_to_head must be one of ${RELATIONSHIPS.join(', ')}`;
  }

  m.phone_number = normalizePhoneNumber(m.phone_number);
  if (m.phone_number && !isValidE164(m.phone_number)) {
    return `phone_number must be in international format, e.g. +250788000001 (got "${m.phone_number}")`;
  }

  return null;
}

// A single person is a family of size 1 with one 'self' member — same code path as a multi-member family.
async function createFamily(req, res) {
  const { members, secondary_contact_index } = req.body;

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ message: 'members must be a non-empty array' });
  }

  for (const m of members) {
    const err = validateMember(m);
    if (err) return res.status(400).json({ message: err });
  }

  const selfMembers = members.filter((m) => m.relationship_to_head === 'self');
  if (selfMembers.length !== 1) {
    return res.status(400).json({ message: 'exactly one member must have relationship_to_head "self" (the head of family)' });
  }

  if (
    secondary_contact_index !== undefined &&
    secondary_contact_index !== null &&
    (secondary_contact_index < 0 || secondary_contact_index >= members.length)
  ) {
    return res.status(400).json({ message: 'secondary_contact_index is out of range' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [familyResult] = await conn.query(
      'INSERT INTO families (family_size, registered_by) VALUES (?, ?)',
      [members.length, req.user.id]
    );
    const familyId = familyResult.insertId;

    const memberIds = [];
    for (const m of members) {
      const [r] = await conn.query(
        'INSERT INTO refugees (family_id, name, age, gender, relationship_to_head, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
        [familyId, m.name, m.age, m.gender, m.relationship_to_head, m.phone_number]
      );
      memberIds.push(r.insertId);
    }

    const headIndex = members.findIndex((m) => m.relationship_to_head === 'self');
    const headId = memberIds[headIndex];
    const secondaryContactId =
      secondary_contact_index !== undefined && secondary_contact_index !== null
        ? memberIds[secondary_contact_index]
        : null;

    await conn.query(
      'UPDATE families SET head_of_family_id = ?, secondary_contact_id = ? WHERE id = ?',
      [headId, secondaryContactId, familyId]
    );

    await conn.commit();

    res.status(201).json({
      id: familyId,
      family_size: members.length,
      head_of_family_id: headId,
      secondary_contact_id: secondaryContactId,
      members: members.map((m, i) => ({ id: memberIds[i], ...m })),
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to register family', error: err.message });
  } finally {
    conn.release();
  }
}

async function listFamilies(req, res) {
  const [rows] = await pool.query(
    `SELECT f.id, f.family_size, f.created_at, f.head_of_family_id, f.secondary_contact_id,
            h.name AS head_name, u.name AS registered_by_name
     FROM families f
     LEFT JOIN refugees h ON h.id = f.head_of_family_id
     LEFT JOIN users u ON u.id = f.registered_by
     ORDER BY f.created_at DESC`
  );
  res.json(rows);
}

async function getFamily(req, res) {
  const { id } = req.params;

  const [families] = await pool.query(
    `SELECT f.id, f.family_size, f.created_at, f.head_of_family_id, f.secondary_contact_id, f.registered_by
     FROM families f WHERE f.id = ?`,
    [id]
  );
  const family = families[0];
  if (!family) return res.status(404).json({ message: 'Family not found' });

  const [members] = await pool.query(
    'SELECT id, name, age, gender, relationship_to_head, phone_number FROM refugees WHERE family_id = ? ORDER BY id',
    [id]
  );

  res.json({ ...family, members });
}

async function updateFamily(req, res) {
  const { id } = req.params;
  const { secondary_contact_id } = req.body;

  const [families] = await pool.query('SELECT id FROM families WHERE id = ?', [id]);
  if (!families[0]) return res.status(404).json({ message: 'Family not found' });

  if (secondary_contact_id !== undefined && secondary_contact_id !== null) {
    const [members] = await pool.query(
      'SELECT id FROM refugees WHERE id = ? AND family_id = ?',
      [secondary_contact_id, id]
    );
    if (!members[0]) {
      return res.status(400).json({ message: 'secondary_contact_id must belong to this family' });
    }
  }

  await pool.query('UPDATE families SET secondary_contact_id = ? WHERE id = ?', [
    secondary_contact_id ?? null,
    id,
  ]);

  res.json({ message: 'Family updated' });
}

async function addMember(req, res) {
  const { id } = req.params;
  const member = req.body;

  const err = validateMember(member);
  if (err) return res.status(400).json({ message: err });
  if (member.relationship_to_head === 'self') {
    return res.status(400).json({ message: 'cannot add a second "self" member to a family' });
  }

  const [families] = await pool.query('SELECT id FROM families WHERE id = ?', [id]);
  if (!families[0]) return res.status(404).json({ message: 'Family not found' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO refugees (family_id, name, age, gender, relationship_to_head, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
      [id, member.name, member.age, member.gender, member.relationship_to_head, member.phone_number]
    );
    await conn.query('UPDATE families SET family_size = family_size + 1 WHERE id = ?', [id]);
    await conn.commit();
    res.status(201).json({ id: r.insertId, family_id: Number(id), ...member });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to add member', error: e.message });
  } finally {
    conn.release();
  }
}

async function updateMember(req, res) {
  const { id, memberId } = req.params;
  const { name, age, gender, phone_number } = req.body;

  const [members] = await pool.query(
    'SELECT id, phone_number FROM refugees WHERE id = ? AND family_id = ?',
    [memberId, id]
  );
  const existing = members[0];
  if (!existing) return res.status(404).json({ message: 'Member not found in this family' });

  if (gender !== undefined && !GENDERS.includes(gender)) {
    return res.status(400).json({ message: `gender must be one of ${GENDERS.join(', ')}` });
  }

  if (age !== undefined && age !== null && (Number.isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
    return res.status(400).json({ message: 'age must be between 0 and 120' });
  }

  // 'phone_number' in req.body distinguishes "clear it" (empty string/null sent) from "not sent" —
  // COALESCE alone can't tell those apart, since both would coalesce to the existing value.
  let finalPhone = existing.phone_number;
  if ('phone_number' in req.body) {
    finalPhone = normalizePhoneNumber(phone_number);
    if (finalPhone && !isValidE164(finalPhone)) {
      return res.status(400).json({
        message: `phone_number must be in international format, e.g. +250788000001 (got "${finalPhone}")`,
      });
    }
  }

  await pool.query(
    `UPDATE refugees SET
       name = COALESCE(?, name),
       age = COALESCE(?, age),
       gender = COALESCE(?, gender),
       phone_number = ?
     WHERE id = ?`,
    [name ?? null, age ?? null, gender ?? null, finalPhone, memberId]
  );

  res.json({ message: 'Member updated' });
}

module.exports = { createFamily, listFamilies, getFamily, updateFamily, addMember, updateMember };
