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

const extractDeploymentList = (data: unknown): RawCoolifyDeployment[] => {
  if (Array.isArray(data)) {
    return data as RawCoolifyDeployment[];
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.deployments)) {
      return record.deployments as RawCoolifyDeployment[];
    }

    if (Array.isArray(record.data)) {
      return record.data as RawCoolifyDeployment[];
    }
  }

  return [];
};

const normalizeDeployment = (
  deployment: RawCoolifyDeployment,
): CoolifyDeployment | null => {
  const uuid = (deployment.uuid ?? deployment.deployment_uuid)?.trim();
  if (!uuid) {
    return null;
  }

  return {
    uuid,
    status: deployment.status?.trim() || "unknown",
    application_name: deployment.application_name ?? null,
    application_uuid:
      deployment.application_uuid ?? deployment.application_id ?? null,
    deployment_url: deployment.deployment_url ?? null,
    created_at: deployment.created_at ?? null,
    updated_at: deployment.updated_at ?? null,
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
