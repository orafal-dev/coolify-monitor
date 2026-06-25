"use client";

import { useEffect, useRef, useState } from "react";
import { useAllInstancesOverview } from "@/hooks/use-all-instances-overview";
import { useApp } from "@/hooks/use-app-context";
import { getInstanceDisplayLabel } from "@/lib/coolify/constants";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "@/lib/notifications/notification-settings.types";
import {
  buildStatusSnapshot,
  detectStatusChanges,
} from "@/lib/notifications/status-snapshot";
import type { StatusSnapshot } from "@/lib/notifications/status-snapshot.types";
import {
  sendStatusChangeNotification,
  shouldNotifyForEvent,
} from "@/lib/notifications/send-notification";
import { loadNotificationSettings } from "@/lib/storage/settings";
import { isTauriRuntime } from "@/lib/updater/runtime";

type InstanceWatcherState = {
  snapshot: StatusSnapshot | null;
  lastDataUpdatedAt: number;
};

export const StatusNotificationWatcher = () => {
  const { instances, instanceHasStoredToken, isHydrated } = useApp();
  const watcherStateRef = useRef<Map<string, InstanceWatcherState>>(new Map());
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const isDesktop = isTauriRuntime();

  const { overviews } = useAllInstancesOverview(
    instances,
    instanceHasStoredToken,
    isDesktop && isHydrated,
  );

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const loadSettings = async () => {
      const next = await loadNotificationSettings();
      setSettings(next);
      setSettingsLoaded(true);
    };

    void loadSettings();

    const intervalId = window.setInterval(() => {
      void loadSettings();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const activeIds = new Set(instances.map((instance) => instance.id));
    for (const instanceId of watcherStateRef.current.keys()) {
      if (!activeIds.has(instanceId)) {
        watcherStateRef.current.delete(instanceId);
      }
    }
  }, [instances, isDesktop]);

  useEffect(() => {
    if (!isDesktop || !settingsLoaded || !settings.enabled) {
      return;
    }

    for (const overview of overviews) {
      if (!overview.isSuccess || !overview.data) {
        continue;
      }

      const instanceId = overview.instance.id;
      const nextSnapshot = buildStatusSnapshot(overview.data);
      const instanceLabel = getInstanceDisplayLabel(overview.instance);
      const currentState = watcherStateRef.current.get(instanceId) ?? {
        snapshot: null,
        lastDataUpdatedAt: 0,
      };

      if (currentState.lastDataUpdatedAt === overview.dataUpdatedAt) {
        continue;
      }

      if (!currentState.snapshot) {
        watcherStateRef.current.set(instanceId, {
          snapshot: nextSnapshot,
          lastDataUpdatedAt: overview.dataUpdatedAt,
        });
        continue;
      }

      const changes = detectStatusChanges(
        currentState.snapshot,
        nextSnapshot,
        instanceLabel,
      );

      watcherStateRef.current.set(instanceId, {
        snapshot: nextSnapshot,
        lastDataUpdatedAt: overview.dataUpdatedAt,
      });

      for (const change of changes) {
        if (!shouldNotifyForEvent(change, settings)) {
          continue;
        }

        void sendStatusChangeNotification(change);
      }
    }
  }, [isDesktop, overviews, settings, settingsLoaded]);

  return null;
};
