import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFamily } from '../api/families';
import PageHeader from '../components/PageHeader';

export default function ManagerFamilyDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [family, setFamily] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getFamily(token, id)
      .then(setFamily)
      .catch((err) => setError(err.message));
  }, [token, id]);

  return (
    <div>
      <PageHeader title={family ? `Family #${family.id}` : 'Family'} backTo="/manager/families" backLabel="Back to families" />
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
              </tr>
            </thead>
            <tbody>
              {family.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.age}</td>
                  <td>{m.gender}</td>
                  <td>{m.relationship_to_head}</td>
                  <td>{m.phone_number || '-'}</td>
                  <td>
                    {m.id === family.head_of_family_id && 'Head'}
                    {m.id === family.secondary_contact_id && ' Secondary contact'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
