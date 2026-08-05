import { navItems } from '../../data/sampleData';

export default function NavTabs({ activeTab, onTabChange }) {
  return (
    <nav className="border-b border-slate-700 bg-slate-800">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
        {navItems.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60
                ${
                  isActive
                    ? 'my-1.5 rounded border border-white/80 py-1.5 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
