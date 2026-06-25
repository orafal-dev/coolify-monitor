"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NotificationPermissionScreen } from "@/components/notifications/notification-permission-screen";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/notifications/notification-settings.types";
import {
  loadNotificationOnboardingComplete,
  saveNotificationOnboardingComplete,
  saveNotificationSettings,
} from "@/lib/storage/settings";
import { isTauriRuntime } from "@/lib/updater/runtime";

type NotificationPermissionGateProps = {
  children: ReactNode;
};

export const NotificationPermissionGate = ({
  children,
}: NotificationPermissionGateProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isDesktop = isTauriRuntime();

  useEffect(() => {
    const hydrate = async () => {
      if (!isDesktop) {
        setOnboardingComplete(true);
        setIsHydrated(true);
        return;
      }

      const complete = await loadNotificationOnboardingComplete();
      setOnboardingComplete(complete);
      setIsHydrated(true);
    };

    void hydrate();
  }, [isDesktop]);

  const handleContinue = async (): Promise<void> => {
    setIsSaving(true);

    try {
      await saveNotificationOnboardingComplete();
      await saveNotificationSettings({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        enabled: true,
      });
      setOnboardingComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center overscroll-none">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (isDesktop && !onboardingComplete) {
    return (
      <NotificationPermissionScreen
        onContinue={() => void handleContinue()}
        isSaving={isSaving}
      />
    );
  }

  return children;
};
