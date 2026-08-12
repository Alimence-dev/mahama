const LABELS = {
  pending: 'Pending',
  manager_approved: 'Manager approved',
  donor_approved: 'Donor approved',
  rejected: 'Rejected',
  distributed: 'Distributed',
};

const COLOR_VARS = {
  pending: 'var(--color-warning)',
  manager_approved: 'var(--color-info)',
  donor_approved: 'var(--color-success)',
  rejected: 'var(--color-danger)',
  distributed: 'var(--color-primary)',
};

export default function StatusBadge({ status }) {
  return (
    <span style={{ color: COLOR_VARS[status] || 'inherit', fontWeight: 600 }}>
      {LABELS[status] || status}
    </span>
  );
}

export { LABELS as STATUS_LABELS };
