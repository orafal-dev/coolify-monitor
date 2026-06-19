"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Moon02Icon,
  Rocket01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { ConnectionSettings } from "@/components/settings/connection-settings";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getDefaultInstance } from "@/lib/coolify/constants";
import { useApp } from "@/hooks/use-app-context";

export const SetupSplash = () => {
  const { isHydrated, addInstance } = useApp();
  const { theme, setTheme } = useTheme();

  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500/15 via-background to-cyan-500/10 px-4 py-4 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_35%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 grid w-full max-w-4xl grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10"
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25 sm:size-14 sm:rounded-2xl">
            <HugeiconsIcon
              icon={Rocket01Icon}
              className="size-6 sm:size-7"
              strokeWidth={2}
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome to Coolify Monitor
          </h1>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Connect your first Coolify instance to start tracking deployments,
            databases, services, and server health.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <HugeiconsIcon icon={Sun03Icon} className="size-4" strokeWidth={2} />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label="Toggle dark mode"
            />
            <HugeiconsIcon icon={Moon02Icon} className="size-4" strokeWidth={2} />
            <span className="text-sm text-muted-foreground">Appearance</span>
          </div>
        </div>

        <ConnectionSettings
          instance={getDefaultInstance(undefined, [])}
          mode="splash"
          existingInstances={[]}
          onSave={addInstance}
        />
      </motion.div>
    </div>
  );
};
