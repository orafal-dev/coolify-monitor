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

export type PendingUpdateInfo = {
  version: string;
  body?: string;
  date?: string;
};
