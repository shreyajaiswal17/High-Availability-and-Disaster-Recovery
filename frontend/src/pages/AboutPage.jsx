import { useState } from 'react';
import { aboutPageData } from '../data/sampleData';

const INPUT_CLASS =
  'w-full rounded-sm border border-gray-300 bg-purple-50/70 px-3 py-1.5 text-sm text-gray-800 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400';

const SECONDARY_BUTTON_CLASS =
  'flex-1 rounded-sm border border-gray-300 bg-gray-200 py-2 text-sm font-medium text-gray-700 ' +
  'hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60';

export default function AboutPage() {
  const [licenseKey, setLicenseKey] = useState(aboutPageData.licenseKey);
  const [newPassword, setNewPassword] = useState(aboutPageData.newPassword);
  const [licenseStatus, setLicenseStatus] = useState(null); // null | 'fetching' | 'verifying' | 'valid' | 'invalid'

  function handleGetLicense() {
    setLicenseStatus('fetching');
    // Replace with a real "issue license key" API call.
    setTimeout(() => {
      setLicenseKey('XXXXX-XXXXX-XXXXX-XXXXX');
      setLicenseStatus(null);
    }, 800);
  }

  function handleVerifyLicense() {
    if (!licenseKey.trim()) return;
    setLicenseStatus('verifying');
    // Replace with a real "verify license key" API call.
    setTimeout(() => setLicenseStatus('valid'), 800);
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-lg pt-16">
        <div className="space-y-5">
          {/* License Info (display-only) */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-3">
            <label className="pt-0.5 text-right text-sm font-medium text-gray-600">
              License Info
            </label>
            <p className="text-sm leading-snug text-gray-700">{aboutPageData.licenseInfo}</p>
          </div>

          {/* License Key */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-3">
            <label htmlFor="licenseKey" className="pt-1 text-right text-sm font-medium text-gray-600">
              License Key
            </label>
            <textarea
              id="licenseKey"
              rows={4}
              value={licenseKey}
              onChange={(e) => {
                setLicenseKey(e.target.value);
                setLicenseStatus(null);
              }}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {/* Get / Verify buttons */}
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGetLicense}
                disabled={licenseStatus === 'fetching'}
                className={SECONDARY_BUTTON_CLASS}
              >
                {licenseStatus === 'fetching' ? 'Fetching…' : 'Get License'}
              </button>
              <button
                type="button"
                onClick={handleVerifyLicense}
                disabled={licenseStatus === 'verifying'}
                className={SECONDARY_BUTTON_CLASS}
              >
                {licenseStatus === 'verifying' ? 'Verifying…' : 'Verify License'}
              </button>
            </div>
          </div>

          {(licenseStatus === 'valid' || licenseStatus === 'invalid') && (
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div />
              <p
                className={`text-xs ${
                  licenseStatus === 'valid' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {licenseStatus === 'valid'
                  ? 'License key verified successfully.'
                  : 'License key could not be verified.'}
              </p>
            </div>
          )}

          {/* New Password */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-3">
            <label htmlFor="newPassword" className="text-right text-sm font-medium text-gray-600">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}