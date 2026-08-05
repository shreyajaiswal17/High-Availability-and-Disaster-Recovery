import Button from '../common/Button';

/**
 * Represents a single cluster node (Primary or Secondary) with its
 * Online / Failover / Shutdown controls, mirroring the original dashboard.
 */
export default function ServerCard({
  node,
  disableOnline = false,
  disableFailover = false,
  loadingAction = null, // 'online' | 'failover' | 'shutdown' | null
  onOnline,
  onFailover,
  onShutdown,
}) {
  const isOnline = node.status === 'online';

  return (
    <div className="flex w-40 flex-col items-center sm:w-44">
      <p className="mb-2 text-center text-sm font-medium text-slate-600">
        {node.name} ({node.ip})
      </p>

      <div
        className={`flex h-40 w-full items-center justify-center rounded-md shadow-md sm:h-44 ${
          isOnline ? 'bg-emerald-700' : 'bg-red-700'
        }`}
      >
        <span className="text-lg font-bold text-white">{node.role}</span>
      </div>

      <div className="mt-3 flex w-full flex-col gap-2">
        <Button
          disabled={disableOnline}
          loading={loadingAction === 'online'}
          onClick={onOnline}
          title={disableOnline ? 'Node is already online' : 'Bring node online'}
        >
          Online
        </Button>
        <Button
          disabled={disableFailover}
          loading={loadingAction === 'failover'}
          onClick={onFailover}
          title={disableFailover ? 'Failover not available for this node' : 'Trigger failover'}
        >
          Failover
        </Button>
        <Button
          loading={loadingAction === 'shutdown'}
          onClick={onShutdown}
          className="hover:bg-red-50 hover:text-red-700 hover:ring-red-200"
          title="Shut down this node"
        >
          Shutdown
        </Button>
      </div>
    </div>
  );
}
