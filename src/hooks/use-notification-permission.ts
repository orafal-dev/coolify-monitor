"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications/send-notification";
import { openNotificationOsSettings } from "@/lib/notifications/os-settings";
import { isTauriRuntime } from "@/lib/updater/runtime";

const PERMISSION_POLL_MS = 1500;

export const useNotificationPermission = (poll = false) => {
  const [isGranted, setIsGranted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const isDesktop = isTauriRuntime();

  const refresh = useCallback(async () => {
    if (!isDesktop) {
      setIsGranted(false);
      setIsChecking(false);
      return false;
    }

    setIsChecking(true);
    const granted = await checkNotificationPermission();
    setIsGranted(granted);
    setIsChecking(false);
    return granted;
  }, [isDesktop]);

  const request = useCallback(async () => {
    if (!isDesktop) {
      return false;
    }

    const granted = await requestNotificationPermission();
    setIsGranted(granted);
    return granted;
  }, [isDesktop]);

  const openOsSettings = useCallback(async () => {
    try {
      await openNotificationOsSettings();
    } finally {
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!poll || !isDesktop) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, PERMISSION_POLL_MS);

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isDesktop, poll, refresh]);

  return {
    isDesktop,
    isGranted,
    isChecking,
    request,
    openOsSettings,
    refresh,
  };
};
