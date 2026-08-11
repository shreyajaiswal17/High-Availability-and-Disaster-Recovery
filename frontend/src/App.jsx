import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import MonitorPage from './pages/MonitorPage';
import ApplicationServicesPage from './pages/ApplicationServicesPage';
import SettingsPage from './pages/SettingsPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import AboutPage from './pages/AboutPage';
import { watchServerStatusForNotifications } from './notifications/serverStatusNotifier';

const PAGES = {
  monitor: MonitorPage,
  'application-services': ApplicationServicesPage,
  settings: SettingsPage,
  'email-settings': EmailSettingsPage,
  about: AboutPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const ActivePage = PAGES[activeTab] ?? MonitorPage;

  // Runs for the lifetime of the app, regardless of which tab is active, so
  // a server going down while you're on Settings still triggers a
  // notification.
  useEffect(() => {
    const unsubscribe = watchServerStatusForNotifications();
    return unsubscribe;
  }, []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <ActivePage />
    </Layout>
  );
}