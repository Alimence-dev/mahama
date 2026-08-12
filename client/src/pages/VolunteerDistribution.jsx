import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listRequests, distributeRequest } from '../api/requests';
import { listDistributions } from '../api/distributions';
import socket from '../socket';
import PageHeader from '../components/PageHeader';

function openVoucher(html) {
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

export default function VolunteerDistribution() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [selectedCollector, setSelectedCollector] = useState({});
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const [reqs, dists] = await Promise.all([listRequests(token), listDistributions(token)]);
      setRequests(reqs);
      setDistributions(dists);
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

  async function handleDistribute(requestId) {
    setError('');
    setLastResult(null);
    const collectedById = selectedCollector[requestId];
    if (!collectedById) {
      setError('Select who is collecting before distributing');
      return;
    }
    try {
      const result = await distributeRequest(token, requestId, Number(collectedById));
      setLastResult(result);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const readyToDistribute = requests.filter((r) => r.status === 'donor_approved');

  return (
    <div>
      <PageHeader title="Distribution" backTo="/volunteer" backLabel="Back to dashboard" />
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      {lastResult && (
        <div>
          <p>
            Distribution recorded for request #{lastResult.request_id}. Notification channel:{' '}
            <strong>{lastResult.notification.channel}</strong>, status: <strong>{lastResult.notification.status}</strong>.
          </p>
          {lastResult.notification.channel === 'voucher' && (
            <button onClick={() => openVoucher(lastResult.notification.message)}>View voucher</button>
          )}
        </div>
      )}

      <h2>Approved requests ready for distribution</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Family</th><th>Item</th><th>Qty</th><th>Collected by</th><th>Action</th></tr>
        </thead>
        <tbody>
          {readyToDistribute.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>#{r.family_id} - {r.head_name}</td>
              <td>{r.item_name}</td>
              <td>{r.quantity_requested} {r.unit}</td>
              <td>
                <select
                  value={selectedCollector[r.id] || ''}
                  onChange={(e) => setSelectedCollector({ ...selectedCollector, [r.id]: e.target.value })}
                >
                  <option value="" disabled>Select collector</option>
                  {r.head_of_family_id && (
                    <option value={r.head_of_family_id}>{r.head_name} (head)</option>
                  )}
                  {r.secondary_contact_id && (
                    <option value={r.secondary_contact_id}>{r.secondary_contact_name} (secondary contact)</option>
                  )}
                </select>
              </td>
              <td>
                <button onClick={() => handleDistribute(r.id)}>Mark distributed</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Distribution history</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Family</th><th>Item</th><th>Qty</th><th>Collected by</th><th>Distributed by</th><th>Distributed at</th></tr>
        </thead>
        <tbody>
          {distributions.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>#{d.family_id} - {d.head_name}</td>
              <td>{d.item_name}</td>
              <td>{d.quantity_requested} {d.unit}</td>
              <td>{d.collected_by_name}</td>
              <td>{d.distributed_by_name}</td>
              <td>{new Date(d.distributed_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
