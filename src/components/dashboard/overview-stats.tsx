"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  DatabaseIcon,
  Rocket01Icon,
  ServerStack01Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Card, CardPanel, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoolifyOverview } from "@/lib/coolify/types";
import { parseCoolifyStatus } from "@/lib/coolify/status";

type OverviewStatsProps = {
  overview?: CoolifyOverview;
  isLoading: boolean;
};

const countHealthy = (items: Array<{ status?: string | null }>): number =>
  items.filter((item) => parseCoolifyStatus(item.status).state === "healthy")
    .length;

const statCards = [
  {
    key: "applications",
    label: "Applications",
    icon: SourceCodeIcon,
    accent: "from-sky-500/20 to-cyan-500/5 text-sky-500",
  },
  {
    key: "databases",
    label: "Databases",
    icon: DatabaseIcon,
    accent: "from-emerald-500/20 to-teal-500/5 text-emerald-500",
  },
  {
    key: "services",
    label: "Services",
    icon: ServerStack01Icon,
    accent: "from-violet-500/20 to-fuchsia-500/5 text-violet-500",
  },
  {
    key: "deployments",
    label: "Active Deployments",
    icon: Rocket01Icon,
    accent: "from-amber-500/20 to-orange-500/5 text-amber-500",
  },
] as const;

export const OverviewStats = ({ overview, isLoading }: OverviewStatsProps) => {
  const totals = {
    applications: overview?.applications.length ?? 0,
    databases: overview?.databases.length ?? 0,
    services: overview?.services.length ?? 0,
    deployments: overview?.deployments.length ?? 0,
  };

  const healthy = {
    applications: countHealthy(overview?.applications ?? []),
    databases: countHealthy(overview?.databases ?? []),
    services: countHealthy(overview?.services ?? []),
    deployments: countHealthy(overview?.deployments ?? []),
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.25 }}
        >
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div
                  className={`rounded-lg bg-gradient-to-br p-2 ${card.accent}`}
                >
                  <HugeiconsIcon icon={card.icon} className="size-4" strokeWidth={2} />
                </div>
              </div>
            </CardHeader>
            <CardPanel>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="space-y-1">
                  <p className="text-3xl font-semibold tracking-tight">
                    {totals[card.key]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {healthy[card.key]} healthy
                  </p>
                </div>
              )}
            </CardPanel>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export const OverviewHealthBanner = ({
  overview,
  isLoading,
  errorMessage,
}: {
  overview?: CoolifyOverview;
  isLoading: boolean;
  errorMessage?: string;
}) => {
  if (errorMessage) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardPanel className="flex items-start gap-3 py-4">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            className="mt-0.5 size-5 text-destructive"
            strokeWidth={2}
          />
          <div>
            <p className="font-medium text-destructive">Connection issue</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </CardPanel>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  return (
    <Card className="border-border/60 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10">
      <CardPanel className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Coolify instance</p>
          <p className="text-lg font-semibold">
            {overview?.health?.status ?? "Operational"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Version</p>
          <p className="font-medium">{overview?.version ?? "Unknown"}</p>
        </div>
      </CardPanel>
    </Card>
  );
};
