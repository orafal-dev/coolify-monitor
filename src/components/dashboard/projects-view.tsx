"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardPanel } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLinkButton,
  ExternalUrlLinks,
} from "@/components/ui/external-link";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoolifyOverview } from "@/lib/coolify/types";
import { groupResourcesByProject } from "@/lib/coolify/projects";
import type { ProjectResourceItem } from "@/lib/coolify/projects";
import { getStatusDotClass } from "@/lib/coolify/status";
import {
  buildCoolifyResourceUrl,
  parseExternalUrlItems,
} from "@/lib/coolify/urls";
import { cn } from "@/lib/utils";

type ProjectsViewProps = {
  overview?: CoolifyOverview;
  baseUrl: string;
  isLoading: boolean;
};

const KIND_LABELS: Record<ProjectResourceItem["kind"], string> = {
  application: "App",
  database: "DB",
  service: "Service",
};

const getResourceCoolifyUrl = (
  baseUrl: string,
  resource: ProjectResourceItem,
): string | null =>
  buildCoolifyResourceUrl(baseUrl, resource.kind, {
    projectUuid: resource.projectUuid,
    environmentUuid: resource.environmentUuid,
    resourceUuid: resource.id,
  });

const ProjectResourceRow = ({
  resource,
  baseUrl,
}: {
  resource: ProjectResourceItem;
  baseUrl: string;
}) => {
  const coolifyUrl = getResourceCoolifyUrl(baseUrl, resource);
  const siteLinks = resource.siteLinks ?? [];
  const repoLinks = parseExternalUrlItems(resource.gitRepository);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
            {KIND_LABELS[resource.kind]}
          </Badge>
          <p className="truncate font-medium">{resource.name}</p>
        </div>
        <div className="mt-1 min-w-0">
          {siteLinks.length ? (
            <ExternalUrlLinks items={siteLinks} showIcon={false} className="text-xs" />
          ) : null}
          {repoLinks.length ? (
            <ExternalUrlLinks items={repoLinks} showIcon={false} className="text-xs" />
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={resource.status} />
        {coolifyUrl ? (
          <ExternalLinkButton href={coolifyUrl} label="Open in Coolify" />
        ) : null}
        {siteLinks.map((link) => (
          <ExternalLinkButton
            key={link.href}
            href={link.href}
            label={`Open ${link.label}`}
          />
        ))}
        {repoLinks.length === 1 ? (
          <ExternalLinkButton href={repoLinks[0].href} label="Open repository" />
        ) : null}
      </div>
    </div>
  );
};

export const ProjectsView = ({ overview, baseUrl, isLoading }: ProjectsViewProps) => {
  const projectGroups = useMemo(
    () => groupResourcesByProject(overview),
    [overview],
  );

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardPanel className="space-y-3 py-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardPanel>
      </Card>
    );
  }

  if (!projectGroups.length) {
    return (
      <Card className="border-border/60">
        <CardPanel className="py-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No projects found</EmptyTitle>
              <EmptyDescription>
                Create a project in Coolify to organize applications, databases, and services.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardPanel>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">
          Resources grouped by Coolify project and environment.
        </p>
      </div>

      <Accordion
        multiple
        defaultValue={projectGroups.slice(0, 2).map((group) => group.key)}
        className="space-y-3"
      >
        {projectGroups.map((project) => (
          <Card key={project.key} className="overflow-hidden border-border/60">
            <AccordionItem value={project.key} className="border-0">
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      getStatusDotClass(project.worstStatus),
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.resourceCount} resources · {project.environments.length}{" "}
                      {project.environments.length === 1 ? "environment" : "environments"}
                      {project.issueCount > 0
                        ? ` · ${project.issueCount} need attention`
                        : ""}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {project.environments.map((environment) => (
                    <div key={environment.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{environment.label}</p>
                        {environment.issueCount > 0 ? (
                          <Badge variant="warning" className="text-xs">
                            {environment.issueCount} issues
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        {environment.resources.map((resource) => (
                          <ProjectResourceRow
                            key={`${resource.kind}-${resource.id}`}
                            resource={resource}
                            baseUrl={baseUrl}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </motion.div>
  );
};
