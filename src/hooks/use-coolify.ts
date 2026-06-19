"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOverview, validateConnection } from "@/lib/coolify/client";
import type { CoolifyInstance } from "@/lib/coolify/constants";

export const coolifyQueryKeys = {
  overview: (instance: CoolifyInstance) =>
    [
      "coolify-overview",
      instance.id,
      instance.baseUrl,
      instance.apiToken.slice(0, 8),
    ] as const,
  validate: (instance: CoolifyInstance) =>
    [
      "coolify-validate",
      instance.id,
      instance.baseUrl,
      instance.apiToken.slice(0, 8),
    ] as const,
};

export const useCoolifyOverview = (
  instance: CoolifyInstance | null,
  enabled: boolean,
) =>
  useQuery({
    queryKey: instance
      ? coolifyQueryKeys.overview(instance)
      : ["coolify-overview", "none"],
    queryFn: () => fetchOverview(instance!),
    enabled: enabled && Boolean(instance?.apiToken.trim()),
    refetchInterval: enabled && instance
      ? instance.refreshIntervalSeconds * 1000
      : false,
    staleTime: 10_000,
    retry: 1,
  });

export const useValidateConnection = (
  instance: CoolifyInstance,
  enabled: boolean,
) =>
  useQuery({
    queryKey: coolifyQueryKeys.validate(instance),
    queryFn: () => validateConnection(instance),
    enabled,
    retry: false,
    staleTime: 0,
  });
