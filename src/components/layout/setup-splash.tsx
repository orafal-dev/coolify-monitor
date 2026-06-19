"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Rocket01Icon } from "@hugeicons/core-free-icons";
import { ConnectionSettings } from "@/components/settings/connection-settings";
import { Spinner } from "@/components/ui/spinner";
import { getDefaultInstance } from "@/lib/coolify/constants";
import { useApp } from "@/hooks/use-app-context";

export const SetupSplash = () => {
  const { isHydrated, addInstance } = useApp();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500/15 via-background to-cyan-500/10 px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_35%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-xl shadow-violet-500/25">
            <HugeiconsIcon icon={Rocket01Icon} className="size-8" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome to Coolify Monitor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your first Coolify instance to start tracking deployments,
            databases, services, and server health.
          </p>
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
