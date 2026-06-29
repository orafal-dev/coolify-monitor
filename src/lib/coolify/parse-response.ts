import type { RawCoolifyDeployment } from "@/lib/coolify/parse-response.types";
import type {
  CoolifyDeployment,
  CoolifyHealth,
  CoolifyVersion,
} from "@/lib/coolify/types";

export const parseResponseBody = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeJson =
    contentType.includes("application/json") ||
    text.trimStart().startsWith("{") ||
    text.trimStart().startsWith("[");

  if (looksLikeJson) {
    return JSON.parse(text) as T;
  }

  return text as T;
};

export const parseCoolifyVersion = (data: unknown): string | undefined => {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || undefined;
  }

  if (data && typeof data === "object" && "version" in data) {
    const version = (data as CoolifyVersion).version;
    return typeof version === "string" && version.trim() ? version.trim() : undefined;
  }

  return undefined;
};

const readString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const isDeploymentLike = (value: unknown): value is RawCoolifyDeployment =>
  value != null &&
  typeof value === "object" &&
  ("deployment_uuid" in value ||
    "application_name" in value ||
    "status" in value ||
    "application_id" in value);

const toDeploymentList = (value: unknown): RawCoolifyDeployment[] => {
  if (Array.isArray(value)) {
    return value as RawCoolifyDeployment[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (isDeploymentLike(value)) {
    return [value];
  }

  const values = Object.values(value as Record<string, unknown>);
  if (values.length > 0 && values.every(isDeploymentLike)) {
    return values as RawCoolifyDeployment[];
  }

  return [];
};

const extractDeploymentList = (data: unknown): RawCoolifyDeployment[] => {
  if (Array.isArray(data)) {
    return data as RawCoolifyDeployment[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;

  if ("deployments" in record) {
    return toDeploymentList(record.deployments);
  }

  if ("data" in record) {
    return toDeploymentList(record.data);
  }

  return toDeploymentList(data);
};

const normalizeDeployment = (
  deployment: RawCoolifyDeployment,
): CoolifyDeployment | null => {
  const uuid =
    readString(deployment.uuid) ??
    readString(deployment.deployment_uuid) ??
    readString(deployment.id);

  if (!uuid) {
    return null;
  }

  return {
    uuid,
    status: readString(deployment.status) ?? "unknown",
    application_name: readString(deployment.application_name),
    application_uuid:
      readString(deployment.application_uuid) ??
      readString(deployment.application_id),
    deployment_url: readString(deployment.deployment_url),
    created_at: readString(deployment.created_at),
    updated_at: readString(deployment.updated_at),
  };
};

export const parseCoolifyDeployments = (data: unknown): CoolifyDeployment[] =>
  extractDeploymentList(data)
    .map((deployment) => normalizeDeployment(deployment))
    .filter((deployment): deployment is CoolifyDeployment => deployment !== null);

export const parseCoolifyHealth = (data: unknown): CoolifyHealth | undefined => {
  if (typeof data === "string") {
    const status = data.trim();
    return status ? { status } : undefined;
  }

  if (data && typeof data === "object") {
    return data as CoolifyHealth;
  }

  return undefined;
};
