import type { AppView } from "@/lib/coolify/constants";

export type CommandGroupId = "navigate" | "instances" | "resources" | "actions";

export type PaletteCommand = {
  id: string;
  label: string;
  group: CommandGroupId;
  keywords?: string;
  shortcut?: string;
  onSelect: () => void;
};

export const COMMAND_GROUP_LABELS: Record<CommandGroupId, string> = {
  navigate: "Navigate",
  instances: "Instances",
  resources: "Resources",
  actions: "Actions",
};

export const NAVIGATION_COMMANDS: { view: AppView; label: string }[] = [
  { view: "overview", label: "Overview" },
  { view: "projects", label: "Projects" },
  { view: "applications", label: "Applications" },
  { view: "databases", label: "Databases" },
  { view: "services", label: "Services" },
  { view: "servers", label: "Servers" },
  { view: "deployments", label: "Deployments" },
  { view: "settings", label: "Settings" },
];
