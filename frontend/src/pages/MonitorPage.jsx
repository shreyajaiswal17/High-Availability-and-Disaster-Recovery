import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Server } from "lucide-react";
import { ConfigProvider, theme, Card, Progress, Segmented, Avatar, Empty, Tag, Statistic } from "antd";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import ServerCard from "../components/monitor/ServerCard";
import ReplicationStatus from "../components/monitor/ReplicationStatus";
import ServerStatusTable from "../components/monitor/ServerStatusTable";
import ClusterActions from "../components/monitor/ClusterActions";
import MaintenanceModeToggle from "../components/monitor/MaintenanceModeToggle";
import EditServerModal from "../components/monitor/EditServerModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  useClusterStore,
  computeMonitorNodes,
  computeReplicationStatus,
  computeServerDetails,
} from "../store/clusterStore";

// Simulates the latency of a real cluster-management API call.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Live metrics generator — previously lived in MetricsDashboard.jsx, now
// inlined here as a small hook so both the KPI strip and the activity chart
// below share one ticking source of truth instead of duplicating intervals.
// ---------------------------------------------------------------------------
const MAX_POINTS = 15;

// Slightly larger swing so the line reads as jagged/spiky rather than a
// gentle wobble — matches the reference screenshot's sharp up/down ticks.
function stepMetric(prev, min, max, change) {
  let next = prev + (Math.random() * change * 2 - change);
  if (next < min) next = min;
  if (next > max) next = max;
  return Number(next.toFixed(2));
}

function useLiveMetrics() {
  const [latest, setLatest] = useState({
    cpu: 58,
    memory: 64,
    latency: 8,
    lag: 0.42,
    health: 99.97,
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatest((prev) => {
        const next = {
          cpu: stepMetric(prev.cpu, 40, 90, 6),
          memory: stepMetric(prev.memory, 45, 85, 5),
          latency: stepMetric(prev.latency, 5, 30, 4),
          lag: stepMetric(prev.lag, 0.1, 3, 0.3),
          health: stepMetric(prev.health, 99.6, 100, 0.02),
        };

        setHistory((old) => {
          const updated = [
            ...old,
            {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              ...next,
            },
          ];
          if (updated.length > MAX_POINTS) updated.shift();
          return updated;
        });

        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { latest, history };
}

// ---------------------------------------------------------------------------
// Light dashboard, styled to match the app's default (light) theme instead
// of the dark UDM-Pro look. cardStyle/titleStyle/linkStyle now use light
// panel colors so this section blends with the rest of the app.
// ---------------------------------------------------------------------------
const DONUT_COLORS = ["#3b82f6", "#06b6d4", "#a855f7", "#f59e0b"];

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
};
const titleStyle = { color: "#1e293b", fontSize: 13, fontWeight: 600 };
const linkStyle = { color: "#2563eb", fontSize: 12 };

function KpiStrip({ metrics }) {
  const items = [
    { label: "CPU Usage", value: metrics.cpu, suffix: "%", color: "#2563eb" },
    { label: "Memory Usage", value: metrics.memory, suffix: "%", color: "#0891b2" },
    { label: "Network Latency", value: metrics.latency, suffix: " ms", color: "#d97706" },
    { label: "Replication Lag", value: metrics.lag, suffix: " s", color: "#dc2626" },
    { label: "Cluster Health", value: metrics.health, suffix: "%", color: "#16a34a" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} size="small" bordered={false} style={cardStyle}>
          <Statistic
            title={<span className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</span>}
            value={item.value}
            precision={item.suffix === "%" ? 1 : 2}
            suffix={item.suffix}
            valueStyle={{ color: item.color, fontSize: 20, fontWeight: 700 }}
          />
        </Card>
      ))}
    </div>
  );
}

