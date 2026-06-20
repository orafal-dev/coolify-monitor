"use client";

import type { MouseEvent } from "react";
import { isTauriRuntime } from "@/lib/updater/runtime";

export const openExternalUrl = async (url: string): Promise<void> => {
  if (isTauriRuntime()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};

export const handleExternalLinkClick = (
  event: MouseEvent<HTMLAnchorElement>,
): void => {
  event.preventDefault();
  const url = event.currentTarget.href;
  if (!url) {
    return;
  }

  void openExternalUrl(url);
};
