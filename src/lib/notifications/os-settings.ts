import { openExternalUrl } from "@/lib/external-link";
import { isTauriRuntime } from "@/lib/updater/runtime";

const NOTIFICATION_SETTINGS_URLS: Record<string, string> = {
  darwin: "x-apple.systempreferences:com.apple.preference.notifications",
  win32: "ms-settings:notifications",
};

const getOsSettingsUrl = (): string | null => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) {
    return NOTIFICATION_SETTINGS_URLS.darwin;
  }

  if (platform.includes("win")) {
    return NOTIFICATION_SETTINGS_URLS.win32;
  }

  return null;
};

export const openNotificationOsSettings = async (): Promise<boolean> => {
  const url = getOsSettingsUrl();
  if (!url) {
    return false;
  }

  try {
    await openExternalUrl(url);
    return true;
  } catch {
    return false;
  }
};

export const supportsNotificationOsSettings = (): boolean =>
  isTauriRuntime() && getOsSettingsUrl() !== null;
