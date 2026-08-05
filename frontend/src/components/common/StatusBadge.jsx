const STATUS_STYLES = {
  ONLINE: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  OK: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  OFFLINE: 'bg-red-100 text-red-700 ring-red-600/20',
  FAILED: 'bg-red-100 text-red-700 ring-red-600/20',
  WARNING: 'bg-amber-100 text-amber-700 ring-amber-600/20',
};

/**
 * Small pill badge used to communicate node / replication health at a glance.
 * `status` is matched case-insensitively against ONLINE / OK / OFFLINE / FAILED / WARNING.
 */
export default function StatusBadge({ status, className = '' }) {
  const key = (status || '').toUpperCase();
  const styles = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 ring-slate-500/20';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          key === 'ONLINE' || key === 'OK'
            ? 'bg-emerald-500'
            : key === 'OFFLINE' || key === 'FAILED'
            ? 'bg-red-500'
            : key === 'WARNING'
            ? 'bg-amber-500'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
}
