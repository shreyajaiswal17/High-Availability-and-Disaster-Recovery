import { create } from 'zustand';
import {
  applicationServiceClusters,
  initialNodes,
  initialReplicationStatus,
  initialServerDetails,
  settingsFormData,
} from '../data/sampleData';

// ---------------------------------------------------------------------------
// This store is the single source of truth for the three server "slots"
// configured on the Settings page. Application Services and Monitor both
// read their view of the cluster from here instead of holding their own
// copies, so:
//   - Saving Settings (host / management IP / etc.) shows up immediately on
//     Application Services and Monitor.
//   - Actions taken on Monitor (shutdown / online / failover / switch over)
//     show up immediately on Application Services.
//
// Server 1 and Server 2 are the primary HA pair (what Monitor and
// Application Services > Production 1 display). Server 3 is a reserved,
// unconfigured slot. Application Services > Production 2 isn't backed by a
// configured HA pair yet, so it's kept as a static placeholder.
// ---------------------------------------------------------------------------

function fieldValues(list, key) {
  return list.find((f) => f.key === key)?.values ?? ['', '', ''];
}

function seedServers() {
  const col = (key, index) => fieldValues(settingsFormData.fields, key)[index] ?? '';

  const ids = ['primary-01', 'standby-01', 'server-3'];
  const tenancy = ['Primary', 'Secondary', null];
  const seedStatus = [
    initialNodes.primary.status === 'online' ? 'online' : 'offline',
    initialNodes.standby.status === 'online' ? 'online' : 'offline',
    'unknown',
  ];
  const heartbeats = [
    initialServerDetails.find((s) => s.id === 'primary-01')?.heartbeat ?? '',
    initialServerDetails.find((s) => s.id === 'standby-01')?.heartbeat ?? '',
    '',
  ];

  return ids.map((id, index) => ({
    id,
    label: settingsFormData.serverColumns[index],
    managementIp: col('managementIp', index),
    host: col('host', index),
    db4: col('db4', index),
    subscriberIp: col('subscriberIp', index),
    production1Ip: col('production1', index),
    bondSettings: col('bondSettings', index),
    production1Username: col('production1Username', index),
    production1Password: col('production1Password', index),
    production1Service: col('production1Service', index),
    tenancy: tenancy[index],
    status: seedStatus[index],
    heartbeat: heartbeats[index],
  }));
}

function seedProductionTwo() {
  const col = (key, index) => fieldValues(settingsFormData.productionTwoFields, key)[index] ?? '';
  return {
    production2: [0, 1, 2].map((i) => col('production2', i)),
    production2Username: [0, 1, 2].map((i) => col('production2Username', i)),
    production2Password: [0, 1, 2].map((i) => col('production2Password', i)),
    production3Service: [0, 1, 2].map((i) => col('production3Service', i)),
  };
}

const PRODUCTION_TWO_PLACEHOLDER = applicationServiceClusters.find(
  (c) => c.id === 'production-2'
);

export const useClusterStore = create((set) => ({
  servers: seedServers(),
  productionTwo: seedProductionTwo(),

  replication: {
    status: initialReplicationStatus.status,
    lagSeconds: initialReplicationStatus.lagSeconds,
  },

  sync: settingsFormData.sync,
  password: settingsFormData.password,
  systemType: settingsFormData.systemType,
  nicManagement: [...settingsFormData.nic.management],
  nicReplication: [...settingsFormData.nic.replication],

  // ---- actions ----

  // Commits a Settings-page save. `payload.servers` is keyed by server id
  // and only needs to contain the fields that changed.
  applySettings: (payload) =>
    set((state) => ({
      servers: state.servers.map((server) => {
        const updates = payload.servers?.[server.id];
        return updates ? { ...server, ...updates } : server;
      }),
      productionTwo: payload.productionTwo ?? state.productionTwo,
      sync: payload.sync ?? state.sync,
      password: payload.password ?? state.password,
      systemType: payload.systemType ?? state.systemType,
      nicManagement: payload.nicManagement ?? state.nicManagement,
      nicReplication: payload.nicReplication ?? state.nicReplication,
    })),

  // Used by Monitor's online/shutdown actions.
  setServerStatus: (id, status) =>
    set((state) => ({
      servers: state.servers.map((s) => (s.id === id ? { ...s, status } : s)),
    })),

  // Used by Monitor's "Edit server" modal, which works with the
  // ServerStatusTable row shape (host/management/replication/production).
  updateServerDetails: (id, updates) =>
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === id
          ? {
              ...s,
              host: updates.host ?? s.host,
              managementIp: updates.management ?? s.managementIp,
              subscriberIp: updates.replication ?? s.subscriberIp,
              production1Ip: updates.production ?? s.production1Ip,
              heartbeat: updates.heartbeat ?? s.heartbeat,
              status: updates.status
                ? updates.status.toLowerCase() === 'online'
                  ? 'online'
                  : 'offline'
                : s.status,
            }
          : s
      ),
    })),

  // Used by Monitor's failover (per-node) and switch over (cluster-wide)
  // actions. Swaps which server currently holds the Primary/Secondary role;
  // host/IP/etc. stay attached to the physical server slot.
  swapPrimaryStandby: () =>
    set((state) => ({
      servers: state.servers.map((s) => {
        if (s.tenancy === 'Primary') return { ...s, tenancy: 'Secondary' };
        if (s.tenancy === 'Secondary') return { ...s, tenancy: 'Primary' };
        return s;
      }),
      replication: { ...state.replication, status: 'OK', lagSeconds: 0 },
    })),

  setReplicationStatus: (partial) =>
    set((state) => ({ replication: { ...state.replication, ...partial } })),
}));

