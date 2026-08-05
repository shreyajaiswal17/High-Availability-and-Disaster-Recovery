export default function MaintenanceModeToggle({ enabled, onChange }) {
  return (
    <div className="flex items-center gap-4 px-1 text-sm text-slate-700">
      <span className="font-medium">Maintenance Mode:</span>

      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="radio"
          name="maintenance-mode"
          checked={enabled === true}
          onChange={() => onChange(true)}
          className="h-4 w-4 accent-slate-700"
        />
        Enabled
      </label>

      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="radio"
          name="maintenance-mode"
          checked={enabled === false}
          onChange={() => onChange(false)}
          className="h-4 w-4 accent-slate-700"
        />
        Disabled
      </label>
    </div>
  );
}
