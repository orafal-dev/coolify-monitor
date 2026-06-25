"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { RefreshStatus } from "@/components/layout/refresh-status";
import { WindowDragRegion } from "@/components/layout/window-drag-region";
import { SetupSplash } from "@/components/layout/setup-splash";
import {
  OverviewHealthBanner,
  OverviewStats,
} from "@/components/dashboard/overview-stats";
import { ProjectsView } from "@/components/dashboard/projects-view";
import { ResourceTable } from "@/components/dashboard/resource-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConnectionSettings } from "@/components/settings/connection-settings";
import { AppUpdateSettings } from "@/components/settings/app-update-settings";
import { SettingsErrorBoundary } from "@/components/settings/settings-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import {
  ExternalLinkButton,
  ExternalUrlLinks,
} from "@/components/ui/external-link";
import { Kbd } from "@/components/ui/kbd";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useApp } from "@/hooks/use-app-context";
import { useCoolifyOverview } from "@/hooks/use-coolify";
import {
  createInstanceId,
  getDefaultInstance,
  getInstanceDisplayLabel,
} from "@/lib/coolify/constants";
import {
  mapApplicationRows,
  mapDatabaseRows,
  mapDeploymentRows,
  mapServerRows,
  mapServiceRows,
} from "@/lib/coolify/resource-rows";
import type { CoolifyApiError, CoolifyApplication, CoolifyServer } from "@/lib/coolify/types";
import {
  buildCoolifyResourceUrl,
  parseExternalUrlItems,
} from "@/lib/coolify/urls";

const viewMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

const getApplicationSiteLinks = (app: CoolifyApplication) =>
  parseExternalUrlItems(app.fqdn);

const getApplicationRepoLinks = (app: CoolifyApplication) =>
  parseExternalUrlItems(app.git_repository);

const getApplicationCoolifyUrl = (
  app: CoolifyApplication,
  baseUrl: string,
): string | null =>
  buildCoolifyResourceUrl(baseUrl, "application", {
    projectUuid: app.project_uuid,
    environmentUuid: app.environment_uuid,
    resourceUuid: app.uuid,
  });

