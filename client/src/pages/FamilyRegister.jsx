import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createFamily } from '../api/families';
import { normalizePhoneNumber } from '../utils/phone';
import PageHeader from '../components/PageHeader';

const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'other'];
const GENDERS = ['male', 'female', 'other'];

function emptyMember(relationship) {
  return { name: '', age: '', gender: 'male', relationship_to_head: relationship, phone_number: '' };
}

export default function FamilyRegister() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([emptyMember('self')]);
  const [secondaryContactIndex, setSecondaryContactIndex] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateMemberField(index, field, value) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMember() {
    setMembers((prev) => [...prev, emptyMember('spouse')]);
  }

  function removeMember(index) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
    if (String(secondaryContactIndex) === String(index)) setSecondaryContactIndex('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        members: members.map((m) => ({ ...m, age: Number(m.age) })),
        secondary_contact_index: secondaryContactIndex === '' ? null : Number(secondaryContactIndex),
      };
      const family = await createFamily(token, payload);
      navigate(`/volunteer/families/${family.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Register Family" backTo="/volunteer" backLabel="Back to families" />
      <p>
        A single person is registered the same way as a family — just leave it at one member
        (the head). Add more members below for a multi-person family.
      </p>

      <form onSubmit={handleSubmit}>
        {members.map((m, i) => (
          <fieldset key={i}>
            <legend>{i === 0 ? 'Head of family (self)' : `Member ${i + 1}`}</legend>

            <label>
              Name
              <input
                type="text"
                value={m.name}
                onChange={(e) => updateMemberField(i, 'name', e.target.value)}
                required
              />
            </label>

            <label>
              Age
              <input
                type="number"
                min="0"
                value={m.age}
                onChange={(e) => updateMemberField(i, 'age', e.target.value)}
                required
              />
            </label>

            <label>
              Gender
              <select value={m.gender} onChange={(e) => updateMemberField(i, 'gender', e.target.value)}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>

            {i > 0 && (
              <label>
                Relationship to head
                <select
                  value={m.relationship_to_head}
                  onChange={(e) => updateMemberField(i, 'relationship_to_head', e.target.value)}
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Phone number (optional)
              <input
                type="tel"
                placeholder="07XXXXXXXX or +250..."
                value={m.phone_number}
                onChange={(e) => updateMemberField(i, 'phone_number', e.target.value)}
                onBlur={(e) => updateMemberField(i, 'phone_number', normalizePhoneNumber(e.target.value))}
              />
            </label>

            {i > 0 && (
              <label>
                <input
                  type="radio"
                  name="secondaryContact"
                  checked={String(secondaryContactIndex) === String(i)}
                  onChange={() => setSecondaryContactIndex(i)}
                />
                Set as secondary contact
              </label>
            )}

            {i > 0 && (
              <button type="button" className="btn-danger" onClick={() => removeMember(i)}>
                Remove member
              </button>
            )}
          </fieldset>
        ))}

        <button type="button" onClick={addMember}>Add family member</button>

        {error && <p className="error">{error}</p>}

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register family'}
          </button>
        </div>
      </form>
    </div>
  );
}
