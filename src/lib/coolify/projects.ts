import type {
  CoolifyApplication,
  CoolifyDatabase,
  CoolifyOverview,
  CoolifyService,
  ParsedStatus,
} from "@/lib/coolify/types";
import { getWorstStatus, parseCoolifyStatus } from "@/lib/coolify/status";
import { parseExternalUrlItems } from "@/lib/coolify/urls";
import type { ExternalUrlItem } from "@/lib/coolify/urls.types";

export const UNASSIGNED_PROJECT_KEY = "__unassigned__";

export type ProjectResourceKind = "application" | "database" | "service";

export type ProjectResourceItem = {
  id: string;
  kind: ProjectResourceKind;
  name: string;
  status: string;
  projectUuid: string | null;
  environmentUuid: string | null;
  environmentName: string | null;
  coolifyUrl?: string | null;
  siteLinks?: ExternalUrlItem[];
  gitRepository?: string | null;
};

export type ProjectEnvironmentGroup = {
  key: string;
  label: string;
  resources: ProjectResourceItem[];
  worstStatus: ParsedStatus["state"];
  issueCount: number;
};

export type ProjectGroup = {
  key: string;
  uuid: string | null;
  name: string;
  environments: ProjectEnvironmentGroup[];
  resourceCount: number;
  worstStatus: ParsedStatus["state"];
  issueCount: number;
};

const isIssueStatus = (status?: string | null): boolean => {
  const state = parseCoolifyStatus(status).state;
  return state === "error" || state === "warning" || state === "stopped";
};

const getEnvironmentKey = (
  environmentUuid?: string | null,
  environmentName?: string | null,
): string => environmentUuid?.trim() || environmentName?.trim() || "default";

const getEnvironmentLabel = (
  environmentUuid?: string | null,
  environmentName?: string | null,
): string => environmentName?.trim() || environmentUuid?.trim() || "Default";

const toApplicationItem = (app: CoolifyApplication): ProjectResourceItem => ({
  id: app.uuid,
  kind: "application",
  name: app.name,
  status: app.status,
  projectUuid: app.project_uuid ?? null,
  environmentUuid: app.environment_uuid ?? null,
  environmentName: app.environment_name ?? null,
  siteLinks: parseExternalUrlItems(app.fqdn),
  gitRepository: app.git_repository ?? null,
});

const toDatabaseItem = (database: CoolifyDatabase): ProjectResourceItem => ({
  id: database.uuid,
  kind: "database",
  name: database.name,
  status: database.status,
  projectUuid: database.project_uuid ?? null,
  environmentUuid: database.environment_uuid ?? null,
  environmentName: database.environment_name ?? null,
});

const toServiceItem = (service: CoolifyService): ProjectResourceItem => ({
  id: service.uuid,
  kind: "service",
  name: service.name,
  status: service.status,
  projectUuid: service.project_uuid ?? null,
  environmentUuid: service.environment_uuid ?? null,
  environmentName: service.environment_name ?? null,
  siteLinks: parseExternalUrlItems(service.fqdn),
});

const finalizeEnvironmentGroup = (
  key: string,
  label: string,
  resources: ProjectResourceItem[],
): ProjectEnvironmentGroup => {
  const issueCount = resources.filter((resource) => isIssueStatus(resource.status)).length;

  return {
    key,
    label,
    resources,
    issueCount,
    worstStatus: getWorstStatus(resources.map((resource) => resource.status)),
  };
};

const finalizeProjectGroup = (
  key: string,
  uuid: string | null,
  name: string,
  environments: ProjectEnvironmentGroup[],
): ProjectGroup => {
  const resourceCount = environments.reduce(
    (total, environment) => total + environment.resources.length,
    0,
  );
  const issueCount = environments.reduce(
    (total, environment) => total + environment.issueCount,
    0,
  );

  return {
    key,
    uuid,
    name,
    environments,
    resourceCount,
    issueCount,
    worstStatus: getWorstStatus(
      environments.flatMap((environment) =>
        environment.resources.map((resource) => resource.status),
      ),
    ),
  };
};

export const groupResourcesByProject = (overview?: CoolifyOverview): ProjectGroup[] => {
  if (!overview) {
    return [];
  }

  const projectNames = new Map(
    overview.projects.map((project) => [project.uuid, project.name]),
  );

  const resources: ProjectResourceItem[] = [
    ...overview.applications.map(toApplicationItem),
    ...overview.databases.map(toDatabaseItem),
    ...overview.services.map(toServiceItem),
  ];

  const projectMap = new Map<string, Map<string, ProjectResourceItem[]>>();

  for (const resource of resources) {
    const projectKey = resource.projectUuid?.trim() || UNASSIGNED_PROJECT_KEY;
    const environmentKey = getEnvironmentKey(
      resource.environmentUuid,
      resource.environmentName,
    );

    if (!projectMap.has(projectKey)) {
      projectMap.set(projectKey, new Map());
    }

    const environmentMap = projectMap.get(projectKey)!;
    if (!environmentMap.has(environmentKey)) {
      environmentMap.set(environmentKey, []);
    }

    environmentMap.get(environmentKey)!.push(resource);
  }

  const groups: ProjectGroup[] = [];

  for (const project of overview.projects) {
    const environmentMap = projectMap.get(project.uuid);
    if (!environmentMap?.size) {
      continue;
    }

    const environments = [...environmentMap.entries()]
      .map(([environmentKey, environmentResources]) => {
        const sample = environmentResources[0];
        return finalizeEnvironmentGroup(
          environmentKey,
          getEnvironmentLabel(sample?.environmentUuid, sample?.environmentName),
          environmentResources.sort((left, right) => left.name.localeCompare(right.name)),
        );
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    groups.push(finalizeProjectGroup(project.uuid, project.uuid, project.name, environments));
    projectMap.delete(project.uuid);
  }

  for (const [projectKey, environmentMap] of projectMap.entries()) {
    if (!environmentMap.size) {
      continue;
    }

    const projectName =
      projectKey === UNASSIGNED_PROJECT_KEY
        ? "Unassigned"
        : (projectNames.get(projectKey) ?? "Unknown project");

    const environments = [...environmentMap.entries()]
      .map(([environmentKey, environmentResources]) => {
        const sample = environmentResources[0];
        return finalizeEnvironmentGroup(
          environmentKey,
          getEnvironmentLabel(sample?.environmentUuid, sample?.environmentName),
          environmentResources.sort((left, right) => left.name.localeCompare(right.name)),
        );
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    groups.push(
      finalizeProjectGroup(
        projectKey,
        projectKey === UNASSIGNED_PROJECT_KEY ? null : projectKey,
        projectName,
        environments,
      ),
    );
  }

  return groups.sort((left, right) => {
    if (left.key === UNASSIGNED_PROJECT_KEY) {
      return 1;
    }

    if (right.key === UNASSIGNED_PROJECT_KEY) {
      return -1;
    }

    return left.name.localeCompare(right.name);
  });
};
