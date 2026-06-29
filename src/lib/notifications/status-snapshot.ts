import { parseCoolifyStatus } from "@/lib/coolify/status";
import type {
  BuildStatusSnapshotInput,
  StatusChangeEvent,
  StatusSnapshot,
} from "@/lib/notifications/status-snapshot.types";

const isErrorState = (status: string): boolean =>
  parseCoolifyStatus(status).state === "error";

const wasNotErrorState = (status: string): boolean => !isErrorState(status);

export const buildStatusSnapshot = (
  overview: BuildStatusSnapshotInput,
): StatusSnapshot => {
  const applications = new Map<string, { name: string; status: string }>();
  for (const app of overview.applications) {
    applications.set(app.uuid, { name: app.name, status: app.status });
  }

  const deployments = new Map<string, { name: string; status: string }>();
  for (const deployment of overview.deployments) {
    deployments.set(deployment.uuid, {
      name:
        deployment.application_name ??
        deployment.application_uuid ??
        deployment.uuid,
      status: deployment.status,
    });
  }

  const servers = new Map<string, { name: string; reachable: boolean }>();
  for (const server of overview.servers) {
    servers.set(server.uuid, {
      name: server.name,
      reachable: Boolean(server.is_reachable),
    });
  }

  return { applications, deployments, servers };
};

export const detectStatusChanges = (
  previous: StatusSnapshot,
  next: StatusSnapshot,
  instanceLabel: string,
): StatusChangeEvent[] => {
  const events: StatusChangeEvent[] = [];

  for (const [resourceId, nextApp] of next.applications) {
    const prevApp = previous.applications.get(resourceId);
    if (!prevApp) {
      continue;
    }

    if (wasNotErrorState(prevApp.status) && isErrorState(nextApp.status)) {
      events.push({
        category: "application",
        resourceId,
        resourceName: nextApp.name,
        previousValue: prevApp.status,
        currentValue: nextApp.status,
        instanceLabel,
      });
    }
  }

  for (const [resourceId, nextDeployment] of next.deployments) {
    const prevDeployment = previous.deployments.get(resourceId);
    if (!prevDeployment) {
      if (isErrorState(nextDeployment.status)) {
        events.push({
          category: "deployment",
          resourceId,
          resourceName: nextDeployment.name,
          previousValue: "unknown",
          currentValue: nextDeployment.status,
          instanceLabel,
        });
      }
      continue;
    }

    if (
      wasNotErrorState(prevDeployment.status) &&
      isErrorState(nextDeployment.status)
    ) {
      events.push({
        category: "deployment",
        resourceId,
        resourceName: nextDeployment.name,
        previousValue: prevDeployment.status,
        currentValue: nextDeployment.status,
        instanceLabel,
      });
    }
  }

  for (const [resourceId, nextServer] of next.servers) {
    const prevServer = previous.servers.get(resourceId);
    if (!prevServer) {
      continue;
    }

    if (prevServer.reachable && !nextServer.reachable) {
      events.push({
        category: "server",
        resourceId,
        resourceName: nextServer.name,
        previousValue: "reachable",
        currentValue: "unreachable",
        instanceLabel,
      });
    }
  }

  return events;
};

export const formatStatusChangeNotification = (
  event: StatusChangeEvent,
): { title: string; body: string } => {
  switch (event.category) {
    case "application":
      return {
        title: `${event.instanceLabel} — Application unhealthy`,
        body: `${event.resourceName} is now unhealthy (${event.currentValue})`,
      };
    case "deployment":
      return {
        title: `${event.instanceLabel} — Deployment failed`,
        body: `${event.resourceName} deployment failed (${event.currentValue})`,
      };
    case "server":
      return {
        title: `${event.instanceLabel} — Server unreachable`,
        body: `${event.resourceName} is no longer reachable`,
      };
    default:
      return {
        title: event.instanceLabel,
        body: event.resourceName,
      };
  }
};
