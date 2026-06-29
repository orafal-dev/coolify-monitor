"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon, Rocket01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useAppUpdater } from "@/hooks/use-app-updater";
import { cn } from "@/lib/utils";

export const SidebarUpdatePrompt = () => {
  const {
    isDesktop,
    status,
    pendingUpdate,
    progressPercent,
    installUpdate,
    dismissUpdate,
  } = useAppUpdater();

  if (!isDesktop) {
    return null;
  }

  const isVisible =
    status === "available" ||
    status === "downloading" ||
    status === "installing";

  if (!isVisible) {
    return null;
  }

  const isBusy = status === "downloading" || status === "installing";
  const installLabel = pendingUpdate
    ? `Install version ${pendingUpdate.version}`
    : "Install update now";
  const tooltipLabel = pendingUpdate
    ? `Update to ${pendingUpdate.version}`
    : "Update available";

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 p-3 group-data-[collapsible=icon]:hidden",
        )}
      >
        <div className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={Rocket01Icon}
            className="mt-0.5 size-4 shrink-0 text-primary"
            strokeWidth={2}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">
                {pendingUpdate
                  ? `Update to ${pendingUpdate.version}`
                  : "Update available"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isBusy
                  ? `Installing… ${progressPercent}%`
                  : "A new version is ready to install."}
              </p>
            </div>

            {status === "downloading" ? (
              <Progress value={progressPercent}>
                <ProgressTrack className="h-1.5">
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              {status === "available" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={dismissUpdate}
                  aria-label="Dismiss update notification"
                >
                  Later
                </Button>
              ) : null}
              <Button
                type="button"
                size="xs"
                onClick={() => void installUpdate()}
                disabled={isBusy}
                aria-label={installLabel}
              >
                {isBusy ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <HugeiconsIcon
                    icon={Download04Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                )}
                {pendingUpdate ? `Install ${pendingUpdate.version}` : "Install"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={
              isBusy
                ? `Installing update… ${progressPercent}%`
                : tooltipLabel
            }
            onClick={() => void installUpdate()}
            disabled={isBusy}
            aria-label={installLabel}
            className="text-primary"
          >
            {isBusy ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
            )}
            <span>Update</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
};
