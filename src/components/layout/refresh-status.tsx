"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { cn } from "@/lib/utils";

type RefreshStatusProps = {
  dataUpdatedAt?: number;
  isLoading: boolean;
  isFetching: boolean;
  isStale: boolean;
};

export const RefreshStatus = ({
  dataUpdatedAt,
  isLoading,
  isFetching,
  isStale,
}: RefreshStatusProps) => {
  const relativeTime = useRelativeTime(dataUpdatedAt);

  if (isLoading && !dataUpdatedAt) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      {isStale ? (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/8 px-2 py-1 text-xs text-warning-foreground",
          )}
          role="status"
          aria-live="polite"
        >
          <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5" strokeWidth={2} />
          <span>Showing cached data · refresh failed</span>
        </div>
      ) : null}
      <p
        className="text-xs text-muted-foreground"
        aria-live="polite"
        aria-label={`Data updated ${relativeTime}`}
      >
        Updated {relativeTime}
        {isFetching ? " · refreshing…" : ""}
      </p>
    </div>
  );
};
