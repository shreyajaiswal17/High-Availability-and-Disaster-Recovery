import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Construction className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
