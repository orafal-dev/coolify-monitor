import { isTauriRuntime } from "@/lib/updater/runtime";
import type { StatusChangeEvent } from "@/lib/notifications/status-snapshot.types";
import { formatStatusChangeNotification } from "@/lib/notifications/status-snapshot";
import type { NotificationSettings } from "@/lib/notifications/notification-settings.types";

export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }

  const { isPermissionGranted } = await import("@tauri-apps/plugin-notification");
  return isPermissionGranted();
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }

  const { isPermissionGranted, requestPermission } = await import(
    "@tauri-apps/plugin-notification"
  );

  if (await isPermissionGranted()) {
    return true;
  }

  const permission = await requestPermission();
  return permission === "granted";
};

export const sendStatusChangeNotification = async (
  event: StatusChangeEvent,
): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }

  const granted = await checkNotificationPermission();
  if (!granted) {
    return;
  }

  const { sendNotification } = await import("@tauri-apps/plugin-notification");
  const { title, body } = formatStatusChangeNotification(event);

  sendNotification({ title, body });
};

export const shouldNotifyForEvent = (
  event: StatusChangeEvent,
  settings: NotificationSettings,
): boolean => {
  if (!settings.enabled) {
    return false;
  }

  switch (event.category) {
    case "application":
      return settings.notifyApplications;
    case "deployment":
      return settings.notifyDeployments;
    case "server":
      return settings.notifyServers;
    default:
      return false;
  }
};
