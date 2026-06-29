import type { ParsedStatus } from "@/lib/coolify/types";

const STATUS_LABELS: Record<ParsedStatus["state"], string> = {
  healthy: "Healthy",
  running: "Running",
  warning: "Warning",
  error: "Error",
  stopped: "Stopped",
  unknown: "Unknown",
};

export const parseCoolifyStatus = (status?: string | null): ParsedStatus => {
  const raw = status?.trim() || "unknown";
  const normalized = raw.toLowerCase();

  if (normalized === "queued") {
    return { state: "warning", label: "Queued", raw };
  }

  if (normalized === "in_progress" || normalized.includes("in_progress")) {
    return { state: "warning", label: "In progress", raw };
  }

  if (normalized === "finished") {
    return { state: "healthy", label: "Finished", raw };
  }

  if (normalized.includes("cancelled")) {
    return { state: "stopped", label: "Cancelled", raw };
  }

  if (normalized.includes("healthy")) {
    return { state: "healthy", label: STATUS_LABELS.healthy, raw };
  }

  if (
    normalized.includes("unhealthy") ||
    normalized.includes("failed") ||
    normalized.includes("error") ||
    normalized.includes("exited")
  ) {
    return { state: "error", label: STATUS_LABELS.error, raw };
  }

  if (
    normalized.includes("starting") ||
    normalized.includes("building") ||
    normalized.includes("deploying") ||
    normalized.includes("restarting")
  ) {
    return { state: "warning", label: STATUS_LABELS.warning, raw };
  }

  if (
    normalized.includes("stopped") ||
    normalized.includes("inactive") ||
    normalized.includes("paused")
  ) {
    return { state: "stopped", label: STATUS_LABELS.stopped, raw };
  }

  if (normalized.includes("running")) {
    return { state: "running", label: STATUS_LABELS.running, raw };
  }

  return { state: "unknown", label: STATUS_LABELS.unknown, raw };
};

export const isRunningStatus = (status?: string | null): boolean => {
  const parsed = parseCoolifyStatus(status);
  const normalized = parsed.raw.toLowerCase();

  if (parsed.state === "stopped" || parsed.state === "unknown") {
    return false;
  }

  if (normalized.includes("exited")) {
    return false;
  }

  if (parsed.state === "error") {
    return normalized.includes("unhealthy") || normalized.includes("running");
  }

  return (
    parsed.state === "healthy" ||
    parsed.state === "running" ||
    parsed.state === "warning"
  );
};

export const countRunning = (
  items: Array<{ status?: string | null }>,
): number => items.filter((item) => isRunningStatus(item.status)).length;

export const getStatusBadgeVariant = (
  state: ParsedStatus["state"],
): "success" | "info" | "warning" | "error" | "secondary" | "outline" => {
  switch (state) {
    case "healthy":
      return "success";
    case "running":
      return "info";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "stopped":
      return "secondary";
    default:
      return "outline";
  }
};

export const getStatusDotClass = (state: ParsedStatus["state"]): string => {
  switch (state) {
    case "healthy":
      return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.65)]";
    case "running":
      return "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.65)]";
    case "warning":
      return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.65)] animate-pulse";
    case "error":
      return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.65)]";
    case "stopped":
      return "bg-zinc-400 dark:bg-zinc-600";
    default:
      return "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.55)]";
  }
};

const STATUS_SEVERITY: Record<ParsedStatus["state"], number> = {
  error: 0,
  warning: 1,
  stopped: 2,
  unknown: 3,
  running: 4,
  healthy: 5,
};

export const getStatusSeverity = (status?: string | null): number => {
  const state = parseCoolifyStatus(status).state;
  return STATUS_SEVERITY[state];
};

export const getWorstStatus = (
  statuses: Array<string | null | undefined>,
): ParsedStatus["state"] => {
  if (!statuses.length) {
    return "unknown";
  }

  let worst: ParsedStatus["state"] = "healthy";
  let worstSeverity = STATUS_SEVERITY.healthy;

  for (const status of statuses) {
    const parsed = parseCoolifyStatus(status);
    const severity = STATUS_SEVERITY[parsed.state];
    if (severity < worstSeverity) {
      worstSeverity = severity;
      worst = parsed.state;
    }
  }

  return worst;
};

export const formatRelativeTimeFromMs = (timestampMs?: number | null): string => {
  if (!timestampMs) {
    return "—";
  }

  const diffMs = Date.now() - timestampMs;
  if (diffMs < 0) {
    return "just now";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 10) {
    return "just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const formatRelativeTime = (value?: string | null): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};