// ---------------------------------------------------------------------------
// Derived-data helpers — plain functions, NOT zustand selectors.
//
// Why: `useStore(state => computeX(state))` would build a brand-new
// object/array every single call. React's `useSyncExternalStore` (which
// zustand uses internally) requires the selected snapshot to be
// *reference-stable* when nothing actually changed — otherwise it looks
// like the store is changing on every render, which throws "Maximum update
// depth exceeded" / "getSnapshot should be cached".
//
// The fix used in every page below: select the raw, stable slice directly
// (e.g. `useClusterStore(state => state.servers)` — zustand only replaces
// this reference when an action actually changes it) and pass it through
// these functions inside a `useMemo`, so the derived object is only
// rebuilt when the underlying slice actually changes.
// ---------------------------------------------------------------------------

export function computeMonitorNodes(servers) {
  const primary = servers.find((s) => s.tenancy === 'Primary');
  const standby = servers.find((s) => s.tenancy === 'Secondary');

  const toNode = (s) =>
    s && {
      id: s.id,
      role: s.tenancy,
      name: s.host,
      ip: s.managementIp,
      status: s.status === 'online' ? 'online' : 'offline',
    };

  return { primary: toNode(primary), standby: toNode(standby) };
}

export function computeReplicationStatus(servers, replication) {
  const primary = servers.find((s) => s.tenancy === 'Primary');
  const standby = servers.find((s) => s.tenancy === 'Secondary');

  return {
    primary: primary?.host ?? '',
    standby: standby?.host ?? '',
    status: replication.status,
    lagSeconds: replication.lagSeconds,
  };
}

export function computeServerDetails(servers) {
  return servers
    .filter((s) => s.host) // skip unconfigured slots (e.g. Server 3)
    .map((s) => ({
      id: s.id,
      host: s.host,
      management: s.managementIp,
      replication: s.subscriberIp,
      production: s.production1Ip,
      heartbeat: s.heartbeat,
      status: s.status === 'online' ? 'ONLINE' : 'OFFLINE',
    }));
}

export function computeApplicationServiceClusters(servers) {
  const productionOneServers = servers
    .filter((s) => s.tenancy) // Server 1 & Server 2 only
    .map((s) => ({
      id: s.id,
      label: s.label,
      host: s.host || null,
      ip: s.managementIp || null,
      tenancy: s.tenancy,
      status: s.host ? (s.status === 'online' ? 'online' : 'stopped') : 'unknown',
    }));

  return [
    { id: 'production-1', name: 'Production 1', servers: productionOneServers },
    PRODUCTION_TWO_PLACEHOLDER,
  ];
}

// Only ever called once, from a `useState(() => ...)` lazy initializer (see
// SettingsPage) — a one-off read via `useClusterStore.getState()`, not a
// subscribed selector — so the "must be reference-stable" concern above
// doesn't apply here.
export function computeSettingsSnapshot(state) {
  const columnValues = (getter) => state.servers.map((s) => getter(s) ?? '');

  const fields = [
    { key: 'managementIp', label: 'Management IP', values: columnValues((s) => s.managementIp) },
    { key: 'host', label: 'Host', values: columnValues((s) => s.host) },
    { key: 'db4', label: 'DB4', values: columnValues((s) => s.db4) },
    { key: 'subscriberIp', label: 'Subscriber IP', values: columnValues((s) => s.subscriberIp) },
    { key: 'production1', label: 'Production 1', values: columnValues((s) => s.production1Ip) },
    { key: 'bondSettings', label: 'Bond Settings', values: columnValues((s) => s.bondSettings) },
    {
      key: 'production1Username',
      label: 'Production 1 Username',
      values: columnValues((s) => s.production1Username),
    },
    {
      key: 'production1Password',
      label: 'Production 1 Password',
      values: columnValues((s) => s.production1Password),
      type: 'password',
    },
    {
      key: 'production1Service',
      label: 'Production 1 Service',
      values: columnValues((s) => s.production1Service),
    },
  ];

  const productionTwoFields = [
    { key: 'production2', label: 'Production 2', values: [...state.productionTwo.production2] },
    {
      key: 'production2Username',
      label: 'Production 2 Username',
      values: [...state.productionTwo.production2Username],
    },
    {
      key: 'production2Password',
      label: 'Production 2 Password',
      values: [...state.productionTwo.production2Password],
      type: 'password',
    },
    {
      key: 'production3Service',
      label: 'Production 3 Service',
      values: [...state.productionTwo.production3Service],
    },
  ];

  return {
    serverColumns: state.servers.map((s) => s.label),
    fields,
    productionTwoFields,
    sync: state.sync,
    password: state.password,
    systemType: state.systemType,
    systemTypeOptions: settingsFormData.systemTypeOptions,
    nic: { management: [...state.nicManagement], replication: [...state.nicReplication] },
  };
}