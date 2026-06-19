import type { Update } from "@tauri-apps/plugin-updater";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "error"
  | "up-to-date";

export type UpdateProgress = {
  downloaded: number;
  contentLength: number;
};

export type PendingUpdate = Update;
