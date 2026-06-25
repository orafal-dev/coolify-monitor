import type {
  CoolifyEnvironmentRef,
  EnvironmentIndex,
  EnvironmentIndexEntry,
  NestedCoolifyEnvironment,
} from "@/lib/coolify/normalize-resources.types";
import type {
  CoolifyApplication,
  CoolifyDatabase,
  CoolifyOverview,
  CoolifyProject,
  CoolifyService,
} from "@/lib/coolify/types";

type ResourceWithEnvironment = {
  environment_id?: number | null;
  project_uuid?: string | null;
  environment_uuid?: string | null;
  environment_name?: string | null;
  environment?: NestedCoolifyEnvironment | null;
};

export const buildEnvironmentIndex = (
  projects: CoolifyProject[],
  projectEnvironments: CoolifyEnvironmentRef[][],
): EnvironmentIndex => {
  const index: EnvironmentIndex = new Map();

  projects.forEach((project, projectIndex) => {
    const environments = projectEnvironments[projectIndex] ?? [];

    for (const environment of environments) {
      index.set(environment.id, {
        projectUuid: project.uuid,
        projectName: project.name,
        environmentUuid: environment.uuid,
        environmentName: environment.name,
      });
    }
  });

  return index;
};

const resolveFromNestedEnvironment = (
  resource: ResourceWithEnvironment,
): EnvironmentIndexEntry | null => {
  const environment = resource.environment;
  const projectUuid = environment?.project?.uuid?.trim();

  if (!projectUuid || !environment?.uuid?.trim()) {
    return null;
  }

  return {
    projectUuid,
    projectName: environment.project?.name?.trim() || "Unknown project",
    environmentUuid: environment.uuid.trim(),
    environmentName: environment.name?.trim() || "Default",
  };
};

const resolveEnvironmentContext = (
  resource: ResourceWithEnvironment,
  environmentIndex: EnvironmentIndex,
): EnvironmentIndexEntry | null => {
  if (resource.project_uuid?.trim() && resource.environment_uuid?.trim()) {
    return {
      projectUuid: resource.project_uuid.trim(),
      projectName: "Unknown project",
      environmentUuid: resource.environment_uuid.trim(),
      environmentName: resource.environment_name?.trim() || "Default",
    };
  }

  const nested = resolveFromNestedEnvironment(resource);
  if (nested) {
    return nested;
  }

  if (resource.environment_id == null) {
    return null;
  }

  return environmentIndex.get(resource.environment_id) ?? null;
};

const enrichResource = <T extends ResourceWithEnvironment>(
  resource: T,
  environmentIndex: EnvironmentIndex,
): T => {
  const context = resolveEnvironmentContext(resource, environmentIndex);
  if (!context) {
    return resource;
  }

  return {
    ...resource,
    project_uuid: context.projectUuid,
    environment_uuid: context.environmentUuid,
    environment_name: context.environmentName,
  };
};

export const normalizeOverviewResources = (
  overview: Omit<CoolifyOverview, "applications" | "databases" | "services"> & {
    applications: CoolifyApplication[];
    databases: CoolifyDatabase[];
    services: CoolifyService[];
  },
  environmentIndex: EnvironmentIndex,
): Pick<CoolifyOverview, "applications" | "databases" | "services"> => ({
  applications: overview.applications.map((application) =>
    enrichResource(application, environmentIndex),
  ),
  databases: overview.databases.map((database) =>
    enrichResource(database, environmentIndex),
  ),
  services: overview.services.map((service) => enrichResource(service, environmentIndex)),
});
