"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download04Icon,
  RefreshIcon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardPanel, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useAppUpdater } from "@/hooks/use-app-updater";

export const AppUpdateSettings = () => {
  const {
    isDesktop,
    status,
    currentVersion,
    pendingUpdate,
    progressPercent,
    errorMessage,
    checkForUpdates,
    installUpdate,
  } = useAppUpdater();

  if (!isDesktop) {
    return null;
  }

  const isBusy =
    status === "checking" ||
    status === "downloading" ||
    status === "installing";

  const statusMessage = (() => {
    switch (status) {
      case "checking":
        return "Checking for updates…";
      case "available":
        return pendingUpdate
          ? `Version ${pendingUpdate.version} is available.`
          : "An update is available.";
      case "downloading":
        return "Downloading update…";
      case "installing":
        return "Installing update. The app will restart shortly.";
      case "up-to-date":
        return "You are on the latest version.";
      case "error":
        return errorMessage ?? "Update check failed.";
      default:
        return "Check GitHub Releases for new desktop builds.";
    }
  })();

  return (
    <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>App updates</CardTitle>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <HugeiconsIcon
            icon={Rocket01Icon}
            className="mt-0.5 size-5 shrink-0 text-violet-500"
            strokeWidth={2}
          />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">Coolify Monitor {currentVersion || "…"}</p>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
            {pendingUpdate?.body ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {pendingUpdate.body}
              </p>
            ) : null}
          </div>
        </div>

        {status === "downloading" ? (
          <Progress value={progressPercent}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Download progress</span>
              <span className="text-sm tabular-nums">{progressPercent}%</span>
            </div>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ) : null}

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => void checkForUpdates()}
            disabled={isBusy}
            aria-label="Check for app updates"
          >
            {status === "checking" ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
            )}
            Check for updates
          </Button>

          {status === "available" && pendingUpdate ? (
            <Button
              type="button"
              onClick={() => void installUpdate()}
              disabled={isBusy}
              aria-label={`Install version ${pendingUpdate.version}`}
            >
              <HugeiconsIcon icon={Download04Icon} className="size-4" strokeWidth={2} />
              Install {pendingUpdate.version}
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Updates are delivered from{" "}
          <a
            href="https://github.com/orafal-dev/coolify-monitor/releases"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            GitHub Releases
          </a>{" "}
          and verified with a Tauri signature before installation.
        </p>
      </CardPanel>
    </Card>
  );
};