function ResourceDonut({ metrics }) {
  const data = [
    { name: "CPU", value: metrics.cpu },
    { name: "Memory", value: metrics.memory },
    { name: "Latency", value: metrics.latency },
    { name: "Repl. Lag", value: metrics.lag * 10 },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card
      style={cardStyle}
      bordered={false}
      title={<span style={titleStyle}>Resource Identification</span>}
      extra={<a style={linkStyle}>See All</a>}
    >
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={72} paddingAngle={3} stroke="none">
                {data.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800">{total.toFixed(0)}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Total Load</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-xs">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                {d.name}
              </span>
              <span className="font-semibold text-slate-800">{d.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ClusterHealthRing({ health, nodesOnline, nodesTotal }) {
  return (
    <Card
      style={cardStyle}
      bordered={false}
      title={<span style={titleStyle}>Cluster Technology</span>}
      extra={<a style={linkStyle}>See All</a>}
    >
      <div className="flex items-center justify-center py-2">
        <Progress
          type="circle"
          percent={health}
          size={140}
          strokeColor={{ "0%": "#06b6d4", "100%": "#2563eb" }}
          trailColor="#f1f5f9"
          format={() => (
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-slate-800">{nodesOnline}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">of {nodesTotal} Online</span>
            </div>
          )}
        />
      </div>
    </Card>
  );
}

function MostActiveServers({ servers }) {
  const configured = servers.filter((s) => s.host);
  return (
    <Card
      style={cardStyle}
      bordered={false}
      title={<span style={titleStyle}>Most Active Servers</span>}
      extra={<a style={linkStyle}>See All</a>}
    >
      {configured.length === 0 ? (
        <Empty description={<span className="text-xs text-slate-400">No Active Servers</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="flex flex-wrap gap-4">
          {configured.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <Avatar
                size={40}
                icon={<Server className="h-4 w-4" />}
                style={{ backgroundColor: s.status === "online" ? "#059669" : "#dc2626" }}
              />
              <span className="max-w-[64px] truncate text-[11px] text-slate-600">{s.host}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ReplicationEndpoints() {
  return (
    <Card
      style={cardStyle}
      bordered={false}
      title={<span style={titleStyle}>Replication Endpoints</span>}
      extra={<a style={linkStyle}>See All</a>}
    >
      <Empty description={<span className="text-xs text-slate-400">No Active Endpoints</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </Card>
  );
}

function ClusterActivityChart({ history }) {
  const [view, setView] = useState("All");

  const totals = useMemo(() => {
    if (!history.length) return { cpu: 0, memory: 0 };
    const last = history[history.length - 1];
    return { cpu: last.cpu, memory: last.memory };
  }, [history]);

  return (
    <Card
      style={cardStyle}
      bordered={false}
      title={<span style={titleStyle}>Cluster Activity</span>}
      extra={
        <div className="flex items-center gap-3">
          <Segmented size="small" value={view} onChange={setView} options={["All", "CPU", "Memory"]} />
          <Tag color="blue">CPU {totals.cpu}%</Tag>
          <Tag color="purple">Mem {totals.memory}%</Tag>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", fontSize: 12 }}
            labelStyle={{ color: "#475569" }}
          />
          {(view === "All" || view === "CPU") && (
            <Area
              type="linear"
              dataKey="cpu"
              name="CPU"
              stroke="#2563eb"
              fill="url(#cpuGradient)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
          {(view === "All" || view === "Memory") && (
            <Area
              type="linear"
              dataKey="memory"
              name="Memory"
              stroke="#a855f7"
              fill="url(#memGradient)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function ClusterOverview({ metrics, history, servers }) {
  const nodesOnline = servers.filter((s) => s.host && s.status === "online").length;
  const nodesTotal = servers.filter((s) => s.host).length;

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorBgContainer: "#ffffff" } }}>
      <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-6">
        <div className="mb-4">
          <KpiStrip metrics={metrics} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResourceDonut metrics={metrics} />
          <ClusterHealthRing health={metrics.health} nodesOnline={nodesOnline} nodesTotal={nodesTotal} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MostActiveServers servers={servers} />
          <ReplicationEndpoints />
        </div>

        <div className="mt-4">
          <ClusterActivityChart history={history} />
        </div>
      </div>
    </ConfigProvider>
  );
}

// ---------------------------------------------------------------------------
// MonitorPage
// ---------------------------------------------------------------------------
export default function MonitorPage() {
  const servers = useClusterStore((state) => state.servers);
  const replication = useClusterStore((state) => state.replication);
  const { latest: liveMetrics, history: metricsHistory } = useLiveMetrics();

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
  const [clusterLoading, setClusterLoading] = useState(null);
  const [editingServer, setEditingServer] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
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

      <ClusterOverview metrics={liveMetrics} history={metricsHistory} servers={servers} />

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