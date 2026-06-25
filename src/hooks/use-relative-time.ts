"use client";

import { useEffect, useState } from "react";
import { formatRelativeTimeFromMs } from "@/lib/coolify/status";

export const useRelativeTime = (timestampMs?: number | null): string => {
  const [label, setLabel] = useState(() => formatRelativeTimeFromMs(timestampMs));

  useEffect(() => {
    setLabel(formatRelativeTimeFromMs(timestampMs));

    if (!timestampMs) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLabel(formatRelativeTimeFromMs(timestampMs));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timestampMs]);

  return label;
};
