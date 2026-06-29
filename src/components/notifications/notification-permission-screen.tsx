"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { supportsNotificationOsSettings } from "@/lib/notifications/os-settings";
import { cn } from "@/lib/utils";

type NotificationPermissionScreenProps = {
  onContinue: () => void;
  isSaving?: boolean;
};

const getPermissionStatusLabel = (
  isChecking: boolean,
  isGranted: boolean,
): string => {
  if (isChecking) {
    return "Checking permission…";
  }

  if (isGranted) {
    return "Notifications enabled";
  }

  return "Permission not granted";
};

export const NotificationPermissionScreen = ({
  onContinue,
  isSaving = false,
}: NotificationPermissionScreenProps) => {
  const { isGranted, isChecking, request, openOsSettings } =
    useNotificationPermission(true);
  const canOpenOsSettings = supportsNotificationOsSettings();

  const handleRequest = (): void => {
    void request();
  };

  const handleOpenSettings = (): void => {
    void openOsSettings();
  };

  const handleContinue = (): void => {
    onContinue();
  };

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
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="border-border/60 bg-card/90 shadow-xl backdrop-blur-sm">
          <CardPanel className="space-y-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
                <HugeiconsIcon
                  icon={Notification01Icon}
                  className="size-7"
                  strokeWidth={2}
                />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Enable notifications
              </h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Coolify Monitor alerts you when apps become unhealthy, deployments
                fail, or servers go offline — even when the app is in the background.
                macOS will show a permission prompt and add this app to System Settings.
              </p>
            </div>

            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm",
                isGranted
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-border/60 bg-muted/30 text-muted-foreground",
              )}
              role="status"
              aria-live="polite"
            >
              {isChecking ? <Spinner className="size-4" /> : null}
              <span>{getPermissionStatusLabel(isChecking, isGranted)}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleRequest}
                disabled={isGranted || isChecking}
                aria-label="Allow notifications"
              >
                Allow notifications
              </Button>

              {canOpenOsSettings ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenSettings}
                  aria-label="Open notification settings"
                >
                  Open notification settings
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Open your system notification settings manually if the prompt does
                  not appear.
                </p>
              )}

              <Button
                type="button"
                onClick={handleContinue}
                disabled={!isGranted || isSaving}
                className="border-transparent bg-emerald-600 text-white shadow-none hover:border-transparent hover:bg-emerald-600/90 disabled:border-transparent"
                aria-label="Continue to Coolify Monitor"
              >
                {isSaving ? <Spinner className="size-4" /> : null}
                Continue
              </Button>
            </div>
          </CardPanel>
        </Card>
      </motion.div>
    </div>
  );
};