const getServerCoolifyUrl = (server: CoolifyServer, baseUrl: string): string | null =>
  buildCoolifyResourceUrl(baseUrl, "server", {
    resourceUuid: server.uuid,
  });

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
    instanceHasStoredToken,
  } = useApp();

  const [createDraft, setCreateDraft] = useState(() =>
    getDefaultInstance({ id: createInstanceId() }, instances),
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (activeView === "create-instance") {
      setCreateDraft(getDefaultInstance({ id: createInstanceId() }, instances));
    }
  }, [activeView, instances]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setCommandPaletteOpen((current) => !current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useCoolifyOverview(activeInstance, isConfigured && !needsSetup);

  const isStale = isError && Boolean(data);
  const isConnectionDown = isError && !data;

  const errorMessage = isConnectionDown
    ? ((error as CoolifyApiError).message ?? "Failed to load Coolify data.")
    : undefined;

  const baseUrl = activeInstance?.baseUrl ?? "";

  const counts = useMemo(
    () => ({
      projects: data?.projects.length ?? 0,
      applications: data?.applications.length ?? 0,
      databases: data?.databases.length ?? 0,
      services: data?.services.length ?? 0,
      servers: data?.servers.length ?? 0,
      deployments: data?.deployments.length ?? 0,
    }),
    [data],
  );

  const applicationRows = useMemo(
    () => mapApplicationRows(data?.applications ?? [], baseUrl),
    [baseUrl, data?.applications],
  );
  const databaseRows = useMemo(
    () => mapDatabaseRows(data?.databases ?? [], baseUrl),
    [baseUrl, data?.databases],
  );
  const serviceRows = useMemo(
    () => mapServiceRows(data?.services ?? [], baseUrl),
    [baseUrl, data?.services],
  );
  const serverRows = useMemo(
    () => mapServerRows(data?.servers ?? [], baseUrl),
    [baseUrl, data?.servers],
  );
  const deploymentRows = useMemo(
    () =>
      mapDeploymentRows(
        data?.deployments ?? [],
        data?.applications ?? [],
        baseUrl,
      ),
    [baseUrl, data?.applications, data?.deployments],
  );

  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center overscroll-none">
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
        <SettingsErrorBoundary>
          <motion.div key="settings" className="space-y-6" {...viewMotion}>
            <ConnectionSettings
              instance={{ ...activeInstance, apiToken: "" }}
              mode="edit"
              existingInstances={instances}
              hasStoredToken={
                Boolean(activeInstance.apiToken.trim()) ||
                instanceHasStoredToken(activeInstance.id)
              }
              onSave={updateInstance}
              onRemove={() => removeInstance(activeInstance.id)}
            />
            <AppUpdateSettings />
          </motion.div>
        </SettingsErrorBoundary>
      );
    }

    switch (activeView) {
      case "overview":
        return (
          <motion.div key="overview" className="space-y-6" {...viewMotion}>
            {isStale ? (
              <Card className="border-warning/30 bg-warning/8">
                <CardPanel className="py-3 text-sm text-warning-foreground">
                  Showing cached data from the last successful refresh. Latest poll
                  failed.
                </CardPanel>
              </Card>
            ) : null}
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
                    {(data?.applications ?? []).slice(0, 5).map((app) => {
                      const siteLinks = getApplicationSiteLinks(app);
                      const repoLinks = getApplicationRepoLinks(app);
                      const coolifyUrl = getApplicationCoolifyUrl(app, baseUrl);

                      return (
                        <div
                          key={app.uuid}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{app.name}</p>
                            <div className="mt-0.5 min-w-0">
                              {siteLinks.length ? (
                                <ExternalUrlLinks
                                  items={siteLinks}
                                  showIcon={false}
                                  linkClassName="text-xs"
                                />
                              ) : repoLinks.length ? (
                                <ExternalUrlLinks
                                  items={repoLinks}
                                  showIcon={false}
                                  linkClassName="text-xs"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">No URL</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={app.status} />
                            {coolifyUrl ? (
                              <ExternalLinkButton
                                href={coolifyUrl}
                                label="Open in Coolify"
                              />
                            ) : null}
                            {siteLinks.map((link) => (
                              <ExternalLinkButton
                                key={link.href}
                                href={link.href}
                                label={`Open ${link.label}`}
                              />
                            ))}
                            {repoLinks.length === 1 ? (
                              <ExternalLinkButton
                                href={repoLinks[0].href}
                                label="Open repository"
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
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
                    {(data?.servers ?? []).slice(0, 5).map((server) => {
                      const coolifyUrl = getServerCoolifyUrl(server, baseUrl);

                      return (
                        <div
                          key={server.uuid}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{server.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {server.ip}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge
                              status={
                                server.is_reachable ? "running:healthy" : "stopped"
                              }
                            />
                            {coolifyUrl ? (
                              <ExternalLinkButton
                                href={coolifyUrl}
                                label="Open in Coolify"
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardPanel>
              </Card>
            </div>
          </motion.div>
        );
      case "projects":
        return (
          <motion.div key="projects" {...viewMotion}>
            <ProjectsView
              overview={data}
              baseUrl={baseUrl}
              isLoading={isLoading}
            />
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
              rows={applicationRows}
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
              rows={databaseRows}
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
              rows={serviceRows}
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
              rows={serverRows}
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
              rows={deploymentRows}
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
      <SidebarInset className="min-w-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-20 flex h-14 min-w-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <WindowDragRegion className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate text-sm font-medium capitalize">{viewTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {getInstanceDisplayLabel(activeInstance)} · {activeInstance.baseUrl}
            </p>
          </WindowDragRegion>
          {isConfigured && activeView !== "create-instance" ? (
            <div className="flex shrink-0 items-center gap-2">
              <RefreshStatus
                dataUpdatedAt={dataUpdatedAt}
                isLoading={isLoading}
                isFetching={isFetching}
                isStale={isStale}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open command palette"
                className="hidden sm:inline-flex"
              >
                Command
                <Kbd className="ms-1">⌘K</Kbd>
              </Button>
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
            </div>
          ) : null}
        </header>

        <main className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-6">
          <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
        </main>
      </SidebarInset>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        overview={data}
        instances={instances}
        activeInstance={activeInstance}
        onNavigate={setActiveView}
        onSwitchInstance={switchInstance}
        onRefresh={() => void refetch()}
      />
    </SidebarProvider>
  );
};
