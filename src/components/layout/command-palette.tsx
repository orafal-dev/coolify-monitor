"use client";

import { useMemo, useState } from "react";
import {
  COMMAND_GROUP_LABELS,
  NAVIGATION_COMMANDS,
  type CommandGroupId,
  type PaletteCommand,
} from "@/components/layout/command-palette.types";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import type { AppView, CoolifyInstance } from "@/lib/coolify/constants";
import { getInstanceDisplayLabel } from "@/lib/coolify/constants";
import type { CoolifyOverview } from "@/lib/coolify/types";
import { parseCoolifyStatus } from "@/lib/coolify/status";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview?: CoolifyOverview;
  instances: CoolifyInstance[];
  activeInstance: CoolifyInstance;
  onNavigate: (view: AppView) => void;
  onSwitchInstance: (instanceId: string) => void;
  onRefresh: () => void;
};

const GROUP_ORDER: CommandGroupId[] = [
  "navigate",
  "instances",
  "resources",
  "actions",
];

export const CommandPalette = ({
  open,
  onOpenChange,
  overview,
  instances,
  activeInstance,
  onNavigate,
  onSwitchInstance,
  onRefresh,
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("");

  const commands = useMemo(() => {
    const nextCommands: PaletteCommand[] = [];

    const register = (
      command: Omit<PaletteCommand, "onSelect">,
      handler: () => void,
    ) => {
      nextCommands.push({ ...command, onSelect: handler });
    };

    for (const item of NAVIGATION_COMMANDS) {
      register(
        {
          id: `nav-${item.view}`,
          label: item.label,
          group: "navigate",
          keywords: item.view,
        },
        () => onNavigate(item.view),
      );
    }

    for (const instance of instances) {
      register(
        {
          id: `instance-${instance.id}`,
          label: getInstanceDisplayLabel(instance),
          group: "instances",
          keywords: `${instance.instanceType} ${instance.baseUrl}`,
        },
        () => onSwitchInstance(instance.id),
      );
    }

    for (const app of overview?.applications ?? []) {
      const status = parseCoolifyStatus(app.status).label;
      register(
        {
          id: `resource-app-${app.uuid}`,
          label: app.name,
          group: "resources",
          keywords: `application app ${status} ${app.environment_name ?? ""}`,
        },
        () => onNavigate("applications"),
      );
    }

    for (const database of overview?.databases ?? []) {
      const status = parseCoolifyStatus(database.status).label;
      register(
        {
          id: `resource-db-${database.uuid}`,
          label: database.name,
          group: "resources",
          keywords: `database db ${database.type} ${status}`,
        },
        () => onNavigate("databases"),
      );
    }

    for (const service of overview?.services ?? []) {
      const status = parseCoolifyStatus(service.status).label;
      register(
        {
          id: `resource-service-${service.uuid}`,
          label: service.name,
          group: "resources",
          keywords: `service ${status}`,
        },
        () => onNavigate("services"),
      );
    }

    for (const server of overview?.servers ?? []) {
      register(
        {
          id: `resource-server-${server.uuid}`,
          label: server.name,
          group: "resources",
          keywords: `server ${server.ip} ${server.is_reachable ? "reachable" : "unreachable"}`,
        },
        () => onNavigate("servers"),
      );
    }

    for (const deployment of overview?.deployments ?? []) {
      register(
        {
          id: `resource-deployment-${deployment.uuid}`,
          label:
            deployment.application_name ??
            deployment.application_uuid ??
            deployment.uuid,
          group: "resources",
          keywords: `deployment ${deployment.status}`,
        },
        () => onNavigate("deployments"),
      );
    }

    register(
      {
        id: "action-refresh",
        label: "Refresh data",
        group: "actions",
        keywords: "reload sync update",
        shortcut: "R",
      },
      () => onRefresh(),
    );

    return nextCommands;
  }, [
    instances,
    onNavigate,
    onRefresh,
    onSwitchInstance,
    overview?.applications,
    overview?.databases,
    overview?.deployments,
    overview?.servers,
    overview?.services,
  ]);

  const groupedCommands = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        items: commands.filter((command) => command.group === group),
      })).filter((entry) => entry.items.length > 0),
    [commands],
  );

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) {
      setQuery("");
    }

    onOpenChange(nextOpen);
  };

  const handleSelect = (command: PaletteCommand): void => {
    command.onSelect();
    handleOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandDialogPopup>
        <Command
          items={commands}
          inline
          open
          autoHighlight="always"
          value={query}
          onValueChange={setQuery}
          itemToStringValue={(command) => {
            const item = command as PaletteCommand;
            return `${item.label} ${item.keywords ?? ""} ${item.group}`;
          }}
        >
          <CommandInput placeholder="Search views, instances, resources…" />
          <CommandPanel>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {groupedCommands.map(({ group, items }) => (
                <CommandGroup key={group} items={items}>
                  <CommandGroupLabel>{COMMAND_GROUP_LABELS[group]}</CommandGroupLabel>
                  <CommandCollection>
                    {(command: PaletteCommand) => (
                      <CommandItem
                        key={command.id}
                        value={command}
                        onClick={() => handleSelect(command)}
                      >
                        <span className="truncate">{command.label}</span>
                        {command.id === `instance-${activeInstance.id}` ? (
                          <CommandShortcut>Active</CommandShortcut>
                        ) : null}
                        {command.shortcut ? (
                          <CommandShortcut>{command.shortcut}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    )}
                  </CommandCollection>
                </CommandGroup>
              ))}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <span>↑↓ navigate · ↵ select · esc close</span>
            <Kbd>⌘K</Kbd>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
};
