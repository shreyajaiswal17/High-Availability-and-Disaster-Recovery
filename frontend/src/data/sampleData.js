// Sample data representing the HADR (High Availability / Disaster Recovery) cluster.
// Replace with real API data once the backend is wired up.

export const initialNodes = {
  primary: {
    id: 'primary-01',
    role: 'Primary',
    name: 'Primary-01',
    ip: '192.168.1.10',
    status: 'online', // 'online' | 'offline'
  },
  standby: {
    id: 'standby-01',
    role: 'Secondary',
    name: 'Standby-01',
    ip: '192.168.1.11',
    status: 'online',
  },
};

export const initialReplicationStatus = {
  primary: 'Primary-01',
  standby: 'Standby-01',
  status: 'FAILED', // 'OK' | 'FAILED' | 'WARNING'
  lagSeconds: 2.13,
};

export const initialServerDetails = [
  {
    id: 'standby-01',
    host: 'Standby-01',
    management: '192.168.1.11',
    replication: '192.168.1.11',
    production: '192.168.1.11',
    heartbeat: '4:58:20 PM',
    status: 'ONLINE',
  },
  {
    id: 'primary-01',
    host: 'Primary-01',
    management: '192.168.1.10',
    replication: '192.168.1.10',
    production: '192.168.1.10',
    heartbeat: '4:58:20 PM',
    status: 'ONLINE',
  },
];

// Application Services: HADR node clusters grouped by production environment.
// Each cluster lists its member servers and the per-server facts shown on the
// Application Services page (host/IP, tenancy role, and live status).
//
// server.status: 'online' | 'stopped' | 'warning' | 'unknown'
//   'unknown' represents a server slot that has not been configured/paired yet
//   (e.g. Production 2 currently only has Server 1 defined).
export const applicationServiceClusters = [
  {
    id: 'production-1',
    name: 'Production 1',
    servers: [
      {
        id: 'primary-01',
        label: 'Server 1',
        host: 'Primary-01',
        ip: '192.168.1.10',
        tenancy: 'Primary',
        status: 'online',
      },
      {
        id: 'standby-01',
        label: 'Server 2',
        host: 'Standby-01',
        ip: '192.168.1.11',
        tenancy: 'Secondary',
        status: 'stopped',
      },
    ],
  },
  {
    id: 'production-2',
    name: 'Production 2',
    servers: [
      {
        id: 'production-2-server-1',
        label: 'Server 1',
        host: null,
        ip: null,
        tenancy: null,
        status: 'unknown',
      },
    ],
  },
];

// Settings page: per-server configuration fields shown across three server
// columns (Server 1 / 2 / 3), plus a handful of single-value fields (Sync
// mode, Password, System type) and a 2-column NIC naming section.
// `values` arrays line up 1:1 with `serverColumns`. Empty strings render as
// blank inputs (e.g. Server 3 / Production 2 are not configured yet).
export const settingsFormData = {
  serverColumns: ['Server 1', 'Server 2', 'Server 3'],

  fields: [
    { key: 'managementIp', label: 'Management IP', values: ['192.168.1.10', '192.168.56.191', ''] },
    { key: 'host', label: 'Host', values: ['Primary-01', 'server2', ''] },
    { key: 'db4', label: 'DB4', values: ['DB4', 'DB4', ''] },
    { key: 'subscriberIp', label: 'Subscriber IP', values: ['192.168.56.40', '192.168.56.11', ''] },
    { key: 'production1', label: 'Production 1', values: ['192.168.56.12', '192.168.56.12', ''] },
    { key: 'bondSettings', label: 'Bond Settings', values: ['', '', ''] },
    { key: 'production1Username', label: 'Production 1 Username', values: ['Administrator', '', ''] },
    { key: 'production1Password', label: 'Production 1 Password', values: ['secret123', '', ''], type: 'password' },
    { key: 'production1Service', label: 'Production 1 Service', values: ['', '', ''] },
  ],

  productionTwoFields: [
    { key: 'production2', label: 'Production 2', values: ['', '', ''] },
    { key: 'production2Username', label: 'Production 2 Username', values: ['', '', ''] },
    { key: 'production2Password', label: 'Production 2 Password', values: ['', '', ''], type: 'password' },
    { key: 'production3Service', label: 'Production 3 Service', values: ['', '', ''] },
  ],

  sync: 'asynchronous', // 'synchronous' | 'asynchronous'

  password: 'secret123',

  systemType: 'Physical System',
  systemTypeOptions: ['Physical System', 'Virtual System'],

  nic: {
    columns: ['Server 1', 'Server 2'],
    management: ['[production1]', '[production1]'],
    replication: ['[replication]', '[replication]'],
  },
};

// Email Settings: SMTP configuration used for alert notifications.
// All fields start blank until the user fills them in and hits Save.
export const emailSettingsData = {
  fields: [
    { key: 'smtpPort', label: 'SMTP Port', value: '', type: 'text' },
    { key: 'smtpServer', label: 'SMTP Server', value: '', type: 'text' },
    { key: 'senderEmail', label: 'Sender Email', value: '', type: 'email' },
    { key: 'senderPassword', label: 'Sender Password', value: '', type: 'password' },
    { key: 'receiverEmail', label: 'Receiver Email', value: '', type: 'email' },
  ],
};

// About page: license status text, an editable license key, and a
// change-password field. `licenseInfo` is display-only text; the rest are
// editable form fields.
export const aboutPageData = {
  licenseInfo: 'perpetual License 1 : workspaces Support ending on 11 November, 2026',
  licenseKey: '',
  newPassword: '',
};

export const navItems = [
  { key: 'monitor', label: 'Monitor' },
  { key: 'application-services', label: 'Application Services' },
  { key: 'settings', label: 'Settings' },
  { key: 'email-settings', label: 'Email Settings' },
  { key: 'about', label: 'About' },
];