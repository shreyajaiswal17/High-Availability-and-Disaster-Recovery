const STATUS_TEXT_STYLES = {
  OK: 'text-emerald-600',
  FAILED: 'text-red-600',
  WARNING: 'text-amber-600',
};

export default function ReplicationStatus({ data }) {
  const statusColor = STATUS_TEXT_STYLES[data.status] || 'text-slate-700';

  return (
    <section className="overflow-hidden rounded-md shadow-sm">
      <header className="bg-slate-900 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-white">Replication Status</h2>
      </header>
      <div className="grid grid-cols-2 gap-3 bg-white px-4 py-4 text-sm sm:grid-cols-4 sm:gap-4">
        <div>
          <span className="text-slate-500">Primary: </span>
          <span className="font-semibold text-slate-900">{data.primary}</span>
        </div>
        <div>
          <span className="text-slate-500">Standby: </span>
          <span className="font-semibold text-slate-900">{data.standby}</span>
        </div>
        <div>
          <span className="text-slate-500">Status: </span>
          <span className={`font-bold ${statusColor}`}>{data.status}</span>
        </div>
        <div>
          <span className="text-slate-500">Lag: </span>
          <span className="font-semibold text-slate-900">{data.lagSeconds}s</span>
        </div>
      </div>
    </section>
  );
}
