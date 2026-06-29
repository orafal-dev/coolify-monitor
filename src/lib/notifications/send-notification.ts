import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/lib/updater/runtime";
import type { StatusChangeEvent } from "@/lib/notifications/status-snapshot.types";
import { formatStatusChangeNotification } from "@/lib/notifications/status-snapshot";
import type { NotificationSettings } from "@/lib/notifications/notification-settings.types";

export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }

  return invoke<boolean>("is_system_notification_granted");
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }

  return invoke<boolean>("request_system_notification_permission");
};

export const sendSystemNotification = async (
  title: string,
  body: string,
): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }

  const granted = await checkNotificationPermission();
  if (!granted) {
    return;
  }

  await invoke("send_system_notification", { title, body });
};

export const sendTestNotification = async (): Promise<void> => {
  await sendSystemNotification(
    "Coolify Monitor",
    "Notifications are working. You'll be alerted when deployments fail or services go unhealthy.",
  );
};

export const sendStatusChangeNotification = async (
  event: StatusChangeEvent,
): Promise<void> => {
  const { title, body } = formatStatusChangeNotification(event);
  await sendSystemNotification(title, body);
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
