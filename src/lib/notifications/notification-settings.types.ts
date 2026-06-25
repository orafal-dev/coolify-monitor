export type NotificationSettings = {
  enabled: boolean;
  notifyApplications: boolean;
  notifyDeployments: boolean;
  notifyServers: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  notifyApplications: true,
  notifyDeployments: true,
  notifyServers: true,
};

export const NOTIFICATION_ONBOARDING_KEY = "notificationOnboardingComplete";

export const NOTIFICATION_SETTINGS_KEY = "notificationSettings";
