import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFamily, updateFamily, addMember, updateMember } from '../api/families';
import { normalizePhoneNumber } from '../utils/phone';
import PageHeader from '../components/PageHeader';

const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'other'];
const GENDERS = ['male', 'female', 'other'];

function emptyMember() {
  return { name: '', age: '', gender: 'male', relationship_to_head: 'spouse', phone_number: '' };
}

export default function FamilyDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [family, setFamily] = useState(null);
  const [error, setError] = useState('');
  const [newMember, setNewMember] = useState(emptyMember());
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  async function reload() {
    try {
      const data = await getFamily(token, id);
      setFamily(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSetSecondaryContact(memberId) {
    try {
      await updateFamily(token, id, { secondary_contact_id: memberId });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    try {
      await addMember(token, id, { ...newMember, age: Number(newMember.age) });
      setNewMember(emptyMember());
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(member) {
    setEditingId(member.id);
    setEditValues({ name: member.name, age: member.age, gender: member.gender, phone_number: member.phone_number || '' });
  }

  async function handleSaveEdit(memberId) {
    try {
      await updateMember(token, id, memberId, { ...editValues, age: Number(editValues.age) });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title={family ? `Family #${family.id}` : 'Family'} backTo="/volunteer" backLabel="Back to families" />
      {error && <p className="error">{error}</p>}
      {!family && !error && <p className="loading">Loading...</p>}
      {family && (
        <>
      <p>Family size: {family.family_size}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Relationship</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {family.members.map((m) => (
            <tr key={m.id}>
              {editingId === m.id ? (
                <>
                  <td><input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} /></td>
                  <td><input type="number" value={editValues.age} onChange={(e) => setEditValues({ ...editValues, age: e.target.value })} /></td>
                  <td>
                    <select value={editValues.gender} onChange={(e) => setEditValues({ ...editValues, gender: e.target.value })}>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td>{m.relationship_to_head}</td>
                  <td>
                    <input
                      value={editValues.phone_number}
                      onChange={(e) => setEditValues({ ...editValues, phone_number: e.target.value })}
                      onBlur={(e) => setEditValues((v) => ({ ...v, phone_number: normalizePhoneNumber(e.target.value) }))}
                    />
                  </td>
                  <td>
                    {m.id === family.head_of_family_id && 'Head'}
                    {m.id === family.secondary_contact_id && ' Secondary contact'}
                  </td>
                  <td>
                    <button onClick={() => handleSaveEdit(m.id)}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{m.name}</td>
                  <td>{m.age}</td>
                  <td>{m.gender}</td>
                  <td>{m.relationship_to_head}</td>
                  <td>{m.phone_number || '-'}</td>
                  <td>
                    {m.id === family.head_of_family_id && 'Head'}
                    {m.id === family.secondary_contact_id && ' Secondary contact'}
                  </td>
                  <td>
                    <button className="btn-secondary" onClick={() => startEdit(m)}>Edit</button>
                    {m.id !== family.head_of_family_id && m.id !== family.secondary_contact_id && (
                      <button className="btn-secondary" onClick={() => handleSetSecondaryContact(m.id)}>Make secondary contact</button>
                    )}
                    {m.id === family.secondary_contact_id && (
                      <button className="btn-secondary" onClick={() => handleSetSecondaryContact(null)}>Unset secondary contact</button>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Add family member</h2>
      <form onSubmit={handleAddMember}>
        <label>
          Name
          <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} required />
        </label>
        <label>
          Age
          <input type="number" min="0" value={newMember.age} onChange={(e) => setNewMember({ ...newMember, age: e.target.value })} required />
        </label>
        <label>
          Gender
          <select value={newMember.gender} onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>
          Relationship to head
          <select value={newMember.relationship_to_head} onChange={(e) => setNewMember({ ...newMember, relationship_to_head: e.target.value })}>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Phone number (optional)
          <input
            placeholder="07XXXXXXXX or +250..."
            value={newMember.phone_number}
            onChange={(e) => setNewMember({ ...newMember, phone_number: e.target.value })}
            onBlur={(e) => setNewMember((v) => ({ ...v, phone_number: normalizePhoneNumber(e.target.value) }))}
          />
        </label>
        <button type="submit">Add member</button>
      </form>
        </>
      )}
    </div>
  );
}
