"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardPanel, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "@/lib/notifications/notification-settings.types";
import { supportsNotificationOsSettings } from "@/lib/notifications/os-settings";
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from "@/lib/storage/settings";
import { sendTestNotification } from "@/lib/notifications/send-notification";

export const NotificationSettingsPanel = () => {
  const { isDesktop, isGranted, isChecking, request, openOsSettings } =
    useNotificationPermission(true);
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const canOpenOsSettings = supportsNotificationOsSettings();

  useEffect(() => {
    const hydrate = async () => {
      const saved = await loadNotificationSettings();
      setSettings(saved);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persistSettings = async (next: NotificationSettings): Promise<void> => {
    setSettings(next);
    await saveNotificationSettings(next);
  };

  const handleToggleEnabled = (checked: boolean): void => {
    void persistSettings({ ...settings, enabled: checked });
  };

  const handleToggleApplications = (checked: boolean): void => {
    void persistSettings({ ...settings, notifyApplications: checked });
  };

  const handleToggleDeployments = (checked: boolean): void => {
    void persistSettings({ ...settings, notifyDeployments: checked });
  };

  const handleToggleServers = (checked: boolean): void => {
    void persistSettings({ ...settings, notifyServers: checked });
  };

  const handleRequest = (): void => {
    void request();
  };

  const handleOpenSettings = (): void => {
    void openOsSettings();
  };

  const handleSendTest = async (): Promise<void> => {
    setIsSendingTest(true);

    try {
      await sendTestNotification();
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isDesktop) {
    return null;
  }

  const permissionLabel = isChecking
    ? "Checking OS permission…"
    : isGranted
      ? "OS permission granted"
      : "OS permission not granted";

  return (
    <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Status notifications</CardTitle>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <HugeiconsIcon
            icon={Notification01Icon}
            className="mt-0.5 size-5 shrink-0 text-violet-500"
            strokeWidth={2}
          />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">Desktop alerts</p>
            <p className="text-sm text-muted-foreground">{permissionLabel}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
            <Label htmlFor="notifications-enabled" className="cursor-pointer">
              Enable status notifications
            </Label>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={!isHydrated || !isGranted}
              aria-label="Enable status notifications"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
            <Label htmlFor="notify-applications" className="cursor-pointer">
              Applications (unhealthy)
            </Label>
            <Switch
              id="notify-applications"
              checked={settings.notifyApplications}
              onCheckedChange={handleToggleApplications}
              disabled={!isHydrated || !settings.enabled || !isGranted}
              aria-label="Notify when applications become unhealthy"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
            <Label htmlFor="notify-deployments" className="cursor-pointer">
              Deployments (failed)
            </Label>
            <Switch
              id="notify-deployments"
              checked={settings.notifyDeployments}
              onCheckedChange={handleToggleDeployments}
              disabled={!isHydrated || !settings.enabled || !isGranted}
              aria-label="Notify when deployments fail"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
            <Label htmlFor="notify-servers" className="cursor-pointer">
              Servers (unreachable)
            </Label>
            <Switch
              id="notify-servers"
              checked={settings.notifyServers}
              onCheckedChange={handleToggleServers}
              disabled={!isHydrated || !settings.enabled || !isGranted}
              aria-label="Notify when servers become unreachable"
            />
          </div>
        </div>

        {!isGranted ? (
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleRequest}
              disabled={isChecking}
              aria-label="Allow notifications"
            >
              Allow notifications
            </Button>
            {canOpenOsSettings ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenSettings}
                aria-label="Open notification settings"
              >
                Open notification settings
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSendTest()}
              disabled={isSendingTest}
              aria-label="Send test notification"
            >
              {isSendingTest ? "Sending…" : "Send test notification"}
            </Button>
            {canOpenOsSettings ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenSettings}
                aria-label="Open notification settings"
              >
                Open notification settings
              </Button>
            ) : null}
          </div>
        )}
      </CardPanel>
    </Card>
  );
};
