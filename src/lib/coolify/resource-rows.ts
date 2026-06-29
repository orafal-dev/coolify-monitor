import type { ResourceRow } from "@/components/dashboard/resource-table.types";
import type {
  CoolifyApplication,
  CoolifyDatabase,
  CoolifyDeployment,
  CoolifyServer,
  CoolifyService,
} from "@/lib/coolify/types";
import {
  buildCoolifyResourceUrl,
  formatExternalUrlList,
  getExternalUrlLabel,
  parseExternalUrlItems,
} from "@/lib/coolify/urls";

const buildApplicationRow = (
  app: CoolifyApplication,
  baseUrl: string,
): ResourceRow => {
  const coolifyUrl = buildCoolifyResourceUrl(baseUrl, "application", {
    projectUuid: app.project_uuid,
    environmentUuid: app.environment_uuid,
    resourceUuid: app.uuid,
  });
  const siteLinks = parseExternalUrlItems(app.fqdn);
  const siteUrls = siteLinks.map((item) => item.href);
  const repoLinks = parseExternalUrlItems(app.git_repository);
  const metaLinks = siteLinks.length ? siteLinks : repoLinks;

  return {
    id: app.uuid,
    name: app.name,
    status: app.status,
    meta: formatExternalUrlList(app.fqdn) ?? app.git_repository ?? undefined,
    metaLinks: metaLinks.length ? metaLinks : undefined,
    secondary: app.git_branch ?? app.environment_name ?? undefined,
    coolifyUrl: coolifyUrl ?? undefined,
    links: [
      ...siteUrls.map((url) => ({
        label: `Open ${getExternalUrlLabel(url)}`,
        url,
        variant: "site" as const,
      })),
      ...repoLinks.map((item) => ({
        label: "Open repository",
        url: item.href,
        variant: "repo" as const,
      })),
    ],
  };
};

const buildDatabaseRow = (
  database: CoolifyDatabase,
  baseUrl: string,
): ResourceRow => ({
  id: database.uuid,
  name: database.name,
  status: database.status,
  meta: database.type,
  secondary: database.is_public ? "Public" : "Private",
  coolifyUrl:
    buildCoolifyResourceUrl(baseUrl, "database", {
      projectUuid: database.project_uuid,
      environmentUuid: database.environment_uuid,
      resourceUuid: database.uuid,
    }) ?? undefined,
});

const buildServiceRow = (service: CoolifyService, baseUrl: string): ResourceRow => {
  const siteLinks = parseExternalUrlItems(service.fqdn);

  return {
    id: service.uuid,
    name: service.name,
    status: service.status,
    meta: formatExternalUrlList(service.fqdn) ?? service.description ?? undefined,
    metaLinks: siteLinks.length ? siteLinks : undefined,
    secondary: service.environment_name ?? undefined,
    coolifyUrl:
      buildCoolifyResourceUrl(baseUrl, "service", {
        projectUuid: service.project_uuid,
        environmentUuid: service.environment_uuid,
        resourceUuid: service.uuid,
      }) ?? undefined,
    links: siteLinks.map((item) => ({
      label: `Open ${item.label}`,
      url: item.href,
      variant: "site" as const,
    })),
  };
};

const buildServerRow = (server: CoolifyServer, baseUrl: string): ResourceRow => ({
  id: server.uuid,
  name: server.name,
  status: server.is_reachable ? "running:healthy" : "stopped",
  meta: server.ip,
  secondary: server.description ?? undefined,
  coolifyUrl:
    buildCoolifyResourceUrl(baseUrl, "server", {
      resourceUuid: server.uuid,
    }) ?? undefined,
});

const buildDeploymentRow = (
  deployment: CoolifyDeployment,
  baseUrl: string,
  applications: CoolifyApplication[],
): ResourceRow => {
  const application =
    applications.find((app) => app.uuid === deployment.application_uuid) ??
    applications.find((app) => app.name === deployment.application_name);
  const deploymentLinks = parseExternalUrlItems(deployment.deployment_url);

  return {
    id: deployment.uuid,
    name:
      deployment.application_name ??
      deployment.application_uuid ??
      deployment.uuid,
    status: deployment.status,
    meta: formatExternalUrlList(deployment.deployment_url) ?? undefined,
    metaLinks: deploymentLinks.length ? deploymentLinks : undefined,
    updatedAt: deployment.updated_at ?? deployment.created_at,
    coolifyUrl:
      buildCoolifyResourceUrl(baseUrl, "deployment", {
        projectUuid: application?.project_uuid,
        environmentUuid: application?.environment_uuid,
        resourceUuid: deployment.uuid,
        applicationUuid: deployment.application_uuid,
      }) ?? undefined,
    links: deploymentLinks.map((item) => ({
      label: `Open ${item.label}`,
      url: item.href,
      variant: "site" as const,
    })),
  };
};

export const mapApplicationRows = (
  applications: CoolifyApplication[],
  baseUrl: string,
): ResourceRow[] => applications.map((app) => buildApplicationRow(app, baseUrl));

export const mapDatabaseRows = (
  databases: CoolifyDatabase[],
  baseUrl: string,
): ResourceRow[] => databases.map((database) => buildDatabaseRow(database, baseUrl));

export const mapServiceRows = (
  services: CoolifyService[],
  baseUrl: string,
): ResourceRow[] => services.map((service) => buildServiceRow(service, baseUrl));

export const mapServerRows = (
  servers: CoolifyServer[],
  baseUrl: string,
): ResourceRow[] => servers.map((server) => buildServerRow(server, baseUrl));

export const mapDeploymentRows = (
  deployments: CoolifyDeployment[],
  applications: CoolifyApplication[],
  baseUrl: string,
): ResourceRow[] =>
  deployments.map((deployment) =>
    buildDeploymentRow(deployment, baseUrl, applications),
  );
