import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const MAX_POINTS = 15;

const generateMetric = (prev, min, max, change) => {
  let next = prev + (Math.random() * change * 2 - change);

  if (next < min) next = min;
  if (next > max) next = max;

  return Number(next.toFixed(2));
};

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState({
    cpu: 58,
    memory: 64,
    latency: 8,
    lag: 0.42,
    health: 99.97,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLatest((prev) => {
        const next = {
          cpu: generateMetric(prev.cpu, 40, 90, 3),
          memory: generateMetric(prev.memory, 45, 85, 2),
          latency: generateMetric(prev.latency, 5, 30, 2),
          lag: generateMetric(prev.lag, 0.1, 3, 0.2),
          health: generateMetric(prev.health, 99.6, 100, 0.02),
        };

        setMetrics((old) => {
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

  const Chart = ({ title, color, dataKey, unit }) => (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip formatter={(v) => `${v}${unit}`} />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="mt-8">

      {/* Heading */}

      <h1 className="text-2xl font-bold mb-6">
        Live Cluster Performance
      </h1>

      {/* KPI CARDS */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500">CPU Usage</p>
          <h2 className="text-4xl font-bold text-blue-600 mt-2">
            {latest.cpu}%
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500">Memory Usage</p>
          <h2 className="text-4xl font-bold text-green-600 mt-2">
            {latest.memory}%
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500">Network Latency</p>
          <h2 className="text-4xl font-bold text-red-600 mt-2">
            {latest.latency} ms
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500">Replication Lag</p>
          <h2 className="text-4xl font-bold text-orange-500 mt-2">
            {latest.lag} s
          </h2>
        </div>

      </div>

      {/* CHARTS */}

      <div className="grid lg:grid-cols-2 gap-6">

        <Chart
          title="CPU Usage"
          dataKey="cpu"
          color="#2563eb"
          unit="%"
        />

        <Chart
          title="Memory Usage"
          dataKey="memory"
          color="#10b981"
          unit="%"
        />

        <Chart
          title="Replication Lag"
          dataKey="lag"
          color="#f59e0b"
          unit=" s"
        />

        <Chart
          title="Network Latency"
          dataKey="latency"
          color="#ef4444"
          unit=" ms"
        />

      </div>

      {/* CLUSTER STATUS */}

      <div className="mt-8 bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-semibold mb-5">
          Cluster Health
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <p className="text-gray-500">Cluster Health</p>
            <h2 className="text-4xl font-bold text-green-600">
              {latest.health}%
            </h2>
          </div>

          <div className="space-y-2">

            <div className="flex justify-between">
              <span>Primary Server</span>
              <span className="text-green-600 font-semibold">
                ● Healthy
              </span>
            </div>

            <div className="flex justify-between">
              <span>Standby Server</span>
              <span className="text-green-600 font-semibold">
                ● Healthy
              </span>
            </div>

            <div className="flex justify-between">
              <span>Replication</span>
              <span className="text-blue-600 font-semibold">
                Synchronous
              </span>
            </div>

            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>
                {new Date().toLocaleTimeString()}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}