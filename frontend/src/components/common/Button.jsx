import { Loader2 } from 'lucide-react';

const VARIANTS = {
  default:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 ring-1 ring-inset ring-slate-300',
  primary:
    'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900',
  danger:
    'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 ring-1 ring-inset ring-red-200',
};

/**
 * Generic button with built-in disabled + loading affordances so every
 * action button in the app behaves consistently.
 */
export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  className = '',
  type = 'button',
  title,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium
        transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
