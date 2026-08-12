import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRequestStatusSummary } from '../api/reports';
import { listDistributions } from '../api/distributions';
import { downloadCsv } from '../utils/csv';
import { STATUS_LABELS } from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { ROLE_HOME } from '../constants/roles';

export default function Reports() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const [summaryData, distributionData] = await Promise.all([
        getRequestStatusSummary(token),
        listDistributions(token),
      ]);
      setSummary(summaryData);
      setDistributions(distributionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRequests = summary.reduce((sum, s) => sum + s.count, 0);

  function exportSummaryCsv() {
    downloadCsv(
      'request-status-summary.csv',
      summary.map((s) => ({ status: STATUS_LABELS[s.status] || s.status, count: s.count })),
      [{ label: 'Status', key: 'status' }, { label: 'Count', key: 'count' }]
    );
  }

  function exportDistributionsCsv() {
    downloadCsv(
      'distribution-history.csv',
      distributions,
      [
        { label: 'ID', key: 'id' },
        { label: 'Family ID', key: 'family_id' },
        { label: 'Head of family', key: 'head_name' },
        { label: 'Item', key: 'item_name' },
        { label: 'Quantity', key: 'quantity_requested' },
        { label: 'Unit', key: 'unit' },
        { label: 'Collected by', key: 'collected_by_name' },
        { label: 'Distributed by', key: 'distributed_by_name' },
        { label: 'Distributed at', key: 'distributed_at' },
      ]
    );
  }

  return (
    <div>
      <PageHeader title="Reports" backTo={ROLE_HOME[user.role]} backLabel="Back to dashboard" />
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      <h2>Request status summary</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>Count</th></tr>
        </thead>
        <tbody>
          {summary.map((s) => (
            <tr key={s.status}>
              <td>{STATUS_LABELS[s.status] || s.status}</td>
              <td>{s.count}</td>
            </tr>
          ))}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{totalRequests}</strong></td>
          </tr>
        </tbody>
      </table>
      <button onClick={exportSummaryCsv}>Export CSV</button>

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
      <button onClick={exportDistributionsCsv}>Export CSV</button>
    </div>
  );
}
