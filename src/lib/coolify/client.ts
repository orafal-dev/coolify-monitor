import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  buildApiUrl,
  type CoolifyInstance,
  toConnection,
} from "@/lib/coolify/constants";
import {
  buildEnvironmentIndex,
  normalizeOverviewResources,
} from "@/lib/coolify/normalize-resources";
import type { CoolifyEnvironmentRef } from "@/lib/coolify/normalize-resources.types";
import {
  parseCoolifyDeployments,
  parseCoolifyHealth,
  parseCoolifyVersion,
  parseResponseBody,
} from "@/lib/coolify/parse-response";
import type {
  CoolifyApiError,
  CoolifyApplication,
  CoolifyDatabase,
  CoolifyHealth,
  CoolifyOverview,
  CoolifyProject,
  CoolifyServer,
  CoolifyService,
} from "@/lib/coolify/types";

const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const request = async <T>(
  instance: CoolifyInstance,
  path: string,
): Promise<T> => {
  const connection = toConnection(instance);
  const url = buildApiUrl(connection.baseUrl, path);
  const headers = {
    Accept: "application/json, text/plain, */*",
    Authorization: `Bearer ${connection.apiToken}`,
  };

  const response = isTauriRuntime()
    ? await tauriFetch(url, { method: "GET", headers })
    : await fetch(url, { method: "GET", headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = await parseResponseBody<unknown>(response);
      if (payload && typeof payload === "object" && "message" in payload) {
        message = String((payload as { message?: string }).message);
      } else if (typeof payload === "string" && payload.trim()) {
        message = payload.trim();
      }
    } catch {
      // Ignore parse errors for non-JSON responses.
    }

    const error: CoolifyApiError = {
      message,
      status: response.status,
    };
    throw error;
  }

  return parseResponseBody<T>(response);
};

export const validateConnection = async (
  instance: CoolifyInstance,
): Promise<{ version?: string; health?: CoolifyHealth }> => {
  const [versionResult, healthResult] = await Promise.allSettled([
    request<unknown>(instance, "/version"),
    request<unknown>(instance, "/health"),
  ]);

  if (versionResult.status === "rejected" && healthResult.status === "rejected") {
    throw versionResult.reason as CoolifyApiError;
  }

  return {
    version:
      versionResult.status === "fulfilled"
        ? parseCoolifyVersion(versionResult.value)
        : undefined,
    health:
      healthResult.status === "fulfilled"
        ? parseCoolifyHealth(healthResult.value)
        : undefined,
  };
};

export const fetchOverview = async (
  instance: CoolifyInstance,
): Promise<CoolifyOverview> => {
  const [
    applicationsResult,
    databasesResult,
    servicesResult,
    serversResult,
    projectsResult,
    deploymentsResult,
    versionResult,
    healthResult,
  ] = await Promise.allSettled([
    request<CoolifyApplication[]>(instance, "/applications"),
    request<CoolifyDatabase[]>(instance, "/databases"),
    request<CoolifyService[]>(instance, "/services"),
    request<CoolifyServer[]>(instance, "/servers"),
    request<CoolifyProject[]>(instance, "/projects"),
    request<unknown>(instance, "/deployments"),
    request<unknown>(instance, "/version"),
    request<unknown>(instance, "/health"),
  ]);

  const unwrap = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;

  const applications = unwrap(applicationsResult, []);
  const databases = unwrap(databasesResult, []);
  const services = unwrap(servicesResult, []);
  const servers = unwrap(serversResult, []);
  const projects = unwrap(projectsResult, []);
  const deployments = parseCoolifyDeployments(
    unwrap(deploymentsResult, [] as unknown),
  );

  const criticalFailures = [
    applicationsResult,
    databasesResult,
    servicesResult,
    serversResult,
    projectsResult,
  ].filter((result) => result.status === "rejected");

  if (criticalFailures.length === 5) {
    throw (criticalFailures[0] as PromiseRejectedResult)
      .reason as CoolifyApiError;
  }

  const environmentResults = await Promise.allSettled(
    projects.map((project) =>
      request<CoolifyEnvironmentRef[]>(instance, `/projects/${project.uuid}/environments`),
    ),
  );

  const projectEnvironments = environmentResults.map((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const environmentIndex = buildEnvironmentIndex(projects, projectEnvironments);
  const normalizedResources = normalizeOverviewResources(
    { applications, databases, services, projects, servers, deployments },
    environmentIndex,
  );

  return {
    applications: normalizedResources.applications,
    databases: normalizedResources.databases,
    services: normalizedResources.services,
    servers,
    projects,
    deployments,
    version:
      versionResult.status === "fulfilled"
        ? parseCoolifyVersion(versionResult.value)
        : undefined,
    health:
      healthResult.status === "fulfilled"
        ? parseCoolifyHealth(healthResult.value)
        : undefined,
  };
};
