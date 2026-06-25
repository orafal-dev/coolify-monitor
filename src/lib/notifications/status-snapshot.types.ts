import type { CoolifyOverview } from "@/lib/coolify/types";

export type NotificationCategory = "application" | "deployment" | "server";

export type SnapshotApplication = {
  name: string;
  status: string;
};

export type SnapshotDeployment = {
  name: string;
  status: string;
};

export type SnapshotServer = {
  name: string;
  reachable: boolean;
};

export type StatusSnapshot = {
  applications: Map<string, SnapshotApplication>;
  deployments: Map<string, SnapshotDeployment>;
  servers: Map<string, SnapshotServer>;
};

export type StatusChangeEvent = {
  category: NotificationCategory;
  resourceId: string;
  resourceName: string;
  previousValue: string;
  currentValue: string;
  instanceLabel: string;
};

export type BuildStatusSnapshotInput = CoolifyOverview;
