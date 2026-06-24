"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  AlertCircleIcon,
  CloudIcon,
  DatabaseIcon,
  Rocket01Icon,
  ServerStack01Icon,
  Settings01Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { InstanceSwitcher } from "@/components/layout/instance-switcher";
import { WindowDragRegion } from "@/components/layout/window-drag-region";
import type { AppView, CoolifyInstance } from "@/lib/coolify/constants";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  id: AppView;
  label: string;
  icon: typeof Activity01Icon;
  badge?: number;
};

type AppSidebarProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  counts: {
    applications: number;
    databases: number;
    services: number;
    servers: number;
    deployments: number;
  };
  instances: CoolifyInstance[];
  activeInstance: CoolifyInstance;
  onSwitchInstance: (instanceId: string) => void;
  onCreateInstance: () => void;
  connectionIssue?: string;
};

export const AppSidebar = ({
  activeView,
  onNavigate,
  counts,
  instances,
  activeInstance,
  onSwitchInstance,
  onCreateInstance,
  connectionIssue,
}: AppSidebarProps) => {
  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: Activity01Icon },
    {
      id: "applications",
      label: "Applications",
      icon: SourceCodeIcon,
      badge: counts.applications,
    },
    {
      id: "databases",
      label: "Databases",
      icon: DatabaseIcon,
      badge: counts.databases,
    },
    {
      id: "services",
      label: "Services",
      icon: ServerStack01Icon,
      badge: counts.services,
    },
    {
      id: "servers",
      label: "Servers",
      icon: CloudIcon,
      badge: counts.servers,
    },
    {
      id: "deployments",
      label: "Deployments",
      icon: Rocket01Icon,
      badge: counts.deployments,
    },
    { id: "settings", label: "Settings", icon: Settings01Icon },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <WindowDragRegion className="h-7 shrink-0" aria-hidden="true" />
      <SidebarHeader className="gap-2 border-b border-border/60 p-2">
        <InstanceSwitcher
          instances={instances}
          activeInstance={activeInstance}
          onSwitch={onSwitchInstance}
          onCreate={onCreateInstance}
        />
        {connectionIssue ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-2.5 py-2 text-warning-foreground group-data-[collapsible=icon]:hidden"
            role="status"
            aria-live="polite"
          >
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="mt-0.5 size-3.5 shrink-0"
              strokeWidth={2}
            />
            <p className="line-clamp-2 text-xs leading-snug">{connectionIssue}</p>
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                    className="transition-all duration-200"
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.label}</span>
                    {item.badge !== undefined ? (
                      <Badge
                        variant="secondary"
                        className="ms-auto group-data-[collapsible=icon]:hidden"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-4 group-data-[collapsible=icon]:hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-3 text-xs text-muted-foreground",
          )}
        >
          Switch between Coolify instances anytime from the header menu.
        </motion.div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
