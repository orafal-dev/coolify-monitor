"use client";

import type { Update } from "@tauri-apps/plugin-updater";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  getAppVersion,
  isTauriRuntime,
  relaunchApp,
} from "@/lib/updater/runtime";
import type {
  UpdateProgress,
  UpdaterStatus,
} from "@/lib/updater/runtime.types";

type AppUpdaterContextValue = {
  isDesktop: boolean;
  status: UpdaterStatus;
  currentVersion: string;
  pendingUpdate: Update | null;
  progress: UpdateProgress;
  progressPercent: number;
  errorMessage: string | null;
  checkForUpdates: () => Promise<Update | null>;
  installUpdate: (update?: Update | null) => Promise<void>;
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
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<UpdateProgress>({
    downloaded: 0,
    contentLength: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    try {
      const update = await checkForUpdate();

      if (!update) {
        setStatus("up-to-date");
        return null;
      }

      setPendingUpdate(update);
      setStatus("available");
      return update;
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to check for updates.",
      );
      return null;
    }
  }, [isDesktop]);

  const installUpdate = useCallback(
    async (update: Update | null = pendingUpdate) => {
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
    },
    [isDesktop, pendingUpdate],
  );

  const dismissUpdate = useCallback(() => {
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
