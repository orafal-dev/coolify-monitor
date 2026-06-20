"use client";

import type { Update } from "@tauri-apps/plugin-updater";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  getAppVersion,
  isTauriRuntime,
  relaunchApp,
  toPendingUpdateInfo,
} from "@/lib/updater/runtime";
import type {
  PendingUpdateInfo,
  UpdateProgress,
  UpdaterStatus,
} from "@/lib/updater/runtime.types";

type AppUpdaterContextValue = {
  isDesktop: boolean;
  status: UpdaterStatus;
  currentVersion: string;
  pendingUpdate: PendingUpdateInfo | null;
  progress: UpdateProgress;
  progressPercent: number;
  errorMessage: string | null;
  checkForUpdates: () => Promise<PendingUpdateInfo | null>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};

const AppUpdaterContext = createContext<AppUpdaterContextValue | null>(null);

type AppUpdaterProviderProps = {
  children: ReactNode;
  checkOnMount?: boolean;
};

export const AppUpdaterProvider = ({
  children,
  checkOnMount = true,
}: AppUpdaterProviderProps) => {
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [currentVersion, setCurrentVersion] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdateInfo | null>(
    null,
  );
  const [progress, setProgress] = useState<UpdateProgress>({
    downloaded: 0,
    contentLength: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateRef = useRef<Update | null>(null);
  const isDesktop = isTauriRuntime();

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    void getAppVersion().then(setCurrentVersion);
  }, [isDesktop]);

  const checkForUpdates = useCallback(async () => {
    if (!isDesktop) {
      return null;
    }

    setStatus("checking");
    setErrorMessage(null);
    setPendingUpdate(null);
    updateRef.current = null;

    try {
      const update = await checkForUpdate();

      if (!update) {
        setStatus("up-to-date");
        return null;
      }

      updateRef.current = update;
      const info = toPendingUpdateInfo(update);
      setPendingUpdate(info);
      setStatus("available");
      return info;
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to check for updates.",
      );
      return null;
    }
  }, [isDesktop]);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!isDesktop || !update) {
      return;
    }

    setStatus("downloading");
    setErrorMessage(null);
    setProgress({ downloaded: 0, contentLength: 0 });

    try {
      await downloadAndInstallUpdate(update, (nextProgress) => {
        setProgress(nextProgress);
        setStatus("downloading");
      });

      setStatus("installing");
      await relaunchApp();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to download or install the update.",
      );
    }
  }, [isDesktop]);

  const dismissUpdate = useCallback(() => {
    updateRef.current = null;
    setPendingUpdate(null);
    setStatus("idle");
    setErrorMessage(null);
    setProgress({ downloaded: 0, contentLength: 0 });
  }, []);

  useEffect(() => {
    if (!checkOnMount || !isDesktop) {
      return;
    }

    void checkForUpdates();
  }, [checkOnMount, checkForUpdates, isDesktop]);

  const progressPercent =
    progress.contentLength > 0
      ? Math.min(
          100,
          Math.round((progress.downloaded / progress.contentLength) * 100),
        )
      : 0;

  const value = useMemo(
    () => ({
      isDesktop,
      status,
      currentVersion,
      pendingUpdate,
      progress,
      progressPercent,
      errorMessage,
      checkForUpdates,
      installUpdate,
      dismissUpdate,
    }),
    [
      checkForUpdates,
      currentVersion,
      dismissUpdate,
      errorMessage,
      installUpdate,
      isDesktop,
      pendingUpdate,
      progress,
      progressPercent,
      status,
    ],
  );

  return (
    <AppUpdaterContext.Provider value={value}>
      {children}
    </AppUpdaterContext.Provider>
  );
};

export const useAppUpdater = (): AppUpdaterContextValue => {
  const context = useContext(AppUpdaterContext);

  if (!context) {
    throw new Error("useAppUpdater must be used within AppUpdaterProvider");
  }

  return context;
};
