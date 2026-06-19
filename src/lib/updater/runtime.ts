import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import type { UpdateProgress } from "@/lib/updater/runtime.types";

export const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const getAppVersion = async (): Promise<string> => {
  if (!isTauriRuntime()) {
    return "0.1.0";
  }

  return getVersion();
};

export const checkForUpdate = async (): Promise<Update | null> => {
  if (!isTauriRuntime()) {
    return null;
  }

  return check();
};

export const downloadAndInstallUpdate = async (
  update: Update,
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> => {
  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? 0;
        downloaded = 0;
        onProgress?.({ downloaded, contentLength });
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        onProgress?.({ downloaded, contentLength });
        break;
      case "Finished":
        onProgress?.({ downloaded: contentLength || downloaded, contentLength });
        break;
      default:
        break;
    }
  });
};

export const relaunchApp = async (): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }

  await relaunch();
};
