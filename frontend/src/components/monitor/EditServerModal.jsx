import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';

const FIELDS = [
  { key: 'management', label: 'Management IP' },
  { key: 'replication', label: 'Replication IP' },
  { key: 'production', label: 'Production IP' },
  { key: 'heartbeat', label: 'Heartbeat' },
];

export default function EditServerModal({ server, onSave, onClose }) {
  const [form, setForm] = useState(server);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(server);
  }, [server]);

  if (!server) return null;

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    // Simulate a network call so the UI demonstrates a real loading state.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaving(false);
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Edit {server.host}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {FIELDS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="default" onClick={onClose} disabled={saving} className="w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-auto">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
