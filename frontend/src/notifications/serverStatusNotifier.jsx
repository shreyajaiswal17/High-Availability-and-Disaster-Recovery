import { useClusterStore } from '../store/clusterStore';
// Adjust to your actual bindings folder name (check frontend/bindings/
// after `wails3 dev` / `wails3 generate bindings`).
import { NotificationService } from '../../bindings/HADR';

function notify(title, message) {
  NotificationService.ShowNotification(title, message).catch((err) => {
    // Notifications are best-effort — a failed toast shouldn't break
    // anything else in the app.
    console.error('Failed to show notification:', err);
  });
}

function describe(server) {
  return server.tenancy ? `${server.host} (${server.tenancy})` : server.host;
}

// Watches the shared cluster store for server status transitions and fires
// a native OS notification when a server goes down or comes back up.
//
// This intentionally tracks each server's last-seen status itself, rather
// than relying on zustand's subscribe callback to hand back a previous-state
// snapshot (that shape differs across zustand versions/middleware) — this
// way it's guaranteed to only fire once per actual transition, not on every
// unrelated store update (e.g. editing a Settings field).
//
// Call this once near the root of the app (see App.jsx) and keep the
// returned unsubscribe function around for the app's whole lifetime.
export function watchServerStatusForNotifications() {
  const lastStatus = new Map(
    useClusterStore
      .getState()
      .servers.filter((s) => s.host) // skip unconfigured slots
      .map((s) => [s.id, s.status])
  );

  return useClusterStore.subscribe((state) => {
    state.servers.forEach((server) => {
      if (!server.host) return;

      const previous = lastStatus.get(server.id);
      const current = server.status;

      if (previous !== undefined && previous !== current) {
        if (current === 'offline' && previous === 'online') {
          notify('Server down', `${describe(server)} went offline.`);
        }
        if (current === 'online' && previous === 'offline') {
          notify('Server recovered', `${describe(server)} is back online.`);
        }
      }

      lastStatus.set(server.id, current);
    });
  });
}