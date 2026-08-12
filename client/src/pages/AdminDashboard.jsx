import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listUsers, registerUser } from '../api/users';
import { listInventory, restockInventoryItem } from '../api/inventory';
import LowStockBadge from '../components/LowStockBadge';
import PageHeader from '../components/PageHeader';

const ROLES = ['admin', 'volunteer', 'manager', 'donor'];

function emptyForm() {
  return { name: '', email: '', password: '', role: 'volunteer' };
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const [userData, inventoryData] = await Promise.all([listUsers(token), listInventory(token)]);
      setUsers(userData);
      setInventory(inventoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestock(itemId) {
    setError('');
    const amount = Number(restockAmounts[itemId]);
    if (!amount || amount <= 0) {
      setError('Enter a positive restock amount');
      return;
    }
    try {
      await restockInventoryItem(token, itemId, amount);
      setRestockAmounts({ ...restockAmounts, [itemId]: '' });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerUser(token, form);
      setForm(emptyForm());
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Admin Dashboard" nav={[{ to: '/reports', label: 'Reports' }]} />
      {loading && <p className="loading">Loading...</p>}

      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Inventory restock</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Available</th><th>Unit</th><th>Restock</th></tr>
        </thead>
        <tbody>
          {inventory.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.category}</td>
              <td>{i.quantity_available}<LowStockBadge item={i} /></td>
              <td>{i.unit}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  style={{ width: '5em' }}
                  value={restockAmounts[i.id] || ''}
                  onChange={(e) => setRestockAmounts({ ...restockAmounts, [i.id]: e.target.value })}
                />
                <button onClick={() => handleRestock(i.id)}>Restock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Register new user</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label>
          Name
          <input type="text" name="new-user-name" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" name="new-user-email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" name="new-user-password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create user'}</button>
      </form>
    </div>
  );
}
