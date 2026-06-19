"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Building03Icon,
  CloudIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import {
  getInstanceDisplayLabel,
  normalizeBaseUrl,
  type CoolifyInstance,
} from "@/lib/coolify/constants";
import { cn } from "@/lib/utils";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type InstanceSwitcherProps = {
  instances: CoolifyInstance[];
  activeInstance: CoolifyInstance;
  onSwitch: (instanceId: string) => void;
  onCreate: () => void;
};

const getInstanceIcon = (instance: CoolifyInstance) =>
  instance.instanceType === "cloud" ? CloudIcon : Building03Icon;

const instanceIconAccentClassName =
  "rounded-lg bg-gradient-to-br from-white/25 to-black/5 p-2 text-sidebar-foreground dark:from-white/15 dark:to-black/25";

export const InstanceSwitcher = ({
  instances,
  activeInstance,
  onSwitch,
  onCreate,
}: InstanceSwitcherProps) => {
  const ActiveIcon = getInstanceIcon(activeInstance);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center",
                instanceIconAccentClassName,
              )}
            >
              <HugeiconsIcon icon={ActiveIcon} className="size-4" strokeWidth={2} />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {getInstanceDisplayLabel(activeInstance)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {normalizeBaseUrl(activeInstance.baseUrl)}
              </span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              className="ms-auto size-4 text-muted-foreground"
              strokeWidth={2}
            />
          </MenuTrigger>
          <MenuPopup align="start" side="bottom" className="min-w-64">
            <MenuGroup>
              <MenuGroupLabel>Coolify instances</MenuGroupLabel>
              {instances.map((instance) => {
                const Icon = getInstanceIcon(instance);
                const isActive = instance.id === activeInstance.id;

                return (
                  <MenuItem
                    key={instance.id}
                    onClick={() => onSwitch(instance.id)}
                    className="gap-2"
                  >
                    <HugeiconsIcon icon={Icon} className="size-4" strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {getInstanceDisplayLabel(instance)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {normalizeBaseUrl(instance.baseUrl)}
                      </p>
                    </div>
                    {isActive ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn("size-4 text-success-foreground")}
                        strokeWidth={2}
                      />
                    ) : null}
                  </MenuItem>
                );
              })}
            </MenuGroup>
            <MenuSeparator />
            <MenuItem onClick={onCreate} className="gap-2">
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              Add Coolify instance
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
