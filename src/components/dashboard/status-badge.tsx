"use client";

import { Badge } from "@/components/ui/badge";
import {
  getStatusBadgeVariant,
  getStatusDotClass,
  parseCoolifyStatus,
} from "@/lib/coolify/status";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status?: string | null;
  className?: string;
  showDot?: boolean;
};

export const StatusBadge = ({
  status,
  className,
  showDot = true,
}: StatusBadgeProps) => {
  const parsed = parseCoolifyStatus(status);

  return (
    <Badge
      variant={getStatusBadgeVariant(parsed.state)}
      className={cn("gap-1.5 font-medium", className)}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full", getStatusDotClass(parsed.state))}
        />
      ) : null}
      {parsed.label}
    </Badge>
  );
};
