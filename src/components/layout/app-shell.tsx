"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SetupSplash } from "@/components/layout/setup-splash";
import {
  OverviewHealthBanner,
  OverviewStats,
} from "@/components/dashboard/overview-stats";
import { ResourceTable } from "@/components/dashboard/resource-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConnectionSettings } from "@/components/settings/connection-settings";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useApp } from "@/hooks/use-app-context";
import { useCoolifyOverview } from "@/hooks/use-coolify";
import { createInstanceId, getDefaultInstance, getInstanceDisplayLabel } from "@/lib/coolify/constants";
import type { CoolifyApiError } from "@/lib/coolify/types";

const viewMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

export const AppShell = () => {
  const {
    activeView,
    setActiveView,
    activeInstance,
    instances,
    isConfigured,
    needsSetup,
    isHydrated,
    addInstance,
    updateInstance,
    removeInstance,
    switchInstance,
    startCreateInstance,
  } = useApp();

  const [createDraft, setCreateDraft] = useState(() =>
    getDefaultInstance({ id: createInstanceId() }, instances),
  );

  useEffect(() => {
    if (activeView === "create-instance") {
      setCreateDraft(getDefaultInstance({ id: createInstanceId() }, instances));
    }
  }, [activeView, instances]);

  const { data, isLoading, isFetching, error, refetch } = useCoolifyOverview(
    activeInstance,
    isConfigured && !needsSetup,
  );

  const errorMessage = error
    ? ((error as CoolifyApiError).message ?? "Failed to load Coolify data.")
    : undefined;

  const counts = useMemo(
    () => ({
      applications: data?.applications.length ?? 0,
      databases: data?.databases.length ?? 0,
      services: data?.services.length ?? 0,
      servers: data?.servers.length ?? 0,
      deployments: data?.deployments.length ?? 0,
    }),
    [data],
  );

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (needsSetup) {
    return <SetupSplash />;
  }

  if (!activeInstance) {
    return <SetupSplash />;
  }

  const renderView = () => {
    if (activeView === "create-instance") {
      return (
        <motion.div key="create-instance" {...viewMotion}>
          <ConnectionSettings
            instance={createDraft}
            mode="create"
            existingInstances={instances}
            onSave={addInstance}
          />
        </motion.div>
      );
    }

    if (activeView === "settings") {
      return (
        <motion.div key="settings" {...viewMotion}>
          <ConnectionSettings
            instance={{ ...activeInstance, apiToken: "" }}
            mode="edit"
            existingInstances={instances}
            hasStoredToken={Boolean(activeInstance.apiToken.trim())}
            onSave={updateInstance}
            onRemove={() => removeInstance(activeInstance.id)}
          />
        </motion.div>
      );
    }

    switch (activeView) {
      case "overview":
        return (
          <motion.div key="overview" className="space-y-6" {...viewMotion}>
            <OverviewHealthBanner
              overview={data}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
            <OverviewStats overview={data} isLoading={isLoading} />
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/60">
                <CardPanel className="space-y-4 py-6">
                  <div>
                    <h3 className="font-semibold">Recent applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Quick snapshot of app health
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(data?.applications ?? []).slice(0, 5).map((app) => (
                      <div
                        key={app.uuid}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{app.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {app.fqdn ?? app.git_repository ?? "No URL"}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                </CardPanel>
              </Card>
              <Card className="border-border/60">
                <CardPanel className="space-y-4 py-6">
                  <div>
                    <h3 className="font-semibold">Server reachability</h3>
                    <p className="text-sm text-muted-foreground">
                      Connected infrastructure nodes
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(data?.servers ?? []).slice(0, 5).map((server) => (
                      <div
                        key={server.uuid}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{server.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {server.ip}
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            server.is_reachable ? "running:healthy" : "stopped"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardPanel>
              </Card>
            </div>
          </motion.div>
        );
      case "applications":
        return (
          <motion.div key="applications" {...viewMotion}>
            <ResourceTable
              title="Applications"
              description="Git-based apps and deployments managed by Coolify."
              isLoading={isLoading}
              emptyTitle="No applications found"
              emptyDescription="Deploy an application in Coolify to see it here."
              rows={(data?.applications ?? []).map((app) => ({
                id: app.uuid,
                name: app.name,
                status: app.status,
                meta: app.fqdn ?? app.git_repository ?? undefined,
                secondary: app.git_branch ?? undefined,
              }))}
            />
          </motion.div>
        );
      case "databases":
        return (
          <motion.div key="databases" {...viewMotion}>
            <ResourceTable
              title="Databases"
              description="Managed database instances and their runtime status."
              isLoading={isLoading}
              emptyTitle="No databases found"
              emptyDescription="Provision a database in Coolify to monitor it here."
              rows={(data?.databases ?? []).map((database) => ({
                id: database.uuid,
                name: database.name,
                status: database.status,
                meta: database.type,
                secondary: database.is_public ? "Public" : "Private",
              }))}
            />
          </motion.div>
        );
      case "services":
        return (
          <motion.div key="services" {...viewMotion}>
            <ResourceTable
              title="Services"
              description="One-click and custom Docker Compose services."
              isLoading={isLoading}
              emptyTitle="No services found"
              emptyDescription="Add a service stack in Coolify to track it here."
              rows={(data?.services ?? []).map((service) => ({
                id: service.uuid,
                name: service.name,
                status: service.status,
                meta: service.description ?? undefined,
              }))}
            />
          </motion.div>
        );
      case "servers":
        return (
          <motion.div key="servers" {...viewMotion}>
            <ResourceTable
              title="Servers"
              description="Hosts connected to your Coolify instance."
              isLoading={isLoading}
              emptyTitle="No servers found"
              emptyDescription="Connect a server in Coolify to monitor reachability."
              rows={(data?.servers ?? []).map((server) => ({
                id: server.uuid,
                name: server.name,
                status: server.is_reachable ? "running:healthy" : "stopped",
                meta: server.ip,
                secondary: server.description ?? undefined,
              }))}
            />
          </motion.div>
        );
      case "deployments":
        return (
          <motion.div key="deployments" {...viewMotion}>
            <ResourceTable
              title="Active deployments"
              description="Currently running deployment jobs across your resources."
              isLoading={isLoading}
              emptyTitle="No active deployments"
              emptyDescription="When Coolify deploys resources, they'll appear here."
              rows={(data?.deployments ?? []).map((deployment) => ({
                id: deployment.uuid,
                name:
                  deployment.application_name ??
                  deployment.application_uuid ??
                  deployment.uuid,
                status: deployment.status,
                meta: deployment.deployment_url ?? undefined,
                updatedAt: deployment.updated_at ?? deployment.created_at,
              }))}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const viewTitle =
    activeView === "create-instance"
      ? "Add instance"
      : activeView.replace("-", " ");

  return (
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        counts={counts}
        instances={instances}
        activeInstance={activeInstance}
        onSwitchInstance={switchInstance}
        onCreateInstance={startCreateInstance}
        connectionIssue={errorMessage}
      />
      <SidebarInset className="bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium capitalize">{viewTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {getInstanceDisplayLabel(activeInstance)} · {activeInstance.baseUrl}
            </p>
          </div>
          {isConfigured && activeView !== "create-instance" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh Coolify data"
            >
              {isFetching ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
              )}
              Refresh
            </Button>
          ) : null}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
