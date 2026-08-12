import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listRequests, managerReview } from '../api/requests';
import { listInventory } from '../api/inventory';
import LowStockBadge from '../components/LowStockBadge';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import socket from '../socket';

export default function ManagerDashboard() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const [reqs, inv] = await Promise.all([listRequests(token), listInventory(token)]);
      setRequests(reqs);
      setInventory(inv);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    socket.connect();
    socket.on('request-updated', reload);
    return () => {
      socket.off('request-updated', reload);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReview(id, approve) {
    setError('');
    try {
      await managerReview(token, id, approve);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        nav={[
          { to: '/manager/families', label: 'Families' },
          { to: '/reports', label: 'Reports' },
        ]}
      />

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      <h2>Inventory</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Available</th><th>Unit</th></tr>
        </thead>
        <tbody>
          {inventory.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td><td>{i.category}</td>
              <td>{i.quantity_available}<LowStockBadge item={i} /></td>
              <td>{i.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Pending requests</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Family</th><th>Item</th><th>Qty</th><th>Requested by</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {pending.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>#{r.family_id} - {r.head_name}</td>
              <td>{r.item_name}</td>
              <td>{r.quantity_requested} {r.unit}</td>
              <td>{r.requested_by_name}</td>
              <td>
                <button onClick={() => handleReview(r.id, true)}>Forward to donor</button>
                <button className="btn-danger" onClick={() => handleReview(r.id, false)}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Request history</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Family</th><th>Item</th><th>Qty</th><th>Status</th></tr>
        </thead>
        <tbody>
          {others.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>#{r.family_id} - {r.head_name}</td>
              <td>{r.item_name}</td>
              <td>{r.quantity_requested} {r.unit}</td>
              <td><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
