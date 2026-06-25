"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AppProvider } from "@/hooks/use-app-context";
import { AppUpdaterProvider } from "@/hooks/use-app-updater";
import { UpdatePromptDialog } from "@/components/updater/update-prompt-dialog";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StatusNotificationWatcher } from "@/components/notifications/status-notification-watcher";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={200}>
          <AppUpdaterProvider>
            <AppProvider>
              {children}
              <StatusNotificationWatcher />
              <UpdatePromptDialog />
            </AppProvider>
          </AppUpdaterProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
