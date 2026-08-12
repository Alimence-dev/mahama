export default function LowStockBadge({ item }) {
  if (item.quantity_available >= item.low_stock_threshold) return null;
  return (
    <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '12px', marginLeft: '0.5em' }}>
      Low stock
    </span>
  );
}
