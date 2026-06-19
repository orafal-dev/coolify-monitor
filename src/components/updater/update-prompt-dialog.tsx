"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAppUpdater } from "@/hooks/use-app-updater";

export const UpdatePromptDialog = () => {
  const {
    isDesktop,
    status,
    pendingUpdate,
    progressPercent,
    installUpdate,
    dismissUpdate,
  } = useAppUpdater();

  const isOpen =
    isDesktop &&
    (status === "available" ||
      status === "downloading" ||
      status === "installing");

  if (!isDesktop) {
    return null;
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && status === "available") {
          dismissUpdate();
        }
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pendingUpdate
              ? `Update to ${pendingUpdate.version}`
              : "Update available"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {status === "downloading" || status === "installing"
              ? `Downloading and installing… ${progressPercent}%`
              : pendingUpdate?.body ||
                "A new version of Coolify Monitor is ready to install."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {status === "available" ? (
            <AlertDialogClose
              render={<Button type="button" variant="outline" />}
              onClick={dismissUpdate}
            >
              Later
            </AlertDialogClose>
          ) : null}
          <Button
            type="button"
            onClick={() => void installUpdate()}
            disabled={status === "downloading" || status === "installing"}
            aria-label="Install update now"
          >
            {status === "downloading" || status === "installing" ? (
              <Spinner className="size-4" />
            ) : null}
            Install now
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
