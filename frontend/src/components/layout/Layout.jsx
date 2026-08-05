import Header from './Header';
import NavTabs from './NavTabs';

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
