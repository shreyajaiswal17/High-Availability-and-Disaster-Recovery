import { useState } from 'react';
import { useClusterStore, computeSettingsSnapshot } from '../store/clusterStore';

const INPUT_CLASS =
  'w-full rounded-sm border border-gray-300 bg-purple-50/70 px-3 py-1.5 text-sm text-gray-800 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400';

function cloneFields(fields) {
  return fields.map((f) => ({ ...f, values: [...f.values] }));
}

function fieldValues(list, key) {
  return list.find((f) => f.key === key)?.values ?? ['', '', ''];
}

function FieldGridRow({ field, onChange }) {
  return (
    <div className="grid grid-cols-[210px_repeat(3,1fr)] items-center gap-4 py-1">
      <label className="text-sm font-semibold text-gray-700">{field.label}</label>
      {field.values.map((value, colIndex) => (
        <input
          key={colIndex}
          type={field.type === 'password' ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(field.key, colIndex, e.target.value)}
          className={INPUT_CLASS}
        />
      ))}
    </div>
  );
}

export default function SettingsPage() {
  // Seed the draft form from whatever is currently in the shared store, so
  // revisiting Settings after a save (or after another page changes
  // something) shows the real current state, not the original sample data.
  const [snapshot] = useState(() => computeSettingsSnapshot(useClusterStore.getState()));
  const applySettings = useClusterStore((state) => state.applySettings);

  const [fields, setFields] = useState(() => cloneFields(snapshot.fields));
  const [productionTwoFields, setProductionTwoFields] = useState(() =>
    cloneFields(snapshot.productionTwoFields)
  );
  const [sync, setSync] = useState(snapshot.sync);
  const [password, setPassword] = useState(snapshot.password);
  const [systemType, setSystemType] = useState(snapshot.systemType);
  const [nicManagement, setNicManagement] = useState([...snapshot.nic.management]);
  const [nicReplication, setNicReplication] = useState([...snapshot.nic.replication]);
  const [savedAt, setSavedAt] = useState(null);

  function updateField(setter, key, colIndex, value) {
    setter((prev) =>
      prev.map((f) =>
        f.key === key
          ? { ...f, values: f.values.map((v, i) => (i === colIndex ? value : v)) }
          : f
      )
    );
  }

  function updateNic(setter, colIndex, value) {
    setter((prev) => prev.map((v, i) => (i === colIndex ? value : v)));
  }

  function handleSave() {
    // Map each field's 3 column values onto the matching server slot
    // (Server 1 / 2 / 3 -> the store's three server records, read directly
    // via getState() since we just need their ids, not a subscription) and
    // push the whole draft into the shared store in one commit. This is
    // what makes the change show up on Application Services and Monitor.
    const serverIds = useClusterStore.getState().servers.map((s) => s.id);
    const serverUpdates = {};
    serverIds.forEach((id, colIndex) => {
      serverUpdates[id] = {
        managementIp: fieldValues(fields, 'managementIp')[colIndex],
        host: fieldValues(fields, 'host')[colIndex],
        db4: fieldValues(fields, 'db4')[colIndex],
        subscriberIp: fieldValues(fields, 'subscriberIp')[colIndex],
        production1Ip: fieldValues(fields, 'production1')[colIndex],
        bondSettings: fieldValues(fields, 'bondSettings')[colIndex],
        production1Username: fieldValues(fields, 'production1Username')[colIndex],
        production1Password: fieldValues(fields, 'production1Password')[colIndex],
        production1Service: fieldValues(fields, 'production1Service')[colIndex],
      };
    });

    applySettings({
      servers: serverUpdates,
      productionTwo: {
        production2: fieldValues(productionTwoFields, 'production2'),
        production2Username: fieldValues(productionTwoFields, 'production2Username'),
        production2Password: fieldValues(productionTwoFields, 'production2Password'),
        production3Service: fieldValues(productionTwoFields, 'production3Service'),
      },
      sync,
      password,
      systemType,
      nicManagement,
      nicReplication,
    });

    setSavedAt(new Date());
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="max-w-5xl">
        {/* Server column headers */}
        <div className="mb-2 grid grid-cols-[210px_repeat(3,1fr)] gap-4">
          <div />
          {snapshot.serverColumns.map((col) => (
            <div
              key={col}
              className="rounded-sm bg-gray-300 py-2 text-center text-sm font-semibold text-gray-700"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Primary server fields */}
        <div>
          {fields.map((field) => (
            <FieldGridRow
              key={field.key}
              field={field}
              onChange={(key, colIndex, value) => updateField(setFields, key, colIndex, value)}
            />
          ))}
        </div>

        {/* Production 2 fields */}
        <div className="mt-6">
          {productionTwoFields.map((field) => (
            <FieldGridRow
              key={field.key}
              field={field}
              onChange={(key, colIndex, value) =>
                updateField(setProductionTwoFields, key, colIndex, value)
              }
            />
          ))}
        </div>

        {/* Sync mode */}
        <div className="mt-6 grid grid-cols-[210px_repeat(3,1fr)] items-center gap-4 py-1">
          <label className="text-sm font-semibold text-gray-700">Sync</label>
          <div className="col-span-3 flex items-center gap-6 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sync"
                checked={sync === 'synchronous'}
                onChange={() => setSync('synchronous')}
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              Synchronous
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sync"
                checked={sync === 'asynchronous'}
                onChange={() => setSync('asynchronous')}
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              Asynchronous
            </label>
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-[210px_repeat(3,1fr)] items-center gap-4 py-1">
          <label className="text-sm font-semibold text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${INPUT_CLASS} max-w-xs`}
          />
        </div>

        {/* Physical / Virtual system */}
        <div className="grid grid-cols-[210px_repeat(3,1fr)] items-center gap-4 py-1">
          <label className="text-sm font-semibold text-gray-700">Physical/Virtual System</label>
          <select
            value={systemType}
            onChange={(e) => setSystemType(e.target.value)}
            className={`${INPUT_CLASS} max-w-xs`}
          >
            {snapshot.systemTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* NIC settings - 2 columns */}
        <div className="grid grid-cols-[210px_repeat(2,1fr)] items-center gap-4 py-1">
          <label className="text-sm font-semibold text-gray-700">Management NIC</label>
          {nicManagement.map((value, colIndex) => (
            <input
              key={colIndex}
              value={value}
              onChange={(e) => updateNic(setNicManagement, colIndex, e.target.value)}
              className={`${INPUT_CLASS} max-w-xs`}
            />
          ))}
        </div>
        <div className="grid grid-cols-[210px_repeat(2,1fr)] items-center gap-4 py-1">
          <label className="text-sm font-semibold text-gray-700">Replication NIC</label>
          {nicReplication.map((value, colIndex) => (
            <input
              key={colIndex}
              value={value}
              onChange={(e) => updateNic(setNicReplication, colIndex, e.target.value)}
              className={`${INPUT_CLASS} max-w-xs`}
            />
          ))}
        </div>

        {/* Save */}
        <div className="mt-8 flex items-center justify-end gap-3">
          {savedAt && (
            <span className="text-xs text-gray-500">
              Saved at{' '}
              {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}