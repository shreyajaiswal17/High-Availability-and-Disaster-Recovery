import { useMemo } from 'react';
import {
  useClusterStore,
  computeApplicationServiceClusters,
} from '../store/clusterStore';

// Status color coding follows standard ANSI/traffic-light convention used in
// monitoring & alarm-management UIs: green = normal/online, yellow = warning,
// red = critical/stopped, gray = no data.
const STATUS_STYLES = {
  online: 'bg-green-600 text-white',
  warning: 'bg-yellow-400 text-black',
  stopped: 'bg-red-600 text-white',
  unknown: 'bg-gray-50 text-gray-400',
};

const STATUS_LABELS = {
  online: 'ONLINE',
  warning: 'WARNING',
  stopped: 'Stopped',
  unknown: '',
};

const SERVICE_ROWS = [
  { key: 'host', label: 'host' },
  { key: 'tenancy', label: 'tenancy' },
  { key: 'status', label: 'status' },
];

function ClusterTable({ cluster }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{cluster.name}</h2>
      <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
              Service
            </th>
            {cluster.servers.map((server) => (
              <th
                key={server.id}
                className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
              >
                {server.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SERVICE_ROWS.map((row, idx) => (
            <tr key={row.key}>
              <td className="border border-gray-300 px-4 py-2 text-gray-600">
                {idx + 1}) {row.label}
              </td>
              {cluster.servers.map((server) => {
                const isSecondary = server.tenancy?.toLowerCase() === 'secondary';

                if (row.key === 'host') {
                  return (
                    <td
                      key={server.id}
                      className={`border border-gray-300 px-4 py-2 text-gray-800 ${
                        isSecondary ? 'bg-purple-50' : ''
                      }`}
                    >
                      {server.host ? `${server.host} (${server.ip})` : ''}
                    </td>
                  );
                }

                if (row.key === 'tenancy') {
                  return (
                    <td
                      key={server.id}
                      className="border border-gray-300 px-4 py-2 text-gray-600"
                    >
                      {server.tenancy ?? ''}
                    </td>
                  );
                }

                // status row
                const style = STATUS_STYLES[server.status] ?? STATUS_STYLES.unknown;
                const label = STATUS_LABELS[server.status] ?? '';
                return (
                  <td
                    key={server.id}
                    className={`border border-gray-300 px-4 py-2 font-semibold ${style}`}
                  >
                    {label}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApplicationServicesPage({ clusters }) {
  // Defaults to the live, shared cluster state so edits made on Settings and
  // status changes made on Monitor both show up here automatically. The
  // `clusters` prop is still accepted as an override (useful for tests/demos).
  const servers = useClusterStore((state) => state.servers);
  const storeClusters = useMemo(() => computeApplicationServiceClusters(servers), [servers]);
  const data = clusters ?? storeClusters;

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2">
        {data.map((cluster) => (
          <ClusterTable key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </div>
  );
}