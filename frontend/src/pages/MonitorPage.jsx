import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ServerCard from "../components/monitor/ServerCard";
import ReplicationStatus from "../components/monitor/ReplicationStatus";
import ServerStatusTable from "../components/monitor/ServerStatusTable";
import ClusterActions from "../components/monitor/ClusterActions";
import MaintenanceModeToggle from "../components/monitor/MaintenanceModeToggle";
import EditServerModal from "../components/monitor/EditServerModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import MetricsDashboard from "../components/monitor/MetricsDashboard";
import {
  useClusterStore,
  computeMonitorNodes,
  computeReplicationStatus,
  computeServerDetails,
} from "../store/clusterStore";

// Simulates the latency of a real cluster-management API call.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function MonitorPage() {
  // Cluster data now lives in the shared store — Settings writes to it,
  // Monitor reads and writes it, and Application Services reads it too, so
  // all three pages stay in sync automatically.
  const servers = useClusterStore((state) => state.servers);
  const replication = useClusterStore((state) => state.replication);

  const nodes = useMemo(() => computeMonitorNodes(servers), [servers]);
  const replicationStatus = useMemo(
    () => computeReplicationStatus(servers, replication),
    [servers, replication]
  );
  const serverDetails = useMemo(() => computeServerDetails(servers), [servers]);
  const setServerStatus = useClusterStore((state) => state.setServerStatus);
  const setReplicationStatus = useClusterStore((state) => state.setReplicationStatus);
  const swapPrimaryStandby = useClusterStore((state) => state.swapPrimaryStandby);
  const updateServerDetails = useClusterStore((state) => state.updateServerDetails);

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [nodeLoading, setNodeLoading] = useState({
    primary: null,
    standby: null,
  });
  const [clusterLoading, setClusterLoading] = useState(null); // 'switchover' | 'vm-manager' | null
  const [editingServer, setEditingServer] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { nodeKey, action }
  const [banner, setBanner] = useState(null);

  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(null), 3500);
  };

  const runNodeAction = async (nodeKey, action) => {
    setNodeLoading((prev) => ({ ...prev, [nodeKey]: action }));
    await wait(1000);

    const node = nodes[nodeKey];

    if (action === "shutdown") {
      setServerStatus(node.id, "offline");
      setReplicationStatus({ status: "FAILED" });
      showBanner(`${node.name} has been shut down.`);
    }

    if (action === "failover") {
      // Promote the standby, demote the current primary. Host/IP stay with
      // the physical server slot — only the Primary/Secondary role swaps.
      swapPrimaryStandby();
      showBanner(`Failover complete. ${nodes.standby.name} is now Primary.`);
    }

    if (action === "online") {
      setServerStatus(node.id, "online");
      showBanner(`${node.name} is back online.`);
    }

    setNodeLoading((prev) => ({ ...prev, [nodeKey]: null }));
  };

  const handleNodeAction = (nodeKey, action) => {
    if (action === "failover" || action === "shutdown") {
      setConfirmAction({ nodeKey, action });
      return;
    }
    runNodeAction(nodeKey, action);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { nodeKey, action } = confirmAction;
    setConfirmAction({ ...confirmAction, loading: true });

    if (action === "switchover") {
      await performSwitchOver();
    } else {
      await runNodeAction(nodeKey, action);
    }

    setConfirmAction(null);
  };

  const performSwitchOver = async () => {
    setClusterLoading("switchover");
    await wait(1200);
    swapPrimaryStandby();
    setClusterLoading(null);
    showBanner("Cluster switch over complete.");
  };

  const handleLaunchVmManager = async () => {
    setClusterLoading("vm-manager");
    await wait(900);
    setClusterLoading(null);
    showBanner("Virtual Machine Manager launched.");
  };

  const handleSaveServer = (updated) => {
    updateServerDetails(updated.id, updated);
    setEditingServer(null);
    showBanner(`${updated.host} details updated.`);
  };

  const confirmCopy = {
    failover: {
      title: "Confirm failover",
      description:
        "This will promote the standby node to primary and demote the current primary. Active connections may be briefly interrupted.",
      confirmLabel: "Trigger failover",
    },
    shutdown: {
      title: "Confirm shutdown",
      description:
        "This will stop replication and services on this node. It will be marked offline until brought back online.",
      confirmLabel: "Shut down",
    },
    switchover: {
      title: "Confirm switch over",
      description:
        "This will swap roles between the primary and standby nodes cluster-wide. Plan for a brief interruption while services move over.",
      confirmLabel: "Switch over",
      tone: "default",
    },
  };

  return (
    <div className="space-y-6">
      {banner && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {banner}
        </div>
      )}

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
        <ServerCard
          node={nodes.primary}
          disableOnline={nodes.primary.status === "online"}
          disableFailover={true}
          loadingAction={nodeLoading.primary}
          onOnline={() => handleNodeAction("primary", "online")}
          onFailover={() => handleNodeAction("primary", "failover")}
          onShutdown={() => handleNodeAction("primary", "shutdown")}
        />
        <ServerCard
          node={nodes.standby}
          disableOnline={nodes.standby.status === "online"}
          disableFailover={nodes.standby.status !== "online"}
          loadingAction={nodeLoading.standby}
          onOnline={() => handleNodeAction("standby", "online")}
          onFailover={() => handleNodeAction("standby", "failover")}
          onShutdown={() => handleNodeAction("standby", "shutdown")}
        />
      </div>
      <ReplicationStatus data={replicationStatus} />

      <MetricsDashboard />

      <ServerStatusTable servers={serverDetails} onEdit={setEditingServer} />

      <ClusterActions
        loadingAction={clusterLoading}
        onSwitchOver={() =>
          setConfirmAction({ nodeKey: null, action: "switchover" })
        }
        onLaunchVmManager={handleLaunchVmManager}
      />

      <MaintenanceModeToggle
        enabled={maintenanceMode}
        onChange={setMaintenanceMode}
      />

      <EditServerModal
        server={editingServer}
        onSave={handleSaveServer}
        onClose={() => setEditingServer(null)}
      />

      <ConfirmDialog
        open={!!confirmAction}
        loading={confirmAction?.loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        {...(confirmAction ? confirmCopy[confirmAction.action] : {})}
      />
    </div>
  );
}