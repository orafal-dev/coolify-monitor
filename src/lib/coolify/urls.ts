import type { ExternalUrlItem } from "@/lib/coolify/urls.types";
import { normalizeBaseUrl } from "@/lib/coolify/constants";

export type CoolifyResourceType =
  | "application"
  | "database"
  | "service"
  | "server"
  | "deployment"
  | "project";

export type CoolifyResourceIds = {
  projectUuid?: string | null;
  environmentUuid?: string | null;
  resourceUuid: string;
  applicationUuid?: string | null;
};

export const normalizeExternalUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const isUrlLike = (value?: string | null): boolean => {
  if (!value?.trim()) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.includes(",")) {
    return splitUrlCandidates(trimmed).some((candidate) => isUrlLike(candidate));
  }

  return (
    /^https?:\/\//i.test(trimmed) ||
    /^[\w.-]+\.[a-z]{2,}/i.test(trimmed) ||
    trimmed.includes("github.com") ||
    trimmed.includes("gitlab.com") ||
    trimmed.includes("bitbucket.org")
  );
};

export const splitUrlCandidates = (value: string): string[] =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export const getExternalUrlLabel = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
};

export const parseExternalUrlList = (value?: string | null): string[] => {
  if (!value?.trim()) {
    return [];
  }

  return splitUrlCandidates(value)
    .filter((candidate) => isUrlLike(candidate))
    .map((candidate) => normalizeExternalUrl(candidate));
};

export const parseExternalUrlItems = (value?: string | null): ExternalUrlItem[] =>
  parseExternalUrlList(value).map((href) => ({
    href,
    label: getExternalUrlLabel(href),
  }));

export const formatExternalUrlList = (value?: string | null): string | undefined => {
  const labels = parseExternalUrlItems(value).map((item) => item.label);
  if (!labels.length) {
    return undefined;
  }

  return labels.join(", ");
};

export type { ExternalUrlItem } from "@/lib/coolify/urls.types";

export const buildCoolifyResourceUrl = (
  baseUrl: string,
  type: CoolifyResourceType,
  ids: CoolifyResourceIds,
): string | null => {
  const root = normalizeBaseUrl(baseUrl);

  if (type === "server") {
    return `${root}/server/${ids.resourceUuid}`;
  }

  if (type === "project") {
    return `${root}/project/${ids.resourceUuid}`;
  }

  const projectUuid = ids.projectUuid?.trim();
  const environmentUuid = ids.environmentUuid?.trim();

  if (!projectUuid || !environmentUuid) {
    return null;
  }

  const envPath = `${root}/project/${projectUuid}/environment/${environmentUuid}`;

  switch (type) {
    case "application":
      return `${envPath}/application/${ids.resourceUuid}`;
    case "database":
      return `${envPath}/database/${ids.resourceUuid}`;
    case "service":
      return `${envPath}/service/${ids.resourceUuid}`;
    case "deployment": {
      const applicationUuid = ids.applicationUuid?.trim();
      if (!applicationUuid) {
        return null;
      }

      return `${envPath}/application/${applicationUuid}/deployment/${ids.resourceUuid}`;
    }
    default:
      return null;
  }
};
