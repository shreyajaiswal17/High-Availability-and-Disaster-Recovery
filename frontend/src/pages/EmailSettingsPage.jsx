import { useEffect, useState } from 'react';
// Adjust this path to match your actual bindings folder — Wails names it
// after your go.mod module name. Check frontend/bindings/ after running
// `wails3 dev` or `wails3 generate bindings` to see the real path.
import { EmailService } from '../../bindings/changeme/index';
import { emailSettingsData } from '../data/sampleData';

const INPUT_CLASS =
  'w-full rounded-sm border border-gray-300 bg-purple-50/70 px-3 py-1.5 text-sm text-gray-800 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400';

function fieldsFromSettings(settings) {
  return emailSettingsData.fields.map((f) => ({ ...f, value: settings?.[f.key] ?? '' }));
}

function settingsFromFields(fields) {
  return fields.reduce((acc, f) => {
    acc[f.key] = f.value;
    return acc;
  }, {});
}

export default function EmailSettingsPage() {
  const [fields, setFields] = useState(() => emailSettingsData.fields.map((f) => ({ ...f })));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'success' | 'error'
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testError, setTestError] = useState('');

  // Go calls are async (they return Promises), so the initial load happens
  // in an effect rather than a lazy useState initializer.
  useEffect(() => {
    let cancelled = false;
    EmailService.LoadSettings()
      .then((settings) => {
        if (!cancelled) setFields(fieldsFromSettings(settings));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message ?? String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(key, value) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
    setSaveStatus(null);
    setSaveError('');
    setTestStatus(null);
    setTestError('');
  }

  // Validation now lives entirely in Go (see emailservice.go's
  // validateEmailSettings) — a failed Save/Test simply rejects with the
  // same message Go returns, so there's one source of truth instead of the
  // rules drifting between JS and Go.

  async function handleSave() {
    setSaveStatus('saving');
    setSaveError('');
    try {
      await EmailService.SaveSettings(settingsFromFields(fields));
      setSaveStatus('success');
      setSavedAt(new Date());
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err?.message ?? String(err));
    }
  }

  async function handleTest() {
    setTestStatus('testing');
    setTestError('');
    try {
      await EmailService.SendTestEmail(settingsFromFields(fields));
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestError(err?.message ?? String(err));
    }
  }

  const isSaving = saveStatus === 'saving';
  const isTesting = testStatus === 'testing';
  const receiverEmail = fields.find((f) => f.key === 'receiverEmail')?.value;

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-lg pt-16">
        {loading ? (
          <p className="text-center text-sm text-gray-400">Loading saved settings…</p>
        ) : (
          <>
            {loadError && (
              <p className="mb-4 text-center text-xs text-red-600">
                Could not load saved settings: {loadError}
              </p>
            )}

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <label
                    htmlFor={field.key}
                    className="text-right text-sm font-medium text-gray-600"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    type={field.type}
                    value={field.value}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-[140px_1fr] gap-3">
              <div />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full rounded-sm bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="w-full rounded-sm border border-gray-300 bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTesting ? 'Testing…' : 'Test Email Settings'}
                </button>

                {saveStatus === 'error' && (
                  <p className="pt-1 text-center text-xs text-red-600">{saveError}</p>
                )}
                {saveStatus === 'success' && savedAt && (
                  <p className="pt-1 text-center text-xs text-gray-500">
                    Saved at{' '}
                    {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {testStatus === 'success' && (
                  <p className="pt-1 text-center text-xs text-green-600">
                    Test email sent — check {receiverEmail || 'the inbox'}.
                  </p>
                )}
                {testStatus === 'error' && (
                  <p className="pt-1 text-center text-xs text-red-600">{testError}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}