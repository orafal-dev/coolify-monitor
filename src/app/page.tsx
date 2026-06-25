"use client";

import { AppShell } from "@/components/layout/app-shell";
import { NotificationPermissionGate } from "@/components/notifications/notification-permission-gate";

const HomePage = () => (
  <NotificationPermissionGate>
    <AppShell />
  </NotificationPermissionGate>
);

export default HomePage;
