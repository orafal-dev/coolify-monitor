export const COOLIFY_CLOUD_BASE_URL = "https://app.coolify.io";

export const DEFAULT_REFRESH_INTERVAL_SECONDS = 30;

export const SETTINGS_STORE_PATH = "coolify-settings.json";

export const INSTANCES_STORE_KEY = "instances";

export type InstanceType = "cloud" | "self-hosted";

export const INSTANCE_TYPE_LABELS: Record<InstanceType, string> = {
  cloud: "Coolify Cloud",
  "self-hosted": "Self-hosted",
};

export const INSTANCE_TYPE_OPTIONS = (
  Object.entries(INSTANCE_TYPE_LABELS) as [InstanceType, string][]
).map(([value, label]) => ({ value, label }));

export type StoredCoolifyInstance = {
  id: string;
  label: string;
  baseUrl: string;
  instanceType: InstanceType;
  refreshIntervalSeconds: number;
};

export type CoolifyInstance = StoredCoolifyInstance & {
  apiToken: string;
};

export type InstancesState = {
  instances: StoredCoolifyInstance[];
  activeInstanceId: string | null;
};

export type HydratedInstancesState = {
  instances: CoolifyInstance[];
  activeInstanceId: string | null;
};

export type AppView =
  | "overview"
  | "projects"
  | "applications"
  | "databases"
  | "services"
  | "servers"
  | "deployments"
  | "settings"
  | "create-instance";

export const createInstanceId = (): string => crypto.randomUUID();

export const buildDefaultInstanceLabel = (
  instanceType: InstanceType,
  existingInstances: Pick<StoredCoolifyInstance, "instanceType">[],
): string => {
  const prefix =
    instanceType === "cloud" ? "Cloud instance" : "Self-hosted instance";
  const sameTypeCount = existingInstances.filter(
    (instance) => instance.instanceType === instanceType,
  ).length;

  return `${prefix} #${sameTypeCount + 1}`;
};

export const getDefaultInstance = (
  partial?: Partial<CoolifyInstance>,
  existingInstances: Pick<StoredCoolifyInstance, "instanceType">[] = [],
): CoolifyInstance => {
  const instanceType = partial?.instanceType ?? "cloud";

  return {
    id: createInstanceId(),
    label:
      partial?.label ??
      buildDefaultInstanceLabel(instanceType, existingInstances),
    apiToken: "",
    baseUrl: COOLIFY_CLOUD_BASE_URL,
    instanceType,
    refreshIntervalSeconds: DEFAULT_REFRESH_INTERVAL_SECONDS,
    ...partial,
  };
};

export const normalizeBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return COOLIFY_CLOUD_BASE_URL;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

export const buildApiUrl = (baseUrl: string, path: string): string => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}/api/v1${normalizedPath}`;
};

export const getInstanceDisplayLabel = (instance: StoredCoolifyInstance): string =>
  instance.label.trim() ||
  buildDefaultInstanceLabel(instance.instanceType, []);

export const toConnection = (
  instance: CoolifyInstance,
): Pick<
  CoolifyInstance,
  "apiToken" | "baseUrl" | "instanceType" | "refreshIntervalSeconds" | "label"
> => ({
  apiToken: instance.apiToken,
  baseUrl: instance.baseUrl,
  instanceType: instance.instanceType,
  refreshIntervalSeconds: instance.refreshIntervalSeconds,
  label: instance.label,
});

export const stripToken = (
  instance: CoolifyInstance,
): StoredCoolifyInstance => ({
  id: instance.id,
  label: instance.label,
  baseUrl: instance.baseUrl,
  instanceType: instance.instanceType,
  refreshIntervalSeconds: instance.refreshIntervalSeconds,
});
