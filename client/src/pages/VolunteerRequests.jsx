import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listInventory, createInventoryItem } from '../api/inventory';
import { listRequests, createRequest } from '../api/requests';
import { listFamilies } from '../api/families';
import socket from '../socket';
import LowStockBadge from '../components/LowStockBadge';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

const CATEGORIES = ['Food', 'Hygiene', 'Clothing & Materials'];

function emptyItemForm() {
  return { name: '', category: CATEGORIES[0], quantity_available: '', unit: '', low_stock_threshold: 10 };
}

export default function VolunteerRequests() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [families, setFamilies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm());
  const [requestForm, setRequestForm] = useState({ family_id: '', item_id: '', quantity_requested: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reloadAll() {
    try {
      const [inv, fam, reqs] = await Promise.all([
        listInventory(token),
        listFamilies(token),
        listRequests(token),
      ]);
      setInventory(inv);
      setFamilies(fam);
      setRequests(reqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAll();
    socket.connect();
    socket.on('request-updated', reloadAll);
    return () => {
      socket.off('request-updated', reloadAll);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddItem(e) {
    e.preventDefault();
    setError('');
    try {
      await createInventoryItem(token, {
        ...itemForm,
        quantity_available: Number(itemForm.quantity_available),
        low_stock_threshold: Number(itemForm.low_stock_threshold),
      });
      setItemForm(emptyItemForm());
      reloadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setError('');
    try {
      await createRequest(token, {
        family_id: Number(requestForm.family_id),
        item_id: Number(requestForm.item_id),
        quantity_requested: Number(requestForm.quantity_requested),
      });
      setRequestForm({ family_id: '', item_id: '', quantity_requested: '' });
      reloadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Inventory & Resource Requests" backTo="/volunteer" backLabel="Back to dashboard" />
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      <h2>Inventory</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Available</th><th>Unit</th><th>Low-stock threshold</th></tr>
        </thead>
        <tbody>
          {inventory.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td><td>{i.category}</td>
              <td>{i.quantity_available}<LowStockBadge item={i} /></td>
              <td>{i.unit}</td>
              <td>{i.low_stock_threshold}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add inventory item</h3>
      <form onSubmit={handleAddItem}>
        <label>Name <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required /></label>
        <label>
          Category
          <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Quantity <input type="number" min="0" value={itemForm.quantity_available} onChange={(e) => setItemForm({ ...itemForm, quantity_available: e.target.value })} required /></label>
        <label>Unit <input type="text" placeholder="kg, pcs, box" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} required /></label>
        <label>Low-stock threshold <input type="number" min="0" value={itemForm.low_stock_threshold} onChange={(e) => setItemForm({ ...itemForm, low_stock_threshold: e.target.value })} required /></label>
        <button type="submit">Add item</button>
      </form>

      <h2>Submit resource request</h2>
      <form onSubmit={handleSubmitRequest}>
        <label>
          Family
          <select value={requestForm.family_id} onChange={(e) => setRequestForm({ ...requestForm, family_id: e.target.value })} required>
            <option value="" disabled>Select family</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>#{f.id} - {f.head_name} (size {f.family_size})</option>
            ))}
          </select>
        </label>
        <label>
          Item
          <select value={requestForm.item_id} onChange={(e) => setRequestForm({ ...requestForm, item_id: e.target.value })} required>
            <option value="" disabled>Select item</option>
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
            ))}
          </select>
        </label>
        <label>
          Quantity requested
          <input type="number" min="1" value={requestForm.quantity_requested} onChange={(e) => setRequestForm({ ...requestForm, quantity_requested: e.target.value })} required />
        </label>
        <button type="submit">Submit request</button>
      </form>

      <h2>Requests</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Family</th><th>Item</th><th>Qty</th><th>Status</th><th>Requested by</th><th>Created</th></tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>#{r.family_id} - {r.head_name}</td>
              <td>{r.item_name}</td>
              <td>{r.quantity_requested} {r.unit}</td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.requested_by_name}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
