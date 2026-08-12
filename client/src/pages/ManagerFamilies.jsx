import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listFamilies } from '../api/families';
import PageHeader from '../components/PageHeader';

export default function ManagerFamilies() {
  const { token } = useAuth();
  const [families, setFamilies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFamilies(token)
      .then(setFamilies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <PageHeader title="Families" backTo="/manager" backLabel="Back to dashboard" />
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Head of family</th>
            <th>Size</th>
            <th>Registered by</th>
            <th>Registered on</th>
          </tr>
        </thead>
        <tbody>
          {families.map((f) => (
            <tr key={f.id}>
              <td><Link to={`/manager/families/${f.id}`}>{f.id}</Link></td>
              <td>{f.head_name}</td>
              <td>{f.family_size}</td>
              <td>{f.registered_by_name}</td>
              <td>{new Date(f.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
