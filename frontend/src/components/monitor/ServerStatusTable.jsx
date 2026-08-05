import { Pencil } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const COLUMNS = ['Host', 'Management', 'Replication', 'Production', 'Heartbeat', 'Status', ''];

export default function ServerStatusTable({ servers, onEdit }) {
  return (
    <section className="overflow-hidden rounded-md shadow-sm">
      <header className="bg-slate-900 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-white">Detailed Status of Servers</h2>
      </header>

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => {
              const isOnline = server.status === 'ONLINE';
              const cellTone = isOnline
                ? 'bg-emerald-700 text-white'
                : 'bg-red-700 text-white';

              return (
                <tr key={server.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{server.host}</td>
                  <td className={`px-4 py-3 font-medium ${cellTone}`}>{server.management}</td>
                  <td className={`px-4 py-3 font-medium ${cellTone}`}>{server.replication}</td>
                  <td className={`px-4 py-3 font-medium ${cellTone}`}>
                    {server.production} ({server.status})
                  </td>
                  <td className="px-4 py-3 text-slate-600">{server.heartbeat}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={server.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(server)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 active:bg-slate-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
